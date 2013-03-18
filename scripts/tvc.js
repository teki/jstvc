define(["scripts/z80.js","scripts/utils.js"], function(Z80Module, Utils) {
	var TVCExports = {};

	////////////////////////////////////////////
	// MMU
	////////////////////////////////////////////
	function MemBlock(name, isRam, size) {
	  this.name = name;
	  this.isRam = isRam;
	  this.m = new Uint8Array(size);
	}
	function MMU() {
		this._u0 = new MemBlock("U0", true, 16384);
		this._u1 = new MemBlock("U1", true, 16384);
		this._u2 = new MemBlock("U2", true, 16384);
		this._u3 = new MemBlock("U3", true, 16384);
		this._vid = new MemBlock("VID", true, 16384);
		this._sys = new MemBlock("SYS", false, 16384);
		this._cart = new MemBlock("CART", false, 16384);
		this._ext = new MemBlock("EXT", false, 16384);
		this._map = [];
		this._mapVal = -1;
		this._log = false;

		this.init();
	}

	MMU.prototype.init = function() {
		var i;
		for (i = 0; i < this._u0.m.length; i++) this._u0.m[i] = 0;
		for (i = 0; i < this._u1.m.length; i++) this._u1.m[i] = 0;
		for (i = 0; i < this._u2.m.length; i++) this._u2.m[i] = 0;
		for (i = 0; i < this._u3.m.length; i++) this._u3.m[i] = 0;
		// for(i=0; i<this._cart.m.length; i++) this._cart.m[i] = 0;
		for (i = 0; i < this._ext.m.length; i++) this._ext.m[i] = 0;

		this.setMap(0);
	};

	MMU.prototype.getVid = function() {
		return this._vid.m;
	}

	MMU.prototype.addRom = function(name, data) {
		var i;
		if (name == "D7") {
			if (Utils.crc32(data) != 0x1cbbeac6) throw ("invalid rom (D7)!");
			for (i = 0; i < data.length; i++) this._ext.m[0x2000 + i] = data[i];
		}

		if (name == "D4") {
			if (Utils.crc32(data) != 0x834ca9be) throw ("invalid rom (D4)!");
			for (i = 0; i < data.length; i++) this._sys.m[i] = data[i];
		}
		if (name == "D3") {
			if (Utils.crc32(data) != 0x71753d02) throw ("invalid rom (D3)!");
			for (i = 0; i < data.length; i++) this._sys.m[0x2000+i] = data[i];
		}
	}

	MMU.prototype.reset = function() {
		this.setMap(0);
	};

	MMU.prototype.setMap = function(val) {
		if (val == this._mapVal) return;

		// page 0
		switch ((val & 0x18) >> 3) {
		case 0: this._map[0] = this._sys; break;
		case 1: this._map[0] = this._cart; break;
		case 2: this._map[0] = this._u0; break;
		case 3: this._map[0] = this._u3; break; // tvc32 & 64k+
		}

		// page 1 is always u1 (64k+ can have vid)
		this._map[1] = this._u1;

		// page 2
		if (val & 0x20)
			this._map[2] = this._u2;
		else
			this._map[2] = this._vid;

		// page 3
		switch ((val & 0xc0) >> 6) {
		case 0: this._map[3] = this._cart; break;
		case 1: this._map[3] = this._sys; break;
		case 2: this._map[3] = this._u3; break;
		case 3: this._map[3] = this._ext; break;
		}

		this._mapVal = val;
	};

	MMU.prototype.getMap = function() {
		return this._mapVal;
	};

	MMU.prototype.w8 = function(addr, val) {
		var mapIdx = (addr & 0xC000) >>> 14;
		var block = this._map[mapIdx];
		if (block.isRam) {
			block.m[addr & 0x3FFF] = val & 0xFF;
		}
	};
	MMU.prototype.w16 = function(addr, val) {
		this.w8(addr, val);
		this.w8(addr + 1, val >>> 8);
	};
	MMU.prototype.w16reverse = function(addr, val) {
		this.w8(addr + 1, val >>> 8);
		this.w8(addr, val);
	};
	MMU.prototype.r8 = function(addr) {
		return this._map[(addr & 0xC000) >>> 14].m[addr & 0x3FFF];
	};
	MMU.prototype.r8s = function(addr) {
		var val = this._map[(addr & 0xC000) >>> 14].m[addr & 0x3FFF];
		if (val & 0x80) val = -((~val + 1) & 0xFF);
		return val;
	};
	MMU.prototype.r16 = function(addr) {
		return this.r8(addr) | (this.r8(addr + 1) << 8);
	};
	MMU.prototype.r16nolog = MMU.prototype.r16;
	MMU.prototype.dasm = function(addr, lines, prefix, noLdir) {
		var offset = 0,
			res = [],
			d, i, str, oplen, line;
		do {
			d = Z80Module.decodeZ80(this, addr + offset);
			oplen = d[1];

			str = Utils.toHex16(addr + offset) + " ";
			for (i = 0; i < 4; i++) {
				if (i < oplen) {
					str += Utils.toHex8(this.r8(addr + offset + i)) + " ";
				}
				else {
					str += "   ";
				}
			}
			line = prefix + str + d[0];
			if (!noLdir || -1 == line.indexOf("LDIR")) {
				res.push(line);
			}
			offset += oplen;
			lines--;
		} while (lines);
		return res;
	};

	////////////////////////////////////////////
	// VID
	////////////////////////////////////////////
	function testVid() {
		var mmu = new MMU(),
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
		this._clockfreq = 3125000;
		this._clockperframe = (1/50) / (1/this._clockfreq);
		this._mmu = mmu;
		this._fb = fb;
		this._timer = 0;
		this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
		this._border = 0;
		this._regIdx = 0;
		this._reg = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
		this._mode = 0; // 00: 2, 01: 4, 1x: 16 color
		this._cr = [0x00,0x00,0x00,0x00,0x80,0x80,0x80,0x80,0x80,0x00,0x00,0x00,0xFF,0xFF,0xFF,0xFF];
		this._cg = [0x00,0x00,0x80,0x80,0x00,0x00,0x80,0x80,0x80,0x00,0xFF,0xFF,0x00,0x00,0xFF,0xFF];
		this._cb = [0x00,0x80,0x00,0x08,0x00,0x80,0x00,0x80,0x80,0xFF,0x00,0xFF,0x00,0xFF,0x00,0xFF];

		this._dispen = 0;
		this._hcc = 0; // horizontal character counter
		this._vcc = 0; // vertical character counter
		this._vlc = 0; // vertical line counter
		this._startAddress = 0;
		this._hsync = 0;
		this._vsync = 0;

		this._fbx = 0;
		this._fby = 0;

		// testing:
		//	this._linestr = "";
	}

	VID.prototype.step = function(cpuTime) {
		this._timer += cpuTime;
		if (this._timer < this._clockperframe)
			return;

		this._timer -= this._clockperframe;

		var vidmem = this._mmu.getVid();
		this._startAddress = this._reg[12] << 8 | this._reg[13];

		var i,j,k,val1,val2,val3,val4,pixelIdx,pixelData,pixelData2,addr;
		var fbd = this._fb.data.data;
		var fbw = ~~this._fb.width;
		var fbh = ~~this._fb.height;
		var p0,p1,p2,p3;
		var d0,d1,d2,d3,r,g,b,intens;

		addr = ~~this._startAddress;
		switch (this._mode) {
			case 0: // 2 colors
				for (j = 0; j < 240; j++) {
					pixelIdx = fbw * j * 4;
					for (i = 0; i < 64; i++) {
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
				break;
			case 1: // 4 colors
				for (j = 0; j < 240; j++) {
					pixelIdx = fbw * j * 4;
					for (i = 0; i < 64; i++) {
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
				break;
			default: // 2 = 16 colors
				for (j = 0; j < 240; j++) {
					pixelIdx = fbw * j * 4;
					for (i = 0; i < 64; i++) {
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
				break;
		}

		this._fb.refresh();
	}

	VID.prototype.step2 = function(cpuTime) {
		if (this._reg[0] == 0) {
			return;
		}
		var vidmem = this._mmu.getVid();
		var pixelData, pixelColors, i;
		// convert it to character unit, plus add the remaining cycles
		// from the previous run
		this._timer += cpuTime;
		var stepCount = this._timer >>> 1;
		this._timer -= (stepCount << 1);

		var fbd = this._fb.data;
		var fbw = this._fb.width;
		var fbh = this._fb.height;
		// initialize start address on new screen

		while (stepCount) {
			//console.log("hcc: " + this._hcc + " vcc: " + this._vcc + " vlc: " + this._vlc);
			if (this._hcc === 0 && this._vcc === 0 && this._vlc === 0) {
				this._startAddress = this._reg[12] << 8 | this._reg[13];
			}
			var scanLinesPerChLine = this._reg[9] & 0x1F;

			stepCount--;
			// change line
			if (this._hcc > this._reg[0]) {
				//console.log(this._linestr);
				//this._linestr = "";
				// change character line
				if (this._vlc == scanLinesPerChLine) {
					this._vlc = 0;
					this._vcc += 1;

					// vsync start
					if (this._vcc == ((this._reg[7] & 0x7F) + 1)) {
						this._vsync = this._reg[3] >>> 4;
						if (this._vsync === 0)
							this._vsync = 16;

						//this._fb.refresh();
						//if (this._ctx) this._ctx.putImageData(this._fb, 0,0);
						//console.log("new screen");
					}
				}
				// just a scan line
				else {
					this._vlc += 1;
				}
				this._hcc = 0;
				this._fby += 1; // new line in the framebuffer
				this._fbx = 0;
				if (this._vsync > 0) {
					this._vsync -= 1;
				}
				// new screen
				if (this._vcc == (this._reg[4] + 1) && this._vlc == this._reg[5]) {
					this._vcc = 0;
					this._vlc = 0;
					continue;
				}
			}

			// hsync start
			if (this._hcc == (this._reg[2] + 1)) {
				this._hsync = this._reg[3] & 0x0F;
			}

			// disp off
			this._dispen = (this._vcc < this._reg[6]) && (this._hcc < this._reg[1]);
			//console.log("vcc: " + this._vcc + " limit: " + this._reg[6]);

			if (this._mode == 0) {
				colorCnt = 2;
				colorPixels = 8;
				colorDiv = 1;
			}
			else if (this._mode == 1) {
				colorCnt = 4;
				colorPixels = 4;
				colorDiv = 2;
			}
			else {
				colorCnt = 16;
				colorPixels = 2;
				colorDiv = 4;
			}

			//var hccstr = this._hcc.toString();
			//var outchar = this._dispen ? hccstr[hccstr.length -1] : "_";
			//if (this._hsync) outchar = "H";
			//if (this._vsync) outchar = "V";
			//this._linestr += outchar;
			if (this._dispen) {
				var line = this._vcc * scanLinesPerChLine + this._vcl;
				// read mem
				var addr = this._startAddress + line * 64 + this._hcc;
				pixelData = vidmem[addr];
				pixelColors = [];
				if (this._mode == 0) {
					for (i = 7; i >= 0; i--) {
						pixelColors[i] = this._palette[pixelData & 1];
						pixelData = pixelData >>> 1;
					}
				}
				else if (this._mode == 1) {
					for (i = 3; i >= 0; i--) {
						pixelColors[i] = this._palette[pixelData & 3];
						pixelData = pixelData >>> 2;
					}
				}
				else {
					pixelColors[0] = pixelData >>> 4;
					pixelColors[1] = pixelData & 0x0F;
				}
			} else {
				// out border
				pixelColors = [];
				if (this._mode == 0) {
					for (i = 7; i >= 0; i--) {
						pixelColors[i] = this._border;
					}
				}
				else if (this._mode == 1) {
					for (i = 3; i >= 0; i--) {
						pixelColors[i] = this._border;
					}
				}
				else {
					pixelColor[0] = this._border;
					pixelColor[1] = this._border;
				}
			}
			// always draw 8 pixels
			for (i = 0; i < 8; i++) {
				color = pixelColors[i / colorDiv];
				pixelIdx = (this._fby * fbw + this._fbx) * 4;
				//console.log("x: " + this._fbx + " y: " + this._fby);
				fbd[pixelIdx] = 0;//this._cr[color];
				fbd[pixelIdx+1] = 0;//this._cg[color];
				fbd[pixelIdx+2] = 0;//this._cb[color];
				fbd[pixelIdx+3] = 255;
				this._fbx += 1;
			}
			this._hcc += 1;
			// hsync run
			if (this._hsync > 0) {
				this._hsync -= 1;
			}
		}
		this._clock += stepCount * 2;
	}

	VID.prototype.setPalette = function(idx, color) {
		this._palette[idx].setColor(color);
		//this._palette[idx] = color;
		//if (color & 0x40) {
		//	this._palettergb[idx] = ~~(((color&0x04) ? 0xFF0000 : 0) | ((color&0x10) ? 0x00FF00 : 0) | ((color&0x01) ? 0x0000FF : 0));
		//}
		//else {
		//	this._palettergb[idx] = ~~(((color&0x04) ? 0x7F0000 : 0) | ((color&0x10) ? 0x007F00 : 0) | ((color&0x01) ? 0x00007F : 0));
		//}
	};

	VID.prototype.getPalette = function(idx) {
		return this._palette[idx].color;
	};

	VID.prototype.setBorder = function(color) {
		this._border = color;
	};

	VID.prototype.setReg = function(val) {
		this._reg[this._regIdx] = val;
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
	var KSADD = 1;
	var KSDEL = 2;
	function KEY() {
		this._row = 0;
		this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
		this._keymap = {};
		this._skeymap = {};
		this._shift = false;
		var normmap = [
			"53206 14",
			" 89    7",
			"TEW Z QR",
			" IO   PU",
			"GDS H AF",
			" KL    J",
			"BCX N YV",
			"       M" ];
		for (var i in normmap) {
			for(var j = 0; j < 8; j++) {
				var code = normmap[i][j];
				if (code != " ") {
					this._keymap[code.charCodeAt(0)] = [i,j,0];
				}
			}
		}
		this._keymap[  8] = [5,0,0]; // backspace
		this._keymap[ 13] = [5,4,0]; // return
		this._keymap[ 16] = [6,3,0]; // shift
		this._keymap[ 17] = [7,4,0]; // ctrl
		this._keymap[ 18] = [7,0,0]; // alt
		this._keymap[ 20] = [6,5,0]; // lock
		this._keymap[ 27] = [7,3,0]; // esc
		this._keymap[ 32] = [7,5,0]; // space
		this._keymap[ 37] = [8,6,0]; // left
		this._keymap[ 38] = [8,1,0]; // up
		this._keymap[ 39] = [8,5,0]; // right
		this._keymap[ 40] = [8,2,0]; // down
		this._keymap[ 46] = [5,0,0]; // del
		this._keymap[ 59] = [2,3,0]; // ;
		this._keymap[186] = [2,3,0]; // ;
		this._keymap[187] = [1,7,KSADD]; // =
		this._keymap[188] = [7,1,0]; // ,
		this._keymap[189] = [7,6,0]; // -
		this._keymap[190] = [7,2,0]; // .
		this._keymap[191] = [0,4,KSADD]; // /
		this._keymap[192] = [2,5,KSADD]; // `
		this._keymap[219] = [3,4,0]; // [
		this._keymap[220] = [4,3,0]; // \
		this._keymap[221] = [3,0,0]; // ]
		this._keymap[222] = [0,6,KSADD]; // '


		// shift
		this._skeymap[ 48] = [1,2,0]; // )
		this._skeymap[ 49] = [0,7,0]; // !
		this._skeymap[ 50] = [2,5,KSDEL]; // @
		this._skeymap[ 51] = [1,4,0]; // #
		this._skeymap[ 52] = [2,3,0]; // $
		this._skeymap[ 53] = [0,0,0]; // %
		this._skeymap[ 54] = [1,0,KSDEL]; // ^
		this._skeymap[ 55] = [0,3,0]; // &
		this._skeymap[ 56] = [1,4,KSDEL]; // *
		this._skeymap[ 57] = [1,1,0]; // (
		this._skeymap[ 59] = [7,2,0]; // :
		this._skeymap[186] = [7,2,0]; // :
		this._skeymap[187] = [0,1,0]; // +
		this._skeymap[188] = [4,5,KSDEL]; // <
		this._skeymap[190] = [4,5,0]; // >
		this._skeymap[191] = [7,1,KSADD]; // ?
		this._skeymap[222] = [0,2,0]; // "
	}

	KEY.prototype.selectRow = function(val) {
		this._row = val;
	}

	KEY.prototype.readRow = function() {
		var res = this._state[this._row];
		if (!res) return 0xFF;
		return res;
	}

	KEY.prototype.keySet = function(row, column, down) {
		if (down)
			this._state[row] &= ~(1 << column);
		else
			this._state[row] |= (1 << column);
	}

	KEY.prototype.fixState = function(val,down) {
		if (val & KSADD)
			// add shift on down and remove on up if needed
			this.keySet(6,3,down || this._shift);
		if (val & KSDEL)
			// remove shift on down and add back on up if needed
			this.keySet(6,3,!down && this._shift);
	}

	KEY.prototype.keyUpdate = function(code, down) {
		if (code == 16)
			this._shift = down;
		var m = undefined;
		if (this._shift)
			m = this._skeymap[code];
		if (!m)
			m = this._keymap[code];
		if (m) {
			this.keySet(m[0], m[1], down);
			this.fixState(m[2], down);
			// on up release keys from the other table too
			// to avoid key stuck from early shift release
			if (!down) {
				m = (this._shift) ? this._keymap[code] : this._skeymap[code];
				if (m) {
					this.keySet(m[0], m[1], down);
				}
			}
		}
	}

	KEY.prototype.keyDown = function(code) {
		this.keyUpdate(code, true);
	}
	KEY.prototype.keyUp = function(code) {
		this.keyUpdate(code, false);
	}

	KEY.prototype.reset = function() {
		this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
	}
	////////////////////////////////////////////
	// TVC
	////////////////////////////////////////////
	function TVC(callback) {
		var TVCthis = this;
		this._callback = callback;
		this._clockfreq = 3125000;
		this._clockperframe = (1/50) / (1/this._clockfreq);
		console.log(this._clockperframe);
		this._clock = 0;
		this._breakpoints = undefined;
		this._pendIt = 0x1F;	// b4: curs/aud, b3-0 cards , 0 active
		this._mmu = new MMU();
		this._vid = new VID(this._mmu, callback({id:"fb"}));
		this._aud = new AUD();
		this._aud_it = false;
		this._aud_on = false;
		this._key = new KEY();
		this._z80 = new Z80Module.Z80(this._mmu, function(addr, val) {
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
		//var timestart = performance.now();
		var breakPointHit = false;
		while (!breakPointHit && this._clock < this._clockperframe) {
			var tinc = this._z80.step(this._clockperframe);
			this._vid.step(tinc);
			this._clock += tinc;

			if (this._breakpoints) {
				if (this._breakpoints.indexOf(this._z80._s.PC) != -1) {
					console.log("breakpoint!");
					breakPointHit = true;
				}
			}
		}

		if (!breakPointHit) {
			this._clock -= this._clockperframe;

			// cursor interrupt
			this._vid.step(13);
			this._clock += 13;
			this._pendIt &= ~(0x10); // cursor IT
			this._z80.interrupt();
		}

		//console.log("FRAMET: " + (performance.now() - timestart));

		return breakPointHit;
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
			val = val >> 1;
			if (val & 0x40) {
				val = ~~(((val&0x04) ? 0xFF0000 : 0) | ((val&0x10) ? 0x00FF00 : 0) | ((val&0x01) ? 0x0000FF : 0));
			}
			else {
				val = ~~(((val&0x04) ? 0x7F0000 : 0) | ((val&0x10) ? 0x007F00 : 0) | ((val&0x01) ? 0x00007F : 0));
			}
			this._callback({id: "bg", val: val});
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
			this._aud_on = (val & 0x10) !== 0;
			this._aud_it = (val & 0x20) !== 0;
			this._aud.setFreqH(val & 0x0F);
			break;

		case 0x06:
			val1 = val & 0x80; // Printer ack
			val2 = (val >>> 2) & 0x0F; // Sound amp
			val3 = val & 0x03; // video mode
			this._vid.setMode(val3);
			this._aud.setAmp(val2);
			break;

		case 0x07:
			// cursor/audio irq ack
			this._pendIt |= 0x10;
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

	TVCExports.TVC = TVC;
	TVCExports.testVid = testVid;
	return TVCExports;
});

