import assert from 'node:assert/strict';
import { test } from 'node:test';
import { load } from './harness.mjs';

const legal = v => v.rh.every((m, i) => (i === 0 || m > v.rh[i - 1]) && m >= 52 && m <= 79) && v.bass >= 36 && v.bass <= 50 && v.bass < v.rh[0];

test('chords are voiced inside the hands, and common tones are held', () => {
  const app = load();
  const V = app.voicings(app.at('I IV V I vi ii V I'));
  for (const v of V) assert.ok(legal(v), JSON.stringify(v));
  assert.ok(V[0].rh.includes(60) && V[1].rh.includes(60), 'C is held from C to F');
});

test('one finger, one half step', () => {
  const app = load();
  app.at('I');
  const name = (k, d) => { const c = app.nudged(k, d); return c && app.cname(c); };
  assert.equal(name(3, 1), 'C+');       // the top note G goes up to G sharp
  assert.equal(name(2, -1), 'Cm');      // the middle note E goes down to E flat
  assert.equal(name(1, -1), 'Cmaj7');   // the bottom note C goes down to B
  assert.equal(name(0, 1), 'C/D♭');     // voice 0 is the bass
  const moved = app.nudged(3, 1);
  assert.deepEqual(moved.v.rh, [60, 64, 68]);
});

test('a finger cannot land on a key another finger holds, and the bass stays below the hand', () => {
  const app = load();
  Object.assign(app.S, { key: 0, mode: 'major' });
  app.S.path = [app.entry({ r: 0, q: '', v: { rh: [60, 61, 67], bass: 50 } })];
  app.setCursor(0);
  assert.equal(app.nudged(1, 1), null);
  assert.equal(app.nudged(0, 1), null);
});

test('slipping to a chord moves one voice a half step at a time', () => {
  const app = load();
  app.at('I');
  const slip = s => app.slipSteps(app.sp(s));
  assert.equal(app.names(slip('vi')), 'C+ Am');
  assert.equal(app.names(slip('iv')), 'Csus4 Fm');
  assert.equal(app.names(slip('IV')), 'C+ C6 F');
  assert.equal(slip('♭VII'), null, 'too far to slip');
  for (const target of ['vi', 'iv', 'IV', 'V', '♭VI']) {
    const steps = slip(target);
    let prev = app.voicings(app.S.path)[0];
    for (const step of steps.slice(0, -1)) {
      const before = [prev.bass, ...prev.rh], after = [step.v.bass, ...step.v.rh];
      assert.equal(before.length, after.length);
      assert.equal(after.reduce((t, m, i) => t + Math.abs(m - before[i]), 0), 1, `${target}: ${app.cname(step)}`);
      prev = step.v;
    }
    assert.ok(app.same(steps.at(-1), app.sp(target)), `${target} is where the slip ends`);
  }
});

test('the eight-note scale walks home, pull, home, pull', () => {
  const app = load();
  app.at('I');
  let v = app.voice({ r: 0, q: '6' }, null);
  const scale = { x: 0, minor: false }, walk = [];
  for (let i = 0; i < 6; i++) { const step = app.walkStep(scale, 1, v); walk.push(step); v = step.v; }
  assert.equal(app.names(walk), 'D°7 C6/E F°7 C6/G G♯°7 Am7');
  assert.deepEqual(walk.map(app.fn), ['pull', 'rest', 'pull', 'rest', 'pull', 'rest']);
  for (const step of walk) assert.ok(legal(step.v), JSON.stringify(step.v));
  const back = app.walkStep(scale, -1, walk[0].v);
  assert.equal(app.cname(back), 'C6');
});

test('C6 and Am7 are the same four notes, so they sit in the same scale', () => {
  const app = load();
  assert.deepEqual(app.sixOf({ r: 0, q: '6' }), { x: 0, minor: false });
  assert.deepEqual(app.sixOf({ r: 9, q: 'm7' }), { x: 0, minor: false });
  assert.equal(app.sixOf({ r: 0, q: '' }), null);
  app.at('I');
  app.S.path = [app.entry({ r: 0, q: '6' })];
  app.setCursor(0);
  assert.deepEqual(app.walkScale(), { x: 0, minor: false });
});

test('changing key keeps a fingering you made by hand', () => {
  const app = load();
  const c = app.entry({ r: 0, q: 'aug', v: { rh: [60, 64, 68], bass: 48 } });
  const d = app.shiftChord(c, 2);
  assert.equal(d.r, 2);
  assert.deepEqual(d.v.rh.map(m => m - d.v.rh[0]), [0, 4, 8]);
  assert.equal(app.mod(d.v.rh[0]), 2);
  assert.equal(app.mod(d.v.bass), 2);
});
