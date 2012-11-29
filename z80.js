/* Resources
	http://www.z80.info/decoding.htm
*/

var n_fs = require("fs");

function toHex8(x) {
	var s = x.toString(16).toUpperCase();
	return "0".slice(s.length - 1) + s;
}

function toHex16(x) {
	var s = x.toString(16).toUpperCase();
	return "000".slice(s.length - 1) + s;
}

function decodeZ80(mmu, addr) {
	var tableR = ["B", "C", "D", "E", "H", "L", "(HL)", "A"],
		tableRP = ["BC", "DE", "HL", "SP"],
		tableRP2 = ["BC", "DE", "HL", "AF"],
		tableCC = ["NZ", "Z", "NC", "C", "PO", "PE", "P", "M"],
		tableALU = ["ADD A,", "ADC A,", "SUB", "SBC A,", "AND", "XOR", "OR", "CP"],
		tableROT = ["RLC", "RRC", "RL", "RR", "SLA", "SRA", "SLL", "SRL"],
		tableIM = ["0", "0/1", "1", "2", "0", "0/1", "1", "2"],
		tableBLI = [
			[],
			[],
			[],
			[],
			["LDI", "CPI", "INI", "OUTI"],
			["LDD", "CPD", "IND", "OUTD"],
			["LDIR", "CPIR", "INIR", "OTIR"],
			["LDDR", "CPDR", "INDR", "OTDR"]
		],
		prefix1 = 0,
		prefix2 = 0,
		idx = 0,
		opcode, od, on, onn,
		ox, oy, oz, op, oq;

	function fetchdByte() {
		od = mmu.r8(addr + idx);
		idx++;
	}

	function fetchnByte() {
		on = mmu.r8(addr + idx);
		idx++;
	}

	function fetchnWord() {
		onn = mmu.r8(addr + idx);
		idx++;
		onn += mmu.r8(addr + idx) << 8;
		idx++;
	}

	// fetch opcode
	opcode = mmu.r8(addr + idx);
	idx++;
	prefix1 = 0;
	prefix2 = 0;
	if ((opcode == 0xCB) || (opcode == 0xED)) {
		prefix1 = opcode;
		opcode = mmu.r8(addr + idx);
		idx++;
	}
	else if ((opcode == 0xDD) || (opcode == 0xFD)) {
		prefix1 = opcode;
		opcode = mmu.r8(addr + idx);
		idx++;
		if (opcode == 0xCB) {
			prefix2 = opcode;
			opcode = mmu.r8(addr + idx);
			idx++;
		}
		throw "DD FD not implemented";
	}

	ox = (opcode & 0xC0) >>> 6; // 2 bits
	oy = (opcode & 0x38) >>> 3; // 3 bits
	oz = opcode & 0x07; // 3 bits
	op = oy >>> 1; // 2 bits
	oq = oy & 1; // 1 bits
	//console.log(toHex8(opcode), ox, oy, oz, op, oq);

	// process
	if (prefix1 == 0xCB) {
		if (ox === 0) return [tableROT[oy] + " " + tableR[oz], idx];
		if (ox == 1) return ["BIT " + oy + ", " + tableR[oz], idx];
		if (ox == 2) return ["RES " + oy + ", " + tableR[oz], idx];
		if (ox == 3) return ["SET " + oy + ", " + tableR[oz], idx];
		throw "invalid";
	}
	if (prefix1 == 0xED) {
		if (ox === 0 || ox == 3) return ["NONI + NOP", idx];
		if (ox == 2) {
			if (oz <= 3 && oy >= 4) return [tableBLI[oy][oz], idx];
			return ["NONI + NOP", idx];
		}
		// ox == 1
		if (oz === 0) {
			if (oy == 6) return ["IN (C)", idx];
			return ["IN " + tableR[oy] + ", (C)", idx];
		}
		if (oz == 1) {
			if (oy == 6) return ["OUT (C)", idx];
			return ["IN " + tableR[oy] + ", (C)", idx];
		}
		if (oz == 2) {}
		if (oz == 3) {}
		if (oz == 4) {}
		if (oz == 5) {}
		if (oz == 6) return ["IM " + tableIM[oy], idx];
		if (oz == 7) {}
		throw "not implemented";
	}

	if (ox === 0) {
		if (oz === 0) {
			if (oy === 0) return ["NOP", idx];
			if (oy == 1) return ["EX AF, AF'", idx];
			if (oy == 2) {
				fetchdByte();
				return ["DJNZ " + toHex8(od), idx];
			}
			if (oy == 3) {
				fetchdByte();
				return ["JR " + toHex8(od), idx];
			}
			// oy 4-7
			fetchdByte();
			return ["JR " + tableCC[oy - 4] + ", " + toHex8(od), idx];
		}

		if (oz == 1) {
			if (oq === 0) {
				fetchnWord();
				return ["LD " + tableRP[op] + ", " + toHex16(onn), idx];
			}
			// oq == 1
			return ["ADD HL, " + tableRP[op], idx];
		}
		if (oz == 2) {
			if (oq === 0) {
				if (op === 0) return ["LD (BC), A", idx];
				if (op == 1) return ["LD (DE), A", idx];
				fetchnWord();
				if (op == 2) return ["LD (" + toHex16(onn) + "), HL", idx];
				if (op == 3) return ["LD (" + toHex16(onn) + "), A", idx];
			}
			// oq == 1
			if (op === 0) return ["LD A, (BC)", idx];
			if (op == 1) return ["LD A, (DE)", idx];
			fetchnWord();
			if (op == 2) return ["LD HL, (" + toHex16(onn) + ")", idx];
			// op == 3
			return ["LD A, (" + toHex16(onn) + ")", idx];
		}
		if (oz == 3) {
			if (oq === 0) return ["INC " + tableRP[op], idx];
			// oq == 1
			return ["DEC " + tableRP[op], idx];
		}
		if (oz == 4) return ["INC " + tableR[oy], idx];
		if (oz == 5) return ["DEC " + tableR[oy], idx];
		if (oz == 6) {
			fetchnByte();
			return ["LD " + tableR[oy] + ", " + toHex8(on), idx];
		}
		// oz == 7
		return [["RLCA", "RRCA", "RLA", "RRA", "DAA", "CPL", "SCF", "CCF"][oy], idx];
	}

	if (ox == 1) {
		if ((oz == 6) && (oy == 6)) {
			return ["HALT", idx];
		}
		return ["LD " + tableR[oy] + "," + tableR[oz], idx];
	}

	if (ox == 2) {
		return [tableALU[oy] + " " + tableR[oz], idx];
	}

	if (ox == 3) {
		if (oz === 0) return ["RET " + tableCC[oy], idx];
		if (oz == 1) {
			if (oq === 0) return ["POP " + tableRP2[op], idx];
			// q == 1
			return [["RET", "EXX", "JP HL", "LD SP,HL"][op], idx];
		}
		if (oz == 2) {
			fetchnWord();
			return ["JP " + tableCC[oy] + "," + toHex8(onn), idx];
		}
		if (oz == 3) {
			if (oy === 0) {
				fetchnWord();
				return ["JP " + toHex16(onn), idx];
			}
			if (oy == 1) {
				throw "CB prefix";
			}
			if (oy == 2) {
				fetchnByte();
				return ["OUT (" + toHex8(on) + "),A", idx];
			}
			if (oy == 3) {
				fetchnByte();
				return ["IN A,(" + toHex8(on) + ")", idx];
			}
			return [["EX (SP), HL", "EX DE, HL", "DI", "EI"][oy - 4], idx];
		}
		if (oz == 4) {
			fetchnWord();
			return ["CALL " + tableCC[oy] + "," + toHex16(onn), idx];
		}
		if (oz == 5) {
			if (q === 0) return ["PUSH " + tableRP2[op], idx];
			if (p == 1) {
				fetchnWord();
				return ["CALL " + toHex16(onn), idx];
			}
			throw "DD, ED, FD prefixes";
		}
		if (oz == 6) {
			fetchnByte();
			return [tableALU[oy] + " " + toHex8(on), idx];
		}
		// oz == 7
		return ["RST " + toHex8(oy * 8), idx];
	}

	return ["- " + toHex8(opcode), idx];
}

/* *********************************************
	MMU
********************************************* */
function MMU() {
	this._u0 = new Uint8Array(16384);
	this._u1 = new Uint8Array(16384);
	this._u2 = new Uint8Array(16384);
	this._u3 = new Uint8Array(16384);
	//    this._cart = Uint8Array(new ArrayBuffer(16384));
	this._sys = [];
	this._ext = new Uint8Array(16384);
	this._vid = new Uint8Array(16384);
	this._map = [];
	this._mapVal = -1;

	this.init();
}

MMU.prototype.init = function() {
	var i;
	for (i = 0; i < this._u0.length; i++) this._u0[i] = 0;
	for (i = 0; i < this._u1.length; i++) this._u1[i] = 0;
	for (i = 0; i < this._u2.length; i++) this._u2[i] = 0;
	for (i = 0; i < this._u3.length; i++) this._u3[i] = 0;
	//        for(i=0; i<this._cart.length; i++) this._cart[i] = 0;
	for (i = 0; i < this._ext.length; i++) this._ext[i] = 0;

	var ext = n_fs.readFileSync("TVC_EXT.ROM");
	for (i = 0; i < ext.length; i++) this._ext[0x2000 + i] = ext[i];

	if (this._ext[0x3000] != 0x3e) throw ("ext is not properly initialized!");

	this._sys = n_fs.readFileSync("TVC_SYS.ROM");
	this.setMap(0);
};
MMU.prototype.reset = function() {
	this.setMap(0);
};
MMU.prototype.setMap = function(val) {
	if (val == this._mapVal) return;

	// page 3
	var page3 = (val & 0xc0) >> 6;
	if (page3 === 0) this._map[3] = this._sys; // this._cart;
	else if (page3 == 1) this._map[3] = this._sys;
	else if (page3 == 2) this._map[3] = this._u3;
	else this._map[3] = this._ext;
	// page 2
	if (val & 0x20) this._map[2] = this._u2;
	else this._map[2] = this._vid;
	// page 1 is always u1
	// page 0
	var page0 = (val & 0x18) >> 3;
	if (page0 === 0) this._map[0] = this._sys;
	else if (page0 == 1) this._map[0] = this._sys; // this._cart;
	else if (page0 == 2) this._map[0] = this._u0;
	else throw "do not know";
};
MMU.prototype.getMap = function() {
	return this._mapVal;
};
MMU.prototype.w8 = function(addr, val) {
	addr = addr & 0xFFFF;
	val = val & 0xFF;
	var mapIdx = addr >>> 14;
	var block = this._map[mapIdx];
	if (block === this._sys || block === this._ext) return;
	block[addr & 0x3FFF] = val;
};
MMU.prototype.w16 = function(addr, val) {
	this.w8(addr + 1, val >>> 8);
	this.w8(addr, val & 0xFF);
};
MMU.prototype.r8 = function(addr) {
	addr = addr & 0xFFFF;
	var mapIdx = addr >>> 14;
	return this._map[mapIdx][addr & 0x3FFF];
};
MMU.prototype.r16 = function(addr) {
	return (this.r8(addr + 1) << 8) | this.r8(addr);
};
MMU.prototype.dasm = function(addr, lines) {
	var offset = 0,
		d, i, str, oplen;
	do {
		d = decodeZ80(this, addr + offset);
		oplen = d[1];

		str = toHex16(addr + offset) + " ";
		for (i = 0; i < 4; i++) {
			if (i < oplen) {
				str += toHex8(this.r8(addr + offset + i)) + " ";
			}
			else {
				str += "   ";
			}
		}
		console.log(str + d[0] + "\n");
		offset += oplen;
		lines--;
	} while (lines);
};

/* *********************************************
	ALU
********************************************* */

function toS8(val) {
	if (val & 0x80) return -1 * (0x80 - (val & 0x7f));
	return val;
}
function add8(val1, val2) { // adds two unsigned number, result is unsigned + overflow
	var res = toS8(val1) + toS8(val2),
		overflow = (res > 127 || res < -128);
	return [res & 0xff, overflow];
}
function sub8(val1, val2) { // substracts two unsigned number, result is unsigned + overflow
	var res = toS8(val1) - toS8(val2),
		overflow = (res > 127 || res < -128);
	return [res & 0xff, overflow];
}

/* *********************************************
	Z80State
********************************************* */

var F_S  = 0x80;  // sign
var F_Z  = 0x40;  // zero
var F_5  = 0x20;  // ???
var F_H  = 0x10;  // half-carry
var F_3  = 0x08;  // ???
var F_PV = 0x04; // parity or overflow
var F_N  = 0x02;  // add/subtract
var F_C  = 0x01;  // carry

function Z80State() {
	this.init();
}


Z80State.prototype.init = function() {
	// interrupt
	this.im = 0;
	this.IFF1 = 0;
	this.IFF2 = 0;
	this.I = 0xFF;

	// registers
	this.A = 0xFF;
	this.B = 0xFF;
	this.C = 0xFF;
	this.D = 0xFF;
	this.E = 0xFF;
	this.F = 0xFF;
	this.H = 0xFF;
	this.L = 0xFF,
	this.SP = 0xFFFF;
	this.PC = 0x0000;

	this.IX = 0xFFFF;
	this.IY = 0xFFFF;

	this.AFa = 0xFFFF;
	this.BCa = 0xFFFF,
	this.DEa = 0xFFFF;
	this.HLa = 0xFFFF;

	this.R = 0xFF;

	this.reset();
};

Z80State.prototype.reset = function() {
	this.IFF1 = 0;
	this.IFF2 = 0;
	this.PC = 0;
	this.R = 0;
	this.I = 0;
	this.im = 0;
};

Z80State.prototype.getAF = function() {
	return (this.A << 8) | this.F;
};
Z80State.prototype.setAF = function(val) {
	this.A = (val >>> 8) & 0xFF;
	this.F = val & 0xFF;
};
Z80State.prototype.getBC = function() {
	return (this.B << 8) | this.C;
};
Z80State.prototype.setBC = function(val) {
	this.B = (val >>> 8) & 0xFF;
	this.C = val & 0xFF;
};
Z80State.prototype.getDE = function() {
	return (this.D << 8) | this.E;
};
Z80State.prototype.setDE = function(val) {
	this.D = (val >>> 8) & 0xFF;
	this.E = val & 0xFF;
};
Z80State.prototype.getHL = function() {
	return (this.H << 8) | this.L;
};
Z80State.prototype.setHL = function(val) {
	this.H = (val >>> 8) & 0xFF;
	this.L = val & 0xFF;
};

Z80State.prototype.setF = function(flag, val) {
	if (val) this.F |= flag;
	else this.F &= (~flag);
	return this;
};



/* *********************************************
	Z80
********************************************* */
function Z80(mmu, port_writer, port_reader) {
	this._mmu = mmu;
	this._out = port_writer;
	this._in = port_reader;
	this._s = new Z80State();
	this._op_t = 0;
	this._op_m = 0;
}

Z80.prototype._opcodes = {

	0x00: function() { // NOP
		this._op_t = 4;
		this._op_m = 1;
	},
	0x01: function() { // LD BC,nn
		this._op_t = 10;
		this._op_m = 3;
		this._s.setBC(this._mmu.r16(this._s.PC + 1));
	},
	0x02: function() { // LD (BC),A
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x03: function() { // INC BC
		this._op_t = 6;
		this._op_m = 1;
		this._s.setBC(this._s.getBC()+1);
	},
	0x04: function() { // INC B
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x05: function() { // DEC B
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x06: function() { // LD B,n
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x07: function() { // 	RLCA		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x08: function() { // EX AF,AF'
		this._op_t = 4;
		this._op_m = 1;
		var af = this._s.getAF();
		this._s.setAF(this._s.AFa);
		this._s.AFa = af;
	},
	0x09: function() { // 	ADD	HL,BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0A: function() { // 	LD	A,(BC)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0B: function() { // 	DEC	BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0C: function() { // 	INC	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0D: function() { // 	DEC	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0E: function() { // 	LD	C,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x0F: function() { // 	RRCA		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x10: function() { // 	DJNZ	e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x11: function() { // 	LD	DE,nn	
		this._op_t = 10;
		this._op_m = 3;
		this._s.setDE(this._mmu.r16(this._s.PC + 1));
	},
	0x12: function() { // 	LD	(DE),A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x13: function() { // 	INC	DE	
		this._op_t = 6;
		this._op_m = 1;
		this._s.setDE(this._s.getDE()+1);
	},
	0x14: function() { // 	INC	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x15: function() { // 	DEC	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x16: function() { // 	LD	D,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x17: function() { // 	RLA		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x18: function() { // 	JR	e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x19: function() { // 	ADD	HL,DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x1A: function() { // 	LD	A,(DE)	
		this._op_t = 7;
		this._op_m = 1;
		this._s.A = this._mmu.r8(this._s.getDE());
	},
	0x1B: function() { // 	DEC	DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x1C: function() { // 	INC	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x1D: function() { // 	DEC	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x1E: function() { // 	LD	E,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x1F: function() { // 	RRA		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x20: function() { // 	JR	NZ,e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x21: function() { // 	LD	HL,nn	
		this._op_t = 10;
		this._op_m = 3;
		this._s.setHL(this._mmu.r16(this._s.PC + 1));
	},
	0x22: function() { // 	LD	(nn),HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x23: function() { // 	INC	HL	
		this._op_t = 6;
		this._op_m = 1;
		this._s.setHL(this._s.getHL()+1);
	},
	0x24: function() { // 	INC	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x25: function() { // 	DEC	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x26: function() { // 	LD	H,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x27: function() { // 	DAA		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x28: function() { // 	JR	Z,e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x29: function() { // 	ADD	HL,HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2A: function() { // 	LD	HL,(nn)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2B: function() { // 	DEC	HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2C: function() { // 	INC	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2D: function() { // 	DEC	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2E: function() { // 	LD	L,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x2F: function() { // 	CPL		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x30: function() { // 	JR	NC,e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x31: function() { // 	LD	SP,nn	
		this._op_t = 10;
		this._op_m = 3;
		this._s.setSP(this._mmu.r16(this._s.PC + 1));
	},
	0x32: function() { // 	LD	(nn),A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x33: function() { // 	INC	SP	
		this._op_t = 6;
		this._op_m = 1;
		this._s.setSP(this._s.getSP()+1);
	},
	0x34: function() { // 	INC	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x35: function() { // 	DEC	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x36: function() { // 	LD	(HL),n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x37: function() { // 	SCF		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x38: function() { // 	JR	C,e	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x39: function() { // 	ADD	HL,SP	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x3A: function() { // 	LD	A,(nn)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x3B: function() { // 	DEC	SP	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x3C: function() { // 	INC	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x3D: function() { // 	DEC	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x3E: function() { // 	LD	A,n	
		this._op_t = 7;
		this._op_m = 2;
		this._s.A = this._mmu.r8(this._s.PC + 1);
	},
	0x3F: function() { // 	CCF		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x40: function() { // 	LD	B,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x41: function() { // 	LD	B,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x42: function() { // 	LD	B,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x43: function() { // 	LD	B,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x44: function() { // 	LD	B,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x45: function() { // 	LD	B,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x46: function() { // 	LD	B,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x47: function() { // 	LD	B,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x48: function() { // 	LD	C,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x49: function() { // 	LD	C,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4A: function() { // 	LD	C,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4B: function() { // 	LD	C,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4C: function() { // 	LD	C,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4D: function() { // 	LD	C,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4E: function() { // 	LD	C,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x4F: function() { // 	LD	C,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x50: function() { // 	LD	D,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x51: function() { // 	LD	D,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x52: function() { // 	LD	D,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x53: function() { // 	LD	D,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x54: function() { // 	LD	D,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x55: function() { // 	LD	D,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x56: function() { // 	LD	D,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x57: function() { // 	LD	D,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x58: function() { // 	LD	E,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x59: function() { // 	LD	E,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5A: function() { // 	LD	E,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5B: function() { // 	LD	E,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5C: function() { // 	LD	E,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5D: function() { // 	LD	E,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5E: function() { // 	LD	E,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x5F: function() { // 	LD	E,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x60: function() { // 	LD	H,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x61: function() { // 	LD	H,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x62: function() { // 	LD	H,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x63: function() { // 	LD	H,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x64: function() { // 	LD	H,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x65: function() { // 	LD	H,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x66: function() { // 	LD	H,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x67: function() { // 	LD	H,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x68: function() { // 	LD	L,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x69: function() { // 	LD	L,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6A: function() { // 	LD	L,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6B: function() { // 	LD	L,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6C: function() { // 	LD	L,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6D: function() { // 	LD	L,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6E: function() { // 	LD	L,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x6F: function() { // 	LD	L,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x70: function() { // 	LD	(HL),B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x71: function() { // 	LD	(HL),C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x72: function() { // 	LD	(HL),D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x73: function() { // 	LD	(HL),E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x74: function() { // 	LD	(HL),H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x75: function() { // 	LD	(HL),L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x76: function() { // 	HALT		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x77: function() { // 	LD	(HL),A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x78: function() { // 	LD	A,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x79: function() { // 	LD	A,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7A: function() { // 	LD	A,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7B: function() { // 	LD	A,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7C: function() { // 	LD	A,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7D: function() { // 	LD	A,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7E: function() { // 	LD	A,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x7F: function() { // 	LD	A,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x80: function() { // 	ADD	A,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x81: function() { // 	ADD	A,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x82: function() { // 	ADD	A,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x83: function() { // 	ADD	A,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x84: function() { // 	ADD	A,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x85: function() { // 	ADD	A,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x86: function() { // 	ADD	A,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x87: function() { // 	ADD	A,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x88: function() { // 	ADC	A,B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x89: function() { // 	ADC	A,C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8A: function() { // 	ADC	A,D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8B: function() { // 	ADC	A,E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8C: function() { // 	ADC	A,H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8D: function() { // 	ADC	A,L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8E: function() { // 	ADC	A,(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x8F: function() { // 	ADC	A,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x90: function() { // 	SUB	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x91: function() { // 	SUB	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x92: function() { // 	SUB	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x93: function() { // 	SUB	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x94: function() { // 	SUB	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x95: function() { // 	SUB	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x96: function() { // 	SUB	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x97: function() { // 	SUB	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x98: function() { // 	SBC	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x99: function() { // 	SBC	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9A: function() { // 	SBC	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9B: function() { // 	SBC	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9C: function() { // 	SBC	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9D: function() { // 	SBC	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9E: function() { // 	SBC	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0x9F: function() { // 	SBC	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA0: function() { // 	AND	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA1: function() { // 	AND	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA2: function() { // 	AND	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA3: function() { // 	AND	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA4: function() { // 	AND	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA5: function() { // 	AND	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA6: function() { // 	AND	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA7: function() { // 	AND	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA8: function() { // 	XOR	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xA9: function() { // 	XOR	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAA: function() { // 	XOR	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAB: function() { // 	XOR	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAC: function() { // 	XOR	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAD: function() { // 	XOR	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAE: function() { // 	XOR	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xAF: function() { // 	XOR	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB0: function() { // 	OR	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB1: function() { // 	OR	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB2: function() { // 	OR	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB3: function() { // 	OR	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB4: function() { // 	OR	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB5: function() { // 	OR	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB6: function() { // 	OR	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB7: function() { // 	OR	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB8: function() { // 	CP	B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xB9: function() { // 	CP	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBA: function() { // 	CP	D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBB: function() { // 	CP	E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBC: function() { // 	CP	H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBD: function() { // 	CP	L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBE: function() { // 	CP	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xBF: function() { // 	CP	A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC0: function() { // 	RET	NZ	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC1: function() { // 	POP	BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC2: function() { // 	JP	NZ,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC3: function() { // 	JP	nn	
		this._op_t = 10;
		this._op_m = 0;
		this._s.PC = this._mmu.r16(this._s.PC + 1);
	},
	0xC4: function() { // 	CALL	NZ,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC5: function() { // 	PUSH	BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC6: function() { // 	ADD	A,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC7: function() { // 	RST	00H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC8: function() { // 	RET	Z	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xC9: function() { // 	RET		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCA: function() { // 	JP	Z,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCB: function() { // 	#CB		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCC: function() { // 	CALL	Z,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCD: function() { // 	CALL	nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCE: function() { // 	ADC	A,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xCF: function() { // 	RST	08H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD0: function() { // 	RET	NC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD1: function() { // 	POP	DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD2: function() { // 	JP	NC,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD3: function() { // 	OUT	(n),A	
		this._op_t = 11;
		this._op_m = 2;
		this._out(this._mmu.r8(this._s.PC + 1), this._s.A);
	},
	0xD4: function() { // 	CALL	NC,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD5: function() { // 	PUSH	DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD6: function() { // 	SUB	n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD7: function() { // 	RST	10H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD8: function() { // 	RET	C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xD9: function() { // 	EXX		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDA: function() { // 	JP	C,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDB: function() { // 	IN	A,(n)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDC: function() { // 	CALL	C,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDD: function() { // 	#DD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDE: function() { // 	SBC	A,n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xDF: function() { // 	RST	18H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE0: function() { // 	RET	PO	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE1: function() { // 	POP	HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE2: function() { // 	JP	PO,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE3: function() { // 	EX	(SP),HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE4: function() { // 	CALL	PO,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE5: function() { // 	PUSH	HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE6: function() { // 	AND	n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE7: function() { // 	RST	20H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE8: function() { // 	RET	PE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xE9: function() { // 	JP	(HL)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEA: function() { // 	JP	PE,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEB: function() { // 	EX	DE,HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEC: function() { // 	CALL	PE,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED: function() { // 	#ED		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEE: function() { // 	XOR	n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEF: function() { // 	RST	28H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF0: function() { // 	RET	P	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF1: function() { // 	POP	AF	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF2: function() { // 	JP	P,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF3: function() { // 	DI		
		this._op_t = 4;
		this._op_m = 1;
		this._s.IFF1 = 0;
		this._s.IFF2 = 0;
	},
	0xF4: function() { // 	CALL	P,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF5: function() { // 	PUSH	AF	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF6: function() { // 	OR	n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF7: function() { // 	RST	30H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF8: function() { // 	RET	M	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xF9: function() { // 	LD	SP,HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFA: function() { // 	JP	M,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFB: function() { // 	EI		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFC: function() { // 	CALL	M,nn	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFD: function() { // 	#FD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFE: function() { // 	CP	n	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xFF: function() { // 	RST	38H	      
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED00: function() { //    		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED01: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED02: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED03: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED04: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED05: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED06: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED07: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED08: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED09: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED0F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED10: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED11: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED12: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED13: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED14: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED15: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED16: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED17: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED18: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED19: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED1F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED20: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED21: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED22: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED23: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED24: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED25: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED26: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED27: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED28: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED29: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED2F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED30: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED31: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED32: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED33: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED34: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED35: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED36: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED37: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED38: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED39: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED3F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED40: function() { //	IN	B,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED41: function() { //	OUT	(C),B	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED42: function() { //	SBC	HL,BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED43: function() { //	LD	(nn),BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED44: function() { //	NEG		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED45: function() { //	RETN		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED46: function() { //	IM	0	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED47: function() { //	LD	I,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED48: function() { //	IN	C,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED49: function() { //	OUT	(C),C	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4A: function() { //	ADC	HL,BC	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4B: function() { //	LD	BC,(nn)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4D: function() { //	RETI		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED4F: function() { //	LD	R,A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED50: function() { //	IN	D,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED51: function() { //	OUT	(C),D	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED52: function() { //	SBC	HL,DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED53: function() { //	LD	(nn),DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED54: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED55: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED56: function() { //	IM	1	
		this._op_t = 8;
		this._op_m = 2;
		this._s.im = 1;
	},
	0xED57: function() { //	LD	A,I	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED58: function() { //	IN	E,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED59: function() { //	OUT	(C),E	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5A: function() { //	ADC	HL,DE	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5B: function() { //	LD	DE,(nn)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5E: function() { //	IM	2	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED5F: function() { //	LD	A,R	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED60: function() { //	IN	H,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED61: function() { //	OUT	(C),H	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED62: function() { //	SBC	HL,HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED63: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED64: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED65: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED66: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED67: function() { //	RRD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED68: function() { //	IN	L,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED69: function() { //	OUT	(C),L	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6A: function() { //	ADC	HL,HL	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED6F: function() { //	RLD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED70: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED71: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED72: function() { //	SBC	HL,SP	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED73: function() { //	LD	(nn),SP	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED74: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED75: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED76: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED77: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED78: function() { //	IN	A,(C)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED79: function() { //	OUT	(C),A	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7A: function() { //	ADC	HL,SP	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7B: function() { //	LD	SP,(nn)	
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED7F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED80: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED81: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED82: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED83: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED84: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED85: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED86: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED87: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED88: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED89: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED8F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED90: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED91: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED92: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED93: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED94: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED95: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED96: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED97: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED98: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED99: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9A: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9B: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9C: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9D: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9E: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xED9F: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA0: function() { //	LDI		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA1: function() { //	CPI		
		this._op_t = 16;
		this._op_m = 2;
		var val = this._mmu.r8(this._s.HL);
		var res = sub8(this._s.A, val);
		var bc = this._s.getBC();
		bc--;
		this._s.setBC(bc);
		this._s
			.setF(F_Z, res[0] === 0)
			.setF(F_N, true)
			.setF(F_PV, (bc === 0));
	},
	0xEDA2: function() { //	INI		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA3: function() { //	OUTI		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA8: function() { //	LDD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDA9: function() { //	CPD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAA: function() { //	IND		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAB: function() { //	OUTD		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAD: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDAF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB0: function() { //	LDIR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB1: function() { //	CPIR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB2: function() { //	INIR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB3: function() { //	OTIR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB8: function() { //	LDDR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDB9: function() { //	CPDR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBA: function() { //	INDR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBB: function() { //	OTDR		
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBD: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDBF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC0: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC1: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC2: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC3: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC8: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDC9: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCA: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCB: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCD: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDCF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD0: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD1: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD2: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD3: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD8: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDD9: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDA: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDB: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDD: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDDF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE0: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE1: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE2: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE3: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE8: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDE9: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDEA: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDEB: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDEC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDED: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDEE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDEF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF0: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF1: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF2: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF3: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF4: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF5: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF6: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF7: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF8: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDF9: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFA: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFB: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFC: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFD: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFE: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},
	0xEDFF: function() { //			
		this._op_t = 0;
		this._op_m = 0;
		throw ("not implemented");
	},

};

Z80.prototype.step = function() {
	var opcode = this._mmu.r8(this._s.PC);
	if (opcode == 0xed || opcode == 0xcb || opcode == 0xdd || opcode == 0xfd) {
		opcode = (opcode << 8) | this._mmu.r8(this._s.PC + 1);
		if (opcode == 0xfdcb || opcode == 0xddcb) {
			opcode = (opcode << 8) | this._mmu.r8(this._s.PC + 2);
		}
	}
	var f = this._opcodes[opcode];
	if (!f) {
		this._mmu.dasm(this._s.PC, 5);
		throw ("not implemented:" + toHex8(opcode));
	}
	f.call(this);
	if (this._op_t === 0) {
		throw ("you forgot something!");
	}
	this._s.PC += this._op_m;
	return this._op_t;
};

Z80.prototype.reset = function() {
	this._s.reset();
};

/* *********************************************
	TVC
********************************************* */
function TVC() {
	var TVCthis = this;
	this._clock = 0;
	this._mmu = new MMU();
	this._z80 = new Z80(this._mmu, function(addr, val) {
		TVCthis.out(addr, val);
	}, function(addr) {
		return TVCthis. in (addr);
	});
}

TVC.prototype.run = function() {
	var limit = 100;
	while (this._clock < limit) {
		var tinc = this._z80.step();
		this.clock += tinc;
	}
}

TVC.prototype.out = function(addr, val) {
	console.log("OUT (" + toHex8(addr) + "), " + toHex8(val));
	if (addr == 2) {
		this._mmu.setMap(val);
		return;
	}
}

TVC.prototype. in = function(addr) {
	console.log("IN (" + toHex8(addr) + ")");
	return 0;
}

/* *********************************************
	runner
********************************************* */

var tvc = new TVC();
tvc.run();
