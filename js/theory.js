/* Chord Landscape. Chords, their names and numerals, the job each one does in the key, and the moves that lead away from it. */
'use strict';

/* ===== helpers and state ===== */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const mod = n => ((n % 12) + 12) % 12;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const press = (sel, on) => $$(sel).forEach(b => b.setAttribute('aria-pressed', String(on(b))));
const S = { key: 0, mode: 'major', rich: false, path: [], lens: 'roads', focus: null, tempo: 84, loop: false, wlen: 8, playing: -1, scale8: false };

/* ===== chords ===== */
const Q = { '': [0, 4, 7], m: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 'ø': [0, 3, 6, 10], o7: [0, 3, 6, 9], 6: [0, 4, 7, 9], m6: [0, 3, 7, 9], sus4: [0, 5, 7],
  mM7: [0, 3, 7, 11], '7s5': [0, 4, 8, 10], maj7s5: [0, 4, 8, 11], '7b5': [0, 4, 6, 10], '7sus4': [0, 5, 7, 10], sus2: [0, 2, 7], add9: [0, 2, 4, 7], madd9: [0, 2, 3, 7], maj9: [0, 2, 4, 7, 11], dom9: [0, 2, 4, 7, 10], m9: [0, 2, 3, 7, 10], '7b9': [0, 1, 4, 7, 10], six9: [0, 2, 4, 7, 9] };
const SUF = { '': '', m: 'm', dim: '°', aug: '+', 7: '7', maj7: 'maj7', m7: 'm7', 'ø': 'ø7', o7: '°7', 6: '6', m6: 'm6', sus4: 'sus4',
  mM7: 'm(maj7)', '7s5': '7♯5', maj7s5: 'maj7♯5', '7b5': '7♭5', '7sus4': '7sus4', sus2: 'sus2', add9: 'add9', madd9: 'm(add9)', maj9: 'maj9', dom9: '9', m9: 'm9', '7b9': '7♭9', six9: '6/9' };
const KINDX = { mM7: 'min', '7s5': 'dom', maj7s5: 'maj', '7b5': 'dom', '7sus4': 'dom', sus2: 'maj', add9: 'maj', madd9: 'min', maj9: 'maj', dom9: 'dom', m9: 'min', '7b9': 'dom', six9: 'maj' };
const KIND = q => KINDX[q] || ((q === '7' || q === 'aug' || q === 'sus4') ? 'dom' : (q === 'dim' || q === 'ø' || q === 'o7') ? 'dim' : (q === 'm' || q === 'm7' || q === 'm6') ? 'min' : 'maj');
const pcs = c => Q[c.q].map(iv => mod(c.r + iv));
const same = (a, b) => a.r === b.r && a.q === b.q;
const SCALE = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10] };
const deg = c => mod(c.r - S.key);
const other = () => (S.mode === 'major' ? 'minor' : 'major');
const inKey = (c, mode = S.mode) => Q[c.q].every(iv => { const d = mod(c.r + iv - S.key); return SCALE[mode].includes(d) || (mode === 'minor' && d === 11); });
const homeMajor = () => (S.mode === 'major' ? S.key : mod(S.key + 3));

/* ----- spelling ----- */
const LET = ['C', 'D', 'E', 'F', 'G', 'A', 'B'], NAT = [0, 2, 4, 5, 7, 9, 11], ACC = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };
const FL = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
const SH = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
const STEP = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const DSTEP = [0, 1, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6], DSTEP_S = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const nm = ([l, a]) => LET[l] + ACC[a];
const tonicSp = () => (S.mode === 'major' ? (S.key === 6 ? SH[6] : FL[S.key]) : ([1, 6, 8].includes(S.key) ? SH[S.key] : FL[S.key]));
const chromDim = c => KIND(c.q) === 'dim' && !SCALE[S.mode].includes(deg(c));
function rootSp(c) { // spell a root by its degree in the key: flat-side names, sharps for passing diminished chords
  const t = tonicSp(), sharp = chromDim(c), l = (t[0] + (sharp ? DSTEP_S : DSTEP)[deg(c)]) % 7, a = mod(c.r - NAT[l] + 6) - 6;
  if (Math.abs(a) > 1) return (sharp ? SH : FL)[c.r];
  return ({ '0,-1': [6, 0], '3,-1': [2, 0], '2,1': [3, 0], '6,1': [0, 0] })[l + ',' + a] || [l, a]; // B, E, F, C rather than C♭, F♭, E♯, B♯
}
const noteName = pc => nm(rootSp({ r: mod(pc), q: '' }));
function tones(c) {
  const rs = rootSp(c);
  return Q[c.q].map(iv => {
    let st = STEP[iv];
    if (iv === 8 && Q[c.q].includes(4) && !Q[c.q].includes(7)) st = 4;   // a raised fifth, not a flat sixth
    if (c.q === 'o7' && iv === 9) st = 6;
    const l = (rs[0] + st) % 7, pc = mod(c.r + iv), a = mod(pc - NAT[l] + 6) - 6;
    const n = Math.abs(a) > 1 ? noteName(pc) : LET[l] + ACC[a];
    return { pc, name: ({ 'C♭': 'B', 'F♭': 'E', 'E♯': 'F', 'B♯': 'C' })[n] || n };      // the key you press, not the theorist's spelling
  });
}
const cname = c => nm(rootSp(c)) + SUF[c.q] + (c.b != null && c.b !== c.r ? '/' + noteName(c.b) : '');

/* ----- Roman numerals ----- */
const NUM = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
const NSUF = { '': '', m: '', dim: '°', aug: '+', 7: '7', maj7: 'maj7', m7: '7', 'ø': 'ø7', o7: '°7', 6: '6', m6: '6', sus4: 'sus4',
  mM7: '(maj7)', '7s5': '7♯5', maj7s5: 'maj7♯5', '7b5': '7♭5', '7sus4': '7sus4', sus2: 'sus2', add9: 'add9', madd9: '(add9)', maj9: 'maj9', dom9: '9', m9: '9', '7b9': '7♭9', six9: '6/9' };
const lower = n => n.replace(/[IV]+/, x => x.toLowerCase());
const NUMS = ['I', '♯I', 'II', '♯II', 'III', 'IV', '♯IV', 'V', '♯V', 'VI', '♯VI', 'VII'];
function numeral(c) { const k = KIND(c.q), n = (chromDim(c) ? NUMS : NUM)[deg(c)]; return (k === 'min' || k === 'dim' ? lower(n) : n) + NSUF[c.q]; }
const ROM = { i: 0, ii: 2, iii: 4, iv: 5, v: 7, vi: 9, vii: 11 };
function N(s) {
  const m = /^([♭♯]?)(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(.*)$/.exec(s), low = m[2] === m[2].toLowerCase();
  const d = ROM[m[2].toLowerCase()] + (m[1] === '♭' ? -1 : m[1] === '♯' ? 1 : 0);
  const q = low ? ({ '': 'm', 7: 'm7', 6: 'm6', '°': 'dim', 'ø': 'ø', '°7': 'o7' })[m[3]] : ({ '': '', 7: '7', maj7: 'maj7', '+': 'aug', 6: '6', sus4: 'sus4' })[m[3]];
  return { r: mod(S.key + d), q };
}
const DIA = { major: 'I ii iii IV V vi vii°', minor: 'i ii° ♭III iv V ♭VI ♭VII' };
const RICH = {
  major: { I: 'Imaj7', ii: 'ii7', iii: 'iii7', IV: 'IVmaj7', V: 'V7', vi: 'vi7', 'vii°': 'viiø', iv: 'iv6', '♭VI': '♭VImaj7', '♭VII': '♭VII7', '♭III': '♭IIImaj7', i: 'i7', 'ii°': 'iiø', v: 'v7', '♭II': '♭IImaj7' },
  minor: { i: 'i7', 'ii°': 'iiø', '♭III': '♭IIImaj7', iv: 'iv7', V: 'V7', v: 'v7', '♭VI': '♭VImaj7', '♭VII': '♭VII7', IV: 'IV7', I: 'Imaj7', ii: 'ii7', '♭II': '♭IImaj7', 'vii°': 'vii°7' },
};
const sp = s => N((S.rich && RICH[S.mode][s]) || s);
const home = () => sp(S.mode === 'major' ? 'I' : 'i');
function diaMap() { const m = {}; DIA[S.mode].split(' ').forEach(s => { m[mod(N(s).r - S.key)] = s; }); return m; }
const diaChord = d => { const s = diaMap()[mod(d)]; return s ? sp(s) : null; };
const dress = (r, kind) => ({ r: mod(r), q: kind === 'min' ? (S.rich ? 'm7' : 'm') : (S.rich ? 'maj7' : '') });
function skey(c) { const k = KIND(c.q), n = NUM[deg(c)]; return k === 'maj' ? n : k === 'min' ? lower(n) : k === 'dim' ? lower(n) + '°' : (deg(c) === 7 ? 'V' : n + '7'); }

/* ----- what a chord is doing in the key ----- */
function fn(c) {
  const d = deg(c), k = KIND(c.q);
  if (k === 'dom') return (c.q === 'sus4' && d === 0) ? 'rest' : 'pull';
  if (k === 'dim') return (d === 2 && c.q !== 'o7') ? 'drift' : 'pull';
  if (k === 'maj' && Q[c.q].includes(4) && (S.mode === 'major' ? [2, 4, 9, 11] : [2, 4]).includes(d)) return 'pull';
  if (d === 7 && k === 'min') return 'drift';
  return ['rest', 'drift', 'drift', 'rest', 'rest', 'drift', 'pull', 'pull', 'drift', 'rest', 'drift', 'pull'][d];
}
function ring(c) {
  if (inKey(c)) return 0;
  const d = deg(c), k = KIND(c.q), dm = diaMap();
  if (inKey(c, other()) || (k === 'dom' && dm[mod(d + 5)]) || (k === 'dim' && dm[mod(d + 1)])) return 1;
  return 2;
}
const isHome = c => deg(c) === 0 && inKey(c) && KIND(c.q) !== 'dom';
function lift(c) {
  if (isHome(c)) return 0;
  const q = Q[c.q], tt = q.includes(6) || (q.includes(4) && q.includes(10));
  return ({ rest: 0.8, drift: 2.2, pull: 3.6 })[fn(c)] + ring(c) * 0.8 + (tt ? 0.6 : 0);
}
const JOB = { rest: 'rest', drift: 'drift', pull: 'pull' };
const jobWord = c => (isHome(c) ? 'home' : JOB[fn(c)]);
function identify(set, pref) {
  for (const q of ['', 'm', '7', 'maj7', 'm7', 'm6', '6', 'ø', 'o7', 'dim', 'aug', 'sus4']) {
    for (const r of (pref == null ? set : [pref])) { const p = Q[q].map(iv => mod(r + iv)); if (p.length === set.length && p.every(x => set.includes(x))) return { r, q }; }
  }
  return pref == null ? null : identify(set);
}

/* ----- naming whatever the hands are holding: the bass decides ----- */
function dynQ(ivs) {                       // a quality made to order for a set of intervals above the root
  const key = 'x' + ivs.join('.');
  if (Q[key]) return key;
  const has = n => ivs.includes(n), third = has(4) ? '' : has(3) ? 'm' : null, sus = third != null ? '' : has(5) ? 'sus4' : has(2) ? 'sus2' : '';
  const sev = has(10) ? '7' : has(11) ? 'maj7' : has(9) ? '6' : '';
  const core = third === 'm' && sev === 'maj7' ? 'm(maj7)' : third != null ? third + sev : sev + sus || (has(7) ? '5' : '');
  const alt = [];
  if (has(1)) alt.push('♭9');
  if (has(2) && sus !== 'sus2') alt.push(has(10) || has(11) ? '9' : 'add9');
  if (has(3) && has(4)) alt.push('♯9');
  if (has(5) && sus !== 'sus4') alt.push(has(10) || has(11) ? '11' : 'add11');
  if (has(6)) alt.push(has(7) ? '♯11' : '♭5');
  if (has(8)) alt.push(has(7) ? '♭13' : '♯5');
  if (has(9) && sev !== '6') alt.push('13');
  if (has(11) && sev === '7') alt.push('maj7');
  const suf = core + (alt.length ? '(' + alt.join(',') + ')' : '');
  Q[key] = ivs.slice(); SUF[key] = suf; NSUF[key] = third === 'm' ? suf.replace(/^m/, '') : suf;
  KINDX[key] = has(4) && has(10) ? 'dom' : has(3) && has(6) && !has(4) && !has(7) ? 'dim' : third === 'm' ? 'min' : 'maj';
  return key;
}
const KNOWN = ['', 'm', '6', 'm6', 'maj7', '7', 'm7', 'ø', 'o7', 'dim', 'aug', 'sus4', 'sus2', 'mM7', '7sus4', 'add9', 'madd9', 'maj9', 'dom9', 'm9', '7b9', 'six9', '7s5', '7b5', 'maj7s5'];
const FANCY = ['mM7', '7sus4', 'maj9', 'dom9', 'm9', '7b9', 'six9', '7s5', '7b5', 'maj7s5'];      // fine in root position, unreadable as slash chords
const known = (set, root) => KNOWN.find(q => Q[q].length === set.length && Q[q].every(iv => set.includes(mod(root + iv))));
function nameVoices(bass, rh) {            // a bass note and right-hand notes (MIDI) -> { r, q, b }
  const b = mod(bass), U = [...new Set(rh.map(m => mod(m)))], T = U.includes(b) ? U : U.concat(b);
  let q = known(T, b);
  if (q != null) return { r: b, q };                                   // a chord in root position
  const T5 = T.includes(mod(b + 7)) ? null : T.concat(mod(b + 7));
  if (T5 && (q = known(T5, b)) != null) return { r: b, q };            // the same with its fifth left out
  for (const set of [U, T]) {                                          // an inversion, or a chord over a foreign bass
    let best = null;
    set.forEach(r => { const k = known(set, r); if (k != null && r !== b && !FANCY.includes(k) && (!best || KNOWN.indexOf(k) < KNOWN.indexOf(best.q))) best = { r, q: k, b }; });
    if (best) return best;
  }
  return { r: b, q: dynQ(T.map(p => mod(p - b)).sort((x, y) => x - y)) };
}

/* ===== the moves: seven ways to leave a chord ===== */
const ROADS = {
  major: { I: 'IV V vi ii iii', ii: 'V iii IV', iii: 'vi IV ii', IV: 'V I ii vi', V: 'I vi IV iii', vi: 'IV ii V iii', 'vii°': 'I iii vi',
    iv: 'I V ♭VII', '♭VI': '♭VII V I iv', '♭VII': 'I IV ♭VI', '♭III': 'IV ♭VI ♭VII', i: 'iv ♭VI ♭VII V', 'ii°': 'V I', v: 'IV I', '♭II': 'V I' },
  minor: { i: 'iv ♭VI ♭VII V ♭III', 'ii°': 'V i', '♭III': '♭VI iv ♭VII', iv: 'V i ♭VII', V: 'i ♭VI iv', v: 'i ♭VI iv', '♭VI': '♭VII V iv ♭III', '♭VII': 'i ♭III ♭VI', 'vii°': 'i',
    IV: 'i ♭VII V', I: 'iv ♭VI', '♭II': 'V i', ii: 'V i' },
};
function moves(c) {
  const out = [], d = deg(c), k = KIND(c.q), dm = diaMap();
  const push = (id, name, why, items) => {
    const seen = new Set();
    items = items.filter(x => x && x.c && !same(x.c, c) && !seen.has(x.c.r + x.c.q) && seen.add(x.c.r + x.c.q));
    if (items.length) out.push({ id, name, why, items });
  };
  /* 1. the road */
  let road = [];
  const sk = skey(c), tbl = ROADS[S.mode];
  const R = tbl[sk] || (k === 'dom' && !dm[mod(d + 5)] && sk.endsWith('7') ? tbl[sk.slice(0, -1)] : null);
  if (R) road = R.split(' ').map(s => ({ c: sp(s) }));
  else if (k === 'dom') {
    const T = diaChord(d + 5), H = diaChord(d - 1);
    if (T) road.push({ c: T, note: 'resolves' }, { c: KIND(T.q) === 'min' ? dress(T.r + 8, 'maj') : dress(T.r + 9, 'min'), note: 'deceptive' });
    if (H) road.push({ c: H, note: 'slides down' });
    if (!T && !H) road.push({ c: dress(c.r + 5, 'maj'), note: 'resolves' });
  } else if (k === 'dim') {
    (c.q === 'o7' ? [1, 4, 7, 10] : [1]).forEach(x => { const T = diaChord(d + x); if (T) road.push({ c: T, note: 'leads up' }); });
  }
  if (!road.length) road = [{ c: home(), note: 'home' }];
  road.forEach(x => { if (!x.note) x.note = jobWord(x.c); });
  push('road', 'Follow the road', 'where this chord usually goes', road);
  /* 2. change one note */
  const keep = x => { const B = pcs(x), sh = tones(c).filter(t => B.includes(t.pc)).map(t => t.name); return sh.length ? 'keeps ' + sh.join(', ') : ''; };
  let near = [];
  if (c.q === 'o7') near = pcs(c).map(p => ({ r: mod(p - 1), q: '7' }));
  else if (c.q === 'aug') near = [0, 4, 8].map(x => dress(c.r + x, 'maj')).concat([9, 1, 5].map(x => dress(c.r + x, 'min')));
  else if (k === 'maj' || k === 'dom') near = [dress(c.r, 'min'), dress(c.r + 9, 'min'), dress(c.r + 4, 'min')];
  else if (k === 'min') near = [dress(c.r, 'maj'), dress(c.r + 3, 'maj'), dress(c.r + 8, 'maj')];
  push('near', 'Change one note', 'hold most of the chord, move one finger', near.map(x => ({ c: x, note: keep(x) })));
  /* 3. borrow */
  const B = (S.mode === 'major' ? 'iv ♭VI ♭VII ♭III i ii° v ♭II' : 'IV I ii ♭II').split(' ').map(sp).filter(x => !same(x, c)).slice(0, 6);
  push('borrow', S.mode === 'major' ? 'Borrow from minor' : 'Borrow from major', S.mode === 'major' ? 'same home, lights down' : 'same home, lights up', B.map(x => ({ c: x, note: jobWord(x) })));
  /* 4. aim */
  const targets = Object.keys(dm).map(x => diaChord(Number(x))).filter(T => !same(T, c) && KIND(T.q) !== 'dim');
  push('ramp', 'Aim at a chord', 'play the dominant of where you want to land', targets.map(T => ({ c: { r: mod(T.r + 7), q: '7' }, note: '→ ' + cname(T), then: T })));
  /* 5. slide */
  const slide = road.slice(0, 2).filter(x => KIND(x.c.q) !== 'dim').map(x => ({ c: { r: mod(x.c.r + 1), q: '7' }, note: 'drops to ' + cname(x.c), then: x.c }));
  const up = diaChord(d + 2), dn = diaChord(d - 2);
  if (up && k !== 'dim' && KIND(up.q) !== 'dim') slide.push({ c: { r: mod(c.r + 1), q: 'o7' }, note: 'passes up to ' + cname(up), then: up });
  if (dn && k !== 'dim' && KIND(dn.q) !== 'dim') slide.push({ c: { r: mod(c.r - 1), q: 'o7' }, note: 'passes down to ' + cname(dn), then: dn });
  slide.push({ c: { r: mod(c.r + 1), q: c.q }, note: 'whole chord up' }, { c: { r: mod(c.r - 1), q: c.q }, note: 'whole chord down' });
  push('slide', 'Slide a half step', 'arrive from one key away', slide);
  /* 6. leap */
  if (k === 'maj' || k === 'min') {
    const L = [[3, 'up a minor 3rd'], [4, 'up a major 3rd'], [8, 'down a major 3rd'], [9, 'down a minor 3rd'], [6, 'the far side']];
    push('leap', 'Leap a third', 'same chord shape, a third away', L.map(([x, note]) => ({ c: dress(c.r + x, k), note })).filter(x => !inKey(x.c)));
  }
  /* 7. mirror */
  const mir = identify(pcs(c).map(p => mod(2 * S.key + 7 - p)), mod(2 * S.key - c.r));
  push('mirror', 'Mirror it', 'the negative-harmony twin', mir ? [{ c: mir, note: 'mirror of ' + cname(c) }] : []);
  return out;
}

/* ----- a walk away from home and back ----- */
function wander(level, n) {
  const W = { road: [10, 8, 6, 5, 4], near: [0, 2, 3, 3, 3], borrow: [0, 1, 3, 4, 4], ramp: [0, 1, 3, 4, 4], slide: [0, 0, 1, 3, 4], leap: [0, 0, 0, 2, 4], mirror: [0, 0, 0, 1, 2] };
  const H = home(), path = [Object.assign({ via: 'home' }, H)];
  let pend = null;
  for (let i = 1; i < n - 1; i++) {
    const cur = path[path.length - 1];
    if (pend && Math.random() < 0.85) { path.push(Object.assign({ via: 'resolve' }, pend)); pend = null; continue; }
    pend = null;
    const bag = [];
    moves(cur).forEach(g => g.items.forEach((it, j) => {
      const w = (W[g.id] || [0])[level - 1] / (1 + j * 0.5);
      if (!w || same(it.c, H) || (it.then && same(it.then, H) && i < n - 2) || (path.some(p => same(p, it.c)) && Math.random() < 0.7)) return;
      bag.push({ it, g, w });
    }));
    if (!bag.length) break;
    let x = Math.random() * bag.reduce((t, b) => t + b.w, 0), pick = bag[0];
    for (const b of bag) { x -= b.w; if (x <= 0) { pick = b; break; } }
    path.push(Object.assign({ via: pick.g.name.toLowerCase() }, pick.it.c));
    pend = pick.it.then || null;
  }
  const ends = (S.mode === 'major' ? [['V'], ['V', 'IV'], ['V', 'iv', '♭VII'], ['iv', '♭VII', '♭II7', 'V'], ['♭II7', '♭VII', 'iv', '♭VI']] : [['V'], ['V', '♭VII'], ['V', '♭VII', 'iv'], ['♭II7', 'V', '♭VII'], ['♭II7', '♭VI', 'IV']])[level - 1].map(sp);
  const last = path[path.length - 1], opts = ends.filter(e => !same(e, last));
  if ((pend && same(pend, H)) || (!pend && !opts.length)) { last.via += ', the way home'; return path; }
  path.push(pend ? Object.assign({ via: 'resolve' }, pend) : Object.assign({ via: 'way home' }, opts[Math.floor(Math.random() * opts.length)]));
  return path;
}
