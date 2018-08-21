
.PHONY: bundle

all: bundle

bundle:
	browserify -o bundle.js -s Emu frontend2.js
    