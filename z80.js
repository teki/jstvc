/* Resources
    http://www.z80.info/decoding.htm
*/

var fs = require("fs");

function toHex8(x) {
    var s = x.toString(16).toUpperCase();
	return "0".slice(s.length - 1) + s;
}

function toHex16(x) {
	var s = x.toString(16).toUpperCase();
	return "000".slice(s.length - 1) + s;
}

function decodeZ80(buffer, idx) {
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
		opcode, od, on, onn,
		ox, oy, oz, op, oq;

	function fetchdByte() {
		od = buffer[idx];
		idx++;
	}

	function fetchnByte() {
		on = buffer[idx];
		idx++;
	}

	function fetchnWord() {
		onn = buffer[idx];
		idx++;
		onn += buffer[idx] << 8;
		idx++;
	}

	// fetch opcode
	opcode = buffer[idx];
	idx++;
	prefix1 = 0;
	prefix2 = 0;
	if ((opcode == 0xCB) || (opcode == 0xED)) {
		prefix1 = opcode;
		opcode = buffer[idx];
		idx++;
	}
	else if ((opcode == 0xDD) || (opcode == 0xFD)) {
		throw "DD FD not implemented";
		prefix1 = opcode;
		opcode = buffer[idx];
		idx++;
		if (opcode == 0xCB) {
			prefix2 = opcode;
			opcode = buffer[idx];
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
/*
function printZ80(buffer, idx) {
    var startIdx = idx;
    var d = decodeZ80(buffer, startIdx);
}
*/
var b = fs.readFileSync("TVC12_D4.64K");

var idx = 0x0229;
var limit = 20;
do {
	var d = decodeZ80(b, idx);
	console.log(toHex16(idx) + " " + d[0] + "\n");
	idx = d[1];
	limit--;
} while (limit);
