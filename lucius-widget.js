(function () {
  const endpoint = "/api/lucius-web-chat";

  // Persistent anonymous session + consent
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
    open: false,           // for floating mode
    busy: false,
    sessionId: getOrCreateSessionId(),
    consent: getConsent(), // null | yes | no

    // Chat history (so re-render never wipes it)
    messages: [
      {
        role: "sys",
        text: "Hi — I’m Lucius. Ask me anything about BIM Acoustics, including our first product: AVToolsSystemDesigner (Distributed Systems) add-in for Revit, Revit support (2022–2026), and early access."
      }
    ],

    // if true, after render we scroll to bottom
    shouldScroll: true
  };

  function gated() {
    return state.consent !== "yes" && state.consent !== "no";
  }

  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[c]));
  }

  function renderMessages() {
    return state.messages.map(m => {
      const cls = m.role === "user" ? "user" : (m.role === "bot" ? "bot" : "sys");
      return `<div class="lw-msg ${cls}">${escapeHtml(m.text)}</div>`;
    }).join("");
  }

  function consentHtml() {
  return `
    <div class="lw-consent">
      <div class="lw-consent-title">Help make Lucius smarter (optional)</div>
      <div class="lw-consent-text">
        If you opt in, BIM Acoustics may store this chat transcript — including your questions, Lucius’ answers,
        and any feedback you share — so we can improve accuracy and usefulness. If you decline, Lucius will still work
        normally and we won’t store this transcript.
      </div>
      <label class="lw-consent-row">
        <input type="checkbox" id="lw-consent-check" />
        <span>I agree to allow BIM Acoustics to store this chat transcript for product improvement.</span>
      </label>
      <div class="lw-consent-actions">
        <button class="lw-btn" id="lw-consent-no" type="button">No thanks</button>
        <button class="lw-btn primary" id="lw-consent-yes" type="button" disabled>Continue</button>
      </div>
    </div>
  `;
}


  function scrollToBottom(container) {
    const body = container.querySelector("#lw-body");
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }

  function renderChat(container, mode) {
    const isGated = gated();
    const panelOpen = (mode === "embedded") ? true : state.open;

    container.innerHTML = (mode === "embedded")
      ? `
        <div class="lw-embed-shell">
          <div class="lw-embed-hd"><div class="lw-title">Lucius</div></div>

          <div class="lw-body" id="lw-body">
            ${renderMessages()}
            ${isGated ? consentHtml() : ""}
          </div>

          <div class="lw-ft">
            <input class="lw-in" id="lw-in" type="text"
              placeholder="${isGated ? "Consent required to start…" : "Ask a question…"}"
              ${isGated ? "disabled" : ""}/>
            <button class="lw-send" id="lw-send" type="button" ${isGated ? "disabled" : ""}>
              ${state.busy ? "…" : "Send"}
            </button>
          </div>
        </div>
      `
      : `
        <div class="lw-shell">
          <button class="lw-fab" type="button" aria-label="Open Lucius">Lucius</button>

          <div class="lw-panel ${panelOpen ? "open" : ""}" role="dialog" aria-label="Lucius chat">
            <div class="lw-hd">
              <div class="lw-title">Lucius</div>
              <button class="lw-x" type="button" aria-label="Close">✕</button>
            </div>

            <div class="lw-body" id="lw-body">
              ${renderMessages()}
              ${isGated ? consentHtml() : ""}
            </div>

            <div class="lw-ft">
              <input class="lw-in" id="lw-in" type="text"
                placeholder="${isGated ? "Consent required to start…" : "Ask a question…"}"
                ${isGated ? "disabled" : ""}/>
              <button class="lw-send" id="lw-send" type="button" ${isGated ? "disabled" : ""}>
                ${state.busy ? "…" : "Send"}
              </button>
            </div>
          </div>
        </div>
      `;

    // Floating open/close controls
    if (mode === "floating") {
      const fab = container.querySelector(".lw-fab");
      const close = container.querySelector(".lw-x");
      if (fab) fab.onclick = () => { state.open = true; state.shouldScroll = true; render(); };
      if (close) close.onclick = () => { state.open = false; render(); };
    }

    // Consent controls
    const check = container.querySelector("#lw-consent-check");
    const yesBtn = container.querySelector("#lw-consent-yes");
    const noBtn = container.querySelector("#lw-consent-no");

    if (check && yesBtn) check.onchange = () => { yesBtn.disabled = !check.checked; };
    if (yesBtn) yesBtn.onclick = () => { setConsent("yes"); state.consent = "yes"; state.shouldScroll = true; render(); };
    if (noBtn)  noBtn.onclick  = () => { setConsent("no");  state.consent = "no";  state.shouldScroll = true; render(); };

    // Send handler
    const input = container.querySelector("#lw-in");
    const send = container.querySelector("#lw-send");

    async function sendMessage() {
      if (!input) return;
      if (state.busy || gated()) return;

      const msg = (input.value || "").trim();
      if (!msg) return;

      state.messages.push({ role: "user", text: msg });
      input.value = "";

      state.busy = true;
      state.shouldScroll = true;
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
          state.messages.push({ role: "bot", text: `Server error (${resp.status}). Please try again.` });
          return;
        }

        const data = await resp.json();
        state.messages.push({ role: "bot", text: (data && data.reply) ? data.reply : "No response available." });
      } catch (e) {
        console.warn("Lucius fetch failed:", e);
        state.messages.push({ role: "bot", text: "Sorry — something went wrong. Please try again." });
      } finally {
        state.busy = false;
        state.shouldScroll = true;
        render();
      }
    }

    if (send && input) {
      send.onclick = sendMessage;
      input.onkeydown = (e) => { if (e.key === "Enter") send.click(); };
    }

    // ✅ Auto-scroll after render
    if (state.shouldScroll) {
      state.shouldScroll = false;
      // defer until DOM is painted
      setTimeout(() => scrollToBottom(container), 0);
    }
  }

  function render() {
    const embed = document.getElementById("lucius-embed");
    const floating = document.getElementById("lucius-widget");

    if (embed) {
      renderChat(embed, "embedded");
      if (floating) floating.innerHTML = ""; // quiet on landing page
      return;
    }

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
