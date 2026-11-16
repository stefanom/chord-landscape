/* Chord Landscape. Three maps of the same place: Roads (jobs), Wheel (circle of fifths) and Lattice (the tonnetz). */
'use strict';

/* ===== three maps of the same place ===== */
let DEST = [];
const shown = () => { if (S.playing >= 0) return []; const seen = new Set(); return DEST.filter(x => (!S.focus || x.gid === S.focus) && !seen.has(x.c.r + x.c.q) && seen.add(x.c.r + x.c.q)); };
const goAttr = c => `data-go="${c.r},${esc(c.q)}"`;
const pathPts = pts => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
const ARROW = '<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto"><path d="M0,0L10,5L0,10z" fill="context-stroke"/></marker></defs>';
function trail(pts, pad) {
  // At rest: the last few steps, the newest boldest. While playing: the whole path, with the step into the sounding chord bold.
  const n = pts.length, at = nowIdx(), live = S.playing >= 0, first = live ? 1 : Math.max(1, n - 6);
  let s = '', top = '';
  const seg = (a, b, hot, op, dash) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d < 2 * pad + 4) return;
    const u = [(b[0] - a[0]) / d, (b[1] - a[1]) / d], bow = Math.min(34, d * 0.16), A = [a[0] + u[0] * pad, a[1] + u[1] * pad], B = [b[0] - u[0] * (pad + 3), b[1] - u[1] * (pad + 3)];
    const C = [(A[0] + B[0]) / 2 + u[1] * bow, (A[1] + B[1]) / 2 - u[0] * bow]; // a slight bow keeps a step from hiding behind the stops it passes
    const p = `<path class="trail${hot ? ' last' : ''}" style="opacity:${op}"${dash ? ' stroke-dasharray="5 5"' : ''} marker-end="url(#ah)" d="M${A[0].toFixed(1)},${A[1].toFixed(1)}Q${C[0].toFixed(1)},${C[1].toFixed(1)} ${B[0].toFixed(1)},${B[1].toFixed(1)}"/>`;
    if (hot) top += p; else s += p;
  };
  for (let i = first; i < n; i++) seg(pts[i - 1], pts[i], i === at, i === at ? 1 : live ? 0.3 : (0.25 + 0.5 * (i - first + 1) / (n - first)).toFixed(2), false);
  if (live && S.loop && n > 1) seg(pts[n - 1], pts[0], at === 0, at === 0 ? 1 : 0.3, true); // the loop's way back to the start
  return s + top;
}

/* ----- Roads: three regions in a triangle; inside each, darker chords sit left and brighter ones right ----- */
const STN = {
  major: 'I vi iii i ♭III IV ii iv ♭VI ♭VII ii° ♭II v V vii° VI7 III7 II7 I7 VII7 ♭II7'.split(' '),
  minor: 'i ♭III I iv ii° ♭VI ♭VII IV ♭II ii v V vii° I7 II7 ♭III7 ♭VII7 IV7 ♭II7'.split(' '),
};
/* Brightness: each note's place on the line of fifths counted from the tonic (F -1, C 0, G +1, D +2 ...), averaged over the chord. */
const LOF = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5], LOF_S = [0, 7, 2, 9, 4, -1, 6, 1, 8, 3, 10, 5];
const QB = { '': 5 / 3, m: -2 / 3, dim: -3, aug: 4, 7: 0.75, maj7: 2.5, m7: -1, 'ø': -2.75, o7: -4.5, 6: 2, m6: 0.25, sus4: 0 };
const qb = q => (q in QB ? QB[q] : avg(Q[q].map(iv => (iv === 6 && Q[q].includes(3) ? -6 : LOF[iv]))));   // any other quality: the average place of its notes
const bright = c => (chromDim(c) ? LOF_S : LOF)[deg(c)] + qb(c.q);
/* three lanes per region, by distance from the key: rows[0] faces the middle of the map (in the key), rows[1] is one step outside, rows[2] is the rim (far outside) */
const ZONE = {
  drift: { x: 6, y: 30, w: 330, h: 190, title: 'AWAY · DRIFT', ty: 21, rows: [152, 94, 36] },
  pull: { x: 348, y: 30, w: 406, h: 190, title: 'TENSION · PULL', ty: 21, rows: [152, 94, 36] },
  rest: { x: 220, y: 318, w: 320, h: 190, title: 'HOME · REST', ty: 526, rows: [38, 96, 154] },
};
function station(c) {
  if (c.q === 'o7' && skey(c) !== 'vii°') return null;        // a passing diminished seventh is a pull wherever its root sits
  const T = STN[S.mode].filter(q => { const k2 = skey(sp(q)); return k2 === q || !STN[S.mode].includes(k2); }), k = skey(c); return T.includes(k) ? k : (k.endsWith('7') && T.includes(k.slice(0, -1)) ? k.slice(0, -1) : (KIND(c.q) === 'maj' && T.includes(k + '7') ? k + '7' : null)); }
function drawRoads() {
  // in Sevenths a few plain stops turn into a chord that has its own stop (♭VII becomes ♭VII7 in minor): show that one only
  const T = STN[S.mode].filter(k => { const k2 = skey(sp(k)); return k2 === k || !STN[S.mode].includes(k2); }), c0 = S.path[nowIdx()], ds = shown(), base = {}, STEP_PX = 60;
  T.forEach(k => { base[k] = N(k); });
  /* each region gets its own left-to-right scale: order and spacing follow brightness, long empty stretches are shortened */
  const sc = {};
  Object.keys(ZONE).forEach(f => {
    const us = T.filter(k => fn(base[k]) === f).map(k => bright(base[k])).sort((a, b) => a - b), cs = [0];
    for (let i = 1; i < us.length; i++) cs.push(cs[i - 1] + Math.min(us[i] - us[i - 1], 1));
    sc[f] = { us, cs, x0: ZONE[f].x + ZONE[f].w / 2 - cs[cs.length - 1] * STEP_PX / 2 };
  });
  const zx = (f, u) => {
    const { us, cs, x0 } = sc[f], n = us.length - 1, z = ZONE[f];
    let c;
    if (u <= us[0]) c = cs[0] - Math.min(0.5, (us[0] - u) * 0.3);
    else if (u >= us[n]) c = cs[n] + Math.min(0.5, (u - us[n]) * 0.3);
    else { let i = 0; while (u > us[i + 1]) i++; c = cs[i] + (u - us[i]) / ((us[i + 1] - us[i]) || 1) * (cs[i + 1] - cs[i]); }
    return Math.max(z.x + 24, Math.min(z.x + z.w - 24, x0 + c * STEP_PX));
  };
  const xy = c => { const f = fn(c), z = ZONE[f]; return [zx(f, bright(c)), z.y + z.rows[ring(c)]]; };
  const P = {}; T.forEach(k => { P[k] = xy(base[k]); });
  const off = [];
  const addOff = c => {
    if (station(c) || off.some(o => same(o.c, c))) return;
    // not a regular stop: slide it along its own row to the nearest free spot; if that row is full, use the neighbouring row
    const z = ZONE[fn(c)], p = xy(c), taken = Object.values(P).concat(off.map(o => o.p)), r0 = ring(c);
    const rows = [r0].concat([0, 1, 2].filter(r => r !== r0).sort((a, b) => Math.abs(a - r0) - Math.abs(b - r0)));
    for (const r of rows) {
      const y = z.y + z.rows[r], cand = [];
      for (let k = -28; k <= 28; k++) cand.push([p[0] + k * 13, y]);
      const free = cand.filter(q => q[0] >= z.x + 24 && q[0] <= z.x + z.w - 24 && !taken.some(t => Math.hypot(t[0] - q[0], t[1] - q[1]) < 39)).sort((a, b) => Math.abs(a[0] - p[0]) - Math.abs(b[0] - p[0]));
      if (free.length) { off.push({ c, p: free[0] }); return; }
    }
    off.push({ c, p });
  };
  S.path.forEach(addOff); ds.forEach(d => addOff(d.c));
  const at = c => (station(c) ? P[station(c)] : (off.find(o => same(o.c, c)) || {}).p);
  let s = ARROW;
  Object.entries(ZONE).forEach(([f, z]) => {
    s += `<rect class="zone s-${f}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="34" fill="var(--${f}-soft)"/><text class="t-zone f-${f}" x="${z.x + z.w / 2}" y="${z.ty}">${z.title}</text>`;
  });
  [['M306,310Q246,288 224,234', 'leave', 236, 286], ['M272,244Q380,280 488,244', 'build', 380, 284], ['M536,234Q514,288 454,310', 'resolve', 524, 286]].forEach(([d, word, tx, ty]) => {
    s += `<path class="flow" marker-end="url(#ah)" d="${d}"/><text class="t-sm" x="${tx}" y="${ty}" style="font-style:italic;font-size:11.5px">${word}</text>`;
  });
  s += ['In every region:', '← darker · brighter →', 'row facing the middle: in the key', 'next row: one step outside it', 'rim: far outside'].map((t, i) => `<text class="t-sm" x="10" y="${392 + i * 16}" style="text-anchor:start${i ? '' : ';font-weight:700'}">${t}</text>`).join('');
  s += trail(S.path.map(at), 22);
  const node = (c, p, label, big) => {
    const d = ds.find(x => (station(x.c) && station(x.c) === station(c)) || same(x.c, c)), isCur = same(c, c0) || (station(c) && station(c) === station(c0));
    const onPath = S.path.some(x => same(x, c) || (station(x) && station(x) === station(c)));
    const tgt = d ? d.c : c, r = big ? 19 : 18, faded = !d && !isCur && !onPath && (ring(c) > 0 || S.focus);
    s += `<g class="st ${fn(tgt)}${ring(c) === 0 ? ' in' : ''}${d ? ' dest' : ''}${isCur ? ' cur' : ''}${faded ? ' dim' : ''}" ${goAttr(tgt)} style="cursor:pointer"><circle cx="${p[0].toFixed(1)}" cy="${p[1]}" r="${r}"/><text class="t-num" x="${p[0].toFixed(1)}" y="${p[1] + 5}" style="font-size:${label.length > 3 ? 10.5 : 14}px">${esc(label)}</text><text class="t-sm" x="${p[0].toFixed(1)}" y="${p[1] + r + 12}">${esc(cname(isCur ? c0 : tgt))}</text></g>`;
  };
  T.forEach(k => node(sp(k), P[k], k, ring(base[k]) === 0));
  off.forEach(o => node(o.c, o.p, numeral(o.c), false));
  $('#map').setAttribute('viewBox', '0 0 760 534');
  $('#map').innerHTML = s;
  $('#lens-note').textContent = 'Roads: three regions for the three jobs. The usual trip runs Home → Away → Tension → Home, and your trail shows which legs you take. Inside each region, darker (flatter) chords sit on the left and brighter (sharper) ones on the right. Each region has three rows: the one facing the middle of the map is in the key, the next is one step outside it (borrowed chords and ramps), and the rim is far outside.';
}

/* ----- Wheel: the circle of fifths, home at the top ----- */
const wIdx = r => (mod(r - homeMajor()) * 7) % 12;
function wCell(c) { const k = KIND(c.q); return k === 'min' ? ['m', wIdx(c.r + 3)] : k === 'dim' ? ['d', wIdx(c.r + 1)] : ['M', wIdx(c.r)]; }
const WR = { M: 180, m: 130, d: 86 }, WC = { M: 22, m: 19, d: 15 };
const wXY = (ringId, i) => { const a = (i * 30 - 90) * Math.PI / 180; return [300 + WR[ringId] * Math.cos(a), 215 + WR[ringId] * Math.sin(a)]; };
function wedge(i0, i1, r0, r1) {
  const P = (i, r) => { const a = (i * 30 - 90) * Math.PI / 180; return (300 + r * Math.cos(a)).toFixed(1) + ',' + (215 + r * Math.sin(a)).toFixed(1); };
  return `M${P(i0, r0)}L${P(i0, r1)}A${r1},${r1} 0 0 1 ${P(i1, r1)}L${P(i1, r0)}A${r0},${r0} 0 0 0 ${P(i0, r0)}Z`;
}
function drawWheel() {
  const hm = homeMajor(), c0 = S.path[nowIdx()], ds = shown(), sh = S.mode === 'major' ? -3 : 3;
  let s = ARROW + `<path d="${wedge(-1.5, 1.5, 62, 206)}" fill="var(--ink-soft)"/><path d="${wedge(sh - 1.5, sh + 1.5, 62, 206)}" fill="none" class="grid-l" stroke-dasharray="4 4"/>`;
  s += `<text class="t-sm" x="60" y="20" style="text-anchor:start">← flatter, darker</text><text class="t-sm" x="540" y="20" style="text-anchor:end">sharper, brighter →</text>`;
  if (c0.q === 'o7') {     // a diminished seventh leads to four homes a minor third apart: a square on the wheel
    const sq = [1, 4, 7, 10].map(x => wXY('M', wIdx(c0.r + x))).map(q => [300 + (q[0] - 300) * 0.86, 215 + (q[1] - 215) * 0.86])   // corners stop at the edge of the four chords.sort((a, b) => Math.atan2(a[1] - 215, a[0] - 300) - Math.atan2(b[1] - 215, b[0] - 300));
    s += `<path d="${pathPts(sq)}Z" fill="var(--pull-soft)" class="s-pull" stroke-width="1.6" stroke-dasharray="6 5" pointer-events="none"/><text class="t-sm f-pull" x="300" y="219" style="font-weight:700">four homes</text>`;
  }
  s += trail(S.path.map(c => wXY(...wCell(c))), 25);
  for (let i = 0; i < 12; i++) {
    const R = mod(hm + 7 * i);
    [['M', { r: R, q: '' }, ''], ['m', { r: mod(R - 3), q: 'm' }, 'm'], ['d', { r: mod(R - 1), q: 'dim' }, '°']].forEach(([ringId, t, suf]) => {
      const hit = x => { const w = wCell(x); return w[0] === ringId && w[1] === i; };
      const d = ds.find(x => hit(x.c)), isCur = hit(c0), dia = diaChord(deg(t));
      const tgt = d ? d.c : (dia && hit(dia) ? dia : (ringId === 'd' ? t : dress(t.r, ringId === 'm' ? 'min' : 'maj')));
      const p = wXY(ringId, i), faded = !d && !isCur && !S.path.some(hit) && (!inKey(t) || S.focus);
      s += `<g class="st ${fn(isCur ? c0 : tgt)}${inKey(t) ? ' in' : ''}${d ? ' dest' : ''}${isCur ? ' cur' : ''}${faded ? ' dim' : ''}" ${goAttr(tgt)} style="cursor:pointer"><circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${WC[ringId]}"/><text class="t-num" x="${p[0].toFixed(1)}" y="${(p[1] + 4).toFixed(1)}" style="font-size:${ringId === 'M' ? 13 : ringId === 'm' ? 11 : 9.5}px">${esc(nm(rootSp(t)) + suf)}</text></g>`;
    });
  }
  $('#map').setAttribute('viewBox', '0 0 600 430');
  $('#map').innerHTML = s;
  $('#lens-note').textContent = 'Wheel: majors outside, their relative minors inside, diminished chords at the hub. On a diminished seventh, the dashed square marks the four homes it can lead to. The shaded wedge is your key; the dashed wedge is the ' + (S.mode === 'major' ? 'minor' : 'major') + ' side you can borrow from. Neighbours are close; the far side is a tritone away.';
}

/* ----- Lattice: notes on a grid; every triangle is a triad ----- */
const LS = 62, lXY = (x, y) => [300 + (x + y / 2) * LS, 215 - y * LS * 0.866];
const lPitch = (x, y) => mod(S.key + 7 * x + 4 * y);
function lattice() {
  const nodes = [], tris = [], ok = p => p[0] > 18 && p[0] < 582 && p[1] > 16 && p[1] < 414;
  for (let y = -3; y <= 3; y++) for (let x = -6; x <= 6; x++) { const p = lXY(x, y); if (ok(p)) nodes.push({ x, y, p, pc: lPitch(x, y) }); }
  const has = (x, y) => ok(lXY(x, y)), cen = pts => [avg(pts.map(q => q[0])), avg(pts.map(q => q[1]))];
  for (let y = -3; y <= 3; y++) for (let x = -6; x <= 6; x++) {
    if (has(x, y) && has(x + 1, y) && has(x, y + 1)) { const pts = [lXY(x, y), lXY(x + 1, y), lXY(x, y + 1)]; tris.push({ kind: 'maj', r: lPitch(x, y), pts, cen: cen(pts) }); }
    if (has(x + 1, y) && has(x, y + 1) && has(x + 1, y + 1)) { const pts = [lXY(x + 1, y), lXY(x, y + 1), lXY(x + 1, y + 1)]; tris.push({ kind: 'min', r: lPitch(x, y + 1), pts, cen: cen(pts) }); }
  }
  return { nodes, tris, cen };
}
function lPlace(L, c, ref) {
  const by = q => Math.hypot(q[0] - ref[0], q[1] - ref[1]);
  const iv = Q[c.q], want = iv.includes(4) && iv.includes(7) ? 'maj' : iv.includes(3) && iv.includes(7) ? 'min' : null;
  const T = want && L.tris.filter(t => t.kind === want && t.r === c.r).sort((a, b) => by(a.cen) - by(b.cen))[0];
  const base = T ? T.cen : ref, got = T ? pcs({ r: c.r, q: want === 'maj' ? '' : 'm' }) : [];
  const extra = pcs(c).filter(p => !got.includes(p)).map(p => L.nodes.filter(n => n.pc === p).sort((a, b) => Math.hypot(a.p[0] - base[0], a.p[1] - base[1]) - Math.hypot(b.p[0] - base[0], b.p[1] - base[1]))[0].p);
  const pts = (T ? T.pts : []).concat(extra);
  return { pts, cen: T ? T.cen : L.cen(pts), tri: T };
}
function drawLattice() {
  const L = lattice(), c0 = S.path[nowIdx()], ds = shown(), sc = pc => SCALE[S.mode].includes(mod(pc - S.key));
  let s = ARROW;
  L.tris.forEach(t => { const tr = pcs({ r: t.r, q: t.kind === 'maj' ? '' : 'm' }); s += `<path d="${pathPts(t.pts)}Z" class="grid-l${tr.every(sc) ? ' tri-in' : ''}" ${goAttr(dress(t.r, t.kind))} style="cursor:pointer;pointer-events:all"/>`; });
  let ref = [300, 215]; const placed = S.path.map(c => { const P = lPlace(L, c, ref); ref = P.cen; return P; });
  const here = placed[nowIdx()], f = fn(c0), order = here.pts.slice().sort((a, b) => Math.atan2(a[1] - here.cen[1], a[0] - here.cen[0]) - Math.atan2(b[1] - here.cen[1], b[0] - here.cen[0]));
  s += '<!--dest-->' + `<path d="${pathPts(order)}Z" fill="var(--${f}-soft)" class="s-${f}" stroke-width="3" stroke-linejoin="round"/>`;
  s += trail(placed.map(P => P.cen), 6);
  L.nodes.forEach(n => { const on = here.pts.includes(n.p) || here.pts.some(q => q[0] === n.p[0] && q[1] === n.p[1]); s += `<g class="st${on ? ' cur ' + f : ''}${sc(n.pc) ? ' in' : (on ? '' : ' dim')}" style="pointer-events:none"><circle cx="${n.p[0].toFixed(1)}" cy="${n.p[1].toFixed(1)}" r="13"/><text class="t-num" x="${n.p[0].toFixed(1)}" y="${(n.p[1] + 4).toFixed(1)}" style="font-size:11px">${esc(noteName(n.pc))}</text></g>`; });
  const dl = [];
  ds.forEach(d => {
    const P = lPlace(L, d.c, here.cen), g = fn(d.c), nmx = cname(d.c), x = P.cen[0].toFixed(1), y = P.cen[1];
    if (!P.tri || dl.some(q => Math.hypot(q[0] - P.cen[0], q[1] - y) < 4)) return; // diminished and augmented chords are lines on this grid, not triangles: they stay in the list of moves
    dl.push(P.cen);
    s = s.replace('<!--dest-->', (P.tri ? `<path d="${pathPts(P.tri.pts)}Z" fill="var(--${g}-soft)" class="s-${g}" stroke-width="1.6" ${goAttr(d.c)} style="cursor:pointer"/>` : `<circle cx="${x}" cy="${y.toFixed(1)}" r="15" fill="var(--${g}-soft)" class="s-${g}" stroke-width="1.6" ${goAttr(d.c)} style="cursor:pointer"/>`) + '<!--dest-->');
    s += `<text class="t-sm f-${g}" x="${x}" y="${(y + 3).toFixed(1)}" style="font-weight:700;font-size:${nmx.length > 4 ? 7.5 : 9.5}px;pointer-events:none">${esc(nmx)}</text>`;
  });
  $('#map').setAttribute('viewBox', '0 0 600 430');
  $('#map').innerHTML = s;
  $('#lens-note').textContent = 'Lattice: fifths run left to right, thirds run diagonally. Triangles pointing up are major chords, pointing down are minor. Two triangles that share an edge share two notes, so stepping across an edge moves one finger. Tap any triangle. Diminished and augmented chords are lines on this grid rather than triangles, so they only appear in the list of moves.';
}
const drawMap = () => { $('#map').setAttribute('data-live', S.playing >= 0 ? '1' : '0'); ({ roads: drawRoads, wheel: drawWheel, lattice: drawLattice })[S.lens](); };
