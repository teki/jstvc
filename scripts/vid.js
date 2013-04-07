define([
	"scripts/utils.js",
	"scripts/mmu.js"],
	function(Utils, MMU) {
	var exports = {};

	////////////////////////////////////////////
	// VID
	////////////////////////////////////////////
	function testVid() {
		var mmu = new MMU.MMU(),
			vid = new VID(mmu, undefined),
			regs = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ],
			screentime = 4 * (1/50) / (1/3125000),
			i;

		for (i = 0; i < regs.length; i++) {
			vid.setRegIdx(i);
			vid.setReg(regs[i]);
		}

		while (screentime > 0) {
			vid.step(4); // nop
			screentime -= 4;
		}
	}

	// xIxGxRxB
	function toRGBA(val) {
		var intens = 0x7F | ((val & 0x40) << 1);
		var g = (0x100 - ((val >> 4) & 1)) & intens;
		var r = (0x100 - ((val >> 2) & 1)) & intens;
		var b = (0x100 - (val & 1)) & intens;
		return 0xFF000000 | (b << 16) | (g << 8) | r;
	}

	function COLOR() {
		this.color = 0;
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.rgba = 0xFF;
		this.setColor = function(val) {
			this.color = val;
			var intens = 0x7F | ((val & 0x40) << 1);
			this.r = (0x100 - ((val >> 2) & 1)) & intens;
			this.g = (0x100 - ((val >> 4) & 1)) & intens;
			this.b = (0x100 - (val & 1)) & intens;
			this.rgba = toRGBA(val);
		}
	}

	function VID(mmu, fb) {
		this._mmu = mmu;
		this._fb = fb;
		this._timer = 0;
		this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
		this._border = 0;
		this._regIdx = 0;

		this._mode = 0; // 00: 2, 01: 4, 1x: 16 color

		this._cpufreq = 3125000;
		this._clockCh = 2; // ticks per character
		this._cclk = this._cpufreq / this._cclt; // character freq

		this._ht = 0; // horizontal total CHAR
		this._hd = 0; // horizontal displayed CHAR
		this._hsp = 0; // horizontal sync position CHAR
		this._hsw = 0; // horizontal sync width
		this._vsw = 0; // vertical sync width
		this._vt = 0; // vertical total CHAR
		this._adj = 0; // scan line adjust SCANLINE
		this._vd = 0; // vertical displayed CHAR ROW
		this._vsp = 0; // vertical sync position CHAR ROW
		this._im = 0; // interlace mode, 0 = progressive
		this._skec = 0; // cursor skew
		//this._skede = 0; // de skew (display enable)
		this._slr = 0; // scan line per character row
		this._curaddr = 0; // cursor address
		this._curmemaddr = 0; // cursor address (translated)
		this._curenabled = 0;
		this._saddr = 0; // start address

		// counters
		this._row = 0; // char row
		this.it = false;

		//this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
		this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];

		this._nextMem = 0;
		this._nextPixel = 0;
		this._nextScanLine = 0;
	}

	VID.prototype.reconfig = function() {
		this._ht = this._reg[0] + 1;
		this._hd = this._reg[1];
		this._hsp = this._reg[2];
		this._hsw = this._reg[3] & 0x0F;
		this._vsw = (this._reg[3] >>> 4) & 0x0F;
		this._vt = (this._reg[4] & 0x7F) + 1;
		this._adj = this._reg[5] & 0x1F;
		this._vd = this._reg[6] & 0x7F;
		this._vsp = this._reg[7] & 0x7F;
		this._im = this._reg[8] & 0x03;
		this._skede = (this._reg[8] >> 4) & 0x03;
		this._skec = (this._reg[8] >> 6) & 0x03; 
		this._slr = (this._reg[9] & 0x1F) + 1;
		this._curenabled = (this._reg[10] & 0x60) != 0x20;
		// this._reg[11] cursor end
		this._saddr = (this._reg[12] << 8) | this._reg[13];
		this._curaddr = ((this._reg[14] & 0x3F) << 8) | this._reg[15];
		this._curmemaddr = (this._reg[14] << 10)
			| ((this._reg[15] & 0xC0) << 2)
			| ((this._reg[10] & 0x03) << 6)
			| (this._reg[15] & 0x3F);
		console.log("VID reconf curaddr: " + Utils.toHex16(this._curmemaddr));
		console.log("VID it row: " + (this._curaddr >> 6) + " sl: " + (this._reg[10] & 0x03) + " byte: " + (this._curaddr & 63));
		// this._reg[16] LPen (H)
		// this._reg[17] LPen (L)
	}

	VID.prototype.initLineCopy = function() {
		// init
		if (this.it) throw("VID IT ERROR");
		this._nextMem = this._saddr;
		this._nextPixel = 0;
		this._nextScanLine = 0;
		return this._hd < this._ht;
	}

	VID.prototype.getLineDuration = function() {
		var itOffset = -1;
		var duration;
		if ((this._nextMem & 0xFFC0) == (this._curmemaddr & 0xFFC0)) {
			itOffset = (this._curmemaddr & 0x3F) * this._clockCh;
		}
		if ((this._vd * this._slr) == (this._nextScanLine - 1)) {
			duration = this._ht * (this._adj + 1) * this._clockCh;
		}
		else {
			duration = this._ht * this._clockCh;
		}
		return [duration, itOffset];
	}

	VID.prototype.copyLine = function() {
		var finishedScreen = false;
		var vidmem = this._mmu.getVid();
		var fbd = this._fb.buf32;

		var actMem = this._nextMem;
		var actPixel = this._nextPixel;
		var actScanLine = this._nextScanLine;
		var actChar = 0;
		var i,j;

		if (actScanLine == 0) {
			for(i = 0; i < (6*this._slr); i++) {
				for(j = 0; j < this._hd + 12; j++) {
					this.writePixel16(fbd, actPixel, this._border2);
					actPixel += 8;
				}
			}
		}

		for(i = 0; i < 6; i++) {
			this.writePixel16(fbd, actPixel, this._border2);
			actPixel += 8;
		}
		while (actChar < this._hd) {
			pixelData = vidmem[actMem];
			this.writePixel(fbd, actPixel, pixelData);
			actPixel += 8;
			actChar++;
			actMem++;
		}
		for(i = 0; i < 6; i++) {
			this.writePixel16(fbd, actPixel, this._border2);
			actPixel += 8;
		}
		actScanLine += 1;

		this._nextMem = actMem;
		this._nextPixel = actPixel;
		this._nextScanLine = actScanLine;
		if ((this._vd * this._slr) == this._nextScanLine) {

			for(i = 0; i < (6*this._slr); i++) {
				for(j = 0; j < this._hd + 12; j++) {
					this.writePixel16(fbd, actPixel, this._border2);
					actPixel += 8;
				}
			}

			this._nextScanLine = 0;
			finishedScreen = true;
		}
		return finishedScreen;
	}

	VID.prototype.writePixel = function(fbd, actPixel, pixelData) {
			if (this._mode == 0) {
					this.writePixel2(fbd, actPixel, pixelData);
			}
			else if (this._mode == 1) {
					this.writePixel4(fbd, actPixel, pixelData);
			}
			else {
					this.writePixel16(fbd, actPixel, pixelData);
			}
	}

	VID.prototype.writePixel2 = function(fbd, actPixel, pixelData) {
		var p0;
		p0 = this._palette[(pixelData >> 7) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 6) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 5) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 4) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 3) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 2) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[(pixelData >> 1) & 1];
		fbd[actPixel++] = p0.rgba;
		p0 = this._palette[pixelData & 1];
		fbd[actPixel++] = p0.rgba;
	}

	VID.prototype.writePixel4 = function(fbd, actPixel, pixelData) {
		var pixelData2, d3, d2, d1, d0, p0, p1, p2, p3;
		pixelData2 = pixelData >>> 4;
		pixelData <<= 1;
		d3 = (pixelData & 2) | (pixelData2 & 1);
		pixelData >>= 1;
		pixelData2 >>= 1;
		d2 = (pixelData & 2) | (pixelData2 & 1);
		pixelData >>= 1;
		pixelData2 >>= 1;
		d1 = (pixelData & 2) | (pixelData2 & 1);
		pixelData >>= 1;
		pixelData2 >>= 1;
		d0 = (pixelData & 2) | (pixelData2 & 1);
		p0 = this._palette[d0];
		fbd[actPixel++] = p0.rgba;
		fbd[actPixel++] = p0.rgba;
		p1 = this._palette[d1];
		fbd[actPixel++] = p1.rgba;
		fbd[actPixel++] = p1.rgba;
		p2 = this._palette[d2];
		fbd[actPixel++] = p2.rgba;
		fbd[actPixel++] = p2.rgba;
		p3 = this._palette[d3];
		fbd[actPixel++] = p3.rgba;
		fbd[actPixel++] = p3.rgba;
	}

	VID.prototype.writePixel16 = function(fbd, actPixel, pixelData) {
		var rgba;
		rgba = toRGBA(pixelData >> 1);
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
		rgba = toRGBA(pixelData);
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
		fbd[actPixel++] = rgba;
	}

	VID.prototype.setPalette = function(idx, color) {
		this._palette[idx].setColor(color);
	};

	VID.prototype.getPalette = function(idx) {
		return this._palette[idx].color;
	};

	VID.prototype.setBorder = function(color) {
		this._border = color;
		this._border2 = ((color & 0xAA) >> 1) | (color & 0xAA);
	};

	VID.prototype.setReg = function(val) {
		console.log("VID setReg: " + this._regIdx + " " + Utils.toHex8(val));
		this._reg[this._regIdx] = val;
		this.reconfig();
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

	exports.VID = VID;
	exports.testVid = testVid;
	return exports;
});
