#!/usr/bin/env python3
"""Bundle the app into one self-contained HTML file.

The repository runs as it is: index.html loads css/style.css and the scripts in js/, and fetches the piano
recordings from assets/piano/. This script folds all of that into a single file, dist/chord-landscape.html, which
needs no server and no network: it opens straight from disk, and can be mailed or dropped into any host.

    python3 tools/build.py                 # -> dist/chord-landscape.html
    python3 tools/build.py -o some.html
    python3 tools/build.py --no-samples    # much smaller; the synth plays instead of the piano
"""
import argparse
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINK = '<link rel="stylesheet" href="css/style.css">'
SCRIPT = re.compile(r'[ \t]*<script src="(js/[^"]+)"></script>\n')


def bundle(root=ROOT, samples=True, replace=None, extra_css=''):
    """Return the single-file page as a string.

    replace maps a source path (say 'js/theme.js') to another file to use in its place, and extra_css is
    appended to the stylesheet: together they let a host swap in its own colour scheme without forking.
    """
    replace = replace or {}

    def read(rel):
        return (Path(replace[rel]) if rel in replace else root / rel).read_text(encoding='utf-8')

    html = read('index.html')
    if LINK not in html:
        raise SystemExit('index.html no longer links css/style.css the way build.py expects')
    html = html.replace(LINK, '<style>\n' + (read('css/style.css') + extra_css).rstrip('\n') + '\n</style>')

    names = SCRIPT.findall(html)
    if not names:
        raise SystemExit('index.html has no <script src="js/..."> tags to bundle')
    # One closure for all the files, in the order the page loads them.
    js = '\n'.join(read(n).rstrip('\n') + '\n' for n in names).replace('</script', '<\\/script')

    block = ''
    if samples:
        data = {p.stem: base64.b64encode(p.read_bytes()).decode('ascii') for p in sorted((root / 'assets/piano').glob('*.mp3'))}
        block = '<script type="application/json" id="piano-samples">' + json.dumps(data, separators=(',', ':')) + '</script>\n'

    start = SCRIPT.search(html).start()
    return html[:start] + block + "<script>\n(() => {\n'use strict';\n" + js + '})();\n</script>\n' + SCRIPT.sub('', html[start:])


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('-o', '--out', default=str(ROOT / 'dist' / 'chord-landscape.html'), help='where to write the file')
    ap.add_argument('--no-samples', action='store_true', help='leave the piano recordings out')
    args = ap.parse_args()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(bundle(samples=not args.no_samples), encoding='utf-8')
    print(f'{out}  ({out.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
