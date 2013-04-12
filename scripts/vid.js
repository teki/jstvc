define([
	"scripts/utils.js",
	"scripts/mmu.js"],
	function(Utils, MMU) {
	var exports = {};

	////////////////////////////////////////////
	// VID
	////////////////////////////////////////////
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

		//this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
		this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];

		this._memStart = 0;
		this._nextRasterLine = 0; // line in a row
		this._vsyncLineCnt = -1;
		this._nextRow = -1;
		this._stream = new Int16Array(608*288*2*2);
		this._streamh = 0; // head
		this._streamt = 0; // tail

		this._renderPhase = 0;
		this._renderPhaseNext = 0;
		this._renderHCnt = 0;
		this._renderVCnt = 0;
		this._renderY = 0;
		this._renderA = 0;
	}

	// ma: memory address, rl: raster line
	// address: MMMMMMMMRRMMMMMM
	function genAddress(ma, rl) {
		return ((rl & 0x03) << 6)
			| (ma & 0x3F)
			| ((ma & 0x3FC0) << 2);
	}

	VID.prototype.reconfig = function() {
		this._ht = this._reg[0];
		this._hd = this._reg[1];
		this._hsp = this._reg[2];
		this._hsw = this._reg[3] & 0x0F;
		this._vsw = (this._reg[3] >>> 4) & 0x0F;
		this._vt = (this._reg[4] & 0x7F);
		this._adj = this._reg[5] & 0x1F;
		this._vd = this._reg[6] & 0x7F;
		this._vsp = this._reg[7] & 0x7F;
		this._im = this._reg[8] & 0x03;
		this._skede = (this._reg[8] >> 4) & 0x03;
		this._skec = (this._reg[8] >> 6) & 0x03; 
		this._slr = (this._reg[9] & 0x1F);
		this._curenabled = (this._reg[10] & 0x60) != 0x20;
		this._curstart = this._reg[10] & 0x1F;
		this._curend = this._reg[11] & 0x1F;
		this._saddr = (this._reg[12] << 8) | this._reg[13];
		this._curaddr = ((this._reg[14] & 0x3F) << 8) | this._reg[15];
		this._curmemaddr = genAddress(this._curaddr, this._curstart);
		console.log("VID reconf curaddr: m/a " + Utils.toHex16(this._curaddr) + " " + Utils.toHex16(this._curmemaddr));
		console.log("VID it row: " + (this._curaddr >> 6) + " sl: " + (this._reg[10] & 0x03) + " byte: " + (this._curaddr & 63));
		// this._reg[16] LPen (H)
		// this._reg[17] LPen (L)
	}

	VID.prototype.writePixel = function(fbd, actPixel, pixelData) {
		switch((pixelData >> 8) & 3) {
			case 0:
				this.writePixel2(fbd, actPixel, pixelData & 0xFF);
				break;
			case 1:
				this.writePixel4(fbd, actPixel, pixelData & 0xFF);
				break;
			default:
				this.writePixel16(fbd, actPixel, pixelData & 0xFF);
				break;
		}
	}

	var prevAddr = -1;
	VID.prototype.writePixel2 = function(fbd, actPixel, pixelData) {
		if (isNaN(actPixel)) throw("err");
		//console.log("addr diff: ", actPixel - prevAddr);
		prevAddr = actPixel;
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

/* ------------- streaming version ------------ */
	var HSYNC = 0x0400;
	var VSYNC = 0x0800;

	// returns duration or -1 of frame completion
	VID.prototype.streamLine = function() {
		// init
		if (this._nextRow == -1) {
			if (this._hd >= this._ht)
				return [false, -1, -1];
			this._memStart = this._saddr;
			this._nextRow = 0;
			this._nextRasterLine = 0;
			this._vsyncLineCnt = -1;
		}

		var vidmem = this._mmu.getVid();
		var actRow = this._nextRow;
		var actRasterLine = this._nextRasterLine;
		var actMem = this._memStart + actRow * this._hd;
		var actAddr = genAddress(actMem, actRasterLine);
		var actChar = 0;
		var hsync = 0;
		var vsync = 0;
		var skipRasterLineCheck = false;
		var endScreen = false;
		var itOffset = -1;
		var pixelData;
		var mode = this._mode << 8;
		var mode16 = 2 << 8;
		var checkIt = (actRasterLine == this._curstart);

		// active row
		if (actRow < this._vd) {
			// draw paper
			while (actChar < this._hd) {
				if (checkIt && (actMem == this._curaddr)) {
					itOffset = (actMem - (this._memStart + actRow * this._hd)) * this._clockCh;
				}
				pixelData = vidmem[actAddr];
				this.streamData(mode|pixelData);
				actChar++;
				actAddr++;
				actMem++;
			}
			// draw border
			while (actChar <= this._ht) {
				hsync = ((actChar > this._hsp) && (actChar < (this._hsp + this._hsw))) ? HSYNC : 0;
				this.streamData(hsync|mode16|this._border2);
				actChar++;
			}
		}
		// bottom broder / vsync / top border 
		else if (actRow <= this._vt) {
			// vsync
			if (this._vsyncLineCnt > 0) {
				if (this._vsyncLineCnt < this._vsw) {
					vsync = VSYNC;
					this._vsyncLineCnt++;
				}
			}
			else if (actRow > this._vsp) {
				vsync = VSYNC;
				this._vsyncLineCnt = 1;
			}
			// draw border
			while (actChar <= this._ht) {
				hsync = ((actChar > this._hsp) && (actChar < (this._hsp + this._hsw))) ? HSYNC : 0;
				this.streamData(vsync|hsync|mode16|this._border2);
				actChar++;
			}
		}
		// adj lines
		else if ((this._adj > 0) && (this._adj > actRasterLine)) {
			skipRasterLineCheck = true;
			// draw border
			while (actChar <= this._ht) {
				hsync = ((actChar > this._hsp) && (actChar < (this._hsp + this._hsw))) ? HSYNC : 0;
				this.streamData(vsync|hsync|mode16|this._border2);
				actChar++;
			}
		}
		// end of screen
		else {
			endScreen = true;
			this._nextRow = -1
		}

		if (!endScreen) {
			// next line
			actRasterLine++;
			if (!skipRasterLineCheck && (actRasterLine > this._slr)) {
				actRasterLine = 0;
				actRow++;
			}

			// write back
			this._nextRow = actRow;
			this._nextRasterLine = actRasterLine;
		}

		return [true,  (this._ht + 1) * this._clockCh, itOffset];
	}

	VID.prototype.streamData = function(data) {
		this._stream[this._streamh] = data;
		this._streamh++;
		if (this._streamh == this._streamt)
			throw("streamData overflow");
		if (this._streamh == this._stream.length)
			this._streamh = 0;
	}

	VID.prototype.readData = function() {
		var res;
		if (this._streamh == this._streamt) {
			res = -1;
		}
		else {
			res = this._stream[this._streamt];
			this._streamt++;
			if (this._streamt == this._stream.length)
				this._streamt = 0;
		}
		return res;
	}

	// renders a stream into a video frame
	// render starts 26 scanlines after vsync on, lasts for 288 scanlines
	// line is rendered 16 chars after hsync and renders 76 chars (or hsync)
	VID.prototype.renderStream = function() {
		var haveAFrame = false;
		var fbd = this._fb.buf32;
		var data;
		while (!haveAFrame && ((data = this.readData()) != -1)) {
			switch(this._renderPhase) {
			// tools
				case 100: // wait for end of hsync
					if (data & HSYNC) {
						this._renderHCnt++;
					}
					else {
						this._renderPhase = this._renderPhaseNext;
						//console.log("100 => ",this._renderPhaseNext);
					}
					break;
			// wait for vsync
				case 0:
					if (data & VSYNC) {
						// transition
						this._renderPhase = 1;
						this._renderVCnt = 0;
						//console.log("0 => 1");
					}
					break;
			// skip 26 lines
				case 1: // count lines
					if (data & HSYNC) {
						this._renderVCnt++;
						//console.log("renderVCnt",this._renderVCnt);
						if (this._renderVCnt == 26) {
							// transition
							this._renderPhase = 100;
							this._renderPhaseNext = 2;
							this._renderHCnt = 1; // we have the first one already
							this._renderY = 0;
							this._renderA = 0;
							//console.log("1 => 100");
						}
						else {
							this._renderPhase = 100;
							this._renderPhaseNext = 1;
							//console.log("1 => 100");
						}
					}
					break;

			// draw 288 lines
				case 2: // h skip
					this._renderHCnt++;
					//console.log("renderHCnt",this._renderHCnt);
					if (this._renderHCnt == 16) {
						this._renderPhase = 3;
						this._renderHCnt = 0;
						//console.log("2 => 3");
					}
					break;
				case 3: // draw 76
					this._renderHCnt++;
					//console.log("renderHCnt",this._renderHCnt," wp");
					this.writePixel(fbd, this._renderA, data);
					this._renderA += 8;
					if (this._renderHCnt == 76) {
						this._renderY++;
						//console.log("renderY",this._renderY);
						this._renderA = this._fb.width * this._renderY;
						if (this._renderY == 288) {
							// finished, next frame
							this._renderPhase = 0;
							haveAFrame = true;
							//console.log("3 => 0");
						}
						else {
							this._renderPhase = 4;
						}
					}
					break;
				case 4: // wiat for hsync
					if (data & HSYNC) {
							this._renderPhase = 100;
							this._renderPhaseNext = 2;
							this._renderHCnt = 1; // we have the first one already
							//console.log("4 => 100");
					}
					break;
			}
		}
		return haveAFrame;
	}

/* ------------- streaming version ------------ */

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
	return exports;
});
