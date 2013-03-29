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

	function COLOR() {
		this.color = 0;
		this.r = 0;
		this.g = 0;
		this.b = 0;
		this.setColor = function(val) {
			this.color = val;
			//this.rgb = ~~(((color&0x04) ? 0xFF0000 : 0) | ((color&0x10) ? 0x00FF00 : 0) | ((color&0x01) ? 0x0000FF : 0));
			var intens = 0x7F | ((val & 0x40) << 1);
			this.r = (0x100 - ((val >> 2) & 1)) & intens;
			this.g = (0x100 - ((val >> 4) & 1)) & intens;
			this.b = (0x100 - (val & 1)) & intens;
		}
	}

	function VID(mmu, fb) {
		this._mmu = mmu;
		this._fb = fb;
		this._timer = 0;
		this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
		this._border = 0;
		this._regIdx = 0;
		//this._reg = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

		this._mode = 0; // 00: 2, 01: 4, 1x: 16 color
		this._cr = [0x00,0x00,0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,0x00,0x00,0xFF,0xFF,0xFF,0xFF];
		this._cg = [0x00,0x00,0x80,0x80,0x00,0x00,0x80,0x80,0x80,0x00,0xFF,0xFF,0x00,0x00,0xFF,0xFF];
		this._cb = [0x00,0x80,0x00,0x08,0x00,0x80,0x00,0x80,0x80,0xFF,0x00,0xFF,0x00,0xFF,0x00,0xFF];


		this._cpufreq = 3125000;
		this._cclkt = 2; // ticks per character
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
		this.__slr = 0; // scan line per character row
		this._curaddr = 0; // cursor address
		this._curenabled = 0;
		this._saddr = 0; // start address

		// counters
		this._row = 0; // char row
		this.it = false;

		this._addr = 0; // copied on start

		//this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
		this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];
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
		this._curaddr = (this._reg[14] << 10)
			| ((this._reg[15] & 0xC0) << 2)
			| ((this._reg[10] & 0x03) << 6)
			| (this._reg[15] & 0x3F);
		console.log("VID reconf curaddr: " + Utils.toHex16(this._curaddr));
		// this._reg[16] LPen (H)
		// this._reg[17] LPen (L)
	}

	VID.prototype.refreshStart = function() {
		if (this.it) throw("VID IT ERROR");
		this._row = 0;
		this.it = false;
		this._addr = this._saddr;
	}

	VID.prototype.getNextDuration = function() {
		var duration = 0;
		if (!this._ht || !this._slr || !this._hd) {
		}
		else if (this._row < this._vd) {
			duration = this._cclkt * this._ht * this._slr;
		}
		else if (this._row < this._vt) {
			duration = this._cclkt * this._ht * this._slr;
		}
		else if (this._row == this._vt) {
			duration = this._cclkt * this._ht * this._adj;
		}
		else {
			duration = -1;
		}
		return duration;
	}
	// runs for a full character row
	VID.prototype.refreshRow = function() {
		var duration = 0;
		if (!this._ht || !this._slr || !this._hd) {
		}
		else if (this._row < this._vd) {
			if (this._mode == 0) {
					this.copyRow2(this._row);
			}
			else if (this._mode == 1) {
					this.copyRow4(this._row);
			}
			else {
					this.copyRow16(this._row);
			}
		}
		duration = this.getNextDuration();

		if (duration > 0) {
			this._row += 1;
		}
		return duration;
	}

	VID.prototype.copyRow2 = function(row) {
		var vidmem = this._mmu.getVid();
		var fbd = this._fb.data.data;
		var fbw = ~~this._fb.width;
		var fbh = ~~this._fb.height;
		var addr = ~~this._addr;
		var slStart = this._slr * row;
		var slInRow = this._slr;
		var visChars = this._hd;
		var pixelIdx,pixelData;
		var p0;
		for (var sl = 0; sl < slInRow; sl++) {
			pixelIdx = 4 * fbw * (slStart + sl);
			for (var visChar = 0; visChar < visChars; visChar++) {
				pixelData = vidmem[addr++];

				p0 = this._palette[(pixelData >> 7) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 6) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 5) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 4) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 3) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 2) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p0 = this._palette[(pixelData >> 1) & 1];
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
			}
		}
		// todo draw border
		if (this._curenabled
			&& this._curaddr <= addr
			&& this._curaddr >= this._addr) {
			this.it = true;
		}
		this._addr = addr;
	}

	VID.prototype.copyRow4 = function(row) {
		var vidmem = this._mmu.getVid();
		var fbd = this._fb.data.data;
		var fbw = ~~this._fb.width;
		var fbh = ~~this._fb.height;
		var addr = ~~this._addr;
		var slStart = this._slr * row;
		var slInRow = this._slr;
		var visChars = this._hd;
		var pixelIdx,pixelData,pixelData2;
		var p0,p1,p2,p3;
		var d0,d1,d2,d3;
		for (var sl = 0; sl < slInRow; sl++) {
			pixelIdx = 4 * fbw * (slStart + sl);
			for (var visChar = 0; visChar < visChars; visChar++) {
				pixelData = vidmem[addr++];

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
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				fbd[pixelIdx++] = p0.r; fbd[pixelIdx++] = p0.g; fbd[pixelIdx++] = p0.b; fbd[pixelIdx++] = 0xFF;
				p1 = this._palette[d1];
				fbd[pixelIdx++] = p1.r; fbd[pixelIdx++] = p1.g; fbd[pixelIdx++] = p1.b; fbd[pixelIdx++] = 0xFF;
				fbd[pixelIdx++] = p1.r; fbd[pixelIdx++] = p1.g; fbd[pixelIdx++] = p1.b; fbd[pixelIdx++] = 0xFF;
				p2 = this._palette[d2];
				fbd[pixelIdx++] = p2.r; fbd[pixelIdx++] = p2.g; fbd[pixelIdx++] = p2.b; fbd[pixelIdx++] = 0xFF;
				fbd[pixelIdx++] = p2.r; fbd[pixelIdx++] = p2.g; fbd[pixelIdx++] = p2.b; fbd[pixelIdx++] = 0xFF;
				p3 = this._palette[d3];
				fbd[pixelIdx++] = p3.r; fbd[pixelIdx++] = p3.g; fbd[pixelIdx++] = p3.b; fbd[pixelIdx++] = 0xFF;
				fbd[pixelIdx++] = p3.r; fbd[pixelIdx++] = p3.g; fbd[pixelIdx++] = p3.b; fbd[pixelIdx++] = 0xFF;
			}
		}
		if (this._curenabled
			&& this._curaddr <= addr
			&& this._curaddr >= this._addr) {
			this.it = true;
		}
		this._addr = addr;
	}

	VID.prototype.copyRow16 = function(row) {
		var vidmem = this._mmu.getVid();
		var fbd = this._fb.data.data;
		var fbw = ~~this._fb.width;
		var fbh = ~~this._fb.height;
		var addr = ~~this._addr;
		var slStart = this._slr * row;
		var slInRow = this._slr;
		var visChars = this._hd;
		var pixelIdx,pixelData,pixelData2;
		var d0,d1,r,g,b,intens;
		for (var sl = 0; sl < slInRow; sl++) {
			pixelIdx = 4 * fbw * (slStart + sl);
			for (var visChar = 0; visChar < visChars; visChar++) {
				pixelData = vidmem[addr++];

				d0 = pixelData >> 1;
				intens = 0x7F | ((d0 & 0x40) << 1);
				r = (0x100 - ((d0 >> 2) & 1)) & intens;
				g = (0x100 - ((d0 >> 4) & 1)) & intens;
				b = (0x100 - (d0 & 1)) & intens;
				//val = ((pixelData&0x80) ? 1 : 0.5) * ( (pixelData&0x08) ? 0xFF0000 : 0 | (pixelData&0x20) ? 0x00FF00 : 0 | (pixelData&0x02) ? 0x0000FF : 0);
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				d1 = pixelData;
				intens = 0x7F | ((d1 & 0x40) << 1);
				r = (0x100 - ((d1 >> 2) & 1)) & intens;
				g = (0x100 - ((d1 >> 4) & 1)) & intens;
				b = (0x100 - (d1 & 1)) & intens;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
				fbd[pixelIdx++] = r; fbd[pixelIdx++] = g; fbd[pixelIdx++] = b; fbd[pixelIdx++] = 255;
			}
		}
		if (this._curenabled
			&& this._curaddr <= addr
			&& this._curaddr >= this._addr) {
			this.it = true;
		}
		this._addr = addr;
	}

	VID.prototype.setPalette = function(idx, color) {
		this._palette[idx].setColor(color);
	};

	VID.prototype.getPalette = function(idx) {
		return this._palette[idx].color;
	};

	VID.prototype.setBorder = function(color) {
		this._border = color;
	};

	VID.prototype.setReg = function(val) {
		this._reg[this._regIdx] = val;
		this.reconfig();
		console.log("VID setReg: " + this._regIdx + " " + val);
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
