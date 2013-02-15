var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

requirejs(["scripts/z80.js", "scripts/utils.js"], function(Z80Module, Utils) {

	var F_S = 0x80; // sign
	var F_Z = 0x40; // zero
	var F_5 = 0x20; // ???
	var F_H = 0x10; // half-carry
	var F_3 = 0x08; // ???
	var F_PV = 0x04; // parity or overflow
	var F_N = 0x02; // add/subtract
	var F_C = 0x01; // carry

	function FakeMMU() {
		this._mem = new Uint8Array(0x10000);
		this.log = [];
		this.clearLog = function() {
			this.log = [];
		}
		this.clear = function() {
			var i;
			for (i = this._mem.length-1; i>=0; i--) {
				this._mem[i] = 0;
			}
		};
		this.dasm = function (addr, lines, prefix, noLdir) {
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
		this.r8 = function (addr) {
			var val = this._mem[addr];
			this.log.push("MR " + Utils.toHex16(addr) + " " + Utils.toHex8(val));
			return val;
		};
		this.w8 = function (addr, val) {
			this.log.push("MW " + Utils.toHex16(addr) + " " + Utils.toHex8(val));
			this._mem[addr] = val;
		};
		this.r8s = function (addr) {
			var val = this.r8(addr);
			if (val & 0x80) return -1 * (0x80 - (val & 0x7f));
			return val;
		};
		this.r16 = function (addr) {
			return this.r8(addr) | (this.r8(addr + 1) << 8);
		};
		this.w16 = function (addr, val) {
			this.w8(addr, val & 0xFF);
			this.w8(addr + 1, val >>> 8);
		};
		this.w16reverse = function (addr, val) {
			this.w8(addr + 1, val >>> 8);
			this.w8(addr, val & 0xFF);
		};
		this.out8 = function(port, val, expectedval) {
			this.log.push("PW " + Utils.toHex8(expectedval) + Utils.toHex8(port) + " " + Utils.toHex8(val));
		}
		this.in8 = function(port, val) {
			this.log.push("PR " + Utils.toHex8(val) + Utils.toHex8(port) + " " + Utils.toHex8(val));
			return val;
		}
	};

	function testCpuManual() {
		console.log("TEST START my manual");
		var fakeMmu = new FakeMMU();
		var valIdx = 0x1000;
		var valIdy = 0x1100;
		var opIdx = 0x100;
		var z80 = new Z80Module.Z80(fakeMmu,
			function(port, addr) {fakeMmu.out8(port,addr);},
			null);

		var testOp = function(a) {
			fakeMmu.w8(opIdx,0);
			fakeMmu.w8(opIdx+1,0);
			fakeMmu.w8(opIdx+2,0);
			fakeMmu.w8(opIdx+3,0);
			fakeMmu.w8(valIdx,0);
			fakeMmu.w8(valIdx+1,0);
			fakeMmu.w8(valIdx+2,0);
			fakeMmu.w8(valIdx+3,0);
			fakeMmu.w8(valIdy,0);
			fakeMmu.w8(valIdy+1,0);
			fakeMmu.w8(valIdy+2,0);
			fakeMmu.w8(valIdy+3,0);
			z80._s.init();
			z80._s.setSS("PC",opIdx);
			z80._s.setSS("IX",valIdx);
			z80._s.setSS("IY",valIdy);
			z80._s.F = a.iF;
			z80._s.A = a.ival;
			fakeMmu.w8(valIdx + a.op[2], a.ival);
			fakeMmu.w8(valIdy + a.op[2], a.ival);
			for (var i = 0; i < a.op.length; i++) {
				fakeMmu.w8(opIdx+i, a.op[i]);
			}
			var testOpStr = fakeMmu.dasm(z80._s.getSS("PC"), 1, "", false);
			z80.step();
			if (a.addr == -1) {
				if (z80._s.F != a.eF || z80._s.A != a.eval) {
					throw(JSON.stringify(a) + "\n F: " + Utils.toHex8(z80._s.F) + " A:" + Utils.toHex8(z80._s.A));
				}
			}
			else if (z80._s.F != a.eF || fakeMmu.r8(a.addr) != a.eval) {
				throw(JSON.stringify(a) + "\n F: " + Utils.toHex8(z80._s.F) + " m:" + fakeMmu.r8(a.eval));
			}
			console.log("TESING " + testOpStr + " PASS");
		}

		//	RLC   (IX+d)   , rotate left, copy into C
		testOp({ival: 0x01, iF: 0, eval: 0x02, eF: 0,  name: "rlc", op: [ 0xDD, 0xCB, 0x01, 0x06 ], addr: valIdx+1});
		testOp({ival: 0x80, iF: 0, eval: 0x01, eF: F_C,  name: "rlc", op: [ 0xDD, 0xCB, 0x01, 0x06 ], addr: valIdx+1});
		testOp({ival: 0x00, iF: 0, eval: 0x00, eF: F_Z|F_PV,  name: "rlc", op: [ 0xDD, 0xCB, 0x01, 0x06 ], addr: valIdx+1});
		testOp({ival: 0x40, iF: 0, eval: 0x80, eF: F_S,  name: "rlc", op: [ 0xDD, 0xCB, 0x01, 0x06 ], addr: valIdx+1});
		testOp({ival: 0x44, iF: 0, eval: 0x88, eF: F_S|F_PV,  name: "rlc", op: [ 0xDD, 0xCB, 0x01, 0x06 ], addr: valIdx+1});

		//	RRC   (IX+d)   , rotate right, copy into C
		testOp({ival: 0x01, iF: 0, eval: 0x80, eF: F_C|F_S,  name: "rrc", op: [ 0xDD, 0xCB, 0x01, 0x0E ], addr: valIdx+1});
		testOp({ival: 0x80, iF: 0, eval: 0x40, eF: 0,  name: "rrc", op: [ 0xDD, 0xCB, 0x01, 0x0E ], addr: valIdx+1});
		testOp({ival: 0x00, iF: 0, eval: 0x00, eF: F_Z|F_PV,  name: "rrc", op: [ 0xDD, 0xCB, 0x01, 0x0E ], addr: valIdx+1});
		testOp({ival: 0x88, iF: 0, eval: 0x44, eF: F_PV,  name: "rrc", op: [ 0xDD, 0xCB, 0x01, 0x0E ], addr: valIdx+1});

		// RL    (IX+d), rotate left through C
		testOp({ival: 0x01, iF: 0, eval: 0x02, eF: 0,  name: "rl", op: [ 0xDD, 0xCB, 0x01, 0x16 ], addr: valIdx+1});
		testOp({ival: 0x00, iF: F_C, eval: 0x01, eF: 0,  name: "rl", op: [ 0xDD, 0xCB, 0x01, 0x16 ], addr: valIdx+1});
		testOp({ival: 0x80, iF: F_C, eval: 0x01, eF: F_C,  name: "rl", op: [ 0xDD, 0xCB, 0x01, 0x16 ], addr: valIdx+1});
		testOp({ival: 0x80, iF: 0, eval: 0x00, eF: F_C|F_Z|F_PV,  name: "rl", op: [ 0xDD, 0xCB, 0x01, 0x16 ], addr: valIdx+1});
		testOp({ival: 0x44, iF: 0, eval: 0x88, eF: F_S|F_PV,  name: "rl", op: [ 0xDD, 0xCB, 0x01, 0x16 ], addr: valIdx+1});

		// RR    (IX+d), rotate right through C
		testOp({ival: 0x01, iF: F_3, eval: 0x00, eF: F_3|F_C|F_Z|F_PV,  name: "rr", op: [ 0xDD, 0xCB, 0x01, 0x1E ], addr: valIdx+1});
		testOp({ival: 0x80, iF: 0, eval: 0x40, eF: 0,  name: "rr", op: [ 0xDD, 0xCB, 0x01, 0x1E ], addr: valIdx+1});
		testOp({ival: 0x00, iF: 0, eval: 0x00, eF: F_Z|F_PV,  name: "rr", op: [ 0xDD, 0xCB, 0x01, 0x1E ], addr: valIdx+1});
		testOp({ival: 0x88, iF: 0, eval: 0x44, eF: F_PV,  name: "rr", op: [ 0xDD, 0xCB, 0x01, 0x1E ], addr: valIdx+1});
		testOp({ival: 0x88, iF: F_C, eval: 0xC4, eF: F_S,  name: "rr", op: [ 0xDD, 0xCB, 0x01, 0x1E ], addr: valIdx+1});

		// SLA   (IX+d), shift left arithmetic (left out into C, right insert 0)
		testOp({ival: 0x01, iF: 0, eval: 0x02, eF: 0,  name: "sla1", op: [ 0xDD, 0xCB, 0x01, 0x26 ], addr: valIdx+1});
		testOp({ival: 0x00, iF: F_C, eval: 0x00, eF: F_PV|F_Z,  name: "sla2", op: [ 0xDD, 0xCB, 0x01, 0x26 ], addr: valIdx+1});
		testOp({ival: 0x80, iF: 0, eval: 0x00, eF: F_C|F_Z|F_PV,  name: "sla3", op: [ 0xDD, 0xCB, 0x01, 0x26 ], addr: valIdx+1});
		testOp({ival: 0xC0, iF: 0, eval: 0x80, eF: F_C|F_S,  name: "sla4", op: [ 0xDD, 0xCB, 0x01, 0x26 ], addr: valIdx+1});

		// DAA
		testOp({ival: 0x9A, iF: 0x02, eval: 0x34, eF: 0x23,  name: "daa1", op: [ 0x27 ], addr: -1});
		testOp({ival: 0x1F, iF: 0x00, eval: 0x25, eF: 0x30,  name: "daa2", op: [ 0x27 ], addr: -1});
		// CPL
		testOp({ival: 0x89, iF: 0x00, eval: 0x76, eF: 0x32,  name: "cpl", op: [ 0x2F ], addr: -1});
		// SCF
		testOp({ival: 0x00, iF: 0xFF, eval: 0x00, eF: 0xC5,  name: "scf1", op: [ 0x37 ], addr: -1});
		testOp({ival: 0xFF, iF: 0x00, eval: 0xFF, eF: 0x29,  name: "scf2", op: [ 0x37 ], addr: -1});
		testOp({ival: 0xFF, iF: 0xFF, eval: 0xFF, eF: 0xED,  name: "scf3", op: [ 0x37 ], addr: -1});
		testOp({ival: 0x00, iF: 0x00, eval: 0x00, eF: 0x01,  name: "scf4", op: [ 0x37 ], addr: -1});
		// CCF
		testOp({ival: 0x00, iF: 0x5B, eval: 0x00, eF: 0x50,  name: "ccf", op: [ 0x3F ], addr: -1});

		console.log("TEST FINISH my manual");
	};

	function testCpuZex(fname, skipCnt, doDasm) {
		console.log("zex : " + fname);
		var fs = require("fs");
		var fakemmu = new FakeMMU();

		var testData = fs.readFileSync(fname);
		var i;
		// 0x0100 = start address
		for (i = 0; i < testData.length; i++) {
			fakemmu.w8(0x100 + i, testData[i]);
		}
		// stack address
		fakemmu.w8(6, 0x00);
		fakemmu.w8(7, 0x80);
		// first test address
		fakemmu.w8(0x120, 0x3A + 2 * skipCnt);

		console.log(Z80Module);
		var z80 = new Z80Module.Z80(fakemmu,
			function(port, addr) {fakemmu.out8(port,addr);},
			null);
		z80._s.setSS("PC",0x100);

		while (true) {
			z80.step();
			var pc = z80._s.getSS("PC");
			if (pc == 0x1D42 && doDasm) {
				console.log(fakemmu.dasm(z80._s.getSS("PC"), 1, "%% ", false).join("\n"));
			}
			// 0 = soft reset
			else if (pc == 0) {
				return;
			}
			// 5 = system call
			else if (pc == 5) {
				if (z80._s.C == 2) {
					process.stdout.write(String.fromCharCode(z80._s.E));
				}
				else if (z80._s.C == 9) {
					var txtaddr,txtchr,txtstr;
					txtaddr = z80._s.getSS("DE");
					txtstr = "";
					while ((txtchr = String.fromCharCode(fakemmu.r8(txtaddr))) != "$") {
						txtstr += txtchr;
						txtaddr++;
					}
					process.stdout.write(txtstr);
					if (txtstr.indexOf("ERROR") != -1) {
						throw("ERROR");
					}
				}
				z80._s.setSS("PC",z80.pop16());
			}
		}
	};

	function generateFuseOutput(descr, memlog, z80, totalRunTime) {
		var result = [];
		result.push(descr);
		for (i in memlog) {
			result.push("    0 " + memlog[i]);
		}
		var memlog2 = {}, memlog2keys = [];
		for (i in memlog) {
			line = memlog[i].trim().split(" ");
			if (line[0] != "MW") continue;
			val = parseInt(line[1],16);
			memlog2[val] = parseInt(line[2],16);
			memlog2keys.push(val);
		}

		val = [];
		val.push(z80._s.getSS("AF"));
		val.push(z80._s.getSS("BC"));
		val.push(z80._s.getSS("DE"));
		val.push(z80._s.getSS("HL"));
		val.push(z80._s.getSSa("AF"));
		val.push(z80._s.getSSa("BC"));
		val.push(z80._s.getSSa("DE"));
		val.push(z80._s.getSSa("HL"));
		val.push(z80._s.getSS("IX"));
		val.push(z80._s.getSS("IY"));
		val.push(z80._s.getSS("SP"));
		val.push(z80._s.getSS("PC"));
		result.push(val.map(function(x) {return Utils.toHex16(x);}).join(" "));

		val = [];
		val.push(Utils.toHex8(z80._s.I));
		val.push(Utils.toHex8(z80._s.R));
		val.push(z80._s.IFF1);
		val.push(z80._s.IFF2);
		val.push(z80._s.im);
		val.push(z80._s.halted);
		val.push(totalRunTime);

		result.push(val.join(" "));

		memlog2keys.sort();
		var memlog2str = "";
		var memlog2addr = -2;
		for (i in memlog2keys) {
			var key = memlog2keys[i];
			if (key != (memlog2addr+1)) {
				if (memlog2str) {
					result.push(memlog2str + " -1");
				}
				memlog2str = Utils.toHex16(key) + " " + Utils.toHex8(memlog2[key]);
			}
			else {
				memlog2str += " " + Utils.toHex8(memlog2[key]);
			}
			memlog2addr = key;
		}
		if (memlog2str) {
			result.push(memlog2str + " -1");
		}

		result.push("");
		return result;
	};

	function testCpuFuse() {
		var fs = require("fs");
		var testData = fs.readFileSync("tests/tests.in", "ascii").split("\n");
		var testResult = fs.readFileSync("tests/tests.expected", "ascii").split("\n");
		var fakemmu = new FakeMMU();
		var state = 0;
		var l,lr,line,val,descr,runTime,addr,i;

		var z80 = new Z80Module.Z80(fakemmu,
			function(port, val, expectedval) {fakemmu.out8(port,val, expectedval);},
			function(port, expectedval) {return fakemmu.in8(port,expectedval);}
			);

		lr = 0;
		for (l in testData) {
			line = testData[l];
			switch(state) {
			case 0: // description
				if (!line) continue;
				descr = line;
				state = 1;
				continue;
			case 1: // registers
				val = line.split(/\s+/).map(function(x) {return parseInt(x,16);});
				z80._s.setSS("AF",val[0]);
				z80._s.setSS("BC",val[1]);
				z80._s.setSS("DE",val[2]);
				z80._s.setSS("HL",val[3]);
				z80._s.setSSa("AF",val[4]);
				z80._s.setSSa("BC",val[5]);
				z80._s.setSSa("DE",val[6]);
				z80._s.setSSa("HL",val[7]);
				z80._s.setSS("IX",val[8]);
				z80._s.setSS("IY",val[9]);
				z80._s.setSS("SP",val[10]);
				z80._s.setSS("PC",val[11]);
				state = 2;
				continue;
			case 2: // state
				val = line.split(/\s+/).filter(function(x) {return x.length > 0;}).map(function(x) {return parseInt(x,16);});
				z80._s.I = val[0];
				z80._s.R = val[1];
				z80._s.IFF1 = val[2];
				z80._s.IFF2 = val[3];
				z80._s.im = val[4];
				z80._s.halted = val[5];
				runTime = parseInt(val[6].toString(16), 10);
				state = 3;
				continue;
			case 3: // memory
				val = line.split(/\s+/).map(function(x) {return parseInt(x,16);});
				addr = val[0];
				if (addr == -1) break;
				i = 1;
				while (val[i] != -1) {
					fakemmu.w8(addr++, val[i++]);
				}
				continue;
			}
			// exec
			fakemmu.clearLog();
			var totalRunTime = 0;
			while (runTime > 0) {
				var stepTime = z80.step();
				runTime -= stepTime;
				totalRunTime += stepTime;
			}
			// output
			var result = generateFuseOutput(descr, fakemmu.log, z80, totalRunTime);

			// process expected and compare
			var resultIdx = 0;
			var lrStart = lr;
			while (testResult[lr]) {
				var expLine = testResult[lr].toUpperCase();
				var resLine = result[resultIdx].toUpperCase();
				// ignore contention
				if ((expLine.indexOf(" MC ") != -1) || (expLine.indexOf(" PC ") != -1)) {
				   lr++;
			   	   continue;
				}
				// preprocess
				if (expLine.substr(0,2) == "  ") {
					expLine = expLine.replace(/\s+\d+\s+/, "");
					resLine = resLine.replace(/\s+\d+\s+/, "");
				}
				// compare
				if (expLine != resLine) {
					var errstr = "Conflict: \n" + resLine + "\n" + expLine + "\n";
					errstr += "Result: \n" + result.join("\n");
					errstr += "Expected: \n" + testResult.slice(lrStart,testResult.indexOf("",lrStart)).join("\n");
					throw(errstr);
				}
				resultIdx++;
				lr++;
			}
			lr++;
			console.log(descr + " ......... OK");

			// prepare next
			fakemmu.clear();
			state = 0;
		}
	};

	var tests = {
	"cpu_doc": function() {
		if (process.argv.length < 5) throw("ERROR: cpu do_disasm skip_cnt");
		testCpuZex("tests/zexdoc.com", parseInt(process.argv[4],10), parseInt(process.argv[3],10));
		},
	"cpu_all": function() {
		if (process.argv.length < 5) throw("ERROR: cpu do_disasm skip_cnt");
		testCpuZex("tests/zexall.com", parseInt(process.argv[4],10), parseInt(process.argv[3],10));
		},
	"cpu_manual": function() {
		testCpuManual();
		},
	"cpu_fuse": function() {
		testCpuFuse();
		},
	};

	if (process.argv.length < 3) {
		throw("ERROR: missing test id: " + Object.keys(tests));
	}
	if (!tests[process.argv[2]]) {
		throw("ERROR: invalid test id");
	}
	tests[process.argv[2]]();
});

