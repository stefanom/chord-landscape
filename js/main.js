/* Chord Landscape. Drawing everything, wiring the controls, and starting up. */
'use strict';

/* ===== render and wiring ===== */
const fitNow = () => document.documentElement.style.setProperty('--nowh', $('#now').offsetHeight + 'px');
window.addEventListener('resize', fitNow);
function render() {
  paintHere(); paintPath(); drawKeys(); paintCompass(); drawMap(); drawWeave(); drawProfile(); fitNow();
  $('#undo').disabled = !HIST.length;
  press('#mode-major', () => S.mode === 'major'); press('#mode-minor', () => S.mode === 'minor');
  press('#rich-off', () => !S.rich); press('#rich-on', () => S.rich); press('#loop', () => S.loop); press('#scale8', () => S.scale8);
  press('#lens-tabs .btn', b => b.dataset.lens === S.lens); press('#wlen .btn', b => Number(b.dataset.n) === S.wlen);
}
['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'].forEach((n, i) => { const o = document.createElement('option'); o.value = i; o.textContent = n; $('#key').append(o); });
$('#key').addEventListener('change', e => { snap(); const k = Number(e.target.value), d = k - S.key; S.key = k; setPath(S.path.map(c => shiftChord(c, d)), CUR); hear(CUR); });
const setMode = m => { if (S.mode !== m) { snap(); S.mode = m; setPath([home()]); hear(0); } };
$('#mode-major').addEventListener('click', () => setMode('major'));
$('#mode-minor').addEventListener('click', () => setMode('minor'));
const setRich = on => { if (S.rich === on) return; snap(); S.rich = on; setPath(S.path.map(redress), CUR); hear(CUR); };
$('#rich-off').addEventListener('click', () => setRich(false));
$('#rich-on').addEventListener('click', () => setRich(true));
$('#play').addEventListener('click', () => play());
$('#rehome').addEventListener('click', rehome);
$('#scale8').addEventListener('click', () => { S.scale8 = !S.scale8; render(); });
$('#loop').addEventListener('click', () => { S.loop = !S.loop; render(); });
$('#undo').addEventListener('click', undo);
$('#clear').addEventListener('click', () => { snap(); setPath([home()]); });
$('#tempo').addEventListener('input', e => { S.tempo = Number(e.target.value); });
$('#lens-tabs').addEventListener('click', e => { const b = e.target.closest('[data-lens]'); if (b) { S.lens = b.dataset.lens; render(); } });
$('#wlen').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if (b) { S.wlen = Number(b.dataset.n); render(); } });
$('#wander').addEventListener('click', () => {
  snap(); const p = wander(Number($('#adv').value), S.wlen); setPath(p);
  $('#wander-out').innerHTML = p.map(c => `<b>${esc(cname(c))}</b> <span>(${esc(c.via)})</span>`).join(' → '); play();
});
$('#seeds').innerHTML = SEEDS.map((s, i) => `<button class="seed" data-seed="${i}"><b>${esc(s[0])}</b><span>${esc(s[2].replace(/ /g, ' – '))} · ${s[1]}</span><span>${esc(s[3])}</span></button>`).join('');
$('#seeds').addEventListener('click', e => { const b = e.target.closest('[data-seed]'); if (b) { const s = SEEDS[Number(b.dataset.seed)]; loadSeq(s[1], s[2]); } });
$('#deal').addEventListener('click', () => { dareAt = (dareAt + 1 + Math.floor(Math.random() * (DARES.length - 1))) % DARES.length; paintDare(); });
$('#dare-setup').addEventListener('click', () => { const d = DARES[dareAt][2]; if (!d) return; if (typeof d === 'function') d(); else loadSeq(d[0], d[1]); $('#now').scrollIntoView({ behavior: 'smooth' }); });
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'), f = e.target.closest('[data-focus]'), ch = e.target.closest('[data-i]'), del = e.target.closest('[data-del]');
  const nd = e.target.closest('[data-nudge]'), act = e.target.closest('[data-act]');
  if (nd) { const [k, d] = nd.dataset.nudge.split(',').map(Number); nudge(k, d); }
  else if (act) { const run = ACTS[Number(act.dataset.act)]; if (run) run(); }
  else if (del) removeAt(Number(del.dataset.del));
  else if (g) { const [r, q] = g.dataset.go.split(','), c = { r: Number(r), q }; const d = DEST.find(x => same(x.c, c)); go(c, g.dataset.via || (d ? d.gname.toLowerCase() : 'map')); }
  else if (f) { S.focus = S.focus === f.dataset.focus ? null : f.dataset.focus; paintCompass(); drawMap(); }
  else if (ch) { if (timer) stop(); CUR = Number(ch.dataset.i); S.focus = null; render(); hear(CUR); }
});
/* hovering a finger's arrow says what the move would make */
$('#voices').addEventListener('mouseover', e => { const b = e.target.closest('[data-nudge]'); if (b && b.title) $('#lead').textContent = b.title; });
$('#voices').addEventListener('mouseout', e => { if (e.target.closest('[data-nudge]')) $('#lead').textContent = LEAD; });
/* the keyboard is playable: press, hold and slide across the keys */
(() => {
  const K = $('#keys'), held = new Map();
  const keyAt = e => { const t = document.elementFromPoint(e.clientX, e.clientY); return t && t.dataset && t.dataset.m ? t : null; };
  const strike = (id, el) => {
    if (!el || held.get(id) === el) return;
    const was = held.get(id); if (was) was.classList.remove('hit');
    held.set(id, el); el.classList.add('hit'); Snd.note(Number(el.dataset.m), 1.5);
  };
  const lift = e => { const el = held.get(e.pointerId); if (el) el.classList.remove('hit'); held.delete(e.pointerId); };
  K.addEventListener('pointerdown', e => { const el = keyAt(e); if (el) { e.preventDefault(); strike(e.pointerId, el); } });
  K.addEventListener('pointermove', e => { if (held.has(e.pointerId)) strike(e.pointerId, keyAt(e)); });
  ['pointerup', 'pointercancel'].forEach(t => window.addEventListener(t, lift));
})();
/* Delete or Backspace removes the selected chord; Ctrl/Cmd+Z undoes */
document.addEventListener('keydown', e => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target && e.target.tagName) || '')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeAt(CUR); }
  else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
});
['pointerdown', 'keydown'].forEach(t => window.addEventListener(t, () => Snd.warm(), { once: true, capture: true }));
Snd.prefetch();
S.path = [Object.assign({ via: 'home' }, home())];
paintDare(); render();
/* a handle for the tests and for poking around in the console */
window.chordLandscape = { Snd, S, moves, wander, sp, cname, numeral, fn, ring, lift, setPath, go, voicings, identify, nameVoices, nudge, slipSteps, walkStep, walkScale, addSteps, DRILLS, home };
