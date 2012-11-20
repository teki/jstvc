var fs = require("fs");

function toHex8(x) {
    var s = x.toString(16).toUpperCase();
	return "0".slice(s.length - 1) + s;
}

function toHex16(x) {
	var s = x.toString(16).toUpperCase();
	return "000".slice(s.length - 1) + s;
}

function dumpSome(buffer, offset, lines) {
	if (lines == 0) lines = buffer.length / 16;
	do {
		var lineStr = toHex16(offset);
		for(var i = 0; i < 16; i++) {
			lineStr += " " + toHex8(buffer[offset]);
			offset++;
		}
		console.log(lineStr);
		lines--;
	} while (lines);
}

/*
memory mapping: 4*16k pages: 0,1,2,3
ram pages: U0, U1, U2, U3
SYS: system (editor + basic)
EXT: extension (boot)
VID: video
CART: cartridge
possible values:
0: U0, SYS
1: U1
2: U2, VID
3: U3, EXT, SYS

mapping: writing to port 2
b7-b6: 3: 00 CART, 01 SYS, 10 U3, 11 EXT
b5   : 2: 0 VID, 1 U2
b4-b3: 0: 00 SYS, 01 CART, 10 U0
b2   : 1: 1 U1
b1-b0: --
*/

var b3 = fs.readFileSync("TVC12_D3.64K"); // sys1
var b4 = fs.readFileSync("TVC12_D4.64K"); // sys0
var b7 = fs.readFileSync("TVC12_D7.64K"); // ext

console.log("TVC12_D3.64K length: " + b3.length);
dumpSome(b3, 0, 4);

console.log("TVC12_D4.64K length: " + b4.length);
dumpSome(b4, 0, 4);

console.log("TVC12_D7.64K length: " + b7.length);
dumpSome(b7, 4096-16, 4);