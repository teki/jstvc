.PHONY: bundle

all: bundle

bundle:
	 parcel watch index.js --out-dir . --out-file bundle.js

release:
	parcel build index.js
	cp games2/mralex.tvz dist
	cp style/view.css dist
	cp index.html dist
	rm dist/*.map