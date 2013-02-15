define(["scripts/z80.js","scripts/utils.js"], function(Z80Module, Utils) {
	var TVCExports = {};

	////////////////////////////////////////////
	// MMU
	////////////////////////////////////////////
	function MMU() {
		this._u0 = new Uint8Array(16384);
		this._u0.name = "U0";
		this._u1 = new Uint8Array(16384);
		this._u1.name = "U1";
		this._u2 = new Uint8Array(16384);
		this._u2.name = "U2";
		this._u3 = new Uint8Array(16384);
		this._u3.name = "U3";
		this._sys = [];
		this._sys.name = "SYS";
		//this._cart = Uint8Array(new ArrayBuffer(16384));
		this._cart = new Uint8Array(16384);//this._sys;
		this._cart.name = "CART";
		this._ext = new Uint8Array(16384);
		this._ext.name = "EXT";
		this._vid = new Uint8Array(16384);
		this._vid.name = "VID";
		this._map = [];
		this._mapVal = -1;
		this._log = false;

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

		this.setMap(0);
	};

	MMU.prototype.logMemAccess = function(log) {
		this._log = log;
	}

	MMU.prototype.getVid = function() {
		return this._vid;
	}

	MMU.prototype.addRom = function(name, data) {
		var i;
		if (name == "D7") {
			for (i = 0; i < data.length; i++) this._ext[0x2000 + i] = data[i];
			if (this._ext[0x3000] != 0x3e) throw ("ext is not properly initialized!");
		}

		if (name == "D4") {
			for (i = 0; i < data.length; i++) this._sys[i] = data[i];
		}
		if (name == "D3") {
			for (i = 0; i < data.length; i++) this._sys[0x2000+i] = data[i];
		}
	}

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

		var maplog = "";
		for (var m in this._map) {
			maplog += this._map[m].name + " ";
		};
		console.log(maplog);
	};
	MMU.prototype.getMap = function() {
		return this._mapVal;
	};
	MMU.prototype.w8 = function(addr, val) {
		addr = addr & 0xFFFF;
		val = val & 0xFF;
		if (this._log) {
			console.log("MW: " + Utils.toHex16(addr) + " " + Utils.toHex8(val));
		}
		var mapIdx = addr >>> 14;
		var block = this._map[mapIdx];
		if (block === this._sys || block === this._ext) return;
		if (!block)
			throw("invalid block: " + Utils.toHex16(addr) + " mapIdx:" + mapIdx + " mapping: " + this._map);
		block[addr & 0x3FFF] = val;
	};
	MMU.prototype.w16 = function(addr, val) {
		this.w8(addr, val & 0xFF);
		this.w8(addr + 1, val >>> 8);
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
		return this.r8(addr) | (this.r8(addr + 1) << 8);
	};
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

	function VID(mmu, fb) {
		this._clockfreq = 3125000;
		this._clockperframe = (1/50) / (1/this._clockfreq);
		this._mmu = mmu;
		this._fb = fb;
		this._timer = 0;
		this._palette = [0,0,0,0];
		this._palettergb = [0,0,0,0];
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

		var i,j,k,val1,val2,val3,val4,pixelIdx,pixelData,addr;
		var fbd = this._fb.data.data;
		var fbw = this._fb.width;
		var fbh = this._fb.height;

		switch (this._mode) {
			case 0: // 2 colors
				for (j = 0; j < 240; j++) {
					for (i = 0; i < 64; i++) {
						addr = this._startAddress + j * 64 + i;
						pixelData = vidmem[addr];
						pixelIdx = (j * fbw + i * 8) * 4;
						val1 = (pixelData & 0x80) ? 255 : 0;
						fbd[pixelIdx + 0x00] = val1;
						fbd[pixelIdx + 0x01] = val1;
						fbd[pixelIdx + 0x02] = val1;
						fbd[pixelIdx + 0x03] = 255;
						val1 = (pixelData & 0x40) ? 255 : 0;
						fbd[pixelIdx + 0x04] = val1;
						fbd[pixelIdx + 0x05] = val1;
						fbd[pixelIdx + 0x06] = val1;
						fbd[pixelIdx + 0x07] = 255;
						val1 = (pixelData & 0x20) ? 255 : 0;
						fbd[pixelIdx + 0x08] = val1;
						fbd[pixelIdx + 0x09] = val1;
						fbd[pixelIdx + 0x0A] = val1;
						fbd[pixelIdx + 0x0B] = 255;
						val1 = (pixelData & 0x10) ? 255 : 0;
						fbd[pixelIdx + 0x0C] = val1;
						fbd[pixelIdx + 0x0D] = val1;
						fbd[pixelIdx + 0x0E] = val1;
						fbd[pixelIdx + 0x0F] = 255;
						val1 = (pixelData & 0x08) ? 255 : 0;
						fbd[pixelIdx + 0x10] = val1;
						fbd[pixelIdx + 0x11] = val1;
						fbd[pixelIdx + 0x12] = val1;
						fbd[pixelIdx + 0x13] = 255;
						val1 = (pixelData & 0x04) ? 255 : 0;
						fbd[pixelIdx + 0x14] = val1;
						fbd[pixelIdx + 0x15] = val1;
						fbd[pixelIdx + 0x16] = val1;
						fbd[pixelIdx + 0x17] = 255;
						val1 = (pixelData & 0x02) ? 255 : 0;
						fbd[pixelIdx + 0x18] = val1;
						fbd[pixelIdx + 0x19] = val1;
						fbd[pixelIdx + 0x1A] = val1;
						fbd[pixelIdx + 0x1B] = 255;
						val1 = (pixelData & 0x01) ? 255 : 0;
						fbd[pixelIdx + 0x1C] = val1;
						fbd[pixelIdx + 0x1D] = val1;
						fbd[pixelIdx + 0x1E] = val1;
						fbd[pixelIdx + 0x1F] = 255;
					}
				}
				break;
			case 1: // 4 colors
				addr = this._startAddress;
				for (j = 0; j < 240; j++) {
					pixelIdx = fbw * j * 4;
					for (i = 0; i < 64; i++) {
						pixelData = vidmem[addr++];
						val1 = this._palettergb[((pixelData&0x08)>>2) | ((pixelData&0x80)>>7)];
						fbd[pixelIdx++] = val1 >>> 16;
						fbd[pixelIdx++] = (val1 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val1 & 0xFF;
						fbd[pixelIdx++] = 255;
						fbd[pixelIdx++] = val1 >>> 16;
						fbd[pixelIdx++] = (val1 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val1 & 0xFF;
						fbd[pixelIdx++] = 255;
						val2 = this._palettergb[((pixelData&0x04)>>1) | ((pixelData&0x40)>>6)];
						fbd[pixelIdx++] = val2 >>> 16;
						fbd[pixelIdx++] = (val2 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val2 & 0xFF;
						fbd[pixelIdx++] = 255;
						fbd[pixelIdx++] = val2 >>> 16;
						fbd[pixelIdx++] = (val2 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val2 & 0xFF;
						fbd[pixelIdx++] = 255;
						val3 = this._palettergb[(pixelData&0x02) | ((pixelData&0x20)>>5)];
						fbd[pixelIdx++] = val3 >>> 16;
						fbd[pixelIdx++] = (val3 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val3 & 0xFF;
						fbd[pixelIdx++] = 255;
						fbd[pixelIdx++] = val3 >>> 16;
						fbd[pixelIdx++] = (val3 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val3 & 0xFF;
						fbd[pixelIdx++] = 255;
						val4 = this._palettergb[((pixelData&0x01)<<1) | ((pixelData&0x10)>>5)];
						fbd[pixelIdx++] = val4 >>> 16;
						fbd[pixelIdx++] = (val4 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val4 & 0xFF;
						fbd[pixelIdx++] = 255;
						fbd[pixelIdx++] = val4 >>> 16;
						fbd[pixelIdx++] = (val4 >>> 8) & 0xFF;
						fbd[pixelIdx++] = val4 & 0xFF;
						fbd[pixelIdx++] = 255;
					}
				}
				for (j = 0; j < 240; j++) {
					pixelIdx = (fbw * j + j) * 4;
					fbd[pixelIdx++] = 255;
					fbd[pixelIdx++] = 255;
					fbd[pixelIdx++] = 255;
					fbd[pixelIdx++] = 255;
				}
				break;
			default: // 2 = 16 colors
				for (j = 0; j < 240; j++) {
					for (i = 0; i < 64; i++) {
						var addr = this._startAddress + j * 64 + i;
						pixelData = vidmem[addr];
						pixelIdx = (j * fbw + i * 2) * 4;
						val = ((pixelData&0x80) ? 1 : 0.5) * ( (pixelData&0x08) ? 0xFF0000 : 0 | (pixelData&0x20) ? 0x00FF00 : 0 | (pixelData&0x02) ? 0x0000FF : 0);
						fbd[pixelIdx + 0x00] = val >>> 16;
						fbd[pixelIdx + 0x01] = (val >>> 8) & 0xFF;
						fbd[pixelIdx + 0x02] = val & 0xFF;
						fbd[pixelIdx + 0x03] = 255;
						val = ((pixelData&0x40) ? 1 : 0.5) * ( (pixelData&0x04) ? 0xFF0000 : 0 | (pixelData&0x10) ? 0x00FF00 : 0 | (pixelData&0x01) ? 0x0000FF : 0);
						fbd[pixelIdx + 0x04] = val >>> 16;
						fbd[pixelIdx + 0x05] = (val >>> 8) & 0xFF;
						fbd[pixelIdx + 0x06] = val & 0xFF;
						fbd[pixelIdx + 0x07] = 255;
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
		this._palette[idx] = color;
		if (color & 0x04) {
			this._palettergb[idx] = ((color&0x04) ? 0xFF0000 : 0) | ((color&0x10) ? 0x00FF00 : 0) | ((color&0x01) ? 0x0000FF : 0);
		}
		else {
			this._palettergb[idx] = ((color&0x04) ? 0x7F0000 : 0) | ((color&0x10) ? 0x007F00 : 0) | ((color&0x01) ? 0x00007F : 0);
		}
	};

	VID.prototype.getPalette = function(idx) {
		return this._palette[idx];
	};

	VID.prototype.setBorder = function(color) {
		this._border = color;
	};

	VID.prototype.setReg = function(val) {
		this._reg[this._regIdx] = val;
		console.log(this._reg);
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
	function TVC(fb) {
		var TVCthis = this;
		this._clockfreq = 3125000;
		this._clockperframe = (1/50) / (1/this._clockfreq);
		console.log(this._clockperframe);
		this._clock = 0;
		this._pendIt = 0;	// b4: curs/aud, b3-0 cards
		this._mmu = new MMU();
		this._vid = new VID(this._mmu, fb);
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

	TVC.prototype.logMemAccess = function(log) {
		this._mmu.logMemAccess(log);
	}

	TVC.prototype.addRom = function(name, data) {
		this._mmu.addRom(name, data);
	}

	TVC.prototype.runForAFrame = function() {
		var times;
		times = new Date();
		while (this._clock < this._clockperframe) {
			var tinc = this._z80.step();
			this._vid.step(tinc);
			this._clock += tinc;
		}
		this._clock = 0; //TODO fixme
		//console.log( (new Date()) - times);

	};

	TVC.prototype.runOne = function() {
		var tinc = this._z80.step();
		this._vid.step(tinc);
		this._clock += tinc;
	};

	TVC.prototype.writePort = function (addr, val) {
		var val1, val2, val3;
		//    console.log("OUT (" + Utils.toHex8(addr) + "), " + Utils.toHex8(val));
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
		throw ("unhandled port write " + Utils.toHex8(addr) + " " + Utils.toHex8(val));
	};

	TVC.prototype.readPort = function(addr) {
		if (addr == 0x59) {
			//    59H     +++43210    R       Pending IT requests
			//    59H     765+++++    R       7: printer ack, 6: bw0/color1, 5: tape data in
			return 0x40 | this._pendIt;
		}
		else if (addr == 0x5A) {
			return 0xFF;
		}
		throw "unhandled port read " + Utils.toHex8(addr);
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

