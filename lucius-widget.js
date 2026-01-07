(function () {
  const mount = document.getElementById("lucius-embed");
  if (!mount) return;

  const endpoint = "/api/lucius-web-chat";

  const SESSION_KEY = "lucius_session_id";
  const CONSENT_KEY = "lucius_log_consent"; // "yes" | "no" | null

  function getOrCreateSessionId() {
    try {
      let v = localStorage.getItem(SESSION_KEY);
      if (v) return v;
      v = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : ("sess_" + Date.now() + "_" + Math.random().toString(16).slice(2));
      localStorage.setItem(SESSION_KEY, v);
      return v;
    } catch {
      return "sess_" + Date.now();
    }
  }

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch { }
  }

  const state = {
    busy: false,
    sessionId: getOrCreateSessionId(),
    consent: getConsent(),  // null/yes/no
  };

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function gated() {
    return (state.consent !== "yes" && state.consent !== "no");
  }

  function appendMessage(cls, text) {
    const body = document.getElementById("lw-body");
    if (!body) return;
    body.insertAdjacentHTML("beforeend", `<div class="lw-msg ${cls}">${escapeHtml(text)}</div>`);
    body.scrollTop = body.scrollHeight;
  }

  function render() {
    const isGated = gated();

    mount.innerHTML = `
      <div class="lw-embed-shell">
        <div class="lw-embed-hd">
          <div class="lw-title">Lucius</div>
        </div>

        <div class="lw-body" id="lw-body">
          <div class="lw-msg sys">
            Hi — I’m Lucius. Ask me about System Designer (Distributed Systems), Revit support (2022–2026), and early access.
            If you represent an enterprise team or a manufacturer, email <b>info@bimacoustics.net</b>.
          </div>

          ${isGated ? `
            <div class="lw-consent">
              <div class="lw-consent-title">Help improve Lucius (optional)</div>
              <div class="lw-consent-text">
                If you agree, we’ll store a transcript of this chat to improve Lucius’ responses.
                If you don’t agree, Lucius will still work — we just won’t save the transcript.
              </div>
              <label class="lw-consent-row">
                <input type="checkbox" id="lw-consent-check" />
                <span>I agree to allow BIM Acoustics to store this chat transcript.</span>
              </label>
              <div class="lw-consent-actions">
                <button class="lw-btn" id="lw-consent-no" type="button">No thanks</button>
                <button class="lw-btn primary" id="lw-consent-yes" type="button" disabled>Continue</button>
              </div>
            </div>
          ` : ""}
        </div>

        <div class="lw-ft">
          <input class="lw-in" id="lw-in" type="text" placeholder="${isGated ? "Consent required to start…" : "Ask a question…"}" ${isGated ? "disabled" : ""}/>
          <button class="lw-send" id="lw-send" type="button" ${isGated ? "disabled" : ""}>${state.busy ? "…" : "Send"}</button>
        </div>
      </div>
    `;

    const input = document.getElementById("lw-in");
    const send = document.getElementById("lw-send");

    if (send && input) {
      send.addEventListener("click", sendMessage);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
    }

    const check = document.getElementById("lw-consent-check");
    const yesBtn = document.getElementById("lw-consent-yes");
    const noBtn = document.getElementById("lw-consent-no");

    if (check && yesBtn) {
      check.addEventListener("change", () => { yesBtn.disabled = !check.checked; });
    }
    if (yesBtn) {
      yesBtn.addEventListener("click", () => {
        setConsent("yes");
        state.consent = "yes";
        render();
      });
    }
    if (noBtn) {
      noBtn.addEventListener("click", () => {
        setConsent("no");
        state.consent = "no";
        render();
      });
    }
  }

  async function sendMessage() {
    if (state.busy || gated()) return;

    const input = document.getElementById("lw-in");
    const msg = (input?.value || "").trim();
    if (!msg) return;

    appendMessage("user", msg);
    input.value = "";

    state.busy = true;
    render();

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          sessionId: state.sessionId,
          consentToLog: (state.consent === "yes")
        })
      });

      const data = await resp.json();
      const reply = (data && data.reply) ? data.reply : "Sorry — I couldn’t respond right now.";
      appendMessage("bot", reply);
    } catch {
      appendMessage("bot", "Sorry — something went wrong.");
    } finally {
      state.busy = false;
      render();
    }
  }

  render();
})();
