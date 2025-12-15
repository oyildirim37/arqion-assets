(() => {
  const KEY = "arqion_cookie_consent_v5";
  const PRIVACY_URL = "https://www.arqion.com/legal/privacy-policy";
  const IMPRINT_URL = "https://www.arqion.com/legal/imprint";
  const FOOTER_HASH = "#cookie-settings";

  const $ = (s, r = document) => r.querySelector(s);

  const get = () => {
    try { return JSON.parse(localStorage.getItem(KEY)); }
    catch { return null; }
  };

  const set = (c) => {
    const payload = {
      version: 5,
      updatedAt: new Date().toISOString(),
      necessary: true,
      analytics: !!c.analytics,
      marketing: !!c.marketing,
      functional: !!c.functional,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("arqion:consent", { detail: payload }));
    return payload;
  };

  const runDeferred = (consent) => {
    const allow = {
      analytics: consent.analytics,
      marketing: consent.marketing,
      functional: consent.functional,
    };

    document.querySelectorAll('script[type="text/plain"][data-cookiecat]').forEach((node) => {
      const cat = node.getAttribute("data-cookiecat");
      if (!cat || !allow[cat]) return;

      const s = document.createElement("script");
      [...node.attributes].forEach((a) => {
        if (a.name === "type" || a.name === "data-cookiecat") return;
        s.setAttribute(a.name, a.value);
      });
      s.text = node.text || node.textContent || "";
      node.parentNode.insertBefore(s, node);
      node.remove();
    });
  };

  const existing = get();
  if (existing) {
    runDeferred(existing);
  }

  let mounted = false;
  let root;

  function mount(show = true) {
    if (mounted) {
      if (show) root.classList.add("cb-visible");
      return;
    }
    mounted = true;

    const style = document.createElement("style");
    style.textContent = `
:root{
  --cb-bg:#0b0f12;
  --cb-text:#e9eef3;
  --cb-muted:#9aa7b4;
  --cb-border:rgba(255,255,255,.12);
  --cb-accent:#00FFD9;
  --cb-radius:16px;
  --cb-shadow:0 20px 60px rgba(0,0,0,.60);
  --cb-font:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;
}

#cb-root{
  position:fixed;
  inset:0;
  z-index:99999;
  pointer-events:none;
  font-family:var(--cb-font);
}

.cb-backdrop{
  position:absolute;
  inset:0;
  background:rgba(0,0,0,.35);
  opacity:0;
  transition:opacity .18s ease;
}

.cb-panel{
  position:absolute;
  left:50%;
  bottom:22px;
  transform:translateX(-50%);
  width:min(980px,calc(100vw - 28px));
  background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));
  border:1px solid var(--cb-border);
  border-radius:var(--cb-radius);
  box-shadow:var(--cb-shadow);
  padding:20px;
  color:var(--cb-text);
  pointer-events:auto;
  opacity:0;
  transform:translateX(-50%) translateY(12px);
  transition:opacity .18s ease,transform .18s ease;
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
}

.cb-visible{pointer-events:auto;}
.cb-visible .cb-backdrop{opacity:1;pointer-events:auto;}
.cb-visible .cb-panel{opacity:1;transform:translateX(-50%) translateY(0);}

/* ═══════════════════════════════════════════════════════════
   DESKTOP: Side-by-side layout (text left, buttons right)
   ═══════════════════════════════════════════════════════════ */
.cb-top{
  display:grid;
  grid-template-columns:1fr auto;
  gap:24px;
  align-items:center;
}

.cb-left{min-width:0;}
.cb-title{margin:0 0 8px;font-size:16px;font-weight:800;letter-spacing:.2px;}
.cb-text{margin:0;font-size:13px;line-height:1.55;color:var(--cb-muted);max-width:68ch;}

.cb-links{
  display:flex;
  flex-wrap:wrap;
  gap:12px;
  margin-top:12px;
}
.cb-links a{
  color:var(--cb-text);
  text-decoration:none;
  font-size:13px;
  border-bottom:1px dashed rgba(255,255,255,.22);
  transition:border-color .15s ease;
}
.cb-links a:hover{border-bottom-color:var(--cb-accent);}

.cb-actions{
  display:flex;
  flex-direction:column;
  gap:10px;
  min-width:200px;
}

.cb-btn{
  border:1px solid var(--cb-border);
  background:transparent;
  color:var(--cb-text);
  padding:11px 16px;
  border-radius:12px;
  font-size:13px;
  font-weight:700;
  cursor:pointer;
  white-space:nowrap;
  transition:background .15s ease, border-color .15s ease;
}
.cb-btn:hover{background:rgba(255,255,255,.05);}
.cb-btn-primary{
  background:#fff;
  color:#0b0f12;
  border-color:transparent;
}
.cb-btn-primary:hover{background:#e9eef3;}

/* ═══════════════════════════════════════════════════════════
   MOBILE: Stacked layout (text top, buttons below)
   ═══════════════════════════════════════════════════════════ */
@media (max-width: 840px){
  .cb-panel{
    bottom:12px;
    width:calc(100vw - 24px);
    padding:18px 16px;
    max-height:calc(100dvh - 24px);
    overflow-y:auto;
  }
  
  .cb-top{
    grid-template-columns:1fr;
    gap:18px;
  }
  
  .cb-actions{
    flex-direction:row;
    flex-wrap:wrap;
    gap:8px;
    min-width:0;
  }
  
  .cb-btn{
    flex:1 1 calc(50% - 4px);
    min-width:0;
    padding:12px 10px;
    text-align:center;
  }
  
  /* Primary button full width on its own row */
  .cb-btn-primary{
    flex:1 1 100%;
    order:1;
  }
  
  .cb-title{font-size:15px;}
  .cb-text{font-size:12.5px;}
}

/* Extra small screens: all buttons full width */
@media (max-width: 400px){
  .cb-actions{
    flex-direction:column;
  }
  .cb-btn{
    flex:1 1 100%;
  }
}

/* ═══════════════════════════════════════════════════════════
   ACCORDION / SETTINGS
   ═══════════════════════════════════════════════════════════ */
.cb-accordion{
  margin-top:16px;
  border-top:1px solid var(--cb-border);
  padding-top:14px;
  display:none;
}
.cb-accordion.open{display:block;}

.cb-acc-head{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:12px;
  flex-wrap:wrap;
}
.cb-acc-title{font-size:13px;font-weight:800;margin:0;}
.cb-acc-note{font-size:12px;color:var(--cb-muted);margin:0;}

.cb-grid{
  display:grid;
  grid-template-columns:repeat(2, 1fr);
  gap:10px;
}

@media (max-width: 600px){
  .cb-grid{grid-template-columns:1fr;}
}

.cb-card{
  border:1px solid var(--cb-border);
  border-radius:14px;
  padding:14px;
  background:rgba(255,255,255,.02);
}
.cb-card h4{margin:0 0 6px;font-size:13px;font-weight:700;}
.cb-card p{margin:0;font-size:12px;line-height:1.45;color:var(--cb-muted);}
.cb-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;}

.cb-switch{
  appearance:none;
  -webkit-appearance:none;
  width:44px;
  height:26px;
  border-radius:999px;
  background:rgba(255,255,255,.10);
  border:1px solid var(--cb-border);
  position:relative;
  cursor:pointer;
  flex-shrink:0;
  transition:background .15s ease, border-color .15s ease;
}
.cb-switch:before{
  content:"";
  position:absolute;
  top:50%;
  left:3px;
  width:18px;
  height:18px;
  border-radius:50%;
  transform:translateY(-50%);
  background:#fff;
  transition:left .16s ease;
}
.cb-switch:checked{
  background:rgba(0,255,217,.18);
  border-color:rgba(0,255,217,.40);
}
.cb-switch:checked:before{left:21px;}
.cb-switch:disabled{opacity:.6;cursor:not-allowed;}

.cb-togglelink{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-weight:700;
  font-size:13px;
}
.cb-caret{
  display:inline-block;
  transform:rotate(0deg);
  transition:transform .15s ease;
  opacity:.75;
  font-size:11px;
}
.cb-togglelink.open .cb-caret{transform:rotate(180deg);}

.cb-small{
  margin-top:12px;
  font-size:11px;
  color:var(--cb-muted);
}
`;
    document.head.appendChild(style);

    const div = document.createElement("div");
    div.id = "cb-root";
    div.innerHTML = `
<div class="cb-backdrop" data-cb-close></div>

<div class="cb-panel" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
  <div class="cb-top">
    <div class="cb-left">
      <h3 class="cb-title">Cookie-Einstellungen</h3>
      <p class="cb-text">
        Wir verwenden technisch notwendige Cookies für den Betrieb der Website.
        Mit Ihrer Zustimmung setzen wir zusätzlich Analyse- und Marketing-Cookies, um Nutzung zu verstehen und Inhalte zu verbessern.
      </p>

      <div class="cb-links">
        <a href="${PRIVACY_URL}" rel="nofollow">Datenschutz</a>
        <a href="${IMPRINT_URL}" rel="nofollow">Impressum</a>
        <a href="#" id="cb-toggle" class="cb-togglelink">Einstellungen <span class="cb-caret">▾</span></a>
      </div>

      <div class="cb-accordion" id="cb-accordion" aria-label="Cookie-Auswahl">
        <div class="cb-acc-head">
          <p class="cb-acc-title">Auswahl</p>
          <p class="cb-acc-note">Nicht notwendige Kategorien sind standardmäßig deaktiviert.</p>
        </div>

        <div class="cb-grid">
          <div class="cb-card">
            <div class="cb-row">
              <h4>Notwendig</h4>
              <input class="cb-switch" type="checkbox" checked disabled aria-label="Notwendige Cookies aktiviert">
            </div>
            <p>Erforderlich für grundlegende Funktionen (z.B. Sicherheit, Darstellung, Speicherung Ihrer Auswahl).</p>
          </div>

          <div class="cb-card">
            <div class="cb-row">
              <h4>Analyse</h4>
              <input class="cb-switch" type="checkbox" id="cb-analytics" aria-label="Analyse-Cookies">
            </div>
            <p>Hilft uns zu verstehen, wie die Website genutzt wird, um Inhalte & Performance zu verbessern.</p>
          </div>

          <div class="cb-card">
            <div class="cb-row">
              <h4>Marketing</h4>
              <input class="cb-switch" type="checkbox" id="cb-marketing" aria-label="Marketing-Cookies">
            </div>
            <p>Ermöglicht die Messung/Optimierung von Kampagnen sowie das Ausspielen relevanter Inhalte.</p>
          </div>

          <div class="cb-card">
            <div class="cb-row">
              <h4>Funktional</h4>
              <input class="cb-switch" type="checkbox" id="cb-functional" aria-label="Funktionale Cookies">
            </div>
            <p>Optionale Funktionen (z.B. eingebettete Inhalte). Nur falls Sie diese nutzen.</p>
          </div>
        </div>

        <div class="cb-small">
          Sie können Ihre Auswahl jederzeit über „Cookie-Einstellungen" ändern.
        </div>
      </div>
    </div>

    <div class="cb-actions">
      <button class="cb-btn" id="cb-reject">Ablehnen</button>
      <button class="cb-btn" id="cb-save">Auswahl speichern</button>
      <button class="cb-btn cb-btn-primary" id="cb-accept-all">Alle akzeptieren</button>
    </div>
  </div>
</div>
`;
    document.body.appendChild(div);
    root = div;

    bind();
    if (show) root.classList.add("cb-visible");
  }

  function sync(c) {
    $("#cb-analytics", root).checked = !!c.analytics;
    $("#cb-marketing", root).checked = !!c.marketing;
    $("#cb-functional", root).checked = !!c.functional;
  }

  function expand(force) {
    const acc = $("#cb-accordion", root);
    const link = $("#cb-toggle", root);
    const open = typeof force === "boolean" ? force : !acc.classList.contains("open");
    acc.classList.toggle("open", open);
    link.classList.toggle("open", open);
  }

  function hide() {
    root.classList.remove("cb-visible");
  }

  function openBannerAndSettings() {
    mount(true);
    const c = get() || { analytics: false, marketing: false, functional: false };
    sync(c);
    root.classList.add("cb-visible");
    expand(true);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const a = e.target?.closest?.(`a[href="${FOOTER_HASH}"]`);
      if (!a) return;
      e.preventDefault();
      openBannerAndSettings();
    });

    if (location.hash === FOOTER_HASH) {
      setTimeout(() => openBannerAndSettings(), 0);
    }

    $("[data-cb-close]", root).addEventListener("click", () => expand(false));

    $("#cb-toggle", root).addEventListener("click", (e) => {
      e.preventDefault();
      expand();
    });

    $("#cb-accept-all", root).addEventListener("click", () => {
      const c = set({ analytics: true, marketing: true, functional: true });
      sync(c);
      hide();
      runDeferred(c);
    });

    $("#cb-reject", root).addEventListener("click", () => {
      const c = set({ analytics: false, marketing: false, functional: false });
      sync(c);
      hide();
    });

    $("#cb-save", root).addEventListener("click", () => {
      const c = set({
        analytics: $("#cb-analytics", root).checked,
        marketing: $("#cb-marketing", root).checked,
        functional: $("#cb-functional", root).checked,
      });
      hide();
      runDeferred(c);
    });
  }

  window.ArqionCookie = {
    open: () => openBannerAndSettings(),
    get,
    reset: () => { localStorage.removeItem(KEY); mount(true); root.classList.add("cb-visible"); }
  };

  if (!existing) {
    mount(true);
  }
})();
