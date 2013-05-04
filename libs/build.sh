#!/bin/bash
function abort()
{
	echo $@
	exit 1
}

type emmake >/dev/null 2>&1 || abort No emscripten on the path!

# vasm
if [ ! -e vasm.tar.gz ]; then
	curl -O http://sun.hasenbraten.de/vasm/release/vasm.tar.gz
fi
if [ ! -d vasm ]; then
	tar xvzf vasm.tar.gz
	cd vasm
	patch < ../vasm.patch
	cd -
fi

cd vasm

if [ ! -e Makefile.emscripten ]; then
cat > Makefile.emscripten <<"EOF"
# Emscripten

TARGET =
TARGETEXTENSION = 

CCOUT = -o 
COPTS = -c -O2 

LD = $(CC)
LDOUT = $(CCOUT)
LDFLAGS = -lm

RM = rm -f

include make.rules
EOF
fi

emmake make -f Makefile.emscripten CPU=z80 SYNTAX=oldstyle

mv vasmz80_oldstyle vasmz80_oldstyle.bc
emcc -O2 vasmz80_oldstyle.bc -o vasmz80_oldstyle.js


cp vasmz80_oldstyle.js ../../3rdparty

cd -
rm -rf vasm

