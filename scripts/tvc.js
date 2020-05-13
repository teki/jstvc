import { Utils, LocalSetting } from "./utils.js";
import { Z80 } from "./z80.js";
import { KEY } from "./key.js";
import { AUD } from "./aud.js";
import { VID } from "./vid.js";
import { HBF } from "./hbf.js";
import { MMU } from "./mmu.js";
import { Dasm } from "./dasm.js";

const SettingBreakPoints = new LocalSetting("tvc~breakpoints", null);
const SettingMemBreakPoints = new LocalSetting("tvc~memory-breakpoints", null);

////////////////////////////////////////////
// TVC
////////////////////////////////////////////
export function TVC(type, callback) {
	var TVCthis = this;
	this._callback = callback;
	this._clock = 0;
	this._clockdiff = 0; // how much the cpu is ahead
	this._clockfreq = 3125000;
	this._clockperline = this._clockfreq * 0.000064;// 64us = 200
	this._clockperframe = this._clockfreq / 50; // 62500, for interrupt
	this._breakpoints = SettingBreakPoints.get();
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
	this._fb = callback({ id: "fb" });
	this._vid = new VID(this._mmu, this._fb);
	this._aud = new AUD(callback({ id: "aud" }));
	this._aud_it = false;
	this._key = new KEY();
	this._z80 = new Z80(this._mmu, function (addr, val) {
		TVCthis.writePort(addr, val);
	}, function (addr) {
		return TVCthis.readPort(addr);
	});
	//this._z80._logdasm = true;

	this._mmu.breakAddr = SettingMemBreakPoints.get();
}

TVC.prototype.reset = function () {
	this._z80.reset();
	this._mmu.reset();
};

TVC.prototype.addRom = function (name, data, patched) {
	console.log("ADD ROM: ", name);
	if (/DOS/.test(name)) {
		this.extensionAttach(0, new HBF(data));
	}
	else {
		this._mmu.addRom(name, data, patched);
	}
};

// /////////////////////////////
// UI
// /////////////////////////////
TVC.prototype.keyUp = function (code) {
	this._key.keyUp(code);
};

TVC.prototype.keyDown = function (code) {
	return this._key.keyDown(code);
};

TVC.prototype.keyPress = function (code) {
	this._key.keyPress(code);
};

TVC.prototype.focusChange = function (hasFocus) {
	if (!hasFocus) {
		this._key.reset();
	}
};

// /////////////////////////////
// load cas/dsk
// /////////////////////////////
TVC.prototype.loadImg = function (name, data) {
	var extension = name.slice(-4).toLowerCase();
	if (extension == ".cas") {
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
	else if (extension == ".zip") {
		var z = new JSZip(data, { base64: false });
		var f = z.file(/.*/)[0];
		this.loadImg(f.name, f.data);
	}
};

// /////////////////////////////
// the show must go on!
// /////////////////////////////
TVC.prototype.runForAFrame = function () {
	var doBreak = false;
	var maxTime = 2 * this._clockperframe;
	var cpuTime = 0;
	var drawInfo = [false, false];
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
		this._callback({ id: "notify", str: "breakpoint: " + Utils.toHex16(this._z80.getRegVal("PC")) });
		console.warn("BREAK");
		this.dreg();
	}
	//console.log("FRAMET: " + (performance.now() - timestart));

	return doBreak;
};

// /////////////////////////////
// IO
// /////////////////////////////
TVC.prototype.writePort = function (addr, val) {
	var val1, val2, val3;
	switch (addr) {
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
			switch (this._extCartMapping) {
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
				console.warn("Unhandled port write: " + Utils.toHex8(addr) + " " + Utils.toHex8(val), " (PC:", Utils.toHex16(this._z80.getRegVal("PC")), ")");
			}
	}
};

TVC.prototype.readPort = function (addr) {
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
			else if (addr >= 0x20 && addr <= 0x2F && this._ext1) {
				result = this._ext1.readPort(addr & 0x0F);
			}
			else {
				console.warn("Unhandled port read: ", Utils.toHex8(addr), " (PC:", Utils.toHex16(this._z80.getRegVal("PC")), ")");
				result = 0xff;
			}
	}
	return result;
};

// /////////////////////////////
// extensions
// /////////////////////////////
TVC.prototype.extensionAttach = function (port, ext) {
	if (port === 0) {
		this._ext0 = ext;
		this._ext0.mmu.name = "CART0";
		this._mmu.extmmu = this._ext0.mmu;
	}
	else if (port == 1) {
		this._ext1 = ext;
		this._ext1.mmu.name = "CART1";
	}
	else throw ("invalid extension port!");
	this._extTypes &= ~(3 << (port * 2));
	this._extTypes |= (ext.getType() << (port * 2));
	console.log("Added extension: ", port, " ", ext.type, " extTypes:", this._extTypes.toString(2));
};

// /////////////////////////////
// debugging
// /////////////////////////////

var bpMap = { "kbd-int": 0xd62d };
TVC.prototype.resolveAddr = function (val) {
	var addr = this._z80.getRegVal(val);
	if (isNaN(addr)) addr = parseInt(val, 16);
	if (isNaN(addr)) addr = bpMap[val];
	return addr;
};

TVC.prototype.dbm = function (bps) {
	if (!bps) {
		if (this._mmu.breakAddr) {
			var arr = [];
			for (var key in this._mmu.breakAddr) {
				arr.push(Utils.toHex16(parseInt(key, 10)));
			}
			console.log("BPM:", arr.join(","));
		}
		else {
			console.log("BPM: none");
		}
		return;
	}
	var newlist = bps.split(/\s*,\s*/);
	if (newlist.length) {
		for (var i in newlist) {
			var addr = this.resolveAddr(newlist[i]);
			if (!this._mmu.breakAddr) {
				this._mmu.breakAddr = {};
			}
			this._mmu.breakAddr[addr & 0xFFFF] = 1;
		}
	}
	SettingMemBreakPoints.set(this._mmu.breakAddr);
	this.dbm();
};

TVC.prototype.ddm = function (bp) {
	if (bp == "all") {
		this._mmu.breakAddr = null;
	}
	else if (this._mmu.breakAddr) {
		var bpAddr = this.resolveAddr(bp);
		delete this._mmu.breakAddr[bpAddr];
		if (Object.keys(this._mmu.breakAddr).length == 0) {
			this._mmu.breakAddr = null;
		}
	}
	SettingMemBreakPoints.set(this._mmu.breakAddr);
	this.dbm();
};
// set breakpoints: 
// db("FFFF,FEFE,DEDE") add breakpoints to these addresses
// db(8192) add breakpoint to this address, base 10
// db() print breakpoints
TVC.prototype.db = function (bps) {
	if (typeof (bps) == "number") {
		bps = bps.toString(16);
	}
	if (!bps) {
		if (this._breakpoints) {
			var arr = [];
			for (var key in this._breakpoints) {
				arr.push(Utils.toHex16(parseInt(key, 10)));
			}
			console.log("BP:", arr.join(","));
		}
		else {
			console.log("BP: none");
		}
		return;
	}
	var newlist = bps.split(/\s*,\s*/);
	if (newlist.length) {
		for (var i in newlist) {
			var addr = this.resolveAddr(newlist[i]);
			if (!this._breakpoints) {
				this._breakpoints = {};
			}
			this._breakpoints[addr & 0xFFFF] = 1;
		}
	}
	SettingBreakPoints.set(this._breakpoints);
	this.db();
};

// remove breakpoints: 
// db("FFFF")
// db(8192)
// db("all") or dd(-1) delete all breakpoints
TVC.prototype.dd = function (bp) {
	if (typeof (bp) == "number") {
		if (bp == -1) bp = "all";
		else bp = bp.toString(16);
	}
	if (bp == "all") {
		this._breakpoints = null;
	}
	else if (this._breakpoints) {
		var bpAddr = this.resolveAddr(bp);
		delete this._breakpoints[bpAddr];
		if (Object.keys(this._breakpoints).length == 0) {
			this._breakpoints = null;
		}
	}
	SettingBreakPoints.set(this._breakpoints);
	this.db();
};

TVC.prototype.dreg = function () {
	var l = 3;
	var arr = [];
	var addr = this._z80.getRegVal("PC");
	var line;
	var arr = [];
	var self = this;
	var r = function (addrr) {
		return self._mmu.r8(addrr);
	};
	console.log(this._z80.toString());
	console.log(this._mmu.toString());
	this.dmem("SP");
	console.log(this._z80.btToString(5).slice(0, -1).join("\n"));
	line = Dasm([r, addr]);
	console.log("%c%s", "color: green; font-weight: bold;", Utils.toHex16(addr) + " " + line[0]);
	addr += line[1];
	while (l--) {
		line = Dasm([r, addr]);
		console.log(Utils.toHex16(addr) + " " + line[0]);
		addr += line[1];
	}
};

TVC.prototype.dregGet = function () {
	let res = [];
	var l = 3;
	var arr = [];
	var addr = this._z80.getRegVal("PC");
	var line;
	var arr = [];
	var self = this;
	var r = function (addrr) {
		return self._mmu.r8(addrr);
	};
	res.push(this._z80.toString());
	res.push(this._mmu.toString());
	this.dmem("SP");
	res = res.concat(this._z80.btToString(5).slice(0, -1));
	line = Dasm([r, addr]);
	res.push(Utils.toHex16(addr) + "*" + line[0]);
	addr += line[1];
	while (l--) {
		line = Dasm([r, addr]);
		res.push(Utils.toHex16(addr) + " " + line[0]);
		addr += line[1];
	}
	return res;
};

TVC.prototype.dbt = function () {
	var arr = this._z80.btToString();
	console.log(arr.join("\n"));
};

TVC.prototype.dstep = function (breakOnNext) {
	var cpuTime = 0;
	var drawInfo = [false, false];
	var self = this;
	var r = function (addrr) {
		return self._mmu.r8(addrr);
	};
	var line;
	line = Dasm([r, this._z80.getRegVal("PC")]);
	var dstPC = this._z80.getRegVal("PC") + line[1];
	while (true) {
		cpuTime = this._z80.step(0);
		this._clock += cpuTime;
		drawInfo = this._vid.streamSome(cpuTime);
		if (drawInfo[0]) { // crtc initialized
			if (drawInfo[1] && this._z80.irqEnabled()) { // it
				var irqDuration = this._z80.irq();
				this._pendIt &= ~(0x10); // cursor IT
				this._vid.streamSome(irqDuration);
			}
			if (this._vid.renderStream()) {
				this._fb.refresh();
			}
		}
		if (!breakOnNext || (this._z80.getRegVal("PC") == dstPC))
			break;
	}
	this.dreg();
};

TVC.prototype.dmem = function (addrP, lines, bytesPerLine) {
	bytesPerLine = bytesPerLine || 16;
	lines = lines || 1;
	var addr = this.resolveAddr(addrP);
	if (isNaN(addr)) {
		console.log("dumpMem: Invalid address:", addrP);
		return;
	}
	do {
		var lineStr = Utils.toHex16(addr);
		var chars = "";
		for (var i = 0; i < bytesPerLine; i++) {
			var v = this._mmu.r8(addr++);
			lineStr += " " + Utils.toHex8(v);
			if (v < 32 || v > 126) {
				chars += " ";
			}
			else {
				chars += String.fromCharCode(v);
			}
		}
		console.log(lineStr + " |" + chars + "|");
		lines--;
	} while (lines);
};

TVC.prototype.dasm = function (addrP, l) {
	var addr = this.resolveAddr(addrP);
	var line;
	var arr = [];
	var self = this;
	var r = function (addrr) {
		return self._mmu.r8(addrr);
	};
	l = l || 1;
	while (l--) {
		line = Dasm([r, addr]);
		arr.push(Utils.toHex16(addr) + " " + line[0]);
		addr += line[1];
	}
	console.log(arr.join("\n"));
};