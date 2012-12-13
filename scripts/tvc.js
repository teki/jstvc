/* Resources
	http://www.z80.info/decoding.htm
*/

var requirejs = require('./r.js');
requirejs.config({
	nodeRequire: require
});

var n_fs = requirejs("fs");
var z80 = requirejs("z80");

function toHex8(x) {
	var s = x.toString(16).toUpperCase();
	return "0".slice(s.length - 1) + s;
}

function toHex16(x) {
	var s = x.toString(16).toUpperCase();
	return "000".slice(s.length - 1) + s;
}

////////////////////////////////////////////
// MMU
////////////////////////////////////////////
function MMU() {
	this._u0 = new Uint8Array(16384);
	this._u1 = new Uint8Array(16384);
	this._u2 = new Uint8Array(16384);
	this._u3 = new Uint8Array(16384);
	this._sys = [];
	//this._cart = Uint8Array(new ArrayBuffer(16384));
	this._cart = this._sys;
	this._ext = new Uint8Array(16384);
	this._vid = new Uint8Array(16384);
	this._map = [];
	this._mapVal = -1;

	this.init();
}

MMU.prototype.init = function() {
	var i;
	for (i = 0; i < this._u0.length; i++) this._u0[i] = 0;
	for (i = 0; i < this._u1.length; i++) this._u1[i] = 0;
	for (i = 0; i < this._u2.length; i++) this._u2[i] = 0;
	for (i = 0; i < this._u3.length; i++) this._u3[i] = 0;
	// for(i=0; i<this._cart.length; i++) this._cart[i] = 0;
	for (i = 0; i < this._ext.length; i++) this._ext[i] = 0;

	var ext = n_fs.readFileSync("../TVC_EXT.ROM");
	for (i = 0; i < ext.length; i++) this._ext[0x2000 + i] = ext[i];

	if (this._ext[0x3000] != 0x3e) throw ("ext is not properly initialized!");

	this._sys = n_fs.readFileSync("../TVC_SYS.ROM");
	this.setMap(0);
};
MMU.prototype.reset = function() {
	this.setMap(0);
};
MMU.prototype.setMap = function(val) {
	if (val == this._mapVal) return;

	// page 3
	var page3 = (val & 0xc0) >> 6;
	this._map[3] = [this._cart, this._sys, this._u3, this._ext][page3];

	// page 2
	if (val & 0x20)
		this._map[2] = this._u2;
	else
		this._map[2] = this._vid;

	// page 1 is always u1
	this._map[1] = this._u1;

	// page 0
	var page0 = (val & 0x18) >> 3;
	this._map[0] = [this._sys, this._cart, this._u0, undefined][page0];
	if (page0 === 3)
		throw "do not know";
};
MMU.prototype.getMap = function() {
	return this._mapVal;
};
MMU.prototype.w8 = function(addr, val) {
	addr = addr & 0xFFFF;
	val = val & 0xFF;
	var mapIdx = addr >>> 14;
	var block = this._map[mapIdx];
	if (block === this._sys || block === this._ext) return;
	if (!block)
		throw("invalid block: " + toHex16(addr) + " mapIdx:" + mapIdx + " mapping: " + this._map);
	block[addr & 0x3FFF] = val;
};
MMU.prototype.w16 = function(addr, val) {
	this.w8(addr + 1, val >>> 8);
	this.w8(addr, val & 0xFF);
};
MMU.prototype.r8 = function(addr) {
	addr = addr & 0xFFFF;
	var mapIdx = addr >>> 14;
	return this._map[mapIdx][addr & 0x3FFF];
};
MMU.prototype.r8s = function(addr) {
	addr = addr & 0xFFFF;
	var mapIdx = addr >>> 14;
	var val = this._map[mapIdx][addr & 0x3FFF];
	if (val & 0x80) return -1 * (0x80 - (val & 0x7f));
	return val;
};
MMU.prototype.r16 = function(addr) {
	return (this.r8(addr + 1) << 8) | this.r8(addr);
};
MMU.prototype.dasm = function(addr, lines, prefix) {
	var offset = 0,
		d, i, str, oplen;
	do {
		d = z80.decodeZ80(this, addr + offset);
		oplen = d[1];

		str = toHex16(addr + offset) + " ";
		for (i = 0; i < 4; i++) {
			if (i < oplen) {
				str += toHex8(this.r8(addr + offset + i)) + " ";
			}
			else {
				str += "   ";
			}
		}
		console.log(prefix + str + d[0] + "\n");
		offset += oplen;
		lines--;
	} while (lines);
};

////////////////////////////////////////////
// VID
////////////////////////////////////////////
function VID(mmu) {
	this._mmu = mmu;
	this._clock = 0;
	this._palette = [0,0,0,0];
	this._border = 0;
	this._regIdx = 0;
	this._reg = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	this._mode = 0; // 00: 2, 01: 4, 1x: 16 color
}

VID.prototype.setPalette = function(idx, color) {
	this._palette[idx] = color;
};

VID.prototype.getPalette = function(idx) {
	return this._palette[idx];
};

VID.prototype.setBorder = function(color) {
	this._border = color;
};

VID.prototype.setReg = function(val) {
	this._reg[this._regIdx] = val;
//	console.log(this._reg);
};

VID.prototype.getReg = function() {
	return this._reg[this._regIdx];
};

VID.prototype.setRegIdx = function(idx) {
	if (idx < 0 || idx > 17) return;
	this._regIdx = idx;
};

VID.prototype.getRegIdx = function() {
	return this._regIdx;
};

VID.prototype.setMode = function(mode) {
	this._mode = mode;
};

////////////////////////////////////////////
// VID
////////////////////////////////////////////
function AUD() {
	this._clock = 0;
	this._amp = 0;
	this._freq = 0;
}

AUD.prototype.setAmp = function(val) {
	this._amp = val;
};

AUD.prototype.setFreqL = function(val) {
    this._freq = (this._freq & 0x0F00) | (val & 0xFF);
};

AUD.prototype.setFreqH = function(val) {
    this._freq = (this._freq & 0xFF) | (val << 8);
};

////////////////////////////////////////////
// KEY
////////////////////////////////////////////
function KEY() {
	this._row = 0;
	this._state = 0;
}

KEY.prototype.selectRow = function(val) {
	this._row = val;
}
////////////////////////////////////////////
// TVC
////////////////////////////////////////////
function TVC() {
	var TVCthis = this;
	this._clock = 0;
	this._mmu = new MMU();
	this._vid = new VID(this._mmu);
	this._aud = new AUD();
    this._aud_it = false;
    this._aud_on = false;
	this._key = new KEY();
	this._z80 = new z80.Z80(this._mmu, function(addr, val) {
		TVCthis.writePort(addr, val);
	}, function(addr) {
		return TVCthis.readPort(addr);
	});
}

TVC.prototype.run = function() {
	var limit = 100;
	while (this._clock < limit) {
		var tinc = this._z80.step();
		this.clock += tinc;
	}
};

TVC.prototype.writePort = function (addr, val) {
    var val1, val2, val3;
//    console.log("OUT (" + toHex8(addr) + "), " + toHex8(val));
	if (addr == 0x00) {
		this._vid.setBorder(val);
		return;
	}
    if (addr == 0x02) {
        this._mmu.setMap(val);
        return;
    }
    else if (addr == 0x03) {
        this._key.selectRow(val & 0xF);
        // 2 bits to select I/O memory, ignore it for now
        return;
    }
    else if (addr == 0x04) {
        this._aud.setFreqL(val & 0xFF);
        return;
    }
    else if (addr == 0x05) {
        this._aud_on = (val & 0x10) !== 0;
        this._aud_it = (val & 0x20) !== 0;
        this._aud.setFreqH(val & 0x0F);
        return;
    }
    else if (addr == 0x06) {
        val1 = val & 0x80; // Printer ack
        val2 = (val >>> 2) & 0x0F; // Sound amp
        val3 = val & 0x03; // video mode
        this._vid.setMode(val3);
        this._aud.setAmp(val2);
        return;
    }
	else if (addr == 0x07) {
		// cursor/audio irq ack
		return;
	}
    else if (addr >= 0x58 && addr <= 0x5B) {
		// bit7 : CSTL interrupt enable
        return;
    }
    else if (addr >= 0x60 && addr <= 0x63) {
        this._vid.setPalette(addr - 0x60, val);
        return;
    }
    else if (addr == 0x70) {
        this._vid.setRegIdx(val);
        return;
    }
    else if (addr == 0x71) {
        this._vid.setReg(val);
        return;
    }
    throw ("unhandled port write " + toHex8(addr) + " " + toHex8(val));
};

TVC.prototype.readPort = function(addr) {
	if (addr == 0x5A) {
		return 0xFF;
	}
	throw "unhandled port read " + toHex8(addr);
};

////////////////////////////////////////////
// runner
////////////////////////////////////////////

var tvc = new TVC();
tvc.run();

