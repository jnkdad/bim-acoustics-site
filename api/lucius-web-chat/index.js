// Azure Static Web Apps Function: /api/lucius-web-chat
// POST { message, sessionId, consentToLog } -> { reply }

const SYSTEM_PROMPT = process.env.LUCIUS_SYSTEM_PROMPT || "";
const KB = process.env.LUCIUS_KB || "";

function clamp(s, max) {
  s = (s || "").toString();
  return s.length > max ? s.slice(0, max) : s;
}

module.exports = async function (context, req) {
  try {
    if (req.method !== "POST") {
      context.res = { status: 405, body: { error: "Method not allowed" } };
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
      context.res = { status: 500, body: { error: "Server not configured" } };
      return;
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: "[Knowledge Pack]\n" + KB },
      { role: "user", content: userMsg }
    ];

    const fetchFn = globalThis.fetch || (await import("node-fetch")).default;

    const resp = await fetchFn("https://api.openai.com/v1/chat/completions", {
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

    const reply =
      json?.choices?.[0]?.message?.content
        ? String(json.choices[0].message.content).trim()
        : "";

    if (consentToLog) {
      context.log("LuciusWebChat", JSON.stringify({
        ts: new Date().toISOString(),
        sessionId: sessionId || null,
        user: userMsg,
        assistant: reply
      }));
    }

    context.res = { status: 200, body: { reply } };
  } catch (e) {
    context.res = { status: 500, body: { error: String(e) } };
  }
};
