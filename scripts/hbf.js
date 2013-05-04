define([
	"scripts/utils.js",
	"scripts/wd1793.js"
	], function(Utils, WD1793) {
	var exports = {};

	function MemBlock(name, isRam, buffer, offset, size) {
		this.name = name;
		this.isRam = isRam;
		if (isRam) this.m = new Uint8Array(size);
		else this.m = new Uint8Array(buffer, offset, size);
	}

	function HBF(rom) {
		this.type = "HBF";
		this.mmu = this;
		this._rom0 = new MemBlock("ROM0", false, rom.buffer, 0x0000, 0x1000);
		this._rom1 = new MemBlock("ROM1", false, rom.buffer, 0x1000, 0x1000);
		this._rom2 = new MemBlock("ROM2", false, rom.buffer, 0x2000, 0x1000);
		this._rom3 = new MemBlock("ROM3", false, rom.buffer, 0x3000, 0x1000);

		this._rom = this._rom0;
		this._ram = new MemBlock("RAM", true, null, 0, 4096);

		this._disks = [undefined, undefined, undefined, undefined];
		this._fdc = new WD1793.WD1793();

		this._fdc.Reset1793(this._fdc, this._disks, 0);
	}

	HBF.prototype.toString = function(mmu) {
		var result = "";
		if (mmu) {
			result += this._rom.name;
		}
		else {
			result = "HBF " + this._disks;
		}
		return result;
	};

	HBF.prototype.writePort = function(addr, val) {
		var result;
		switch(addr) {
			case 0x00:
				// FDC command
				result = this._fdc.Write1793(this._fdc, addr, val); 
				break;
			case 0x01:
				// FDC track
				result = this._fdc.Write1793(this._fdc, addr, val); 
				break;
			case 0x02:
				// FDC sector
				result = this._fdc.Write1793(this._fdc, addr, val); 
				break;
			case 0x03:
				// FDC data
				result = this._fdc.Write1793(this._fdc, addr, val); 
				break;
			case 0x04:
				// SS,MON,DDEN,HLD,DS3,DS2,DS1,DS0
				// side select: 0: side 0, 1: side 1
				// motor on: 1: motor on
				// double density: 1: on
				// hold: 1: head on disk (it is or-ed with motor on)
				// drive select: 1: drive active
				result = this._fdc.Write1793(this._fdc, addr, val); 
				break;
			case 0x08:
				switch(val & 0x30) {
					case 0x00: this._rom = this._rom0; break;
					case 0x10: this._rom = this._rom1; break;
					case 0x20: this._rom = this._rom2; break;
					case 0x30: this._rom = this._rom3; break;
				}
				break;
			default:
				//debugger;
				console.warn("unhandled HBF port write " + Utils.toHex8(addr) + " " + Utils.toHex8(val));
		}
		console.log("HBF: writePort: ",Utils.toHex8(addr)," ",Utils.toHex8(val));
	};

	HBF.prototype.readPort = function(addr) {
		var result;
		switch (addr) {
			case 0x00:
				// FDC state
				//result = this._fdc.Read1793(this._fdc, addr); 
				retult = 0;
				break;
			case 0x01:
				// FDC track
				//result = this._fdc.Read1793(this._fdc, addr); 
				retult = 0;
				break;
			case 0x02:
				// FDC sector
				//result = this._fdc.Read1793(this._fdc, addr); 
				retult = 0;
				break;
			case 0x03:
				// FDC data
				//result = this._fdc.Read1793(this._fdc, addr); 
				retult = 0;
				break;
			case 0x04:
				// INTRQ,0,0,0,0,0,0,DRQ
				// faster to use than FDC
				retult = 0;
				/*
				result = this._fdc.IRQ & 0x80;
				result |= (this._fdc.IRQ & 0x40) ? 1 : 0;
				*/
				break;
			default:
				//debugger;
				console.warn("unhandled HBF port read " + Utils.toHex8(addr));
				result = 0xff;
		}
		console.log("HBF: readPort: ",Utils.toHex8(addr));
		return result;
	};

	HBF.prototype.getType = function() {
		return 2;
	};

	HBF.prototype.w8 = function(addr, val) {
		if (addr >= 0x1000) {
			this._ram.m[addr - 0x1000] = val & 0xFF;
		}
	};

	HBF.prototype.r8 = function(addr) {
		var result;
		if (addr >= 0x1000) {
			result = this._ram.m[addr - 0x1000];
		}
		else {
			result = this._rom.m[addr];
		}
		return result;
	};

	HBF.prototype.loadDisk = function(name, data) {
		this._disks[0] = new WD1793.FDIDisk();
		this._disks[0].LoadFDI(this._disks[0], name, 0, data);
		this._fdc.Reset1793(this._fdc, this._disks, 0);
	};

	exports.HBF = HBF;
	return exports;
});

