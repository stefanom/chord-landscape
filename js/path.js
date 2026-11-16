/* Chord Landscape. The path of chords you have built: the cursor, playback, undo, and the edits that change it. */
'use strict';

/* ===== the path and the cursor ===== */
let CUR = 0, timer = null;
const cur = () => S.path[CUR];
const nowIdx = () => (S.playing >= 0 ? S.playing : CUR); // while a path plays, the chord that sounds is the one every view shows
const beat = () => 120 / S.tempo;
function stop() { clearTimeout(timer); timer = null; S.playing = -1; $('#play').innerHTML = '▶<span> Play</span>'; paintPath(); drawKeys(); paintHere(); drawMap(); }
function play(from) {
  if (timer) return stop();
  const V = voicings(S.path);
  $('#play').innerHTML = '■<span> Stop</span>';
  const step = i => {
    if (i >= S.path.length) { if (S.loop && S.path.length > 1) return step(0); return stop(); }
    S.playing = i; Snd.chord(V[i], beat() * 0.95); paintPath(); drawKeys(); paintHere(); drawMap();
    timer = setTimeout(() => step(i + 1), beat() * 1000);
  };
  step(typeof from === 'number' ? from : 0);
}
function hear(i) { const V = voicings(S.path); Snd.chord(V[i], 1.6); }
const HIST = [];
function snap() { HIST.push(JSON.stringify({ key: S.key, mode: S.mode, rich: S.rich, path: S.path, cur: CUR })); if (HIST.length > 60) HIST.shift(); }
function undo() {
  const h = HIST.pop(); if (!h) return;
  if (timer) stop();
  const o = JSON.parse(h); S.key = o.key; S.mode = o.mode; S.rich = o.rich; S.path = o.path; CUR = o.cur; S.focus = null;
  $('#key').value = String(S.key); render();
}
function removeAt(i) {
  if (S.path.length < 2) return;
  snap(); if (timer) stop();
  S.path.splice(i, 1);
  CUR = Math.max(0, Math.min(i <= CUR ? CUR - 1 : CUR, S.path.length - 1));
  S.focus = null; render(); hear(CUR);
}
/* Move: from the last chord it adds a step; from an earlier chord it replaces the step that followed. */
function go(c, via) {
  snap(); if (timer) stop();
  const x = entry(Object.assign({}, c, { via: via || '' }));
  if (CUR === S.path.length - 1) { S.path.push(x); if (S.path.length > 24) S.path.shift(); CUR = S.path.length - 1; } else { S.path[CUR + 1] = x; CUR += 1; }
  S.focus = null; render(); hear(CUR);
}
const entry = c => { const x = { r: c.r, q: c.q, via: c.via || '' }; if (c.b != null && c.b !== c.r) x.b = c.b; if (c.v) x.v = { rh: c.v.rh.slice(), bass: c.v.bass }; return x; };
function setPath(list, cursor) { if (timer) stop(); S.path = list.map(entry); CUR = cursor == null ? S.path.length - 1 : cursor; S.focus = null; render(); }
const DRESSED = ['', 'm', 'dim', 'maj7', 'm7', '7', 'ø', 'm6', 'o7'];
function redress(c) {            // Triads <-> Sevenths: only plain chords change, and a changed chord gives up its exact fingering
  if (c.b != null || !DRESSED.includes(c.q)) return c;
  const sk = skey(c); if (!RICH[S.mode][sk]) return c;
  const o = Object.assign({}, c, sp(sk)); if (o.q !== c.q) delete o.v;
  return o;
}
function shiftChord(c, d) {       // the same step in another key
  const o = Object.assign({}, c, { r: mod(c.r + d) });
  if (c.b != null) o.b = mod(c.b + d);
  if (c.v) { const s = d > 6 ? d - 12 : d < -6 ? d + 12 : d; let rh = c.v.rh.map(m => m + s); if (rh[rh.length - 1] > 79) rh = rh.map(m => m - 12); else if (rh[0] < 52) rh = rh.map(m => m + 12); o.v = { rh, bass: nearTo(mod(c.v.bass + s), 43) }; }
  return o;
}
/* add a run of steps after the current chord (replacing the step that followed, as a single move does) and play it through */
function addSteps(steps) {
  if (!steps.length) return;
  snap(); if (timer) stop();
  const at = CUR, list = steps.map(entry);
  if (CUR === S.path.length - 1) S.path.push(...list); else S.path.splice(CUR + 1, 1, ...list);
  CUR = at + list.length;
  while (S.path.length > 32) { S.path.shift(); CUR--; }
  S.focus = null; render();
  if (list.length > 1) play(Math.max(0, CUR - list.length)); else hear(CUR);
}
