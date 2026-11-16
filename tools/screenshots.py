#!/usr/bin/env python3
"""Regenerate the pictures in docs/img/ from the app itself. Needs the browser test tools (requirements-dev.txt)."""
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'tools'))
from build import bundle  # noqa: E402

OUT = ROOT / 'docs' / 'img'


def group(name):
    return f'#compass .verb:has(.verb-h b:text-is("{name}")) .opt'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp, sync_playwright() as p:
        page_file = Path(tmp) / 'chord-landscape.html'
        page_file.write_text(bundle(), encoding='utf-8')
        browser = p.chromium.launch()

        def fresh(scheme, height):
            page = browser.new_context(viewport={'width': 1280, 'height': height}, color_scheme=scheme).new_page()
            page.goto(page_file.as_uri())
            page.wait_for_selector('#path .chip')
            return page

        # A path on the Roads map.
        page = fresh('light', 960)
        page.click('#seeds [data-seed="4"]')
        page.click('#play')
        page.eval_on_selector('#where', 'e => e.scrollIntoView()')
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / 'roads.png'))

        # A diminished chord and its four homes on the Wheel.
        page = fresh('dark', 960)
        page.click(group('Home and pull') + ':has(b:text-is("C6"))')
        page.click(group('Home and pull') + ':has(i:text("walk up"))')
        page.click('#scale8')
        page.click('#lens-tabs [data-lens=wheel]')
        page.eval_on_selector('#where', 'e => e.scrollIntoView()')
        page.wait_for_timeout(200)
        page.screenshot(path=str(OUT / 'wheel.png'))
        browser.close()
    for f in sorted(OUT.glob('*.png')):
        print(f'{f.relative_to(ROOT)}  ({f.stat().st_size / 1024:.0f} KB)')


if __name__ == '__main__':
    main()
