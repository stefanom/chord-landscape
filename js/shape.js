/* Chord Landscape. Two views of the whole path: how the voices move (the weave) and how far each chord sits from rest (the profile). */
'use strict';

/* ===== the shape of the path ===== */
function cols(n) { const w = 520 / Math.max(n, 4); return i => 24 + (i + 0.5) * w; }
function labels(X, y) { const n = S.path.length, every = n > 14 ? 2 : 1; return S.path.map((c, i) => (i % every ? '' : `<text class="t-sm" x="${X(i).toFixed(1)}" y="${y}" style="font-size:${n > 10 ? 9 : 11}px${i === CUR ? ';font-weight:700;fill:var(--ink)' : ''}">${esc(cname(c))}</text>`)).join(''); }
function drawWeave() {
  const V = voicings(S.path), n = V.length, X = cols(n), Y = m => 212 - (m - 38) * 4.6;
  let s = `<rect x="${(X(CUR) - 14).toFixed(1)}" y="8" width="28" height="216" rx="6" fill="var(--ink-soft)"/>`, held = 0, total = 0, dist = 0;
  for (let i = 0; i + 1 < n; i++) {
    const A = V[i].rh, B = V[i + 1].rh, links = [];
    A.forEach(a => links.push([a, B.slice().sort((p, q) => Math.abs(p - a) - Math.abs(q - a))[0]]));
    B.forEach(b => { if (!links.some(l => l[1] === b)) links.push([A.slice().sort((p, q) => Math.abs(p - b) - Math.abs(q - b))[0], b]); });
    links.forEach(([a, b]) => { const d = Math.abs(a - b); total++; dist += d; if (!d) held++; s += `<path d="M${X(i).toFixed(1)},${Y(a).toFixed(1)}L${X(i + 1).toFixed(1)},${Y(b).toFixed(1)}" fill="none" stroke="var(--ink)" stroke-width="${d ? 1.3 : 3.2}" opacity="${d ? 0.55 : 0.9}"${d > 2 ? ' stroke-dasharray="3 3"' : ''}/>`; });
    s += `<path d="M${X(i).toFixed(1)},${Y(V[i].bass).toFixed(1)}L${X(i + 1).toFixed(1)},${Y(V[i + 1].bass).toFixed(1)}" fill="none" stroke="var(--ink-2)" stroke-width="1.3" opacity=".6"/>`;
  }
  V.forEach((v, i) => { const f = fn(S.path[i]); v.rh.forEach(m => { s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(m).toFixed(1)}" r="4.2" class="f-${f}"/>`; }); s += `<rect x="${(X(i) - 4).toFixed(1)}" y="${(Y(v.bass) - 4).toFixed(1)}" width="8" height="8" class="f-${f}" opacity=".7"/>`; });
  $('#weave').innerHTML = s + labels(X, 244);
  $('#weave-note').textContent = n < 2 ? 'Add a chord to see the voices move. Circles are the right hand, squares are the bass.' : `Thick lines are held notes: ${held} of ${total} right-hand moves hold. Average move: ${(dist / total).toFixed(1)} semitones. Dashed lines are jumps of more than a whole step.`;
}
function drawProfile() {
  const n = S.path.length, X = cols(n), Y = v => 200 - v * 31, L = S.path.map(lift);
  let s = `<line x1="16" x2="544" y1="${Y(0)}" y2="${Y(0)}" class="grid-l"/><text class="t-sm" x="18" y="${Y(0) + 12}" style="text-anchor:start">home</text><text class="t-sm" x="18" y="22" style="text-anchor:start">far from rest</text>`;
  s += `<rect x="${(X(CUR) - 14).toFixed(1)}" y="8" width="28" height="216" rx="6" fill="var(--ink-soft)"/>`;
  const pts = L.map((v, i) => [X(i), Y(v)]);
  if (n > 1) s += `<path d="${pathPts(pts)}L${X(n - 1).toFixed(1)},${Y(0)}L${X(0).toFixed(1)},${Y(0)}Z" fill="var(--ink-soft)"/><path d="${pathPts(pts)}" fill="none" stroke="var(--ink)" stroke-width="1.6"/>`;
  S.path.forEach((c, i) => { s += `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="6" class="f-${fn(c)}"/>${n <= 12 ? `<text class="t-sm" x="${pts[i][0].toFixed(1)}" y="${(pts[i][1] - 10).toFixed(1)}">${esc(numeral(c))}</text>` : ''}`; });
  $('#profile').innerHTML = s + labels(X, 244);
  const mx = Math.max(...L), pk = S.path[L.indexOf(mx)], homes = L.filter(v => v === 0).length;
  $('#profile-note').textContent = n < 3 ? 'Rest sits on the line; drifting chords rise a little; pulling and borrowed chords rise more.' : mx < 2.5 ? 'This path never climbs far from home. Try a pull, a borrowed chord or a ramp to give it a peak.' : `The peak is ${cname(pk)} (${numeral(pk)}). The path touches home ${homes} time${homes === 1 ? '' : 's'}; try delaying the return to stretch the arc.`;
}
