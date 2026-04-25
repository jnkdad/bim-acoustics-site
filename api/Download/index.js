// /api/Download/index.js
// Logs a structured download event then 302-redirects to the real file in /downloads/.
// Query the hits in App Insights:
//   traces | where message startswith "AVTOOLS_DOWNLOAD"
//          | extend e = parse_json(substring(message, 18))
//          | summarize count() by tostring(e.key), bin(timestamp, 1d)

// Strict allowlist — short key -> filename in /downloads/
// Add new releases here; anything not listed returns 404.
const FILES = {
  "v121":     "JSBA.AVTools-SystemDesigner_Revit2022-2024_v1.2.1.zip",
  "v20":      "JSBA.AVTools-SystemDesigner_Revit2025-2026_v2.0.zip",
  "presskit": "AVTools-SystemDesigner-v2.0-PressKit.zip"
};

function clientIp(req) {
  // Azure Static Web Apps / Front Door pass the real client IP in x-forwarded-for
  const xff = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.headers["x-azure-clientip"] || null;
}

function clientCountry(req) {
  // SWA injects this header when available
  return req.headers["x-azure-clientip-country"] || req.headers["x-country"] || null;
}

module.exports = async function (context, req) {
  const key = (req.query && req.query.key) ? String(req.query.key).toLowerCase() : "";
  const filename = Object.prototype.hasOwnProperty.call(FILES, key) ? FILES[key] : null;

  if (!filename) {
    context.res = {
      status: 404,
      headers: { "Content-Type": "text/plain" },
      body: "Not found."
    };
    return;
  }

  // Log structured event — picked up by App Insights traces
  try {
    const event = {
      ts: new Date().toISOString(),
      key,
      file: filename,
      ip: clientIp(req),
      country: clientCountry(req),
      ua: req.headers["user-agent"] || null,
      ref: req.headers["referer"] || req.headers["referrer"] || null
    };
    context.log("AVTOOLS_DOWNLOAD " + JSON.stringify(event));
  } catch (e) {
    context.log.warn("Download logging failed:", e && e.message);
  }

  // 302 to the static file. encodeURIComponent on filename keeps spaces/punct safe.
  const location = "/downloads/" + encodeURIComponent(filename);

  context.res = {
    status: 302,
    headers: {
      "Location": location,
      "Cache-Control": "no-store"
    }
  };
};
