/* Chord Landscape. Moving single voices: one finger a half step, slipping to a chord by half steps, and the sixth-diminished walk. */
'use strict';

/* ===== voices: move one finger a half step (voice 0 is the bass, 1.. the right hand from low to high) ===== */
const voicesNow = () => voicings(S.path)[CUR];
function nudged(k, d, v) {
  v = v || voicesNow();
  const rh = v.rh.slice(); let bass = v.bass;
  if (k === 0) { bass += d; if (bass < 36 || bass > 50 || bass >= rh[0]) return null; }
  else { const m = rh[k - 1] + d; if (m < 52 || m > 79 || rh.includes(m)) return null; rh[k - 1] = m; }
  return Object.assign(nameVoices(bass, rh), { v: { rh, bass } });
}
function nudge(k, d) { const c = nudged(k, d); if (c) go(c, (k ? 'one finger ' : 'the bass ') + (d > 0 ? 'up' : 'down') + ' a half step'); }

/* ----- slip to a chord one finger and one half step at a time (Chopin's E minor Prelude) ----- */
function slipSteps(T) {
  const v0 = voicesNow(), A = v0.rh, n = A.length, P = [...new Set(pcs(T))];
  // where each finger ends up: a note of the target as near as possible, every target note covered when there are fingers enough.
  // With more fingers than notes, two neighbours may end on the same key: the spare finger simply lifts.
  const opts = A.map(a => P.map(p => nearTo(p, a))), idx = new Array(n).fill(0), need = Math.min(P.length, n);
  let best = null;
  (function rec(i) {
    if (i === n) {
      const B = idx.map((j, k) => opts[k][j]);
      if (B.some((b, k) => k && b < B[k - 1]) || B[0] < 52 || B[n - 1] > 79) return;      // fingers never cross
      const merges = B.filter((b, k) => k && b === B[k - 1]).length;
      if (merges > n - P.length) return;
      const cost = B.reduce((t, b, k) => t + Math.abs(b - A[k]) + (b > A[k] ? 0.2 : 0), 0) + (need - new Set(idx).size) * 20 + merges * 0.5;
      if (!best || cost < best.cost) best = { cost, B };
      return;
    }
    for (let j = 0; j < P.length; j++) { idx[i] = j; rec(i + 1); }
  })(0);
  if (!best) return null;
  const B = best.B, rem = B.map((b, k) => b - A[k]), cur = A.slice(), steps = [], uniq = a => [...new Set(a)].sort((x, y) => x - y);
  let bT = nearTo(T.b != null ? T.b : T.r, v0.bass); if (bT < 36) bT += 12; if (bT > 50) bT -= 12;
  let bass = v0.bass, bd = bT - bass; const bassWalks = Math.abs(bd) === 1;      // a half step in the bass is one of the moves; anything wider lands with the last one
  const total = rem.reduce((t, d) => t + Math.abs(d), 0) + (bassWalks ? 1 : 0);
  if (total < 2 || total > 5) return null;
  const rough = (rh, b) => rh.reduce((t, m, i) => t + (i && m - rh[i - 1] === 1 ? 2 : 0) + (mod(m - b) === 1 ? 1.5 : 0), 0);
  let last = null;
  for (let guard = 0; guard < 12; guard++) {
    const cands = rem.map((d, k) => (d ? k : -1)).filter(k => k >= 0);
    if (bassWalks && bd) cands.push('b');
    if (!cands.length) break;
    let pick = null;
    cands.forEach(k => {
      const rh = cur.slice(); let b = bass;
      if (k === 'b') b += Math.sign(bd);
      else {
        rh[k] += Math.sign(rem[k]);
        const hit = rh.findIndex((m, j2) => j2 !== k && m === rh[k]);
        if (hit >= 0 && !(rh[k] === B[k] && cur[hit] === B[hit])) return;       // that key is taken: another finger goes first (unless both end there)
      }
      const c = nameVoices(b, uniq(rh)), left = k === 'b' ? 1 : Math.abs(rem[k]);
      const score = (c.q[0] === 'x' ? 3 : 0) + (c.b != null ? 0.6 : 0) + rough(uniq(rh), b) - 0.3 * left + (k === last ? 0.5 : 0);
      if (!pick || score < pick.score) pick = { score, k, rh, b, c };
    });
    if (!pick) break;
    if (pick.k === 'b') { bass = pick.b; bd -= Math.sign(bd); } else { cur[pick.k] = pick.rh[pick.k]; rem[pick.k] -= Math.sign(rem[pick.k]); }
    last = pick.k;
    steps.push(Object.assign(pick.c, { v: { rh: uniq(pick.rh), bass: pick.b }, via: 'slip by half steps' }));
  }
  if (!steps.length || rem.some(d => d)) return null;
  // the last move lands the chord: the bass takes the new root and any note still missing is added
  const extra = P.filter(p => !cur.some(m => mod(m) === p)).map(p => nearTo(p, avg(cur)));
  const fin = { r: T.r, q: T.q, v: { rh: uniq(cur.concat(extra)), bass: bT }, via: 'slip by half steps' };
  if (T.b != null) fin.b = T.b;
  steps[steps.length - 1] = fin;
  return steps;
}

/* ----- home and pull: Barry Harris's eight-note scale, a sixth chord and the diminished chord beside it ----- */
function sixOf(c) {              // the sixth chord these notes spell (C6 and Am7 are the same four notes), or null
  const P = [...new Set(pcs(c))]; if (P.length !== 4) return null;
  for (const x of P) { if ([0, 4, 7, 9].every(iv => P.includes(mod(x + iv)))) return { x, minor: false }; if ([0, 3, 7, 9].every(iv => P.includes(mod(x + iv)))) return { x, minor: true }; }
  return null;
}
function walkScale() {           // the eight-note scale the current chord sits in: { x, minor } or null
  const c = cur(); let s = sixOf(c);
  if (s) return s;
  if (c.q !== 'o7') return null;
  const Dm = pcs(c);
  for (let i = CUR - 1; i >= 0; i--) { s = sixOf(S.path[i]); if (s && Dm.includes(mod(s.x + 2))) return s; }
  const h = { x: S.key, minor: S.mode === 'minor' };
  return Dm.includes(mod(h.x + 2)) ? h : { x: mod(c.r + 1), minor: false };
}
const scale8 = sc => (sc.minor ? [0, 2, 3, 5, 7, 8, 9, 11] : [0, 2, 4, 5, 7, 8, 9, 11]).map(iv => mod(sc.x + iv));
const sixTones = sc => [0, sc.minor ? 3 : 4, 7, 9].map(iv => mod(sc.x + iv));
function walkStep(sc, dir, v) {  // every voice moves to the next note of the scale: sixth chord -> diminished -> sixth chord
  v = v || voicesNow();
  const S8 = scale8(sc), six = sixTones(sc), rp = v.rh.map(m => mod(m));
  if (v.rh.length < 3 || !rp.every(p => S8.includes(p))) return null;
  if (!rp.every(p => six.includes(p)) && !rp.every(p => !six.includes(p))) return null;
  const st = m => { let x = m + dir; while (!S8.includes(mod(x))) x += dir; return x; };
  const rh = v.rh.map(st);
  if (rh[0] < 52 || rh[rh.length - 1] > 79) return null;
  let bass = S8.includes(mod(v.bass)) ? st(v.bass) : v.bass;
  if (bass > 50) bass -= 12; if (bass < 36) bass += 12;
  return Object.assign(nameVoices(bass, rh), { v: { rh, bass }, via: dir > 0 ? 'walk up the eight-note scale' : 'walk down the eight-note scale' });
}
function rehome() {              // the chord you are on becomes the key: the maps redraw around it, the notes stay where they are
  const c = cur(); snap(); if (timer) stop();
  S.key = c.r; S.mode = KIND(c.q) === 'min' ? 'minor' : 'major'; $('#key').value = String(S.key); S.focus = null; render();
}
