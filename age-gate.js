(function () {
  'use strict';
  var KEY = 'fp_age_ok';
  if (sessionStorage.getItem(KEY) || localStorage.getItem(KEY)) return;

  /* ── Styles ─────────────────────────────────────────────────────────── */
  var css = `
#fp-age-gate {
  position: fixed; inset: 0; z-index: 999999;
  display: flex; align-items: center; justify-content: center;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
#fp-age-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.72);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}
#fp-age-card {
  position: relative;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,175,240,0.18);
  padding: 40px 36px 36px;
  max-width: 420px;
  width: 100%;
  text-align: center;
  animation: fp-rise 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
}
@media (prefers-color-scheme: dark) {
  #fp-age-card { background: #1e1e2e; }
}
[data-theme="dark"] #fp-age-card { background: #1e1e2e; }
@keyframes fp-rise {
  from { opacity: 0; transform: translateY(24px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Logo */
#fp-age-logo {
  display: inline-flex; align-items: center; gap: 8px;
  margin-bottom: 22px;
}
#fp-age-logo-icon {
  width: 46px; height: 46px; border-radius: 12px;
  background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 16px rgba(0,175,240,0.4);
  flex-shrink: 0;
}
#fp-age-logo-icon svg { display: block; }
#fp-age-logo-name {
  font-size: 22px; font-weight: 800; letter-spacing: -0.3px;
  background: linear-gradient(135deg, #00AFF0, #0099D6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Badge */
#fp-age-badge {
  display: inline-flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
  color: #fff; font-size: 12px; font-weight: 700; letter-spacing: 0.8px;
  text-transform: uppercase; padding: 5px 12px; border-radius: 20px;
  margin-bottom: 18px; box-shadow: 0 2px 10px rgba(0,175,240,0.35);
}

/* Heading */
#fp-age-heading {
  font-size: 22px; font-weight: 800; line-height: 1.25;
  color: #111; margin: 0 0 14px;
}
[data-theme="dark"] #fp-age-heading, @media (prefers-color-scheme: dark) { #fp-age-heading { color: #e8e8e8; } }

/* Body text */
#fp-age-body {
  font-size: 14px; line-height: 1.65; color: #555; margin: 0 0 28px;
}
[data-theme="dark"] #fp-age-body { color: #aaa; }
#fp-age-body a { color: #00AFF0; text-decoration: none; font-weight: 600; }
#fp-age-body a:hover { text-decoration: underline; }

/* Buttons */
#fp-age-actions { display: flex; gap: 12px; }
#fp-age-enter {
  flex: 1; padding: 15px 20px; border: none; border-radius: 14px; cursor: pointer;
  background: linear-gradient(135deg, #00AFF0 0%, #0099D6 100%);
  color: #fff; font-size: 15px; font-weight: 700; letter-spacing: 0.2px;
  box-shadow: 0 4px 18px rgba(0,175,240,0.45);
  transition: transform 0.15s, box-shadow 0.15s;
}
#fp-age-enter:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,175,240,0.55); }
#fp-age-enter:active { transform: translateY(0); }
#fp-age-exit {
  flex: 1; padding: 15px 20px; border-radius: 14px; cursor: pointer;
  background: transparent;
  border: 2px solid #e0e0e0;
  color: #888; font-size: 15px; font-weight: 600;
  transition: border-color 0.15s, color 0.15s;
}
#fp-age-exit:hover { border-color: #bbb; color: #555; }
[data-theme="dark"] #fp-age-exit { border-color: #444; color: #888; }

/* Fine print */
#fp-age-fine {
  font-size: 11px; color: #aaa; margin-top: 18px; line-height: 1.5;
}
`;

  /* ── HTML ────────────────────────────────────────────────────────────── */
  var html = `
<div id="fp-age-gate" role="dialog" aria-modal="true" aria-labelledby="fp-age-heading">
  <div id="fp-age-backdrop"></div>
  <div id="fp-age-card">

    <div id="fp-age-logo">
      <div id="fp-age-logo-icon">
        <svg width="26" height="30" viewBox="0 0 48 60" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 2C13.5 2 5 10.7 5 21.5C5 31.5 14.5 43 22 52.2c1.1 1.4 2.9 1.4 4 0C33.5 43 43 31.5 43 21.5 43 10.7 34.5 2 24 2Z" fill="#fff"/>
          <text x="24" y="26" text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#0099D6">F</text>
        </svg>
      </div>
      <span id="fp-age-logo-name">FansPedia</span>
    </div>

    <div id="fp-age-badge">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Age Verification Required
    </div>

    <h2 id="fp-age-heading">This site contains adult content</h2>

    <p id="fp-age-body">
      FansPedia is intended for adults aged <strong>18 years or older</strong>. By entering, you confirm you meet the age requirement and agree to our
      <a href="/terms" target="_blank" rel="noopener">Terms of Service</a> and
      <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a>.
    </p>

    <div id="fp-age-actions">
      <button id="fp-age-enter" type="button">I&rsquo;m 18+ &mdash; Enter</button>
      <button id="fp-age-exit"  type="button">Exit</button>
    </div>

    <p id="fp-age-fine">We use a cookie to remember your choice for 30 days.</p>
  </div>
</div>
`;

  /* ── Inject ──────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstElementChild);

  /* ── Dark mode text fix (runtime) ───────────────────────────────────── */
  var isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    || window.matchMedia('(prefers-color-scheme:dark)').matches;
  if (isDark) {
    var card = document.getElementById('fp-age-card');
    if (card) {
      document.getElementById('fp-age-heading').style.color = '#e8e8e8';
      document.getElementById('fp-age-body').style.color = '#aaa';
    }
  }

  /* ── Handlers ────────────────────────────────────────────────────────── */
  function dismiss() {
    var gate = document.getElementById('fp-age-gate');
    if (!gate) return;
    gate.style.transition = 'opacity 0.25s';
    gate.style.opacity = '0';
    setTimeout(function () { gate.remove(); }, 260);
    localStorage.setItem(KEY, '1'); // remember for 30 days (cleared on browser data clear)
    sessionStorage.setItem(KEY, '1');
  }

  document.getElementById('fp-age-enter').addEventListener('click', dismiss);

  document.getElementById('fp-age-exit').addEventListener('click', function () {
    window.location.href = 'https://www.google.com';
  });

  /* Trap focus inside modal */
  document.getElementById('fp-age-gate').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { window.location.href = 'https://www.google.com'; }
  });
})();
