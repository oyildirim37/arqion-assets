(() => {
  const KEY = "arqion_cookie_consent_v3";
  const $ = (s, r = document) => r.querySelector(s);

  const get = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
  const set = (c) => {
    const payload = {
      version: 3,
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
    const allow = { analytics: consent.analytics, marketing: consent.marketing, functional: consent.functional };
    document.querySelectorAll('script[type="text/plain"][data-cookiecat]').forEach((node) => {
      const cat = node.getAttribute("data-cookiecat");
      if (!cat || !allow[cat]) return;
      const s = document.createElement("script");
      [...node.attributes].forEach(a => {
        if (a.name === "type" || a.name === "data-cookiecat") return;
        s.setAttribute(a.name, a.value);
      });
      s.text = node.text || node.textContent || "";
      node.parentNode.insertBefore(s, node);
      node.remove();
    });
  };

  // Public API for footer link
  window.ArqionCookie = {
    open: () => {
      const c = get() || { analytics: false, marketing: false, functional: false };
      mount(true);
      sync(c);
      openPrefs();
    },
    get,
    reset: () => { localStorage.removeItem(KEY); mount(true); }
  };

  // If consent exists, just apply it
  const existing = get();
  if (existing) { runDeferred(existing); return; }

  // Inject styles + UI
  let mounted = false;

  function mount(showBanner = true) {
    if (mounted) { if (showBanner) root.classList.add("cb-visible"); return; }
    mounted = true;

    const style = document.createElement("style");
    style.textContent = `
:root{--cb-bg:#0b0f12;--cb-surface:#0f1419;--cb-text:#e9eef3;--cb-muted:#9aa7b4;--cb-border:rgba(255,255,255,.12);--cb-accent:#00FFD9;--cb-radius:16px;--cb-shadow:0 20px 60px rgba(0,0,0,.60);--cb-font:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;}
#cb-root{position:fixed;inset:0;z-index:99999;pointer-events:none;font-family:var(--cb-font);}
.cb-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.35);opacity:0;transition:opacity .18s ease;}
.cb-panel{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);width:min(980px,calc(100vw - 28px));background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));border:1px solid var(--cb-border);border-radius:var(--cb-radius);box-shadow:var(--cb-shadow);padding:18px 18px 16px;color:var(--cb-text);pointer-events:auto;opacity:0;transform:translateX(-50%) translateY(12px);transition:opacity .18s ease,transform .18s ease;backdrop-filter:blur(10px);}
.cb-visible{pointer-events:auto;}
.cb-visible .cb-backdrop{opacity:1;pointer-events:auto;}
.cb-visible .cb-panel{opacity:1;transform:translateX(-50%) translateY(0);}
.cb-top{display:flex;gap:14px;align-items:flex-start;justify-content:space-between;}
.cb-title{margin:0 0 6px;font-size:16px;font-weight:800;letter-spacing:.2px;}
.cb-text{margin:0;font-size:13px;line-height:1.5;color:var(--cb-muted);max-width:70ch;}
.cb-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;}
.cb-links a{color:var(--cb-text);text-decoration:none;border-bottom:1px dashed rgba(255,255,255,.22);}
.cb-links a:hover{border-bottom-color:var(--cb-accent);}
.cb-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;align-items:center;margin-top:14px;}
.cb-btn{border:1px solid var(--cb-border);background:transparent;color:var(--cb-text);padding:10px 12px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;}
.cb-btn-primary{background:#fff;color:#0b0f12;border-color:transparent;}
.cb-small{margin-top:10px;font-size:12px;color:var(--cb-muted);}
.cb-modal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(840px,calc(100vw - 28px));background:var(--cb-surface);border:1px solid var(--cb-border);border-radius:var(--cb-radius);box-shadow:var(--cb-shadow);padding:18px;display:none;pointer-events:auto;}
.cb-modal-visible .cb-modal{display:block;}
.cb-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
.cb-x{border:1px solid var(--cb-border);background:transparent;color:var(--cb-text);width:38px;height:38px;border-radius:12px;cursor:pointer;}
.cb-grid{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px;}
@media(min-width:760px){.cb-grid{grid-template-columns:1fr 1fr;}}
.cb-card{border:1px solid var(--cb-border);border-radius:14px;padding:14px;background:rgba(255,255,255,.02);}
.cb-card h4{margin:0 0 6px;font-size:14px;}
.cb-card p{margin:0 0 10px;font-size:12.5px;line-height:1.45;color:var(--cb-muted);}
.cb-row{display:flex;align-items:center;justify-content:space-between;gap:12px;}
.cb-switch{appearance:none;width:46px;height:28px;border-radius:999px;background:rgba(255,255,255,.10);border:1px solid var(--cb-border);position:relative;cursor:pointer;}
.cb-switch:before{content:"";position:absolute;top:50%;left:4px;width:20px;height:20px;border-radius:50%;transform:translateY(-50%);background:#fff;transition:left .16s ease;}
.cb-switch:checked{background:rgba(0,255,217,.18);border-color:rgba(0,255,217,.40);}
.cb-switch:checked:before{left:22px;}
.cb-switch:disabled{opacity:.6;cursor:not-allowed;}
.cb-foot{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;margin-top:14px;}
`;
    document.head.appendChild(style);

    const div = document.createElement("div");
    div.id = "cb-root";
    div.innerHTML = `
<div class="cb-backdrop" data-cb-close></div>

<div class="cb-panel" role="dialog" aria-modal="true" aria-label="Cookie-Einstellungen">
  <div class="cb-top">
    <div>
      <h3 class="cb-title">Cookie-Einstellungen</h3>
      <p class="cb-text">
        Wir verwenden technisch notwendige Cookies für den Betrieb der Website.
        Mit Ihrer Zustimmung setzen wir zusätzlich Analyse- und Marketing-Cookies, um Nutzung zu verstehen und Inhalte zu verbessern.
      </p>
      <div class="cb-links">
        <a href="/datenschutz" rel="nofollow">Datenschutz</a>
        <a href="/impressum" rel="nofollow">Impressum</a>
        <a href="#" id="cb-open-prefs">Einstellungen</a>
      </div>
      <div class="cb-small">Sie können Ihre Auswahl jederzeit über „Cookie-Einstellungen“ ändern.</div>
    </div>

    <div class="cb-actions">
      <button class="cb-btn" id="cb-reject">Ablehnen</button>
      <button class="cb-btn" id="cb-save">Auswahl speichern</button>
      <button class="cb-btn cb-btn-primary" id="cb-accept-all">Alle akzeptieren</button>
    </div>
  </div>
</div>

<div class="cb-modal" role="dialog" aria-modal="true" aria-label="Cookie-Präferenzen">
  <div class="cb-modal-head">
    <div>
      <h3 class="cb-title" style="margin:0 0 6px;">Cookie-Präferenzen</h3>
      <p class="cb-text" style="margin:0;">
        Wählen Sie aus, welche Kategorien wir verwenden dürfen. Notwendige Cookies sind erforderlich.
      </p>
    </div>
    <button class="cb-x" id="cb-close-prefs" aria-label="Schließen">✕</button>
  </div>

  <div class="cb-grid">
    <div class="cb-card">
      <div class="cb-row">
        <h4>Notwendig</h4>
        <input class="cb-switch" type="checkbox" checked disabled aria-label="Notwendige Cookies aktiviert">
      </div>
      <p>Erforderlich für grundlegende Funktionen (z. B. Sicherheit, Darstellung, Speicherung Ihrer Auswahl).</p>
    </div>

    <div class="cb-card">
      <div class="cb-row">
        <h4>Analyse</h4>
        <input class="cb-switch" type="checkbox" id="cb-analytics" aria-label="Analyse-Cookies">
      </div>
      <p>Hilft uns zu verstehen, wie die Website genutzt wird (z. B. Seitenaufrufe), um Inhalte & Performance zu verbessern.</p>
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
      <p>Optionale Funktionen (z. B. eingebettete Inhalte). Nur falls Sie diese nutzen.</p>
    </div>
  </div>

  <div class="cb-foot">
    <button class="cb-btn" id="cb-prefs-reject">Ablehnen</button>
    <button class="cb-btn cb-btn-primary" id="cb-prefs-save">Auswahl speichern</button>
  </div>
</div>
`;
    document.body.appendChild(div);

    root = div;
    bind();
    if (showBanner) root.classList.add("cb-visible");
  }

  let root;

  function sync(c) {
    $("#cb-analytics", root).checked = !!c.analytics;
    $("#cb-marketing", root).checked = !!c.marketing;
    $("#cb-functional", root).checked = !!c.functional;
  }

  function openPrefs(){ root.classList.add("cb-modal-visible"); }
  function closePrefs(){ root.classList.remove("cb-modal-visible"); }
  function hide(){ root.classList.remove("cb-visible"); closePrefs(); }

  function bind() {
    $("#cb-open-prefs", root).addEventListener("click", (e) => { e.preventDefault(); openPrefs(); });
    $("#cb-close-prefs", root).addEventListener("click", () => closePrefs());
    $("[data-cb-close]", root).addEventListener("click", () => closePrefs());

    $("#cb-accept-all", root).addEventListener("click", () => {
      const c = set({ analytics:true, marketing:true, functional:true });
      sync(c); hide(); runDeferred(c);
    });

    $("#cb-reject", root).addEventListener("click", () => {
      const c = set({ analytics:false, marketing:false, functional:false });
      sync(c); hide();
    });

    $("#cb-save", root).addEventListener("click", () => {
      const c = set({
        analytics: $("#cb-analytics", root).checked,
        marketing: $("#cb-marketing", root).checked,
        functional: $("#cb-functional", root).checked
      });
      hide(); runDeferred(c);
    });

    $("#cb-prefs-reject", root).addEventListener("click", () => {
      const c = set({ analytics:false, marketing:false, functional:false });
      sync(c); hide();
    });

    $("#cb-prefs-save", root).addEventListener("click", () => {
      const c = set({
        analytics: $("#cb-analytics", root).checked,
        marketing: $("#cb-marketing", root).checked,
        functional: $("#cb-functional", root).checked
      });
      hide(); runDeferred(c);
    });
  }

  // Mount immediately (no consent yet)
  mount(true);
})();
