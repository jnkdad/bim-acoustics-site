// /api/lucius-web-chat/index.js
// Lucius website chat handler (Azure Functions, Node)
//
// ✅ v1 Prompt Pack Centralization (runtime HTTPS fetch + TTL cache + local fallback)
// - Fetches layered prompt packs from:
//   https://www.bimacoustics.net/lucius/packs/core.md
//   https://www.bimacoustics.net/lucius/packs/system-designer.md
//   https://www.bimacoustics.net/lucius/packs/website-overlay.md
// - Caches in-memory (default 10 minutes; configurable via LUCIUS_PACK_TTL_MS)
// - Falls back to local copies in /docs/lucius when fetch fails
// - GET ?debug=1 lists visible local docs (existing behavior)
// - POST with message starting "TEST LOGGING:" returns extra debug telemetry (pack load status)
//
// Notes:
// - Uses built-in https (no fetch dependency)
// - Calls OpenAI Responses API

const fs = require("fs");
const path = require("path");
const https = require("https");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || "https://api.openai.com";

// Optional fallbacks (you already have these in Azure)
const ENV_SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const ENV_KB = process.env.LUCIUS_KB || "";

// Prompt pack URLs (Option A: public but unlinked, hosted in website repo)
const PACK_BASE =
  (process.env.LUCIUS_PACK_BASE || "https://www.bimacoustics.net/lucius/packs").replace(/\/+$/, "");

const PACK_URLS = {
  core: process.env.LUCIUS_PACK_CORE_URL || `${PACK_BASE}/core.md`,
  systemDesigner: process.env.LUCIUS_PACK_SYSTEM_DESIGNER_URL || `${PACK_BASE}/system-designer.md`,
  websiteOverlay: process.env.LUCIUS_PACK_WEBSITE_OVERLAY_URL || `${PACK_BASE}/website-overlay.md`,
};

// Cache TTL (5–15 min recommended; default 10 min)
const PACK_TTL_MS = Number(process.env.LUCIUS_PACK_TTL_MS || 10 * 60 * 1000);

// Warm caches
let _cachedLocalDocs = null;
let _cachedLocalKey = null;

let _packCache = {
  expiresAt: 0,
  data: null, // { core, systemDesigner, websiteOverlay, meta }
};

// ---------- Local docs helpers (existing) ----------

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

  // You previously used two internal docs. Keep them as local fallbacks.
  const engineeringModelPath =
    findDocByKeywords(docsDir, ["system", "designer", "engineering"]) ||
    findDocByKeywords(docsDir, ["engineering", "model"]) ||
    null;

  const engineeringResponsesPath =
    findDocByKeywords(docsDir, ["lucius", "engineering", "response"]) ||
    findDocByKeywords(docsDir, ["engineering", "response"]) ||
    null;

  // Cache key based on file mtimes
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

  if (_cachedLocalDocs && _cachedLocalKey === key) return _cachedLocalDocs;

  const engineeringModel = engineeringModelPath ? safeReadUtf8(engineeringModelPath) : null;
  const engineeringResponses = engineeringResponsesPath ? safeReadUtf8(engineeringResponsesPath) : null;

  _cachedLocalDocs = {
    docsDir,
    engineeringModelPath,
    engineeringResponsesPath,
    engineeringModel,
    engineeringResponses,
  };
  _cachedLocalKey = key;

  return _cachedLocalDocs;
}

// ---------- Request parsing ----------

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

// ---------- HTTPS helpers ----------

function httpsRequest(urlString, method, headers, bodyString) {
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
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          headers: res.headers || {},
          raw: data,
        });
      });
    });

    r.on("error", reject);
    if (bodyString) r.write(bodyString);
    r.end();
  });
}

async function httpsTextGet(url, extraHeaders = {}) {
  const resp = await httpsRequest(url, "GET", { "User-Agent": "lucius-web-chat/1.0", ...extraHeaders }, null);
  if (!resp.ok) {
    const err = new Error(`HTTP GET failed (${resp.status}) for ${url}`);
    err.status = resp.status;
    throw err;
  }
  return { text: resp.raw || "", headers: resp.headers || {} };
}

function nowMs() {
  return Date.now();
}

// ---------- Prompt pack loading (HTTPS + TTL cache + local fallback) ----------

async function loadPromptPacksWithCache(context, localDocs) {
  // Serve cached packs if valid
  if (_packCache.data && _packCache.expiresAt > nowMs()) {
    return { ..._packCache.data, meta: { ..._packCache.data.meta, cache: "hit" } };
  }

  const startedAt = new Date().toISOString();
  const meta = {
    startedAt,
    cache: "miss",
    ttlMs: PACK_TTL_MS,
    urls: { ...PACK_URLS },
    fetched: {
      core: { ok: false, bytes: 0, etag: null, lastModified: null, source: null, error: null },
      systemDesigner: { ok: false, bytes: 0, etag: null, lastModified: null, source: null, error: null },
      websiteOverlay: { ok: false, bytes: 0, etag: null, lastModified: null, source: null, error: null },
    },
  };

  // Local fallbacks (your existing docs)
  const localFallbackCore = localDocs.engineeringResponses || ENV_SYSTEM_PROMPT || "";
  const localFallbackSystemDesigner = localDocs.engineeringModel || ENV_KB || "";
  const localFallbackOverlay = ""; // If you have a local overlay file later, wire it here.

  let coreText = "";
  let systemDesignerText = "";
  let websiteOverlayText = "";

  // Try remote fetch for each pack. If any fail, fall back per-pack.
  async function fetchOrFallback(packKey, url, localFallback, metaKey) {
    try {
      const { text, headers } = await httpsTextGet(url);
      const t = (text || "").trim();
      meta.fetched[metaKey].ok = !!t;
      meta.fetched[metaKey].bytes = Buffer.byteLength(text || "", "utf8");
      meta.fetched[metaKey].etag = headers.etag || null;
      meta.fetched[metaKey].lastModified = headers["last-modified"] || null;
      meta.fetched[metaKey].source = meta.fetched[metaKey].ok ? "https" : "fallback-empty";
      return meta.fetched[metaKey].ok ? t : (localFallback || "").trim();
    } catch (e) {
      meta.fetched[metaKey].ok = false;
      meta.fetched[metaKey].bytes = 0;
      meta.fetched[metaKey].etag = null;
      meta.fetched[metaKey].lastModified = null;
      meta.fetched[metaKey].source = "local-fallback";
      meta.fetched[metaKey].error = (e && e.message) ? String(e.message) : "fetch failed";
      // Best-effort log (won’t break)
      try {
        context.log.warn(`Lucius pack fetch failed for ${packKey}: ${meta.fetched[metaKey].error}`);
      } catch {}
      return (localFallback || "").trim();
    }
  }

  coreText = await fetchOrFallback("core", PACK_URLS.core, localFallbackCore, "core");
  systemDesignerText = await fetchOrFallback(
    "systemDesigner",
    PACK_URLS.systemDesigner,
    localFallbackSystemDesigner,
    "systemDesigner"
  );
  websiteOverlayText = await fetchOrFallback(
    "websiteOverlay",
    PACK_URLS.websiteOverlay,
    localFallbackOverlay,
    "websiteOverlay"
  );

  // If core is still empty, ensure we always have *something*
  if (!coreText) coreText = (ENV_SYSTEM_PROMPT || "").trim();

  const data = {
    core: coreText,
    systemDesigner: systemDesignerText,
    websiteOverlay: websiteOverlayText,
    meta,
  };

  // Save to cache
  _packCache = {
    expiresAt: nowMs() + PACK_TTL_MS,
    data,
  };

  return data;
}

// ---------- Prompt assembly ----------

function buildDeveloperInstructionsFromPacks(packs) {
  // Keep your hard rules, then layer packs beneath.
  const hardRules = [
    "You are Lucius, the technically credible engineering explainer for the BIM Acoustics website.",
    "",
    "Hard facts you MUST state correctly:",
    "- Company: BIM Acoustics (J. Stevens BIM Acoustics)",
    "- Founder: Jerrold Stevens",
    '- Canonical product name: "AVToolsSystemDesigner add-in for Revit (Distributed Systems)"',
    '  After first use, you may shorten to "System Designer".',
    "",
    "Identity handling (MUST follow exactly):",
    '- If the user says: "This is Jerrold"',
    '  Reply with: "If you’re Jerrold Stevens (founder of BIM Acoustics), welcome back — how can I help?"',
    "",
    "Tone rules:",
    "- Professional, informative, confident.",
    "- Do NOT be evasive.",
    "- Do NOT be salesy. Do not push early access unless the user asks how to buy/try/get access.",
    "",
    "Technical truth rules:",
    "- Be transparent about assumptions and limits.",
    "- Do NOT claim acoustic simulation (no SPL maps/STI/EASE prediction).",
    "- v1 includes geometric layout + spacing + tap recommendation guidance based on target SPL (design assist).",
    "- Roadmap items are not features; never imply they exist today.",
    "",
    "Answer behavior:",
    "- When asked “what formula,” provide canonical forms if available; symbolic form is OK.",
    "- Keep answers concise: 1–6 short paragraphs; bullets are fine.",
  ].join("\n");

  // Layered prompt packs (v1)
  const core = packs.core || "";
  const systemDesigner = packs.systemDesigner || "";
  const overlay = packs.websiteOverlay || "";

  return [
    hardRules,
    "",
    "=== CORE PACK (global) ===",
    core ? core : "(core pack missing)",
    "",
    "=== PRODUCT PACK: AVToolsSystemDesigner ===",
    systemDesigner ? systemDesigner : "(system-designer pack missing)",
    "",
    "=== CONTEXT OVERLAY: Website ===",
    overlay ? overlay : "(website overlay pack missing)",
  ].join("\n");
}

// ---------- OpenAI Responses API ----------

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

  const resp = await httpsRequest(
    url,
    "POST",
    {
      Authorization: "Bearer " + OPENAI_API_KEY,
      "Content-Type": "application/json",
    },
    JSON.stringify(payload)
  );

  let json = null;
  try {
    json = resp.raw ? JSON.parse(resp.raw) : {};
  } catch {
    json = null;
  }

  if (!resp.ok) {
    const msg =
      (json && json.error && json.error.message) ||
      ("OpenAI API error (" + resp.status + ")");
    const err = new Error(msg);
    err.status = resp.status;
    err.details = json || resp.raw;
    throw err;
  }

  const text = extractOutputText(json);
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

  // Debug endpoint (existing)
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
          packConfig: {
            PACK_TTL_MS,
            PACK_URLS,
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

    // Debug trigger: message starts with "TEST LOGGING:"
    const isDebugPost = typeof userText === "string" && userText.startsWith("TEST LOGGING:");

    // Load local docs (fallbacks) + remote prompt packs (preferred)
    const localDocs = loadLuciusDocs();
    const packs = await loadPromptPacksWithCache(context, localDocs);

    const developerText = buildDeveloperInstructionsFromPacks(packs);
    const reply = await callOpenAI(developerText, userText);

    // Fast response
    const body = { ok: true, reply };

    // Attach pack telemetry only when explicitly debugging
    if (isDebugPost) {
      body.debug = {
        model: OPENAI_MODEL,
        pack: packs.meta,
        cacheExpiresAt: _packCache.expiresAt ? new Date(_packCache.expiresAt).toISOString() : null,
      };
    }

    context.res = {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      body,
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
