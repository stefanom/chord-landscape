// Loads the app's logic into Node for the unit tests.
//
// The app is plain scripts that share one scope (see index.html), so the logic files are evaluated together
// here, exactly as the page does it. None of them touches the page while loading.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FILES = ['theory', 'voicing', 'sound', 'path', 'voices'];
const EXPORTS = [
  'S', 'Q', 'mod', 'pcs', 'same', 'cname', 'numeral', 'tones', 'fn', 'ring', 'lift', 'isHome', 'sp', 'home', 'moves', 'wander',
  'nameVoices', 'voice', 'voicings', 'entry', 'nudged', 'slipSteps', 'sixOf', 'walkScale', 'walkStep', 'shiftChord',
];

/** A fresh copy of the app's logic. */
export function load() {
  const src = FILES.map(f => readFileSync(path.join(root, 'js', `${f}.js`), 'utf8')).join('\n');
  const page = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
  const app = new Function('document', 'window', 'location',
    `${src}\nreturn { ${EXPORTS.join(', ')}, setCursor: i => { CUR = i; } };`)(page, {}, { protocol: 'file:' });
  /** Put the app in a key and on a path written in Roman numerals, with the cursor on the last chord. */
  app.at = (seq, { key = 0, mode = 'major', sevenths = false } = {}) => {
    Object.assign(app.S, { key, mode, rich: sevenths });
    app.S.path = seq.split(' ').map(s => app.entry(app.sp(s)));
    app.setCursor(app.S.path.length - 1);
    return app.S.path;
  };
  app.names = list => list.map(app.cname).join(' ');
  return app;
}
