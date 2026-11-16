/* Chord Landscape. Light and dark. */
'use strict';

/* ===== light / dark: follows the system setting unless you choose one here ===== */
const SCHEME = { choice: null, key: 'chord-landscape-scheme' };
try { SCHEME.choice = localStorage.getItem(SCHEME.key); } catch (e) { /* no storage (a sandboxed frame): the choice is not remembered */ }
const systemScheme = () => (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
function applyScheme() {
  if (SCHEME.choice !== 'light' && SCHEME.choice !== 'dark') SCHEME.choice = null;
  const t = SCHEME.choice || systemScheme();
  document.documentElement.setAttribute('data-scheme', t);
  press('#theme .btn', b => b.dataset.setTheme === t);
}
$('#theme').addEventListener('click', e => {
  const b = e.target.closest('[data-set-theme]'); if (!b) return;
  SCHEME.choice = b.dataset.setTheme === systemScheme() ? null : b.dataset.setTheme;   // picking the system's own mode goes back to following it
  applyScheme();
  try { if (SCHEME.choice) localStorage.setItem(SCHEME.key, SCHEME.choice); else localStorage.removeItem(SCHEME.key); } catch (e2) { /* not remembered */ }
});
if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').addEventListener) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyScheme);
applyScheme();
