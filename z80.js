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

function decodeZ80(addr) {
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
		od = MMU.r8(addr+idx);
		idx++;
	}

	function fetchnByte() {
		on = MMU.r8(addr+idx);
		idx++;
	}

	function fetchnWord() {
		onn = MMU.r8(addr+idx);
		idx++;
		onn += MMU.r8(addr+idx) << 8;
		idx++;
	}

	// fetch opcode
	opcode = MMU.r8(addr+idx);
	idx++;
	prefix1 = 0;
	prefix2 = 0;
	if ((opcode == 0xCB) || (opcode == 0xED)) {
		prefix1 = opcode;
		opcode = MMU.r8(addr+idx);
		idx++;
	}
	else if ((opcode == 0xDD) || (opcode == 0xFD)) {
		throw "DD FD not implemented";
		prefix1 = opcode;
		opcode = MMU.r8(addr+idx);
		idx++;
		if (opcode == 0xCB) {
			prefix2 = opcode;
			opcode = MMU.r8(addr+idx);
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

var MMU = {
    _u0: new Uint8Array(16384),
    _u1: new Uint8Array(16384),
    _u2: new Uint8Array(16384),
    _u3: new Uint8Array(16384),
//    _cart: Uint8Array(new ArrayBuffer(16384)),
    _sys: [],
    _ext: new n_buffer.Buffer(16384),
    _vid: new Uint8Array(16384),
    _map: [],
    _mapVal: -1,
    
    init: function() {
        var i;
        for(i=0; i<MMU._u0.length; i++) MMU._u0[i] = 0;
        for(i=0; i<MMU._u1.length; i++) MMU._u1[i] = 0;
        for(i=0; i<MMU._u2.length; i++) MMU._u2[i] = 0;
        for(i=0; i<MMU._u3.length; i++) MMU._u3[i] = 0;
//        for(i=0; i<MMU._cart.length; i++) MMU._cart[i] = 0;
        for(i=0; i<MMU._ext.length; i++) MMU._ext[i] = 0;
        
        var ext = n_fs.readFileSync("TVC_EXT.ROM");
        ext.copy(MMU._ext);
        
        MMU._sys = n_fs.readFileSync("TVC_SYS.ROM");
        MMU.setMap(0);
    },
    
    reset: function() {
        MMU.setMap(0);
    },
    
    setMap: function(val) {
        if (val == MMU._mapVal) return;

        // page 3
        var page3 = (val & 0xc0) >> 6;
        if (page3 == 0) MMU._map[3] = MMU._sys;// MMU._cart;
        else if (page3 == 1) MMU._map[3] = MMU._sys;
        else if (page3 == 2) MMU._map[3] = MMU._u3;
        else MMU._map[3] = MMU._ext;
        // page 2
        if (val & 0x20) MMU._map[2] = MMU._u2;
        else MMU._map[2] = MMU._vid;
        // page 1 is always u1
        // page 0
        var page0 = (val & 0x18) >> 3;
        if (page0 == 0) MMU._map[0] = MMU._sys;
        else if (page0 == 1) MMU._map[0] = MMU._sys;// MMU._cart;
        else if (page3 == 2) MMU._map[0] = MMU._u0;
        else throw "do not know";
    },
    getMap: function() {
        return MMU._mapVal;
    },
    
    w8: function(addr, val) {
        addr = addr & 0xFFFF;
        val = val & 0xFF;
        var mapIdx = addr >>> 14;
        var block = MMU._map[mapIdx];
        if (block === MMU._sys || block === MMU._ext)
            return;
        block[addr & 0x3FFF] = val;
    },
    w16: function(addr, val) {
        MMU.w8(addr+1, val >>> 8);
        MMU.w8(addr, val & 0xFF);
    },
    r8: function(addr) {
        addr = addr & 0xFFFF;    
        var mapIdx = addr >>> 14;
        return MMU._map[mapIdx][addr & 0x3FFF];
    },
    r16: function(addr) {
        return (MMU.r8(addr+1) << 8) | MMU.r8(addr);
    },
    
    dasm: function(addr, lines) {
        var offset = 0,
            d, i, str, oplen;
        do {
            d = decodeZ80(addr + offset);
            oplen = d[1];
            
            str = toHex16(addr + offset) + " ";
            for(i = 0; i < 4; i++) {
                if (i < oplen) {
                    str += toHex8(MMU.r8(addr + offset + i)) + " ";
                }
                else {
                    str += "   ";
                }
            }
            console.log(str + d[0] + "\n");
            offset += oplen;
            lines--;
        } while (lines);
    }
};

var TVC = {
    _clock: 0,
    run: function() {
        var limit = 100;
        MMU.init();
        Z80.init();
        while (TVC._clock < limit) {
            var tinc = Z80.step();
            TVC.clock += tinc;
        }
    }
};

var Z80 = {
    _im: 0,
    _r: {
        A: 0xFF,
        B: 0xFF,
        C: 0xFF,
        D: 0xFF,
        E: 0xFF,
        F: 0xFF,
        H: 0xFF,
        L: 0xFF,
        SP: 0xFFFF,
        PC: 0x0000,
        
        IX: 0xFFFF,
        IY: 0xFFFF,
        I: 0xFF,
        R: 0xFF,
        IFF1: 0,
        IFF2: 0,
        
        AFa: 0xFFFF,
        BCa: 0xFFFF,
        DEa: 0xFFFF,
        HLa: 0xFFFF,

        getBC: function() { return (Z80._r.B << 8) | Z80._r.C;},
        setBC: function(val) { Z80._r.B = (val >>> 8);  Z80._r.C = val & 0xFF;},
        getDE: function() { return (Z80._r.D << 8) | Z80._r.E;},
        setDE: function(val) { Z80._r.D = (val >>> 8);  Z80._r.E = val & 0xFF;},
        getHL: function() { return (Z80._r.H << 8) | Z80._r.L;},
        setHL: function(val) { Z80._r.H = (val >>> 8);  Z80._r.L = val & 0xFF;},


    },
    init: function() {
        Z80._r.A = 0xFF;
        Z80._r.B = 0xFF;
        Z80._r.C = 0xFF;
        Z80._r.D = 0xFF;
        Z80._r.E = 0xFF;
        Z80._r.F = 0xFF;
        Z80._r.H = 0xFF;
        Z80._r.L = 0xFF;
        Z80._r.SP = 0xFFFF;
        Z80._r.PC = 0x0000;
        
        Z80._r.IX = 0xFFFF;
        Z80._r.IY = 0xFFFF;
        Z80._r.I = 0xFF;
        Z80._r.R = 0xFF;
        
        Z80._r.AFa = 0xFFFF;
        Z80._r.BCa = 0xFFFF;
        Z80._r.DEa = 0xFFFF;
        Z80._r.HLa = 0xFFFF;

        Z80.reset();
    },

    reset: function() {
        Z80._r.IFF1 = 0;
        Z80._r.IFF2 = 0;
        Z80._r.PC = 0;
        Z80._r.R = 0;
        Z80._r.I = 0;
        Z80._im = 0;
    },
    
    step: function() {
        var opcode = MMU.r8(Z80._r.PC);
        if (opcode == 0xed || opcode == 0xcb || opcode == 0xdd || opcode == 0xfd) {
            opcode = (opcode << 8) | MMU.r8(Z80._r.PC + 1);
            if (opcode == 0xfdcb || opcode == 0xddcb) {
                opcode = (opcode << 8) | MMU.r8(Z80._r.PC + 2);
            }
        }
        var op = Z80[opcode];
        if (!op) {
            MMU.dasm(Z80._r.PC, 5);
            throw("not implemented:" + toHex8(opcode));
        }
        op.f();
        Z80._r.PC += op.m;
        return op.t;
    },
        
    0x00: {
        t: 4, m: 1, asm: "NOP",
        f: function() {
            }
        },
    0x3e: {
        t: 7, m: 2, asm: "LD A,n",
        f: function() {
            Z80._r.A = MMU.r8(Z80._r.PC + 1);
            throw("set flags!!!!");
            }
        },
    0xc3: {
        t: 10, m: 0, asm: "JP (nn)", // m hack, it is 3, but don't want to skip
        f: function() {
            Z80._r.PC = MMU.r16(Z80._r.PC + 1);
            }
        },
    0xf3: {
        t: 4, m: 1, asm: "DI",
        f: function() {
            Z80._r.IFF1 = 0;
            Z80._r.IFF2 = 0;
            }
        },
    0xed56: {
        t: 8, m: 2, asm: "IM 1",        // RST 38
        f: function() {
            Z80._im = 1;
            }
        },
};

TVC.run();
