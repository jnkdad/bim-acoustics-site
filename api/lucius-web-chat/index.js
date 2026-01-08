// /api/lucius-web-chat/index.js
// Lucius website chat handler (Azure Functions, Node)
// - Reads engineering docs from: /docs/lucius (relative to this function folder)
// - Calls OpenAI Responses API using built-in https (no fetch dependency)
// - GET ?debug=1 lists visible files so we can diagnose deployments
// - Optional: logs opted-in transcripts to Application Insights via context.log

const fs = require("fs");
const path = require("path");
const https = require("https");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com";

// Optional fallbacks (you already have these in Azure)
const ENV_SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const ENV_KB = process.env.LUCIUS_KB || "";

// Warm cache
let _cached = null;
let _cachedKey = null;

function safeReadUtf8(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir);
  } catch {
    return null;
  }
}

function listDirFullPaths(dir) {
  const names = listDir(dir);
  if (!names) return [];
  return names.map((n) => path.join(dir, n));
}

function findDocByKeywords(docsDir, keywords) {
  const files = listDirFullPaths(docsDir);
  const mdFiles = files.filter((f) => f.toLowerCase().endsWith(".md"));

  const hit = mdFiles.find((f) => {
    const name = path.basename(f).toLowerCase();
    return keywords.every((k) => name.includes(String(k).toLowerCase()));
  });

  return hit || null;
}

function loadLuciusDocs() {
  // Confirmed deployed path pattern:
  // __dirname = /home/site/wwwroot/lucius-web-chat
  // docs live at /home/site/wwwroot/lucius-web-chat/docs/lucius
  const docsDir = path.join(__dirname, "docs", "lucius");

  const engineeringModelPath =
    findDocByKeywords(docsDir, ["system", "designer", "engineering"]) ||
    findDocByKeywords(docsDir, ["engineering", "model"]) ||
    null;

  const engineeringResponsesPath =
    findDocByKeywords(docsDir, ["lucius", "engineering", "response"]) ||
    findDocByKeywords(docsDir, ["engineering", "response"]) ||
    null;

  // Cache key based on file mtimes (so edits update without cold start)
  const keyParts = [];
  for (const p of [engineeringModelPath, engineeringResponsesPath]) {
    if (!p) {
      keyParts.push("missing");
      continue;
    }
    const st = safeStat(p);
    keyParts.push(st ? `${p}:${st.mtimeMs}` : `${p}:unstat`);
  }
  const key = keyParts.join("|");

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
      const role = m && m.role ? String(m.role).toLowerCase() : "";
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
  const hardRules = [
    "You are Lucius, the technically credible engineering explainer for the BIM Acoustics website.",
    "",
    "Hard facts you MUST state correctly:",
    "- Company: BIM Acoustics (J. Stevens BIM Acoustics)",
    "- Founder: Jerrold Stevens",
    '- Canonical product name: \"AVToolsSystemDesigner add-in for Revit (Distributed Systems)\"',
    '  After first use, you may shorten to \"System Designer\".',
    "",
    "Identity handling (MUST follow exactly):",
    '- If the user says: \"This is Jerrold\"',
    '  Reply with: \"If you’re Jerrold Stevens (founder of BIM Acoustics), welcome back — how can I help?\"',
    "",
    "Tone rules:",
    "- Professional, informative, confident.",
    "- Do NOT be evasive.",
    "- Do NOT say “I can’t provide that” when the information exists in the provided references.",
    "- Do NOT be salesy. Do not push early access unless the user asks how to buy/try/get access.",
    "",
    "Technical truth rules:",
    "- Be transparent about assumptions and limits.",
    "- Do NOT claim acoustic simulation (no SPL maps/STI/EASE prediction).",
    "- Current v1 includes geometric layout + spacing + tap recommendation based on target SPL (design assist).",
    "- Pro roadmap may include amplifier loading, circuiting, and line-loss modeling; do NOT imply those exist today.",
    "",
    "Answer behavior:",
    "- When asked “what formula,” provide the canonical form(s) shown in the references (symbolic form is OK).",
    "- Keep answers concise: 1–6 short paragraphs; bullets are fine.",
  ].join("\n");

  const engineeringModel =
    docs.engineeringModel ||
    ENV_KB ||
    "(No engineering model text found. Ensure api/lucius-web-chat/docs/lucius/*.md is deployed.)";

  const engineeringResponses =
    docs.engineeringResponses ||
    ENV_SYSTEM_PROMPT ||
    "(No engineering responses text found. Ensure api/lucius-web-chat/docs/lucius/*.md is deployed.)";

  return (
    hardRules +
    "\n\nREFERENCE — System Designer Engineering Model:\n---\n" +
    engineeringModel +
    "\n---\n\nREFERENCE — Lucius Website Engineering Responses:\n---\n" +
    engineeringResponses +
    "\n---"
  );
}

function httpsJsonRequest(urlString, method, headers, bodyString) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString);

    const options = {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + (u.search || ""),
      method,
      headers,
    };

    const r = https.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : {};
        } catch {
          json = null;
        }

        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json,
          raw: data,
        });
      });
    });

    r.on("error", reject);
    if (bodyString) r.write(bodyString);
    r.end();
  });
}

function extractOutputText(data) {
  if (!data) return null;

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item && item.type === "message" && Array.isArray(item.content)) {
        const parts = [];
        for (const c of item.content) {
          if (!c) continue;
          if ((c.type === "output_text" || c.type === "text") && typeof c.text === "string") parts.push(c.text);
        }
        if (parts.length) return parts.join("\n").trim();
      }
    }
  }

  try {
    if (Array.isArray(data.output) && data.output[0] && Array.isArray(data.output[0].content)) {
      const parts = data.output[0].content
        .map((c) => (typeof c === "string" ? c : (c && typeof c.text === "string" ? c.text : "")))
        .filter(Boolean);
      if (parts.length) return parts.join("\n").trim();
    }
  } catch {
    // ignore
  }

  return null;
}

async function callOpenAI(developerText, userText) {
  if (!OPENAI_API_KEY) {
    const e = new Error("Missing OPENAI_API_KEY environment variable.");
    e.code = "NO_API_KEY";
    throw e;
  }

  const base = String(OPENAI_API_BASE).replace(/\/+$/, "");
  const url = base + "/v1/responses";

  const payload = {
    model: OPENAI_MODEL,
    input: [
      { role: "developer", content: developerText },
      { role: "user", content: userText },
    ],
  };

  const resp = await httpsJsonRequest(
    url,
    "POST",
    {
      Authorization: "Bearer " + OPENAI_API_KEY,
      "Content-Type": "application/json",
    },
    JSON.stringify(payload)
  );

  if (!resp.ok) {
    const msg =
      (resp.json && resp.json.error && resp.json.error.message) ||
      ("OpenAI API error (" + resp.status + ")");
    const err = new Error(msg);
    err.status = resp.status;
    err.details = resp.json || resp.raw;
    throw err;
  }

  const text = extractOutputText(resp.json);
  if (text) return text;

  throw new Error("OpenAI response received but no output text was found to display.");
}

// ✅ Safe transcript logging: never breaks chat
function logTranscriptEvent(context, payload) {
  try {
    const safePayload = {
      ts: payload.ts,
      sessionId: payload.sessionId,
      page: payload.page,
      model: payload.model,
      user: typeof payload.user === "string" ? payload.user.slice(0, 2000) : null,
      lucius: typeof payload.lucius === "string" ? payload.lucius.slice(0, 4000) : null,
    };
    context.log("LUCIUS_TRANSCRIPT " + JSON.stringify(safePayload));
  } catch (e) {
    // Never fail the function due to analytics
    try {
      context.log.warn("Lucius transcript logging failed:", e && e.message);
    } catch {}
  }
}

module.exports = async function (context, req) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    context.res = { status: 204, headers: corsHeaders };
    return;
  }

  // Debug endpoint
  if (req.method === "GET") {
    const docs = loadLuciusDocs();
    const debug = String((req.query && req.query.debug) || "").trim() === "1";

    if (debug) {
      const docsDirExists = !!safeStat(docs.docsDir);
      const docsDirListing = listDir(docs.docsDir);

      context.res = {
        status: 200,
        headers: corsHeaders,
        body: {
          ok: true,
          service: "lucius-web-chat",
          model: OPENAI_MODEL,
          __dirname,
          docsDir: docs.docsDir,
          docsDirExists,
          docsDirListing,
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
      },
    };
    return;
  }

  try {
    const userText = parseUserMessage(req);
    if (!userText) {
      context.res = {
        status: 400,
        headers: corsHeaders,
        body: { ok: false, error: 'Missing message. Send { "message": "..." }' },
      };
      return;
    }

    const docs = loadLuciusDocs();
    const developerText = buildDeveloperInstructions(docs);

    const reply = await callOpenAI(developerText, userText);

    // Return response first (fast path)
    context.res = {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: { ok: true, reply },
    };

    // Transcript logging (best-effort; never throws)
    const consentToLog = !!(req.body && req.body.consentToLog);
    const sessionId = req.body && req.body.sessionId ? String(req.body.sessionId) : null;

    if (consentToLog && reply) {
      logTranscriptEvent(context, {
        ts: new Date().toISOString(),
        sessionId,
        page: req.headers ? (req.headers.referer || req.headers.referrer || null) : null,
        user: userText,
        lucius: reply,
        model: OPENAI_MODEL,
      });
    }
  } catch (err) {
    context.log.error("Lucius error:", err);

    context.res = {
      status: err.status || 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: { ok: false, error: err.message || "Unknown error" },
    };
  }
};
