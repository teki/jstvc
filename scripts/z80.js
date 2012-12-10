define(function() {

    var Z80Module = {};

    function toHex8(x) {
        var s = x.toString(16).toUpperCase();
        return "0".slice(s.length - 1) + s;
    }

    function toHex16(x) {
        var s = x.toString(16).toUpperCase();
        return "000".slice(s.length - 1) + s;
    }

    Z80Module.decodeZ80 = function(mmu, addr) {
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
        else if (opcode == 0xDD || opcode == 0xFD) {
            prefix1 = opcode;
            opcode = mmu.r8(addr + idx);
            idx++;
            if (-1 !== [0xDD, 0xED, 0xFD].indexOf(opcode))
                return this.decodeZ80(mmu, addr + 1);
            if (opcode == 0xCB) {
                prefix2 = opcode;
                opcode = mmu.r8(addr + idx);
                idx++;
            }
            else {
                var replreg;
                if (prefix1 == 0xDD)
                    replreg = "IX";
                else
                    replreg = "IY";
                res = this.decodeZ80(mmu, addr + 1);
                console.log(res);
                var txt = res[0];
                if (txt.indexOf("(HL)") !== -1) {
                    throw "add";

                }
                else if (txt.indexOf("HL") !== -1) {
                    txt = txt.replace("HL", replreg);
                }
                else if (txt.indexOf("H") !== -1) {
                    txt = txt.replace("H", replreg + "H");
                }
                else if (txt.indexOf("L") !== -1) {
                    txt = txt.replace("L", replreg + "L");
                }
                res[0] = txt;
                res[1] = res[1] + 1;
                console.log(res);
                return res;
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
                return ["OUT " + tableR[oy] + ", (C)", idx];
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
                if (oq === 0) return ["PUSH " + tableRP2[op], idx];
                if (op === 0) {
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

    ////////////////////////////////////////////
    // Z80State
    ////////////////////////////////////////////
    function Z80State() {
        this.init();
    }

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
    Z80State.prototype.getPC = function(offset) {
        if (offset) return (this._PC + offset) & 0xFFFF;
        return this._PC;
    };
    Z80State.prototype.setPC = function(val) {
        this._PC = val & 0xFFFF;
    };
    Z80State.prototype.getSP = function() {
        return this._SP;
    };
    Z80State.prototype.setSP = function(val) {
        this._SP = val & 0xFFFF;
    };
    Z80State.prototype.getIX = function(offset) {
        if (offset) return (this._IX + offset) & 0xFFFF;
        return this._IX;
    };
    Z80State.prototype.setIX = function(val) {
        this._IX = val & 0xFFFF;
    };
    Z80State.prototype.getIY = function(offset) {
        if (offset) return (this._IY + offset) & 0xFFFF;
        return this._IY;
    };
    Z80State.prototype.setIY = function(val) {
        this._IY = val & 0xFFFF;
    };

    var F_S = 0x80; // sign
    var F_Z = 0x40; // zero
    var F_5 = 0x20; // ???
    var F_H = 0x10; // half-carry
    var F_3 = 0x08; // ???
    var F_PV = 0x04; // parity or overflow
    var F_N = 0x02; // add/subtract
    var F_C = 0x01; // carry

    Z80State.prototype.setF = function() {
        for (var i = 0; i < arguments.length; i += 2) {
            if (arguments[i + 1]) this.F |= arguments[i];
            else this.F &= (~arguments[i] & 0xFF);
        }
    };
    Z80State.prototype.updateF = function(flagMap) {
        var fLookUp = {F_S: 0x80,F_Z: 0x40,F_5: 0x20,F_H: 0x10,F_3: 0x08,
            F_PV: 0x04, F_N: 0x02, F_C: 0x01};
        var FBit, k;
        for (k in flagMap) {
            if (k == "val") continue;
            FBit = fLookUp[k];
            if (flagMap[k]) this.F |= FBit;
            else this.F &= (~FBit & 0xFF);
        }
    };

    Z80State.prototype.getF = function(flag) {
        return (this.F & flag) !== 0;
    }
    
    function toS8(val) {
        if (val & 0x80) return -1 * (0x80 - (val & 0x7f));
        return val;
    }

    function add16(val1, val2, Cin) {
        var res, res16, Cout;
        if (Cin === undefined) Cin = 0;
        res = val1 + val2 + Cin;
        res16 = res & 0xFFFF;
        Cout = (res > 0xFFFF); // carry out

        Cin = res16 ^ val1 ^ val2; // overflows

        return {
            val: res16,
            F_S: (res16 & 0x8000) !== 0,
            F_Z: res16 === 0,
            F_H: ((Cin >>> 11) & 1) !== 0,
            F_PV: ((Cin >>> 15) ^ Cout) !== 0,
            F_N: false,
            F_C: res > 0xFFFF
        };
    }

    function sub16(val1, val2, Cin) {
        var res;
        // negate Cin (undefined too)
        if (!Cin) Cin = 1;
        else Cin = 0;
        res = add16(val1, (~val2) & 0xFFFF, Cin);
        res.F_C = !res.F_C;
        res.F_N = true;
        return res;
    }

    function add8(val1, val2, Cin) {
        var res, res8, Cout;
        if (Cin === undefined) Cin = 0;
        res = val1 + val2 + Cin;
        res8 = res & 0xff;
        Cout = (res > 0xff); // carry out

        Cin = res8 ^ val1 ^ val2; // overflows

        return {
            val: res8,
            F_S: (res8 & 0x80) !== 0,
            F_Z: res8 === 0,
            F_H: ((Cin >>> 4) & 1) !== 0,
            F_PV: ((Cin >>> 7) ^ Cout) !== 0,
            F_N: false,
            F_C: res > 0xFF
        };
    }

    function sub8(val1, val2, Cin) {
        var res;
        // negate Cin (undefined too)
        if (!Cin) Cin = 1;
        else Cin = 0;
        res = add8(val1, (~val2) & 0xFF, Cin);
        res.F_C = !res.F_C;
        res.F_N = true;
        return res;
    }

    function shlc8(val, Cin) {  // copy into C
        var Cout = (val & 0x80) >> 7;
        var res = ((val << 1) | Cout) & 0xFF;
        return {
            val: res,
            F_S: (res & 0x80) == 0x80,
            F_Z: res === 0,
            F_H: false,
            F_PV: !(res & 1),
            F_N: false,
            F_C: Cout
        };
        
    }
    function shl8(val, Cin) {   // shift through C
        var Cout = (val & 0x80) >> 7;
        var res = ((val << 1) | Cin) & 0xFF;
        return {
            val: res,
            F_S: (res & 0x80) == 0x80,
            F_Z: res === 0,
            F_H: false,
            F_PV: !(res & 1),
            F_N: false,
            F_C: Cout
        };
    }
    function shrc8(val, Cin) {  // copy into C
        var Cout = val & 1;
        var res = ((val >>> 1) | (Cout << 7)) & 0xFF;
        return {
            val: res,
            F_S: (res & 0x80) == 0x80,
            F_Z: res === 0,
            F_H: false,
            F_PV: !(res & 1),
            F_N: false,
            F_C: Cout
        };
    }
    function shr8(val, Cin) {   // shift through C
        var Cout = val & 1;
        var res = ((val >>> 1) | (Cin << 7)) & 0xFF;
        return {
            val: res,
            F_S: (res & 0x80) == 0x80,
            F_Z: res === 0,
            F_H: false,
            F_PV: !(res & 1),
            F_N: false,
            F_C: Cout
        };
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
        this._SP = 0xFFFF;
        this._PC = 0x0000;

        this._IX = 0xFFFF;
        this._IY = 0xFFFF;

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
        this._PC = 0;
        this.R = 0;
        this.I = 0;
        this.im = 0;
    };

    ////////////////////////////////////////////
    // Z80
    ////////////////////////////////////////////
    function Z80(mmu, port_writer, port_reader) {
        this._mmu = mmu;
        this._out = port_writer;
        this._in = port_reader;
        this._s = new Z80State();
        this._op_t = 0;
        this._op_m = 0;
    }

    Z80.prototype.push16 = function(val) {
        var SP = this._s.getSP() - 1;
        this._mmu.w8(SP, (val >>> 8) & 0xFF);
        SP--;
        this._mmu.w8(SP, val & 0xFF);
        this._s.setSP(SP);
    };

    Z80.prototype.pop16 = function() {
        var SP = this._s.getSP();
        var val = this._mmu.r8(SP);
        SP++;
        val |= (this._mmu.r8(SP) << 8);
        this._s.setSP(SP + 1);
        return val;
    };

    Z80.prototype._opcodes = {

        0x00: function() { // NOP
            this._op_t = 4;
            this._op_m = 1;
        },
        0x01: function() { // LD BC,nn
            this._op_t = 10;
            this._op_m = 3;
            this._s.setBC(this._mmu.r16(this._s.getPC(1)));
        },
        0x02: function() { // LD (BC),A
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x03: function() { // INC BC
            this._op_t = 6;
            this._op_m = 1;
            this._s.setBC(this._s.getBC() + 1);
        },
        0x04: function() { // INC B
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.B, 1);
            this._s.B = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x05: function() { // DEC B
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.B, 1);
            this._s.B = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x06: function() { // LD B,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.B = this._mmu.r8(this._s.getPC(1));
        },
        0x07: function() { // RLCA
            this._op_t = 4;
            this._op_m = 1;
            var res = shlc8(this._s.A, this._s.getF(F_C));
            this._s.A = res.val;
            this._s.setF(F_H, false, F_N, false, F_C, res.F_C);
        },
        0x08: function() { // EX AF,AF’
            this._op_t = 4;
            this._op_m = 1;
            var af = this._s.getAF();
            this._s.setAF(this._s.AFa);
            this._s.AFa = af;
        },
        0x09: function() { // ADD HL,BC
            this._op_t = 11;
            this._op_m = 1;
            var res = add16(this._s.getHL(), this._s.getBC());
            this._s.setHL(res.val);
            this._s.setF(F_H, res.F_H, F_N, false, F_C, res.F_C);
        },
        0x0A: function() { // LD A,(BC)
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x0B: function() { // DEC BC
            this._op_t = 6;
            this._op_m = 1;
            this._s.setBC(this._s.getBC()-1);
        },
        0x0C: function() { // INC C
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.C, 1);
            this._s.C = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x0D: function() { // DEC C
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.C, 1);
            this._s.C = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x0E: function() { // LD C,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.C = this._mmu.r8(this._s.getPC(1));
        },
        0x0F: function() { // RRCA
            this._op_t = 4;
            this._op_m = 1;
            var res = shrc8(this._s.A, this._s.getF(F_C));
            this._s.A = res.val;
            this._s.setF(F_H, false, F_N, false, F_C, res.F_C);
        },
        0x10: function() { // DJNZ (PC+e)
            var offset;
            var res = sub8(this._s.B, 1);
            this._s.B = res.val;
            if (res.F_Z) {
                this._op_t = 8;
                this._op_m = 2;
            }
            else
            {
                this._op_t = 13;
                this._op_m = 0;
                offset = toS8(this._mmu.r8(this._s.getPC(1)));
                this._s.setPC(this._s.getPC(2+offset));
            }
        },
        0x11: function() { // LD DE,nn
            this._op_t = 10;
            this._op_m = 3;
            this._s.setDE(this._mmu.r16(this._s.getPC(1)));
        },
        0x12: function() { // LD (DE),A
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x13: function() { // INC DE
            this._op_t = 6;
            this._op_m = 1;
            this._s.setDE(this._s.getDE() + 1);
        },
        0x14: function() { // INC D
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.D, 1);
            this._s.D = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x15: function() { // DEC D
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.D, 1);
            this._s.D = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x16: function() { // LD D,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.D = this._mmu.r8(this._s.getPC(1));
        },
        0x17: function() { // RLA
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x18: function() { // JR (PC+e)
            this._op_t = 12;
            this._op_m = 0;
            offset = 2 + toS8(this._mmu.r8(this._s.getPC(1)));
            this._s.setPC(this._s.getPC(offset));
        },
        0x19: function() { // ADD HL,DE
            this._op_t = 11;
            this._op_m = 1;
            var res = add16(this._s.getHL(), this._s.getDE());
            this._s.setHL(res.val);
            this._s.setF(F_H, res.F_H, F_N, false, F_C, res.F_C);
        },
        0x1A: function() { // LD A,(DE)
            this._op_t = 7;
            this._op_m = 1;
            this._s.A = this._mmu.r8(this._s.getDE());
        },
        0x1B: function() { // DEC DE
            this._op_t = 6;
            this._op_m = 1;
            this._s.setDE(this._s.getDE()-1);
        },
        0x1C: function() { // INC E
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.E, 1);
            this._s.E = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x1D: function() { // DEC E
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.E, 1);
            this._s.E = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x1E: function() { // LD E,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.E = this._mmu.r8(this._s.getPC(1));
        },
        0x1F: function() { // RRA
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x20: function() { // JR NZ,(PC+e)
            var e;
            if (this._s.F & F_Z) {
                this._op_t = 7;
                this._op_m = 2;
            }
            else {
                this._op_t = 12;
                this._op_m = 0;
                e = this._mmu.r8(this._s.getPC(1));
                this._s.setPC(this._s.getPC(toS8(e) + 2));
            }
        },
        0x21: function() { // LD HL,nn
            this._op_t = 10;
            this._op_m = 3;
            this._s.setHL(this._mmu.r16(this._s.getPC(1)));
        },
        0x22: function() { // LD (nn),HL
            this._op_t = 16;
            this._op_m = 3;
            var addr = this._mmu.r16(this._s.getPC(1));
            this._mmu.w16(addr, this._s.getHL());
        },
        0x23: function() { // INC HL
            this._op_t = 6;
            this._op_m = 1;
            this._s.setHL(this._s.getHL() + 1);
        },
        0x24: function() { // INC H
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.H, 1);
            this._s.H = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x25: function() { // DEC H
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.H, 1);
            this._s.H = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x26: function() { // LD H,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.H = this._mmu.r8(this._s.getPC(1));
        },
        0x27: function() { // DAA
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x28: function() { // JR Z,(PC+e)
            var offset;
            if (this._s.F & F_Z) {
                this._op_t = 12;
                this._op_m = 0;
                offset = 2 + toS8(this._mmu.r8(this._s.getPC(1)));
                this._s.setPC(this._s.getPC(offset));
            }
            else {
                this._op_t = 7;
                this._op_m = 2;
            }
        },
        0x29: function() { // ADD HL,HL
            this._op_t = 11;
            this._op_m = 1;
            var res = add16(this._s.getHL(), this._s.getHL());
            this._s.setHL(res.val);
            this._s.setF(F_H, res.F_H, F_N, false, F_C, res.F_C);
        },
        0x2A: function() { // LD HL,(nn)
            this._op_t = 16;
            this._op_m = 5;
            throw ("not implemented");
        },
        0x2B: function() { // DEC HL
            this._op_t = 6;
            this._op_m = 1;
            this._s.setHL(this._s.getHL()-1);
        },
        0x2C: function() { // INC L
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.L, 1);
            this._s.L = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x2D: function() { // DEC L
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.L, 1);
            this._s.L = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x2E: function() { // LD L,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.L = this._mmu.r8(this._s.getPC(1));
        },
        0x2F: function() { // CPL
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x30: function() { // JR NC,(PC+e)
            var offset;
            if (this._s.F & F_C) {
                this._op_t = 7;
                this._op_m = 2;
            }
            else {
                this._op_t = 12;
                this._op_m = 0;
                offset = 2 + toS8(this._mmu.r8(this._s.getPC(1)));
                this._s.setPC(this._s.getPC(offset));
            }
        },
        0x31: function() { // LD SP,nn
            this._op_t = 10;
            this._op_m = 3;
            this._s.setSP(this._mmu.r16(this._s.getPC(1)));
        },
        0x32: function() { // LD (nn),A
            this._op_t = 13;
            this._op_m = 3;
            var addr = this._mmu.r16(this._s.getPC(1));
            this._mmu.w8(addr, this._s.A);
        },
        0x33: function() { // INC SP
            this._op_t = 6;
            this._op_m = 1;
            this._s.setSP(this._s.getSP() + 1);
        },
        0x34: function() { // INC (HL)
            this._op_t = 11;
            this._op_m = 1;
            var HL = this._s.getHL();
            var res = add8(this._mmu.r8(HL), 1);
            this._mmu.w8(HL, res.val);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x35: function() { // DEC (HL)
            this._op_t = 11;
            this._op_m = 1;
            var HL = this._s.getHL();
            var res = sub8(this._mmu.r8(HL), 1);
            this._mmu.w8(HL, res.val);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x36: function() { // LD (HL),n
            this._op_t = 10;
            this._op_m = 2;
            var val = this._mmu.r8(this._s.getPC(1));
            console.log("HL: " + toHex16(this._s.getHL()));
            this._mmu.w8(this._s.getHL(), val);
        },
        0x37: function() { // SCF
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x38: function() { // JR C,(PC+e)
            var offset;
            if (this._s.F & F_C) {
                this._op_t = 12;
                this._op_m = 0;
                offset = 2 + toS8(this._mmu.r8(this._s.getPC(1)));
                this._s.setPC(this._s.getPC(offset));
            }
            else {
                this._op_t = 7;
                this._op_m = 2;
            }

        },
        0x39: function() { // ADD HL,SP
            this._op_t = 11;
            this._op_m = 1;
            var res = add16(this._s.getHL(), this._s.getSP());
            this._s.setHL(res.val);
            this._s.setF(F_H, res.F_H, F_N, false, F_C, res.F_C);
        },
        0x3A: function() { // LD A,(nn)
            this._op_t = 13;
            this._op_m = 3;
            var addr = this._mmu.r16(this._s.getPC(1));
            this._s.A = this._mmu.r8(addr);
        },
        0x3B: function() { // DEC SP
            this._op_t = 6;
            this._op_m = 1;
            this._s.setSP(this._s.getSP()-1);
        },
        0x3C: function() { // INC A
            this._op_t = 4;
            this._op_m = 1;
            var res = add8(this._s.A, 1);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, false);
        },
        0x3D: function() { // DEC A
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, 1);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true);
        },
        0x3E: function() { // LD A,n
            this._op_t = 7;
            this._op_m = 2;
            this._s.A = this._mmu.r8(this._s.getPC(1));
        },
        0x3F: function() { // CCF
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x40: function() { // LD B,B
            this._op_t = 4;
            this._op_m = 1;
        },
        0x41: function() { // LD B,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.C;
        },
        0x42: function() { // LD B,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.D;
        },
        0x43: function() { // LD B,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.E;
        },
        0x44: function() { // LD B,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.H;
        },
        0x45: function() { // LD B,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.L;
        },
        0x46: function() { // LD B,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.B = this._mmu.r8(this._s.getHL());
        },
        0x47: function() { // LD B,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.B = this._s.A;
        },
        0x48: function() { // LD C,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.B;
        },
        0x49: function() { // LD C,C
            this._op_t = 4;
            this._op_m = 1;
        },
        0x4A: function() { // LD C,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.D;
        },
        0x4B: function() { // LD C,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.E;
        },
        0x4C: function() { // LD C,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.H;
        },
        0x4D: function() { // LD C,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.L;
        },
        0x4E: function() { // LD C,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.C = this._mmu.r8(this._s.getHL());
        },
        0x4F: function() { // LD C,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.C = this._s.A;
        },
        0x50: function() { // LD D,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.B;
        },
        0x51: function() { // LD D,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.C;
        },
        0x52: function() { // LD D,D
            this._op_t = 4;
            this._op_m = 1;
        },
        0x53: function() { // LD D,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.E;
        },
        0x54: function() { // LD D,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.H;
        },
        0x55: function() { // LD D,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.L;
        },
        0x56: function() { // LD D,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.D = this._mmu.r8(this._s.getHL());
        },
        0x57: function() { // LD D,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.D = this._s.A;
        },
        0x58: function() { // LD E,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.B;
        },
        0x59: function() { // LD E,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.C;
        },
        0x5A: function() { // LD E,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.D;
        },
        0x5B: function() { // LD E,E
            this._op_t = 4;
            this._op_m = 1;
        },
        0x5C: function() { // LD E,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.H;
        },
        0x5D: function() { // LD E,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.L;
        },
        0x5E: function() { // LD E,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.E = this._mmu.r8(this._s.getHL());
        },
        0x5F: function() { // LD E,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.E = this._s.A;
        },
        0x60: function() { // LD H,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.B;
        },
        0x61: function() { // LD H,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.C;
        },
        0x62: function() { // LD H,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.D;
        },
        0x63: function() { // LD H,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.E;
        },
        0x64: function() { // LD H,H
            this._op_t = 4;
            this._op_m = 1;
        },
        0x65: function() { // LD H,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.L;
        },
        0x66: function() { // LD H,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.H = this._mmu.r8(this._s.getHL());
        },
        0x67: function() { // LD H,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.H = this._s.A;
        },
        0x68: function() { // LD L,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.B;
        },
        0x69: function() { // LD L,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.C;
        },
        0x6A: function() { // LD L,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.D;
        },
        0x6B: function() { // LD L,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.E;
        },
        0x6C: function() { // LD L,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.H;
        },
        0x6D: function() { // LD L,L
            this._op_t = 4;
            this._op_m = 1;
        },
        0x6E: function() { // LD L,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.L = this._mmu.r8(this._s.getHL());
        },
        0x6F: function() { // LD L,A
            this._op_t = 4;
            this._op_m = 1;
            this._s.L = this._s.A;
        },
        0x70: function() { // LD (HL),B
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.B);
        },
        0x71: function() { // LD (HL),C
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.C);
        },
        0x72: function() { // LD (HL),D
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.D);
        },
        0x73: function() { // LD (HL),E
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.E);
        },
        0x74: function() { // LD (HL),H
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.H);
        },
        0x75: function() { // LD (HL),L
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.L);
        },
        0x76: function() { // HALT
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x77: function() { // LD (HL),A
            this._op_t = 7;
            this._op_m = 1;
            this._mmu.w8(this._s.getHL(), this._s.A);
        },
        0x78: function() { // LD A,B
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.B;
        },
        0x79: function() { // LD A,C
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.C;
        },
        0x7A: function() { // LD A,D
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.D;
        },
        0x7B: function() { // LD A,E
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.E;
        },
        0x7C: function() { // LD A,H
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.H;
        },
        0x7D: function() { // LD A,L
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = this._s.L;
        },
        0x7E: function() { // LD A,(HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.A = this._mmu.r8(this._s.getHL());
        },
        0x7F: function() { // LD A,A
            this._op_t = 4;
            this._op_m = 1;
        },
        0x80: function() { // ADD A,B
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x81: function() { // ADD A,C
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x82: function() { // ADD A,D
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x83: function() { // ADD A,E
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x84: function() { // ADD A,H
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x85: function() { // ADD A,L
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x86: function() { // ADD A,(HL)
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x87: function() { // ADD A,A
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x88: function() { // ADC A,B
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x89: function() { // ADC A,C
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x8A: function() { // ADC A,D
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x8B: function() { // ADC A,E
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x8C: function() { // ADC A,H
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x8D: function() { // ADC A,L
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x8E: function() { // ADC A,(HL)
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x8F: function() { // ADC A,A
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x90: function() { // SUB B
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.B);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x91: function() { // SUB C
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.C);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x92: function() { // SUB D
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.D);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x93: function() { // SUB E
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.E);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x94: function() { // SUB H
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.H);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x95: function() { // SUB L
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.L);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x96: function() { // SUB (HL)
            this._op_t = 7;
            this._op_m = 1;
            var rhs = this._mmu.r8(this._s.getHL());
            var res = sub8(this._s.A, rhs);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x97: function() { // SUB A
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.A);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0x98: function() { // SBC A,B
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x99: function() { // SBC A,C
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x9A: function() { // SBC A,D
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x9B: function() { // SBC A,E
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x9C: function() { // SBC A,H
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x9D: function() { // SBC A,L
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0x9E: function() { // SBC A,(HL)
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0x9F: function() { // SBC A,A
            this._op_t = 4;
            this._op_m = 1;
            throw ("not implemented");
        },
        0xA0: function() { // AND B
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.B) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA1: function() { // AND C
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.C) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA2: function() { // AND D
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.D) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA3: function() { // AND E
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.E) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA4: function() { // AND H
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.H) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA5: function() { // AND L
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.L) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA6: function() { // AND (HL)
            this._op_t = 7;
            this._op_m = 1;
            var rhs = this._mmu.r8(this._s.getHL());
            this._s.A = (this._s.A & rhs) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA7: function() { // AND A
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A & this._s.A) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, true,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xA8: function() { // XOR B
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.B) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xA9: function() { // XOR C
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.C) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAA: function() { // XOR D
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.D) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAB: function() { // XOR E
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.E) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAC: function() { // XOR H
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.H) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAD: function() { // XOR L
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._s.L) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAE: function() { // XOR (HL)
            this._op_t = 7;
            this._op_m = 1;
            this._s.A = (this._s.A ^ this._mmu.r8(this._s.getHL())) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xAF: function() { // XOR A
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = 0;
            this._s.setF(
            F_S, false,
            F_Z, true,
            F_H, false,
            F_PV, true,
            F_N, false,
            F_C, false);
        },
        0xB0: function() { // OR B
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.B) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB1: function() { // OR C
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.C) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB2: function() { // OR D
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.D) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB3: function() { // OR E
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.E) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB4: function() { // OR H
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.H) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB5: function() { // OR L
            this._op_t = 4;
            this._op_m = 1;
            this._s.A = (this._s.A | this._s.L) & 0xFF;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB6: function() { // OR (HL)
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xB7: function() { // OR A
            this._op_t = 4;
            this._op_m = 1;
            this._s.setF(
                F_S, (this._s.A & 0x80) !== 0,
                F_Z, this._s.A === 0,
                F_H, false,
                F_PV, (this._s.A & 0x01) === 0,
                F_N, false,
                F_C, false);
        },
        0xB8: function() { // CP B
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.B);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xB9: function() { // CP C
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.C);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBA: function() { // CP D
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.D);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBB: function() { // CP E
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.E);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBC: function() { // CP H
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.H);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBD: function() { // CP L
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.L);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBE: function() { // CP (HL)
            this._op_t = 7;
            this._op_m = 1;
            var rhs = this._mmu.r8(this._s.getHL());
            var res = sub8(this._s.A, rhs);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xBF: function() { // CP A
            this._op_t = 4;
            this._op_m = 1;
            var res = sub8(this._s.A, this._s.A);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xC0: function() { // RET NZ
            if (this._s.F & F_Z) {
                this._op_t = 5;
                this._op_m = 1;
            }
            else {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
        },
        0xC1: function() { // POP BC
            this._op_t = 10;
            this._op_m = 1;
            this._s.setBC(this.pop16());
        },
        0xC2: function() { // JP NZ,(nn)
            this._op_t = 10;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xC3: function() { // JP (nn)
            this._op_t = 10;
            this._op_m = 0;
            this._s.setPC(this._mmu.r16(this._s.getPC(1)));
        },
        0xC4: function() { // CALL NZ,(nn)
            if (this._s.F & F_Z) {
                this._op_t = 10;
                this._op_m = 3;
            }
            else {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
        },
        0xC5: function() { // PUSH BC
            this._op_t = 11;
            this._op_m = 1;
            this.push16(this._s.getBC());
        },
        0xC6: function() { // ADD A,n
            this._op_t = 7;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xC7: function() { // RST 0H
            this._op_t = 11;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xC8: function() { // RET Z
            if (this._s.F & F_Z) {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
            else {
                this._op_t = 5;
                this._op_m = 1;
            }
        },
        0xC9: function() { // RET
            this._op_t = 10;
            this._op_m = 0;
            this._s.setPC(this.pop16());
        },
        0xCA: function() { // JP Z,(nn)
            this._op_t = 10;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB: function() { // CB
            throw ("invalid call");
        },
        0xCB00: function() { // RLC B
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.B, this._s.getf(F_C));
            this._s.B = res.val;
            this._s.updateF(res);
        },
        0xCB01: function() { // RLC C
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.C, this._s.getf(F_C));
            this._s.C = res.val;
            this._s.updateF(res);
        },
        0xCB02: function() { // RLC D
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.D, this._s.getf(F_C));
            this._s.D = res.val;
            this._s.updateF(res);
        },
        0xCB03: function() { // RLC E
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.E, this._s.getf(F_C));
            this._s.E = res.val;
            this._s.updateF(res);
        },
        0xCB04: function() { // RLC H
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.H, this._s.getf(F_C));
            this._s.H = res.val;
            this._s.updateF(res);
        },
        0xCB05: function() { // RLC L
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.L, this._s.getf(F_C));
            this._s.L = res.val;
            this._s.updateF(res);
        },
        0xCB06: function() { // RLC (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB07: function() { // RLC A
            this._op_t = 8;
            this._op_m = 2;
            var res = shlc8(this._s.A, this._s.getf(F_C));
            this._s.A = res.val;
            this._s.updateF(res);
        },
        0xCB08: function() { // RRC B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB09: function() { // RRC C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB0A: function() { // RRC D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB0B: function() { // RRC E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB0C: function() { // RRC H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB0D: function() { // RRC L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB0E: function() { // RRC (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB0F: function() { // RRC A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB10: function() { // RL B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB11: function() { // RL C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB12: function() { // RL D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB13: function() { // RL E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB14: function() { // RL H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB15: function() { // RL L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB16: function() { // RL (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB17: function() { // RL A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB18: function() { // RR B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB19: function() { // RR C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB1A: function() { // RR D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB1B: function() { // RR E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB1C: function() { // RR H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB1D: function() { // RR L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB1E: function() { // RR (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB1F: function() { // RR A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB20: function() { // SLA B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB21: function() { // SLA C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB22: function() { // SLA D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB23: function() { // SLA E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB24: function() { // SLA H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB25: function() { // SLA L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB26: function() { // SLA (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB27: function() { // SLA A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB28: function() { // SRA B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB29: function() { // SRA C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB2A: function() { // SRA D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB2B: function() { // SRA E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB2C: function() { // SRA H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB2D: function() { // SRA L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB2E: function() { // SRA (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB2F: function() { // SRA A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB30: function() { // SLL B*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB31: function() { // SLL C*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB32: function() { // SLL D*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB33: function() { // SLL E*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB34: function() { // SLL H*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB35: function() { // SLL L*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB36: function() { // SLL (HL)*
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB37: function() { // SLL A*
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB38: function() { // SRL B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB39: function() { // SRL C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB3A: function() { // SRL D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB3B: function() { // SRL E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB3C: function() { // SRL H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB3D: function() { // SRL L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB3E: function() { // SRL (HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB3F: function() { // SRL A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB40: function() { // BIT 0,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB41: function() { // BIT 0,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB42: function() { // BIT 0,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB43: function() { // BIT 0,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB44: function() { // BIT 0,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB45: function() { // BIT 0,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB46: function() { // BIT 0,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB47: function() { // BIT 0,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB48: function() { // BIT 1,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB49: function() { // BIT 1,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB4A: function() { // BIT 1,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB4B: function() { // BIT 1,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB4C: function() { // BIT 1,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB4D: function() { // BIT 1,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB4E: function() { // BIT 1,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB4F: function() { // BIT 1,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB50: function() { // BIT 2,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB51: function() { // BIT 2,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB52: function() { // BIT 2,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB53: function() { // BIT 2,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB54: function() { // BIT 2,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB55: function() { // BIT 2,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB56: function() { // BIT 2,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB57: function() { // BIT 2,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB58: function() { // BIT 3,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB59: function() { // BIT 3,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB5A: function() { // BIT 3,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB5B: function() { // BIT 3,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB5C: function() { // BIT 3,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB5D: function() { // BIT 3,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB5E: function() { // BIT 3,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB5F: function() { // BIT 3,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB60: function() { // BIT 4,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB61: function() { // BIT 4,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB62: function() { // BIT 4,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB63: function() { // BIT 4,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB64: function() { // BIT 4,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB65: function() { // BIT 4,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB66: function() { // BIT 4,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB67: function() { // BIT 4,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB68: function() { // BIT 5,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB69: function() { // BIT 5,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB6A: function() { // BIT 5,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB6B: function() { // BIT 5,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB6C: function() { // BIT 5,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB6D: function() { // BIT 5,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB6E: function() { // BIT 5,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB6F: function() { // BIT 5,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB70: function() { // BIT 6,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB71: function() { // BIT 6,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB72: function() { // BIT 6,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB73: function() { // BIT 6,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB74: function() { // BIT 6,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB75: function() { // BIT 6,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB76: function() { // BIT 6,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB77: function() { // BIT 6,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB78: function() { // BIT 7,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB79: function() { // BIT 7,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB7A: function() { // BIT 7,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB7B: function() { // BIT 7,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB7C: function() { // BIT 7,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB7D: function() { // BIT 7,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB7E: function() { // BIT 7,(HL)
            this._op_t = 12;
            this._op_m = 3;
            throw ("not implemented");
        },
        0xCB7F: function() { // BIT 7,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB80: function() { // RES 0,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB81: function() { // RES 0,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB82: function() { // RES 0,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB83: function() { // RES 0,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB84: function() { // RES 0,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB85: function() { // RES 0,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB86: function() { // RES 0,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB87: function() { // RES 0,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB88: function() { // RES 1,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB89: function() { // RES 1,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB8A: function() { // RES 1,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB8B: function() { // RES 1,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB8C: function() { // RES 1,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB8D: function() { // RES 1,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB8E: function() { // RES 1,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB8F: function() { // RES 1,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB90: function() { // RES 2,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB91: function() { // RES 2,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB92: function() { // RES 2,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB93: function() { // RES 2,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB94: function() { // RES 2,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB95: function() { // RES 2,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB96: function() { // RES 2,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB97: function() { // RES 2,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB98: function() { // RES 3,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB99: function() { // RES 3,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB9A: function() { // RES 3,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB9B: function() { // RES 3,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB9C: function() { // RES 3,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB9D: function() { // RES 3,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCB9E: function() { // RES 3,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCB9F: function() { // RES 3,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA0: function() { // RES 4,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA1: function() { // RES 4,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA2: function() { // RES 4,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA3: function() { // RES 4,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA4: function() { // RES 4,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA5: function() { // RES 4,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA6: function() { // RES 4,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBA7: function() { // RES 4,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA8: function() { // RES 5,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBA9: function() { // RES 5,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBAA: function() { // RES 5,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBAB: function() { // RES 5,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBAC: function() { // RES 5,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBAD: function() { // RES 5,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBAE: function() { // RES 5,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBAF: function() { // RES 5,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB0: function() { // RES 6,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB1: function() { // RES 6,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB2: function() { // RES 6,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB3: function() { // RES 6,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB4: function() { // RES 6,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB5: function() { // RES 6,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB6: function() { // RES 6,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBB7: function() { // RES 6,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB8: function() { // RES 7,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBB9: function() { // RES 7,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBBA: function() { // RES 7,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBBB: function() { // RES 7,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBBC: function() { // RES 7,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBBD: function() { // RES 7,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBBE: function() { // RES 7,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBBF: function() { // RES 7,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC0: function() { // SET 0,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC1: function() { // SET 0,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC2: function() { // SET 0,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC3: function() { // SET 0,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC4: function() { // SET 0,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC5: function() { // SET 0,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC6: function() { // SET 0,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBC7: function() { // SET 0,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC8: function() { // SET 1,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBC9: function() { // SET 1,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBCA: function() { // SET 1,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBCB: function() { // SET 1,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBCC: function() { // SET 1,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBCD: function() { // SET 1,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBCE: function() { // SET 1,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBCF: function() { // SET 1,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD0: function() { // SET 2,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD1: function() { // SET 2,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD2: function() { // SET 2,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD3: function() { // SET 2,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD4: function() { // SET 2,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD5: function() { // SET 2,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD6: function() { // SET 2,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBD7: function() { // SET 2,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD8: function() { // SET 3,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBD9: function() { // SET 3,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBDA: function() { // SET 3,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBDB: function() { // SET 3,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBDC: function() { // SET 3,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBDD: function() { // SET 3,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBDE: function() { // SET 3,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBDF: function() { // SET 3,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE0: function() { // SET 4,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE1: function() { // SET 4,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE2: function() { // SET 4,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE3: function() { // SET 4,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE4: function() { // SET 4,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE5: function() { // SET 4,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE6: function() { // SET 4,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBE7: function() { // SET 4,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE8: function() { // SET 5,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBE9: function() { // SET 5,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBEA: function() { // SET 5,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBEB: function() { // SET 5,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBEC: function() { // SET 5,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBED: function() { // SET 5,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBEE: function() { // SET 5,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBEF: function() { // SET 5,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF0: function() { // SET 6,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF1: function() { // SET 6,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF2: function() { // SET 6,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF3: function() { // SET 6,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF4: function() { // SET 6,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF5: function() { // SET 6,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF6: function() { // SET 6,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBF7: function() { // SET 6,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF8: function() { // SET 7,B
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBF9: function() { // SET 7,C
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBFA: function() { // SET 7,D
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBFB: function() { // SET 7,E
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBFC: function() { // SET 7,H
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBFD: function() { // SET 7,L
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCBFE: function() { // SET 7,(HL)
            this._op_t = 15;
            this._op_m = 4;
            throw ("not implemented");
        },
        0xCBFF: function() { // SET 7,A
            this._op_t = 8;
            this._op_m = 2;
            throw ("not implemented");
        },
        0xCC: function() { // CALL	Z,nn
            if (this._s.F & F_Z) {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
            else {
                this._op_t = 10;
                this._op_m = 3;
            }
        },
        0xCD: function() { // CALL	nn
            this._op_t = 17;
            this._op_m = 0;
            this.push16(this._s.getPC(3));
            var addr = this._mmu.r16(this._s.getPC(1));
            this._s.setPC(addr);
        },
        0xCE: function() { // ADC	A,n
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xCF: function() { // RST	08H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xD0: function() { // RET	NC
            if (this._s.F & F_C) {
                this._op_t = 5;
                this._op_m = 1;
            }
            else {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
        },
        0xD1: function() { // POP	DE
            this._op_t = 10;
            this._op_m = 1;
            this._s.setDE(this.pop16());
        },
        0xD2: function() { // JP	NC,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xD3: function() { // OUT	(n),A
            this._op_t = 11;
            this._op_m = 2;
            this._out(this._mmu.r8(this._s.getPC(1)), this._s.A);
        },
        0xD4: function() { // CALL	NC,nn
            if (this._s.F & F_C) {
                this._op_t = 10;
                this._op_m = 3;
            }
            else {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
        },
        0xD5: function() { // PUSH	DE
            this._op_t = 11;
            this._op_m = 1;
            this.push16(this._s.getDE());
        },
        0xD6: function() { // SUB	n
            this._op_t = 7;
            this._op_m = 2;
            var rhs = this._mmu.r8(this._s.getPC(1));
            var res = sub8(this._s.A, rhs);
            this._s.A = res.val;
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xD7: function() { // RST	10H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xD8: function() { // RET	C
            if (this._s.F & F_C) {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
            else {
                this._op_t = 5;
                this._op_m = 1;
            }
        },
        0xD9: function() { // EXX
            this._op_t = 4;
            this._op_m = 1;
            var BC = this._s.getBC(),
                DE = this._s.getDE(),
                HL = this._s.getHL();
            this._s.setBC(this._s.BCa);
            this._s.setDE(this._s.DEa);
            this._s.setHL(this._s.HLa);
            this._s.BCa = BC;
            this._s.DEa = DE;
            this._s.HLa = HL;
        },
        0xDA: function() { // JP	C,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDB: function() { // IN	A,(n)
            this._op_t = 11;
            this._op_m = 2;
            this._s.A = this._in(this._mmu.r8(this._s.getPC(1)));
        },
        0xDC: function() { // CALL	C,nn
            if (this._s.F & F_C) {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
            else {
                this._op_t = 10;
                this._op_m = 3;
            }
        },
        0xDD: function() { // DD
            throw ("Z80 DD");
        },
        0xDD09: function() { // ADD IX,BC
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD19: function() { // ADD IX,DE
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD21: function() { // LD IX,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD22: function() { // LD (nn),IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD23: function() { // INC IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD24: function() { // INC IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD25: function() { // DEC IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD26: function() { // LD IXH,n*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD29: function() { // ADD IX,IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD2A: function() { // LD IX,(nn)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD2B: function() { // DEC IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD2C: function() { // INC IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD2D: function() { // DEC IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD2E: function() { // LD IXL,n*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD34: function() { // INC (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD35: function() { // DEC (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD36: function() { // LD (IX+d),n
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD39: function() { // ADD IX,SP
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD44: function() { // LD B,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD45: function() { // LD B,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD46: function() { // LD B,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD4C: function() { // LD C,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD4D: function() { // LD C,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD4E: function() { // LD C,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD54: function() { // LD D,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD55: function() { // LD D,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD56: function() { // LD D,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD5C: function() { // LD E,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD5D: function() { // LD E,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD5E: function() { // LD E,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD60: function() { // LD IXH,B*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD61: function() { // LD IXH,C*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD62: function() { // LD IXH,D*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD63: function() { // LD IXH,E*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD64: function() { // LD IXH,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD65: function() { // LD IXH,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD66: function() { // LD H,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD67: function() { // LD IXH,A*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD68: function() { // LD IXL,B*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD69: function() { // LD IXL,C*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6A: function() { // LD IXL,D*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6B: function() { // LD IXL,E*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6C: function() { // LD IXL,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6D: function() { // LD IXL,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6E: function() { // LD L,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD6F: function() { // LD IXL,A*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD70: function() { // LD (IX+d),B
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD71: function() { // LD (IX+d),C
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD72: function() { // LD (IX+d),D
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD73: function() { // LD (IX+d),E
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD74: function() { // LD (IX+d),H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD75: function() { // LD (IX+d),L
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD77: function() { // LD (IX+d),A
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD7C: function() { // LD A,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD7D: function() { // LD A,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD7E: function() { // LD A,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD84: function() { // ADD A,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD85: function() { // ADD A,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD86: function() { // ADD A,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD8C: function() { // ADC A,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD8D: function() { // ADC A,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD8E: function() { // ADC A,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD94: function() { // SUB IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD95: function() { // SUB IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD96: function() { // SUB (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD9C: function() { // SBC A,IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD9D: function() { // SBC A,IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDD9E: function() { // SBC A,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDA4: function() { // AND IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDA5: function() { // AND IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDA6: function() { // AND (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDAC: function() { // XOR IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDAD: function() { // XOR IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDAE: function() { // XOR (IX+d)
            this._op_t = 19;
            this._op_m = 3;
            var addr = this._s.getIX(toS8(this._mmu.r8(this._s.getPC(2))));
            this._s.A = (this._s.A ^ this._mmu.r8(addr)) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xDDB4: function() { // OR IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDB5: function() { // OR IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDB6: function() { // OR (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDBC: function() { // CP IXH*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDBD: function() { // CP IXL*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDBE: function() { // CP (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB00: function() { // LD B,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB01: function() { // LD C,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB02: function() { // LD D,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB03: function() { // LD E,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB04: function() { // LD H,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB05: function() { // LD L,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB06: function() { // RLC (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB07: function() { // LD A,RLC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB08: function() { // LD B,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB09: function() { // LD C,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0A: function() { // LD D,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0B: function() { // LD E,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0C: function() { // LD H,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0D: function() { // LD L,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0E: function() { // RRC (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB0F: function() { // LD A,RRC (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB10: function() { // LD B,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB11: function() { // LD C,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB12: function() { // LD D,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB13: function() { // LD E,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB14: function() { // LD H,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB15: function() { // LD L,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB16: function() { // RL (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB17: function() { // LD A,RL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB18: function() { // LD B,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB19: function() { // LD C,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1A: function() { // LD D,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1B: function() { // LD E,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1C: function() { // LD H,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1D: function() { // LD L,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1E: function() { // RR (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB1F: function() { // LD A,RR (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB20: function() { // LD B,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB21: function() { // LD C,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB22: function() { // LD D,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB23: function() { // LD E,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB24: function() { // LD H,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB25: function() { // LD L,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB26: function() { // SLA (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB27: function() { // LD A,SLA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB28: function() { // LD B,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB29: function() { // LD C,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2A: function() { // LD D,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2B: function() { // LD E,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2C: function() { // LD H,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2D: function() { // LD L,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2E: function() { // SRA (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB2F: function() { // LD A,SRA (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB30: function() { // LD B,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB31: function() { // LD C,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB32: function() { // LD D,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB33: function() { // LD E,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB34: function() { // LD H,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB35: function() { // LD L,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB36: function() { // SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB37: function() { // LD A,SLL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB38: function() { // LD B,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB39: function() { // LD C,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3A: function() { // LD D,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3B: function() { // LD E,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3C: function() { // LD H,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3D: function() { // LD L,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3E: function() { // SRL (IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB3F: function() { // LD A,SRL (IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB40: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB41: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB42: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB43: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB44: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB45: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB46: function() { // BIT 0,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB47: function() { // BIT 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB48: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB49: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4A: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4B: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4C: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4D: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4E: function() { // BIT 1,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB4F: function() { // BIT 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB50: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB51: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB52: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB53: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB54: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB55: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB56: function() { // BIT 2,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB57: function() { // BIT 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB58: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB59: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5A: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5B: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5C: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5D: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5E: function() { // BIT 3,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB5F: function() { // BIT 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB60: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB61: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB62: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB63: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB64: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB65: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB66: function() { // BIT 4,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB67: function() { // BIT 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB68: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB69: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6A: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6B: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6C: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6D: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6E: function() { // BIT 5,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB6F: function() { // BIT 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB70: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB71: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB72: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB73: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB74: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB75: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB76: function() { // BIT 6,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB77: function() { // BIT 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB78: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB79: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7A: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7B: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7C: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7D: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7E: function() { // BIT 7,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB7F: function() { // BIT 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB80: function() { // LD B,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB81: function() { // LD C,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB82: function() { // LD D,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB83: function() { // LD E,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB84: function() { // LD H,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB85: function() { // LD L,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB86: function() { // RES 0,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB87: function() { // LD A,RES 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB88: function() { // LD B,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB89: function() { // LD C,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8A: function() { // LD D,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8B: function() { // LD E,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8C: function() { // LD H,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8D: function() { // LD L,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8E: function() { // RES 1,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB8F: function() { // LD A,RES 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB90: function() { // LD B,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB91: function() { // LD C,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB92: function() { // LD D,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB93: function() { // LD E,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB94: function() { // LD H,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB95: function() { // LD L,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB96: function() { // RES 2,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB97: function() { // LD A,RES 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB98: function() { // LD B,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB99: function() { // LD C,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9A: function() { // LD D,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9B: function() { // LD E,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9C: function() { // LD H,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9D: function() { // LD L,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9E: function() { // RES 3,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCB9F: function() { // LD A,RES 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA0: function() { // LD B,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA1: function() { // LD C,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA2: function() { // LD D,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA3: function() { // LD E,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA4: function() { // LD H,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA5: function() { // LD L,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA6: function() { // RES 4,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA7: function() { // LD A,RES 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA8: function() { // LD B,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBA9: function() { // LD C,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAA: function() { // LD D,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAB: function() { // LD E,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAC: function() { // LD H,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAD: function() { // LD L,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAE: function() { // RES 5,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBAF: function() { // LD A,RES 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB0: function() { // LD B,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB1: function() { // LD C,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB2: function() { // LD D,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB3: function() { // LD E,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB4: function() { // LD H,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB5: function() { // LD L,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB6: function() { // RES 6,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB7: function() { // LD A,RES 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB8: function() { // LD B,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBB9: function() { // LD C,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBA: function() { // LD D,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBB: function() { // LD E,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBC: function() { // LD H,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBD: function() { // LD L,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBE: function() { // RES 7,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBBF: function() { // LD A,RES 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC0: function() { // LD B,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC1: function() { // LD C,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC2: function() { // LD D,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC3: function() { // LD E,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC4: function() { // LD H,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC5: function() { // LD L,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC6: function() { // SET 0,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC7: function() { // LD A,SET 0,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC8: function() { // LD B,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBC9: function() { // LD C,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCA: function() { // LD D,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCB: function() { // LD E,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCC: function() { // LD H,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCD: function() { // LD L,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCE: function() { // SET 1,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBCF: function() { // LD A,SET 1,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD0: function() { // LD B,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD1: function() { // LD C,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD2: function() { // LD D,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD3: function() { // LD E,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD4: function() { // LD H,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD5: function() { // LD L,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD6: function() { // SET 2,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD7: function() { // LD A,SET 2,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD8: function() { // LD B,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBD9: function() { // LD C,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDA: function() { // LD D,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDB: function() { // LD E,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDC: function() { // LD H,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDD: function() { // LD L,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDE: function() { // SET 3,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBDF: function() { // LD A,SET 3,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE0: function() { // LD B,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE1: function() { // LD C,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE2: function() { // LD D,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE3: function() { // LD E,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE4: function() { // LD H,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE5: function() { // LD L,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE6: function() { // SET 4,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE7: function() { // LD A,SET 4,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE8: function() { // LD B,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBE9: function() { // LD C,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBEA: function() { // LD D,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBEB: function() { // LD E,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBEC: function() { // LD H,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBED: function() { // LD L,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBEE: function() { // SET 5,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBEF: function() { // LD A,SET 5,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF0: function() { // LD B,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF1: function() { // LD C,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF2: function() { // LD D,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF3: function() { // LD E,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF4: function() { // LD H,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF5: function() { // LD L,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF6: function() { // SET 6,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF7: function() { // LD A,SET 6,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF8: function() { // LD B,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBF9: function() { // LD C,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFA: function() { // LD D,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFB: function() { // LD E,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFC: function() { // LD H,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFD: function() { // LD L,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFE: function() { // SET 7,(IX+d)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDCBFF: function() { // LD A,SET 7,(IX+d)*
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDE1: function() { // POP IX
            this._op_t = 14;
            this._op_m = 2;
            this._s.setIX(this.pop16());
        },
        0xDDE3: function() { // EX (SP),IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDE5: function() { // PUSH IX
            this._op_t = 15;
            this._op_m = 2;
            this.push16(this._s.getIX());
        },
        0xDDE9: function() { // JP (IX)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDDF9: function() { // LD SP,IX
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDE: function() { // SBC	A,n
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xDF: function() { // RST	18H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xE0: function() { // RET	PO
            if (this._s.F & F_PV) {
                this._op_t = 5;
                this._op_m = 1;
            }
            else {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
        },
        0xE1: function() { // POP	HL
            this._op_t = 10;
            this._op_m = 1;
            this._s.setHL(this.pop16());
            console.log("POP HL: " + toHex16(this._s.getHL()));
        },
        0xE2: function() { // JP	PO,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xE3: function() { // EX	(SP),HL
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xE4: function() { // CALL PO,nn
            if (this._s.F & F_PV) {
                this._op_t = 10;
                this._op_m = 3;
            }
            else {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
        },
        0xE5: function() { // PUSH	HL
            this._op_t = 11;
            this._op_m = 1;
            console.log("PUSH HL: " + toHex16(this._s.getHL()));
            this.push16(this._s.getHL());
        },
        0xE6: function() { // AND	n
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xE7: function() { // RST	20H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xE8: function() { // RET	PE
            if (this._s.F & F_PV) {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
            else {
                this._op_t = 5;
                this._op_m = 1;
            }
        },
        0xE9: function() { // JP	(HL)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEA: function() { // JP	PE,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEB: function() { // EX	DE,HL
            this._op_t = 4;
            this._op_m = 1;
            var DE = this._s.getDE();
            this._s.setDE(this._s.getHL());
            this._s.setHL(DE);
        },
        0xEC: function() { // CALL	PE,nn
            if (this._s.F & F_PV) {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
            else {
                this._op_t = 10;
                this._op_m = 3;
            }
        },
        0xED: function() { // ED
            throw ("ED");
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
        0xED40: function() { // IN	B,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED41: function() { // OUT	(C),B
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.B);
        },
        0xED42: function() { // SBC	HL,BC
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED43: function() { // LD	(nn),BC
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED44: function() { // NEG
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED45: function() { // RETN
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED46: function() { // IM	0
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED47: function() { // LD	I,A
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED48: function() { // IN	C,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED49: function() { // OUT	(C),C
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.C);
        },
        0xED4A: function() { // ADC	HL,BC
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED4B: function() { // LD	BC,(nn)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED4C: function() { //
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED4D: function() { // RETI
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED4E: function() { //
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED4F: function() { // LD	R,A
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED50: function() { // IN	D,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED51: function() { // OUT	(C),D
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.D);
        },
        0xED52: function() { // SBC	HL,DE
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED53: function() { // LD	(nn),DE
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
        0xED56: function() { // IM	1
            this._op_t = 8;
            this._op_m = 2;
            this._s.im = 1;
        },
        0xED57: function() { // LD	A,I
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED58: function() { // IN	E,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED59: function() { // OUT	(C),E
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.E);
        },
        0xED5A: function() { // ADC	HL,DE
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED5B: function() { // LD	DE,(nn)
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
        0xED5E: function() { // IM	2
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED5F: function() { // LD	A,R
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED60: function() { // IN	H,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED61: function() { // OUT	(C),H
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.H);
        },
        0xED62: function() { // SBC	HL,HL
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
        0xED67: function() { // RRD
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED68: function() { // IN	L,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED69: function() { // OUT	(C),L
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.L);
        },
        0xED6A: function() { // ADC	HL,HL
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
        0xED6F: function() { // RLD
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
        0xED72: function() { // SBC	HL,SP
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED73: function() { // LD	(nn),SP
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
        0xED78: function() { // IN	A,(C)
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED79: function() { // OUT	(C),A
            this._op_t = 12;
            this._op_m = 2;
            this._out(this._s.C, this._s.A);
        },
        0xED7A: function() { // ADC	HL,SP
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xED7B: function() { // LD	SP,(nn)
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
        0xEDA0: function() { // LDI
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDA1: function() { // CPI
            this._op_t = 16;
            this._op_m = 2;
            var val = this._mmu.r8(this._s.getHL());
            var res = sub8(this._s.A, val);
            var bc = this._s.getBC();
            bc--;
            this._s.setBC(bc);
            this._s.setF(
            F_S, res.F_S,
            F_Z, res.F_Z,
            F_N, true,
            F_PV, (bc === 0));
        },
        0xEDA2: function() { // INI
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDA3: function() { // OUTI
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
        0xEDA8: function() { // LDD
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDA9: function() { // CPD
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDAA: function() { // IND
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDAB: function() { // OUTD
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
        0xEDB0: function() { // LDIR
            var DE = this._s.getDE(),
                HL = this._s.getHL(),
                BC = this._s.getBC();
            this._mmu.w8(DE, this._mmu.r8(HL));
            this._s.setDE(DE+1);
            this._s.setHL(HL+1);
            BC--;
            this._s.setBC(BC);
            this._s.setF(F_H, false, F_PV, false, F_N, false);
            if (BC === 0) {  // finish
                this._op_t = 16;
                this._op_m = 2;
            }
            else {
                this._op_t = 21;
                this._op_m = 0; // repeat this instruction
            }
        },
        0xEDB1: function() { // CPIR
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDB2: function() { // INIR
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDB3: function() { // OTIR
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
        0xEDB8: function() { // LDDR
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDB9: function() { // CPDR
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDBA: function() { // INDR
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xEDBB: function() { // OTDR
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
        0xEE: function() { // XOR	n
            this._op_t = 7;
            this._op_m = 2;
            var addr = this._s.getPC(1);
            this._s.A = (this._s.A ^ this._mmu.r8(addr)) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xEF: function() { // RST	28H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xF0: function() { // RET	P
            if (this._s.F & F_S) {
                this._op_t = 5;
                this._op_m = 1;
            }
            else {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
        },
        0xF1: function() { // POP	AF
            this._op_t = 10;
            this._op_m = 1;
            this._s.setAF(this.pop16());
        },
        0xF2: function() { // JP	P,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xF3: function() { // DI
            this._op_t = 4;
            this._op_m = 1;
            this._s.IFF1 = 0;
            this._s.IFF2 = 0;
        },
        0xF4: function() { // CALL	P,nn
            if (this._s.F & F_S) {
                this._op_t = 10;
                this._op_m = 3;
            }
            else {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
        },
        0xF5: function() { // PUSH	AF
            this._op_t = 11;
            this._op_m = 1;
            this.push16(this._s.getAF());
        },
        0xF6: function() { // OR	n
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xF7: function() { // RST	30H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xF8: function() { // RET	M
            if (this._s.F & F_S) {
                this._op_t = 11;
                this._op_m = 0;
                this._s.setPC(this.pop16());
            }
            else {
                this._op_t = 5;
                this._op_m = 1;
            }
        },
        0xF9: function() { // LD	SP,HL
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xFA: function() { // JP	M,nn
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xFB: function() { // EI
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        },
        0xFC: function() { // CALL	M,nn
            if (this._s.F & F_S) {
                this._op_t = 17;
                this._op_m = 0;
                this.push16(this._s.getPC(3));
                var addr = this._mmu.r16(this._s.getPC(1));
                this._s.setPC(addr);
            }
            else {
                this._op_t = 10;
                this._op_m = 3;
            }
        },
        0xFD: function() { // FD
            throw ("Z80 FD");
        },
        0xFD09: function() { // ADD IY,BC
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD19: function() { // ADD IY,DE
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD21: function() { // LD IY,nn
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD22: function() { // LD (nn),IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD23: function() { // INC IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD24: function() { // INC IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD25: function() { // DEC IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD26: function() { // LD IYH,n*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD29: function() { // ADD IY,IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD2A: function() { // LD IY,(nn)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD2B: function() { // DEC IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD2C: function() { // INC IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD2D: function() { // DEC IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD2E: function() { // LD IYL,n*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD34: function() { // INC (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD35: function() { // DEC (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD36: function() { // LD (IY+d),n
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD39: function() { // ADD IY,SP
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD44: function() { // LD B,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD45: function() { // LD B,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD46: function() { // LD B,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD4C: function() { // LD C,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD4D: function() { // LD C,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD4E: function() { // LD C,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD54: function() { // LD D,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD55: function() { // LD D,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD56: function() { // LD D,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD5C: function() { // LD E,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD5D: function() { // LD E,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD5E: function() { // LD E,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD60: function() { // LD IYH,B*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD61: function() { // LD IYH,C*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD62: function() { // LD IYH,D*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD63: function() { // LD IYH,E*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD64: function() { // LD IYH,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD65: function() { // LD IYH,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD66: function() { // LD H,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD67: function() { // LD IYH,A*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD68: function() { // LD IYL,B*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD69: function() { // LD IYL,C*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6A: function() { // LD IYL,D*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6B: function() { // LD IYL,E*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6C: function() { // LD IYL,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6D: function() { // LD IYL,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6E: function() { // LD L,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD6F: function() { // LD IYL,A*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD70: function() { // LD (IY+d),B
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD71: function() { // LD (IY+d),C
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD72: function() { // LD (IY+d),D
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD73: function() { // LD (IY+d),E
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD74: function() { // LD (IY+d),H
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD75: function() { // LD (IY+d),L
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD77: function() { // LD (IY+d),A
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD7C: function() { // LD A,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD7D: function() { // LD A,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD7E: function() { // LD A,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD84: function() { // ADD A,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD85: function() { // ADD A,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD86: function() { // ADD A,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD8C: function() { // ADC A,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD8D: function() { // ADC A,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD8E: function() { // ADC A,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD94: function() { // SUB IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD95: function() { // SUB IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD96: function() { // SUB (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD9C: function() { // SBC A,IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD9D: function() { // SBC A,IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFD9E: function() { // SBC A,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDA4: function() { // AND IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDA5: function() { // AND IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDA6: function() { // AND (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDAC: function() { // XOR IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDAD: function() { // XOR IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDAE: function() { // XOR (IY+d)
            this._op_t = 19;
            this._op_m = 3;
            var addr = this._s.getIY(toS8(this._mmu.r8(this._s.getPC(2))));
            this._s.A = (this._s.A ^ this._mmu.r8(addr)) & 0xFF;
            this._s.setF(
            F_S, (this._s.A & 0x80) !== 0,
            F_Z, this._s.A === 0,
            F_H, false,
            F_PV, (this._s.A & 0x01) === 0,
            F_N, false,
            F_C, false);
        },
        0xFDB4: function() { // OR IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDB5: function() { // OR IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDB6: function() { // OR (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDBC: function() { // CP IYH*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDBD: function() { // CP IYL*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDBE: function() { // CP (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB00: function() { // LD B,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB01: function() { // LD C,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB02: function() { // LD D,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB03: function() { // LD E,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB04: function() { // LD H,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB05: function() { // LD L,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB06: function() { // RLC (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB07: function() { // LD A,RLC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB08: function() { // LD B,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB09: function() { // LD C,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0A: function() { // LD D,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0B: function() { // LD E,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0C: function() { // LD H,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0D: function() { // LD L,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0E: function() { // RRC (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB0F: function() { // LD A,RRC (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB10: function() { // LD B,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB11: function() { // LD C,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB12: function() { // LD D,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB13: function() { // LD E,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB14: function() { // LD H,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB15: function() { // LD L,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB16: function() { // RL (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB17: function() { // LD A,RL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB18: function() { // LD B,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB19: function() { // LD C,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1A: function() { // LD D,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1B: function() { // LD E,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1C: function() { // LD H,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1D: function() { // LD L,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1E: function() { // RR (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB1F: function() { // LD A,RR (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB20: function() { // LD B,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB21: function() { // LD C,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB22: function() { // LD D,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB23: function() { // LD E,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB24: function() { // LD H,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB25: function() { // LD L,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB26: function() { // SLA (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB27: function() { // LD A,SLA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB28: function() { // LD B,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB29: function() { // LD C,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2A: function() { // LD D,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2B: function() { // LD E,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2C: function() { // LD H,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2D: function() { // LD L,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2E: function() { // SRA (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB2F: function() { // LD A,SRA (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB30: function() { // LD B,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB31: function() { // LD C,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB32: function() { // LD D,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB33: function() { // LD E,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB34: function() { // LD H,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB35: function() { // LD L,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB36: function() { // SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB37: function() { // LD A,SLL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB38: function() { // LD B,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB39: function() { // LD C,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3A: function() { // LD D,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3B: function() { // LD E,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3C: function() { // LD H,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3D: function() { // LD L,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3E: function() { // SRL (IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB3F: function() { // LD A,SRL (IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB40: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB41: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB42: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB43: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB44: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB45: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB46: function() { // BIT 0,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB47: function() { // BIT 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB48: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB49: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4A: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4B: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4C: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4D: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4E: function() { // BIT 1,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB4F: function() { // BIT 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB50: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB51: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB52: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB53: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB54: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB55: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB56: function() { // BIT 2,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB57: function() { // BIT 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB58: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB59: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5A: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5B: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5C: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5D: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5E: function() { // BIT 3,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB5F: function() { // BIT 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB60: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB61: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB62: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB63: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB64: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB65: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB66: function() { // BIT 4,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB67: function() { // BIT 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB68: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB69: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6A: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6B: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6C: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6D: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6E: function() { // BIT 5,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB6F: function() { // BIT 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB70: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB71: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB72: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB73: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB74: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB75: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB76: function() { // BIT 6,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB77: function() { // BIT 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB78: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB79: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7A: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7B: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7C: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7D: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7E: function() { // BIT 7,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB7F: function() { // BIT 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB80: function() { // LD B,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB81: function() { // LD C,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB82: function() { // LD D,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB83: function() { // LD E,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB84: function() { // LD H,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB85: function() { // LD L,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB86: function() { // RES 0,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB87: function() { // LD A,RES 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB88: function() { // LD B,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB89: function() { // LD C,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8A: function() { // LD D,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8B: function() { // LD E,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8C: function() { // LD H,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8D: function() { // LD L,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8E: function() { // RES 1,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB8F: function() { // LD A,RES 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB90: function() { // LD B,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB91: function() { // LD C,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB92: function() { // LD D,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB93: function() { // LD E,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB94: function() { // LD H,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB95: function() { // LD L,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB96: function() { // RES 2,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB97: function() { // LD A,RES 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB98: function() { // LD B,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB99: function() { // LD C,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9A: function() { // LD D,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9B: function() { // LD E,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9C: function() { // LD H,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9D: function() { // LD L,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9E: function() { // RES 3,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCB9F: function() { // LD A,RES 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA0: function() { // LD B,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA1: function() { // LD C,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA2: function() { // LD D,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA3: function() { // LD E,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA4: function() { // LD H,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA5: function() { // LD L,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA6: function() { // RES 4,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA7: function() { // LD A,RES 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA8: function() { // LD B,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBA9: function() { // LD C,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAA: function() { // LD D,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAB: function() { // LD E,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAC: function() { // LD H,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAD: function() { // LD L,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAE: function() { // RES 5,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBAF: function() { // LD A,RES 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB0: function() { // LD B,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB1: function() { // LD C,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB2: function() { // LD D,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB3: function() { // LD E,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB4: function() { // LD H,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB5: function() { // LD L,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB6: function() { // RES 6,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB7: function() { // LD A,RES 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB8: function() { // LD B,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBB9: function() { // LD C,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBA: function() { // LD D,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBB: function() { // LD E,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBC: function() { // LD H,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBD: function() { // LD L,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBE: function() { // RES 7,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBBF: function() { // LD A,RES 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC0: function() { // LD B,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC1: function() { // LD C,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC2: function() { // LD D,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC3: function() { // LD E,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC4: function() { // LD H,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC5: function() { // LD L,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC6: function() { // SET 0,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC7: function() { // LD A,SET 0,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC8: function() { // LD B,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBC9: function() { // LD C,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCA: function() { // LD D,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCB: function() { // LD E,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCC: function() { // LD H,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCD: function() { // LD L,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCE: function() { // SET 1,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBCF: function() { // LD A,SET 1,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD0: function() { // LD B,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD1: function() { // LD C,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD2: function() { // LD D,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD3: function() { // LD E,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD4: function() { // LD H,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD5: function() { // LD L,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD6: function() { // SET 2,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD7: function() { // LD A,SET 2,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD8: function() { // LD B,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBD9: function() { // LD C,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDA: function() { // LD D,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDB: function() { // LD E,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDC: function() { // LD H,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDD: function() { // LD L,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDE: function() { // SET 3,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBDF: function() { // LD A,SET 3,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE0: function() { // LD B,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE1: function() { // LD C,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE2: function() { // LD D,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE3: function() { // LD E,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE4: function() { // LD H,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE5: function() { // LD L,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE6: function() { // SET 4,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE7: function() { // LD A,SET 4,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE8: function() { // LD B,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBE9: function() { // LD C,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBEA: function() { // LD D,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBEB: function() { // LD E,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBEC: function() { // LD H,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBED: function() { // LD L,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBEE: function() { // SET 5,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBEF: function() { // LD A,SET 5,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF0: function() { // LD B,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF1: function() { // LD C,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF2: function() { // LD D,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF3: function() { // LD E,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF4: function() { // LD H,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF5: function() { // LD L,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF6: function() { // SET 6,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF7: function() { // LD A,SET 6,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF8: function() { // LD B,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBF9: function() { // LD C,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFA: function() { // LD D,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFB: function() { // LD E,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFC: function() { // LD H,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFD: function() { // LD L,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFE: function() { // SET 7,(IY+d)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDCBFF: function() { // LD A,SET 7,(IY+d)*
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDE1: function() { // POP IY
            this._op_t = 14;
            this._op_m = 2;
            this._s.setIY(this.pop16());
        },
        0xFDE3: function() { // EX (SP),IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDE5: function() { // PUSH IY
            this._op_t = 15;
            this._op_m = 2;
            this.push16(this._s.getIY());
        },
        0xFDE9: function() { // JP (IY)
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFDF9: function() { // LD SP,IY
            this._opt_t = 0;
            this._opt_m = 0;
            throw ("not implemented");
        },
        0xFE: function() { // CP	n
            this._op_t = 7;
            this._op_m = 2;
            var rhs = this._mmu.r8(this._s.getPC(1));
            var res = sub8(this._s.A, rhs);
            this._s.setF(
                F_S, res.F_S,
                F_Z, res.F_Z,
                F_H, res.F_H,
                F_PV, res.F_PV,
                F_N, true,
                F_C, res.F_C);
        },
        0xFF: function() { // RST	38H
            this._op_t = 0;
            this._op_m = 0;
            throw ("not implemented");
        }
    };

    Z80.prototype.step = function() {
        var opcode = this._mmu.r8(this._s.getPC());
        if (opcode == 0xED || opcode == 0xCB || opcode == 0xDD || opcode == 0xFD) {
            opcode = (opcode << 8) | this._mmu.r8(this._s.getPC(1));
            if (opcode == 0xFDCB || opcode == 0xDDCB) {
                opcode = (opcode << 8) | this._mmu.r8(this._s.getPC(3)); // 3 : magic!
            }
        }
        var f = this._opcodes[opcode];
        if (!f) {
            this._mmu.dasm(this._s.getPC(), 5, "??? ");
            throw ("not implemented:" + toHex8(opcode));
        }
        this.logasm();
        f.call(this);
        if (this._op_t === 0) {
            throw ("you forgot something!");
        }
        if (this._op_m) {
            this._s.setPC(this._s.getPC(this._op_m));
        }
        return this._op_t;
    };

    Z80.prototype.reset = function() {
        this._s.reset();
    };

    Z80.prototype.logasm = function() {
        this._mmu.dasm(this._s.getPC(), 1, "%% ");
    };

    Z80Module.Z80 = Z80;

    return Z80Module;
});
