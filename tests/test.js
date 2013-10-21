var requirejs = require('requirejs');

requirejs.config({
    nodeRequire: require
});

requirejs(["scripts/z80.js", "scripts/utils.js", "scripts/vid.js", "scripts/dasm.js"], function(Z80Module, Utils, VIDModule, DASM) {
/*
	var F_S = 0x80; // sign
	var F_Z = 0x40; // zero
	var F_5 = 0x20; // ???
	var F_H = 0x10; // half-carry
	var F_3 = 0x08; // ???
	var F_PV = 0x04; // parity or overflow
	var F_N = 0x02; // add/subtract
	var F_C = 0x01; // carry
*/

/* FakeMMU ######################################### */

	function FakeMMU(logIntoThis) {
		this._mem = new Uint8Array(0x10000);
		this.log = logIntoThis;

		this.clear = function() {
			var i;
			for (i = this._mem.length-1; i>=0; i--) {
				this._mem[i] = 0;
			}
		};

		this.getVid = function() {
			return this._mem;
		}

		this.r8 = function (addr) {
			addr &= 0xFFFF;
			var val = this._mem[addr];
			if (this.log) this.log.push("MR " + Utils.toHex16(addr) + " " + Utils.toHex8(val));
			return val;
		};
		this.w8 = function (addr, val) {
			addr &= 0xFFFF;
			if (this.log) this.log.push("MW " + Utils.toHex16(addr) + " " + Utils.toHex8(val));
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
		this.r16nolog = function (addr) {
			var log = this.log;
			this.log = undefined;
			var val = this.r8(addr) | (this.r8(addr + 1) << 8);
			this.log = log;
			return val;
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
			if (this.log) this.log.push("PW " + Utils.toHex8(expectedval) + Utils.toHex8(port) + " " + Utils.toHex8(val));
		}
		this.in8 = function(port, val) {
			if (this.log) this.log.push("PR " + Utils.toHex8(val) + Utils.toHex8(port) + " " + Utils.toHex8(val));
			return val;
		}
	};

/* CPU ######################################### */

	function testCpuManual() {
		console.log("TEST START my manual");
		var fakeMmu = new FakeMMU();
		var z80 = new Z80Module.Z80(fakeMmu,
			function(port, addr) {fakeMmu.out8(port,addr);},
			null);
		z80._btmaxlen = 0;

		while (true) {
			z80.step(0);
		}
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
		fakemmu.w8(6, 0xE4);
		fakemmu.w8(7, 0x00);
		// first test address
		fakemmu.w8(0x120, 0x3A + 2 * skipCnt);

		var z80 = new Z80Module.Z80(fakemmu,
			function(port, addr) {fakemmu.out8(port,addr);},
			null);
		z80._btmaxlen = 0;
		z80.setRegVal("PC", 0x100);

		while (true) {
			z80.step(0);
			var pc = z80.getRegVal("PC");
			if (pc == 0x1D42 && doDasm) {
				var r = function(addr) {
					return fakemmu.r8(addr);
				}
				console.log("%%",Utils.toHex16(pc)," ",DASM.Dasm([r, pc])[0]);
			}
			// 0 = soft reset
			else if (pc == 0) {
				break;
			}
			// 5 = system call
			else if (pc == 5) {
				if (z80.getRegVal("C") == 2) {
					process.stdout.write(String.fromCharCode(z80.getRegVal("E")));
				}
				else if (z80.getRegVal("C") == 9) {
					var txtaddr,txtchr,txtstr;
					txtaddr = z80.getRegVal("DE");
					txtstr = "";
					while ((txtchr = String.fromCharCode(fakemmu.r8(txtaddr))) != "$") {
						txtstr += txtchr;
						txtaddr++;
					}
					process.stdout.write(txtstr);
					if (txtstr.indexOf("ERROR") != -1) {
						break;
					}
				}
				z80.setRegVal("PC", z80.pop16());
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
		val.push(z80.getRegVal("AF"));
		val.push(z80.getRegVal("BC"));
		val.push(z80.getRegVal("DE"));
		val.push(z80.getRegVal("HL"));
		val.push(z80.getRegVal("AFa"));
		val.push(z80.getRegVal("BCa"));
		val.push(z80.getRegVal("DEa"));
		val.push(z80.getRegVal("HLa"));
		val.push(z80.getRegVal("IX"));
		val.push(z80.getRegVal("IY"));
		val.push(z80.getRegVal("SP"));
		val.push(z80.getRegVal("PC"));
		result.push(val.map(function(x) {return Utils.toHex16(x);}).join(" "));

		val = [];
		val.push(Utils.toHex8(z80.getRegVal("I")));
		val.push(Utils.toHex8(z80.getRegVal("R")));
		val.push(z80.getRegVal("IFF1"));
		val.push(z80.getRegVal("IFF2"));
		val.push(z80.getRegVal("im"));
		val.push(z80.getRegVal("halted"));
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
		var log = [];
		var fakemmu = new FakeMMU(log);
		var state = 0;
		var l,lr,line,val,descr,runTime,addr,i;

		var z80 = new Z80Module.Z80(fakemmu,
			function(port, val, expectedval) {fakemmu.out8(port,val, expectedval);},
			function(port, expectedval) {return fakemmu.in8(port,expectedval);}
			);
		z80._btmaxlen = 0;

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
				z80.setRegVal("AF", val[0]);
				z80.setRegVal("BC", val[1]);
				z80.setRegVal("DE", val[2]);
				z80.setRegVal("HL", val[3]);
				z80.setRegVal("AFa", val[4]);
				z80.setRegVal("BCa", val[5]);
				z80.setRegVal("DEa", val[6]);
				z80.setRegVal("HLa", val[7]);
				z80.setRegVal("IX", val[8]);
				z80.setRegVal("IY", val[9]);
				z80.setRegVal("SP", val[10]);
				z80.setRegVal("PC", val[11]);
				state = 2;
				continue;
			case 2: // state
				val = line.split(/\s+/).filter(function(x) {return x.length > 0;}).map(function(x) {return parseInt(x,16);});
				z80.setRegVal("I", val[0]);
				z80.setRegVal("R", val[1]);
				z80.setRegVal("IFF1", val[2]);
				z80.setRegVal("IFF2", val[3]);
				z80.setRegVal("im", val[4]);
				z80.setRegVal("halted", val[5]);
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
			log.length = 0;
			var totalRunTime = 0;
			while (runTime > 0) {
				var stepTime = z80.step(0);
				runTime -= stepTime;
				totalRunTime += stepTime;
			}
			// output
			var result = generateFuseOutput(descr, log, z80, totalRunTime);

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

/* VID ######################################### */

	function testVid() {
		var mmu = new FakeMMU(false),
			fb = {buf32: [], width: 608, height: 288},
			vid = new VIDModule.VID(mmu, fb),
			regs = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ],
			l=0,
			i;

		for (i = regs.length - 1; i >= 0; i--) {
			vid.setRegIdx(i);
			vid.setReg(regs[i]);
			var timing = vid.streamLine();
			console.log(l++,timing,vid._streamt,vid._streamh);
		}

		for (i = 0; i < 3*320; i++) {
			var timing = vid.streamLine();
			console.log(l++,timing,vid._streamt,vid._streamh);
			var haveAFrame = vid.renderStream();
			if (haveAFrame) console.log("haveAFrame");
		}
	}

/* exec ######################################### */

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
	"vid": function() {
		testVid();
		},
	};

	process.on('uncaughtException', function (err) {
		console.error('ERROR: uncaught exception');
		console.error(err);
		console.error(err.stack);
	});

	if (process.argv.length < 3) {
		throw("ERROR: missing test id: " + Object.keys(tests));
	}
	if (!tests[process.argv[2]]) {
		throw("ERROR: invalid test id");
	}
	tests[process.argv[2]]();
});

