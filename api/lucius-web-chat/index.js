// /api/lucius-web-chat/index.js
// Robust Lucius website chat handler:
// - Loads engineering docs from /docs/lucius by searching filenames (no brittle exact names)
// - Falls back to env vars LUCIUS_SYSTEM_PROMPT and LUCIUS_KB if present
// - Calls OpenAI Responses API
// - Returns { ok:true, reply } for the widget

const fs = require("fs");
const path = require("path");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com";

// Optional Azure SWA env vars you already have:
const ENV_SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const ENV_KB = process.env.LUCIUS_KB || "";

// Cache docs across warm invocations
let _cached = null;
let _cachedKey = null;

function getRepoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function safeReadUtf8(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function listFiles(dir) {
  try {
    return fs.readdirSync(dir).map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

function findDocByKeywords(docsDir, keywords) {
  // keywords: array of strings; all must be present (case-insensitive)
  const files = listFiles(docsDir);
  const mdFiles = files.filter((f) => f.toLowerCase().endsWith(".md"));

  const hit = mdFiles.find((f) => {
    const name = path.basename(f).toLowerCase();
    return keywords.every((k) => name.includes(k.toLowerCase()));
  });

  return hit || null;
}

function loadLuciusDocs() {
  const repoRoot = getRepoRoot();
  const docsDir = path.join(repoRoot, "docs", "lucius");

  // Find docs even if the filenames differ from what we expect
  const engineeringModelPath =
    findDocByKeywords(docsDir, ["system", "designer", "engineering"]) ||
    findDocByKeywords(docsDir, ["engineering", "model"]) ||
    null;

  const engineeringResponsesPath =
    findDocByKeywords(docsDir, ["lucius", "engineering", "response"]) ||
    findDocByKeywords(docsDir, ["engineering", "response"]) ||
    null;

  const statsKeyParts = [];
  for (const p of [engineeringModelPath, engineeringResponsesPath]) {
    if (!p) {
      statsKeyParts.push("missing");
      continue;
    }
    try {
      const st = fs.statSync(p);
      statsKeyParts.push(`${p}:${st.mtimeMs}`);
    } catch {
      statsKeyParts.push(`${p}:unstat`);
    }
  }
  const key = statsKeyParts.join("|");

  if (_cached && _cachedKey === key) return _cached;

  const engineeringModel = engineeringModelPath ? safeReadUtf8(engineeringModelPath) : null;
  const engineeringResponses = engineeringResponsesPath ? safeReadUtf8(engineeringResponsesPath) : null;

  _cached = {
    docsDir,
    engineeringModelPath,
    engineeringResponsesPath,
    engineeringModel,
    engineeringResponses,
  };
  _cachedKey = key;

  return _cached;
}

function parseUserMessage(req) {
  const body = req.body || {};
  if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  if (typeof body.input === "string" && body.input.trim()) return body.input.trim();
  if (typeof body.text === "string" && body.text.trim()) return body.text.trim();

  if (Array.isArray(body.messages) && body.messages.length) {
    for (let i = body.messages.length - 1; i >= 0; i--) {
      const m = body.messages[i];
      const role = (m && m.role) ? String(m.role).toLowerCase() : "";
      const content = m && (m.content ?? m.text ?? m.message);
      if ((role === "user" || role === "human" || role === "") && typeof content === "string" && content.trim()) {
        return content.trim();
      }
    }
  }
  if (typeof body === "string" && body.trim()) return body.trim();
  return "";
}

function buildDeveloperInstructions(docs) {
  // Hard rules: identity, product naming, tone, and no evasive language.
  // This is intentionally explicit to prevent the “I can’t provide…” failure mode.
  const hardRules = `
You are Lucius, the technically credible engineering explainer for the BIM Acoustics website.

Hard facts you MUST state correctly:
- Company: BIM Acoustics (J. Stevens BIM Acoustics)
- Founder: Jerrold Stevens
- Canonical product name: "AVToolsSystemDesigner add-in for Revit (Distributed Systems)"
  After first use, you may shorten to "System Designer".

Identity handling (MUST follow exactly):
- If the user says: "This is Jerrold"
  Reply with: "If you’re Jerrold Stevens (founder of BIM Acoustics), welcome back — how can I help?"

Tone rules:
- Professional, informative, confident.
- Do NOT be evasive.
- Do NOT say “I can’t provide that” when the information exists in the provided references.
- Do NOT be salesy. Do not push early access unless the user asks how to buy/try/get access.

Technical truth rules:
- Be transparent about assumptions and limits.
- Do NOT claim acoustic simulation (no SPL maps/STI/EASE prediction).
- Current v1 includes geometric layout + spacing + tap recommendation based on target SPL (design assist).
- Pro roadmap may include amplifier loading, circuiting, and line-loss modeling; do NOT imply those exist today.

Answer behavior:
- When asked “what formula,” provide the canonical form(s) shown in the references (symbolic form is OK).
- Keep answers concise: 1–6 short paragraphs; bullets are fine.
`.trim();

  // Prefer filesystem docs; fall back to env var KB/prompt if needed.
  const engineeringModel =
    docs.engineeringModel ||
    ENV_KB ||
    "(No engineering model text found. Ensure /docs/lucius/*.md is deployed.)";

  const engineeringResponses =
    docs.engineeringResponses ||
    ENV_SYSTEM_PROMPT ||
    "(No engineering responses text found. Ensure /docs/lucius/*.md is deployed.)";

  return `
${hardRules}

REFERENCE — System Designer Engineering Model:
---
${engineeringModel}
---

REFERENCE — Lucius Website Engineering Responses:
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
    reasoning: { effort: "low" },
    input: [
      { role: "developer", content: developerText },
      { role: "user", content: userText },
    ],
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = (data && data.error && data.error.message) || `OpenAI API error (${resp.status})`;
    const err = new Error(msg);
    err.status = resp.status;
    err.details = data;
    throw err;
  }

  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  // best-effort fallback
  try {
    const out = data.output || [];
    for (const item of out) {
      if (item && item.type === "message" && Array.isArray(item.content)) {
        const textParts = item.content
          .filter((c) => c && (c.type === "output_text" || c.type === "text") && typeof c.text === "string")
          .map((c) => c.text);
        if (textParts.length) return textParts.join("\n").trim();
      }
    }
  } catch {}
  return "I’m here, but I couldn’t parse the model output. Please try again.";
}

module.exports = async function (context, req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  if (req.method === "GET") {
    // Minimal health check (keeps secrets out)
    const docs = loadLuciusDocs();
    context.res = {
      status: 200,
      headers: corsHeaders,
      body: {
        ok: true,
        service: "lucius-web-chat",
        model: OPENAI_MODEL,
        docsFound: {
          engineeringModel: !!docs.engineeringModel,
          engineeringResponses: !!docs.engineeringResponses,
        },
        docPaths: {
          engineeringModelPath: docs.engineeringModelPath ? path.basename(docs.engineeringModelPath) : null,
          engineeringResponsesPath: docs.engineeringResponsesPath ? path.basename(docs.engineeringResponsesPath) : null,
        },
      },
    };
    return;
  }

  try {
    const userText = parseUserMessage(req);
    if (!userText) {
      context.res = { status: 400, headers: corsHeaders, body: { ok: false, error: 'Missing message. Send { "message": "..." }' } };
      return;
    }

    const docs = loadLuciusDocs();
    const developerText = buildDeveloperInstructions(docs);
    const reply = await callOpenAI({ developerText, userText });

    context.res = {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: { ok: true, reply },
    };
  } catch (err) {
    context.log.error("Lucius error:", err);
    const status = err && err.code === "NO_API_KEY" ? 500 : (err.status || 500);
    context.res = {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: { ok: false, error: err.message || "Unknown error" },
    };
  }
};
