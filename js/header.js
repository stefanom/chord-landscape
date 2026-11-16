/* Chord Landscape. The bar that stays on screen: the chord you are on, the path, the piano and the one-finger arrows. */
'use strict';

/* ===== header: name, path chips, keyboard ===== */
function paintPath() {
  const box = $('#path');
  box.innerHTML = S.path.map((c, i) => {
    const chip = `<button class="chip ${fn(c)}${i === CUR ? ' cur' : ''}${i === S.playing ? ' playing' : ''}" data-i="${i}" title="${esc(c.via || '')}"><b>${esc(cname(c))}</b><i>${esc(numeral(c))}</i></button>`;
    return i === CUR && S.path.length > 1 ? `<span class="chip-w">${chip}<button class="chip-x" data-del="${i}" aria-label="Remove ${esc(cname(c))} from the path" title="Remove this chord">×</button></span>` : chip;
  }).join('');
  const el = box.querySelector(S.playing >= 0 ? '.playing' : '.cur');
  if (el && el.offsetLeft + el.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = el.offsetLeft - 40;
  else if (el && el.offsetLeft < box.scrollLeft) box.scrollLeft = Math.max(0, el.offsetLeft - 40);
}
const WHITE = [0, 2, 4, 5, 7, 9, 11], BOFF = { 1: -3, 3: 3, 6: -4, 8: 0, 10: 4 }; // black keys sit off-centre, as on a real keyboard
function keyX(m) {
  const o = Math.floor(m / 12) - 3, p = m % 12, wi = WHITE.indexOf(p);
  return wi >= 0 ? { x: (o * 7 + wi) * 30 + 15, black: false } : { x: (o * 7 + WHITE.indexOf(p - 1) + 1) * 30 + BOFF[p], black: true };
}
function drawKeys() {
  const i = S.playing >= 0 ? S.playing : CUR, V = voicings(S.path), v = V[i], c = S.path[i], f = fn(c);
  const down = new Set(v.rh.concat(v.bass)), prev = i > 0 ? V[i - 1] : null, left = prev ? prev.rh.filter(m => !v.rh.includes(m)) : [];
  let s = '<rect x="0" y="0" width="780" height="5" fill="#6d1f1c"/>';
  for (let m = 36; m <= 79; m++) { const k = keyX(m); if (!k.black) s += `<rect class="wkey${down.has(m) ? ' on k-' + f : ''}" data-m="${m}" x="${k.x - 15}" y="4" width="30" height="122" rx="3"/>`; }
  for (let m = 36; m <= 79; m++) { const k = keyX(m); if (k.black) s += `<rect class="bkey${down.has(m) ? ' on k-' + f : ''}" data-m="${m}" x="${k.x - 8.5}" y="4" width="17" height="78" rx="2.5"/><rect class="bface${down.has(m) ? ' on' : ''}" x="${k.x - 6}" y="4" width="12" height="70" rx="2"/>`; }
  if (S.scale8) {                                   // Barry Harris's eight-note scale: home notes and the diminished notes between them
    const sc = walkScale() || { x: S.key, minor: S.mode === 'minor' }, S8 = scale8(sc), six = sixTones(sc);
    for (let m = 36; m <= 79; m++) { const p = m % 12; if (S8.includes(p)) { const k = keyX(m); s += six.includes(p) ? `<circle cx="${k.x}" cy="${k.black ? 75 : 120}" r="4" class="f-rest" pointer-events="none"/>` : `<rect x="${k.x - 6}" y="${k.black ? 73.5 : 118.5}" width="12" height="3" rx="1.5" class="f-pull" pointer-events="none"/>`; } }
  }
  const names = {}; tones(c).forEach(t => { names[t.pc] = t.name; });
  left.forEach(m => { const k = keyX(m); s += `<circle cx="${k.x}" cy="${k.black ? 62 : 108}" r="6" fill="none" class="s-${f}" stroke-width="1.5" stroke-dasharray="2 2" pointer-events="none"/>`; });
  v.rh.concat(v.bass).forEach(m => { const k = keyX(m), bass = m === v.bass; s += `<circle cx="${k.x}" cy="${k.black ? 62 : 108}" r="${k.black ? 5.5 : 7}" class="kdot f-${f}"${bass ? ' fill-opacity=".45"' : ''}/><text class="kn" x="${k.x}" y="143">${esc(names[m % 12] || noteName(m))}</text>`; });
  $('#keys').innerHTML = s;
  let lead = 'Left hand takes the root; right hand plays the chord.';
  if (prev) {
    const pn = {}; tones(S.path[i - 1]).forEach(t => { pn[t.pc] = t.name; });
    const held = v.rh.filter(m => prev.rh.includes(m)).map(m => names[m % 12]);
    const free = v.rh.filter(m => !prev.rh.includes(m));
    const lf = left.slice().sort((a, b) => a - b), fr = free.slice().sort((a, b) => a - b); // pair movers low to high so two fingers never claim the same note
    const mv = lf.map((m, k) => { const to = lf.length === fr.length ? fr[k] : fr.slice().sort((a, b) => Math.abs(a - m) - Math.abs(b - m))[0]; return to == null ? '' : `${pn[m % 12]} ${to > m ? '↑' : '↓'} ${names[to % 12]}`; }).filter(Boolean);
    const bs = Math.abs(v.bass - prev.bass), bm = bs && bs <= 2 ? `; bass ${pn[prev.bass % 12] || noteName(prev.bass)} ${v.bass > prev.bass ? '↑' : '↓'} ${names[v.bass % 12] || noteName(v.bass)}` : '';
    lead = `From ${cname(S.path[i - 1])}: ` + (held.length ? `hold ${held.join(', ')}` : 'nothing holds') + (mv.length ? `; move ${mv.join(', ')}` : '') + bm + '.';
  }
  LEAD = lead; $('#lead').textContent = lead;
  paintVoices(v, c, names);
}
let LEAD = '';
function paintVoices(v, c, names) {
  const live = S.playing >= 0, nm2 = m => names[mod(m)] || noteName(m);
  const chip = (k, m) => {
    const btn = d => {
      const r = live ? null : nudged(k, d, v); let tip = '';
      if (r) { const tn = {}; tones(r).forEach(t => { tn[t.pc] = t.name; }); tip = `${nm2(m)} ${d > 0 ? '↑' : '↓'} ${tn[mod(m + d)] || noteName(m + d)} makes ${cname(r)}`; }
      return `<button data-nudge="${k},${d}"${r ? '' : ' disabled'} title="${esc(tip)}" aria-label="${esc(tip || (k ? 'finger' : 'bass') + ' cannot move there')}">${d < 0 ? '‹' : '›'}</button>`;
    };
    return `<span class="vc${k ? '' : ' bass'}">${btn(-1)}<b>${esc(nm2(m))}${k ? '' : '<small>bass</small>'}</b>${btn(1)}</span>`;
  };
  $('#voices').innerHTML = '<span class="v-tag">Move one finger a half step</span>' + chip(0, v.bass) + v.rh.map((m, j) => chip(j + 1, m)).join('') +
    (S.scale8 ? '<span class="v-key"><i class="f-rest-bg dot"></i>home notes <i class="f-pull-bg"></i>the diminished notes between</span>' : '');
}
function paintHere() {
  const c = S.path[nowIdx()], f = fn(c);
  $('#here-name').textContent = cname(c);
  $('#here-num').textContent = numeral(c);
  const k = KIND(c.q), can = S.playing < 0 && (k === 'maj' || k === 'min') && (deg(c) !== 0 || (k === 'min') !== (S.mode === 'minor'));
  $('#rehome').hidden = !can;
  const j = $('#here-job'); j.className = 'job ' + f; j.innerHTML = isHome(c) ? 'home' : JOB[f] + (ring(c) ? `<span class="job-x"> · ${ring(c) === 1 ? 'outside the key' : 'far out'}</span>` : '');
}
