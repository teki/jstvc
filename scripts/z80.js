define(["scripts/utils.js","scripts/dasm.js"], function (Utils,Dasm) {

	var exports = {};

	var F_S = 0x80; // sign
	var F_Z = 0x40; // zero
	var F_5 = 0x20; // ???
	var F_H = 0x10; // half-carry
	var F_3 = 0x08; // ???
	var F_PV = 0x04; // parity or overflow
	var F_N = 0x02; // add/subtract
	var F_C = 0x01; // carry

	var SZ53Ptable = new Uint8Array(256);
	var SZ53table = new Uint8Array(256);
	for (var i = 0; i < 256; i++) {
		SZ53table[i] = (i & F_S) | (i & F_5) | (i & F_3);
		SZ53Ptable[i] = SZ53table[i] | (
			(((i >>> 7) + (i >>> 6) + (i >>> 5) + (i >>> 4) +
			(i >>> 3) + (i >>> 2) + (i >>> 1) + (i) + 1) & 1) * F_PV );
	}
	SZ53table[0] = SZ53table[0] | F_Z;
	SZ53Ptable[0] = SZ53Ptable[0] | F_Z;

	////////////////////////////////////////////
	// Z80State
	////////////////////////////////////////////
	function Z80State() {
		// interrupt
		this.halted = 0;
		this.im = 0;
		this.IFF1 = 0;
		this.IFF2 = 0;
		this.I = 0xFF;

		// registers
		this.A = 0xFF;
		this.F = 0xFF;
		this.B = 0xFF;
		this.C = 0xFF;
		this.D = 0xFF;
		this.E = 0xFF;
		this.H = 0xFF;
		this.L = 0xFF;
		this.IXH = 0xFF;
		this.IXL = 0xFF;
		this.IYH = 0xFF;
		this.IYL = 0xFF;

		this.SP = 0xFFFF;
		this.PC = 0x0000;


		this.Aa = 0xFF;
		this.Ba = 0xFF;
		this.Ca = 0xFF;
		this.Da = 0xFF;
		this.Ea = 0xFF;
		this.Fa = 0xFF;
		this.Ha = 0xFF;
		this.La = 0xFF;

		this.R = 0x00;
	};

	Z80State.prototype = {
		get PC() { return this._PC; },
		set PC(val) {this._PC = val & 0xFFFF;},
		get SP() { return this._SP; },
		set SP(val) {this._SP = val & 0xFFFF;},
		get AF() { return (this.A << 8) | this.F; },
		set AF(val) {this.A = (val & 0xFF00) >>> 8; this.F = val & 0xFF;},
		get BC() { return (this.B << 8) | this.C; },
		set BC(val) {this.B = (val & 0xFF00) >>> 8; this.C = val & 0xFF;},
		get DE() { return (this.D << 8) | this.E; },
		set DE(val) {this.D = (val & 0xFF00) >>> 8; this.E = val & 0xFF;},
		get HL() { return (this.H << 8) | this.L; },
		set HL(val) {this.H = (val & 0xFF00) >>> 8; this.L = val & 0xFF;},
		get IX() { return (this.IXH << 8) | this.IXL; },
		set IX(val) {this.IXH = (val & 0xFF00) >>> 8; this.IXL = val & 0xFF;},
		get IY() { return (this.IYH << 8) | this.IYL; },
		set IY(val) {this.IYH = (val & 0xFF00) >>> 8; this.IYL = val & 0xFF;},
		get AFa() { return (this.Aa << 8) | this.Fa; },
		set AFa(val) {this.Aa = (val & 0xFF00) >>> 8; this.Fa = val & 0xFF;},
		get BCa() { return (this.Ba << 8) | this.Ca; },
		set BCa(val) {this.Ba = (val & 0xFF00) >>> 8; this.Ca = val & 0xFF;},
		get DEa() { return (this.Da << 8) | this.Ea; },
		set DEa(val) {this.Da = (val & 0xFF00) >>> 8; this.Ea = val & 0xFF;},
		get HLa() { return (this.Ha << 8) | this.La; },
		set HLa(val) {this.Ha = (val & 0xFF00) >>> 8; this.La = val & 0xFF;},
	};

	Z80State.prototype.reset = function () {
		// interrupt
		this.halted = 0;
		this.im = 0;
		this.IFF1 = 0;
		this.IFF2 = 0;
		this.I = 0xFF;

		// registers
		this.A = 0xFF;
		this.F = 0xFF;
		this.B = 0xFF;
		this.C = 0xFF;
		this.D = 0xFF;
		this.E = 0xFF;
		this.H = 0xFF;
		this.L = 0xFF;
		this.IXH = 0xFF;
		this.IXL = 0xFF;
		this.IYH = 0xFF;
		this.IYL = 0xFF;

		this._SP = 0xFFFF;
		this._PC = 0x0000;


		this.Aa = 0xFF;
		this.Ba = 0xFF;
		this.Ca = 0xFF;
		this.Da = 0xFF;
		this.Ea = 0xFF;
		this.Fa = 0xFF;
		this.Ha = 0xFF;
		this.La = 0xFF;

		this.R = 0x00;
	};

	Z80State.prototype.toString = function() {
		var arr = [];
		arr.push("PC:");arr.push(Utils.toHex16(this.PC));
		arr.push(" SP:");arr.push(Utils.toHex16(this.SP));
		arr.push(" AF:");arr.push(Utils.toHex88(this.A, this.F));
		arr.push(" SZ5H3PNC:");arr.push(Utils.toBin8(this.F));
		arr.push("\n");
		arr.push("BC:");arr.push(Utils.toHex88(this.B, this.C));
		arr.push(" DE:");arr.push(Utils.toHex88(this.D,this.E));
		arr.push(" HL:");arr.push(Utils.toHex88(this.H,this.L));
		arr.push(" IX:");arr.push(Utils.toHex88(this.IXH,this.IXL));
		arr.push(" IY:");arr.push(Utils.toHex88(this.IYH,this.IYL));
		arr.push(" AFa:");arr.push(Utils.toHex88(this.Aa, this.Fa));
		arr.push(" BCa:");arr.push(Utils.toHex88(this.Ba, this.Ca));
		arr.push(" DEa:");arr.push(Utils.toHex88(this.Da,this.Ea));
		arr.push(" HLa:");arr.push(Utils.toHex88(this.Ha,this.La));

		return arr.join("");
	}

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
		this._op_displ = 0;
		this._op_n = 0;
		this._op_nn = 0;
		this._op_e = 0;
		this._op_alures = [0,0];
		this.bt = [];
	}
	Z80.prototype.toString = function() {
		return this._s.toString();
	}

	Z80.prototype.push16 = function (val) {
		var sp = (this._s.SP - 1) & 0xFFFF;
		this._mmu.w8(sp, (val >> 8) & 0xFF);
		sp--;
		this._mmu.w8(sp, val & 0xFF);
		this._s.SP = sp;
	};

	Z80.prototype.pop16 = function () {
		var SP = this._s.SP;
		var val = this._mmu.r8(SP);
		SP++;
		val |= (this._mmu.r8(SP) << 8);
		this._s.SP = (SP + 1) & 0xFFFF;
		return val;
	};

// /////////////////////////////
// opcode helpers
// /////////////////////////////

	function add8(val1, val2, CIn, resOut) {
		CIn = CIn ? 1 : 0;
		var val1S = (val1 & 0x80) >>> 7;
		var val2S = (val2 & 0x80) >>> 7;
		var res = val1 + val2 + CIn;
		var res4 = (val1 & 0x0F) + (val2 & 0x0F) + CIn;
		var res8 = res & 0xFF;
		var resS = (res8 & 0x80) >>> 7;
		var overflow = (val1S == val2S) && (val1S != resS);
		var Chalf = res4 > 0x0F;
		var Cout = (res > 0xFF) ? (F_C) : (0);
		resOut[0] = res8;
		resOut[1] =
			   SZ53table[res8]
				| (overflow ? F_PV : 0)
				| (Chalf ? F_H : 0)
				| Cout ;
	}

	function sub8(val1, val2, CIn, resOut) {
		CIn = !CIn;
		add8(val1, (~val2) & 0xFF, CIn, resOut);
		resOut[1] ^= (F_H|F_C);
		resOut[1] |= F_N;
	}

	function add16(val1, val2, Cin, resOut) {
		var resL = [0,0];
		var resH = [0,0];
		add8(val1 & 0xFF, val2 & 0xFF, Cin, resL);
		add8(val1 >>> 8, val2 >>> 8, resL[1] & F_C, resH);
		var res16 = (resH[0] << 8) | resL[0];
		resOut[0] = res16;
		resOut[1] =
			(resH[0] & F_S) |
			((res16 == 0) ? (F_Z) : (0)) |
			(resH[0] & F_5) |
			(resH[1] & F_H) |
			(resH[0] & F_3) |
			(resH[1] & F_PV) |
			(resH[1] & F_C);
	}

	function sub16(val1, val2, Cin, resOut) {
		Cin = !Cin;
		add16(val1, (~val2) & 0xFFFF, Cin, resOut);
		resOut[1] ^= (F_C|F_H);
		resOut[1] |= F_N;
	}

	function shl8(val, rightIn, resOut) {
		var COut = (val & 0x80) >> 7;
		var res;
		rightIn = rightIn ? 1 : 0;
		res = ((val << 1) | rightIn) & 0xFF;
		resOut[0] = res;
		resOut[1] = SZ53Ptable[res] | COut;
	}

	function shr8(val, leftIn, resOut) {
		var COut = val & 1;
		var res;
		leftIn = leftIn ? 1 : 0;
		res = ((val >>> 1) | (leftIn << 7)) & 0xFF;
		resOut[0] = res;
		resOut[1] = SZ53Ptable[res] | COut;
	}

// ///////////////////////////////////////
// opcode implementations
// ///////////////////////////////////////
	function srl_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shr8(this._s[reg], 0, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function sra_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shr8(this._s[reg], this._s[reg] & 0x80, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function rr_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shr8(this._s[reg], this._s.F & F_C, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function rrc_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shr8(this._s[reg], this._s[reg] & 0x01, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function sll_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shl8(this._s[reg], 1, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function sla_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shl8(this._s[reg], 0, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function rl_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shl8(this._s[reg], this._s.F & F_C, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function rlc_r(reg) {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			shl8(this._s[reg], this._s[reg] & 0x80, this._op_alures);
			this._s[reg] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function bit_n_ixyd(n,reg) {
		var mask = 1 << n;
		return function() {
			this._op_t = 20;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var memval = this._mmu.r8(addr);
			var val = memval & mask;
			this._s.F =
				(val & F_S) |
				((val) ? (0) : (F_Z|F_PV)) |
				((addr >>> 8) & (F_3|F_5)) |
				F_H |
				(this._s.F & F_C);
		}
	}

	function bit_n_ihl(n) {
		var mask = 1 << n;
		return function() {
			this._op_t = 12;
			this._op_m = 2;
			var memval = this._mmu.r8(this._s.HL);
			var val = memval & mask;
			this._s.F =
				(val & F_S) |
				((val) ? (0) : (F_Z|F_PV)) |
				(memval & (F_3|F_5)) |
				F_H |
				(this._s.F & F_C);
		}
	}

	function bit_n_r(n, reg) {
		var mask = 1 << n;
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			var val = this._s[reg] & mask;
			this._s.F =
				(val & F_S) |
				((val) ? (0) : (F_Z|F_PV)) |
				(this._s[reg] & (F_3|F_5)) |
				F_H |
				(this._s.F & F_C);
		}
	}

	function or_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			this._s.A |= this._s[reg];
			this._s.F = SZ53Ptable[this._s.A];
		}
	}

	function xor_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			this._s.A ^= this._s[reg];
			this._s.F = SZ53Ptable[this._s.A];
		}
	}

	function and_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			this._s.A &= this._s[reg];
			this._s.F = SZ53Ptable[this._s.A] | F_H;
		}
	}

	function neg_a() {
		return function() {
			this._op_t = 8;
			this._op_m = 2;
			sub8(0, this._s.A, 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function retn() {
		return function() {
			this._op_t = 14;
			this._op_m = 0;
			this._s.IFF1 = this._s.IFF2;
			this._s.PC = this.pop16();
		}
	}

	function cp_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			sub8(this._s.A, this._s[reg],0, this._op_alures);
			this._s.F = (this._op_alures[1] & ~(F_5|F_3)) | (this._s[reg] & (F_5|F_3));
		}
	}

	function sbc_a_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			sub8(this._s.A, this._s[reg], this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		}
	}

	function sub_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			sub8(this._s.A, this._s[reg],0, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		}
	}

	function adc_a_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			add8(this._s.A, this._s[reg], this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function add_a_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			add8(this._s.A, this._s[reg], 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function inc_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			add8(this._s[reg], 1, 0, this._op_alures);
			this._s[reg] = this._op_alures[0]
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask);
		}
	}

	function dec_r(reg) {
		var m = 1;
		var t = 4;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			m = 2;
			t = 8;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			sub8(this._s[reg], 1,0, this._op_alures);
			this._s[reg] = this._op_alures[0];
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask);
		}
	}

	function inc_ss(reg) {
		var t = 6,
			m = 1;
		if (reg == "IX" || reg == "IY") {
			t = 10;
			m = 2;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			var val = (this._s[reg] + 1) & 0xFFFF;
			this._s[reg] = val;
		}
	}

	function dec_ss(reg) {
		var t = 6,
			m = 1;
		if (reg == "IX" || reg == "IY") {
			t = 10;
			m = 2;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			var val = this._s[reg] - 1;
			this._s[reg] = val;
		}
	}

	function res_n_xd(n, reg) {
		var mask = 1 << n;
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr) & (~mask);
			this._mmu.w8(addr, val);
		}
	}

	function ld_r_set_n_xd(dstreg, n, reg) {
		var mask = 1 << n;
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr) | mask;
			this._s[dstreg] = val;
			this._mmu.w8(addr, val);
		}
	}

	function ld_r_res_n_xd(dstreg, n, reg) {
		var mask = 1 << n;
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr) & (~mask);
			this._s[dstreg] = val;
			this._mmu.w8(addr, val);
		}
	}

	function ld_r_rr_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shr8(val, this._s.F & F_C, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_rrc_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shr8(val, val & 0x01, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_rl_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shl8(val, this._s.F & F_C, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_rlc_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shl8(val, val & 0x80, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_sll_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shl8(val, 1, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_sla_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shl8(val, 0, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_srl_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shr8(val, 0, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_r_sra_xd(dstreg, reg) {
		return function() {
			this._op_t = 23;
			this._op_m = 4;
			var addr = (this._s[reg] + this._op_displ) & 0xFFFF;
			var val = this._mmu.r8(addr);
			shr8(val, val & 0x80, this._op_alures);
			this._s[dstreg] = this._op_alures[0];
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		}
	}

	function ld_ss_nn(reg) {
		var t = 10,
			m = 3,
			offset = 0;
		if (reg == "IX" || reg == "IY") {
			t = 14;
			m = 4;
			offset = 1;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			this._op_nn = this._mmu.r16(this._s.PC + 1 + offset);
			this._s[reg] = this._op_nn;
		}
	}

	function ld_iss_r(regl, regr) {
		return function() {
			this._op_t = 7;
			this._op_m = 1;
			this._mmu.w8(this._s[regl], this._s[regr]);
		}
	}

	function ld_r_iss(regl, regr) {
		return function() {
			this._op_t = 7;
			this._op_m = 1;
			this._s[regl] = this._mmu.r8(this._s[regr]);
		}
	}

	function ld_r_n(reg) {
		var t = 7;
		var m = 2;
		if (reg == "IXH" || reg == "IXL" || reg == "IYH" || reg == "IYL") {
			t = 11;
			m = 3;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			this._op_n = this._mmu.r8(this._s.PC + m-1);
			this._s[reg] = this._op_n;
		}
	}

	function sbc_ss_ss(regl, regr) {
		return function() {
			this._op_t = 15;
			this._op_m = 2;
			sub16(this._s[regl], this._s[regr], this._s.F & F_C, this._op_alures);
			this._s[regl] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function adc_ss_ss(regl, regr) {
		return function() {
			this._op_t = 15;
			this._op_m = 2;
			add16(this._s[regl], this._s[regr], this._s.F & F_C, this._op_alures);
			this._s[regl] = this._op_alures[0];
			this._s.F = this._op_alures[1];
		}
	}

	function add_ss_ss(regl, regr) {
		var t = 11,
			m = 1;
		if (regl == "IX" || regl == "IY") {
			t = 15;
			m = 2;
		}
		return function() {
			this._op_t = t;
			this._op_m = m;
			add16(this._s[regl], this._s[regr], 0, this._op_alures);
			this._s[regl] = this._op_alures[0];
			var mask = F_S|F_Z|F_PV;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask);
		}
	}

	function out_c_r(reg) {
		return function() {
			this._op_t = 12;
			this._op_m = 2;
			this._out(this._s.C, this._s[reg], this._s.B);
		}
	}

	function in_r_c(reg) {
		return function() {
			this._op_t = 12;
			this._op_m = 2;
			this._s[reg] = this._in(this._s.C, this._s.B);
			this._s.F = (this._s.F & F_C) | SZ53Ptable[this._s[reg]];
		}
	}

// /////////////////////////////
// opcodes
// /////////////////////////////

	Z80.prototype._opcodes = {

		0x00:function () { // NOP
			this._op_t = 4;
			this._op_m = 1;
		},
		0x01: ld_ss_nn("BC"), // LD BC,nn
		0x02: ld_iss_r("BC", "A"), // LD (BC),A
		0x03: inc_ss("BC"), // INC BC
		0x04: inc_r("B"), // INC B
		0x05: dec_r("B"), // DEC B
		0x06: ld_r_n("B"), // LD B,n
		0x07:function () { // RLCA
			this._op_t = 4;
			this._op_m = 1;
			shl8(this._s.A, this._s.A & 0x80, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = (this._s.F & ~(F_H|F_N|F_C)) | (this._op_alures[1] & F_C);
			var mask = F_S|F_Z|F_PV;
			this._s.F = (this._s.F & mask) | (this._op_alures[1] & ~mask);
		},
		0x08:function () { // EX AF,AF'
			this._op_t = 4;
			this._op_m = 1;
			var a = this._s.A; this._s.A = this._s.Aa; this._s.Aa = a;
			var f = this._s.F; this._s.F = this._s.Fa; this._s.Fa = f;
		},
		0x09: add_ss_ss("HL", "BC"), // ADD HL,BC
		0x0A: ld_r_iss("A", "BC"), // LD A,(BC)
		0x0B: dec_ss("BC"), // DEC BC
		0x0C: inc_r("C"), // INC C
		0x0D: dec_r("C"), // DEC C
		0x0E: ld_r_n("C"), // LD C,n
		0x0F:function () { // RRCA
			this._op_t = 4;
			this._op_m = 1;
			shr8(this._s.A, this._s.A & 1, this._op_alures);
			this._s.A = this._op_alures[0];
			var mask = F_S|F_Z|F_PV;
			this._s.F = (this._s.F & mask) | (this._op_alures[1] & ~mask);
		},
		0x10:function () { // DJNZ (PC+e)
			var offset,pc;
			this._s.B--;
			if (this._s.B < 0) {
				this._s.B = 0xFF;
			}
			if (this._s.B == 0) {
				this._op_t = 8;
				this._op_m = 2;
			}
			else {
				this._op_t = 13;
				this._op_m = 0;
				pc = this._s.PC;
				this._op_e = this._mmu.r8s(pc + 1);
				this._s.PC = pc + 2 + this._op_e;
			}
		},
		0x11: ld_ss_nn("DE"), // LD DE,nn
		0x12: ld_iss_r("DE", "A"), // LD (DE),A
		0x13: inc_ss("DE"), // INC DE
		0x14: inc_r("D"), // INC D
		0x15: dec_r("D"), // DEC D
		0x16: ld_r_n("D"), // LD D,n
		0x17:function () { // RLA
			this._op_t = 4;
			this._op_m = 1;
			shl8(this._s.A, this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			var mask = F_S|F_Z|F_PV;
			this._s.F = (this._s.F & mask) | (this._op_alures[1] & ~mask);
		},
		0x18:function () { // JR (PC+e)
			this._op_t = 12;
			this._op_m = 0;
			var offset,pc;
			pc = this._s.PC;
			this._op_e = this._mmu.r8s(pc + 1);
			offset = 2 + this._op_e;
			this._s.PC = pc + offset;
		},
		0x19: add_ss_ss("HL", "DE"), // ADD HL,DE
		0x1A: ld_r_iss("A", "DE"), // LD A,(DE)
		0x1B: dec_ss("DE"), // DEC DE
		0x1C: inc_r("E"), // INC E
		0x1D: dec_r("E"), // DEC E
		0x1E: ld_r_n("E"), // LD E,n
		0x1F:function () { // RRA
			this._op_t = 4;
			this._op_m = 1;
			shr8(this._s.A, this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			var mask = F_S|F_Z|F_PV;
			this._s.F = (this._s.F & mask) | (this._op_alures[1] & ~mask);
		},
		0x20:function () { // JR NZ,(PC+e)
			var e;
			if (this._s.F & F_Z) {
				this._op_t = 7;
				this._op_m = 2;
			}
			else {
				this._op_t = 12;
				this._op_m = 0;
				var offset,pc;
				pc = this._s.PC;
				this._op_e = this._mmu.r8s(pc + 1);
				offset = 2 + this._op_e;
				this._s.PC = pc + offset;
			}
		},
		0x21: ld_ss_nn("HL"), // LD HL,nn
		0x22:function () { // LD (nn),HL
			this._op_t = 16;
			this._op_m = 3;
			this._op_nn = this._mmu.r16(this._s.PC+1);
			this._mmu.w16(this._op_nn, this._s.HL);
		},
		0x23: inc_ss("HL"), // INC HL
		0x24: inc_r("H"), // INC H
		0x25: dec_r("H"), // DEC H
		0x26: ld_r_n("H"), // LD H,n
		0x27:function () { // DAA
			this._op_t = 4;
			this._op_m = 1;
			var add = 0,
				carry = ( this._s.F & F_C ),
				lownibble = this._s.A & 0x0F,
				res;
			if((this._s.F & F_H) || (lownibble > 9)) add = 6;
			if(carry || (this._s.A > 0x99)) add |= 0x60;
			if(this._s.A > 0x99) carry=F_C;
			if (this._s.F & F_N) {
				sub8(this._s.A, add, 0, this._op_alures);
			} else {
				add8(this._s.A, add, 0, this._op_alures);
			}
			this._s.A = this._op_alures[0];
			this._s.F =
				(this._s.F & F_N) |
				SZ53Ptable[this._s.A] |
				(this._op_alures[1] & F_H) |
				carry;
		},
		0x28:function () { // JR Z,(PC+e)
			if (this._s.F & F_Z) {
				this._op_t = 12;
				this._op_m = 0;
				var offset,pc;
				pc = this._s.PC;
				this._op_e = this._mmu.r8s(pc + 1);
				offset = 2 + this._op_e;
				this._s.PC = (pc + offset) & 0xFFFF;
			}
			else {
				this._op_t = 7;
				this._op_m = 2;
			}
		},
		0x29: add_ss_ss("HL", "HL"), // ADD HL,HL
		0x2A:function () { // LD HL,(nn)
			this._op_t = 16;
			this._op_m = 3;
			this._op_nn = this._mmu.r16(this._s.PC+1);
			this._s.HL = this._mmu.r16(this._op_nn);
		},
		0x2B: dec_ss("HL"), // DEC HL
		0x2C: inc_r("L"), // INC L
		0x2D: dec_r("L"), // DEC L
		0x2E: ld_r_n("L"), // LD L,n
		0x2F:function () { // CPL
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = (~this._s.A) & 0xFF;
			this._s.F =
				(this._s.F & (F_S|F_Z|F_PV|F_C)) |
				F_H | F_N |
				(this._s.A & F_5) | (this._s.A & F_3);
		},
		0x30:function () { // JR NC,(PC+e)
			var offset;
			if (this._s.F & F_C) {
				this._op_t = 7;
				this._op_m = 2;
			}
			else {
				this._op_t = 12;
				this._op_m = 0;
				var offset,pc;
				pc = this._s.PC;
				this._op_e = this._mmu.r8s(pc + 1);
				offset = 2 + this._op_e;
				this._s.PC = pc + offset;
			}
		},
		0x31: ld_ss_nn("SP"), // LD SP,nn
		0x32:function () { // LD (nn),A
			this._op_t = 13;
			this._op_m = 3;
			this._op_nn = this._mmu.r16(this._s.PC+1);
			this._mmu.w8(this._op_nn, this._s.A);
		},
		0x33: inc_ss("SP"), // INC SP
		0x34:function () { // INC (HL)
			this._op_t = 11;
			this._op_m = 1;
			var HL = this._s.HL
			add8(this._mmu.r8(HL), 1, 0, this._op_alures);
			this._mmu.w8(HL, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask); 
		},
		0x35:function () { // DEC (HL)
			this._op_t = 11;
			this._op_m = 1;
			var HL = this._s.HL;
			sub8(this._mmu.r8(HL), 1, 0, this._op_alures);
			this._mmu.w8(HL, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask); 
		},
		0x36:function () { // LD (HL),n
			this._op_t = 10;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._mmu.w8(this._s.HL, this._op_n);
		},
		0x37:function () { // SCF
			this._op_t = 4;
			this._op_m = 1;
			this._s.F =
				(this._s.F & (F_S|F_Z|F_PV)) |
				(this._s.A & F_5) |
				(this._s.A & F_3) |
				F_C;
		},
		0x38:function () { // JR C,(PC+e)
			var offset;
			if (this._s.F & F_C) {
				this._op_t = 12;
				this._op_m = 0;
				var offset,pc;
				pc = this._s.PC;
				this._op_e = this._mmu.r8s(pc + 1);
				offset = 2 + this._op_e;
				this._s.PC = pc + offset;
			}
			else {
				this._op_t = 7;
				this._op_m = 2;
			}

		},
		0x39: add_ss_ss("HL", "SP"), // ADD HL,SP
		0x3A:function () { // LD A,(nn)
			this._op_t = 13;
			this._op_m = 3;
			this._op_nn = this._mmu.r16(this._s.PC+1);
			this._s.A = this._mmu.r8(this._op_nn);
		},
		0x3B: dec_ss("SP"), // DEC SP
		0x3C: inc_r("A"), // INC A
		0x3D: dec_r("A"), // DEC A
		0x3E: ld_r_n("A"), // LD A,n
		0x3F:function () { // CCF
			this._op_t = 4;
			this._op_m = 1;
			this._s.F =
				(this._s.F & (F_S|F_Z|F_PV)) |
				(this._s.A & F_5) |
				(this._s.A & F_3) |
				((this._s.F & F_C) << 4) | // F_H
				((this._s.F & F_C) ^ F_C);
		},
		0x40:function () { // LD B,B
			this._op_t = 4;
			this._op_m = 1;
		},
		0x41:function () { // LD B,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.C;
		},
		0x42:function () { // LD B,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.D;
		},
		0x43:function () { // LD B,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.E;
		},
		0x44:function () { // LD B,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.H;
		},
		0x45:function () { // LD B,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.L;
		},
		0x46: ld_r_iss("B","HL"), // LD B,(HL)
		0x47:function () { // LD B,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.B = this._s.A;
		},
		0x48:function () { // LD C,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.B;
		},
		0x49:function () { // LD C,C
			this._op_t = 4;
			this._op_m = 1;
		},
		0x4A:function () { // LD C,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.D;
		},
		0x4B:function () { // LD C,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.E;
		},
		0x4C:function () { // LD C,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.H;
		},
		0x4D:function () { // LD C,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.L;
		},
		0x4E: ld_r_iss("C","HL"), // LD C,(HL)
		0x4F:function () { // LD C,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.C = this._s.A;
		},
		0x50:function () { // LD D,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.B;
		},
		0x51:function () { // LD D,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.C;
		},
		0x52:function () { // LD D,D
			this._op_t = 4;
			this._op_m = 1;
		},
		0x53:function () { // LD D,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.E;
		},
		0x54:function () { // LD D,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.H;
		},
		0x55:function () { // LD D,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.L;
		},
		0x56: ld_r_iss("D","HL"), // LD D,(HL)
		0x57:function () { // LD D,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.D = this._s.A;
		},
		0x58:function () { // LD E,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.B;
		},
		0x59:function () { // LD E,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.C;
		},
		0x5A:function () { // LD E,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.D;
		},
		0x5B:function () { // LD E,E
			this._op_t = 4;
			this._op_m = 1;
		},
		0x5C:function () { // LD E,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.H;
		},
		0x5D:function () { // LD E,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.L;
		},
		0x5E: ld_r_iss("E","HL"), // LD E,(HL)
		0x5F:function () { // LD E,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.E = this._s.A;
		},
		0x60:function () { // LD H,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.B;
		},
		0x61:function () { // LD H,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.C;
		},
		0x62:function () { // LD H,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.D;
		},
		0x63:function () { // LD H,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.E;
		},
		0x64:function () { // LD H,H
			this._op_t = 4;
			this._op_m = 1;
		},
		0x65:function () { // LD H,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.L;
		},
		0x66: ld_r_iss("H","HL"), // LD H,(HL)
		0x67:function () { // LD H,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.H = this._s.A;
		},
		0x68:function () { // LD L,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.B;
		},
		0x69:function () { // LD L,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.C;
		},
		0x6A:function () { // LD L,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.D;
		},
		0x6B:function () { // LD L,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.E;
		},
		0x6C:function () { // LD L,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.H;
		},
		0x6D:function () { // LD L,L
			this._op_t = 4;
			this._op_m = 1;
		},
		0x6E: ld_r_iss("L","HL"), // LD L,(HL)
		0x6F:function () { // LD L,A
			this._op_t = 4;
			this._op_m = 1;
			this._s.L = this._s.A;
		},
		0x70: ld_iss_r("HL", "B"), // LD (HL),B
		0x71: ld_iss_r("HL", "C"), // LD (HL),C
		0x72: ld_iss_r("HL", "D"), // LD (HL),D
		0x73: ld_iss_r("HL", "E"), // LD (HL),E
		0x74: ld_iss_r("HL", "H"), // LD (HL),H
		0x75: ld_iss_r("HL", "L"), // LD (HL),L
		0x76:function () { // HALT
			this._op_t = 4;
			this._op_m = 1;
			this._s.halted = 1;
		},
		0x77: ld_iss_r("HL", "A"), // LD (HL),A
		0x78:function () { // LD A,B
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.B;
		},
		0x79:function () { // LD A,C
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.C;
		},
		0x7A:function () { // LD A,D
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.D;
		},
		0x7B:function () { // LD A,E
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.E;
		},
		0x7C:function () { // LD A,H
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.H;
		},
		0x7D:function () { // LD A,L
			this._op_t = 4;
			this._op_m = 1;
			this._s.A = this._s.L;
		},
		0x7E: ld_r_iss("A","HL"), // LD A,(HL)
		0x7F:function () { // LD A,A
			this._op_t = 4;
			this._op_m = 1;
		},
		0x80: add_a_r("B"), // ADD A,B
		0x81: add_a_r("C"), // ADD A,C
		0x82: add_a_r("D"), // ADD A,D
		0x83: add_a_r("E"), // ADD A,E
		0x84: add_a_r("H"), // ADD A,H
		0x85: add_a_r("L"), // ADD A,L
		0x86:function () { // ADD A,(HL)
			this._op_t = 7;
			this._op_m = 1;
			add8(this._s.A, this._mmu.r8(this._s.HL), 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0x87: add_a_r("A"), // ADD A,A
		0x88: adc_a_r("B"), // ADC A,B
		0x89: adc_a_r("C"), // ADC A,C
		0x8A: adc_a_r("D"), // ADC A,D
		0x8B: adc_a_r("E"), // ADC A,E
		0x8C: adc_a_r("H"), // ADC A,H
		0x8D: adc_a_r("L"), // ADC A,L
		0x8E:function () { // ADC A,(HL)
			this._op_t = 7;
			this._op_m = 1;
			add8(this._s.A, this._mmu.r8(this._s.HL), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0x8F: adc_a_r("A"), // ADC A,A
		0x90: sub_r("B"), // SUB B
		0x91: sub_r("C"), // SUB C
		0x92: sub_r("D"), // SUB D
		0x93: sub_r("E"), // SUB E
		0x94: sub_r("H"), // SUB H
		0x95: sub_r("L"), // SUB L
		0x96:function () { // SUB (HL)
			this._op_t = 7;
			this._op_m = 1;
			var rhs = this._mmu.r8(this._s.HL);
			sub8(this._s.A, rhs, 0, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0x97: sub_r("A"), // SUB A
		0x98: sbc_a_r("B"), // SBC A,B
		0x99: sbc_a_r("C"), // SBC A,C
		0x9A: sbc_a_r("D"), // SBC A,D
		0x9B: sbc_a_r("E"), // SBC A,E
		0x9C: sbc_a_r("H"), // SBC A,H
		0x9D: sbc_a_r("L"), // SBC A,L
		0x9E:function () { // SBC A,(HL)
			this._op_t = 7;
			this._op_m = 1;
			var addr = this._s.HL;
			sub8(this._s.A, this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0x9F: sbc_a_r("A"), // SBC A,A
		0xA0: and_r("B"), // AND B
		0xA1: and_r("C"), // AND C
		0xA2: and_r("D"), // AND D
		0xA3: and_r("E"), // AND E
		0xA4: and_r("H"), // AND H
		0xA5: and_r("L"), // AND L
		0xA6:function () { // AND (HL)
			this._op_t = 7;
			this._op_m = 1;
			var rhs = this._mmu.r8(this._s.HL);
			this._s.A &= rhs;
			this._s.F = SZ53Ptable[this._s.A] | F_H;
		},
		0xA7: and_r("A"), // AND A
		0xA8: xor_r("B"), // XOR B
		0xA9: xor_r("C"), // XOR C
		0xAA: xor_r("D"), // XOR D
		0xAB: xor_r("E"), // XOR E
		0xAC: xor_r("H"), // XOR H
		0xAD: xor_r("L"), // XOR L
		0xAE: function () { // XOR (HL)
			this._op_t = 7;
			this._op_m = 1;
			var rhs = this._mmu.r8(this._s.HL);
			this._s.A ^= rhs;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xAF: xor_r("A"), // XOR A
		0xB0: or_r("B"), // OR B
		0xB1: or_r("C"), // OR C
		0xB2: or_r("D"), // OR D
		0xB3: or_r("E"), // OR E
		0xB4: or_r("H"), // OR H
		0xB5: or_r("L"), // OR L
		0xB6: function () { // OR (HL)
			this._op_t = 7;
			this._op_m = 1;
			var val = this._mmu.r8(this._s.HL);
			this._s.A |= val;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xB7: or_r("A"), // OR A
		0xB8: cp_r("B"), // CP B
		0xB9: cp_r("C"), // CP C
		0xBA: cp_r("D"), // CP D
		0xBB: cp_r("E"), // CP E
		0xBC: cp_r("H"), // CP H
		0xBD: cp_r("L"), // CP L
		0xBE:function () { // CP (HL)
			this._op_t = 7;
			this._op_m = 1;
			var rhs = this._mmu.r8(this._s.HL);
			sub8(this._s.A, rhs, 0, this._op_alures);
			this._s.F = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
		},
		0xBF: cp_r("A"), // CP A
		0xC0:function () { // RET NZ
			if (this._s.F & F_Z) {
				this._op_t = 5;
				this._op_m = 1;
			}
			else {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
		},
		0xC1:function () { // POP BC
			this._op_t = 10;
			this._op_m = 1;
			this._s.BC = this.pop16();
		},
		0xC2:function () { // JP NZ,(nn)
			this._op_t = 10;
			if (this._s.F & F_Z) {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
		},
		0xC3:function () { // JP (nn)
			this._op_t = 10;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.PC+1);
			this._s.PC = this._op_nn;
		},
		0xC4:function () { // CALL NZ,(nn)
			if (this._s.F & F_Z) {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
		},
		0xC5:function () { // PUSH BC
			this._op_t = 11;
			this._op_m = 1;
			this.push16(this._s.BC);
		},
		0xC6:function () { // ADD A,n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			var val = this._op_n;
			add8(this._s.A, val, 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xC7:function () { // RST 0H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x00;
		},
		0xC8:function () { // RET Z
			if (this._s.F & F_Z) {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
			else {
				this._op_t = 5;
				this._op_m = 1;
			}
		},
		0xC9:function () { // RET
			this._op_t = 10;
			this._op_m = 0;
			this._s.PC = this.pop16();
		},
		0xCA:function () { // JP Z,(nn)
			this._op_t = 10;
			if (this._s.F & F_Z) {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
			else {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xCB:function () { // CB
			throw ("invalid call");
		},
		0xCB00: rlc_r("B"), // RLC B
		0xCB01: rlc_r("C"), // RLC C
		0xCB02: rlc_r("D"), // RLC D
		0xCB03: rlc_r("E"), // RLC E
		0xCB04: rlc_r("H"), // RLC H
		0xCB05: rlc_r("L"), // RLC L
		0xCB06:function () { // RLC (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			var val = this._mmu.r8(addr);
			shl8(val, val & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB07: rlc_r("A"), // RLC A
		0xCB08: rrc_r("B"), // RRC B
		0xCB09: rrc_r("C"), // RRC C
		0xCB0A: rrc_r("D"), // RRC D
		0xCB0B: rrc_r("E"), // RRC E
		0xCB0C: rrc_r("H"), // RRC H
		0xCB0D: rrc_r("L"), // RRC L
		0xCB0E:function () { // RRC (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB0F: rrc_r("A"), // RRC A
		0xCB10: rl_r("B"), // RL B
		0xCB11: rl_r("C"), // RL C
		0xCB12: rl_r("D"), // RL D
		0xCB13: rl_r("E"), // RL E
		0xCB14: rl_r("H"), // RL H
		0xCB15: rl_r("L"), // RL L
		0xCB16:function () { // RL (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			shl8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB17: rl_r("A"), // RL A
		0xCB18: rr_r("B"), // RR B
		0xCB19: rr_r("C"), // RR C
		0xCB1A: rr_r("D"), // RR D
		0xCB1B: rr_r("E"), // RR E
		0xCB1C: rr_r("H"), // RR H
		0xCB1D: rr_r("L"), // RR L
		0xCB1E:function () { // RR (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			shr8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB1F: rr_r("A"), // RR A
		0xCB20: sla_r("B"), // SLA B
		0xCB21: sla_r("C"), // SLA C
		0xCB22: sla_r("D"), // SLA D
		0xCB23: sla_r("E"), // SLA E
		0xCB24: sla_r("H"), // SLA H
		0xCB25: sla_r("L"), // SLA L
		0xCB26:function () { // SLA (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			shl8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB27: sla_r("A"), // SLA A
		0xCB28: sra_r("B"), // SRA B
		0xCB29: sra_r("C"), // SRA C
		0xCB2A: sra_r("D"), // SRA D
		0xCB2B: sra_r("E"), // SRA E
		0xCB2C: sra_r("H"), // SRA H
		0xCB2D: sra_r("L"), // SRA L
		0xCB2E:function () { // SRA (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB2F: sra_r("A"), // SRA A
		0xCB30: sll_r("B"), // SLL B*
		0xCB31: sll_r("C"), // SLL C*
		0xCB32: sll_r("D"), // SLL D*
		0xCB33: sll_r("E"), // SLL E*
		0xCB34: sll_r("H"), // SLL H*
		0xCB35: sll_r("L"), // SLL L*
		0xCB36:function () { // SLL (HL)*
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			shl8(this._mmu.r8(addr), 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB37: sll_r("A"), // SLL A*
		0xCB38: srl_r("B"), // SRL B
		0xCB39: srl_r("C"), // SRL C
		0xCB3A: srl_r("D"), // SRL D
		0xCB3B: srl_r("E"), // SRL E
		0xCB3C: srl_r("H"), // SRL H
		0xCB3D: srl_r("L"), // SRL L
		0xCB3E:function () { // SRL (HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			shr8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xCB3F: srl_r("A"), // SRL A
		0xCB40: bit_n_r(0,"B"), // BIT 0,B
		0xCB41: bit_n_r(0,"C"), // BIT 0,C
		0xCB42: bit_n_r(0,"D"), // BIT 0,D
		0xCB43: bit_n_r(0,"E"), // BIT 0,E
		0xCB44: bit_n_r(0,"H"), // BIT 0,H
		0xCB45: bit_n_r(0,"L"), // BIT 0,L
		0xCB46: bit_n_ihl(0), // BIT 0,(HL)
		0xCB47: bit_n_r(0,"A"), // BIT 0,A
		0xCB48: bit_n_r(1,"B"), // BIT 1,B
		0xCB49: bit_n_r(1,"C"), // BIT 1,C
		0xCB4A: bit_n_r(1,"D"), // BIT 1,D
		0xCB4B: bit_n_r(1,"E"), // BIT 1,E
		0xCB4C: bit_n_r(1,"H"), // BIT 1,H
		0xCB4D: bit_n_r(1,"L"), // BIT 1,L
		0xCB4E: bit_n_ihl(1), // BIT 1,(HL)
		0xCB4F: bit_n_r(1,"A"), // BIT 1,A
		0xCB50: bit_n_r(2,"B"), // BIT 2,B
		0xCB51: bit_n_r(2,"C"), // BIT 2,C
		0xCB52: bit_n_r(2,"D"), // BIT 2,D
		0xCB53: bit_n_r(2,"E"), // BIT 2,E
		0xCB54: bit_n_r(2,"H"), // BIT 2,H
		0xCB55: bit_n_r(2,"L"), // BIT 2,L
		0xCB56: bit_n_ihl(2), // BIT 2,(HL)
		0xCB57: bit_n_r(2,"A"), // BIT 2,A
		0xCB58: bit_n_r(3,"B"), // BIT 3,B
		0xCB59: bit_n_r(3,"C"), // BIT 3,C
		0xCB5A: bit_n_r(3,"D"), // BIT 3,D
		0xCB5B: bit_n_r(3,"E"), // BIT 3,E
		0xCB5C: bit_n_r(3,"H"), // BIT 3,H
		0xCB5D: bit_n_r(3,"L"), // BIT 3,L
		0xCB5E: bit_n_ihl(3), // BIT 3,(HL)
		0xCB5F: bit_n_r(3,"A"), // BIT 3,A
		0xCB60: bit_n_r(4,"B"), // BIT 4,B
		0xCB61: bit_n_r(4,"C"), // BIT 4,C
		0xCB62: bit_n_r(4,"D"), // BIT 4,D
		0xCB63: bit_n_r(4,"E"), // BIT 4,E
		0xCB64: bit_n_r(4,"H"), // BIT 4,H
		0xCB65: bit_n_r(4,"L"), // BIT 4,L
		0xCB66: bit_n_ihl(4), // BIT 4,(HL)
		0xCB67: bit_n_r(4,"A"), // BIT 4,A
		0xCB68: bit_n_r(5,"B"), // BIT 5,B
		0xCB69: bit_n_r(5,"C"), // BIT 5,C
		0xCB6A: bit_n_r(5,"D"), // BIT 5,D
		0xCB6B: bit_n_r(5,"E"), // BIT 5,E
		0xCB6C: bit_n_r(5,"H"), // BIT 5,H
		0xCB6D: bit_n_r(5,"L"), // BIT 5,L
		0xCB6E: bit_n_ihl(5), // BIT 5,(HL)
		0xCB6F: bit_n_r(5,"A"), // BIT 5,A
		0xCB70: bit_n_r(6,"B"), // BIT 6,B
		0xCB71: bit_n_r(6,"C"), // BIT 6,C
		0xCB72: bit_n_r(6,"D"), // BIT 6,D
		0xCB73: bit_n_r(6,"E"), // BIT 6,E
		0xCB74: bit_n_r(6,"H"), // BIT 6,H
		0xCB75: bit_n_r(6,"L"), // BIT 6,L
		0xCB76: bit_n_ihl(6), // BIT 6,(HL)
		0xCB77: bit_n_r(6,"A"), // BIT 6,A
		0xCB78: bit_n_r(7,"B"), // BIT 7,B
		0xCB79: bit_n_r(7,"C"), // BIT 7,C
		0xCB7A: bit_n_r(7,"D"), // BIT 7,D
		0xCB7B: bit_n_r(7,"E"), // BIT 7,E
		0xCB7C: bit_n_r(7,"H"), // BIT 7,H
		0xCB7D: bit_n_r(7,"L"), // BIT 7,L
		0xCB7E: bit_n_ihl(7), // BIT 7,(HL)
		0xCB7F: bit_n_r(7,"A"), // BIT 7,A
		0xCB80:function () { // RES 0,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x01;
		},
		0xCB81:function () { // RES 0,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x01;
		},
		0xCB82:function () { // RES 0,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x01;
		},
		0xCB83:function () { // RES 0,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x01;
		},
		0xCB84:function () { // RES 0,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x01;
		},
		0xCB85:function () { // RES 0,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x01;
		},
		0xCB86:function () { // RES 0,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
		},
		0xCB87:function () { // RES 0,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x01;
		},
		0xCB88:function () { // RES 1,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x02;
		},
		0xCB89:function () { // RES 1,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x02;
		},
		0xCB8A:function () { // RES 1,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x02;
		},
		0xCB8B:function () { // RES 1,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x02;
		},
		0xCB8C:function () { // RES 1,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x02;
		},
		0xCB8D:function () { // RES 1,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x02;
		},
		0xCB8E:function () { // RES 1,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
		},
		0xCB8F:function () { // RES 1,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x02;
		},
		0xCB90:function () { // RES 2,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x04;
		},
		0xCB91:function () { // RES 2,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x04;
		},
		0xCB92:function () { // RES 2,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x04;
		},
		0xCB93:function () { // RES 2,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x04;
		},
		0xCB94:function () { // RES 2,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x04;
		},
		0xCB95:function () { // RES 2,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x04;
		},
		0xCB96:function () { // RES 2,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
		},
		0xCB97:function () { // RES 2,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x04;
		},
		0xCB98:function () { // RES 3,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x08;
		},
		0xCB99:function () { // RES 3,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x08;
		},
		0xCB9A:function () { // RES 3,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x08;
		},
		0xCB9B:function () { // RES 3,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x08;
		},
		0xCB9C:function () { // RES 3,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x08;
		},
		0xCB9D:function () { // RES 3,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x08;
		},
		0xCB9E:function () { // RES 3,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
		},
		0xCB9F:function () { // RES 3,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x08;
		},
		0xCBA0:function () { // RES 4,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x10;
		},
		0xCBA1:function () { // RES 4,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x10;
		},
		0xCBA2:function () { // RES 4,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x10;
		},
		0xCBA3:function () { // RES 4,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x10;
		},
		0xCBA4:function () { // RES 4,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x10;
		},
		0xCBA5:function () { // RES 4,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x10;
		},
		0xCBA6:function () { // RES 4,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
		},
		0xCBA7:function () { // RES 4,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x10;
		},
		0xCBA8:function () { // RES 5,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x20;
		},
		0xCBA9:function () { // RES 5,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x20;
		},
		0xCBAA:function () { // RES 5,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x20;
		},
		0xCBAB:function () { // RES 5,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x20;
		},
		0xCBAC:function () { // RES 5,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x20;
		},
		0xCBAD:function () { // RES 5,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x20;
		},
		0xCBAE:function () { // RES 5,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
		},
		0xCBAF:function () { // RES 5,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x20;
		},
		0xCBB0:function () { // RES 6,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x40;
		},
		0xCBB1:function () { // RES 6,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x40;
		},
		0xCBB2:function () { // RES 6,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x40;
		},
		0xCBB3:function () { // RES 6,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x40;
		},
		0xCBB4:function () { // RES 6,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x40;
		},
		0xCBB5:function () { // RES 6,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x40;
		},
		0xCBB6:function () { // RES 6,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
		},
		0xCBB7:function () { // RES 6,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x40;
		},
		0xCBB8:function () { // RES 7,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B & ~0x80;
		},
		0xCBB9:function () { // RES 7,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C & ~0x80;
		},
		0xCBBA:function () { // RES 7,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D & ~0x80;
		},
		0xCBBB:function () { // RES 7,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E & ~0x80;
		},
		0xCBBC:function () { // RES 7,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H & ~0x80;
		},
		0xCBBD:function () { // RES 7,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L & ~0x80;
		},
		0xCBBE:function () { // RES 7,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
		},
		0xCBBF:function () { // RES 7,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A & ~0x80;
		},
		0xCBC0:function () { // SET 0,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x01;
		},
		0xCBC1:function () { // SET 0,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x01;
		},
		0xCBC2:function () { // SET 0,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x01;
		},
		0xCBC3:function () { // SET 0,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x01;
		},
		0xCBC4:function () { // SET 0,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x01;
		},
		0xCBC5:function () { // SET 0,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x01;
		},
		0xCBC6:function () { // SET 0,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
		},
		0xCBC7:function () { // SET 0,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x01;
		},
		0xCBC8:function () { // SET 1,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x02;
		},
		0xCBC9:function () { // SET 1,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x02;
		},
		0xCBCA:function () { // SET 1,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x02;
		},
		0xCBCB:function () { // SET 1,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x02;
		},
		0xCBCC:function () { // SET 1,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x02;
		},
		0xCBCD:function () { // SET 1,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x02;
		},
		0xCBCE:function () { // SET 1,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
		},
		0xCBCF:function () { // SET 1,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x02;
		},
		0xCBD0:function () { // SET 2,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x04;
		},
		0xCBD1:function () { // SET 2,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x04;
		},
		0xCBD2:function () { // SET 2,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x04;
		},
		0xCBD3:function () { // SET 2,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x04;
		},
		0xCBD4:function () { // SET 2,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x04;
		},
		0xCBD5:function () { // SET 2,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x04;
		},
		0xCBD6:function () { // SET 2,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
		},
		0xCBD7:function () { // SET 2,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x04;
		},
		0xCBD8:function () { // SET 3,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x08;
		},
		0xCBD9:function () { // SET 3,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x08;
		},
		0xCBDA:function () { // SET 3,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x08;
		},
		0xCBDB:function () { // SET 3,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x08;
		},
		0xCBDC:function () { // SET 3,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x08;
		},
		0xCBDD:function () { // SET 3,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x08;
		},
		0xCBDE:function () { // SET 3,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
		},
		0xCBDF:function () { // SET 3,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x08;
		},
		0xCBE0:function () { // SET 4,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x10;
		},
		0xCBE1:function () { // SET 4,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x10;
		},
		0xCBE2:function () { // SET 4,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x10;
		},
		0xCBE3:function () { // SET 4,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x10;
		},
		0xCBE4:function () { // SET 4,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x10;
		},
		0xCBE5:function () { // SET 4,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x10;
		},
		0xCBE6:function () { // SET 4,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
		},
		0xCBE7:function () { // SET 4,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x10;
		},
		0xCBE8:function () { // SET 5,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x20;
		},
		0xCBE9:function () { // SET 5,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x20;
		},
		0xCBEA:function () { // SET 5,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x20;
		},
		0xCBEB:function () { // SET 5,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x20;
		},
		0xCBEC:function () { // SET 5,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x20;
		},
		0xCBED:function () { // SET 5,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x20;
		},
		0xCBEE:function () { // SET 5,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
		},
		0xCBEF:function () { // SET 5,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x20;
		},
		0xCBF0:function () { // SET 6,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x40;
		},
		0xCBF1:function () { // SET 6,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x40;
		},
		0xCBF2:function () { // SET 6,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x40;
		},
		0xCBF3:function () { // SET 6,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x40;
		},
		0xCBF4:function () { // SET 6,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x40;
		},
		0xCBF5:function () { // SET 6,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x40;
		},
		0xCBF6:function () { // SET 6,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
		},
		0xCBF7:function () { // SET 6,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x40;
		},
		0xCBF8:function () { // SET 7,B
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.B | 0x80;
		},
		0xCBF9:function () { // SET 7,C
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.C | 0x80;
		},
		0xCBFA:function () { // SET 7,D
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.D | 0x80;
		},
		0xCBFB:function () { // SET 7,E
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.E | 0x80;
		},
		0xCBFC:function () { // SET 7,H
			this._op_t = 8;
			this._op_m = 2;
			this._s.H = this._s.H | 0x80;
		},
		0xCBFD:function () { // SET 7,L
			this._op_t = 8;
			this._op_m = 2;
			this._s.L = this._s.L | 0x80;
		},
		0xCBFE:function () { // SET 7,(HL)
			this._op_t = 15;
			this._op_m = 2;
			var addr = this._s.HL;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
		},
		0xCBFF:function () { // SET 7,A
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.A | 0x80;
		},
		0xCC:function () { // CALL Z,nn
			if (this._s.F & F_Z) {
				this._op_t = 17;
				this._op_m = 0;
				var pc = this._s.PC;
				this._op_nn = this._mmu.r16(pc+1);
				this.push16(pc + 3);
				this._s.PC = this._op_nn;
			}
			else {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xCD:function () { // CALL nn
			this._op_t = 17;
			this._op_m = 0;
			var pc = this._s.PC;
			this._op_nn = this._mmu.r16(pc+1);
			this.push16(pc+3);
			this._s.PC = this._op_nn;
		},
		0xCE:function () { // ADC A,n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			add8(this._s.A, this._op_n, this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xCF:function () { // RST 08H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x08;
		},
		0xD0:function () { // RET NC
			if (this._s.F & F_C) {
				this._op_t = 5;
				this._op_m = 1;
			}
			else {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
		},
		0xD1:function () { // POP DE
			this._op_t = 10;
			this._op_m = 1;
			this._s.DE = this.pop16();
		},
		0xD2:function () { // JP NC,nn
			this._op_t = 10;
			if (this._s.F & F_C) {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
		},
		0xD3:function () { // OUT (n),A
			this._op_t = 11;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._out(this._op_n, this._s.A, this._s.A);
		},
		0xD4:function () { // CALL NC,nn
			if (this._s.F & F_C) {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
		},
		0xD5:function () { // PUSH DE
			this._op_t = 11;
			this._op_m = 1;
			this.push16(this._s.DE);
		},
		0xD6:function () { // SUB n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			sub8(this._s.A, this._op_n, 0, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0xD7:function () { // RST 10H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x10;
		},
		0xD8:function () { // RET C
			if (this._s.F & F_C) {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
			else {
				this._op_t = 5;
				this._op_m = 1;
			}
		},
		0xD9:function () { // EXX
			this._op_t = 4;
			this._op_m = 1;
			var b = this._s.B; this._s.B = this._s.Ba; this._s.Ba = b;
			var c = this._s.C; this._s.C = this._s.Ca; this._s.Ca = c;
			var d = this._s.D; this._s.D = this._s.Da; this._s.Da = d;
			var e = this._s.E; this._s.E = this._s.Ea; this._s.Ea = e;
			var h = this._s.H; this._s.H = this._s.Ha; this._s.Ha = h;
			var l = this._s.L; this._s.L = this._s.La; this._s.La = l;
		},
		0xDA:function () { // JP C,nn
			this._op_t = 10;
			if (this._s.F & F_C) {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
			else {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xDB:function () { // IN A,(n)
			this._op_t = 11;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._s.A = this._in(this._op_n, this._s.A);
		},
		0xDC:function () { // CALL C,nn
			if (this._s.F & F_C) {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
			else {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xDD:function () { // DD
			this._op_t = 4;
			this._op_m = 1;
		},
		0xDD09: add_ss_ss("IX", "BC"), // ADD IX,BC
		0xDD19: add_ss_ss("IX", "DE"), // ADD IX,DE
		0xDD21: ld_ss_nn("IX"), // LD IX,nn
		0xDD22:function () { // LD (nn),IX
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.IX);
		},
		0xDD23: inc_ss("IX"), // INC IX
		0xDD24: inc_r("IXH"), // INC IXH*
		0xDD25: dec_r("IXH"), // DEC IXH*
		0xDD26: ld_r_n("IXH"), // LD IXH,n*
		0xDD29: add_ss_ss("IX", "IX"), // ADD IX,IX
		0xDD2A:function () { // LD IX,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.IX = this._mmu.r16(this._op_nn);
		},
		0xDD2B: dec_ss("IX"), // DEC IX
		0xDD2C: inc_r("IXL"), // INC IXL*
		0xDD2D: dec_r("IXL"), // DEC IXL*
		0xDD2E: ld_r_n("IXL"), // LD IXL,n*
		0xDD34:function () { // INC (IX+d)
			this._op_t = 23;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			add8(this._mmu.r8(addr), 1, 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask); 
		},
		0xDD35:function () { // DEC (IX+d)
			this._op_t = 23;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			sub8(this._mmu.r8(addr), 1, 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask); 
		},
		0xDD36:function () { // LD (IX+d),n
			this._op_t = 19;
			this._op_m = 4;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._mmu.r8(this._s.PC+3));
		},
		0xDD39: add_ss_ss("IX", "SP"), // ADD IX,SP
		0xDD44:function () { // LD B,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.IXH;
		},
		0xDD45:function () { // LD B,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.IXL;
		},
		0xDD46:function () { // LD B,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.B = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD4C:function () { // LD C,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.IXH;
		},
		0xDD4D:function () { // LD C,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.IXL;
		},
		0xDD4E:function () { // LD C,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.C = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD54:function () { // LD D,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.IXH;
		},
		0xDD55:function () { // LD D,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.IXL;
		},
		0xDD56:function () { // LD D,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.D = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD5C:function () { // LD E,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.IXH;
		},
		0xDD5D:function () { // LD E,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.IXL;
		},
		0xDD5E:function () { // LD E,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.E = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD60:function () { // LD IXH,B*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.B;
		},
		0xDD61:function () { // LD IXH,C*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.C;
		},
		0xDD62:function () { // LD IXH,D*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.D;
		},
		0xDD63:function () { // LD IXH,E*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.E;
		},
		0xDD64:function () { // LD IXH,IXH*
			this._op_t = 8;
			this._op_m = 2;
		},
		0xDD65:function () { // LD IXH,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.IXL;
		},
		0xDD66:function () { // LD H,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.H = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD67:function () { // LD IXH,A*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXH = this._s.A;
		},
		0xDD68:function () { // LD IXL,B*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.B;
		},
		0xDD69:function () { // LD IXL,C*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.C;
		},
		0xDD6A:function () { // LD IXL,D*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.D;
		},
		0xDD6B:function () { // LD IXL,E*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.E;
		},
		0xDD6C:function () { // LD IXL,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.IXH;
		},
		0xDD6D:function () { // LD IXL,IXL*
			this._op_t = 8;
			this._op_m = 2;
		},
		0xDD6E:function () { // LD L,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.L = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD6F:function () { // LD IXL,A*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IXL = this._s.A;
		},
		0xDD70:function () { // LD (IX+d),B
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.B);
		},
		0xDD71:function () { // LD (IX+d),C
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.C);
		},
		0xDD72:function () { // LD (IX+d),D
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.D);
		},
		0xDD73:function () { // LD (IX+d),E
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.E);
		},
		0xDD74:function () { // LD (IX+d),H
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.H);
		},
		0xDD75:function () { // LD (IX+d),L
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.L);
		},
		0xDD77:function () { // LD (IX+d),A
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IX + this._op_displ, this._s.A);
		},
		0xDD7C:function () { // LD A,IXH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.IXH;
		},
		0xDD7D:function () { // LD A,IXL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.IXL;
		},
		0xDD7E:function () { // LD A,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.A = this._mmu.r8(this._s.IX + this._op_displ);
		},
		0xDD84: add_a_r("IXH"), // ADD A,IXH*
		0xDD85: add_a_r("IXL"), // ADD A,IXL*
		0xDD86:function () { // ADD A,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			add8(this._s.A, this._mmu.r8(this._s.IX + this._op_displ), 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xDD8C: adc_a_r("IXH"), // ADC A,IXH*
		0xDD8D: adc_a_r("IXL"), // ADC A,IXL*
		0xDD8E:function () { // ADC A,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			add8(this._s.A, this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xDD94: sub_r("IXH"), // SUB IXH*
		0xDD95: sub_r("IXL"), // SUB IXL*
		0xDD96:function () { // SUB (IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			sub8(this._s.A, this._mmu.r8(addr), 0, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0xDD9C: sbc_a_r("IXH"), // SBC A,IXH*
		0xDD9D: sbc_a_r("IXL"), // SBC A,IXL*
		0xDD9E:function () { // SBC A,(IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			sub8(this._s.A, this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0xDDA4: and_r("IXH"), // AND IXH*
		0xDDA5: and_r("IXL"), // AND IXL*
		0xDDA6:function () { // AND (IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			this._s.A &= this._mmu.r8(addr);
			this._s.F = SZ53Ptable[this._s.A] | F_H;
		},
		0xDDAC: xor_r("IXH"), // XOR IXH*
		0xDDAD: xor_r("IXL"), // XOR IXL*
		0xDDAE:function () { // XOR (IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IX + this._op_displ;
			this._s.A ^= this._mmu.r8(addr);
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xDDB4: or_r("IXH"), // OR IXH*
		0xDDB5: or_r("IXL"), // OR IXL*
		0xDDB6:function () { // OR (IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var val = this._mmu.r8(this._s.IX + this._op_displ);
			this._s.A |= val;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xDDBC: cp_r("IXH"), // CP IXH*
		0xDDBD: cp_r("IXL"), // CP IXL*
		0xDDBE:function () { // CP (IX+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var rhs = this._mmu.r8(this._s.IX + this._op_displ);
			sub8(this._s.A, rhs, 0, this._op_alures);
			this._s.F = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
		},
		0xDDCB00: ld_r_rlc_xd("B", "IX"), // LD B,RLC (IX+d)*
		0xDDCB01: ld_r_rlc_xd("C", "IX"), // LD C,RLC (IX+d)*
		0xDDCB02: ld_r_rlc_xd("D", "IX"), // LD D,RLC (IX+d)*
		0xDDCB03: ld_r_rlc_xd("E", "IX"), // LD E,RLC (IX+d)*
		0xDDCB04: ld_r_rlc_xd("H", "IX"), // LD H,RLC (IX+d)*
		0xDDCB05: ld_r_rlc_xd("L", "IX"), // LD L,RLC (IX+d)*
		0xDDCB06:function () { // RLC (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			var val = this._mmu.r8(addr);
			shl8(val, val & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB07: ld_r_rlc_xd("A", "IX"), // LD A,RLC (IX+d)*
		0xDDCB08: ld_r_rrc_xd("B", "IX"), // LD B,RRC (IX+d)*
		0xDDCB09: ld_r_rrc_xd("C", "IX"), // LD C,RRC (IX+d)*
		0xDDCB0A: ld_r_rrc_xd("D", "IX"), // LD D,RRC (IX+d)*
		0xDDCB0B: ld_r_rrc_xd("E", "IX"), // LD E,RRC (IX+d)*
		0xDDCB0C: ld_r_rrc_xd("H", "IX"), // LD H,RRC (IX+d)*
		0xDDCB0D: ld_r_rrc_xd("L", "IX"), // LD L,RRC (IX+d)*
		0xDDCB0E:function () { // RRC (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB0F: ld_r_rrc_xd("A", "IX"), // LD A,RRC (IX+d)*
		0xDDCB10: ld_r_rl_xd("B", "IX"), // LD B,RL (IX+d)*
		0xDDCB11: ld_r_rl_xd("C", "IX"), // LD C,RL (IX+d)*
		0xDDCB12: ld_r_rl_xd("D", "IX"), // LD D,RL (IX+d)*
		0xDDCB13: ld_r_rl_xd("E", "IX"), // LD E,RL (IX+d)*
		0xDDCB14: ld_r_rl_xd("H", "IX"), // LD H,RL (IX+d)*
		0xDDCB15: ld_r_rl_xd("L", "IX"), // LD L,RL (IX+d)*
		0xDDCB16:function () { // RL (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			shl8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB17: ld_r_rl_xd("A", "IX"), // LD A,RL (IX+d)*
		0xDDCB18: ld_r_rr_xd("B", "IX"), // LD B,RR (IX+d)*
		0xDDCB19: ld_r_rr_xd("C", "IX"), // LD C,RR (IX+d)*
		0xDDCB1A: ld_r_rr_xd("D", "IX"), // LD D,RR (IX+d)*
		0xDDCB1B: ld_r_rr_xd("E", "IX"), // LD E,RR (IX+d)*
		0xDDCB1C: ld_r_rr_xd("H", "IX"), // LD H,RR (IX+d)*
		0xDDCB1D: ld_r_rr_xd("L", "IX"), // LD L,RR (IX+d)*
		0xDDCB1E:function () { // RR (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			shr8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB1F: ld_r_rr_xd("A", "IX"), // LD A,RR (IX+d)*
		0xDDCB20: ld_r_sla_xd("B", "IX"), // LD B,SLA (IX+d)*
		0xDDCB21: ld_r_sla_xd("C", "IX"), // LD C,SLA (IX+d)*
		0xDDCB22: ld_r_sla_xd("D", "IX"), // LD D,SLA (IX+d)*
		0xDDCB23: ld_r_sla_xd("E", "IX"), // LD E,SLA (IX+d)*
		0xDDCB24: ld_r_sla_xd("H", "IX"), // LD H,SLA (IX+d)*
		0xDDCB25: ld_r_sla_xd("L", "IX"), // LD L,SLA (IX+d)*
		0xDDCB26:function () { // SLA (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			shl8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB27: ld_r_sla_xd("A", "IX"), // LD A,SLA (IX+d)*
		0xDDCB28: ld_r_sra_xd("B", "IX"), // LD B,SRA (IX+d)*
		0xDDCB29: ld_r_sra_xd("C", "IX"), // LD C,SRA (IX+d)*
		0xDDCB2A: ld_r_sra_xd("D", "IX"), // LD D,SRA (IX+d)*
		0xDDCB2B: ld_r_sra_xd("E", "IX"), // LD E,SRA (IX+d)*
		0xDDCB2C: ld_r_sra_xd("H", "IX"), // LD H,SRA (IX+d)*
		0xDDCB2D: ld_r_sra_xd("L", "IX"), // LD L,SRA (IX+d)*
		0xDDCB2E:function () { // SRA (IX+d)
			this._op_t = 23
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB2F: ld_r_sra_xd("A", "IX"), // LD A,SRA (IX+d)*
		0xDDCB30: ld_r_sll_xd("B", "IX"), // LD B,SLL (IX+d)*
		0xDDCB31: ld_r_sll_xd("C", "IX"), // LD C,SLL (IX+d)*
		0xDDCB32: ld_r_sll_xd("D", "IX"), // LD D,SLL (IX+d)*
		0xDDCB33: ld_r_sll_xd("E", "IX"), // LD E,SLL (IX+d)*
		0xDDCB34: ld_r_sll_xd("H", "IX"), // LD H,SLL (IX+d)*
		0xDDCB35: ld_r_sll_xd("L", "IX"), // LD L,SLL (IX+d)*
		0xDDCB36:function () { // SLL (IX+d)*
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			shl8(this._mmu.r8(addr), 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB37: ld_r_sll_xd("A", "IX"), // LD A,SLL (IX+d)*
		0xDDCB38: ld_r_srl_xd("B", "IX"), // LD B,SRL (IX+d)*
		0xDDCB39: ld_r_srl_xd("C", "IX"), // LD C,SRL (IX+d)*
		0xDDCB3A: ld_r_srl_xd("D", "IX"), // LD D,SRL (IX+d)*
		0xDDCB3B: ld_r_srl_xd("E", "IX"), // LD E,SRL (IX+d)*
		0xDDCB3C: ld_r_srl_xd("H", "IX"), // LD H,SRL (IX+d)*
		0xDDCB3D: ld_r_srl_xd("L", "IX"), // LD L,SRL (IX+d)*
		0xDDCB3E:function () { // SRL (IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			shr8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xDDCB3F: ld_r_srl_xd("A", "IX"), // LD A,SRL (IX+d)*
		0xDDCB40: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB41: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB42: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB43: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB44: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB45: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB46: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)
		0xDDCB47: bit_n_ixyd(0, "IX"), // BIT 0,(IX+d)*
		0xDDCB48: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB49: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB4A: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB4B: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB4C: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB4D: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB4E: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)
		0xDDCB4F: bit_n_ixyd(1, "IX"), // BIT 1,(IX+d)*
		0xDDCB50: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB51: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB52: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB53: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB54: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB55: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB56: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)
		0xDDCB57: bit_n_ixyd(2, "IX"), // BIT 2,(IX+d)*
		0xDDCB58: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB59: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB5A: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB5B: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB5C: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB5D: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB5E: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)
		0xDDCB5F: bit_n_ixyd(3, "IX"), // BIT 3,(IX+d)*
		0xDDCB60: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB61: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB62: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB63: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB64: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB65: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB66: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)
		0xDDCB67: bit_n_ixyd(4, "IX"), // BIT 4,(IX+d)*
		0xDDCB68: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB69: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB6A: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB6B: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB6C: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB6D: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB6E: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)
		0xDDCB6F: bit_n_ixyd(5, "IX"), // BIT 5,(IX+d)*
		0xDDCB70: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB71: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB72: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB73: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB74: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB75: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB76: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)
		0xDDCB77: bit_n_ixyd(6, "IX"), // BIT 6,(IX+d)*
		0xDDCB78: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB79: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB7A: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB7B: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB7C: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB7D: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB7E: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)
		0xDDCB7F: bit_n_ixyd(7, "IX"), // BIT 7,(IX+d)*
		0xDDCB80: ld_r_res_n_xd("B", 0, "IX"),// LD B,RES 0,(IX+d)*
		0xDDCB81: ld_r_res_n_xd("C", 0, "IX"), // LD C,RES 0,(IX+d)*
		0xDDCB82: ld_r_res_n_xd("D", 0, "IX"), // LD D,RES 0,(IX+d)*
		0xDDCB83: ld_r_res_n_xd("E", 0, "IX"), // LD E,RES 0,(IX+d)*
		0xDDCB84: ld_r_res_n_xd("H", 0, "IX"), // LD H,RES 0,(IX+d)*
		0xDDCB85: ld_r_res_n_xd("L", 0, "IX"), // LD L,RES 0,(IX+d)*
		0xDDCB86:function () { // RES 0,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
		},
		0xDDCB87: ld_r_res_n_xd("A", 0, "IX"), // LD A,RES 0,(IX+d)*
		0xDDCB88: ld_r_res_n_xd("B", 1, "IX"), // LD B,RES 1,(IX+d)*
		0xDDCB89: ld_r_res_n_xd("C", 1, "IX"), // LD C,RES 1,(IX+d)*
		0xDDCB8A: ld_r_res_n_xd("D", 1, "IX"), // LD D,RES 1,(IX+d)*
		0xDDCB8B: ld_r_res_n_xd("E", 1, "IX"), // LD E,RES 1,(IX+d)*
		0xDDCB8C: ld_r_res_n_xd("H", 1, "IX"), // LD H,RES 1,(IX+d)*
		0xDDCB8D: ld_r_res_n_xd("L", 1, "IX"), // LD L,RES 1,(IX+d)*
		0xDDCB8E:function () { // RES 1,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
		},
		0xDDCB8F: ld_r_res_n_xd("A", 1, "IX"), // LD A,RES 1,(IX+d)*
		0xDDCB90: ld_r_res_n_xd("B", 2, "IX"), // LD B,RES 2,(IX+d)*
		0xDDCB91: ld_r_res_n_xd("C", 2, "IX"), // LD C,RES 2,(IX+d)*
		0xDDCB92: ld_r_res_n_xd("D", 2, "IX"), // LD D,RES 2,(IX+d)*
		0xDDCB93: ld_r_res_n_xd("E", 2, "IX"), // LD E,RES 2,(IX+d)*
		0xDDCB94: ld_r_res_n_xd("H", 2, "IX"), // LD H,RES 2,(IX+d)*
		0xDDCB95: ld_r_res_n_xd("L", 2, "IX"), // LD L,RES 2,(IX+d)*
		0xDDCB96:function () { // RES 2,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
		},
		0xDDCB97: ld_r_res_n_xd("A", 2, "IX"), // LD A,RES 2,(IX+d)*
		0xDDCB98: ld_r_res_n_xd("B", 3, "IX"), // LD B,RES 3,(IX+d)*
		0xDDCB99: ld_r_res_n_xd("C", 3, "IX"), // LD C,RES 3,(IX+d)*
		0xDDCB9A: ld_r_res_n_xd("D", 3, "IX"), // LD D,RES 3,(IX+d)*
		0xDDCB9B: ld_r_res_n_xd("E", 3, "IX"), // LD E,RES 3,(IX+d)*
		0xDDCB9C: ld_r_res_n_xd("H", 3, "IX"), // LD H,RES 3,(IX+d)*
		0xDDCB9D: ld_r_res_n_xd("L", 3, "IX"), // LD L,RES 3,(IX+d)*
		0xDDCB9E:function () { // RES 3,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
		},
		0xDDCB9F: ld_r_res_n_xd("A", 3, "IX"), // LD A,RES 3,(IX+d)*
		0xDDCBA0: ld_r_res_n_xd("B", 4, "IX"), // LD B,RES 4,(IX+d)*
		0xDDCBA1: ld_r_res_n_xd("C", 4, "IX"), // LD C,RES 4,(IX+d)*
		0xDDCBA2: ld_r_res_n_xd("D", 4, "IX"), // LD D,RES 4,(IX+d)*
		0xDDCBA3: ld_r_res_n_xd("E", 4, "IX"), // LD E,RES 4,(IX+d)*
		0xDDCBA4: ld_r_res_n_xd("H", 4, "IX"), // LD H,RES 4,(IX+d)*
		0xDDCBA5: ld_r_res_n_xd("L", 4, "IX"), // LD L,RES 4,(IX+d)*
		0xDDCBA6:function () { // RES 4,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
		},
		0xDDCBA7: ld_r_res_n_xd("A", 4, "IX"), // LD A,RES 4,(IX+d)*
		0xDDCBA8: ld_r_res_n_xd("B", 5, "IX"), // LD B,RES 5,(IX+d)*
		0xDDCBA9: ld_r_res_n_xd("C", 5, "IX"), // LD C,RES 5,(IX+d)*
		0xDDCBAA: ld_r_res_n_xd("D", 5, "IX"), // LD D,RES 5,(IX+d)*
		0xDDCBAB: ld_r_res_n_xd("E", 5, "IX"), // LD E,RES 5,(IX+d)*
		0xDDCBAC: ld_r_res_n_xd("H", 5, "IX"), // LD H,RES 5,(IX+d)*
		0xDDCBAD: ld_r_res_n_xd("L", 5, "IX"), // LD L,RES 5,(IX+d)*
		0xDDCBAE:function () { // RES 5,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
		},
		0xDDCBAF: ld_r_res_n_xd("A", 5, "IX"), // LD A,RES 5,(IX+d)*
		0xDDCBB0: ld_r_res_n_xd("B", 6, "IX"), // LD B,RES 6,(IX+d)*
		0xDDCBB1: ld_r_res_n_xd("C", 6, "IX"), // LD C,RES 6,(IX+d)*
		0xDDCBB2: ld_r_res_n_xd("D", 6, "IX"), // LD D,RES 6,(IX+d)*
		0xDDCBB3: ld_r_res_n_xd("E", 6, "IX"), // LD E,RES 6,(IX+d)*
		0xDDCBB4: ld_r_res_n_xd("H", 6, "IX"), // LD H,RES 6,(IX+d)*
		0xDDCBB5: ld_r_res_n_xd("L", 6, "IX"), // LD L,RES 6,(IX+d)*
		0xDDCBB6:function () { // RES 6,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
		},
		0xDDCBB7: ld_r_res_n_xd("A", 6, "IX"), // LD A,RES 6,(IX+d)*
		0xDDCBB8: ld_r_res_n_xd("B", 7, "IX"), // LD B,RES 7,(IX+d)*
		0xDDCBB9: ld_r_res_n_xd("C", 7, "IX"), // LD C,RES 7,(IX+d)*
		0xDDCBBA: ld_r_res_n_xd("D", 7, "IX"), // LD D,RES 7,(IX+d)*
		0xDDCBBB: ld_r_res_n_xd("E", 7, "IX"), // LD E,RES 7,(IX+d)*
		0xDDCBBC: ld_r_res_n_xd("H", 7, "IX"), // LD H,RES 7,(IX+d)*
		0xDDCBBD: ld_r_res_n_xd("L", 7, "IX"), // LD L,RES 7,(IX+d)*
		0xDDCBBE:function () { // RES 7,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
		},
		0xDDCBBF: ld_r_res_n_xd("A", 7, "IX"), // LD A,RES 7,(IX+d)*
		0xDDCBC0: ld_r_set_n_xd("B", 0, "IX"), // LD B,SET 0,(IX+d)*
		0xDDCBC1: ld_r_set_n_xd("C", 0, "IX"), // LD C,SET 0,(IX+d)*
		0xDDCBC2: ld_r_set_n_xd("D", 0, "IX"), // LD D,SET 0,(IX+d)*
		0xDDCBC3: ld_r_set_n_xd("E", 0, "IX"), // LD E,SET 0,(IX+d)*
		0xDDCBC4: ld_r_set_n_xd("H", 0, "IX"), // LD H,SET 0,(IX+d)*
		0xDDCBC5: ld_r_set_n_xd("L", 0, "IX"), // LD L,SET 0,(IX+d)*
		0xDDCBC6:function () { // SET 0,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
		},
		0xDDCBC7: ld_r_set_n_xd("A", 0, "IX"), // LD A,SET 0,(IX+d)*
		0xDDCBC8: ld_r_set_n_xd("B", 1, "IX"), // LD B,SET 1,(IX+d)*
		0xDDCBC9: ld_r_set_n_xd("C", 1, "IX"), // LD C,SET 1,(IX+d)*
		0xDDCBCA: ld_r_set_n_xd("D", 1, "IX"), // LD D,SET 1,(IX+d)*
		0xDDCBCB: ld_r_set_n_xd("E", 1, "IX"), // LD E,SET 1,(IX+d)*
		0xDDCBCC: ld_r_set_n_xd("H", 1, "IX"), // LD H,SET 1,(IX+d)*
		0xDDCBCD: ld_r_set_n_xd("L", 1, "IX"), // LD L,SET 1,(IX+d)*
		0xDDCBCE:function () { // SET 1,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
		},
		0xDDCBCF: ld_r_set_n_xd("A", 1, "IX"), // LD A,SET 1,(IX+d)*
		0xDDCBD0: ld_r_set_n_xd("B", 2, "IX"), // LD B,SET 2,(IX+d)*
		0xDDCBD1: ld_r_set_n_xd("C", 2, "IX"), // LD C,SET 2,(IX+d)*
		0xDDCBD2: ld_r_set_n_xd("D", 2, "IX"), // LD D,SET 2,(IX+d)*
		0xDDCBD3: ld_r_set_n_xd("E", 2, "IX"), // LD E,SET 2,(IX+d)*
		0xDDCBD4: ld_r_set_n_xd("H", 2, "IX"), // LD H,SET 2,(IX+d)*
		0xDDCBD5: ld_r_set_n_xd("L", 2, "IX"), // LD L,SET 2,(IX+d)*
		0xDDCBD6:function () { // SET 2,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
		},
		0xDDCBD7: ld_r_set_n_xd("A", 2, "IX"), // LD A,SET 2,(IX+d)*
		0xDDCBD8: ld_r_set_n_xd("B", 3, "IX"), // LD B,SET 3,(IX+d)*
		0xDDCBD9: ld_r_set_n_xd("C", 3, "IX"), // LD C,SET 3,(IX+d)*
		0xDDCBDA: ld_r_set_n_xd("D", 3, "IX"), // LD D,SET 3,(IX+d)*
		0xDDCBDB: ld_r_set_n_xd("E", 3, "IX"), // LD E,SET 3,(IX+d)*
		0xDDCBDC: ld_r_set_n_xd("H", 3, "IX"), // LD H,SET 3,(IX+d)*
		0xDDCBDD: ld_r_set_n_xd("L", 3, "IX"), // LD L,SET 3,(IX+d)*
		0xDDCBDE:function () { // SET 3,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
		},
		0xDDCBDF: ld_r_set_n_xd("A", 3, "IX"), // LD A,SET 3,(IX+d)*
		0xDDCBE0: ld_r_set_n_xd("B", 4, "IX"), // LD B,SET 4,(IX+d)*
		0xDDCBE1: ld_r_set_n_xd("C", 4, "IX"), // LD C,SET 4,(IX+d)*
		0xDDCBE2: ld_r_set_n_xd("D", 4, "IX"), // LD D,SET 4,(IX+d)*
		0xDDCBE3: ld_r_set_n_xd("E", 4, "IX"), // LD E,SET 4,(IX+d)*
		0xDDCBE4: ld_r_set_n_xd("H", 4, "IX"), // LD H,SET 4,(IX+d)*
		0xDDCBE5: ld_r_set_n_xd("L", 4, "IX"), // LD L,SET 4,(IX+d)*
		0xDDCBE6:function () { // SET 4,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
		},
		0xDDCBE7: ld_r_set_n_xd("A", 4, "IX"), // LD A,SET 4,(IX+d)*
		0xDDCBE8: ld_r_set_n_xd("B", 5, "IX"), // LD B,SET 5,(IX+d)*
		0xDDCBE9: ld_r_set_n_xd("C", 5, "IX"), // LD C,SET 5,(IX+d)*
		0xDDCBEA: ld_r_set_n_xd("D", 5, "IX"), // LD D,SET 5,(IX+d)*
		0xDDCBEB: ld_r_set_n_xd("E", 5, "IX"), // LD E,SET 5,(IX+d)*
		0xDDCBEC: ld_r_set_n_xd("H", 5, "IX"), // LD H,SET 5,(IX+d)*
		0xDDCBED: ld_r_set_n_xd("L", 5, "IX"), // LD L,SET 5,(IX+d)*
		0xDDCBEE:function () { // SET 5,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
		},
		0xDDCBEF: ld_r_set_n_xd("A", 5, "IX"), // LD A,SET 5,(IX+d)*
		0xDDCBF0: ld_r_set_n_xd("B", 6, "IX"), // LD B,SET 6,(IX+d)*
		0xDDCBF1: ld_r_set_n_xd("C", 6, "IX"), // LD C,SET 6,(IX+d)*
		0xDDCBF2: ld_r_set_n_xd("D", 6, "IX"), // LD D,SET 6,(IX+d)*
		0xDDCBF3: ld_r_set_n_xd("E", 6, "IX"), // LD E,SET 6,(IX+d)*
		0xDDCBF4: ld_r_set_n_xd("H", 6, "IX"), // LD H,SET 6,(IX+d)*
		0xDDCBF5: ld_r_set_n_xd("L", 6, "IX"), // LD L,SET 6,(IX+d)*
		0xDDCBF6:function () { // SET 6,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
		},
		0xDDCBF7: ld_r_set_n_xd("A", 6, "IX"), // LD A,SET 6,(IX+d)*
		0xDDCBF8: ld_r_set_n_xd("B", 7, "IX"), // LD B,SET 7,(IX+d)*
		0xDDCBF9: ld_r_set_n_xd("C", 7, "IX"), // LD C,SET 7,(IX+d)*
		0xDDCBFA: ld_r_set_n_xd("D", 7, "IX"), // LD D,SET 7,(IX+d)*
		0xDDCBFB: ld_r_set_n_xd("E", 7, "IX"), // LD E,SET 7,(IX+d)*
		0xDDCBFC: ld_r_set_n_xd("H", 7, "IX"), // LD H,SET 7,(IX+d)*
		0xDDCBFD: ld_r_set_n_xd("L", 7, "IX"), // LD L,SET 7,(IX+d)*
		0xDDCBFE:function () { // SET 7,(IX+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IX+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
		},
		0xDDCBFF: ld_r_set_n_xd("A", 7, "IX"), // LD A,SET 7,(IX+d)*
		0xDDE1:function () { // POP IX
			this._op_t = 14;
			this._op_m = 2;
			this._s.IX = this.pop16();
		},
		0xDDE3:function () { // EX (SP),IX
			this._op_t = 23;
			this._op_m = 2;
			var addr = this._s.SP;
			var memval = this._mmu.r16(addr);
			this._mmu.w16reverse(addr, this._s.IX);
			this._s.IX = memval;
		},
		0xDDE5:function () { // PUSH IX
			this._op_t = 15;
			this._op_m = 2;
			this.push16(this._s.IX);
		},
		0xDDE9:function () { // JP (IX)
			this._op_t = 8;
			this._op_m = 0;
			this._s.PC = this._s.IX;
		},
		0xDDF9:function () { // LD SP,IX
			this._op_t = 10;
			this._op_m = 2;
			this._s.SP = this._s.IX;
		},
		0xDE:function () { // SBC A,n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			sub8(this._s.A, this._op_n, this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0]
			this._s.F = this._op_alures[1];
		},
		0xDF:function () { // RST 18H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x18;
		},
		0xE0:function () { // RET PO
			if (this._s.F & F_PV) {
				this._op_t = 5;
				this._op_m = 1;
			}
			else {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
		},
		0xE1:function () { // POP HL
			this._op_t = 10;
			this._op_m = 1;
			this._s.HL = this.pop16();
		},
		0xE2:function () { // JP PO,nn
			this._op_t = 10;
			if (this._s.F & F_PV) {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
		},
		0xE3:function () { // EX (SP),HL
			this._op_t = 19;
			this._op_m = 1;
			var addr = this._s.SP;
			var memval = this._mmu.r16(addr);
			this._mmu.w16reverse(addr, this._s.HL);
			this._s.HL = memval;
		},
		0xE4:function () { // CALL PO,nn
			if (this._s.F & F_PV) {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
		},
		0xE5:function () { // PUSH HL
			this._op_t = 11;
			this._op_m = 1;
			this.push16(this._s.HL);
		},
		0xE6:function () { // AND n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._s.A &= this._op_n;
			this._s.F = SZ53Ptable[this._s.A] | F_H;
		},
		0xE7:function () { // RST 20H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x20;
		},
		0xE8:function () { // RET PE
			if (this._s.F & F_PV) {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
			else {
				this._op_t = 5;
				this._op_m = 1;
			}
		},
		0xE9:function () { // JP (HL)
			this._op_t = 4;
			this._op_m = 0;
			this._s.PC = this._s.HL;
		},
		0xEA:function () { // JP PE,nn
			this._op_t = 10;
			if (this._s.F & F_PV) {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
			else {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xEB:function () { // EX DE,HL
			this._op_t = 4;
			this._op_m = 1;
			var DE = this._s.DE;
			this._s.DE = this._s.HL;
			this._s.HL = DE;
		},
		0xEC:function () { // CALL PE,nn
			if (this._s.F & F_PV) {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
			else {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xED:function () { // ED
			throw ("ED");
		},
		0xED00:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED00");
		},
		0xED01:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED01");
		},
		0xED02:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED02");
		},
		0xED03:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED03");
		},
		0xED04:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED04");
		},
		0xED05:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED05");
		},
		0xED06:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED06");
		},
		0xED07:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED07");
		},
		0xED08:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED08");
		},
		0xED09:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED09");
		},
		0xED0A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0A");
		},
		0xED0B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0B");
		},
		0xED0C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0C");
		},
		0xED0D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0D");
		},
		0xED0E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0E");
		},
		0xED0F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED0F");
		},
		0xED10:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED10");
		},
		0xED11:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED11");
		},
		0xED12:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED12");
		},
		0xED13:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED13");
		},
		0xED14:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED14");
		},
		0xED15:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED15");
		},
		0xED16:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED16");
		},
		0xED17:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED17");
		},
		0xED18:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED18");
		},
		0xED19:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED19");
		},
		0xED1A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1A");
		},
		0xED1B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1B");
		},
		0xED1C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1C");
		},
		0xED1D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1D");
		},
		0xED1E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1E");
		},
		0xED1F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED1F");
		},
		0xED20:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED20");
		},
		0xED21:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED21");
		},
		0xED22:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED22");
		},
		0xED23:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED23");
		},
		0xED24:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED24");
		},
		0xED25:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED25");
		},
		0xED26:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED26");
		},
		0xED27:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED27");
		},
		0xED28:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED28");
		},
		0xED29:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED29");
		},
		0xED2A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2A");
		},
		0xED2B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2B");
		},
		0xED2C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2C");
		},
		0xED2D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2D");
		},
		0xED2E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2E");
		},
		0xED2F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED2F");
		},
		0xED30:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED30");
		},
		0xED31:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED31");
		},
		0xED32:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED32");
		},
		0xED33:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED33");
		},
		0xED34:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED34");
		},
		0xED35:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED35");
		},
		0xED36:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED36");
		},
		0xED37:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED37");
		},
		0xED38:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED38");
		},
		0xED39:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED39");
		},
		0xED3A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3A");
		},
		0xED3B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3B");
		},
		0xED3C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3C");
		},
		0xED3D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3D");
		},
		0xED3E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3E");
		},
		0xED3F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED3F");
		},
		0xED40: in_r_c("B"), // IN B,(C)
		0xED41: out_c_r("B"), // OUT (C),B
		0xED42: sbc_ss_ss("HL", "BC"), // SBC HL,BC
		0xED43:function () { // LD (nn),BC
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.BC);
		},
		0xED44: neg_a(), // NEG
		0xED45: retn(), // RETN
		0xED46:function () { // IM 0
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 0;
		},
		0xED47:function () { // LD I,A
			this._op_t = 9;
			this._op_m = 2;
			this._s.I = this._s.A;
		},
		0xED48: in_r_c("C"), // IN C,(C)
		0xED49: out_c_r("C"), // OUT (C),C
		0xED4A: adc_ss_ss("HL", "BC"), // ADC HL,BC
		0xED4B:function () { // LD BC,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.BC = this._mmu.r16(this._op_nn);
		},
		0xED4C: neg_a(), // NEG*
		0xED4D:function () { // RETI
			this._op_t = 14;
			this._op_m = 0;
			this._s.PC = this.pop16();
		},
		0xED4E:function () { // IM 0*
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 0;
		},
		0xED4F:function () { // LD R,A
			this._op_t = 9;
			this._op_m = 2;
			this._s.R = this._s.A;
		},
		0xED50: in_r_c("D"), // IN D,(C)
		0xED51: out_c_r("D"), // OUT (C),D
		0xED52: sbc_ss_ss("HL", "DE"), // SBC HL,DE
		0xED53:function () { // LD (nn),DE
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.DE);
		},
		0xED54: neg_a(), // NEG*
		0xED55: retn(), // RETN*
		0xED56:function () { // IM 1
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 1;
		},
		0xED57:function () { // LD A,I
			this._op_t = 9;
			this._op_m = 2;
			this._s.A = this._s.I;
			this._s.F = (this._s.F & F_C) | SZ53table[this._s.A] | (this._s.IFF2 ? F_PV : 0);
		},
		0xED58: in_r_c("E"), // IN E,(C)
		0xED59: out_c_r("E"), // OUT (C),E
		0xED5A: adc_ss_ss("HL", "DE"), // ADC HL,DE
		0xED5B:function () { // LD DE,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.DE = this._mmu.r16(this._op_nn);
		},
		0xED5C: neg_a(), // NEG*
		0xED5D: retn(), // RETN*
		0xED5E:function () { // IM 2
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 2;
		},
		0xED5F:function () { // LD A,R
			this._op_t = 9;
			this._op_m = 2;
			this._s.A = this._s.R;
			this._s.F = (this._s.F & F_C) | SZ53table[this._s.A] | (this._s.IFF2 ? F_PV : 0);
		},
		0xED60: in_r_c("H"), // IN H,(C)
		0xED61: out_c_r("H"), // OUT (C),H
		0xED62: sbc_ss_ss("HL", "HL"), // SBC HL,HL
		0xED63:function () { // LD (nn), HL
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.HL);
		},
		0xED64: neg_a(), // NEG*
		0xED65: retn(), // RETN*
		0xED66:function () { // IM 0*
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 0;
		},
		0xED67:function () { // RRD
			this._op_t = 18;
			this._op_m = 2;
			var HL = this._s.HL
			var memval = this._mmu.r8(HL);
			this._mmu.w8(HL, ((this._s.A & 0x0F) << 4) | (memval >>> 4));
			this._s.A = (this._s.A & 0xF0) | (memval & 0x0F);
			this._s.F = (this._s.F & F_C) | SZ53Ptable[this._s.A];
		},
		0xED68: in_r_c("L"), // IN L,(C)
		0xED69: out_c_r("L"), // OUT (C),L
		0xED6A: adc_ss_ss("HL", "HL"), // ADC HL,HL
		0xED6B:function () { // LD HL,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.HL = this._mmu.r16(this._op_nn);
		},
		0xED6C: neg_a(), // NEG*
		0xED6D: retn(), // RETN*
		0xED6E: function () { // IM 0
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 0;
		},
		0xED6F:function () { // RLD
			this._op_t = 18;
			this._op_m = 2;
			var HL = this._s.HL
			var memval = this._mmu.r8(HL);
			this._mmu.w8(HL, ((memval & 0x0F) << 4) | (this._s.A & 0x0F));
			this._s.A = (this._s.A & 0xF0) | (memval >>> 4);
			this._s.F = (this._s.F & F_C) | SZ53Ptable[this._s.A];
		},
		0xED70:function () { // IN (C)
			this._op_t = 12;
			this._op_m = 2;
			var val = this._in(this._s.C, this._s.B);
			this._s.F = (this._s.F & F_C) | SZ53Ptable[val];
		},
		0xED71:function () { // OUT (C),0*
			this._op_t = 12;
			this._op_m = 2;
			this._out(this._s.C, 0, this._s.B);
		},
		0xED72: sbc_ss_ss("HL", "SP"), // SBC HL,SP
		0xED73:function () { // LD (nn),SP
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.SP);
		},
		0xED74: neg_a(), // NEG*
		0xED75: retn(), // RETN*
		0xED76:function () { // IM 1*
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 1;
		},
		0xED77:function () { // NOP*
			this._op_t = 4;
			this._op_m = 2;
		},
		0xED78: in_r_c("A"), // IN A,(C)
		0xED79: out_c_r("A"), // OUT (C),A
		0xED7A: adc_ss_ss("HL", "SP"), // ADC HL,SP
		0xED7B:function () { // LD SP,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.SP = this._mmu.r16(this._op_nn);
		},
		0xED7C: neg_a(), // NEG*
		0xED7D: retn(), // RETN*
		0xED7E:function () { // IM 2*
			this._op_t = 8;
			this._op_m = 2;
			this._s.im = 2;
		},
		0xED7F:function () { // NOP*
			this._op_t = 4;
			this._op_m = 2;
		},
		0xED80:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED80");
		},
		0xED81:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED81");
		},
		0xED82:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED82");
		},
		0xED83:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED83");
		},
		0xED84:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED84");
		},
		0xED85:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED85");
		},
		0xED86:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED86");
		},
		0xED87:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED87");
		},
		0xED88:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED88");
		},
		0xED89:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED89");
		},
		0xED8A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8A");
		},
		0xED8B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8B");
		},
		0xED8C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8C");
		},
		0xED8D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8D");
		},
		0xED8E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8E");
		},
		0xED8F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED8F");
		},
		0xED90:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED90");
		},
		0xED91:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED91");
		},
		0xED92:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED92");
		},
		0xED93:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED93");
		},
		0xED94:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED94");
		},
		0xED95:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED95");
		},
		0xED96:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED96");
		},
		0xED97:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED97");
		},
		0xED98:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED98");
		},
		0xED99:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED99");
		},
		0xED9A:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9A");
		},
		0xED9B:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9B");
		},
		0xED9C:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9C");
		},
		0xED9D:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9D");
		},
		0xED9E:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9E");
		},
		0xED9F:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xED9F");
		},
		0xEDA0:function () { // LDI
			this._op_t = 16;
			this._op_m = 2;
			var DE = this._s.DE;
			var HL = this._s.HL;
			var BC = this._s.BC;
			var memval = this._mmu.r8(HL);
			this._mmu.w8(DE, memval);
			DE++;
			HL++;
			BC--;
			this._s.DE = DE;
			this._s.HL = HL;
			this._s.BC = BC;
			memval = (memval + this._s.A) & 0xFF;
			this._s.F =
				(this._s.F & (F_S|F_Z|F_C)) |
				(BC != 0 ? F_PV : 0) |
				(memval & F_3) |
				((memval & 0x02) ? F_5 : 0);
		},
		0xEDA1:function () { // CPI
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var memval = this._mmu.r8(HL);
			sub8(this._s.A, memval, 0, this._op_alures);
			HL++;
			BC--;
			this._s.HL = HL;
			this._s.BC = BC;
			memval = (this._s.A - memval - ((this._op_alures[1] & F_H) ? 1 : 0)) & 0xFF;
			this._s.F =
				F_N |
				(this._s.F & F_C) |
				(this._op_alures[1] & (F_S|F_Z|F_H)) |
				(memval & F_3) |
				((memval & 0x02) ? F_5 : 0) |
				(BC != 0 ? F_PV : 0);
		},
		0xEDA2:function () { // INI
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var regval = this._in(this._s.C, this._s.B);
			this._mmu.w8(HL, regval);
			HL++;
			this._s.HL = HL;
			sub8(this._s.B, 1, 0, this._op_alures);
			this._s.B = this._op_alures[0];
			this._s.F =
				(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
				((regval & 0x80) ? F_N : 0) |
				((regval + ((BC+1) & 0xFF)) > 0xFF ? (F_H|F_C) : 0) |
				(SZ53Ptable[((regval + ((BC+1) & 0xFF)) & 7) ^ this._s.B] & F_PV);
		},
		0xEDA3:function () { // OUTI
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var memval = this._mmu.r8(HL);
			HL++;
			this._s.HL = HL;
			sub8(this._s.B, 1, 0, this._op_alures);
			this._s.B = this._op_alures[0];
			this._out(this._s.C, memval, this._s.B);
			this._s.F =
				(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
				((memval & 0x80) ? F_N : 0) |
				((memval + this._s.L) > 0xFF ? (F_H|F_C) : 0) |
				(SZ53Ptable[((memval + this._s.L) & 7) ^ this._s.B] & F_PV);
		},
		0xEDA4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDA4");
		},
		0xEDA5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDA5");
		},
		0xEDA6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDA6");
		},
		0xEDA7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDA7");
		},
		0xEDA8:function () { // LDD
			this._op_t = 16;
			this._op_m = 2;
			var DE = this._s.DE;
			var HL = this._s.HL;
			var BC = this._s.BC;
			var memval = this._mmu.r8(HL);
			this._mmu.w8(DE, memval);
			DE--;
			HL--;
			BC--;
			this._s.DE = DE;
			this._s.HL = HL;
			this._s.BC = BC;
			memval = (memval + this._s.A) & 0xFF;
			this._s.F =
				(this._s.F & (F_S|F_Z|F_C)) |
				(BC != 0 ? F_PV : 0) |
				(memval & F_3) |
				((memval & 0x02) ? F_5 : 0);
		},
		0xEDA9:function () { // CPD
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var memval = this._mmu.r8(HL);
			sub8(this._s.A, memval, 0, this._op_alures);
			HL--;
			BC--;
			this._s.HL = HL;
			this._s.BC = BC;
			memval = (this._s.A - memval - ((this._op_alures[1] & F_H) ? 1 : 0)) & 0xFF;
			this._s.F =
				F_N |
				(this._s.F & F_C) |
				(this._op_alures[1] & (F_S|F_Z|F_H)) |
				(memval & F_3) |
				((memval & 0x02) ? F_5 : 0) |
				(BC != 0 ? F_PV : 0);
		},
		0xEDAA:function () { // IND
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var regval = this._in(this._s.C, this._s.B);
			this._mmu.w8(HL, regval);
			HL--;
			this._s.HL = HL;
			sub8(this._s.B, 1, 0, this._op_alures);
			this._s.B = this._op_alures[0];
			this._s.F =
				(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
				((regval & 0x80) ? F_N : 0) |
				((regval + ((BC-1) & 0xFF)) > 0xFF ? (F_H|F_C) : 0) |
				(SZ53Ptable[((regval + ((BC-1) & 0xFF)) & 7) ^ this._s.B] & F_PV);
		},
		0xEDAB:function () { // OUTD
			this._op_t = 16;
			this._op_m = 2;
			var BC = this._s.BC;
			var HL = this._s.HL;
			var memval = this._mmu.r8(HL);
			HL--;
			this._s.HL = HL;
			sub8(this._s.B, 1, 0, this._op_alures);
			this._s.B = this._op_alures[0];
			this._out(this._s.C, memval, this._s.B);
			this._s.F =
				(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
				((memval & 0x80) ? F_N : 0) |
				((memval + this._s.L) > 0xFF ? (F_H|F_C) : 0) |
				(SZ53Ptable[((memval + this._s.L) & 7) ^ this._s.B] & F_PV);
		},
		0xEDAC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDAC");
		},
		0xEDAD:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDAD");
		},
		0xEDAE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDAE");
		},
		0xEDAF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDAF");
		},
		0xEDB0:function () { // LDIR
			this._opcodes[0xEDA0].call(this);

			if (this._s.BC !== 0) { // repeat
				this._op_t = 21;
				this._op_m = 0; // repeat this instruction
			}
		},
		0xEDB1:function () { // CPIR
			this._opcodes[0xEDA1].call(this);

			if (this._s.BC != 0 && !(this._s.F & F_Z)) {
				this._op_t = 21;
				this._op_m = 0;
			}
		},
		0xEDB2:function () { // INIR
			this._opcodes[0xEDA2].call(this);

			if (this._s.B != 0) {
				this._op_t = 21;
				this._op_m = 0;
			}
		},
		0xEDB3:function () { // OTIR
			this._opcodes[0xEDA3].call(this);

			if (this._s.B != 0) {
				this._op_t = 21;
				this._op_m = 0;
			}
		},
		0xEDB4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDB4");
		},
		0xEDB5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDB5");
		},
		0xEDB6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDB6");
		},
		0xEDB7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDB7");
		},
		0xEDB8:function () { // LDDR
			this._opcodes[0xEDA8].call(this);

			if (this._s.BC !== 0) { // repeat
				this._op_t = 21;
				this._op_m = 0; // repeat this instruction
			}
		},
		0xEDB9:function () { // CPDR
			this._opcodes[0xEDA9].call(this);

			if (this._s.BC != 0 && !(this._s.F & F_Z)) {
				this._op_t = 21;
				this._op_m = 0;
			}
		},
		0xEDBA:function () { // INDR
			this._opcodes[0xEDAA].call(this);

			if (this._s.B !== 0) { // repeat
				this._op_t = 21;
				this._op_m = 0; // repeat this instruction
			}
		},
		0xEDBB:function () { // OTDR
			this._opcodes[0xEDAB].call(this);

			if (this._s.B !== 0) { // repeat
				this._op_t = 21;
				this._op_m = 0; // repeat this instruction
			}
		},
		0xEDBC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDBC");
		},
		0xEDBD:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDBD");
		},
		0xEDBE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDBE");
		},
		0xEDBF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDBF");
		},
		0xEDC0:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC0");
		},
		0xEDC1:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC1");
		},
		0xEDC2:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC2");
		},
		0xEDC3:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC3");
		},
		0xEDC4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC4");
		},
		0xEDC5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC5");
		},
		0xEDC6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC6");
		},
		0xEDC7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC7");
		},
		0xEDC8:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC8");
		},
		0xEDC9:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDC9");
		},
		0xEDCA:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCA");
		},
		0xEDCB:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCB");
		},
		0xEDCC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCC");
		},
		0xEDCD:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCD");
		},
		0xEDCE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCE");
		},
		0xEDCF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDCF");
		},
		0xEDD0:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD0");
		},
		0xEDD1:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD1");
		},
		0xEDD2:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD2");
		},
		0xEDD3:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD3");
		},
		0xEDD4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD4");
		},
		0xEDD5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD5");
		},
		0xEDD6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD6");
		},
		0xEDD7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD7");
		},
		0xEDD8:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD8");
		},
		0xEDD9:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDD9");
		},
		0xEDDA:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDA");
		},
		0xEDDB:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDB");
		},
		0xEDDC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDC");
		},
		0xEDDD:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDD");
		},
		0xEDDE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDE");
		},
		0xEDDF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDDF");
		},
		0xEDE0:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE0");
		},
		0xEDE1:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE1");
		},
		0xEDE2:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE2");
		},
		0xEDE3:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE3");
		},
		0xEDE4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE4");
		},
		0xEDE5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE5");
		},
		0xEDE6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE6");
		},
		0xEDE7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE7");
		},
		0xEDE8:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE8");
		},
		0xEDE9:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDE9");
		},
		0xEDEA:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDEA");
		},
		0xEDEB:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDEB");
		},
		0xEDEC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDEC");
		},
		0xEDED:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDED");
		},
		0xEDEE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDEE");
		},
		0xEDEF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDEF");
		},
		0xEDF0:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF0");
		},
		0xEDF1:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF1");
		},
		0xEDF2:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF2");
		},
		0xEDF3:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF3");
		},
		0xEDF4:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF4");
		},
		0xEDF5:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF5");
		},
		0xEDF6:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF6");
		},
		0xEDF7:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF7");
		},
		0xEDF8:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF8");
		},
		0xEDF9:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDF9");
		},
		0xEDFA:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFA");
		},
		0xEDFB:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFB");
		},
		0xEDFC:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFC");
		},
		0xEDFD:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFD");
		},
		0xEDFE:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFE");
		},
		0xEDFF:function () { //
			this._op_t = 0;
			this._op_m = 0;
			throw ("not implemented 0xEDFF");
		},
		0xEE:function () { // XOR n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._s.A = (this._s.A ^ this._op_n) & 0xFF;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xEF:function () { // RST 28H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x28;
		},
		0xF0:function () { // RET P
			if (this._s.F & F_S) {
				this._op_t = 5;
				this._op_m = 1;
			}
			else {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
		},
		0xF1:function () { // POP AF
			this._op_t = 10;
			this._op_m = 1;
			this._s.AF = this.pop16();
		},
		0xF2:function () { // JP P,nn
			this._op_t = 10;
			if (this._s.F & F_S) {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
				this._op_m = 0;
			}
		},
		0xF3:function () { // DI
			this._op_t = 4;
			this._op_m = 1;
			this._s.IFF1 = 0;
			this._s.IFF2 = 0;
		},
		0xF4:function () { // CALL P,nn
			if (this._s.F & F_S) {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
			else {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
		},
		0xF5:function () { // PUSH AF
			this._op_t = 11;
			this._op_m = 1;
			this.push16(this._s.AF);
		},
		0xF6:function () { // OR n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			this._s.A = this._s.A | this._op_n;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xF7:function () { // RST 30H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x30;
		},
		0xF8:function () { // RET M
			if (this._s.F & F_S) {
				this._op_t = 11;
				this._op_m = 0;
				this._s.PC = this.pop16();
			}
			else {
				this._op_t = 5;
				this._op_m = 1;
			}
		},
		0xF9:function () { // LD SP,HL
			this._op_t = 6;
			this._op_m = 1;
			this._s.SP = this._s.HL;
		},
		0xFA:function () { // JP M,nn
			this._op_t = 10;
			if (this._s.F & F_S) {
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this._s.PC = this._op_nn;
			}
			else {
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xFB:function () { // EI
			this._op_t = 4;
			this._op_m = 1;
			this._s.IFF1 = 1;
			this._s.IFF2 = 1; //TODO: does not take effect until the end of next instr
		},
		0xFC:function () { // CALL M,nn
			if (this._s.F & F_S) {
				this._op_t = 17;
				this._op_m = 0;
				this._op_nn = this._mmu.r16(this._s.PC+1);
				this.push16(this._s.PC+3);
				this._s.PC = this._op_nn;
			}
			else {
				this._op_t = 10;
				this._op_m = 3;
				this._op_nn = this._mmu.r16nolog(this._s.PC+1);
			}
		},
		0xFD:function () { // FD
			this._op_t = 4;
			this._op_m = 1;
		},
		0xFD09: add_ss_ss("IY", "BC"), // ADD IY,BC
		0xFD19: add_ss_ss("IY", "DE"), // ADD IY,DE
		0xFD21: ld_ss_nn("IY"), // LD IY,nn
		0xFD22:function () { // LD (nn),IY
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._mmu.w16(this._op_nn, this._s.IY);
		},
		0xFD23: inc_ss("IY"), // INC IY
		0xFD24: inc_r("IYH"), // INC IYH*
		0xFD25: dec_r("IYH"), // DEC IYH*
		0xFD26: ld_r_n("IYH"), // LD IYH,n*
		0xFD29: add_ss_ss("IY", "IY"), // ADD IY,IY
		0xFD2A:function () { // LD IY,(nn)
			this._op_t = 20;
			this._op_m = 4;
			this._op_nn = this._mmu.r16(this._s.PC+2);
			this._s.IY = this._mmu.r16(this._op_nn);
		},
		0xFD2B: dec_ss("IY"), // DEC IY
		0xFD2C: inc_r("IYL"), // INC IYL*
		0xFD2D: dec_r("IYL"), // DEC IYL*
		0xFD2E: ld_r_n("IYL"), // LD IYL,n*
		0xFD34:function () { // INC (IY+d)
			this._op_t = 23;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY + this._op_displ;
			add8(this._mmu.r8(addr), 1, 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask);
		},
		0xFD35:function () { // DEC (IY+d)
			this._op_t = 23;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			sub8(this._mmu.r8(addr), 1, 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			var mask = F_C;
			this._s.F = (this._op_alures[1] & ~mask) | (this._s.F & mask);
		},
		0xFD36:function () { // LD (IY+d),n
			this._op_t = 19;
			this._op_m = 4;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._op_n = this._mmu.r8(this._s.PC+3);
			this._mmu.w8(this._s.IY+this._op_displ, this._op_n);
		},
		0xFD39: add_ss_ss("IY", "SP"), // ADD IY,SP
		0xFD44:function () { // LD B,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.IYH;
		},
		0xFD45:function () { // LD B,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.B = this._s.IYL;
		},
		0xFD46:function () { // LD B,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8(this._s.PC+2);
			this._s.B = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD4C:function () { // LD C,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.IYH;
		},
		0xFD4D:function () { // LD C,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.C = this._s.IYL;
		},
		0xFD4E:function () { // LD C,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8(this._s.PC+2);
			this._s.C = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD54:function () { // LD D,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.IYH;
		},
		0xFD55:function () { // LD D,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.D = this._s.IYL;
		},
		0xFD56:function () { // LD D,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.D = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD5C:function () { // LD E,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.IYH;
		},
		0xFD5D:function () { // LD E,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.E = this._s.IYL;
		},
		0xFD5E:function () { // LD E,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.E = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD60:function () { // LD IYH,B*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.B;
		},
		0xFD61:function () { // LD IYH,C*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.C;
		},
		0xFD62:function () { // LD IYH,D*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.D;
		},
		0xFD63:function () { // LD IYH,E*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.E;
		},
		0xFD64:function () { // LD IYH,IYH*
			this._op_t = 8;
			this._op_m = 2;
		},
		0xFD65:function () { // LD IYH,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.IYL;
		},
		0xFD66:function () { // LD H,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.H = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD67:function () { // LD IYH,A*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYH = this._s.A;
		},
		0xFD68:function () { // LD IYL,B*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.B;
		},
		0xFD69:function () { // LD IYL,C*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.C;
		},
		0xFD6A:function () { // LD IYL,D*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.D;
		},
		0xFD6B:function () { // LD IYL,E*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.E;
		},
		0xFD6C:function () { // LD IYL,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.IYH;
		},
		0xFD6D:function () { // LD IYL,IYL*
			this._op_t = 8;
			this._op_m = 2;
		},
		0xFD6E:function () { // LD L,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.L = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD6F:function () { // LD IYL,A*
			this._op_t = 8;
			this._op_m = 2;
			this._s.IYL = this._s.A;
		},
		0xFD70:function () { // LD (IY+d),B
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.B);
		},
		0xFD71:function () { // LD (IY+d),C
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.C);
		},
		0xFD72:function () { // LD (IY+d),D
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.D);
		},
		0xFD73:function () { // LD (IY+d),E
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.E);
		},
		0xFD74:function () { // LD (IY+d),H
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.H);
		},
		0xFD75:function () { // LD (IY+d),L
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.L);
		},
		0xFD77:function () { // LD (IY+d),A
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._mmu.w8(this._s.IY+this._op_displ, this._s.A);
		},
		0xFD7C:function () { // LD A,IYH*
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.IYH;
		},
		0xFD7D:function () { // LD A,IYL*
			this._op_t = 8;
			this._op_m = 2;
			this._s.A = this._s.IYL;
		},
		0xFD7E:function () { // LD A,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			this._s.A = this._mmu.r8(this._s.IY+this._op_displ);
		},
		0xFD84: add_a_r("IYH"), // ADD A,IYH*
		0xFD85: add_a_r("IYL"), // ADD A,IYL*
		0xFD86:function () { // ADD A,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			add8(this._s.A, this._mmu.r8(this._s.IY+this._op_displ), 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xFD8C: adc_a_r("IYH"), // ADC A,IYH*
		0xFD8D: adc_a_r("IYL"), // ADC A,IYL*
		0xFD8E:function () { // ADC A,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			add8(this._s.A, this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xFD94: sub_r("IYH"), // SUB IYH*
		0xFD95: sub_r("IYL"), // SUB IYL*
		0xFD96:function () { // SUB (IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			sub8(this._s.A, this._mmu.r8(addr), 0, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xFD9C: sbc_a_r("IYH"), // SBC A,IYH*
		0xFD9D: sbc_a_r("IYL"), // SBC A,IYL*
		0xFD9E:function () { // SBC A,(IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			sub8(this._s.A, this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._s.A = this._op_alures[0];
			this._s.F = this._op_alures[1];
		},
		0xFDA4: and_r("IYH"), // AND IYH*
		0xFDA5: and_r("IYL"), // AND IYL*
		0xFDA6:function () { // AND (IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			this._s.A = this._s.A & this._mmu.r8(addr);
			this._s.F = SZ53Ptable[this._s.A] | F_H;
		},
		0xFDAC: xor_r("IYH"), // XOR IYH*
		0xFDAD: xor_r("IYL"), // XOR IYL*
		0xFDAE:function () { // XOR (IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var addr = this._s.IY+this._op_displ;
			this._s.A = (this._s.A ^ this._mmu.r8(addr)) & 0xFF;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xFDB4: or_r("IYH"), // OR IYH*
		0xFDB5: or_r("IYL"), // OR IYL*
		0xFDB6:function () { // OR (IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var val = this._mmu.r8(this._s.IY+this._op_displ);
			this._s.A = (this._s.A | val) & 0xFF;
			this._s.F = SZ53Ptable[this._s.A];
		},
		0xFDBC: cp_r("IYH"), // CP IYH*
		0xFDBD: cp_r("IYL"), // CP IYL*
		0xFDBE:function () { // CP (IY+d)
			this._op_t = 19;
			this._op_m = 3;
			this._op_displ = this._mmu.r8s(this._s.PC+2);
			var rhs = this._mmu.r8(this._s.IY+this._op_displ);
			sub8(this._s.A, rhs, 0, this._op_alures);
			this._s.F = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
		},
		0xFDCB00: ld_r_rlc_xd("B", "IY"), // LD B,RLC (IY+d)*
		0xFDCB01: ld_r_rlc_xd("C", "IY"), // LD C,RLC (IY+d)*
		0xFDCB02: ld_r_rlc_xd("D", "IY"), // LD D,RLC (IY+d)*
		0xFDCB03: ld_r_rlc_xd("E", "IY"), // LD E,RLC (IY+d)*
		0xFDCB04: ld_r_rlc_xd("H", "IY"), // LD H,RLC (IY+d)*
		0xFDCB05: ld_r_rlc_xd("L", "IY"), // LD L,RLC (IY+d)*
		0xFDCB06:function () { // RLC (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			var val = this._mmu.r8(addr);
			shl8(val, val & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB07: ld_r_rlc_xd("A", "IY"), // LD A,RLC (IY+d)*
		0xFDCB08: ld_r_rrc_xd("B", "IY"), // LD B,RRC (IY+d)*
		0xFDCB09: ld_r_rrc_xd("C", "IY"), // LD C,RRC (IY+d)*
		0xFDCB0A: ld_r_rrc_xd("D", "IY"), // LD D,RRC (IY+d)*
		0xFDCB0B: ld_r_rrc_xd("E", "IY"), // LD E,RRC (IY+d)*
		0xFDCB0C: ld_r_rrc_xd("H", "IY"), // LD H,RRC (IY+d)*
		0xFDCB0D: ld_r_rrc_xd("L", "IY"), // LD L,RRC (IY+d)*
		0xFDCB0E:function () { // RRC (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB0F: ld_r_rrc_xd("A", "IY"), // LD A,RRC (IY+d)*
		0xFDCB10: ld_r_rl_xd("B", "IY"), // LD B,RL (IY+d)*
		0xFDCB11: ld_r_rl_xd("C", "IY"), // LD C,RL (IY+d)*
		0xFDCB12: ld_r_rl_xd("D", "IY"), // LD D,RL (IY+d)*
		0xFDCB13: ld_r_rl_xd("E", "IY"), // LD E,RL (IY+d)*
		0xFDCB14: ld_r_rl_xd("H", "IY"), // LD H,RL (IY+d)*
		0xFDCB15: ld_r_rl_xd("L", "IY"), // LD L,RL (IY+d)*
		0xFDCB16:function () { // RL (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			shl8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB17: ld_r_rl_xd("A", "IY"), // LD A,RL (IY+d)*
		0xFDCB18: ld_r_rr_xd("B", "IY"), // LD B,RR (IY+d)*
		0xFDCB19: ld_r_rr_xd("C", "IY"), // LD C,RR (IY+d)*
		0xFDCB1A: ld_r_rr_xd("D", "IY"), // LD D,RR (IY+d)*
		0xFDCB1B: ld_r_rr_xd("E", "IY"), // LD E,RR (IY+d)*
		0xFDCB1C: ld_r_rr_xd("H", "IY"), // LD H,RR (IY+d)*
		0xFDCB1D: ld_r_rr_xd("L", "IY"), // LD L,RR (IY+d)*
		0xFDCB1E:function () { // RR (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			shr8(this._mmu.r8(addr), this._s.F & F_C, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB1F: ld_r_rr_xd("A", "IY"), // LD A,RR (IY+d)*
		0xFDCB20: ld_r_sla_xd("B", "IY"), // LD B,SLA (IY+d)*
		0xFDCB21: ld_r_sla_xd("C", "IY"), // LD C,SLA (IY+d)*
		0xFDCB22: ld_r_sla_xd("D", "IY"), // LD D,SLA (IY+d)*
		0xFDCB23: ld_r_sla_xd("E", "IY"), // LD E,SLA (IY+d)*
		0xFDCB24: ld_r_sla_xd("H", "IY"), // LD H,SLA (IY+d)*
		0xFDCB25: ld_r_sla_xd("L", "IY"), // LD L,SLA (IY+d)*
		0xFDCB26:function () { // SLA (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			shl8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB27: ld_r_sla_xd("A", "IY"), // LD A,SLA (IY+d)*
		0xFDCB28: ld_r_sra_xd("B", "IY"), // LD B,SRA (IY+d)*
		0xFDCB29: ld_r_sra_xd("C", "IY"), // LD C,SRA (IY+d)*
		0xFDCB2A: ld_r_sra_xd("D", "IY"), // LD D,SRA (IY+d)*
		0xFDCB2B: ld_r_sra_xd("E", "IY"), // LD E,SRA (IY+d)*
		0xFDCB2C: ld_r_sra_xd("H", "IY"), // LD H,SRA (IY+d)*
		0xFDCB2D: ld_r_sra_xd("L", "IY"), // LD L,SRA (IY+d)*
		0xFDCB2E:function () { // SRA (IY+d)
			this._op_t = 23
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			var memval = this._mmu.r8(addr);
			shr8(memval, memval & 0x80, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB2F: ld_r_sra_xd("A", "IY"), // LD A,SRA (IY+d)*
		0xFDCB30: ld_r_sll_xd("B", "IY"), // LD B,SLL (IY+d)*
		0xFDCB31: ld_r_sll_xd("C", "IY"), // LD C,SLL (IY+d)*
		0xFDCB32: ld_r_sll_xd("D", "IY"), // LD D,SLL (IY+d)*
		0xFDCB33: ld_r_sll_xd("E", "IY"), // LD E,SLL (IY+d)*
		0xFDCB34: ld_r_sll_xd("H", "IY"), // LD H,SLL (IY+d)*
		0xFDCB35: ld_r_sll_xd("L", "IY"), // LD L,SLL (IY+d)*
		0xFDCB36:function () { // SLL (IY+d)*
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			shl8(this._mmu.r8(addr), 1, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB37: ld_r_sll_xd("A", "IY"), // LD A,SLL (IY+d)*
		0xFDCB38: ld_r_srl_xd("B", "IY"), // LD B,SRL (IY+d)*
		0xFDCB39: ld_r_srl_xd("C", "IY"), // LD C,SRL (IY+d)*
		0xFDCB3A: ld_r_srl_xd("D", "IY"), // LD D,SRL (IY+d)*
		0xFDCB3B: ld_r_srl_xd("E", "IY"), // LD E,SRL (IY+d)*
		0xFDCB3C: ld_r_srl_xd("H", "IY"), // LD H,SRL (IY+d)*
		0xFDCB3D: ld_r_srl_xd("L", "IY"), // LD L,SRL (IY+d)*
		0xFDCB3E:function () { // SRL (IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			shr8(this._mmu.r8(addr), 0, this._op_alures);
			this._mmu.w8(addr, this._op_alures[0]);
			this._s.F = this._op_alures[1];
		},
		0xFDCB3F: ld_r_srl_xd("A", "IY"), // LD A,SRL (IY+d)*
		0xFDCB40: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB41: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB42: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB43: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB44: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB45: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB46: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)
		0xFDCB47: bit_n_ixyd(0,"IY"), // BIT 0,(IY+d)*
		0xFDCB48: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB49: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB4A: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB4B: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB4C: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB4D: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB4E: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)
		0xFDCB4F: bit_n_ixyd(1,"IY"), // BIT 1,(IY+d)*
		0xFDCB50: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB51: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB52: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB53: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB54: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB55: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB56: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)
		0xFDCB57: bit_n_ixyd(2,"IY"), // BIT 2,(IY+d)*
		0xFDCB58: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB59: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB5A: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB5B: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB5C: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB5D: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB5E: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)
		0xFDCB5F: bit_n_ixyd(3,"IY"), // BIT 3,(IY+d)*
		0xFDCB60: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB61: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB62: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB63: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB64: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB65: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB66: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)
		0xFDCB67: bit_n_ixyd(4,"IY"), // BIT 4,(IY+d)*
		0xFDCB68: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB69: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB6A: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB6B: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB6C: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB6D: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB6E: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)
		0xFDCB6F: bit_n_ixyd(5,"IY"), // BIT 5,(IY+d)*
		0xFDCB70: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB71: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB72: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB73: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB74: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB75: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB76: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)
		0xFDCB77: bit_n_ixyd(6,"IY"), // BIT 6,(IY+d)*
		0xFDCB78: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB79: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB7A: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB7B: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB7C: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB7D: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB7E: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)
		0xFDCB7F: bit_n_ixyd(7,"IY"), // BIT 7,(IY+d)*
		0xFDCB80: ld_r_res_n_xd("B", 0, "IY"), // LD B,RES 0,(IY+d)*
		0xFDCB81: ld_r_res_n_xd("C", 0, "IY"), // LD C,RES 0,(IY+d)*
		0xFDCB82: ld_r_res_n_xd("D", 0, "IY"), // LD D,RES 0,(IY+d)*
		0xFDCB83: ld_r_res_n_xd("E", 0, "IY"), // LD E,RES 0,(IY+d)*
		0xFDCB84: ld_r_res_n_xd("H", 0, "IY"), // LD H,RES 0,(IY+d)*
		0xFDCB85: ld_r_res_n_xd("L", 0, "IY"), // LD L,RES 0,(IY+d)*
		0xFDCB86:function () { // RES 0,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
		},
		0xFDCB87: ld_r_res_n_xd("A", 0, "IY"), // LD A,RES 0,(IY+d)*
		0xFDCB88: ld_r_res_n_xd("B", 1, "IY"), // LD B,RES 1,(IY+d)*
		0xFDCB89: ld_r_res_n_xd("C", 1, "IY"), // LD C,RES 1,(IY+d)*
		0xFDCB8A: ld_r_res_n_xd("D", 1, "IY"), // LD D,RES 1,(IY+d)*
		0xFDCB8B: ld_r_res_n_xd("E", 1, "IY"), // LD E,RES 1,(IY+d)*
		0xFDCB8C: ld_r_res_n_xd("H", 1, "IY"), // LD H,RES 1,(IY+d)*
		0xFDCB8D: ld_r_res_n_xd("L", 1, "IY"), // LD L,RES 1,(IY+d)*
		0xFDCB8E:function () { // RES 1,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
		},
		0xFDCB8F: ld_r_res_n_xd("A", 1, "IY"), // LD A,RES 1,(IY+d)*
		0xFDCB90: ld_r_res_n_xd("B", 2, "IY"), // LD B,RES 2,(IY+d)*
		0xFDCB91: ld_r_res_n_xd("C", 2, "IY"), // LD C,RES 2,(IY+d)*
		0xFDCB92: ld_r_res_n_xd("D", 2, "IY"), // LD D,RES 2,(IY+d)*
		0xFDCB93: ld_r_res_n_xd("E", 2, "IY"), // LD E,RES 2,(IY+d)*
		0xFDCB94: ld_r_res_n_xd("H", 2, "IY"), // LD H,RES 2,(IY+d)*
		0xFDCB95: ld_r_res_n_xd("L", 2, "IY"), // LD L,RES 2,(IY+d)*
		0xFDCB96:function () { // RES 2,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
		},
		0xFDCB97: ld_r_res_n_xd("A", 2, "IY"), // LD A,RES 2,(IY+d)*
		0xFDCB98: ld_r_res_n_xd("B", 3, "IY"), // LD B,RES 3,(IY+d)*
		0xFDCB99: ld_r_res_n_xd("C", 3, "IY"), // LD C,RES 3,(IY+d)*
		0xFDCB9A: ld_r_res_n_xd("D", 3, "IY"), // LD D,RES 3,(IY+d)*
		0xFDCB9B: ld_r_res_n_xd("E", 3, "IY"), // LD E,RES 3,(IY+d)*
		0xFDCB9C: ld_r_res_n_xd("H", 3, "IY"), // LD H,RES 3,(IY+d)*
		0xFDCB9D: ld_r_res_n_xd("L", 3, "IY"), // LD L,RES 3,(IY+d)*
		0xFDCB9E:function () { // RES 3,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
		},
		0xFDCB9F: ld_r_res_n_xd("A", 3, "IY"), // LD A,RES 3,(IY+d)*
		0xFDCBA0: ld_r_res_n_xd("B", 4, "IY"), // LD B,RES 4,(IY+d)*
		0xFDCBA1: ld_r_res_n_xd("C", 4, "IY"), // LD C,RES 4,(IY+d)*
		0xFDCBA2: ld_r_res_n_xd("D", 4, "IY"), // LD D,RES 4,(IY+d)*
		0xFDCBA3: ld_r_res_n_xd("E", 4, "IY"), // LD E,RES 4,(IY+d)*
		0xFDCBA4: ld_r_res_n_xd("H", 4, "IY"), // LD H,RES 4,(IY+d)*
		0xFDCBA5: ld_r_res_n_xd("L", 4, "IY"), // LD L,RES 4,(IY+d)*
		0xFDCBA6:function () { // RES 4,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
		},
		0xFDCBA7: ld_r_res_n_xd("A", 4, "IY"), // LD A,RES 4,(IY+d)*
		0xFDCBA8: ld_r_res_n_xd("B", 5, "IY"), // LD B,RES 5,(IY+d)*
		0xFDCBA9: ld_r_res_n_xd("C", 5, "IY"), // LD C,RES 5,(IY+d)*
		0xFDCBAA: ld_r_res_n_xd("D", 5, "IY"), // LD D,RES 5,(IY+d)*
		0xFDCBAB: ld_r_res_n_xd("E", 5, "IY"), // LD E,RES 5,(IY+d)*
		0xFDCBAC: ld_r_res_n_xd("H", 5, "IY"), // LD H,RES 5,(IY+d)*
		0xFDCBAD: ld_r_res_n_xd("L", 5, "IY"), // LD L,RES 5,(IY+d)*
		0xFDCBAE:function () { // RES 5,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
		},
		0xFDCBAF: ld_r_res_n_xd("A", 5, "IY"), // LD A,RES 5,(IY+d)*
		0xFDCBB0: ld_r_res_n_xd("B", 6, "IY"), // LD B,RES 6,(IY+d)*
		0xFDCBB1: ld_r_res_n_xd("C", 6, "IY"), // LD C,RES 6,(IY+d)*
		0xFDCBB2: ld_r_res_n_xd("D", 6, "IY"), // LD D,RES 6,(IY+d)*
		0xFDCBB3: ld_r_res_n_xd("E", 6, "IY"), // LD E,RES 6,(IY+d)*
		0xFDCBB4: ld_r_res_n_xd("H", 6, "IY"), // LD H,RES 6,(IY+d)*
		0xFDCBB5: ld_r_res_n_xd("L", 6, "IY"), // LD L,RES 6,(IY+d)*
		0xFDCBB6:function () { // RES 6,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
		},
		0xFDCBB7: ld_r_res_n_xd("A", 6, "IY"), // LD A,RES 6,(IY+d)*
		0xFDCBB8: ld_r_res_n_xd("B", 7, "IY"), // LD B,RES 7,(IY+d)*
		0xFDCBB9: ld_r_res_n_xd("C", 7, "IY"), // LD C,RES 7,(IY+d)*
		0xFDCBBA: ld_r_res_n_xd("D", 7, "IY"), // LD D,RES 7,(IY+d)*
		0xFDCBBB: ld_r_res_n_xd("E", 7, "IY"), // LD E,RES 7,(IY+d)*
		0xFDCBBC: ld_r_res_n_xd("H", 7, "IY"), // LD H,RES 7,(IY+d)*
		0xFDCBBD: ld_r_res_n_xd("L", 7, "IY"), // LD L,RES 7,(IY+d)*
		0xFDCBBE:function () { // RES 7,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
		},
		0xFDCBBF: ld_r_res_n_xd("A", 7, "IY"), // LD A,RES 7,(IY+d)*
		0xFDCBC0: ld_r_set_n_xd("B", 0, "IY"), // LD B,SET 0,(IY+d)*
		0xFDCBC1: ld_r_set_n_xd("C", 0, "IY"), // LD C,SET 0,(IY+d)*
		0xFDCBC2: ld_r_set_n_xd("D", 0, "IY"), // LD D,SET 0,(IY+d)*
		0xFDCBC3: ld_r_set_n_xd("E", 0, "IY"), // LD E,SET 0,(IY+d)*
		0xFDCBC4: ld_r_set_n_xd("H", 0, "IY"), // LD H,SET 0,(IY+d)*
		0xFDCBC5: ld_r_set_n_xd("L", 0, "IY"), // LD L,SET 0,(IY+d)*
		0xFDCBC6:function () { // SET 0,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
		},
		0xFDCBC7: ld_r_set_n_xd("A", 0, "IY"), // LD A,SET 0,(IY+d)*
		0xFDCBC8: ld_r_set_n_xd("B", 1, "IY"), // LD B,SET 1,(IY+d)*
		0xFDCBC9: ld_r_set_n_xd("C", 1, "IY"), // LD C,SET 1,(IY+d)*
		0xFDCBCA: ld_r_set_n_xd("D", 1, "IY"), // LD D,SET 1,(IY+d)*
		0xFDCBCB: ld_r_set_n_xd("E", 1, "IY"), // LD E,SET 1,(IY+d)*
		0xFDCBCC: ld_r_set_n_xd("H", 1, "IY"), // LD H,SET 1,(IY+d)*
		0xFDCBCD: ld_r_set_n_xd("L", 1, "IY"), // LD L,SET 1,(IY+d)*
		0xFDCBCE:function () { // SET 1,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
		},
		0xFDCBCF: ld_r_set_n_xd("A", 1, "IY"), // LD A,SET 1,(IY+d)*
		0xFDCBD0: ld_r_set_n_xd("B", 2, "IY"), // LD B,SET 2,(IY+d)*
		0xFDCBD1: ld_r_set_n_xd("C", 2, "IY"), // LD C,SET 2,(IY+d)*
		0xFDCBD2: ld_r_set_n_xd("D", 2, "IY"), // LD D,SET 2,(IY+d)*
		0xFDCBD3: ld_r_set_n_xd("E", 2, "IY"), // LD E,SET 2,(IY+d)*
		0xFDCBD4: ld_r_set_n_xd("H", 2, "IY"), // LD H,SET 2,(IY+d)*
		0xFDCBD5: ld_r_set_n_xd("L", 2, "IY"), // LD L,SET 2,(IY+d)*
		0xFDCBD6:function () { // SET 2,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
		},
		0xFDCBD7: ld_r_set_n_xd("A", 2, "IY"), // LD A,SET 2,(IY+d)*
		0xFDCBD8: ld_r_set_n_xd("B", 3, "IY"), // LD B,SET 3,(IY+d)*
		0xFDCBD9: ld_r_set_n_xd("C", 3, "IY"), // LD C,SET 3,(IY+d)*
		0xFDCBDA: ld_r_set_n_xd("D", 3, "IY"), // LD D,SET 3,(IY+d)*
		0xFDCBDB: ld_r_set_n_xd("E", 3, "IY"), // LD E,SET 3,(IY+d)*
		0xFDCBDC: ld_r_set_n_xd("H", 3, "IY"), // LD H,SET 3,(IY+d)*
		0xFDCBDD: ld_r_set_n_xd("L", 3, "IY"), // LD L,SET 3,(IY+d)*
		0xFDCBDE:function () { // SET 3,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
		},
		0xFDCBDF: ld_r_set_n_xd("A", 3, "IY"), // LD A,SET 3,(IY+d)*
		0xFDCBE0: ld_r_set_n_xd("B", 4, "IY"), // LD B,SET 4,(IY+d)*
		0xFDCBE1: ld_r_set_n_xd("C", 4, "IY"), // LD C,SET 4,(IY+d)*
		0xFDCBE2: ld_r_set_n_xd("D", 4, "IY"), // LD D,SET 4,(IY+d)*
		0xFDCBE3: ld_r_set_n_xd("E", 4, "IY"), // LD E,SET 4,(IY+d)*
		0xFDCBE4: ld_r_set_n_xd("H", 4, "IY"), // LD H,SET 4,(IY+d)*
		0xFDCBE5: ld_r_set_n_xd("L", 4, "IY"), // LD L,SET 4,(IY+d)*
		0xFDCBE6:function () { // SET 4,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
		},
		0xFDCBE7: ld_r_set_n_xd("A", 4, "IY"), // LD A,SET 4,(IY+d)*
		0xFDCBE8: ld_r_set_n_xd("B", 5, "IY"), // LD B,SET 5,(IY+d)*
		0xFDCBE9: ld_r_set_n_xd("C", 5, "IY"), // LD C,SET 5,(IY+d)*
		0xFDCBEA: ld_r_set_n_xd("D", 5, "IY"), // LD D,SET 5,(IY+d)*
		0xFDCBEB: ld_r_set_n_xd("E", 5, "IY"), // LD E,SET 5,(IY+d)*
		0xFDCBEC: ld_r_set_n_xd("H", 5, "IY"), // LD H,SET 5,(IY+d)*
		0xFDCBED: ld_r_set_n_xd("L", 5, "IY"), // LD L,SET 5,(IY+d)*
		0xFDCBEE:function () { // SET 5,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
		},
		0xFDCBEF: ld_r_set_n_xd("A", 5, "IY"), // LD A,SET 5,(IY+d)*
		0xFDCBF0: ld_r_set_n_xd("B", 6, "IY"), // LD B,SET 6,(IY+d)*
		0xFDCBF1: ld_r_set_n_xd("C", 6, "IY"), // LD C,SET 6,(IY+d)*
		0xFDCBF2: ld_r_set_n_xd("D", 6, "IY"), // LD D,SET 6,(IY+d)*
		0xFDCBF3: ld_r_set_n_xd("E", 6, "IY"), // LD E,SET 6,(IY+d)*
		0xFDCBF4: ld_r_set_n_xd("H", 6, "IY"), // LD H,SET 6,(IY+d)*
		0xFDCBF5: ld_r_set_n_xd("L", 6, "IY"), // LD L,SET 6,(IY+d)*
		0xFDCBF6:function () { // SET 6,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
		},
		0xFDCBF7: ld_r_set_n_xd("A", 6, "IY"), // LD A,SET 6,(IY+d)*
		0xFDCBF8: ld_r_set_n_xd("B", 7, "IY"), // LD B,SET 7,(IY+d)*
		0xFDCBF9: ld_r_set_n_xd("C", 7, "IY"), // LD C,SET 7,(IY+d)*
		0xFDCBFA: ld_r_set_n_xd("D", 7, "IY"), // LD D,SET 7,(IY+d)*
		0xFDCBFB: ld_r_set_n_xd("E", 7, "IY"), // LD E,SET 7,(IY+d)*
		0xFDCBFC: ld_r_set_n_xd("H", 7, "IY"), // LD H,SET 7,(IY+d)*
		0xFDCBFD: ld_r_set_n_xd("L", 7, "IY"), // LD L,SET 7,(IY+d)*
		0xFDCBFE:function () { // SET 7,(IY+d)
			this._op_t = 23;
			this._op_m = 4;
			var addr = this._s.IY+this._op_displ;
			this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
		},
		0xFDCBFF: ld_r_set_n_xd("A", 7, "IY"), // LD A,SET 7,(IY+d)*
		0xFDE1:function () { // POP IY
			this._op_t = 14;
			this._op_m = 2;
			this._s.IY = this.pop16();
		},
		0xFDE3:function () { // EX (SP),IY
			this._op_t = 23;
			this._op_m = 2;
			var addr = this._s.SP;
			var memval = this._mmu.r16(addr);
			this._mmu.w16reverse(addr, this._s.IY);
			this._s.IY = memval;
		},
		0xFDE5:function () { // PUSH IY
			this._op_t = 15;
			this._op_m = 2;
			this.push16(this._s.IY);
		},
		0xFDE9:function () { // JP (IY)
			this._op_t = 8;
			this._op_m = 0;
			this._s.PC = this._s.IY;
		},
		0xFDF9:function () { // LD SP,IY
			this._op_t = 10;
			this._op_m = 2;
			this._s.SP = this._s.IY;
		},
		0xFE:function () { // CP n
			this._op_t = 7;
			this._op_m = 2;
			this._op_n = this._mmu.r8(this._s.PC+1);
			sub8(this._s.A, this._op_n, 0, this._op_alures);
			this._s.F = (this._op_alures[1] & ~(F_5|F_3)) | (this._op_n & (F_5|F_3));
		},
		0xFF:function () { // RST 38H
			this._op_t = 11;
			this._op_m = 0;
			this.push16(this._s.PC+1);
			this._s.PC = 0x38;
		}
	};

	Z80.prototype.step = function () {
		var pc = this._s.PC;
		var btpc = this._s.PC;
		var rAdd = 0;
		var isFDorDD = false;
		var tAdd = 0;
		this._op_displ = 0;
		var opcode,opcodeb2;
		opcode = this._mmu.r8(pc);
		if (opcode == 0xDD || opcode == 0xFD) {
			do {
				// DD* FD*
				opcodeb2 = this._mmu.r8(pc + 1);
				// DDDD, DDFD, FDDD, FDFD handle first byte as NOP
				if (opcodeb2 == 0xDD || opcodeb2 == 0xFD) {
					opcode = opcodeb2;
					tAdd += 4;
					pc += 1;
					rAdd += 1;
				}
				else {
					opcode = (opcode << 8) | opcodeb2;
					// DDCB????, FDCB????
					if (opcode == 0xFDCB || opcode == 0xDDCB) {
						rAdd += 2;
						this._op_displ = this._mmu.r8s(pc + 2);
						opcode = (opcode << 8) | this._mmu.r8(pc + 3);
					}
					// DD??, FD??
					else {
						rAdd += 2;
						isFDorDD = true;
					}
				}
			} while (opcode == 0xDD || opcode == 0xFD);
		}
		else if (opcode == 0xED || opcode == 0xCB) {
			opcode = (opcode << 8) | this._mmu.r8(pc + 1);
			rAdd += 2;
		}
		// single byte op
		else {
			rAdd += 1;
		}
		this._s.R = (this._s.R & 0x80) | ((this._s.R + rAdd) & 0x7F);
		var f = this._opcodes[opcode];
		if (!f) {
			if (isFDorDD) {
				f = this._opcodes[opcode & 0xFF];
				pc += 1;
				this._s.PC = pc;
				tAdd += 4;
			}
		}
		if (!f) {
			console.log(this._mmu.dasm(pc, 5, "??? ").join("\n"));
			throw ("not implemented:" + Utils.toHex8(opcode));
		}
		//this.logasm();
		f.call(this);
		//this.bt.push([btpc, opcode, this._op_n, this._op_nn, this._op_e, this._op_displ]);
		if (this._op_t === 0) {
			throw ("you forgot something!");
		}
		if (this._op_m && !this._s.halted) {
			this._s.PC = pc + this._op_m;
		}
		return this._op_t + tAdd;
	};

	Z80.prototype.interrupt = function() {
		if (this._s.IFF1) {
			if (this._s.im == 1) {
				this._s.IFF1 = 0;
				this._s.IFF2 = 0;
				this.push16(this._s.PC);
				this._s.PC = 0x0038;
			}
			else {
				throw("not implemented im mode:", this._s.im);
			}
		}
	}

	Z80.prototype.reset = function () {
		this._s.reset();
		this.bt = [];
	};

	Z80.prototype.btToString = function() {
		var self = this;
		var arr = [];
		var i;
		for(i=0; i<this.bt.length; i++) {
			var o = this.bt[i];
			arr.push(Utils.toHex16(o[0]) + " " + Dasm.Dasm(o));
		}
		var r = function(addr) {
			return self._mmu.r8(addr);
		}
		arr.push(Utils.toHex16(this._s.PC) + " " + Dasm.Dasm([r, this._s.PC]));
		return arr;
	};

	exports.Z80 = Z80;
	return exports;
});

