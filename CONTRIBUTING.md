# Contributing

Bug reports, ideas and pull requests are welcome.

## Getting set up

There is nothing to install to run the app: `make serve`, then open <http://localhost:8000>. Edit a file and
reload.

To run the tests you need Node 20 or later, and Python 3.9 or later with the test tools:

```
pip install -r requirements-dev.txt
python3 -m playwright install chromium
make test
```

## How the code is organised

The scripts in `js/` are plain files that share one scope, loaded in the order `index.html` lists them. There are
no modules and no bundler. Two things follow from that:

- A name declared at the top of one file is visible in every later file, so top-level names must be unique.
- A file may only *use* another file's names inside functions, or after that file has loaded.

`tools/build.py` folds everything into one file by wrapping the scripts, in the same order, in a single closure.
The browser tests run against both forms, so a change that works in one and not the other is caught.

`README.md` has a map of the files, and `docs/model.md` describes the rules the harmony logic follows.

## Tests

- `tests/unit/` loads the harmony logic into Node and checks it directly: chord names, jobs, moves, voicings.
  If you change a rule in `js/theory.js` or `js/voices.js`, add or update a test there.
- `tests/e2e/` drives the real page in Chromium. Every test also fails on any script error or console error.

## Style

- Plain JavaScript, no dependencies, no build step for development.
- Text in the page is written for a musician at a keyboard, not for a theorist: say what to do with your hands.
- The three jobs (rest, drift, pull) and their colours mean the same thing everywhere in the page.
- `docs/img/` is regenerated with `python3 tools/screenshots.py`.

## Sound

The piano recordings in `assets/piano/` have their own license; see the README in that folder before replacing
or adding any.
