(function () {
  const el = document.getElementById("lucius-widget");
  if (!el) return;

  const endpoint = "/api/lucius-web-chat";

  // Persistent anonymous session id (no PII)
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
    open: false,
    busy: false,
    sessionId: getOrCreateSessionId(),
    consent: getConsent() // null/yes/no
  };

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function showConsentGate() {
    return (state.consent !== "yes" && state.consent !== "no");
  }

  function appendMessage(cls, text) {
    const body = document.getElementById("lw-body");
    if (!body) return;
    body.insertAdjacentHTML("beforeend", `<div class="lw-msg ${cls}">${escapeHtml(text)}</div>`);
    body.scrollTop = body.scrollHeight;
  }

  function render() {
    const gated = showConsentGate();

    el.innerHTML = `
      <div class="lw-shell ${state.open ? "open" : ""}">
        <button class="lw-fab" type="button" aria-label="Open Lucius">Lucius</button>

        <div class="lw-panel" role="dialog" aria-label="Lucius chat">
          <div class="lw-hd">
            <div class="lw-title">Lucius</div>
            <button class="lw-x" type="button" aria-label="Close">✕</button>
          </div>

          <div class="lw-body" id="lw-body">
            <div class="lw-msg sys">
              Hi — I’m Lucius. Ask me about System Designer (Distributed Systems), Revit support (2022–2026), and early access.
              If you represent an enterprise team or a manufacturer, email <b>info@bimacoustics.net</b>.
            </div>

            ${gated ? `
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
            <input class="lw-in" id="lw-in" type="text" placeholder="${gated ? "Consent required to start…" : "Ask a question…"}" ${gated ? "disabled" : ""}/>
            <button class="lw-send" type="button" ${gated ? "disabled" : ""}>${state.busy ? "…" : "Send"}</button>
          </div>
        </div>
      </div>
    `;

    const fab = el.querySelector(".lw-fab");
    const close = el.querySelector(".lw-x");
    const send = el.querySelector(".lw-send");
    const input = el.querySelector("#lw-in");

    fab.addEventListener("click", () => { state.open = true; render(); });
    close.addEventListener("click", () => { state.open = false; render(); });

    if (send && input) {
      send.addEventListener("click", () => sendMessage());
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });
    }

    // Consent wiring
    const check = el.querySelector("#lw-consent-check");
    const yesBtn = el.querySelector("#lw-consent-yes");
    const noBtn = el.querySelector("#lw-consent-no");

    if (check && yesBtn) {
      check.addEventListener("change", () => {
        yesBtn.disabled = !check.checked;
      });
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
    if (state.busy) return;

    const input = el.querySelector("#lw-in");
    const msg = (input.value || "").trim();
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

      const json = await resp.json();
      const reply = (json && json.reply) ? json.reply : "Sorry — I couldn’t respond right now.";
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
