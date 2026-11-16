.PHONY: serve build unit e2e test screenshots

serve:
	python3 -m http.server 8000

build:
	python3 tools/build.py

unit:
	node --test tests/unit/*.test.mjs

e2e:
	python3 -m pytest

test: unit e2e

screenshots:
	python3 tools/screenshots.py
