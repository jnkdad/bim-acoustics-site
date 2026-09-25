// /api/RegisterDownload/index.js
//
// Receives a POST from download.html with { fname, lname, email, company, version, product, source }.
// - Adds/updates the subscriber in Mailchimp (PUT to /lists/{id}/members/{md5(email)})
// - Applies tags so leads are filterable (e.g. "SpecTool-Trial", "v2.3.1")
// - Returns { download_url } so the client can begin the download
// - FAILS OPEN: any Mailchimp error (missing env vars, API rejection, network) is logged
//   but the client still receives a valid download URL. A download is never blocked by
//   a broken lead-capture pipeline.
//
// Environment variables (set in Azure Static Web Apps -> Configuration):
//   MAILCHIMP_API_KEY   e.g. "abc123def456...-us14"   (the "-us14" suffix is the datacenter)
//   MAILCHIMP_LIST_ID   e.g. "1a2b3c4d5e"             (from Audience -> Settings -> Audience name and defaults)
//
// Query the hits in App Insights:
//   traces
//   | where message startswith "AVTOOLS_LEAD"
//   | extend e = parse_json(substring(message, 13))
//   | project timestamp, tostring(e.email), tostring(e.version), tostring(e.mc_status), tostring(e.country)

const crypto = require("crypto");
const https  = require("https");

// -------- helpers --------

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"] || req.headers["X-Forwarded-For"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.headers["x-azure-clientip"] || null;
}

function clientCountry(req) {
  return req.headers["x-azure-clientip-country"] || req.headers["x-country"] || null;
}

function isValidEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function safeString(s, max) {
  if (typeof s !== "string") return "";
  const trimmed = s.trim();
  return max ? trimmed.slice(0, max) : trimmed;
}

// The download URL we hand back. Kept in sync with /api/Download for v2.3.3.
// Points at the /api/download function so we still get the App Insights hit
// on the actual file fetch too.
const DOWNLOAD_URL = "/api/download?key=v233";

// -------- Mailchimp calls --------

// Make a raw HTTPS request. Returns { status, body }.
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve({ status: res.statusCode, body: raw });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// Upsert subscriber via PUT /lists/{list_id}/members/{md5_lowercase_email}
async function upsertSubscriber(dc, listId, apiKey, email, fname, lname, company) {
  const emailLower = email.toLowerCase();
  const hash = crypto.createHash("md5").update(emailLower).digest("hex");

  const mergeFields = {
    FNAME: fname,
    LNAME: lname
  };
  // Only include COMPANY if the audience has that merge field defined.
  // If the merge field doesn't exist, Mailchimp will return 400 and we log/skip.
  if (company) mergeFields.COMPANY = company;

  const payload = JSON.stringify({
    email_address: emailLower,
    status_if_new: "subscribed",   // added as subscribed on first submission
    status:        "subscribed",   // keeps existing status honored; but promotes archived/pending to subscribed
    merge_fields:  mergeFields
  });

  const options = {
    hostname: `${dc}.api.mailchimp.com`,
    path:     `/3.0/lists/${listId}/members/${hash}`,
    method:   "PUT",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Authorization":  "Basic " + Buffer.from(`anystring:${apiKey}`).toString("base64")
    }
  };

  const res = await httpsRequest(options, payload);
  return { ...res, hash: hash };
}

// If COMPANY merge field doesn't exist, retry without it.
async function upsertSubscriberWithFallback(dc, listId, apiKey, email, fname, lname, company) {
  let result = await upsertSubscriber(dc, listId, apiKey, email, fname, lname, company);
  // Mailchimp returns 400 with title "Invalid Resource" if a merge field is invalid.
  // We only retry when we sent COMPANY — no point retrying otherwise.
  if (result.status === 400 && company) {
    try {
      const parsed = JSON.parse(result.body);
      const errStr = (parsed.detail || "") + " " + (parsed.errors ? JSON.stringify(parsed.errors) : "");
      if (/COMPANY/i.test(errStr)) {
        // Retry without company
        result = await upsertSubscriber(dc, listId, apiKey, email, fname, lname, "");
        result._retriedWithoutCompany = true;
      }
    } catch (_) { /* parse failure — fall through with original error */ }
  }
  return result;
}

// Apply tags to the subscriber via POST /lists/{list_id}/members/{md5}/tags
async function applyTags(dc, listId, apiKey, memberHash, tagNames) {
  const payload = JSON.stringify({
    tags: tagNames.map((n) => ({ name: n, status: "active" }))
  });

  const options = {
    hostname: `${dc}.api.mailchimp.com`,
    path:     `/3.0/lists/${listId}/members/${memberHash}/tags`,
    method:   "POST",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(payload),
      "Authorization":  "Basic " + Buffer.from(`anystring:${apiKey}`).toString("base64")
    }
  };

  return httpsRequest(options, payload);
}

// -------- handler --------

module.exports = async function (context, req) {
  // Parse body defensively
  let payload = {};
  try {
    if (req.body && typeof req.body === "object") {
      payload = req.body;
    } else if (typeof req.body === "string") {
      payload = JSON.parse(req.body);
    }
  } catch (_) {
    payload = {};
  }

  const fname   = safeString(payload.fname,   80);
  const lname   = safeString(payload.lname,   80);
  const email   = safeString(payload.email,   254);
  const company = safeString(payload.company, 200);
  const version = safeString(payload.version, 20)  || "v2.3.3";
  const product = safeString(payload.product, 80)  || "AVTools System Designer";
  const source  = safeString(payload.source,  80)  || "download.html";

  // Basic validation — we NEVER 4xx the client for lead-side problems; we log
  // and still hand back a download. But if the payload is unusable garbage,
  // we can 400 because there's nothing to do.
  if (!isValidEmail(email) || !fname || !lname) {
    context.res = {
      status: 400,
      headers: { "Content-Type": "application/json" },
      body: { error: "missing_or_invalid_fields", download_url: DOWNLOAD_URL }
    };
    return;
  }

  // Load Mailchimp config from env
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const listId = process.env.MAILCHIMP_LIST_ID;

  let mcStatus     = "skipped";
  let mcHttpStatus = null;
  let mcError      = null;
  let dc           = null;

  if (apiKey && listId) {
    // Extract datacenter from the API key ("-us14" -> "us14")
    const dashIdx = apiKey.lastIndexOf("-");
    dc = dashIdx > 0 ? apiKey.substring(dashIdx + 1) : null;

    if (!dc) {
      mcStatus = "config_error_no_dc";
    } else {
      try {
        // 1) Upsert subscriber
        const sub = await upsertSubscriberWithFallback(dc, listId, apiKey, email, fname, lname, company);
        mcHttpStatus = sub.status;

        if (sub.status >= 200 && sub.status < 300) {
          // 2) Apply tags
          try {
            const tagRes = await applyTags(dc, listId, apiKey, sub.hash, [
              "SpecTool-Trial",
              version,
              product,
              source
            ]);
            if (tagRes.status >= 200 && tagRes.status < 300) {
              mcStatus = sub._retriedWithoutCompany ? "ok_no_company_field" : "ok";
            } else {
              mcStatus = "tag_error";
              mcError  = "tag http " + tagRes.status + ": " + tagRes.body.substring(0, 300);
            }
          } catch (tagErr) {
            mcStatus = "tag_exception";
            mcError  = String(tagErr && tagErr.message);
          }
        } else {
          mcStatus = "subscriber_error";
          mcError  = "subscriber http " + sub.status + ": " + sub.body.substring(0, 300);
        }
      } catch (mcErr) {
        mcStatus = "exception";
        mcError  = String(mcErr && mcErr.message);
      }
    }
  } else {
    mcStatus = "no_env_config";
  }

  // Structured log — picked up by App Insights traces
  try {
    const event = {
      ts:      new Date().toISOString(),
      email:   email,
      fname:   fname,
      lname:   lname,
      company: company || null,
      version: version,
      product: product,
      source:  source,
      ip:      clientIp(req),
      country: clientCountry(req),
      ua:      req.headers["user-agent"] || null,
      ref:     req.headers["referer"] || req.headers["referrer"] || null,
      mc_status:      mcStatus,
      mc_http_status: mcHttpStatus,
      mc_dc:          dc,
      mc_error:       mcError
    };
    context.log("AVTOOLS_LEAD " + JSON.stringify(event));
  } catch (logErr) {
    context.log.warn("Lead logging failed:", logErr && logErr.message);
  }

  // Always return a download URL — never block on lead capture
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    },
    body: {
      ok:           mcStatus.indexOf("ok") === 0,
      mc_status:    mcStatus,
      download_url: DOWNLOAD_URL
    }
  };
};
