(function () {
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
    try { localStorage.setItem(CONSENT_KEY, v); } catch {}
  }

  const state = {
    open: false, // used for floating
    busy: false,
    sessionId: getOrCreateSessionId(),
    consent: getConsent() // null | yes | no
  };

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function isGated() {
    return state.consent !== "yes" && state.consent !== "no";
  }

  function appendMessage(bodyEl, cls, text) {
    bodyEl.insertAdjacentHTML("beforeend", `<div class="lw-msg ${cls}">${escapeHtml(text)}</div>`);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  function renderChat(containerEl, mode) {
    const gated = isGated();

    containerEl.innerHTML = `
      ${mode === "floating" ? `
        <button class="lw-fab" type="button" aria-label="Open Lucius">Lucius</button>
        <div class="lw-panel ${state.open ? "open" : ""}" role="dialog" aria-label="Lucius chat">
      ` : `
        <div class="lw-embed-shell">
        <div class="lw-embed-hd"><div class="lw-title">Lucius</div></div>
        <div class="lw-panel open" role="dialog" aria-label="Lucius chat">
      `}
          ${mode === "floating" ? `
          <div class="lw-hd">
            <div class="lw-title">Lucius</div>
            <button class="lw-x" type="button" aria-label="Close">✕</button>
          </div>
          ` : ``}

          <div class="lw-body" id="lw-body">
            <div class="lw-msg sys">
              Hi — I’m Lucius. Ask me about System Designer (Distributed Systems), Revit support (2022–2026), and early access.
              For enterprise or manufacturer discussions, email <b>info@bimacoustics.net</b>.
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
            <input class="lw-in" id="lw-in" type="text"
              placeholder="${gated ? "Consent required to start…" : "Ask a question…"}"
              ${gated ? "disabled" : ""} />
            <button class="lw-send" id="lw-send" type="button" ${gated ? "disabled" : ""}>
              ${state.busy ? "…" : "Send"}
            </button>
          </div>

        </div>
      ${mode === "floating" ? `</div>` : `</div>`}
    `;

    const bodyEl = containerEl.querySelector("#lw-body");
    const input = containerEl.querySelector("#lw-in");
    const send = containerEl.querySelector("#lw-send");

    const fab = containerEl.querySelector(".lw-fab");
    const close = containerEl.querySelector(".lw-x");

    if (mode === "floating") {
      if (fab) fab.onclick = () => { state.open = true; render(); };
      if (close) close.onclick = () => { state.open = false; render(); };
    }

    if (send && input) {
      send.onclick = async () => {
        if (state.busy || isGated()) return;
        const msg = (input.value || "").trim();
        if (!msg) return;

        appendMessage(bodyEl, "user", msg);
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

          if (!resp.ok) {
            const t = await resp.text();
            console.warn("Lucius API error:", resp.status, t);
            appendMessage(bodyEl, "bot", `Server error (${resp.status}).`);
            return;
          }

          const data = await resp.json();
          appendMessage(bodyEl, "bot", data.reply || "No response available.");
        } catch (e) {
          console.warn("Lucius fetch failed:", e);
          appendMessage(bodyEl, "bot", "Sorry — something went wrong.");
        } finally {
          state.busy = false;
          render();
        }
      };

      input.onkeydown = (e) => {
        if (e.key === "Enter") send.click();
      };
    }

    const check = containerEl.querySelector("#lw-consent-check");
    const yesBtn = containerEl.querySelector("#lw-consent-yes");
    const noBtn = containerEl.querySelector("#lw-consent-no");

    if (check && yesBtn) check.onchange = () => { yesBtn.disabled = !check.checked; };
    if (yesBtn) yesBtn.onclick = () => { setConsent("yes"); state.consent = "yes"; render(); };
    if (noBtn) noBtn.onclick = () => { setConsent("no"); state.consent = "no"; render(); };
  }

  function render() {
    // Prefer embedded if present
    const embed = document.getElementById("lucius-embed");
    const floating = document.getElementById("lucius-widget");

    if (embed) {
      renderChat(embed, "embedded");
      // If embedded exists, we can optionally hide floating container if present
      if (floating) floating.innerHTML = "";
      return;
    }

    // Otherwise use floating (if mount exists)
    if (floating) {
      renderChat(floating, "floating");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render);
  } else {
    render();
  }
})();
