import { Utils } from "./utils.js";
import { FD1793 } from "./fd1793.js";

function MemBlock(name, isRam, buffer, offset, size) {
	this.name = name;
	this.isRam = isRam;
	if (isRam) this.m = new Uint8Array(size);
	else this.m = new Uint8Array(buffer, offset, size);
}

export function HBF(rom) {
	this.type = "HBF";
	this.mmu = this;
	this._rom0 = new MemBlock("ROM0", false, rom.buffer, 0x0000, 0x1000);
	this._rom1 = new MemBlock("ROM1", false, rom.buffer, 0x1000, 0x1000);
	this._rom2 = new MemBlock("ROM2", false, rom.buffer, 0x2000, 0x1000);
	this._rom3 = new MemBlock("ROM3", false, rom.buffer, 0x3000, 0x1000);

	this._rom = this._rom0;
	this._ram = new MemBlock("RAM", true, null, 0, 4096);

	this._fdc = new FD1793();
}

HBF.prototype.toString = function (mmu) {
	var result = "";
	if (mmu) {
		result += this._rom.name;
	}
	else {
		result = "HBF " + this._disks;
	}
	return result;
};

HBF.prototype.writePort = function (addr, val) {
	if (addr >= 0 && addr <= 4) {
		this._fdc.write(addr, val);
	}
	else if (addr == 8) {
		switch (val & 0x30) {
			case 0x00: this._rom = this._rom0; break;
			case 0x10: this._rom = this._rom1; break;
			case 0x20: this._rom = this._rom2; break;
			case 0x30: this._rom = this._rom3; break;
		}
	}
	else {
		debugger;
		console.warn("unhandled HBF port write " + Utils.toHex8(addr) + " " + Utils.toHex8(val));
	}
};

HBF.prototype.readPort = function (addr) {
	var result = 0;
	if (addr >= 0 && addr <= 4) {
		result = this._fdc.read(addr);
	}
	else {
		debugger;
		console.warn("unhandled HBF port read " + Utils.toHex8(addr));
	}
	return result;
};

HBF.prototype.getType = function () {
	return 2;
};

HBF.prototype.w8 = function (addr, val) {
	if (addr >= 0x1000) {
		this._ram.m[addr - 0x1000] = val & 0xFF;
	}
};

HBF.prototype.r8 = function (addr) {
	var result;
	if (addr >= 0x1000) {
		result = this._ram.m[addr - 0x1000];
	}
	else {
		result = this._rom.m[addr];
	}
	return result;
};

HBF.prototype.loadDisk = function (name, data) {
	this._fdc.loadDsk(0, name, data);
};
