import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from './harness.mjs';

test('chords are spelled for the key they are in', () => {
  const app = load();
  assert.equal(app.names(app.at('vi ii V I IV vii° III7 vi', { key: 8, sevenths: true })), 'Fm7 B♭m7 E♭7 A♭maj7 D♭maj7 Gø7 C7 Fm7');
  assert.equal(app.names(app.at('I V vi IV', { key: 4 })), 'E B C♯m A');
  assert.equal(app.names(app.at('i ♭VII ♭VI V', { key: 9, mode: 'minor' })), 'Am G F E');
});

test('Roman numerals', () => {
  const app = load();
  const path = app.at('I ii iii IV V vi vii° iv ♭VI ♭VII');
  assert.deepEqual(path.map(app.numeral), ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°', 'iv', '♭VI', '♭VII']);
});

test('every chord has a job: rest, drift or pull', () => {
  const app = load();
  app.at('I');
  const job = s => app.fn(app.sp(s));
  const want = { I: 'rest', ii: 'drift', iii: 'rest', IV: 'drift', V: 'pull', vi: 'rest', 'vii°': 'pull', iv: 'drift', '♭VI': 'drift', '♭VII': 'drift', '♭III': 'rest', III7: 'pull', '♭II7': 'pull', V7: 'pull' };
  for (const [s, j] of Object.entries(want)) assert.equal(job(s), j, s);
});

test('how far outside the key a chord sits', () => {
  const app = load();
  app.at('I');
  const ring = s => app.ring(app.sp(s));
  assert.deepEqual(['I', 'vi', 'V7', 'vii°'].map(ring), [0, 0, 0, 0]);      // in the key
  assert.deepEqual(['iv', '♭VI', '♭VII', 'III7'].map(ring), [1, 1, 1, 1]);  // borrowed chords and ramps
  assert.equal(ring('♭II7'), 2);                                             // far outside
});

test('home is the tonic chord, and only that', () => {
  const app = load();
  app.at('I');
  assert.ok(app.isHome(app.sp('I')));
  assert.ok(!app.isHome(app.sp('vi')));
  assert.ok(!app.isHome(app.sp('I7')));
  assert.equal(app.lift(app.sp('I')), 0);
  assert.ok(app.lift(app.sp('V')) > app.lift(app.sp('IV')));
});

test('the moves out of the tonic', () => {
  const app = load();
  app.at('I');
  const by = Object.fromEntries(app.moves(app.sp('I')).map(g => [g.id, g.items.map(x => app.cname(x.c))]));
  assert.deepEqual(by.road, ['F', 'G', 'Am', 'Dm', 'Em']);
  assert.deepEqual(by.near, ['Cm', 'Am', 'Em']);
  assert.deepEqual(by.ramp, ['A7', 'B7', 'C7', 'D7', 'E7']);
  assert.deepEqual(by.mirror, ['Cm']);
  assert.deepEqual(Object.keys(by), ['road', 'near', 'borrow', 'ramp', 'slide', 'leap', 'mirror']);
});

test('the mirror turns a pull into its minor-side twin', () => {
  const app = load();
  app.at('I');
  const mirror = s => app.moves(app.sp(s)).find(g => g.id === 'mirror').items.map(x => app.cname(x.c));
  assert.deepEqual(mirror('V'), ['Fm']);
  assert.deepEqual(mirror('VI7'), ['E♭m6']);
});

test('a ramp resolves to the chord it aims at', () => {
  const app = load();
  app.at('I');
  const road = app.moves(app.sp('VI7')).find(g => g.id === 'road').items;
  assert.equal(app.cname(road[0].c), 'Dm');
});

test('whatever the hands hold gets a name, and the bass decides', () => {
  const app = load();
  app.at('I');
  const cases = [
    [48, [60, 64, 67], 'C'], [48, [64, 69], 'C6'], [48, [64, 71], 'Cmaj7'], [48, [64, 68], 'C+'],
    [50, [65, 71], 'Dm6'], [50, [65, 70], 'B♭/D'], [40, [67, 72], 'C/E'], [40, [67, 74], 'Em7'],
    [48, [60, 65, 67], 'Csus4'], [48, [60, 62, 67], 'Csus2'], [48, [60, 63, 67], 'Cm'], [47, [60, 64, 67], 'C/B'],
    [41, [60, 64, 67, 69], 'Fmaj9'], [41, [60, 63, 66, 69], 'F7♭9'], [45, [57, 60, 64, 67], 'Am7'], [40, [64, 67, 69, 72], 'C6/E'],
    [50, [62, 65, 68, 71], 'D°7'], [48, [60, 64, 67, 70], 'C7'], [48, [60, 63, 66], 'C°'], [48, [62, 64, 67], 'Cadd9'], [48, [59, 63, 67], 'Cm(maj7)'],
  ];
  for (const [bass, rh, name] of cases) assert.equal(app.cname(app.nameVoices(bass, rh)), name, `${bass} + ${rh}`);
});

test('an unusual set of notes still gets a literal name', () => {
  const app = load();
  app.at('I');
  const c = app.nameVoices(48, [60, 64, 66]);
  assert.equal(app.cname(c), 'C(♭5)');
  assert.ok(['rest', 'drift', 'pull'].includes(app.fn(c)));
});

test('wandering starts at home and always yields named chords', () => {
  const app = load();
  for (const mode of ['major', 'minor']) {
    for (let level = 1; level <= 5; level++) {
      for (let k = 0; k < 40; k++) {
        app.at(mode === 'major' ? 'I' : 'i', { key: k % 12, mode, sevenths: k % 2 === 1 });
        const walk = app.wander(level, 8);
        assert.ok(app.isHome(walk[0]));
        assert.ok(walk.length >= 2 && walk.length <= 8, `length ${walk.length}`);
        for (const c of walk) assert.doesNotMatch(app.cname(c) + app.numeral(c), /undefined|NaN/);
      }
    }
  }
});
