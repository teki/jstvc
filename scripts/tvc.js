define([
	"scripts/utils.js",
	"scripts/z80.js",
	"scripts/key.js",
	"scripts/aud.js",
	"scripts/vid.js",
	"scripts/mmu.js"],
	function(Utils, Z80, KEY, AUD, VID, MMU) {
	var exports = {};

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
		this._breakpoints = undefined;
		this._pendIt = 0x1F;	// b4: curs/aud, b3-0 cards , 0 active
		this._mmu = new MMU.MMU(type);
		this._fb = callback({id:"fb"});
		this._vid = new VID.VID(this._mmu, this._fb);
		this._aud = new AUD.AUD();
		this._aud_it = false;
		this._key = new KEY.KEY();
		this._z80 = new Z80.Z80(this._mmu, function(addr, val) {
			TVCthis.writePort(addr, val);
		}, function(addr) {
			return TVCthis.readPort(addr);
		});
	}

	TVC.prototype.addRom = function(name, data) {
		this._mmu.addRom(name, data);
	}

	TVC.prototype.keyUp = function(code) {
		this._key.keyUp(code);
	}

	TVC.prototype.keyDown = function(code) {
		this._key.keyDown(code);
	}

	TVC.prototype.focusChange = function(hasFocus) {
		if (!hasFocus)
			this._key.reset();
	}

	TVC.prototype.reset = function() {
		this._z80.reset();
		this._mmu.reset();
	}

	TVC.prototype.loadCas = function(data) {
		var savemap = this._mmu.getMap();
		this._mmu.setMap(0xb0);
		for (var i = 144; i < data.length; i++) {
			this._mmu.w8(6639 + i - 144, data[i]);
		}
		this._mmu.setMap(savemap);
	}

	TVC.prototype.setBreakPoints = function(newlist) {
		var bpMap = {"kbd-int" : 0xd62d };
		if (newlist.length) {
			var bplst = [];
			for (var i in newlist) {
				var addr = parseInt(newlist[i], 16);
				if (isNaN(addr)) {
					addr = bpMap[newlist[i]];
					if (!addr) continue;
				}
				bplst.push(addr & 0xFFFF);
			}
			this._breakpoints = bplst;
		}
		else {
			this._breakpoints = undefined;
		}
	}

	TVC.prototype.runForAFrame = function() {
		var maxTime = 2 * this._clockperframe;
		var cpuTime = 0;
		var drawInfo = [false,false];
		while (maxTime > 0) {
			cpuTime = this._z80.step(0);
			this._clock += cpuTime;
			maxTime -= cpuTime;
			drawInfo = this._vid.streamSome(cpuTime);
			if (drawInfo[0]) { // crtc is not yet initialized
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

		//console.log("FRAMET: " + (performance.now() - timestart));

		return false;
	};

	TVC.prototype.runOne = function() {
		var tinc = this._z80.step(0);
		this._vid.step(tinc);
		this._clock += tinc;
	};

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
			// 2 bits to select I/O memory, ignore it for now
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

		case 0x58:
		case 0x59:
		case 0x5A:
		case 0x5B:
			// bit7 : CSTL interrupt enable
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
			throw ("unhandled port write " + Utils.toHex8(addr) + " " + Utils.toHex8(val));
		}
	};

	TVC.prototype.readPort = function(addr) {
		var result = 0;
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
			result = 0xFF;
			break;

		default:
			throw "unhandled port read " + Utils.toHex8(addr);
		}
		return result;
	};

	TVC.prototype.dumpMem = function(addr, lines, bytesPerLine) {
		do {
			var lineStr = Utils.toHex16(addr);
			for(var i = 0; i < bytesPerLine; i++) {
				lineStr += " " + Utils.toHex8(this._mmu.r8(addr++));
			}
			console.log(lineStr);
			lines--;
		} while (lines);
	};

	////////////////////////////////////////////
	// module exports
	////////////////////////////////////////////

	exports.TVC = TVC;
	return exports;
});

