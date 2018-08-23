var Utils = require("./utils.js");
var Z80 = require("./z80.js");
var KEY = require("./key.js");
var AUD = require("./aud.js");
var VID = require("./vid.js");
var HBF = require("./hbf.js");
var MMU = require("./mmu.js");
//var AdmZip = require('adm-zip');

////////////////////////////////////////////
// TVC
////////////////////////////////////////////
function TVC(type,callback) {
	var TVCthis = this;
	this._callback = callback;
	this._clock = 0;
	this._clockdiff = 0; // how much the cpu is ahead
	this._clockfreq = 3125000;
	this._clockperline = this._clockfreq * 0.000064;// 64us = 200
	this._clockperframe = this._clockfreq / 50; // 62500, for interrupt
	this._breakpoints = Utils.loadLocal("tvc~breakpoints", null);
	this._pendIt = 0x1F;	// b4: curs/aud, b3-0 cards , 0 active
	this._ext0 = null;
	this._ext0ite = 0; // disabled
	this._ext1 = null;
	this._ext1ite = 0; // disabled
	this._ext2ite = 0; // disabled
	this._ext3ite = 0; // disabled
	this._extTypes = 0xFF;
	this._extCartMapping = 0;
	this._mmu = new MMU(type);
	this._fb = callback({id:"fb"});
	this._vid = new VID(this._mmu, this._fb);
	this._aud = new AUD(callback({id:"aud"}));
	this._aud_it = false;
	this._key = new KEY();
	this._z80 = new Z80(this._mmu, function(addr, val) {
		TVCthis.writePort(addr, val);
	}, function(addr) {
		return TVCthis.readPort(addr);
	});

	this._mmu.breakAddr = Utils.loadLocal("tvc~memory-breakpoints", null);
}

TVC.prototype.reset = function() {
	this._z80.reset();
	this._mmu.reset();
};

TVC.prototype.addRom = function(name, data) {
	console.log("ADD ROM: ", name);
	if (/DOS/.test(name)) {
		this.extensionAttach(0, new HBF(data));
	}
	else {
		this._mmu.addRom(name, data);
	}
};

// /////////////////////////////
// UI
// /////////////////////////////
TVC.prototype.keyUp = function(code) {
	this._key.keyUp(code);
};

TVC.prototype.keyDown = function(code) {
	return this._key.keyDown(code);
};

TVC.prototype.keyPress = function(code) {
	this._key.keyPress(code);
};

TVC.prototype.focusChange = function(hasFocus) {
	if (!hasFocus) {
		this._key.reset();
	}
};

// /////////////////////////////
// load cas/dsk
// /////////////////////////////
TVC.prototype.loadImg = function(name,data) {
	var extension = name.slice(-4).toLowerCase();
	if (extension == ".cas") {
		console.log("loaded:",name);
		var savemap = this._mmu.getMap();
		this._mmu.setMap(0xb0);
		for (var i = 144; i < data.length; i++) {
			this._mmu.w8(6639 + i - 144, data[i]);
		}
		this._mmu.setMap(savemap);
	}
	else if (extension == ".dsk") {
		if (this._ext0) {
			this._ext0.loadDisk(name, data);
		}
	}
/*	else if (extension == ".zip") {
		var z = new AdmZip(Buffer.from(data));
		var e = z.getEntries();
		this.loadImg(e[0].entryName, e[0].getData());
	}
	*/
};

// /////////////////////////////
// the show must go on!
// /////////////////////////////
TVC.prototype.runForAFrame = function() {
	var doBreak = false;
	var maxTime = 2 * this._clockperframe;
	var cpuTime = 0;
	var drawInfo = [false,false];
	var clocksave = this._clock;
	while (!doBreak && maxTime > 0) {
		cpuTime = this._z80.step(0);
		if (this._breakpoints) {
			doBreak = (this._breakpoints[this._z80.getRegVal("PC")] !== undefined);
		}
		this._clock += cpuTime;
		maxTime -= cpuTime;

		drawInfo = this._vid.streamSome(cpuTime);
		if (drawInfo[0]) { // crtc is initialized
			if (drawInfo[1] && this._z80.irqEnabled()) { // it
				var irqDuration = this._z80.irq();
				this._pendIt &= ~(0x10); // cursor IT
				this._vid.streamSome(irqDuration);
			}
			if (this._vid.renderStream()) {
				this._fb.refresh();
				break;
			}
		}
	}

	if (doBreak) {
		this._callback({id: "notify", str: "breakpoint: " + Utils.toHex16(this._z80.getRegVal("PC"))});
		console.warn("BREAK");
		this.dreg();
	}
	//console.log("FRAMET: " + (performance.now() - timestart));

	return doBreak;
};

TVC.prototype.runForAFrame2 = function() {
	var cpuTime = 0;
	cpuTime = this._z80.step(this._clockperframe);
	this._clock += cpuTime;
	this._vid.renderFrame();
	this._fb.refresh();

	return false;
};

// /////////////////////////////
// IO
// /////////////////////////////
TVC.prototype.writePort = function (addr, val) {
	var val1, val2, val3;
	switch(addr) {
	case 0x00:
		this._vid.setBorder(val);
		break;

	case 0x02:
		this._mmu.setMap(val);
		break;

	case 0x03:
		this._key.selectRow(val & 0xF);
		this._extCartMapping = val >>> 6;
		this._mmu.extmmu = null;
		switch(this._extCartMapping) {
			case 0:
				if (this._ext0) this._mmu.extmmu = this._ext0.mmu;
				break;
			case 1:
				if (this._ext1) this._mmu.extmmu = this._ext1.mmu;
				break;
			default:
				this._mmu.extmmu = null;
		}
		break;

	case 0x04:
		this._aud.setFreqL(val & 0xFF);
		break;

	case 0x05:
		this._aud_it = (val & 0x20) !== 0;
		this._aud.setFreqH(val & 0x0F);
		this._aud.setOn((val & 0x10) !== 0);
		//console.log("AUD: it: " + this._aud_it);
		break;

	case 0x06:
		val1 = val & 0x80; // Printer ack
		val2 = (val >> 2) & 0x0F; // Sound amp
		val3 = val & 0x03; // video mode
		this._vid.setMode(val3);
		this._aud.setAmp(val2);
		break;

	case 0x07:
		// cursor/audio irq ack
		this._pendIt |= 0x10;
		break;

	case 0x0C:
	case 0x0D:
	case 0x0E:
	case 0x0F:
		this._mmu.setVidMap(val);
		break;

	// bit7 : CSTL interrupt enable
	case 0x58:
		this._ext0ite = (val >>> 7) & 1;
		break;
	case 0x59:
		this._ext1ite = (val >>> 7) & 1;
		break;
	case 0x5A:
		this._ext2ite = (val >>> 7) & 1;
		break;
	case 0x5B:
		this._ext3ite = (val >>> 7) & 1;
		break;

	case 0x60:
	case 0x61:
	case 0x62:
	case 0x63:
		this._vid.setPalette(addr - 0x60, val);
		break;

	case 0x70:
		this._vid.setRegIdx(val);
		break;

	case 0x71:
		this._vid.setReg(val);
		break;

	default:
		if (addr >= 0x10 && addr <= 0x1F && this._ext0) {
				this._ext0.writePort(addr & 0x0F, val);
		}
		else if (addr >= 0x20 && addr <= 0x2F && this._ext1) {
				this._ext1.writePort(addr & 0x0F, val);
		}
		else {
			debugger;
			console.warn("Unhandled port write: " + Utils.toHex8(addr) + " " + Utils.toHex8(val)," (PC:",Utils.toHex16(this._z80.getRegVal("PC")),")");
		}
	}
};

TVC.prototype.readPort = function(addr) {
	var result;
	switch (addr) {
	case 0x58:
		result = this._key.readRow();
		break;

	case 0x59:
		//    59H     +++43210    R       Pending IT requests
		//    59H     765+++++    R       7: printer ack, 6: bw0/color1, 5: tape data in
		result = 0x40 | this._pendIt;
		break;

	case 0x5A:
		result = this._extTypes;
		result = 0xff;
		break;

	default:
		if (addr >= 0x10 && addr <= 0x1F && this._ext0) {
			result = this._ext0.readPort(addr & 0x0F);
		}
		else if (addr >= 0x20 && addr <= 0x2F && tihs._ext1) {
			result = this._ext1.readPort(addr & 0x0F);
		}
		else {
			console.warn("Unhandled port read: ", Utils.toHex8(addr)," (PC:",Utils.toHex16(this._z80.getRegVal("PC")),")");
			result = 0xff;
		}
	}
	return result;
};

// /////////////////////////////
// extensions
// /////////////////////////////
TVC.prototype.extensionAttach = function(port,ext) {
	if (port === 0) {
		this._ext0 = ext;
		this._ext0.mmu.name = "CART0";
		this._mmu.extmmu = this._ext0.mmu;
	}
	else if (port == 1) {
		this._ext1 = ext;
		this._ext1.mmu.name = "CART1";
	}
	else throw("invalid extension port!");
	this._extTypes &= ~(3 << (port * 2));
	this._extTypes |= (ext.getType() << (port * 2));
	console.log("Added extension: ",port," ",ext.type," extTypes:",this._extTypes.toString(2));
};

// /////////////////////////////
// debugging
// /////////////////////////////

var bpMap = {"kbd-int" : 0xd62d };
TVC.prototype.resolveAddr = function(val) {
	var addr = this._z80.getRegVal(val);
	if (isNaN(addr)) addr = parseInt(val, 16);
	if (isNaN(addr)) addr = bpMap[val];
	return addr;
};

TVC.prototype.dmem = function(addrP, lines, bytesPerLine) {
	bytesPerLine = bytesPerLine || 16;
	lines = lines || 1;
	var addr = this.resolveAddr(addrP);
	if (isNaN(addr)) {
		console.log("dumpMem: Invalid address:",addrP);
		return;
	}
	do {
		var lineStr = Utils.toHex16(addr);
		var chars = "";
		for(var i = 0; i < bytesPerLine; i++) {
			var v = this._mmu.r8(addr++);
			lineStr += " " + Utils.toHex8(v);
			if (v < 32 || v > 126) {
				chars += " ";
			}
			else {
				chars += String.fromCharCode(v);
			}
		}
		console.log(lineStr + " |"+chars+"|");
		lines--;
	} while (lines);
};

module.exports = TVC;
