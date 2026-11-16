/* Chord Landscape. The list of moves you can make from the chord you are on. */
'use strict';

/* ===== the compass ===== */
const ACTS = [];
function slipGroup(G) {
  const of = id => ((G.find(g => g.id === id) || {}).items || []).map(x => x.c), c = cur();
  const T = of('road').slice(0, 4).concat(of('borrow').slice(0, 2));
  if (!isHome(c) && !T.some(isHome)) T.push(home());
  const items = [];
  T.forEach(t => { if (items.some(x => same(x.c, t))) return; const st = slipSteps(t); if (st) items.push({ c: t, note: `in ${st.length} half steps`, act: ACTS.push(() => addSteps(st)) - 1 }); });
  items.sort((a, b) => parseInt(a.note.slice(3), 10) - parseInt(b.note.slice(3), 10));
  return items.length ? { id: 'slip', name: 'Slip there by half steps', why: 'one finger at a time, as Chopin does', items: items.slice(0, 5) } : null;
}
function harrisGroup() {
  const c = cur(), k = KIND(c.q), sc = walkScale(), items = [];
  if (c.q === 'o7') {
    pcs(c).forEach(t => {
      const r = mod(t + 1), d = diaChord(mod(r - S.key)), T = d && KIND(d.q) === 'min' ? d : { r, q: '6' };
      items.push({ c: T, note: isHome(T) || (deg(T) === 0 && inKey(T)) ? 'home' : inKey(T) ? 'in the key' : 'a new home' });
    });
    const rank = x => ['home', 'in the key', 'a new home'].indexOf(x.note);
    items.sort((a, b) => rank(a) - rank(b));
  } else if (k === 'maj' || k === 'min') {
    if (!sc) items.push({ c: { r: c.r, q: k === 'maj' ? '6' : 'm6' }, note: 'add the sixth' });
  }
  const walks = [];
  if (sc) [[1, 'walk up the scale'], [-1, 'walk down the scale']].forEach(([dir, note]) => { const e = walkStep(sc, dir); if (e) walks.push({ c: e, note, act: ACTS.push(() => addSteps([e])) - 1 }); });
  if (!walks.length && (k === 'maj' || k === 'min') && c.q !== 'o7') items.push({ c: { r: mod((sc ? sc.x : c.r) - 1), q: 'o7' }, note: 'its pull' });
  items.push(...walks);
  return items.length ? { id: 'harris', name: 'Home and pull', why: c.q === 'o7' ? 'a diminished chord has four homes' : 'a sixth chord and the diminished chord beside it', items } : null;
}
function paintCompass() {
  const G = moves(cur()); DEST = []; ACTS.length = 0;
  const at = G.findIndex(g => g.id === 'near') + 1 || 1;
  G.splice(at, 0, ...[slipGroup(G), harrisGroup()].filter(Boolean));
  G.forEach(g => g.items.forEach(it => { if (it.act == null) DEST.push({ c: it.c, gid: g.id, gname: g.name, note: it.note }); }));
  const head = CUR < S.path.length - 1 ? `After ${cname(cur())}, play instead…` : `From ${cname(cur())} you can…`;
  $('#compass').innerHTML = `<h3>${esc(head)}</h3>` + G.map(g => `<div class="verb${S.focus === g.id ? ' focus' : ''}"><button class="verb-h" data-focus="${g.id}"><b>${esc(g.name)}</b><span>${esc(g.why)}</span></button><div class="opts">` +
    g.items.map(it => `<button class="opt ${fn(it.c)}" ${it.act == null ? goAttr(it.c) : `data-act="${it.act}"`} data-via="${esc(g.name.toLowerCase())}"><b>${esc(cname(it.c))}</b><i>${esc(numeral(it.c))}${it.note ? (it.note[0] === '→' ? ' ' : ' · ') + esc(it.note) : ''}</i></button>`).join('') + '</div></div>').join('');
}
