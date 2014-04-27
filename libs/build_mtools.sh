#!/bin/bash
function abort() { echo $@; exit 1; }

MTNAME=mtools-4.0.18

mkdir -p build
pushd build

if [ ! -e ${MTNAME}.tar.gz ]; then
	curl -O ftp://ftp.gnu.org/gnu/mtools/${MTNAME}.tar.gz
fi

if [ ! -d ${MTNAME} ]; then
	tar xvzf ${MTNAME}.tar.gz
	pushd ${MTNAME}
	patch -p1 < ../../mtools.patch || abort Patch error!
	popd
fi

if [ ! -e mtools.js ]; then
	type emmake >/dev/null 2>&1 || abort No emscripten on the path!
	pushd ${MTNAME}
	if [ ! -e Makefile ]; then
		emconfigure ./configure || abort Configure error!
	fi
	emmake make || abort Build error!
	cp mtools mtools.bc
	emcc -O2 -o mtools.js mtools.bc
	# these two are implemented in the template, no need to abort
	sed -i.bak 's/function _random/function _randomxxx/g' mtools.js
	sed -i.bak 's/function _srandom/function _srandomxxx/g' mtools.js
	# the appliaction binary  must be called mtools to work properly
	sed -i.bak 's/this.program/mtools/g' mtools.js
	# this codepage is not supported by the libc in emscripten
	sed -i.bak 's/ANSI_X3.4-1968/UTF-8/g' mtools.js
	cp mtools.js ..
	popd
fi

popd

sed -e "/%%CODE%%/r build/mtools.js" mtools_template.js >../3rdparty/mtools.js
 
