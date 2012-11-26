/* Resources
    http://www.z80.info/decoding.htm
*/

var n_fs = require("fs");
var n_buffer = require("buffer");

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
		od = mmu.r8(addr+idx);
		idx++;
	}

	function fetchnByte() {
		on = mmu.r8(addr+idx);
		idx++;
	}

	function fetchnWord() {
		onn = mmu.r8(addr+idx);
		idx++;
		onn += mmu.r8(addr+idx) << 8;
		idx++;
	}

	// fetch opcode
	opcode = mmu.r8(addr+idx);
	idx++;
	prefix1 = 0;
	prefix2 = 0;
	if ((opcode == 0xCB) || (opcode == 0xED)) {
		prefix1 = opcode;
		opcode = mmu.r8(addr+idx);
		idx++;
	}
	else if ((opcode == 0xDD) || (opcode == 0xFD)) {
		throw "DD FD not implemented";
		prefix1 = opcode;
		opcode = mmu.r8(addr+idx);
		idx++;
		if (opcode == 0xCB) {
			prefix2 = opcode;
			opcode = mmu.r8(addr+idx);
			idx++;
		}
	}

	ox = (opcode & 0xC0) >>> 6; // 2 bits
	oy = (opcode & 0x38) >>> 3; // 3 bits
	oz = opcode & 0x07; // 3 bits
	op = oy >>> 1; // 2 bits
	oq = oy & 1; // 1 bits
	//console.log(toHex8(opcode), ox, oy, oz, op, oq);

	// process
	if (prefix1 == 0xCB) {
		if (ox == 0) return [tableROT[oy] + " " + tableR[oz], idx];
		if (ox == 1) return ["BIT " + oy + ", " + tableR[oz], idx];
		if (ox == 2) return ["RES " + oy + ", " + tableR[oz], idx];
		if (ox == 3) return ["SET " + oy + ", " + tableR[oz], idx];
		throw "invalid";
	}
	if (prefix1 == 0xED) {
		if (ox == 0 || ox == 3) return ["NONI + NOP", idx];
		if (ox == 2) {
			if (oz <= 3 && oy >= 4) return [tableBLI[oy][oz], idx];
			return ["NONI + NOP", idx];
		}
		// ox == 1
		if (oz == 0) {
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

	if (ox == 0) {
		if (oz == 0) {
			if (oy == 0) return ["NOP", idx];
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
			if (oq == 0) {
				fetchnWord();
				return ["LD " + tableRP[op] + ", " + toHex16(onn), idx];
			}
			// oq == 1
			return ["ADD HL, " + tableRP[op], idx];
		}
		if (oz == 2) {
			if (oq == 0) {
				if (op == 0) return ["LD (BC), A", idx];
				if (op == 1) return ["LD (DE), A", idx];
				fetchnWord();
				if (op == 2) return ["LD (" + toHex16(onn) + "), HL", idx];
				if (op == 3) return ["LD (" + toHex16(onn) + "), A", idx];
			}
			// oq == 1
			if (op == 0) return ["LD A, (BC)", idx];
			if (op == 1) return ["LD A, (DE)", idx];
			fetchnWord();
			if (op == 2) return ["LD HL, (" + toHex16(onn) + ")", idx];
			// op == 3
			return ["LD A, (" + toHex16(onn) + ")", idx];
		}
		if (oz == 3) {
			if (oq == 0) return ["INC " + tableRP[op], idx];
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
		if (oz == 0) return ["RET " + tableCC[oy], idx];
		if (oz == 1) {
			if (oq == 0) return ["POP " + tableRP2[op], idx];
			// q == 1
			return [["RET", "EXX", "JP HL", "LD SP,HL"][op], idx];
		}
		if (oz == 2) {
			fetchnWord();
			return ["JP " + tableCC[oy] + "," + toHex8(onn), idx];
		}
		if (oz == 3) {
			if (oy == 0) {
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
			if (q == 0) return ["PUSH " + tableRP2[op], idx];
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
    this._ext = new n_buffer.Buffer(16384);
    this._vid = new Uint8Array(16384);
    this._map = [];
    this._mapVal = -1;
    
    this.init();
};

MMU.prototype.init = function() {
    var i;
    for(i=0; i< this._u0.length; i++) this._u0[i] = 0;
    for(i=0; i< this._u1.length; i++) this._u1[i] = 0;
    for(i=0; i< this._u2.length; i++) this._u2[i] = 0;
    for(i=0; i< this._u3.length; i++) this._u3[i] = 0;
//        for(i=0; i<this._cart.length; i++) this._cart[i] = 0;
    for(i=0; i<this._ext.length; i++) this._ext[i] = 0;
    
    var ext = n_fs.readFileSync("TVC_EXT.ROM");
    ext.copy(this._ext);
    
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
    if (page3 === 0) this._map[3] = this._sys;// this._cart;
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
    else if (page0 == 1) this._map[0] = this._sys;// this._cart;
    else if (page3 == 2) this._map[0] = this._u0;
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
    if (block === this._sys || block === this._ext)
        return;
    block[addr & 0x3FFF] = val;
};
MMU.prototype.w16 = function(addr, val) {
    this.w8(addr+1, val >>> 8);
    this.w8(addr, val & 0xFF);
};
MMU.prototype.r8 = function(addr) {
    addr = addr & 0xFFFF;    
    var mapIdx = addr >>> 14;
    return this._map[mapIdx][addr & 0x3FFF];
};
MMU.prototype.r16 = function(addr) {
    return (this.r8(addr+1) << 8) | this.r8(addr);
};
MMU.prototype.dasm = function(addr, lines) {
    var offset = 0,
        d, i, str, oplen;
    do {
        d = decodeZ80(this, addr + offset);
        oplen = d[1];
        
        str = toHex16(addr + offset) + " ";
        for(i = 0; i < 4; i++) {
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
    Z80State
********************************************* */
function Z80State() {
    this.init();
}

Z80State.prototype.getBC = function() { return (this.B << 8) | this.C;};
Z80State.prototype.setBC = function(val) { this.B = (val >>> 8);  this.C = val & 0xFF;};
Z80State.prototype.getDE = function() { return (this.D << 8) | this.E;};
Z80State.prototype.setDE = function(val) { this.D = (val >>> 8);  this.E = val & 0xFF;};
Z80State.prototype.getHL = function() { return (this.H << 8) | this.L;};
Z80State.prototype.setHL = function(val) { this.H = (val >>> 8);  this.L = val & 0xFF;};

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

/* *********************************************
    Z80
********************************************* */
function Z80(mmu) {
    this._mmu = mmu;
    this._s = new Z80State();
    this._opcodes = {
        0x00: {
            t: 4, m: 1, asm: "NOP",
            f: function(reg, mem) {}
            },
        0x3e: {
            t: 7, m: 2, asm: "LD A,n",
            f: function(reg, mem) {
                reg.A = mem.r8(reg.PC + 1);
                throw("set flags!!!!");
                }
            },
        0xc3: {
            t: 10, m: 0, asm: "JP (nn)", // m hack, it is 3, but don't want to skip
            f: function(reg, mem) {
                reg.PC = mem.r16(reg.PC + 1);
                }
            },
        0xf3: {
            t: 4, m: 1, asm: "DI",
            f: function(reg, mem) {
                reg.IFF1 = 0;
                reg.IFF2 = 0;
                }
            },
        0xed56: {
            t: 8, m: 2, asm: "IM 1",        // RST 38
            f: function(reg, mem) {
                reg.im = 1;
                }
            },
    };        
};

Z80.prototype.step = function() {
    var opcode = this._mmu.r8(this._s.PC);
    if (opcode == 0xed || opcode == 0xcb || opcode == 0xdd || opcode == 0xfd) {
        opcode = (opcode << 8) | this._mmu.r8(this._s.PC + 1);
        if (opcode == 0xfdcb || opcode == 0xddcb) {
            opcode = (opcode << 8) | this._mmu.r8(this._s.PC + 2);
        }
    }
    var op = this._opcodes[opcode];
    if (!op) {
        this._mmu.dasm(this._s.PC, 5);
        throw("not implemented:" + toHex8(opcode));
    }
    op.f(this._s, this._mmu);
    this._s.PC += op.m;
    return op.t;
};

Z80.prototype.reset = function() {
    this._s.reset();
};

/* *********************************************
    TVC
********************************************* */
function TVC() {
    this._clock = 0;
    this._mmu = new MMU();
    this._z80 = new Z80(this._mmu);
}
TVC.prototype.run = function() {
    var limit = 100;
    while (this._clock < limit) {
        var tinc = this._z80.step();
        this.clock += tinc;
    }
}

/* *********************************************
    runner
********************************************* */

var tvc = new TVC();
tvc.run();
