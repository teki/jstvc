define(["scripts/utils.js"], function(Utils) {
	var exports = {};

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


	exports.MMU = MMU;
	return exports;
});
