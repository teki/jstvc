.PHONY: bundle

all: bundle

bundle:
	 parcel watch index.js --out-dir . --out-file bundle.js
