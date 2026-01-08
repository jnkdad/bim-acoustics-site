// /api/lucius-web-chat/index.js
// Azure Functions (Node) Lucius website chat handler + debug file listing
// - Loads engineering docs from api/lucius-web-chat/docs/lucius/*.md
// - Calls OpenAI via built-in https (no fetch dependency)
// - GET ?debug=1 shows what the function can see at runtime

const fs = require("fs");
const path = require("path");
const https = require("https");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com";

const ENV_SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const ENV_KB = process.env.LUCIUS_KB || "";

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
  if (!names) return null;
  return names.map((n) => path.join(dir, n));
}

function findDocByKeywords(docsDir, keywords) {
  const files = listDirFullPaths(docsDir) || [];
  const mdFiles = files.filter((f) => f.toLowerCase().endsWith(".md"));

  const hit = mdFiles.find((f) => {
    const name = path.basename(f).toLowerCase();
    return keywords.every((k) => name.includes(k.toLowerCase()));
  });

  return hit || null;
}

function loadLuciusDocs() {
  // ✅ Deployed location (confirmed by your debug output):
  const docsDir = path.join(__dirname, "docs", "lucius");

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
    const st = safeStat(p);
    statsKeyParts.push(st ? `${p}:${st.mtimeMs}` : `${p}:unstat`);
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

  const engineeringModel =
    docs.engineeringModel ||
    ENV_KB ||
    "(No engineering model text found. Ensure api/lucius-web-chat/docs/lucius/*.md is deployed.)";

  const engineeringResponses =
    docs.engineeringResponses ||
    ENV_SYSTEM_PROMPT ||
    "(No engineering responses text found. Ensure api/lucius-web-chat/docs/lucius/*.md is deployed.)";

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

function httpsJsonRequest(urlString, { method, headers, body }) {
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

    const req = https.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = data ? JSON.parse(data) : {};
        } catch {
          // keep raw
        }

        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json,
          raw: data,
        });
      });
    });

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function callOpenAI({ developerText, userText }) {
  if (!OPENAI_API_KEY) {
    const e = new Error("Missing OPENAI_API_KEY environment variable.");
    e.code = "NO_API_KEY";
    throw e;
  }

  const base = OPENAI_API_BASE.replace(/\/+$/, "");
  const url = `${base}/v1/responses`;

  const payload = {
    model: OPENAI_MODEL,
    input: [
      { role: "developer", content: developerText },
      { role: "user", content: userText },
    ],
  };

  const resp = await httpsJsonRequest(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errMsg =
      (resp.json && resp.json.error && resp.json.error.message) ||
      `OpenAI API error (${resp.status})`;
    const err = new Error(errMsg);
    err.status = resp.status;
    err.details = resp.json || resp.raw;
    throw err;
  }

  const data = resp.json || {};
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();

  return "I’m here, but I couldn’t parse the model output. Please try again.";
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
    context.res = {
      status: err.status || 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body: {
        ok: false,
        error: err.message || "Unknown error",
      },
    };
  }
};
