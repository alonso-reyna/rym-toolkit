window.__store = {};
// The Spotify play request has to survive the jump from a RYM fixture to a Spotify fixture (same origin).
const PERSISTED = k => /spotify_play/.test(k);
try {
  for (const [k, v] of Object.entries(JSON.parse(localStorage.getItem('__gm') || '{}'))) window.__store[k] = v;
} catch (e) { /* ignore */ }
const persist = () => {
  const keep = Object.fromEntries(Object.entries(window.__store).filter(([k]) => PERSISTED(k)));
  try { localStorage.setItem('__gm', JSON.stringify(keep)); } catch (e) { /* ignore */ }
};
window.GM_getValue = (k, d) => (k in window.__store ? window.__store[k] : d);
window.GM_setValue = (k, v) => { window.__store[k] = v; if (PERSISTED(k)) persist(); };
window.GM_addStyle = css => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); };
window.__errors = [];
window.addEventListener('error', e => window.__errors.push(e.message));
