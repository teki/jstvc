define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	function MemBlock(name, isRam, size) {
		this.name = name;
		this.isRam = isRam;
		this.m = new Uint8Array(size);
	}
	function MMU(type) {
		this._isPlus = /\+/.test(type);
		this._u0 = new MemBlock("U0", true, 16384);
		this._u1 = new MemBlock("U1", true, 16384);
		this._u2 = new MemBlock("U2", true, 16384);
		this._u3 = new MemBlock("U3", true, 16384);
		this._vid0 = new MemBlock("VID0", true, 16384);
		if (this._isPlus) {
			this._vid1 = new MemBlock("VID1", true, 16384);
			this._vid2 = new MemBlock("VID2", true, 16384);
			this._vid3 = new MemBlock("VID3", true, 16384);
		}
		this._sys = new MemBlock("SYS", false, 16384);
		this._cart = new MemBlock("CART", false, 16384);
		this._exth = new MemBlock("EXT", false, 8192);
		this._map = [];
		this._mapVal = -1;
		this._mapValVid = -1;
		this._log = false;
		this.breakAddr = null;
		this.crtmem = this._vid0.m;
		this.extmmu = null;

		this.init();
	}

	MMU.prototype.init = function() {
		var i;
		for (i = 0; i < this._u0.m.length; i++) this._u0.m[i] = 0;
		for (i = 0; i < this._u1.m.length; i++) this._u1.m[i] = 0;
		for (i = 0; i < this._u2.m.length; i++) this._u2.m[i] = 0;
		for (i = 0; i < this._u3.m.length; i++) this._u3.m[i] = 0;
		// for(i=0; i<this._cart.m.length; i++) this._cart.m[i] = 0;
		for (i = 0; i < this._exth.m.length; i++) this._exth.m[i] = 0;
		for (i = 0; i < this._vid0.m.length; i++) this._vid0.m[i] = 0;
		if (this._isPlus) {
			for (i = 0; i < this._vid1.m.length; i++) this._vid1.m[i] = 0;
			for (i = 0; i < this._vid2.m.length; i++) this._vid2.m[i] = 0;
			for (i = 0; i < this._vid3.m.length; i++) this._vid3.m[i] = 0;
		}

		this.setVidMap(0);
		this.setMap(0);
	};

	MMU.prototype.addRom = function(name, data) {
		var i;
		var dataCrc = Utils.crc32(data);
		switch(name) {
			case "TVC12_D7.64K":
				if (dataCrc != 0x1cbbeac6) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._exth.m[i] = data[i];
				break;

			case "TVC12_D4.64K":
				if (dataCrc != 0x834ca9be) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._sys.m[i] = data[i];
				break;

			case "TVC12_D3.64K":
				if (dataCrc != 0x71753d02) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._sys.m[0x2000+i] = data[i];
				break;

			case "TVC22_D7.64K":
				if (dataCrc != 0x05e1c3a8) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._exth.m[i] = data[i];
				break;

			case "TVC22_D6.64K":
				if (dataCrc != 0x05ac3a34) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._sys.m[i] = data[i];
				break;

			case "TVC22_D4.64K":
				if (dataCrc != 0xba6ad589) throw ("invalid rom ("+name+")!");
				for (i = 0; i < data.length; i++) this._sys.m[0x2000+i] = data[i];
				break;
		}
	};

	MMU.prototype.reset = function() {
		this.setVidMap(0);
		this.setMap(0);
	};

	MMU.prototype.setMap = function(newMap) {
		if (newMap == this._mapVal) return;
		this._mapVal = newMap;

		// page 0
		switch (newMap & 0x18) {
		case 0x00: this._map[0] = this._sys; break;
		case 0x08: this._map[0] = this._cart; break;
		case 0x10: this._map[0] = this._u0; break;
		case 0x18: this._map[0] = this._isPlus ? this._u3 : this._u0; break; // tvc32 & 64k+
		}

		// page 1
		if (this._isPlus && (newMap & 0x04)) {
			// 64k+
			switch(this._mapValVid & 3) {
			case 0: this._map[1] = this._vid0; break;
			case 1: this._map[1] = this._vid1; break;
			case 2: this._map[1] = this._vid2; break;
			case 3: this._map[1] = this._vid3; break;
			}
		}
		else {
			this._map[1] = this._u1;
		}

		// page 2
		if (newMap & 0x20) {
			this._map[2] = this._u2;
		}
		else if (this._isPlus) {
			switch(this._mapValVid & 0x0C) {
			case 0x00: this._map[2] = this._vid0; break;
			case 0x04: this._map[2] = this._vid1; break;
			case 0x08: this._map[2] = this._vid2; break;
			case 0x0C: this._map[2] = this._vid3; break;
			}
		}
		else {
			this._map[2] = this._vid0;
		}

		// page 3
		switch (newMap & 0xc0) {
		case 0x00: this._map[3] = this._cart; break;
		case 0x40: this._map[3] = this._sys; break;
		case 0x80: this._map[3] = this._u3; break;
		case 0xC0: this._map[3] = null; break;
		}

	};

	MMU.prototype.setVidMap = function(newVidMap) {
		if (!this._isPlus) return;
		if (newVidMap == this._mapValVid) return;
		this._mapValVid = newVidMap;

		if (this._mapVal & 0x04) {
			switch(newVidMap & 3) {
			case 0: this._map[1] = this._vid0; break;
			case 1: this._map[1] = this._vid1; break;
			case 2: this._map[1] = this._vid2; break;
			case 3: this._map[1] = this._vid3; break;
			}
		}

		if (!(this._mapVal & 0x20)) {
			switch(newVidMap & 0x0C) {
			case 0x00: this._map[2] = this._vid0; break;
			case 0x04: this._map[2] = this._vid1; break;
			case 0x08: this._map[2] = this._vid2; break;
			case 0x0C: this._map[2] = this._vid3; break;
			}
		}

		switch(newVidMap & 0x30) {
			case 0x00: this.crtmem = this._vid0.m; break;
			case 0x10: this.crtmem = this._vid1.m; break;
			case 0x20: this.crtmem = this._vid2.m; break;
			case 0x30: this.crtmem = this._vid3.m; break;
		}
	};

	MMU.prototype.getMap = function() {
		return this._mapVal;
	};

	MMU.prototype.toString = function() {
		var result = "";
		result += this._map[0].name;
		result += "," + this._map[1].name;
		result += "," + this._map[2].name;
		if (this._map[3]) result += "," + this._map[3].name;
		else if (this.extmmu) result += ",EXT+" + this.extmmu.name + "(" + this.extmmu.toString(true) + ")";
		else result += ",EXT";
		return result;
	};

	MMU.prototype.w8 = function(addrP, val) {
		var mapIdx = (addrP & 0xC000) >>> 14;
		var addr = addrP & 0x3FFF;
		var block = this._map[mapIdx];
		if (this.breakAddr && this.breakAddr[addrP]) {
			console.warn("MEM WRITE:", Utils.toHex16(addrP),"<=",Utils.toHex8(val), "(",Utils.toHex16(g.tvc._z80._s.PC),")");
			//debugger;
		}
		if ((mapIdx == 3) && !block) { // ext
			if ((addr < 0x2000) && this.extmmu) {
				this.extmmu.w8(addr, val);
			}
		}
		else if (block.isRam) {
			block.m[addr] = val & 0xFF;
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
	MMU.prototype.r8 = function(addrP) {
		var mapIdx = (addrP & 0xC000) >>> 14;
		var block = this._map[mapIdx];
		var result = 0;
		var addr = addrP & 0x3FFF;
		if ((mapIdx == 3) && !block) { // ext
			if (addr < 0x2000) {
				if (this.extmmu) {
					result = this.extmmu.r8(addr);
				}
			}
			else {
				result = this._exth.m[addr - 0x2000];
			}
		}
		else {
			result = block.m[addr];
		}
		return result;
	};
	MMU.prototype.r8s = function(addr) {
		var val = this.r8(addr);
		if (val & 0x80) val = -((~val + 1) & 0xFF);
		return val;
	};
	MMU.prototype.r16 = function(addr) {
		return this.r8(addr) | (this.r8(addr + 1) << 8);
	};
	MMU.prototype.r16nolog = MMU.prototype.r16;

	exports.MMU = MMU;
	return exports;
});
