#!/bin/bash
function abort() { echo $@; exit 1; }

SJNAME=sjasm42c.zip

mkdir -p build
pushd build

if [ ! -e ${SJNAME} ]; then
	curl http://home.wanadoo.nl/smastijn/${SJNAME} -o ${SJNAME}
fi
if [ ! -d sjasm ]; then
	unzip -d sjasm ${SJNAME}
	pushd sjasm/sjasmsrc*
	patch -p0 < ../../../sjasm.patch || abort Patch error!
	popd
fi
if [ ! -e sjasm.js ]; then
	type emmake >/dev/null 2>&1 || abort No emscripten on the path!
	pushd sjasm/sjasmsrc*
	emmake make || abort Build error!
	popd
	cp sjasm/sjasmsrc*/sjasm.js .
fi

popd

sed -e '/%%CODE%%/r build/sjasm.js' sjasm_template.js >../3rdparty/sjasm.js
 
