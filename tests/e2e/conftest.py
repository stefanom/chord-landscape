"""Browser tests run against both ways the app ships: the repository served over http (as GitHub Pages
serves it) and the single self-contained file made by tools/build.py."""
import http.server
import subprocess
import sys
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]


class _Quiet(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, *args):
        pass


@pytest.fixture(scope='session')
def served():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), _Quiet)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    yield f'http://127.0.0.1:{server.server_address[1]}/index.html'
    server.shutdown()


@pytest.fixture(scope='session')
def bundled(tmp_path_factory):
    out = tmp_path_factory.mktemp('dist') / 'chord-landscape.html'
    subprocess.run([sys.executable, str(ROOT / 'tools' / 'build.py'), '-o', str(out)], check=True, stdout=subprocess.DEVNULL)
    return out.as_uri()


@pytest.fixture(scope='session')
def browser():
    with sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


@pytest.fixture(params=['served', 'bundled'])
def page(request, browser):
    """The app, freshly opened. Any script error or console error fails the test that used it."""
    context = browser.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='light')
    pg = context.new_page()
    errors = []
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    pg.goto(request.getfixturevalue(request.param))
    pg.wait_for_selector('#path .chip')
    yield pg
    context.close()
    assert not errors, errors
