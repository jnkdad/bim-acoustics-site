// /api/lucius-web-chat/index.js
// Azure Functions (Node) endpoint for Lucius website chat.
// - Reads the two engineering MD docs from /docs/lucius/
// - Calls OpenAI Responses API
// - Returns a single text reply for the website widget

const fs = require("fs");
const path = require("path");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-5.2"; // safe default per OpenAI quickstart
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com";

let _cachedDocs = null;
let _cachedDocsMtimeKey = null;

function tryReadFileUtf8(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function getRepoRoot() {
  // This function runs at: /api/lucius-web-chat/index.js
  // Repo root is two levels up from /api/lucius-web-chat
  return path.resolve(__dirname, "..", "..");
}

function loadLuciusDocs() {
  const repoRoot = getRepoRoot();
  const docsDir = path.join(repoRoot, "docs", "lucius");

  const engineeringModelPath = path.join(docsDir, "System_Designer_Engineering_Model.md");
  const responsesPath = path.join(docsDir, "Lucius_Website_Engineering_Responses.md");

  // Create a simple cache key based on mtimes so we can hot-update without redeploying
  const parts = [];
  for (const p of [engineeringModelPath, responsesPath]) {
    try {
      const stat = fs.statSync(p);
      parts.push(`${p}:${stat.mtimeMs}`);
    } catch {
      parts.push(`${p}:missing`);
    }
  }
  const mtimeKey = parts.join("|");

  if (_cachedDocs && _cachedDocsMtimeKey === mtimeKey) return _cachedDocs;

  const engineeringModel = tryReadFileUtf8(engineeringModelPath);
  const engineeringResponses = tryReadFileUtf8(responsesPath);

  _cachedDocs = {
    docsDir,
    engineeringModelPath,
    responsesPath,
    engineeringModel,
    engineeringResponses,
  };
  _cachedDocsMtimeKey = mtimeKey;

  return _cachedDocs;
}

function parseUserMessage(req) {
  // Support a few common payload shapes from chat widgets.
  // Prefer: req.body.message (string)
  // Also accept: req.body.input, req.body.text
  // Also accept: req.body.messages (array) and take the last user content
  const body = req.body || {};

  if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  if (typeof body.input === "string" && body.input.trim()) return body.input.trim();
  if (typeof body.text === "string" && body.text.trim()) return body.text.trim();

  if (Array.isArray(body.messages) && body.messages.length) {
    // Try to find the last user-ish message
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i];
      const role = (m && m.role) ? String(m.role).toLowerCase() : "";
      const content = m && (m.content ?? m.text ?? m.message);
      if ((role === "user" || role === "human" || role === "") && typeof content === "string" && content.trim()) {
        return content.trim();
      }
    }
  }

  // Fall back to raw body if it is a string
  if (typeof body === "string" && body.trim()) return body.trim();

  return "";
}

function buildDeveloperInstructions(docs) {
  // This is the “Lucius brain contract” for the website.
  // Keep it stable and grounded; the docs provide the technical substance.
  const hardRules = `
You are Lucius, the technically credible engineering explainer for the BIM Acoustics website.

Identity / facts:
- Company: BIM Acoustics (J. Stevens BIM Acoustics)
- Founder: Jerrold Stevens
- Canonical product name: "AVToolsSystemDesigner add-in for Revit (Distributed Systems)"
  - After first use, you may shorten to "System Designer".

Tone rules:
- Professional, informative, confident.
- Do NOT be evasive. If something is unknown or out of scope, say so plainly and suggest the right next step.
- Do NOT be salesy. Do not push early access unless the user asks how to buy/try/get access.

Technical truth rules:
- Be transparent about assumptions and limits.
- Do NOT claim acoustic simulation (no SPL maps/STI/EASE prediction).
- v1 includes geometric layout + spacing + tap recommendation based on target SPL.
- Pro roadmap may include amplifier loading, circuiting, and line-loss modeling, but do NOT imply those exist today.

Answer behavior:
- When asked “what formula,” provide the canonical form(s) shown in the engineering docs (symbolic form is OK).
- Prefer concise answers (1–6 short paragraphs). Use bullets when it improves clarity.
- If user says “This is Jerrold”, respond: "If you’re Jerrold Stevens (founder of BIM Acoustics), welcome back — how can I help?"
`.trim();

  const engineeringModel = docs.engineeringModel || "(Engineering model document not found on server.)";
  const engineeringResponses = docs.engineeringResponses || "(Engineering responses document not found on server.)";

  // Provide the documents as reference context. The model should follow them.
  return `
${hardRules}

REFERENCE DOCUMENT 1 — System Designer Engineering Model:
---
${engineeringModel}
---

REFERENCE DOCUMENT 2 — Lucius Website Engineering Responses:
---
${engineeringResponses}
---
`.trim();
}

async function callOpenAI({ developerText, userText }) {
  if (!OPENAI_API_KEY) {
    const e = new Error("Missing OPENAI_API_KEY environment variable.");
    e.code = "NO_API_KEY";
    throw e;
  }

  const url = `${OPENAI_API_BASE.replace(/\/+$/, "")}/v1/responses`;

  const payload = {
    model: OPENAI_MODEL,
    // Keep cost controlled; you can adjust later via env.
    reasoning: { effort: "low" },
    input: [
      { role: "developer", content: developerText },
      { role: "user", content: userText },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    const msg =
      (data && data.error && data.error.message) ||
      `OpenAI API error (${resp.status})`;
    const err = new Error(msg);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  // Responses API returns a convenience field `output_text` in many SDK examples.
  // If not present, fall back to digging through output.
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  // Fallback extraction (best-effort)
  try {
    const out = data.output || [];
    for (const item of out) {
      // Look for message-like content blocks
      if (item && item.type === "message" && Array.isArray(item.content)) {
        const textParts = item.content
          .filter((c) => c && (c.type === "output_text" || c.type === "text") && typeof c.text === "string")
          .map((c) => c.text);
        if (textParts.length) return textParts.join("\n").trim();
      }
    }
  } catch {
    // ignore
  }

  // Last resort
  return "I’m here, but I couldn’t parse the model output. Please try again.";
}

module.exports = async function (context, req) {
  // Basic CORS (adjust allowed origin if you want to lock it down)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Preflight
  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  // Simple health check support (optional)
  if (req.method === "GET") {
    context.res = { status: 200, headers: corsHeaders, body: { ok: true, service: "lucius-web-chat" } };
    return;
  }
function logTranscriptEvent(context, payload) {
  try {
    // Truncate to avoid App Insights size/serialization issues
    const safePayload = {
      ts: payload.ts,
      sessionId: payload.sessionId,
      page: payload.page,
      model: payload.model,
      user: typeof payload.user === "string" ? payload.user.slice(0, 2000) : null,
      lucius: typeof payload.lucius === "string" ? payload.lucius.slice(0, 4000) : null
    };

    context.log("LUCIUS_TRANSCRIPT " + JSON.stringify(safePayload));
  } catch (e) {
    // NEVER allow logging to break chat
    context.log.warn("Lucius transcript logging failed:", e && e.message);
  }
}


  try {
    const userText = parseUserMessage(req);

    if (!userText) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { ok: false, error: "Missing user message. Send { message: \"...\" }." },
      };
      return;
    }

    const docs = loadLuciusDocs();
    const developerText = buildDeveloperInstructions(docs);

    const reply = await callOpenAI({ developerText, userText });

    context.res = {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: {
        ok: true,
        reply,
        model: OPENAI_MODEL,
      },
    };
  } catch (err) {
    const status = err && err.code === "NO_API_KEY" ? 500 : (err.status || 500);

    context.log.error("Lucius error:", err);

    context.res = {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: {
        ok: false,
        error: err.message || "Unknown error",
      },
    };
  }
};
