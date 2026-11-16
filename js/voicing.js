/* Chord Landscape. How a chord is laid out on the keys: the left hand takes the bass, the right hand moves as little as it can. */
'use strict';

/* ===== voicing: left hand takes the root, right hand moves as little as it can ===== */
const nearTo = (pc, t) => { t = Math.round(t); let m = t - mod(t - pc); if (t - m > 6) m += 12; return m; };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
function voice(c, prev) {
  const P = [...new Set(pcs(c))], bass = nearTo(c.b != null ? c.b : c.r, 43);
  if (!prev) return { rh: P.map(p => nearTo(p, 64)).sort((a, b) => a - b), bass };
  // try each note in the octave just below and just above the hand, and keep the shape that moves the fingers least
  const ctr = 0.7 * avg(prev.rh) + 0.3 * 64, opts = P.map(p => { const m = nearTo(p, ctr); return [m, m > ctr ? m - 12 : m + 12]; });
  const near = (m, arr) => Math.min(...arr.map(x => Math.abs(x - m)));
  let best = null;
  for (let mask = 0; mask < (1 << P.length); mask++) {
    const v = opts.map((o, k) => o[(mask >> k) & 1]).sort((a, b) => a - b), span = v[v.length - 1] - v[0];
    if (span > 14 || v[0] < 52 || v[v.length - 1] > 79) continue;
    const cost = v.reduce((t, m) => t + near(m, prev.rh), 0) + prev.rh.reduce((t, m) => t + near(m, v), 0) + 0.15 * Math.abs(avg(v) - 64) + 0.05 * span;
    if (!best || cost < best.cost) best = { cost, v };
  }
  return { rh: best ? best.v : P.map(p => nearTo(p, 64)).sort((a, b) => a - b), bass };
}
/* a step you made by moving fingers keeps the exact notes you left it on (c.v); other steps are voiced from the one before */
function voicings(path) { let p = null; return path.map(c => (p = c.v ? { rh: c.v.rh.slice(), bass: c.v.bass } : voice(c, p))); }
