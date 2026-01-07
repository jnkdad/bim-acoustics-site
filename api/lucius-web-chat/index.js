// Azure Static Web Apps / Azure Functions (Node)
// Route: /api/lucius-web-chat
//
// Env vars required:
// - OPENAI_API_KEY
// - OPENAI_MODEL (optional, default gpt-4o-mini)
// - LUCIUS_SYSTEM_PROMPT
// - LUCIUS_KB
//
// Request (POST JSON):
// { message: string, sessionId?: string, consentToLog?: boolean }
//
// Response (POST JSON):
// { reply: string }

const SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const KB = process.env.LUCIUS_KB || "";

function clamp(s, max) {
  s = (s || "").toString();
  return s.length > max ? s.slice(0, max) : s;
}

module.exports = async function (context, req) {
  try {
    const method = (req.method || "").toUpperCase();

    // ✅ GET sanity check (helps confirm route works in browser)
    if (method === "GET") {
      context.res = {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { ok: true, service: "lucius-web-chat" }
      };
      return;
    }

    if (method !== "POST") {
      context.res = {
        status: 405,
        headers: { "Content-Type": "application/json" },
        body: { error: "Method not allowed" }
      };
      return;
    }

    const body = req.body || {};
    const userMsg = clamp(body.message || "", 2000).trim();
    const sessionId = clamp(body.sessionId || "", 120).trim();
    const consentToLog = !!body.consentToLog;

    if (!userMsg) {
      context.res = { status: 400, body: { error: "Missing message" } };
      return;
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!OPENAI_API_KEY) {
      context.res = { status: 500, body: { error: "OPENAI_API_KEY not set" } };
      return;
    }

    // Keep the KB bounded to avoid token blowups if Azure truncates/changes formatting.
    const kbBlock = (KB || "").trim();
    const sysBlock = (SYSTEM_PROMPT || "").trim();

    const messages = [
      { role: "system", content: sysBlock || "You are Lucius." },
      { role: "system", content: "[Knowledge Pack]\n" + kbBlock },
      { role: "user", content: userMsg }
    ];

    // Use global fetch (available in modern Azure Functions runtime)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: 0.2
      })
    });

    const json = await resp.json();

    if (!resp.ok) {
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: { error: "OpenAI error", details: json }
      };
      return;
    }

    const reply =
      json?.choices?.[0]?.message?.content
        ? String(json.choices[0].message.content).trim()
        : "";

    // Consent-based logging (no PII; do not log emails)
    if (consentToLog) {
      context.log("LuciusWebChat", JSON.stringify({
        ts: new Date().toISOString(),
        sessionId: sessionId || null,
        user: userMsg,
        assistant: reply
      }));
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { reply }
    };
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Server error", details: String(e) }
    };
  }
};
