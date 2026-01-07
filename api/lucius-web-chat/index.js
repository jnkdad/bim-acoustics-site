module.exports = async function (context, req) {
  const method = (req.method || "").toUpperCase();

  if (method === "GET") {
    context.res = { status: 200, body: { ok: true, service: "lucius-web-chat" } };
    return;
  }

  const msg = (req.body && req.body.message) ? String(req.body.message) : "";
  context.res = { status: 200, body: { reply: `Lucius is live. You said: ${msg}` } };
};
