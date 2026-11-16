/* Chord Landscape. Known progressions to start from, drills, and the practice dares. */
'use strict';

/* ===== trailheads, wander, dares ===== */
const SEEDS = [
  ['The four chords', 'major', 'I V vi IV', 'Everybody’s loop. Bend it.'],
  ['Royal road', 'major', 'IV V iii vi', 'Starts away from home and never quite lands.'],
  ['Pachelbel', 'major', 'I V vi iii IV I IV V', 'Eight steps over a falling bass.'],
  ['Circle of fifths', 'major', 'vi ii V I IV vii° III7 vi', 'Every root falls a fifth.'],
  ['Bittersweet', 'major', 'I III7 IV iv', 'A ramp that misses, then the borrowed iv.'],
  ['Turnaround', 'major', 'I VI7 ii V', 'One ramp turns a loop into a turnaround.'],
  ['Backdoor', 'major', 'I IV iv ♭VII7', 'Home by the back way: ♭VII7 instead of V.'],
  ['Epic', 'major', 'I ♭VI ♭VII I', 'Two borrowed majors climbing home.'],
  ['Andalusian', 'minor', 'i ♭VII ♭VI V', 'A staircase down to the dominant.'],
  ['Dark anthem', 'minor', 'i ♭VI ♭III ♭VII', 'The minor twin of the four chords.'],
  ['Minor circle', 'minor', 'i iv ♭VII ♭III ♭VI ii° V i', 'Every root falls a fifth, in minor.'],
  ['Dorian lift', 'minor', 'i IV i ♭VII', 'One bright borrowed chord.'],
];
/* ----- drills from the two videos, built with exact fingerings ----- */
const DRILLS = {
  walk() {            // home, pull, home, pull: up the eight-note scale
    snap(); S.mode = 'major';
    let v = voice({ r: S.key, q: '6' }, null);
    const sc = { x: S.key, minor: false }, list = [Object.assign(nameVoices(v.bass, v.rh), { v, via: 'home: the sixth chord' })];
    for (let i = 0; i < 6; i++) { const e = walkStep(sc, 1, v); if (!e) break; list.push(e); v = e.v; }
    setPath(list); play();
  },
  slide() {           // the two-finger slide: each pair of half steps drops one step round the circle of fifths
    snap(); S.mode = 'major';
    let x = mod(S.key + 7), rh = [0, 4, 7, 9].map(iv => nearTo(mod(x + iv), 62)).sort((a, b) => a - b);
    const list = [], add = (bp, via) => { const bass = nearTo(bp, 43); list.push(Object.assign(nameVoices(bass, rh), { v: { rh: rh.slice(), bass }, via })); };
    for (let i = 0; i < 3; i++) {
      const bp = mod(x + 5), mv = rh.map((m, k) => k).filter(k => [4, 7].includes(mod(rh[k] - x)));
      add(bp, 'a sixth chord over the note a fifth below its root');
      mv.forEach(k => { rh[k] -= 1; }); add(bp, 'its 3rd and 5th slide down a half step');
      mv.forEach(k => { rh[k] -= 1; }); rh.sort((a, b) => a - b); x = mod(x + 5);
    }
    add(mod(x + 5), 'another half step: one step down the circle');
    setPath(list); play();
  },
  warmup() {          // one voice moves 7, 6, a half step lower, 6, over the root and the 3rd
    snap(); S.mode = 'major';
    const list = [];
    [[0, 4, 11, 9], [2, 3, 10, 9], [4, 3, 10, 8]].forEach(([d, third, sev, six]) => {
      const r = mod(S.key + d), bass = nearTo(r, 43), t = nearTo(mod(r + third), 64), top = t + sev - third;
      [[top, 'the 7th'], [top - (sev - six), 'down to the 6th'], [top - (sev - six) - 1, 'a half step lower'], [top - (sev - six), 'back to the 6th']].forEach(([m, via]) => list.push(Object.assign(nameVoices(bass, [t, m]), { v: { rh: [t, m], bass }, via })));
    });
    setPath(list); play();
  },
};
const DARES = [
  ['Loop the four chords. Each time round, replace exactly one of them with a borrowed chord.', 'Tap the chord before the one you want to change, then pick from “Borrow”.', ['major', 'I V vi IV']],
  ['Only move to chords that share two notes with the one you’re on. Eight chords, then find home.', 'That’s “Change one note”. On the Lattice it means crossing one edge at a time.'],
  ['Every time you land on V, go anywhere except I.', 'The road from V lists the usual escapes; “Slide” and “Borrow” have stranger ones.'],
  ['Put a ramp in front of every chord of your loop.', 'Each chord gets its own dominant one beat before it arrives. See “Aim at a chord”.', ['major', 'I vi ii V']],
  ['Get from home to ♭VI and back in four chords. Then find a second way.', 'Look at where ♭VI sits on the Roads map and what leads out of it.'],
  ['Hold one note on top through four chord changes. Start with the fifth of the key.', 'Watch the Weave: you want one thick flat line across the top.'],
  ['Walk the bass down by step and choose a chord for every bass note.', 'Pachelbel is the classic answer. Find two others.', ['major', 'I V vi iii IV I IV V']],
  ['Play a four-chord loop, then play its mirror.', 'Use “Mirror it” on each chord in turn. Rest stays rest, but pulls turn into drifts.'],
  ['Stay in the Tension zone for four chords before you resolve.', 'Ramps can chain: each one can aim at the next.'],
  ['Take one chord shape and slide it: up a half step, back, down a minor third, home.', 'Same hand shape, new place. “Slide” and “Leap a third” do this.'],
  ['Leave home by a leap of a third. Take exactly three chords to get back.', 'The Profile should show one big peak and a slow descent.'],
  ['Pick a chord on the far side of the Wheel. Reach it with a ramp, then come home by road.', 'Any chord can be a target: its dominant sits one step clockwise from it.'],
  ['Voices, not chords. Start at home and move one finger a half step at a time with the ‹ › arrows by the piano. Eight moves out, then find your way back.', 'This is how Chopin’s E minor Prelude travels: the chords are only stops along the way. Watch the Weave.'],
  ['Pick a chord under “Slip there by half steps” and listen. Then play the same slip by hand, moving the fingers in a different order.', 'Any two chords can be joined this way; the in-between sounds are where the colour is.'],
  ['Home and pull. Walk the eight-note scale in chords: sixth chord, diminished, sixth chord, up and back down.', 'Barry Harris’s scale of chords: home, the pull back to it, home again. Turn on “8-note scale” at the top of the page to see the two kinds of note on the keys.', DRILLS.walk],
  ['The two-finger slide. Right hand holds a sixth chord, left hand the note a fifth below its root. Slide the chord’s 3rd and 5th down a half step, then another: you’ve dropped one step round the circle. Keep going.', 'From Joe Mendick’s video on Barry Harris. Each pair of half steps is home, pull, new home.', DRILLS.slide],
  ['Barry Harris’s warm-up. Left hand: the root. Right hand: the 3rd and the 7th. Move the 7th down to the 6th, a half step lower, and back. Do it on I, ii and iii.', 'One moving voice instead of three chord shapes. Next: make IV minor and drop a whole step, and you’re home a minor third higher.', DRILLS.warmup],
  ['Land on a diminished seventh, then leave by a door you’ve never used: one of its four homes.', '“Home and pull” lists the four and the Wheel draws them as a square. “Make this home” moves the maps to the new key.'],
];
let dareAt = Math.floor(Math.random() * DARES.length);
function paintDare() { const d = DARES[dareAt]; $('#dare').textContent = d[0]; $('#dare-why').textContent = d[1]; $('#dare-setup').hidden = !d[2]; }
function loadSeq(mode, seq) { snap(); S.mode = mode; setPath(seq.split(' ').map(sp)); play(); }
