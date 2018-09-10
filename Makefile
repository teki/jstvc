PARCEL_BIN=node ./node_modules/parcel-bundler/bin/cli.js

.PHONY: all bundle

all: bundle

bundle:
	$(PARCEL_BIN) watch index.js --out-dir . --out-file bundle.js

run:
	python -m SimpleHTTPServer 8080

run-dist:
	cd dist; python -m SimpleHTTPServer 8080

release:
	rm -rf dist/*
	mkdir -p dist/games2
	$(PARCEL_BIN) build index.js
	cp games2/mralex.tvz dist/games2
	cp style/view.css dist
	cp index.html dist
	rm dist/*.map
	cd dist; tar cvzf r.tgz *
