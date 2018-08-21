(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Emu = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var TVC = require("./scripts/tvc.js");

var notify = function(msg, msg2) {
	$("#statusline").text(msg);
}

/* jQuery promise based async data download */
var getData = function(name, url) {
	var defer = $.Deferred();
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";
	oReq.onload = function (oEvent) {
		var arrayBuffer = oReq.response;
		if (arrayBuffer) {
			defer.resolve(name, arrayBuffer);
		}
		else {
			defer.reject(this);
		}
	};
	oReq.send(null);
	return defer.promise();
}


var Emu = function()
{
	this.isRunning = true; /* run the emu in the animation callback */
	this.tvc = undefined; /* TVC object */
	this.canvas = undefined; /* canvas dom object */
	this.fb = undefined; /* frame buffer object */
}

Emu.prototype.tvcInfoCallback = function(e) {
	var res;
	switch(e.id) {
		case "fb":
			res = this.fb;
			break;
		case "notify":
			notify(e.str);
			break;
		case "aud":
			if (window.webkitAudioContext) {
				res = new webkitAudioContext();
			}
			else if (window.AudioContext) {
				res = new AudioContext();
			}
			else {
				res = undefined;
			}
			break;
	}
	return res;
};

Emu.prototype.appStart = function() {
	this.emuInit();
}

Emu.prototype.emuBreak = function() {
	this.isRunning = false;
	$("#bstop").text("continue");
}

Emu.prototype.emuReset = function() {
	this.tvc.reset();
}

Emu.prototype.emuCreate = function(type) {
	notify("loading roms");
	var self = this;
	this.isRunning = false;
	this.tvc = new TVC(type, function(e){return self.tvcInfoCallback(e);});
	var roms;
	if (/2\.2/.test(type)) roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
	else roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
	if (/DOS/.test(type)) roms.push("D_TVCDOS.128");
	// load roms
	getData(roms[0], "roms/"+roms[0])
	.then(function(dataname, data) {
		self.tvc.addRom(dataname, new Uint8Array(data));
		return getData(roms[1], "roms/"+roms[1]);
	})
	.then(function(dataname, data) {
		self.tvc.addRom(dataname, new Uint8Array(data));
		return getData(roms[2], "roms/"+roms[2]);
	})
	.then(function(dataname, data) {
		self.tvc.addRom(dataname, new Uint8Array(data));
		if (roms.length > 3) {
			return getData(roms[3], "roms/"+roms[3]);
		}
	})
	.then(function(dataname, data) {
		if (dataname) {
			self.tvc.addRom(dataname, new Uint8Array(data));
		}
		// start
		self.isRunning = true;
		self.emuContinue();
		$(document).trigger("emu.started");
	});
}

Emu.prototype.emuToggleRun = function() {
	this.isRunning = !this.isRunning;
	if (this.isRunning) {
		$("#bstop").text("stop");
		this.emuContinue();
	}
	else {
		$("#bstop").text("continue");
		notify("stopped");
	}
}

Emu.prototype.refreshGui = function() {
	this.fb.imageData.data.set(this.fb.buf8);
	this.ctx.putImageData(this.fb.imageData, 0, 0);
	this.fb.updatecnt++;
	var timenow = this.timenow();
	if ((timenow - this.fb.prevUpdateTime) > 1000) {
		this.fb.prevUpdateTime = timenow;

		this.fb.updates.push([this.fb.updatecnt, timenow]);
		if (this.fb.updates.length > 5) this.fb.updates.shift();


		var lastUpdateIdx = this.fb.updates.length - 1;
		var cntdiff = this.fb.updates[lastUpdateIdx][0] - this.fb.updates[0][0];
		var timediff = this.fb.updates[lastUpdateIdx][1] - this.fb.updates[0][1];

		this.fb.fpsv = ~~(cntdiff / (timediff / 1000));
		//console.log(this.fb.updates,this.fb.fpsv);
		notify("running " + this.fb.fpsv.toString(10) + "fps");
	}
}

Emu.prototype.emuInit = function() {
	var self = this;
	notify("init page");
	/* polyfills */
	if(window.requestAnimationFrame) this.requestAnimationFrame = function(f) {window.requestAnimationFrame(f);};
	else if (window.mozRequestAnimationFrame) this.requestAnimationFrame = function(f) {window.mozRequestAnimationFrame(f);};
	else if (window.webkitRequestAnimationFrame) this.requestAnimationFrame = function(f) {window.webkitRequestAnimationFrame(f);};
	else if (window.msRequestAnimationFrame) this.requestAnimationFrame = function(f) {window.msRequestAnimationFrame(f);};
	if (typeof(performance) != "undefined")
		this.timenow = function() {return performance.now();};
	else
		this.timenow = Date.now;
	/* init */
	this.statusline = $("#statusline")[0];
	// frame buffer
	this.canvas = $("#tvcanvas");
	this.ctx = this.canvas[0].getContext("2d");
	this.fb = {};
	this.fb.prevUpdateTime = this.timenow();
	this.fb.updatecnt = 0;
	this.fb.updates = [];
	this.fb.skipcnt = 0;
	this.fb.fps = $("#fps")[0];
	this.fb.fpsv = 0;
	this.fb.width = this.canvas[0].width;
	this.fb.height = this.canvas[0].height;
	this.fb.imageData = this.ctx.createImageData(this.fb.width, this.fb.height);
	this.fb.buf = new ArrayBuffer(this.fb.imageData.data.length);
	this.fb.buf8 = new Uint8ClampedArray(this.fb.buf);
	this.fb.buf32 = new Uint32Array(this.fb.buf);
	this.fb.refresh = function(){self.refreshGui();};
	var emuDefs = [
		"64k+ 1.2, VT-DOS",
		"64k+ 2.2, VT-DOS",
		"64k  1.2",
		"64k+ 1.2",
		"64k+ 2.2"
			];
	var defaultType = emuDefs[0];
	this.emuCreate(defaultType);
	// gui
	$("#breset").on("click", function() {
		self.emuReset();
	});
	$("#bstop").on("click", function() {
		self.emuToggleRun();
	});
	// img loading + selection
	var loadDiskByName = function(name) {
		getData(name, "games2/" + name)
			.then(function(dataname, data) {
				self.tvc.loadImg(dataname, new Uint8Array(data));
				$("#monitor").focus();
				notify("loaded", dataname);
			});
	};
	// load first disk
	$(document).on("emu.started", function () {
		loadDiskByName("MRALEX.CAS");
	});
	// keyboard
	$(document).keydown(function(e){self.handleKeyDown(e);});
	$(document).keyup(function(e){self.handleKeyUp(e);});
	$(document).keypress(function(e){self.handleKeyPress(e);});
	// focus on canvas
	$(window).focus(function(e){self.handleFocus(e);});
	$(window).blur(function(e){self.handleFocusLost(e);});
	// disable selection
	this.canvas.on("selectstart", function(e) { e.preventDefault(); return false; });
}

// event handlers
Emu.prototype.handleKeyPress = function(e) {
	if (this.tvc) {
		this.tvc.keyPress(e.which);
		e.preventDefault();
	}
}

Emu.prototype.handleKeyDown = function(e) {
	if (this.tvc) {
		if (this.tvc.keyDown(e.which))
			e.preventDefault();
	}
}

Emu.prototype.handleKeyUp = function(e) {
	if (this.tvc) {
		this.tvc.keyUp(e.which);
	}
}

Emu.prototype.handleFocus = function(e) {
	if (this.tvc)
		this.tvc.focusChange(true);
}

Emu.prototype.handleFocusLost = function(e) {
	if (this.tvc)
		this.tvc.focusChange(false);
}

// emulator functions
Emu.prototype.emuContinue = function() {
	var self = this;
	this.requestAnimationFrame(function(){self.emuRunFrame();});
}

Emu.prototype.emuRunFrame = function() {
	var skipRun;
	if (this.isRunning)
	{
		skipRun = false;
		this.fb.skipcnt++;
		if (this.fb.skipcnt == 6) {
			skipRun = this.fb.fpsv > 49;
			this.fb.skipcnt = 0;
		}
		if (!skipRun)
		{
      var t1 = this.timenow()
			if(this.tvc.runForAFrame())
				this.emuBreak();
      var t2 = this.timenow();
      var tdiff = t2 - t1;
		}
		if (this.isRunning)
			this.emuContinue();
	}
}

module.exports = Emu;

},{"./scripts/tvc.js":8}],2:[function(require,module,exports){
var Utils = require("./utils.js");

function AUD(context) {
	this._amp = 0;
	this._pitch = 0;
	this._on = false;
	this._idx = 0;
	this._vol = 0;
	this._voln = -1;
	this._freq = 1000;
	this._freqn = -1;
	var self = this;
	this._context = context;
	this._node = undefined;
	this._gain = undefined;
	if (this._context) {
		if (context.createJavascriptNode) {
			this._node = context.createJavascriptNode(2048,0,1);
		}
		else if (context.createScriptProcessor) {
			this._node = context.createScriptProcessor(2048,0,1);
		}
		if (this._node) {
			this._node.onaudioprocess = function(e) { self.process(e) };
			this._gain = context.createGain();
			this._gain.gain.value = 0;
			this._node.connect(this._gain);
			this._gain.connect(this._context.destination);
		}
	}
}

AUD.prototype.process = function(e) {
	var data = e.outputBuffer.getChannelData(0);
	this.schedule(data, e.outputBuffer.sampleRate);
}

AUD.prototype.setAmp = function(val) {
	this._amp = val;
	this._voln = this._amp / 15;
};

AUD.prototype.setFreqL = function(val) {
	this._pitch = (this._pitch & 0x0F00) | (val & 0xFF);
	this._freqn = 195312.5/(4096-this._pitch);
};

AUD.prototype.setFreqH = function(val) {
	this._pitch = (this._pitch & 0xFF) | (val << 8);
	this._freqn = 195312.5/(4096-this._pitch);
};

AUD.prototype.setOn = function(val) {
	this._on = val;
	this._voln = val ? (this._amp / 15) : 0;
};

AUD.prototype.schedule = function(buffer, sampleRate) {
	var needsUpdate = (this._voln >= 0) || (this._freqn >= 0);
	var sample,dist,spc,i;
	spc = sampleRate / this._freq;
	if (needsUpdate) {
		for (i=0; i < buffer.length; i++) {
			dist = spc - (this._idx % spc);
			if (needsUpdate && (dist < 2)) { // switch on 0
				this._idx = 0;
				if (this._freqn >= 0) {
					this._freq = this._freqn;
					this._freqn = -1;
				}
				if (this._voln >= 0) {
					this._vol = this._voln;
					this._voln = -1;
					this._gain.gain.value = this._vol;
				}
				needsUpdate = false;
			}
			if (dist < (spc/2)) {
				sample = 1;
			}
			else {
				sample = -1;
			}
			buffer[i] = sample;
			this._idx++;
		}
	}
	else {
		for (i=0; i < buffer.length; i++) {
			dist = spc - (this._idx % spc);
			if (this._vol <= 0.001) {
				sample = 0;
			}
			else if (dist < (spc/2)) {
				sample = 1;
			}
			else {
				sample = -1;
			}
			buffer[i] = sample;
			this._idx++;
		}
	}
};

module.exports = AUD;

},{"./utils.js":9}],3:[function(require,module,exports){
var OpCodes = {
	0: ["00", "NOP",1],
	1: ["01 n n", "LD BC,nn",3],
	2: ["02", "LD (BC),A",1],
	3: ["03", "INC BC",1],
	4: ["04", "INC B",1],
	5: ["05", "DEC B",1],
	6: ["06 n", "LD B,n",2],
	7: ["07", "RLCA",1],
	8: ["08", "EX AF,AF’",1],
	9: ["09", "ADD HL,BC",1],
	10: ["0A", "LD A,(BC)",1],
	11: ["0B", "DEC BC",1],
	12: ["0C", "INC C",1],
	13: ["0D", "DEC C",1],
	14: ["0E n", "LD C,n",2],
	15: ["0F", "RRCA",1],
	16: ["10 e", "DJNZ (PC+e)",2],
	17: ["11 n n", "LD DE,nn",3],
	18: ["12", "LD (DE),A",1],
	19: ["13", "INC DE",1],
	20: ["14", "INC D",1],
	21: ["15", "DEC D",1],
	22: ["16 n", "LD D,n",2],
	23: ["17", "RLA",1],
	24: ["18 e", "JR (PC+e)",2],
	25: ["19", "ADD HL,DE",1],
	26: ["1A", "LD A,(DE)",1],
	27: ["1B", "DEC DE",1],
	28: ["1C", "INC E",1],
	29: ["1D", "DEC E",1],
	30: ["1E n", "LD E,n",2],
	31: ["1F", "RRA",1],
	32: ["20 e", "JR NZ,(PC+e)",2],
	33: ["21 n n", "LD HL,nn",3],
	34: ["22 n n", "LD (nn),HL",3],
	35: ["23", "INC HL",1],
	36: ["24", "INC H",1],
	37: ["25", "DEC H",1],
	38: ["26 n", "LD H,n",2],
	39: ["27", "DAA",1],
	40: ["28 e", "JR Z,(PC+e)",2],
	41: ["29", "ADD HL,HL",1],
	42: ["2A n n", "LD HL,(nn)",3],
	43: ["2B", "DEC HL",1],
	44: ["2C", "INC L",1],
	45: ["2D", "DEC L",1],
	46: ["2E n", "LD L,n",2],
	47: ["2F", "CPL",1],
	48: ["30 e", "JR NC,(PC+e)",2],
	49: ["31 n n", "LD SP,nn",3],
	50: ["32 n n", "LD (nn),A",3],
	51: ["33", "INC SP",1],
	52: ["34", "INC (HL)",1],
	53: ["35", "DEC (HL)",1],
	54: ["36 n", "LD (HL),n",2],
	55: ["37", "SCF",1],
	56: ["38 e", "JR C,(PC+e)",2],
	57: ["39", "ADD HL,SP",1],
	58: ["3A n n", "LD A,(nn)",3],
	59: ["3B", "DEC SP",1],
	60: ["3C", "INC A",1],
	61: ["3D", "DEC A",1],
	62: ["3E n", "LD A,n",2],
	63: ["3F", "CCF",1],
	64: ["40", "LD B,B",1],
	65: ["41", "LD B,C",1],
	66: ["42", "LD B,D",1],
	67: ["43", "LD B,E",1],
	68: ["44", "LD B,H",1],
	69: ["45", "LD B,L",1],
	70: ["46", "LD B,(HL)",1],
	71: ["47", "LD B,A",1],
	72: ["48", "LD C,B",1],
	73: ["49", "LD C,C",1],
	74: ["4A", "LD C,D",1],
	75: ["4B", "LD C,E",1],
	76: ["4C", "LD C,H",1],
	77: ["4D", "LD C,L",1],
	78: ["4E", "LD C,(HL)",1],
	79: ["4F", "LD C,A",1],
	80: ["50", "LD D,B",1],
	81: ["51", "LD D,C",1],
	82: ["52", "LD D,D",1],
	83: ["53", "LD D,E",1],
	84: ["54", "LD D,H",1],
	85: ["55", "LD D,L",1],
	86: ["56", "LD D,(HL)",1],
	87: ["57", "LD D,A",1],
	88: ["58", "LD E,B",1],
	89: ["59", "LD E,C",1],
	90: ["5A", "LD E,D",1],
	91: ["5B", "LD E,E",1],
	92: ["5C", "LD E,H",1],
	93: ["5D", "LD E,L",1],
	94: ["5E", "LD E,(HL)",1],
	95: ["5F", "LD E,A",1],
	96: ["60", "LD H,B",1],
	97: ["61", "LD H,C",1],
	98: ["62", "LD H,D",1],
	99: ["63", "LD H,E",1],
	100: ["64", "LD H,H",1],
	101: ["65", "LD H,L",1],
	102: ["66", "LD H,(HL)",1],
	103: ["67", "LD H,A",1],
	104: ["68", "LD L,B",1],
	105: ["69", "LD L,C",1],
	106: ["6A", "LD L,D",1],
	107: ["6B", "LD L,E",1],
	108: ["6C", "LD L,H",1],
	109: ["6D", "LD L,L",1],
	110: ["6E", "LD L,(HL)",1],
	111: ["6F", "LD L,A",1],
	112: ["70", "LD (HL),B",1],
	113: ["71", "LD (HL),C",1],
	114: ["72", "LD (HL),D",1],
	115: ["73", "LD (HL),E",1],
	116: ["74", "LD (HL),H",1],
	117: ["75", "LD (HL),L",1],
	118: ["76", "HALT",1],
	119: ["77", "LD (HL),A",1],
	120: ["78", "LD A,B",1],
	121: ["79", "LD A,C",1],
	122: ["7A", "LD A,D",1],
	123: ["7B", "LD A,E",1],
	124: ["7C", "LD A,H",1],
	125: ["7D", "LD A,L",1],
	126: ["7E", "LD A,(HL)",1],
	127: ["7F", "LD A,A",1],
	128: ["80", "ADD A,B",1],
	129: ["81", "ADD A,C",1],
	130: ["82", "ADD A,D",1],
	131: ["83", "ADD A,E",1],
	132: ["84", "ADD A,H",1],
	133: ["85", "ADD A,L",1],
	134: ["86", "ADD A,(HL)",1],
	135: ["87", "ADD A,A",1],
	136: ["88", "ADC A,B",1],
	137: ["89", "ADC A,C",1],
	138: ["8A", "ADC A,D",1],
	139: ["8B", "ADC A,E",1],
	140: ["8C", "ADC A,H",1],
	141: ["8D", "ADC A,L",1],
	142: ["8E", "ADC A,(HL)",1],
	143: ["8F", "ADC A,A",1],
	144: ["90", "SUB B",1],
	145: ["91", "SUB C",1],
	146: ["92", "SUB D",1],
	147: ["93", "SUB E",1],
	148: ["94", "SUB H",1],
	149: ["95", "SUB L",1],
	150: ["96", "SUB (HL)",1],
	151: ["97", "SUB A",1],
	152: ["98", "SBC A,B",1],
	153: ["99", "SBC A,C",1],
	154: ["9A", "SBC A,D",1],
	155: ["9B", "SBC A,E",1],
	156: ["9C", "SBC A,H",1],
	157: ["9D", "SBC A,L",1],
	158: ["9E", "SBC A,(HL)",1],
	159: ["9F", "SBC A,A",1],
	160: ["A0", "AND B",1],
	161: ["A1", "AND C",1],
	162: ["A2", "AND D",1],
	163: ["A3", "AND E",1],
	164: ["A4", "AND H",1],
	165: ["A5", "AND L",1],
	166: ["A6", "AND (HL)",1],
	167: ["A7", "AND A",1],
	168: ["A8", "XOR B",1],
	169: ["A9", "XOR C",1],
	170: ["AA", "XOR D",1],
	171: ["AB", "XOR E",1],
	172: ["AC", "XOR H",1],
	173: ["AD", "XOR L",1],
	174: ["AE", "XOR (HL)",1],
	175: ["AF", "XOR A",1],
	176: ["B0", "OR B",1],
	177: ["B1", "OR C",1],
	178: ["B2", "OR D",1],
	179: ["B3", "OR E",1],
	180: ["B4", "OR H",1],
	181: ["B5", "OR L",1],
	182: ["B6", "OR (HL)",1],
	183: ["B7", "OR A",1],
	184: ["B8", "CP B",1],
	185: ["B9", "CP C",1],
	186: ["BA", "CP D",1],
	187: ["BB", "CP E",1],
	188: ["BC", "CP H",1],
	189: ["BD", "CP L",1],
	190: ["BE", "CP (HL)",1],
	191: ["BF", "CP A",1],
	192: ["C0", "RET NZ",1],
	193: ["C1", "POP BC",1],
	194: ["C2 n n", "JP NZ,(nn)",3],
	195: ["C3 n n", "JP (nn)",3],
	196: ["C4 n n", "CALL NZ,(nn)",3],
	197: ["C5", "PUSH BC",1],
	198: ["C6 n", "ADD A,n",2],
	199: ["C7", "RST 0H",1],
	200: ["C8", "RET Z",1],
	201: ["C9", "RET",1],
	202: ["CA n n", "JP Z,(nn)",3],
	204: ["CC n n", "CALL Z,(nn)",3],
	205: ["CD n n", "CALL (nn)",3],
	206: ["CE n", "ADC A,n",2],
	207: ["CF", "RST 8H",1],
	208: ["D0", "RET NC",1],
	209: ["D1", "POP DE",1],
	210: ["D2 n n", "JP NC,(nn)",3],
	211: ["D3 n", "OUT (n),A",2],
	212: ["D4 n n", "CALL NC,(nn)",3],
	213: ["D5", "PUSH DE",1],
	214: ["D6 n", "SUB n",2],
	215: ["D7", "RST 10H",1],
	216: ["D8", "RET C",1],
	217: ["D9", "EXX",1],
	218: ["DA n n", "JP C,(nn)",3],
	219: ["DB n", "IN A,(n)",2],
	220: ["DC n n", "CALL C,(nn)",3],
	222: ["DE n", "SBC A,n",2],
	223: ["DF", "RST 18H",1],
	224: ["E0", "RET PO",1],
	225: ["E1", "POP HL",1],
	226: ["E2 n n", "JP PO,(nn)",3],
	227: ["E3", "EX (SP),HL",1],
	228: ["E4 n n", "CALL PO,(nn)",3],
	229: ["E5", "PUSH HL",1],
	230: ["E6 n", "AND n",2],
	231: ["E7", "RST 20H",1],
	232: ["E8", "RET PE",1],
	233: ["E9", "JP (HL)",1],
	234: ["EA n n", "JP PE,(nn)",3],
	235: ["EB", "EX DE,HL",1],
	236: ["EC n n", "CALL PE,(nn)",3],
	238: ["EE n", "XOR n",2],
	239: ["EF", "RST 28H",1],
	240: ["F0", "RET P",1],
	241: ["F1", "POP AF",1],
	242: ["F2 n n", "JP P,(nn)",3],
	243: ["F3", "DI",1],
	244: ["F4 n n", "CALL P,(nn)",3],
	245: ["F5", "PUSH AF",1],
	246: ["F6 n", "OR n",2],
	247: ["F7", "RST 30H",1],
	248: ["F8", "RET M",1],
	249: ["F9", "LD SP,HL",1],
	250: ["FA n n", "JP M,(nn)",3],
	251: ["FB", "EI",1],
	252: ["FC n n", "CALL M,(nn)",3],
	254: ["FE n", "CP n",2],
	255: ["FF", "RST 38H",1],
	51968: ["CB00", "RLC B",2],
	51969: ["CB01", "RLC C",2],
	51970: ["CB02", "RLC D",2],
	51971: ["CB03", "RLC E",2],
	51972: ["CB04", "RLC H",2],
	51973: ["CB05", "RLC L",2],
	51974: ["CB06", "RLC (HL)",2],
	51975: ["CB07", "RLC A",2],
	51976: ["CB08", "RRC B",2],
	51977: ["CB09", "RRC C",2],
	51978: ["CB0A", "RRC D",2],
	51979: ["CB0B", "RRC E",2],
	51980: ["CB0C", "RRC H",2],
	51981: ["CB0D", "RRC L",2],
	51982: ["CB0E", "RRC (HL)",2],
	51983: ["CB0F", "RRC A",2],
	51984: ["CB10", "RL B",2],
	51985: ["CB11", "RL C",2],
	51986: ["CB12", "RL D",2],
	51987: ["CB13", "RL E",2],
	51988: ["CB14", "RL H",2],
	51989: ["CB15", "RL L",2],
	51990: ["CB16", "RL (HL)",2],
	51991: ["CB17", "RL A",2],
	51992: ["CB18", "RR B",2],
	51993: ["CB19", "RR C",2],
	51994: ["CB1A", "RR D",2],
	51995: ["CB1B", "RR E",2],
	51996: ["CB1C", "RR H",2],
	51997: ["CB1D", "RR L",2],
	51998: ["CB1E", "RR (HL)",2],
	51999: ["CB1F", "RR A",2],
	52000: ["CB20", "SLA B",2],
	52001: ["CB21", "SLA C",2],
	52002: ["CB22", "SLA D",2],
	52003: ["CB23", "SLA E",2],
	52004: ["CB24", "SLA H",2],
	52005: ["CB25", "SLA L",2],
	52006: ["CB26", "SLA (HL)",2],
	52007: ["CB27", "SLA A",2],
	52008: ["CB28", "SRA B",2],
	52009: ["CB29", "SRA C",2],
	52010: ["CB2A", "SRA D",2],
	52011: ["CB2B", "SRA E",2],
	52012: ["CB2C", "SRA H",2],
	52013: ["CB2D", "SRA L",2],
	52014: ["CB2E", "SRA (HL)",2],
	52015: ["CB2F", "SRA A",2],
	52016: ["CB30", "SLL B*",2],
	52017: ["CB31", "SLL C*",2],
	52018: ["CB32", "SLL D*",2],
	52019: ["CB33", "SLL E*",2],
	52020: ["CB34", "SLL H*",2],
	52021: ["CB35", "SLL L*",2],
	52022: ["CB36", "SLL (HL)*",2],
	52023: ["CB37", "SLL A*",2],
	52024: ["CB38", "SRL B",2],
	52025: ["CB39", "SRL C",2],
	52026: ["CB3A", "SRL D",2],
	52027: ["CB3B", "SRL E",2],
	52028: ["CB3C", "SRL H",2],
	52029: ["CB3D", "SRL L",2],
	52030: ["CB3E", "SRL (HL)",2],
	52031: ["CB3F", "SRL A",2],
	52032: ["CB40", "BIT 0,B",2],
	52033: ["CB41", "BIT 0,C",2],
	52034: ["CB42", "BIT 0,D",2],
	52035: ["CB43", "BIT 0,E",2],
	52036: ["CB44", "BIT 0,H",2],
	52037: ["CB45", "BIT 0,L",2],
	52038: ["CB46", "BIT 0,(HL)",2],
	52039: ["CB47", "BIT 0,A",2],
	52040: ["CB48", "BIT 1,B",2],
	52041: ["CB49", "BIT 1,C",2],
	52042: ["CB4A", "BIT 1,D",2],
	52043: ["CB4B", "BIT 1,E",2],
	52044: ["CB4C", "BIT 1,H",2],
	52045: ["CB4D", "BIT 1,L",2],
	52046: ["CB4E", "BIT 1,(HL)",2],
	52047: ["CB4F", "BIT 1,A",2],
	52048: ["CB50", "BIT 2,B",2],
	52049: ["CB51", "BIT 2,C",2],
	52050: ["CB52", "BIT 2,D",2],
	52051: ["CB53", "BIT 2,E",2],
	52052: ["CB54", "BIT 2,H",2],
	52053: ["CB55", "BIT 2,L",2],
	52054: ["CB56", "BIT 2,(HL)",2],
	52055: ["CB57", "BIT 2,A",2],
	52056: ["CB58", "BIT 3,B",2],
	52057: ["CB59", "BIT 3,C",2],
	52058: ["CB5A", "BIT 3,D",2],
	52059: ["CB5B", "BIT 3,E",2],
	52060: ["CB5C", "BIT 3,H",2],
	52061: ["CB5D", "BIT 3,L",2],
	52062: ["CB5E", "BIT 3,(HL)",2],
	52063: ["CB5F", "BIT 3,A",2],
	52064: ["CB60", "BIT 4,B",2],
	52065: ["CB61", "BIT 4,C",2],
	52066: ["CB62", "BIT 4,D",2],
	52067: ["CB63", "BIT 4,E",2],
	52068: ["CB64", "BIT 4,H",2],
	52069: ["CB65", "BIT 4,L",2],
	52070: ["CB66", "BIT 4,(HL)",2],
	52071: ["CB67", "BIT 4,A",2],
	52072: ["CB68", "BIT 5,B",2],
	52073: ["CB69", "BIT 5,C",2],
	52074: ["CB6A", "BIT 5,D",2],
	52075: ["CB6B", "BIT 5,E",2],
	52076: ["CB6C", "BIT 5,H",2],
	52077: ["CB6D", "BIT 5,L",2],
	52078: ["CB6E", "BIT 5,(HL)",2],
	52079: ["CB6F", "BIT 5,A",2],
	52080: ["CB70", "BIT 6,B",2],
	52081: ["CB71", "BIT 6,C",2],
	52082: ["CB72", "BIT 6,D",2],
	52083: ["CB73", "BIT 6,E",2],
	52084: ["CB74", "BIT 6,H",2],
	52085: ["CB75", "BIT 6,L",2],
	52086: ["CB76", "BIT 6,(HL)",2],
	52087: ["CB77", "BIT 6,A",2],
	52088: ["CB78", "BIT 7,B",2],
	52089: ["CB79", "BIT 7,C",2],
	52090: ["CB7A", "BIT 7,D",2],
	52091: ["CB7B", "BIT 7,E",2],
	52092: ["CB7C", "BIT 7,H",2],
	52093: ["CB7D", "BIT 7,L",2],
	52094: ["CB7E", "BIT 7,(HL)",2],
	52095: ["CB7F", "BIT 7,A",2],
	52096: ["CB80", "RES 0,B",2],
	52097: ["CB81", "RES 0,C",2],
	52098: ["CB82", "RES 0,D",2],
	52099: ["CB83", "RES 0,E",2],
	52100: ["CB84", "RES 0,H",2],
	52101: ["CB85", "RES 0,L",2],
	52102: ["CB86", "RES 0,(HL)",2],
	52103: ["CB87", "RES 0,A",2],
	52104: ["CB88", "RES 1,B",2],
	52105: ["CB89", "RES 1,C",2],
	52106: ["CB8A", "RES 1,D",2],
	52107: ["CB8B", "RES 1,E",2],
	52108: ["CB8C", "RES 1,H",2],
	52109: ["CB8D", "RES 1,L",2],
	52110: ["CB8E", "RES 1,(HL)",2],
	52111: ["CB8F", "RES 1,A",2],
	52112: ["CB90", "RES 2,B",2],
	52113: ["CB91", "RES 2,C",2],
	52114: ["CB92", "RES 2,D",2],
	52115: ["CB93", "RES 2,E",2],
	52116: ["CB94", "RES 2,H",2],
	52117: ["CB95", "RES 2,L",2],
	52118: ["CB96", "RES 2,(HL)",2],
	52119: ["CB97", "RES 2,A",2],
	52120: ["CB98", "RES 3,B",2],
	52121: ["CB99", "RES 3,C",2],
	52122: ["CB9A", "RES 3,D",2],
	52123: ["CB9B", "RES 3,E",2],
	52124: ["CB9C", "RES 3,H",2],
	52125: ["CB9D", "RES 3,L",2],
	52126: ["CB9E", "RES 3,(HL)",2],
	52127: ["CB9F", "RES 3,A",2],
	52128: ["CBA0", "RES 4,B",2],
	52129: ["CBA1", "RES 4,C",2],
	52130: ["CBA2", "RES 4,D",2],
	52131: ["CBA3", "RES 4,E",2],
	52132: ["CBA4", "RES 4,H",2],
	52133: ["CBA5", "RES 4,L",2],
	52134: ["CBA6", "RES 4,(HL)",2],
	52135: ["CBA7", "RES 4,A",2],
	52136: ["CBA8", "RES 5,B",2],
	52137: ["CBA9", "RES 5,C",2],
	52138: ["CBAA", "RES 5,D",2],
	52139: ["CBAB", "RES 5,E",2],
	52140: ["CBAC", "RES 5,H",2],
	52141: ["CBAD", "RES 5,L",2],
	52142: ["CBAE", "RES 5,(HL)",2],
	52143: ["CBAF", "RES 5,A",2],
	52144: ["CBB0", "RES 6,B",2],
	52145: ["CBB1", "RES 6,C",2],
	52146: ["CBB2", "RES 6,D",2],
	52147: ["CBB3", "RES 6,E",2],
	52148: ["CBB4", "RES 6,H",2],
	52149: ["CBB5", "RES 6,L",2],
	52150: ["CBB6", "RES 6,(HL)",2],
	52151: ["CBB7", "RES 6,A",2],
	52152: ["CBB8", "RES 7,B",2],
	52153: ["CBB9", "RES 7,C",2],
	52154: ["CBBA", "RES 7,D",2],
	52155: ["CBBB", "RES 7,E",2],
	52156: ["CBBC", "RES 7,H",2],
	52157: ["CBBD", "RES 7,L",2],
	52158: ["CBBE", "RES 7,(HL)",2],
	52159: ["CBBF", "RES 7,A",2],
	52160: ["CBC0", "SET 0,B",2],
	52161: ["CBC1", "SET 0,C",2],
	52162: ["CBC2", "SET 0,D",2],
	52163: ["CBC3", "SET 0,E",2],
	52164: ["CBC4", "SET 0,H",2],
	52165: ["CBC5", "SET 0,L",2],
	52166: ["CBC6", "SET 0,(HL)",2],
	52167: ["CBC7", "SET 0,A",2],
	52168: ["CBC8", "SET 1,B",2],
	52169: ["CBC9", "SET 1,C",2],
	52170: ["CBCA", "SET 1,D",2],
	52171: ["CBCB", "SET 1,E",2],
	52172: ["CBCC", "SET 1,H",2],
	52173: ["CBCD", "SET 1,L",2],
	52174: ["CBCE", "SET 1,(HL)",2],
	52175: ["CBCF", "SET 1,A",2],
	52176: ["CBD0", "SET 2,B",2],
	52177: ["CBD1", "SET 2,C",2],
	52178: ["CBD2", "SET 2,D",2],
	52179: ["CBD3", "SET 2,E",2],
	52180: ["CBD4", "SET 2,H",2],
	52181: ["CBD5", "SET 2,L",2],
	52182: ["CBD6", "SET 2,(HL)",2],
	52183: ["CBD7", "SET 2,A",2],
	52184: ["CBD8", "SET 3,B",2],
	52185: ["CBD9", "SET 3,C",2],
	52186: ["CBDA", "SET 3,D",2],
	52187: ["CBDB", "SET 3,E",2],
	52188: ["CBDC", "SET 3,H",2],
	52189: ["CBDD", "SET 3,L",2],
	52190: ["CBDE", "SET 3,(HL)",2],
	52191: ["CBDF", "SET 3,A",2],
	52192: ["CBE0", "SET 4,B",2],
	52193: ["CBE1", "SET 4,C",2],
	52194: ["CBE2", "SET 4,D",2],
	52195: ["CBE3", "SET 4,E",2],
	52196: ["CBE4", "SET 4,H",2],
	52197: ["CBE5", "SET 4,L",2],
	52198: ["CBE6", "SET 4,(HL)",2],
	52199: ["CBE7", "SET 4,A",2],
	52200: ["CBE8", "SET 5,B",2],
	52201: ["CBE9", "SET 5,C",2],
	52202: ["CBEA", "SET 5,D",2],
	52203: ["CBEB", "SET 5,E",2],
	52204: ["CBEC", "SET 5,H",2],
	52205: ["CBED", "SET 5,L",2],
	52206: ["CBEE", "SET 5,(HL)",2],
	52207: ["CBEF", "SET 5,A",2],
	52208: ["CBF0", "SET 6,B",2],
	52209: ["CBF1", "SET 6,C",2],
	52210: ["CBF2", "SET 6,D",2],
	52211: ["CBF3", "SET 6,E",2],
	52212: ["CBF4", "SET 6,H",2],
	52213: ["CBF5", "SET 6,L",2],
	52214: ["CBF6", "SET 6,(HL)",2],
	52215: ["CBF7", "SET 6,A",2],
	52216: ["CBF8", "SET 7,B",2],
	52217: ["CBF9", "SET 7,C",2],
	52218: ["CBFA", "SET 7,D",2],
	52219: ["CBFB", "SET 7,E",2],
	52220: ["CBFC", "SET 7,H",2],
	52221: ["CBFD", "SET 7,L",2],
	52222: ["CBFE", "SET 7,(HL)",2],
	52223: ["CBFF", "SET 7,A",2],
	60736: ["ED40", "IN B,(C)",2],
	60737: ["ED41", "OUT (C),B",2],
	60738: ["ED42", "SBC HL,BC",2],
	60739: ["ED43 n n", "LD (nn),BC",4],
	60740: ["ED44", "NEG",2],
	60741: ["ED45", "RETN",2],
	60742: ["ED46", "IM 0",2],
	60743: ["ED47", "LD I,A",2],
	60744: ["ED48", "IN C,(C)",2],
	60745: ["ED49", "OUT (C),C",2],
	60746: ["ED4A", "ADC HL,BC",2],
	60747: ["ED4B n n", "LD BC,(nn)",4],
	60748: ["ED4C", "NEG*",2],
	60749: ["ED4D", "RETI",2],
	60750: ["ED4E", "IM 0/1*",2],
	60751: ["ED4F", "LD R,A",2],
	60752: ["ED50", "IN D,(C)",2],
	60753: ["ED51", "OUT (C),D",2],
	60754: ["ED52", "SBC HL,DE",2],
	60755: ["ED53 n n", "LD (nn),DE",4],
	60756: ["ED54", "NEG*",2],
	60757: ["ED55", "RETN*",2],
	60758: ["ED56", "IM 1",2],
	60759: ["ED57", "LD A,I",2],
	60760: ["ED58", "IN E,(C)",2],
	60761: ["ED59", "OUT (C),E",2],
	60762: ["ED5A", "ADC HL,DE",2],
	60763: ["ED5B n n", "LD DE,(nn)",4],
	60764: ["ED5C", "NEG*",2],
	60765: ["ED5D", "RETN*",2],
	60766: ["ED5E", "IM 2",2],
	60767: ["ED5F", "LD A,R",2],
	60768: ["ED60", "IN H,(C)",2],
	60769: ["ED61", "OUT (C),H",2],
	60770: ["ED62", "SBC HL,HL",2],
	60771: ["ED63 n n", "LD (nn),HL",4],
	60772: ["ED64", "NEG*",2],
	60773: ["ED65", "RETN*",2],
	60774: ["ED66", "IM 0*",2],
	60775: ["ED67", "RRD",2],
	60776: ["ED68", "IN L,(C)",2],
	60777: ["ED69", "OUT (C),L",2],
	60778: ["ED6A", "ADC HL,HL",2],
	60779: ["ED6B n n", "LD HL,(nn)",4],
	60780: ["ED6C", "NEG*",2],
	60781: ["ED6D", "RETN*",2],
	60782: ["ED6E", "IM 0/1*",2],
	60783: ["ED6F", "RLD",2],
	60784: ["ED70", "IN F,(C)* / IN (C)*",2],
	60785: ["ED71", "OUT (C),0*",2],
	60786: ["ED72", "SBC HL,SP",2],
	60787: ["ED73 n n", "LD (nn),SP",4],
	60788: ["ED74", "NEG*",2],
	60789: ["ED75", "RETN*",2],
	60790: ["ED76", "IM 1*",2],
	60792: ["ED78", "IN A,(C)",2],
	60793: ["ED79", "OUT (C),A",2],
	60794: ["ED7A", "ADC HL,SP",2],
	60795: ["ED7B n n", "LD SP,(nn)",4],
	60796: ["ED7C", "NEG*",2],
	60797: ["ED7D", "RETN*",2],
	60798: ["ED7E", "IM 2*",2],
	60832: ["EDA0", "LDI",2],
	60833: ["EDA1", "CPI",2],
	60834: ["EDA2", "INI",2],
	60835: ["EDA3", "OUTI",2],
	60840: ["EDA8", "LDD",2],
	60841: ["EDA9", "CPD",2],
	60842: ["EDAA", "IND",2],
	60843: ["EDAB", "OUTD",2],
	60848: ["EDB0", "LDIR",2],
	60849: ["EDB1", "CPIR",2],
	60850: ["EDB2", "INIR",2],
	60851: ["EDB3", "OTIR",2],
	60856: ["EDB8", "LDDR",2],
	60857: ["EDB9", "CPDR",2],
	60858: ["EDBA", "INDR",2],
	60859: ["EDBB", "OTDR",2],
	56585: ["DD09", "ADD IX,BC",2],
	56601: ["DD19", "ADD IX,DE",2],
	56609: ["DD21 n n", "LD IX,nn",4],
	56610: ["DD22 n n", "LD (nn),IX",4],
	56611: ["DD23", "INC IX",2],
	56612: ["DD24", "INC IXH*",2],
	56613: ["DD25", "DEC IXH*",2],
	56614: ["DD26 n", "LD IXH,n*",3],
	56617: ["DD29", "ADD IX,IX",2],
	56618: ["DD2A n n", "LD IX,(nn)",4],
	56619: ["DD2B", "DEC IX",2],
	56620: ["DD2C", "INC IXL*",2],
	56621: ["DD2D", "DEC IXL*",2],
	56622: ["DD2E n", "LD IXL,n*",3],
	56628: ["DD34 d", "INC (IX+d)",3],
	56629: ["DD35 d", "DEC (IX+d)",3],
	56630: ["DD36 d n", "LD (IX+d),n",4],
	56633: ["DD39", "ADD IX,SP",2],
	56644: ["DD44", "LD B,IXH*",2],
	56645: ["DD45", "LD B,IXL*",2],
	56646: ["DD46 d", "LD B,(IX+d)",3],
	56652: ["DD4C", "LD C,IXH*",2],
	56653: ["DD4D", "LD C,IXL*",2],
	56654: ["DD4E d", "LD C,(IX+d)",3],
	56660: ["DD54", "LD D,IXH*",2],
	56661: ["DD55", "LD D,IXL*",2],
	56662: ["DD56 d", "LD D,(IX+d)",3],
	56668: ["DD5C", "LD E,IXH*",2],
	56669: ["DD5D", "LD E,IXL*",2],
	56670: ["DD5E d", "LD E,(IX+d)",3],
	56672: ["DD60", "LD IXH,B*",2],
	56673: ["DD61", "LD IXH,C*",2],
	56674: ["DD62", "LD IXH,D*",2],
	56675: ["DD63", "LD IXH,E*",2],
	56676: ["DD64", "LD IXH,IXH*",2],
	56677: ["DD65", "LD IXH,IXL*",2],
	56678: ["DD66 d", "LD H,(IX+d)",3],
	56679: ["DD67", "LD IXH,A*",2],
	56680: ["DD68", "LD IXL,B*",2],
	56681: ["DD69", "LD IXL,C*",2],
	56682: ["DD6A", "LD IXL,D*",2],
	56683: ["DD6B", "LD IXL,E*",2],
	56684: ["DD6C", "LD IXL,IXH*",2],
	56685: ["DD6D", "LD IXL,IXL*",2],
	56686: ["DD6E d", "LD L,(IX+d)",3],
	56687: ["DD6F", "LD IXL,A*",2],
	56688: ["DD70 d", "LD (IX+d),B",3],
	56689: ["DD71 d", "LD (IX+d),C",3],
	56690: ["DD72 d", "LD (IX+d),D",3],
	56691: ["DD73 d", "LD (IX+d),E",3],
	56692: ["DD74 d", "LD (IX+d),H",3],
	56693: ["DD75 d", "LD (IX+d),L",3],
	56695: ["DD77 d", "LD (IX+d),A",3],
	56700: ["DD7C", "LD A,IXH*",2],
	56701: ["DD7D", "LD A,IXL*",2],
	56702: ["DD7E d", "LD A,(IX+d)",3],
	56708: ["DD84", "ADD A,IXH*",2],
	56709: ["DD85", "ADD A,IXL*",2],
	56710: ["DD86 d", "ADD A,(IX+d)",3],
	56716: ["DD8C", "ADC A,IXH*",2],
	56717: ["DD8D", "ADC A,IXL*",2],
	56718: ["DD8E d", "ADC A,(IX+d)",3],
	56724: ["DD94", "SUB IXH*",2],
	56725: ["DD95", "SUB IXL*",2],
	56726: ["DD96 d", "SUB (IX+d)",3],
	56732: ["DD9C", "SBC A,IXH*",2],
	56733: ["DD9D", "SBC A,IXL*",2],
	56734: ["DD9E d", "SBC A,(IX+d)",3],
	56740: ["DDA4", "AND IXH*",2],
	56741: ["DDA5", "AND IXL*",2],
	56742: ["DDA6 d", "AND (IX+d)",3],
	56748: ["DDAC", "XOR IXH*",2],
	56749: ["DDAD", "XOR IXL*",2],
	56750: ["DDAE d", "XOR (IX+d)",3],
	56756: ["DDB4", "OR IXH*",2],
	56757: ["DDB5", "OR IXL*",2],
	56758: ["DDB6 d", "OR (IX+d)",3],
	56764: ["DDBC", "CP IXH*",2],
	56765: ["DDBD", "CP IXL*",2],
	56766: ["DDBE d", "CP (IX+d)",3],
	56801: ["DDE1", "POP IX",2],
	56803: ["DDE3", "EX (SP),IX",2],
	56805: ["DDE5", "PUSH IX",2],
	56809: ["DDE9", "JP (IX)",2],
	56825: ["DDF9", "LD SP,IX",2],
	64777: ["FD09", "ADD IY,BC",2],
	64793: ["FD19", "ADD IY,DE",2],
	64801: ["FD21 n n", "LD IY,nn",4],
	64802: ["FD22 n n", "LD (nn),IY",4],
	64803: ["FD23", "INC IY",2],
	64804: ["FD24", "INC IYH*",2],
	64805: ["FD25", "DEC IYH*",2],
	64806: ["FD26 n", "LD IYH,n*",3],
	64809: ["FD29", "ADD IY,IY",2],
	64810: ["FD2A n n", "LD IY,(nn)",4],
	64811: ["FD2B", "DEC IY",2],
	64812: ["FD2C", "INC IYL*",2],
	64813: ["FD2D", "DEC IYL*",2],
	64814: ["FD2E n", "LD IYL,n*",3],
	64820: ["FD34 d", "INC (IY+d)",3],
	64821: ["FD35 d", "DEC (IY+d)",3],
	64822: ["FD36 d n", "LD (IY+d),n",4],
	64825: ["FD39", "ADD IY,SP",2],
	64836: ["FD44", "LD B,IYH*",2],
	64837: ["FD45", "LD B,IYL*",2],
	64838: ["FD46 d", "LD B,(IY+d)",3],
	64844: ["FD4C", "LD C,IYH*",2],
	64845: ["FD4D", "LD C,IYL*",2],
	64846: ["FD4E d", "LD C,(IY+d)",3],
	64852: ["FD54", "LD D,IYH*",2],
	64853: ["FD55", "LD D,IYL*",2],
	64854: ["FD56 d", "LD D,(IY+d)",3],
	64860: ["FD5C", "LD E,IYH*",2],
	64861: ["FD5D", "LD E,IYL*",2],
	64862: ["FD5E d", "LD E,(IY+d)",3],
	64864: ["FD60", "LD IYH,B*",2],
	64865: ["FD61", "LD IYH,C*",2],
	64866: ["FD62", "LD IYH,D*",2],
	64867: ["FD63", "LD IYH,E*",2],
	64868: ["FD64", "LD IYH,IYH*",2],
	64869: ["FD65", "LD IYH,IYL*",2],
	64870: ["FD66 d", "LD H,(IY+d)",3],
	64871: ["FD67", "LD IYH,A*",2],
	64872: ["FD68", "LD IYL,B*",2],
	64873: ["FD69", "LD IYL,C*",2],
	64874: ["FD6A", "LD IYL,D*",2],
	64875: ["FD6B", "LD IYL,E*",2],
	64876: ["FD6C", "LD IYL,IYH*",2],
	64877: ["FD6D", "LD IYL,IYL*",2],
	64878: ["FD6E d", "LD L,(IY+d)",3],
	64879: ["FD6F", "LD IYL,A*",2],
	64880: ["FD70 d", "LD (IY+d),B",3],
	64881: ["FD71 d", "LD (IY+d),C",3],
	64882: ["FD72 d", "LD (IY+d),D",3],
	64883: ["FD73 d", "LD (IY+d),E",3],
	64884: ["FD74 d", "LD (IY+d),H",3],
	64885: ["FD75 d", "LD (IY+d),L",3],
	64887: ["FD77 d", "LD (IY+d),A",3],
	64892: ["FD7C", "LD A,IYH*",2],
	64893: ["FD7D", "LD A,IYL*",2],
	64894: ["FD7E d", "LD A,(IY+d)",3],
	64900: ["FD84", "ADD A,IYH*",2],
	64901: ["FD85", "ADD A,IYL*",2],
	64902: ["FD86 d", "ADD A,(IY+d)",3],
	64908: ["FD8C", "ADC A,IYH*",2],
	64909: ["FD8D", "ADC A,IYL*",2],
	64910: ["FD8E d", "ADC A,(IY+d)",3],
	64916: ["FD94", "SUB IYH*",2],
	64917: ["FD95", "SUB IYL*",2],
	64918: ["FD96 d", "SUB (IY+d)",3],
	64924: ["FD9C", "SBC A,IYH*",2],
	64925: ["FD9D", "SBC A,IYL*",2],
	64926: ["FD9E d", "SBC A,(IY+d)",3],
	64932: ["FDA4", "AND IYH*",2],
	64933: ["FDA5", "AND IYL*",2],
	64934: ["FDA6 d", "AND (IY+d)",3],
	64940: ["FDAC", "XOR IYH*",2],
	64941: ["FDAD", "XOR IYL*",2],
	64942: ["FDAE d", "XOR (IY+d)",3],
	64948: ["FDB4", "OR IYH*",2],
	64949: ["FDB5", "OR IYL*",2],
	64950: ["FDB6 d", "OR (IY+d)",3],
	64956: ["FDBC", "CP IYH*",2],
	64957: ["FDBD", "CP IYL*",2],
	64958: ["FDBE d", "CP (IY+d)",3],
	64993: ["FDE1", "POP IY",2],
	64995: ["FDE3", "EX (SP),IY",2],
	64997: ["FDE5", "PUSH IY",2],
	65001: ["FDE9", "JP (IY)",2],
	65017: ["FDF9", "LD SP,IY",2],
	14535424: ["DDCB d 00", "LD B,RLC (IX+d)*",4],
	14535425: ["DDCB d 01", "LD C,RLC (IX+d)*",4],
	14535426: ["DDCB d 02", "LD D,RLC (IX+d)*",4],
	14535427: ["DDCB d 03", "LD E,RLC (IX+d)*",4],
	14535428: ["DDCB d 04", "LD H,RLC (IX+d)*",4],
	14535429: ["DDCB d 05", "LD L,RLC (IX+d)*",4],
	14535430: ["DDCB d 06", "RLC (IX+d)",4],
	14535431: ["DDCB d 07", "LD A,RLC (IX+d)*",4],
	14535432: ["DDCB d 08", "LD B,RRC (IX+d)*",4],
	14535433: ["DDCB d 09", "LD C,RRC (IX+d)*",4],
	14535434: ["DDCB d 0A", "LD D,RRC (IX+d)*",4],
	14535435: ["DDCB d 0B", "LD E,RRC (IX+d)*",4],
	14535436: ["DDCB d 0C", "LD H,RRC (IX+d)*",4],
	14535437: ["DDCB d 0D", "LD L,RRC (IX+d)*",4],
	14535438: ["DDCB d 0E", "RRC (IX+d)",4],
	14535439: ["DDCB d 0F", "LD A,RRC (IX+d)*",4],
	14535440: ["DDCB d 10", "LD B,RL (IX+d)*",4],
	14535441: ["DDCB d 11", "LD C,RL (IX+d)*",4],
	14535442: ["DDCB d 12", "LD D,RL (IX+d)*",4],
	14535443: ["DDCB d 13", "LD E,RL (IX+d)*",4],
	14535444: ["DDCB d 14", "LD H,RL (IX+d)*",4],
	14535445: ["DDCB d 15", "LD L,RL (IX+d)*",4],
	14535446: ["DDCB d 16", "RL (IX+d)",4],
	14535447: ["DDCB d 17", "LD A,RL (IX+d)*",4],
	14535448: ["DDCB d 18", "LD B,RR (IX+d)*",4],
	14535449: ["DDCB d 19", "LD C,RR (IX+d)*",4],
	14535450: ["DDCB d 1A", "LD D,RR (IX+d)*",4],
	14535451: ["DDCB d 1B", "LD E,RR (IX+d)*",4],
	14535452: ["DDCB d 1C", "LD H,RR (IX+d)*",4],
	14535453: ["DDCB d 1D", "LD L,RR (IX+d)*",4],
	14535454: ["DDCB d 1E", "RR (IX+d)",4],
	14535455: ["DDCB d 1F", "LD A,RR (IX+d)*",4],
	14535456: ["DDCB d 20", "LD B,SLA (IX+d)*",4],
	14535457: ["DDCB d 21", "LD C,SLA (IX+d)*",4],
	14535458: ["DDCB d 22", "LD D,SLA (IX+d)*",4],
	14535459: ["DDCB d 23", "LD E,SLA (IX+d)*",4],
	14535460: ["DDCB d 24", "LD H,SLA (IX+d)*",4],
	14535461: ["DDCB d 25", "LD L,SLA (IX+d)*",4],
	14535462: ["DDCB d 26", "SLA (IX+d)",4],
	14535463: ["DDCB d 27", "LD A,SLA (IX+d)*",4],
	14535464: ["DDCB d 28", "LD B,SRA (IX+d)*",4],
	14535465: ["DDCB d 29", "LD C,SRA (IX+d)*",4],
	14535466: ["DDCB d 2A", "LD D,SRA (IX+d)*",4],
	14535467: ["DDCB d 2B", "LD E,SRA (IX+d)*",4],
	14535468: ["DDCB d 2C", "LD H,SRA (IX+d)*",4],
	14535469: ["DDCB d 2D", "LD L,SRA (IX+d)*",4],
	14535470: ["DDCB d 2E", "SRA (IX+d)",4],
	14535471: ["DDCB d 2F", "LD A,SRA (IX+d)*",4],
	14535472: ["DDCB d 30", "LD B,SLL (IX+d)*",4],
	14535473: ["DDCB d 31", "LD C,SLL (IX+d)*",4],
	14535474: ["DDCB d 32", "LD D,SLL (IX+d)*",4],
	14535475: ["DDCB d 33", "LD E,SLL (IX+d)*",4],
	14535476: ["DDCB d 34", "LD H,SLL (IX+d)*",4],
	14535477: ["DDCB d 35", "LD L,SLL (IX+d)*",4],
	14535478: ["DDCB d 36", "SLL (IX+d)*",4],
	14535479: ["DDCB d 37", "LD A,SLL (IX+d)*",4],
	14535480: ["DDCB d 38", "LD B,SRL (IX+d)*",4],
	14535481: ["DDCB d 39", "LD C,SRL (IX+d)*",4],
	14535482: ["DDCB d 3A", "LD D,SRL (IX+d)*",4],
	14535483: ["DDCB d 3B", "LD E,SRL (IX+d)*",4],
	14535484: ["DDCB d 3C", "LD H,SRL (IX+d)*",4],
	14535485: ["DDCB d 3D", "LD L,SRL (IX+d)*",4],
	14535486: ["DDCB d 3E", "SRL (IX+d)",4],
	14535487: ["DDCB d 3F", "LD A,SRL (IX+d)*",4],
	14535488: ["DDCB d 40", "BIT 0,(IX+d)*",4],
	14535489: ["DDCB d 41", "BIT 0,(IX+d)*",4],
	14535490: ["DDCB d 42", "BIT 0,(IX+d)*",4],
	14535491: ["DDCB d 43", "BIT 0,(IX+d)*",4],
	14535492: ["DDCB d 44", "BIT 0,(IX+d)*",4],
	14535493: ["DDCB d 45", "BIT 0,(IX+d)*",4],
	14535494: ["DDCB d 46", "BIT 0,(IX+d)",4],
	14535495: ["DDCB d 47", "BIT 0,(IX+d)*",4],
	14535496: ["DDCB d 48", "BIT 1,(IX+d)*",4],
	14535497: ["DDCB d 49", "BIT 1,(IX+d)*",4],
	14535498: ["DDCB d 4A", "BIT 1,(IX+d)*",4],
	14535499: ["DDCB d 4B", "BIT 1,(IX+d)*",4],
	14535500: ["DDCB d 4C", "BIT 1,(IX+d)*",4],
	14535501: ["DDCB d 4D", "BIT 1,(IX+d)*",4],
	14535502: ["DDCB d 4E", "BIT 1,(IX+d)",4],
	14535503: ["DDCB d 4F", "BIT 1,(IX+d)*",4],
	14535504: ["DDCB d 50", "BIT 2,(IX+d)*",4],
	14535505: ["DDCB d 51", "BIT 2,(IX+d)*",4],
	14535506: ["DDCB d 52", "BIT 2,(IX+d)*",4],
	14535507: ["DDCB d 53", "BIT 2,(IX+d)*",4],
	14535508: ["DDCB d 54", "BIT 2,(IX+d)*",4],
	14535509: ["DDCB d 55", "BIT 2,(IX+d)*",4],
	14535510: ["DDCB d 56", "BIT 2,(IX+d)",4],
	14535511: ["DDCB d 57", "BIT 2,(IX+d)*",4],
	14535512: ["DDCB d 58", "BIT 3,(IX+d)*",4],
	14535513: ["DDCB d 59", "BIT 3,(IX+d)*",4],
	14535514: ["DDCB d 5A", "BIT 3,(IX+d)*",4],
	14535515: ["DDCB d 5B", "BIT 3,(IX+d)*",4],
	14535516: ["DDCB d 5C", "BIT 3,(IX+d)*",4],
	14535517: ["DDCB d 5D", "BIT 3,(IX+d)*",4],
	14535518: ["DDCB d 5E", "BIT 3,(IX+d)",4],
	14535519: ["DDCB d 5F", "BIT 3,(IX+d)*",4],
	14535520: ["DDCB d 60", "BIT 4,(IX+d)*",4],
	14535521: ["DDCB d 61", "BIT 4,(IX+d)*",4],
	14535522: ["DDCB d 62", "BIT 4,(IX+d)*",4],
	14535523: ["DDCB d 63", "BIT 4,(IX+d)*",4],
	14535524: ["DDCB d 64", "BIT 4,(IX+d)*",4],
	14535525: ["DDCB d 65", "BIT 4,(IX+d)*",4],
	14535526: ["DDCB d 66", "BIT 4,(IX+d)",4],
	14535527: ["DDCB d 67", "BIT 4,(IX+d)*",4],
	14535528: ["DDCB d 68", "BIT 5,(IX+d)*",4],
	14535529: ["DDCB d 69", "BIT 5,(IX+d)*",4],
	14535530: ["DDCB d 6A", "BIT 5,(IX+d)*",4],
	14535531: ["DDCB d 6B", "BIT 5,(IX+d)*",4],
	14535532: ["DDCB d 6C", "BIT 5,(IX+d)*",4],
	14535533: ["DDCB d 6D", "BIT 5,(IX+d)*",4],
	14535534: ["DDCB d 6E", "BIT 5,(IX+d)",4],
	14535535: ["DDCB d 6F", "BIT 5,(IX+d)*",4],
	14535536: ["DDCB d 70", "BIT 6,(IX+d)*",4],
	14535537: ["DDCB d 71", "BIT 6,(IX+d)*",4],
	14535538: ["DDCB d 72", "BIT 6,(IX+d)*",4],
	14535539: ["DDCB d 73", "BIT 6,(IX+d)*",4],
	14535540: ["DDCB d 74", "BIT 6,(IX+d)*",4],
	14535541: ["DDCB d 75", "BIT 6,(IX+d)*",4],
	14535542: ["DDCB d 76", "BIT 6,(IX+d)",4],
	14535543: ["DDCB d 77", "BIT 6,(IX+d)*",4],
	14535544: ["DDCB d 78", "BIT 7,(IX+d)*",4],
	14535545: ["DDCB d 79", "BIT 7,(IX+d)*",4],
	14535546: ["DDCB d 7A", "BIT 7,(IX+d)*",4],
	14535547: ["DDCB d 7B", "BIT 7,(IX+d)*",4],
	14535548: ["DDCB d 7C", "BIT 7,(IX+d)*",4],
	14535549: ["DDCB d 7D", "BIT 7,(IX+d)*",4],
	14535550: ["DDCB d 7E", "BIT 7,(IX+d)",4],
	14535551: ["DDCB d 7F", "BIT 7,(IX+d)*",4],
	14535552: ["DDCB d 80", "LD B,RES 0,(IX+d)*",4],
	14535553: ["DDCB d 81", "LD C,RES 0,(IX+d)*",4],
	14535554: ["DDCB d 82", "LD D,RES 0,(IX+d)*",4],
	14535555: ["DDCB d 83", "LD E,RES 0,(IX+d)*",4],
	14535556: ["DDCB d 84", "LD H,RES 0,(IX+d)*",4],
	14535557: ["DDCB d 85", "LD L,RES 0,(IX+d)*",4],
	14535558: ["DDCB d 86", "RES 0,(IX+d)",4],
	14535559: ["DDCB d 87", "LD A,RES 0,(IX+d)*",4],
	14535560: ["DDCB d 88", "LD B,RES 1,(IX+d)*",4],
	14535561: ["DDCB d 89", "LD C,RES 1,(IX+d)*",4],
	14535562: ["DDCB d 8A", "LD D,RES 1,(IX+d)*",4],
	14535563: ["DDCB d 8B", "LD E,RES 1,(IX+d)*",4],
	14535564: ["DDCB d 8C", "LD H,RES 1,(IX+d)*",4],
	14535565: ["DDCB d 8D", "LD L,RES 1,(IX+d)*",4],
	14535566: ["DDCB d 8E", "RES 1,(IX+d)",4],
	14535567: ["DDCB d 8F", "LD A,RES 1,(IX+d)*",4],
	14535568: ["DDCB d 90", "LD B,RES 2,(IX+d)*",4],
	14535569: ["DDCB d 91", "LD C,RES 2,(IX+d)*",4],
	14535570: ["DDCB d 92", "LD D,RES 2,(IX+d)*",4],
	14535571: ["DDCB d 93", "LD E,RES 2,(IX+d)*",4],
	14535572: ["DDCB d 94", "LD H,RES 2,(IX+d)*",4],
	14535573: ["DDCB d 95", "LD L,RES 2,(IX+d)*",4],
	14535574: ["DDCB d 96", "RES 2,(IX+d)",4],
	14535575: ["DDCB d 97", "LD A,RES 2,(IX+d)*",4],
	14535576: ["DDCB d 98", "LD B,RES 3,(IX+d)*",4],
	14535577: ["DDCB d 99", "LD C,RES 3,(IX+d)*",4],
	14535578: ["DDCB d 9A", "LD D,RES 3,(IX+d)*",4],
	14535579: ["DDCB d 9B", "LD E,RES 3,(IX+d)*",4],
	14535580: ["DDCB d 9C", "LD H,RES 3,(IX+d)*",4],
	14535581: ["DDCB d 9D", "LD L,RES 3,(IX+d)*",4],
	14535582: ["DDCB d 9E", "RES 3,(IX+d)",4],
	14535583: ["DDCB d 9F", "LD A,RES 3,(IX+d)*",4],
	14535584: ["DDCB d A0", "LD B,RES 4,(IX+d)*",4],
	14535585: ["DDCB d A1", "LD C,RES 4,(IX+d)*",4],
	14535586: ["DDCB d A2", "LD D,RES 4,(IX+d)*",4],
	14535587: ["DDCB d A3", "LD E,RES 4,(IX+d)*",4],
	14535588: ["DDCB d A4", "LD H,RES 4,(IX+d)*",4],
	14535589: ["DDCB d A5", "LD L,RES 4,(IX+d)*",4],
	14535590: ["DDCB d A6", "RES 4,(IX+d)",4],
	14535591: ["DDCB d A7", "LD A,RES 4,(IX+d)*",4],
	14535592: ["DDCB d A8", "LD B,RES 5,(IX+d)*",4],
	14535593: ["DDCB d A9", "LD C,RES 5,(IX+d)*",4],
	14535594: ["DDCB d AA", "LD D,RES 5,(IX+d)*",4],
	14535595: ["DDCB d AB", "LD E,RES 5,(IX+d)*",4],
	14535596: ["DDCB d AC", "LD H,RES 5,(IX+d)*",4],
	14535597: ["DDCB d AD", "LD L,RES 5,(IX+d)*",4],
	14535598: ["DDCB d AE", "RES 5,(IX+d)",4],
	14535599: ["DDCB d AF", "LD A,RES 5,(IX+d)*",4],
	14535600: ["DDCB d B0", "LD B,RES 6,(IX+d)*",4],
	14535601: ["DDCB d B1", "LD C,RES 6,(IX+d)*",4],
	14535602: ["DDCB d B2", "LD D,RES 6,(IX+d)*",4],
	14535603: ["DDCB d B3", "LD E,RES 6,(IX+d)*",4],
	14535604: ["DDCB d B4", "LD H,RES 6,(IX+d)*",4],
	14535605: ["DDCB d B5", "LD L,RES 6,(IX+d)*",4],
	14535606: ["DDCB d B6", "RES 6,(IX+d)",4],
	14535607: ["DDCB d B7", "LD A,RES 6,(IX+d)*",4],
	14535608: ["DDCB d B8", "LD B,RES 7,(IX+d)*",4],
	14535609: ["DDCB d B9", "LD C,RES 7,(IX+d)*",4],
	14535610: ["DDCB d BA", "LD D,RES 7,(IX+d)*",4],
	14535611: ["DDCB d BB", "LD E,RES 7,(IX+d)*",4],
	14535612: ["DDCB d BC", "LD H,RES 7,(IX+d)*",4],
	14535613: ["DDCB d BD", "LD L,RES 7,(IX+d)*",4],
	14535614: ["DDCB d BE", "RES 7,(IX+d)",4],
	14535615: ["DDCB d BF", "LD A,RES 7,(IX+d)*",4],
	14535616: ["DDCB d C0", "LD B,SET 0,(IX+d)*",4],
	14535617: ["DDCB d C1", "LD C,SET 0,(IX+d)*",4],
	14535618: ["DDCB d C2", "LD D,SET 0,(IX+d)*",4],
	14535619: ["DDCB d C3", "LD E,SET 0,(IX+d)*",4],
	14535620: ["DDCB d C4", "LD H,SET 0,(IX+d)*",4],
	14535621: ["DDCB d C5", "LD L,SET 0,(IX+d)*",4],
	14535622: ["DDCB d C6", "SET 0,(IX+d)",4],
	14535623: ["DDCB d C7", "LD A,SET 0,(IX+d)*",4],
	14535624: ["DDCB d C8", "LD B,SET 1,(IX+d)*",4],
	14535625: ["DDCB d C9", "LD C,SET 1,(IX+d)*",4],
	14535626: ["DDCB d CA", "LD D,SET 1,(IX+d)*",4],
	14535627: ["DDCB d CB", "LD E,SET 1,(IX+d)*",4],
	14535628: ["DDCB d CC", "LD H,SET 1,(IX+d)*",4],
	14535629: ["DDCB d CD", "LD L,SET 1,(IX+d)*",4],
	14535630: ["DDCB d CE", "SET 1,(IX+d)",4],
	14535631: ["DDCB d CF", "LD A,SET 1,(IX+d)*",4],
	14535632: ["DDCB d D0", "LD B,SET 2,(IX+d)*",4],
	14535633: ["DDCB d D1", "LD C,SET 2,(IX+d)*",4],
	14535634: ["DDCB d D2", "LD D,SET 2,(IX+d)*",4],
	14535635: ["DDCB d D3", "LD E,SET 2,(IX+d)*",4],
	14535636: ["DDCB d D4", "LD H,SET 2,(IX+d)*",4],
	14535637: ["DDCB d D5", "LD L,SET 2,(IX+d)*",4],
	14535638: ["DDCB d D6", "SET 2,(IX+d)",4],
	14535639: ["DDCB d D7", "LD A,SET 2,(IX+d)*",4],
	14535640: ["DDCB d D8", "LD B,SET 3,(IX+d)*",4],
	14535641: ["DDCB d D9", "LD C,SET 3,(IX+d)*",4],
	14535642: ["DDCB d DA", "LD D,SET 3,(IX+d)*",4],
	14535643: ["DDCB d DB", "LD E,SET 3,(IX+d)*",4],
	14535644: ["DDCB d DC", "LD H,SET 3,(IX+d)*",4],
	14535645: ["DDCB d DD", "LD L,SET 3,(IX+d)*",4],
	14535646: ["DDCB d DE", "SET 3,(IX+d)",4],
	14535647: ["DDCB d DF", "LD A,SET 3,(IX+d)*",4],
	14535648: ["DDCB d E0", "LD B,SET 4,(IX+d)*",4],
	14535649: ["DDCB d E1", "LD C,SET 4,(IX+d)*",4],
	14535650: ["DDCB d E2", "LD D,SET 4,(IX+d)*",4],
	14535651: ["DDCB d E3", "LD E,SET 4,(IX+d)*",4],
	14535652: ["DDCB d E4", "LD H,SET 4,(IX+d)*",4],
	14535653: ["DDCB d E5", "LD L,SET 4,(IX+d)*",4],
	14535654: ["DDCB d E6", "SET 4,(IX+d)",4],
	14535655: ["DDCB d E7", "LD A,SET 4,(IX+d)*",4],
	14535656: ["DDCB d E8", "LD B,SET 5,(IX+d)*",4],
	14535657: ["DDCB d E9", "LD C,SET 5,(IX+d)*",4],
	14535658: ["DDCB d EA", "LD D,SET 5,(IX+d)*",4],
	14535659: ["DDCB d EB", "LD E,SET 5,(IX+d)*",4],
	14535660: ["DDCB d EC", "LD H,SET 5,(IX+d)*",4],
	14535661: ["DDCB d ED", "LD L,SET 5,(IX+d)*",4],
	14535662: ["DDCB d EE", "SET 5,(IX+d)",4],
	14535663: ["DDCB d EF", "LD A,SET 5,(IX+d)*",4],
	14535664: ["DDCB d F0", "LD B,SET 6,(IX+d)*",4],
	14535665: ["DDCB d F1", "LD C,SET 6,(IX+d)*",4],
	14535666: ["DDCB d F2", "LD D,SET 6,(IX+d)*",4],
	14535667: ["DDCB d F3", "LD E,SET 6,(IX+d)*",4],
	14535668: ["DDCB d F4", "LD H,SET 6,(IX+d)*",4],
	14535669: ["DDCB d F5", "LD L,SET 6,(IX+d)*",4],
	14535670: ["DDCB d F6", "SET 6,(IX+d)",4],
	14535671: ["DDCB d F7", "LD A,SET 6,(IX+d)*",4],
	14535672: ["DDCB d F8", "LD B,SET 7,(IX+d)*",4],
	14535673: ["DDCB d F9", "LD C,SET 7,(IX+d)*",4],
	14535674: ["DDCB d FA", "LD D,SET 7,(IX+d)*",4],
	14535675: ["DDCB d FB", "LD E,SET 7,(IX+d)*",4],
	14535676: ["DDCB d FC", "LD H,SET 7,(IX+d)*",4],
	14535677: ["DDCB d FD", "LD L,SET 7,(IX+d)*",4],
	14535678: ["DDCB d FE", "SET 7,(IX+d)",4],
	14535679: ["DDCB d FF", "LD A,SET 7,(IX+d)*",4],
	16632576: ["FDCB d 00", "LD B,RLC (IY+d)*",4],
	16632577: ["FDCB d 01", "LD C,RLC (IY+d)*",4],
	16632578: ["FDCB d 02", "LD D,RLC (IY+d)*",4],
	16632579: ["FDCB d 03", "LD E,RLC (IY+d)*",4],
	16632580: ["FDCB d 04", "LD H,RLC (IY+d)*",4],
	16632581: ["FDCB d 05", "LD L,RLC (IY+d)*",4],
	16632582: ["FDCB d 06", "RLC (IY+d)",4],
	16632583: ["FDCB d 07", "LD A,RLC (IY+d)*",4],
	16632584: ["FDCB d 08", "LD B,RRC (IY+d)*",4],
	16632585: ["FDCB d 09", "LD C,RRC (IY+d)*",4],
	16632586: ["FDCB d 0A", "LD D,RRC (IY+d)*",4],
	16632587: ["FDCB d 0B", "LD E,RRC (IY+d)*",4],
	16632588: ["FDCB d 0C", "LD H,RRC (IY+d)*",4],
	16632589: ["FDCB d 0D", "LD L,RRC (IY+d)*",4],
	16632590: ["FDCB d 0E", "RRC (IY+d)",4],
	16632591: ["FDCB d 0F", "LD A,RRC (IY+d)*",4],
	16632592: ["FDCB d 10", "LD B,RL (IY+d)*",4],
	16632593: ["FDCB d 11", "LD C,RL (IY+d)*",4],
	16632594: ["FDCB d 12", "LD D,RL (IY+d)*",4],
	16632595: ["FDCB d 13", "LD E,RL (IY+d)*",4],
	16632596: ["FDCB d 14", "LD H,RL (IY+d)*",4],
	16632597: ["FDCB d 15", "LD L,RL (IY+d)*",4],
	16632598: ["FDCB d 16", "RL (IY+d)",4],
	16632599: ["FDCB d 17", "LD A,RL (IY+d)*",4],
	16632600: ["FDCB d 18", "LD B,RR (IY+d)*",4],
	16632601: ["FDCB d 19", "LD C,RR (IY+d)*",4],
	16632602: ["FDCB d 1A", "LD D,RR (IY+d)*",4],
	16632603: ["FDCB d 1B", "LD E,RR (IY+d)*",4],
	16632604: ["FDCB d 1C", "LD H,RR (IY+d)*",4],
	16632605: ["FDCB d 1D", "LD L,RR (IY+d)*",4],
	16632606: ["FDCB d 1E", "RR (IY+d)",4],
	16632607: ["FDCB d 1F", "LD A,RR (IY+d)*",4],
	16632608: ["FDCB d 20", "LD B,SLA (IY+d)*",4],
	16632609: ["FDCB d 21", "LD C,SLA (IY+d)*",4],
	16632610: ["FDCB d 22", "LD D,SLA (IY+d)*",4],
	16632611: ["FDCB d 23", "LD E,SLA (IY+d)*",4],
	16632612: ["FDCB d 24", "LD H,SLA (IY+d)*",4],
	16632613: ["FDCB d 25", "LD L,SLA (IY+d)*",4],
	16632614: ["FDCB d 26", "SLA (IY+d)",4],
	16632615: ["FDCB d 27", "LD A,SLA (IY+d)*",4],
	16632616: ["FDCB d 28", "LD B,SRA (IY+d)*",4],
	16632617: ["FDCB d 29", "LD C,SRA (IY+d)*",4],
	16632618: ["FDCB d 2A", "LD D,SRA (IY+d)*",4],
	16632619: ["FDCB d 2B", "LD E,SRA (IY+d)*",4],
	16632620: ["FDCB d 2C", "LD H,SRA (IY+d)*",4],
	16632621: ["FDCB d 2D", "LD L,SRA (IY+d)*",4],
	16632622: ["FDCB d 2E", "SRA (IY+d)",4],
	16632623: ["FDCB d 2F", "LD A,SRA (IY+d)*",4],
	16632624: ["FDCB d 30", "LD B,SLL (IY+d)*",4],
	16632625: ["FDCB d 31", "LD C,SLL (IY+d)*",4],
	16632626: ["FDCB d 32", "LD D,SLL (IY+d)*",4],
	16632627: ["FDCB d 33", "LD E,SLL (IY+d)*",4],
	16632628: ["FDCB d 34", "LD H,SLL (IY+d)*",4],
	16632629: ["FDCB d 35", "LD L,SLL (IY+d)*",4],
	16632630: ["FDCB d 36", "SLL (IY+d)*",4],
	16632631: ["FDCB d 37", "LD A,SLL (IY+d)*",4],
	16632632: ["FDCB d 38", "LD B,SRL (IY+d)*",4],
	16632633: ["FDCB d 39", "LD C,SRL (IY+d)*",4],
	16632634: ["FDCB d 3A", "LD D,SRL (IY+d)*",4],
	16632635: ["FDCB d 3B", "LD E,SRL (IY+d)*",4],
	16632636: ["FDCB d 3C", "LD H,SRL (IY+d)*",4],
	16632637: ["FDCB d 3D", "LD L,SRL (IY+d)*",4],
	16632638: ["FDCB d 3E", "SRL (IY+d)",4],
	16632639: ["FDCB d 3F", "LD A,SRL (IY+d)*",4],
	16632640: ["FDCB d 40", "BIT 0,(IY+d)*",4],
	16632641: ["FDCB d 41", "BIT 0,(IY+d)*",4],
	16632642: ["FDCB d 42", "BIT 0,(IY+d)*",4],
	16632643: ["FDCB d 43", "BIT 0,(IY+d)*",4],
	16632644: ["FDCB d 44", "BIT 0,(IY+d)*",4],
	16632645: ["FDCB d 45", "BIT 0,(IY+d)*",4],
	16632646: ["FDCB d 46", "BIT 0,(IY+d)",4],
	16632647: ["FDCB d 47", "BIT 0,(IY+d)*",4],
	16632648: ["FDCB d 48", "BIT 1,(IY+d)*",4],
	16632649: ["FDCB d 49", "BIT 1,(IY+d)*",4],
	16632650: ["FDCB d 4A", "BIT 1,(IY+d)*",4],
	16632651: ["FDCB d 4B", "BIT 1,(IY+d)*",4],
	16632652: ["FDCB d 4C", "BIT 1,(IY+d)*",4],
	16632653: ["FDCB d 4D", "BIT 1,(IY+d)*",4],
	16632654: ["FDCB d 4E", "BIT 1,(IY+d)",4],
	16632655: ["FDCB d 4F", "BIT 1,(IY+d)*",4],
	16632656: ["FDCB d 50", "BIT 2,(IY+d)*",4],
	16632657: ["FDCB d 51", "BIT 2,(IY+d)*",4],
	16632658: ["FDCB d 52", "BIT 2,(IY+d)*",4],
	16632659: ["FDCB d 53", "BIT 2,(IY+d)*",4],
	16632660: ["FDCB d 54", "BIT 2,(IY+d)*",4],
	16632661: ["FDCB d 55", "BIT 2,(IY+d)*",4],
	16632662: ["FDCB d 56", "BIT 2,(IY+d)",4],
	16632663: ["FDCB d 57", "BIT 2,(IY+d)*",4],
	16632664: ["FDCB d 58", "BIT 3,(IY+d)*",4],
	16632665: ["FDCB d 59", "BIT 3,(IY+d)*",4],
	16632666: ["FDCB d 5A", "BIT 3,(IY+d)*",4],
	16632667: ["FDCB d 5B", "BIT 3,(IY+d)*",4],
	16632668: ["FDCB d 5C", "BIT 3,(IY+d)*",4],
	16632669: ["FDCB d 5D", "BIT 3,(IY+d)*",4],
	16632670: ["FDCB d 5E", "BIT 3,(IY+d)",4],
	16632671: ["FDCB d 5F", "BIT 3,(IY+d)*",4],
	16632672: ["FDCB d 60", "BIT 4,(IY+d)*",4],
	16632673: ["FDCB d 61", "BIT 4,(IY+d)*",4],
	16632674: ["FDCB d 62", "BIT 4,(IY+d)*",4],
	16632675: ["FDCB d 63", "BIT 4,(IY+d)*",4],
	16632676: ["FDCB d 64", "BIT 4,(IY+d)*",4],
	16632677: ["FDCB d 65", "BIT 4,(IY+d)*",4],
	16632678: ["FDCB d 66", "BIT 4,(IY+d)",4],
	16632679: ["FDCB d 67", "BIT 4,(IY+d)*",4],
	16632680: ["FDCB d 68", "BIT 5,(IY+d)*",4],
	16632681: ["FDCB d 69", "BIT 5,(IY+d)*",4],
	16632682: ["FDCB d 6A", "BIT 5,(IY+d)*",4],
	16632683: ["FDCB d 6B", "BIT 5,(IY+d)*",4],
	16632684: ["FDCB d 6C", "BIT 5,(IY+d)*",4],
	16632685: ["FDCB d 6D", "BIT 5,(IY+d)*",4],
	16632686: ["FDCB d 6E", "BIT 5,(IY+d)",4],
	16632687: ["FDCB d 6F", "BIT 5,(IY+d)*",4],
	16632688: ["FDCB d 70", "BIT 6,(IY+d)*",4],
	16632689: ["FDCB d 71", "BIT 6,(IY+d)*",4],
	16632690: ["FDCB d 72", "BIT 6,(IY+d)*",4],
	16632691: ["FDCB d 73", "BIT 6,(IY+d)*",4],
	16632692: ["FDCB d 74", "BIT 6,(IY+d)*",4],
	16632693: ["FDCB d 75", "BIT 6,(IY+d)*",4],
	16632694: ["FDCB d 76", "BIT 6,(IY+d)",4],
	16632695: ["FDCB d 77", "BIT 6,(IY+d)*",4],
	16632696: ["FDCB d 78", "BIT 7,(IY+d)*",4],
	16632697: ["FDCB d 79", "BIT 7,(IY+d)*",4],
	16632698: ["FDCB d 7A", "BIT 7,(IY+d)*",4],
	16632699: ["FDCB d 7B", "BIT 7,(IY+d)*",4],
	16632700: ["FDCB d 7C", "BIT 7,(IY+d)*",4],
	16632701: ["FDCB d 7D", "BIT 7,(IY+d)*",4],
	16632702: ["FDCB d 7E", "BIT 7,(IY+d)",4],
	16632703: ["FDCB d 7F", "BIT 7,(IY+d)*",4],
	16632704: ["FDCB d 80", "LD B,RES 0,(IY+d)*",4],
	16632705: ["FDCB d 81", "LD C,RES 0,(IY+d)*",4],
	16632706: ["FDCB d 82", "LD D,RES 0,(IY+d)*",4],
	16632707: ["FDCB d 83", "LD E,RES 0,(IY+d)*",4],
	16632708: ["FDCB d 84", "LD H,RES 0,(IY+d)*",4],
	16632709: ["FDCB d 85", "LD L,RES 0,(IY+d)*",4],
	16632710: ["FDCB d 86", "RES 0,(IY+d)",4],
	16632711: ["FDCB d 87", "LD A,RES 0,(IY+d)*",4],
	16632712: ["FDCB d 88", "LD B,RES 1,(IY+d)*",4],
	16632713: ["FDCB d 89", "LD C,RES 1,(IY+d)*",4],
	16632714: ["FDCB d 8A", "LD D,RES 1,(IY+d)*",4],
	16632715: ["FDCB d 8B", "LD E,RES 1,(IY+d)*",4],
	16632716: ["FDCB d 8C", "LD H,RES 1,(IY+d)*",4],
	16632717: ["FDCB d 8D", "LD L,RES 1,(IY+d)*",4],
	16632718: ["FDCB d 8E", "RES 1,(IY+d)",4],
	16632719: ["FDCB d 8F", "LD A,RES 1,(IY+d)*",4],
	16632720: ["FDCB d 90", "LD B,RES 2,(IY+d)*",4],
	16632721: ["FDCB d 91", "LD C,RES 2,(IY+d)*",4],
	16632722: ["FDCB d 92", "LD D,RES 2,(IY+d)*",4],
	16632723: ["FDCB d 93", "LD E,RES 2,(IY+d)*",4],
	16632724: ["FDCB d 94", "LD H,RES 2,(IY+d)*",4],
	16632725: ["FDCB d 95", "LD L,RES 2,(IY+d)*",4],
	16632726: ["FDCB d 96", "RES 2,(IY+d)",4],
	16632727: ["FDCB d 97", "LD A,RES 2,(IY+d)*",4],
	16632728: ["FDCB d 98", "LD B,RES 3,(IY+d)*",4],
	16632729: ["FDCB d 99", "LD C,RES 3,(IY+d)*",4],
	16632730: ["FDCB d 9A", "LD D,RES 3,(IY+d)*",4],
	16632731: ["FDCB d 9B", "LD E,RES 3,(IY+d)*",4],
	16632732: ["FDCB d 9C", "LD H,RES 3,(IY+d)*",4],
	16632733: ["FDCB d 9D", "LD L,RES 3,(IY+d)*",4],
	16632734: ["FDCB d 9E", "RES 3,(IY+d)",4],
	16632735: ["FDCB d 9F", "LD A,RES 3,(IY+d)*",4],
	16632736: ["FDCB d A0", "LD B,RES 4,(IY+d)*",4],
	16632737: ["FDCB d A1", "LD C,RES 4,(IY+d)*",4],
	16632738: ["FDCB d A2", "LD D,RES 4,(IY+d)*",4],
	16632739: ["FDCB d A3", "LD E,RES 4,(IY+d)*",4],
	16632740: ["FDCB d A4", "LD H,RES 4,(IY+d)*",4],
	16632741: ["FDCB d A5", "LD L,RES 4,(IY+d)*",4],
	16632742: ["FDCB d A6", "RES 4,(IY+d)",4],
	16632743: ["FDCB d A7", "LD A,RES 4,(IY+d)*",4],
	16632744: ["FDCB d A8", "LD B,RES 5,(IY+d)*",4],
	16632745: ["FDCB d A9", "LD C,RES 5,(IY+d)*",4],
	16632746: ["FDCB d AA", "LD D,RES 5,(IY+d)*",4],
	16632747: ["FDCB d AB", "LD E,RES 5,(IY+d)*",4],
	16632748: ["FDCB d AC", "LD H,RES 5,(IY+d)*",4],
	16632749: ["FDCB d AD", "LD L,RES 5,(IY+d)*",4],
	16632750: ["FDCB d AE", "RES 5,(IY+d)",4],
	16632751: ["FDCB d AF", "LD A,RES 5,(IY+d)*",4],
	16632752: ["FDCB d B0", "LD B,RES 6,(IY+d)*",4],
	16632753: ["FDCB d B1", "LD C,RES 6,(IY+d)*",4],
	16632754: ["FDCB d B2", "LD D,RES 6,(IY+d)*",4],
	16632755: ["FDCB d B3", "LD E,RES 6,(IY+d)*",4],
	16632756: ["FDCB d B4", "LD H,RES 6,(IY+d)*",4],
	16632757: ["FDCB d B5", "LD L,RES 6,(IY+d)*",4],
	16632758: ["FDCB d B6", "RES 6,(IY+d)",4],
	16632759: ["FDCB d B7", "LD A,RES 6,(IY+d)*",4],
	16632760: ["FDCB d B8", "LD B,RES 7,(IY+d)*",4],
	16632761: ["FDCB d B9", "LD C,RES 7,(IY+d)*",4],
	16632762: ["FDCB d BA", "LD D,RES 7,(IY+d)*",4],
	16632763: ["FDCB d BB", "LD E,RES 7,(IY+d)*",4],
	16632764: ["FDCB d BC", "LD H,RES 7,(IY+d)*",4],
	16632765: ["FDCB d BD", "LD L,RES 7,(IY+d)*",4],
	16632766: ["FDCB d BE", "RES 7,(IY+d)",4],
	16632767: ["FDCB d BF", "LD A,RES 7,(IY+d)*",4],
	16632768: ["FDCB d C0", "LD B,SET 0,(IY+d)*",4],
	16632769: ["FDCB d C1", "LD C,SET 0,(IY+d)*",4],
	16632770: ["FDCB d C2", "LD D,SET 0,(IY+d)*",4],
	16632771: ["FDCB d C3", "LD E,SET 0,(IY+d)*",4],
	16632772: ["FDCB d C4", "LD H,SET 0,(IY+d)*",4],
	16632773: ["FDCB d C5", "LD L,SET 0,(IY+d)*",4],
	16632774: ["FDCB d C6", "SET 0,(IY+d)",4],
	16632775: ["FDCB d C7", "LD A,SET 0,(IY+d)*",4],
	16632776: ["FDCB d C8", "LD B,SET 1,(IY+d)*",4],
	16632777: ["FDCB d C9", "LD C,SET 1,(IY+d)*",4],
	16632778: ["FDCB d CA", "LD D,SET 1,(IY+d)*",4],
	16632779: ["FDCB d CB", "LD E,SET 1,(IY+d)*",4],
	16632780: ["FDCB d CC", "LD H,SET 1,(IY+d)*",4],
	16632781: ["FDCB d CD", "LD L,SET 1,(IY+d)*",4],
	16632782: ["FDCB d CE", "SET 1,(IY+d)",4],
	16632783: ["FDCB d CF", "LD A,SET 1,(IY+d)*",4],
	16632784: ["FDCB d D0", "LD B,SET 2,(IY+d)*",4],
	16632785: ["FDCB d D1", "LD C,SET 2,(IY+d)*",4],
	16632786: ["FDCB d D2", "LD D,SET 2,(IY+d)*",4],
	16632787: ["FDCB d D3", "LD E,SET 2,(IY+d)*",4],
	16632788: ["FDCB d D4", "LD H,SET 2,(IY+d)*",4],
	16632789: ["FDCB d D5", "LD L,SET 2,(IY+d)*",4],
	16632790: ["FDCB d D6", "SET 2,(IY+d)",4],
	16632791: ["FDCB d D7", "LD A,SET 2,(IY+d)*",4],
	16632792: ["FDCB d D8", "LD B,SET 3,(IY+d)*",4],
	16632793: ["FDCB d D9", "LD C,SET 3,(IY+d)*",4],
	16632794: ["FDCB d DA", "LD D,SET 3,(IY+d)*",4],
	16632795: ["FDCB d DB", "LD E,SET 3,(IY+d)*",4],
	16632796: ["FDCB d DC", "LD H,SET 3,(IY+d)*",4],
	16632797: ["FDCB d DD", "LD L,SET 3,(IY+d)*",4],
	16632798: ["FDCB d DE", "SET 3,(IY+d)",4],
	16632799: ["FDCB d DF", "LD A,SET 3,(IY+d)*",4],
	16632800: ["FDCB d E0", "LD B,SET 4,(IY+d)*",4],
	16632801: ["FDCB d E1", "LD C,SET 4,(IY+d)*",4],
	16632802: ["FDCB d E2", "LD D,SET 4,(IY+d)*",4],
	16632803: ["FDCB d E3", "LD E,SET 4,(IY+d)*",4],
	16632804: ["FDCB d E4", "LD H,SET 4,(IY+d)*",4],
	16632805: ["FDCB d E5", "LD L,SET 4,(IY+d)*",4],
	16632806: ["FDCB d E6", "SET 4,(IY+d)",4],
	16632807: ["FDCB d E7", "LD A,SET 4,(IY+d)*",4],
	16632808: ["FDCB d E8", "LD B,SET 5,(IY+d)*",4],
	16632809: ["FDCB d E9", "LD C,SET 5,(IY+d)*",4],
	16632810: ["FDCB d EA", "LD D,SET 5,(IY+d)*",4],
	16632811: ["FDCB d EB", "LD E,SET 5,(IY+d)*",4],
	16632812: ["FDCB d EC", "LD H,SET 5,(IY+d)*",4],
	16632813: ["FDCB d ED", "LD L,SET 5,(IY+d)*",4],
	16632814: ["FDCB d EE", "SET 5,(IY+d)",4],
	16632815: ["FDCB d EF", "LD A,SET 5,(IY+d)*",4],
	16632816: ["FDCB d F0", "LD B,SET 6,(IY+d)*",4],
	16632817: ["FDCB d F1", "LD C,SET 6,(IY+d)*",4],
	16632818: ["FDCB d F2", "LD D,SET 6,(IY+d)*",4],
	16632819: ["FDCB d F3", "LD E,SET 6,(IY+d)*",4],
	16632820: ["FDCB d F4", "LD H,SET 6,(IY+d)*",4],
	16632821: ["FDCB d F5", "LD L,SET 6,(IY+d)*",4],
	16632822: ["FDCB d F6", "SET 6,(IY+d)",4],
	16632823: ["FDCB d F7", "LD A,SET 6,(IY+d)*",4],
	16632824: ["FDCB d F8", "LD B,SET 7,(IY+d)*",4],
	16632825: ["FDCB d F9", "LD C,SET 7,(IY+d)*",4],
	16632826: ["FDCB d FA", "LD D,SET 7,(IY+d)*",4],
	16632827: ["FDCB d FB", "LD E,SET 7,(IY+d)*",4],
	16632828: ["FDCB d FC", "LD H,SET 7,(IY+d)*",4],
	16632829: ["FDCB d FD", "LD L,SET 7,(IY+d)*",4],
	16632830: ["FDCB d FE", "SET 7,(IY+d)",4],
	16632831: ["FDCB d FF", "LD A,SET 7,(IY+d)*",4],
};

function toHex8(x) {
	if (x === undefined)
		throw("NO X");
	var s = x.toString(16).toUpperCase();
	return "0".slice(s.length - 1) + s;
}

function Dasm(data) {
	var op, n, nn, d, e;
	if (data.length <= 2) {
		var reader = data[0];
		var pc = data[1];
		var opcodeb2;
		var op_displ = -1;
		var opcode = reader(pc++);
		if (opcode == 0xDD || opcode == 0xFD) {
			do {
				// DD* FD*
				opcodeb2 = reader(pc++);
				// DDDD, DDFD, FDDD, FDFD handle first byte as NOP
				if (opcodeb2 == 0xDD || opcodeb2 == 0xFD) {
					opcode = opcodeb2;
					continue;
				}
				opcode = (opcode << 8) | opcodeb2;
				// DDCB????, FDCB????
				if (opcode == 0xFDCB || opcode == 0xDDCB) {
					opcode = (opcode << 8) | reader(pc + 1);
				}
				// DD??, FD??
				else {
					// DD and FD falls back to regular instructions
					isFDorDD = true;
				}
				break;
			} while (opcode == 0xDD || opcode == 0xFD);
		}
		else if (opcode == 0xED || opcode == 0xCB) {
			opcode = (opcode << 8) | reader(pc++);
		}
		var op = OpCodes[opcode];
		if (!op) {
			if (isFDorDD) {
				op = OpCodes[opcode & 0xFF];
				pc += 1;
			}
		}
		if (!op) {
			console.log("INVALID DASM OPCODE!");
			return;
		}
		n = -300;
		for (var chi in op[0]) {
			var chc = op[0][chi];
			switch(chc) {
			case 'd':
				d = reader(pc++);
				break;
			case 'e':
				e = reader(pc++);
				break;
			case 'n':
				if (n < -255) {
					n = reader(pc++);
				}
				else {
					nn = (reader(pc++) << 8) | n;
				}
				break;
			}
		}
	}
	else {
		op = OpCodes[data[1]];
		n = data[2];
		nn = data[3];
		e = data[4];
		d = data[5];
	}
	var rescode = op[0];
	var restxt = op[1];
	if (rescode.indexOf("d") != -1) {
		d = d & 0xFF;
		rescode = rescode.replace("d", toHex8(d));
		if (d & 0x80) d = -((~d + 1) & 0xFF);
		restxt = restxt.replace("d", d);
		if (d < 0) {
			restxt = restxt.replace("+","");
		}
	}
	if (rescode.indexOf("e") != -1) {
		e = e & 0xFF;
		rescode = rescode.replace("e", toHex8(e));
		if (e & 0x80) e = -((~e + 1) & 0xFF);
		restxt = restxt.replace("e", e);
		if (e < 0) {
			restxt = restxt.replace("+","");
		}
	}
	if (rescode.indexOf("n n") != -1) {
		rescode = rescode.replace("n", toHex8((nn & 0xFF) >> 0));
		rescode = rescode.replace("n", toHex8((nn & 0xFF00) >> 8));
		restxt = restxt.replace("n", toHex8((nn & 0xFF00) >> 8));
		restxt = restxt.replace("n", toHex8(nn & 0xFF));
	}
	if (rescode.indexOf("n") != -1) {
		rescode = rescode.replace("n", toHex8(n));
		restxt = restxt.replace("n", toHex8(n));
	}
	return [rescode + "          ".substr(0,12-rescode.length) + restxt, op[2] ];
}

module.exports = Dasm;

},{}],4:[function(require,module,exports){
var Utils = require("./utils.js");

var idiv = function (a, b) {
	return ~~(a / b);
};

// buffer tools
var bufferAlloc = function(size, data) {
	var buf = new Uint8Array(size);
	if (data) {
		if (typeof(data) == "string") {
			for (var i = 0; i < size; i++) {
				buf[i] = data.charCodeAt(i);
			}
		}
		else {
			for (var i = 0; i < size; i++) {
				buf[i] = data[i];
			}
		}
	}
	return buf;
};

var bufferSeek = function (buffer, offset, absolute) {
	var buf = buffer.buffer;
	var bufOffset = (absolute ? 0 : buffer.byteOffset) + offset;
	if (bufOffset >= buf.length || bufOffset < 0)
		throw("BUFFER: out of range");
	return new Uint8Array(buf, bufOffset);
};

var bufferCopyStr = function (buffer, offset, str) {
	for (var i = 0; i < str.length; i++) {
		buffer[offset + i] = str.charCodeAt(i);
	}
};

var bufferCopyData = function (buffer, offset, data) {
	for (var i = 0; i < data.length; i++) {
		buffer[offset + i] = data[i];
	}
};

var bufferStrCmp = function(buffer, offset, str) {
	for (var i = 0; i < str.length; i++) {
		if (buffer[offset+i] != str.charCodeAt(i)) return 1;
	}
	return 0;
};

var bufferGetStr = function(buffer, offset, length) {
	var str = "";
	for (var i = 0; i < length; i++) {
		str += String.fromCharCode(buffer[offset+i]);
	}
	return str;
};

var bufferHexdump = function(buffer, offset, length) {
	var str = "";
	for(var i =0; i < length; i++) {
		if (str) str += " ";
		str += Utils.toHex8(buffer[offset + i]);
	}
	return str;
};

// disk
function FDisk() {
	this.log = false;
	this.dsk = null;
	this.sectorsPerTrack = 9;
	this.sectorSize = 512;
	this.totSec = 720;
	this.numHeads = 1;
	this.tracksPerSide = (this.totSec / this.sectorsPerTrack / this.numHeads) | 0;
	this.data = 0;
	this.track = 0;
	this.side = 0;
	this.position = 0;
	// read helpers
	this.readOffset = 0;
	this.readLength = 0;
	this.readSource = 0; // 0: dsk, 1: readBuffer
	this.readBuffer = new Uint8Array(6);
	this.sectorLengthTable = {
		128: 0,
		256: 1,
		512: 2,
		1024: 4 };
}

FDisk.prototype.isReady = function() {
	return this.dsk !== null;
};

FDisk.prototype.loadDsk = function(name, dsk) {
	this.name = name;
	this.dsk = bufferAlloc(dsk.length, dsk);
	this.parse();
};

FDisk.prototype.seek = function(track, sector, side) {
	if (this.dsk !== null) {
		var offsetSector = (sector !== 0) ? (sector - 1) : 0;
		this.position = (track * (this.sectorsPerTrack * this.numHeads) + (this.sectorsPerTrack * side) + offsetSector) * this.sectorSize;
		this.track = track;
		this.side = side;
		if (this.log)
			console.log("FD1793: disk seek position:",Utils.toHex16(this.position),"(side:"+this.side+",trk:"+this.track+",sec:"+sector+")");
	}
};

FDisk.prototype.readSector = function(sector) {
	this.readLength = this.sectorSize;
	this.readOffset = 0;
	this.readSource = 0;
	this.sector = sector;
	this.seek(this.track, this.sector, this.side);
};

FDisk.prototype.readAddress = function() {
	this.readLength = 6;
	this.readSource = 1;
	this.readOffset = 0;
	this.readBuffer[0] = this.track;
	this.readBuffer[1] = this.side;
	this.readBuffer[2] = 1;
	this.readBuffer[3] = this.sectorLengthTable[this.sectorSize];
	this.readBuffer[4] = 0;
	this.readBuffer[5] = 0;
};

FDisk.prototype.read = function() {
	var finished = true;
	if (this.readOffset < this.readLength) {
		finished = false;
		if (this.readSource) {
			this.data = this.readBuffer[this.readOffset];
		}
		else {
			this.data = this.dsk[this.position + this.readOffset];
		}
		this.readOffset++;
	}
	else {
		if (this.log)
			console.log("FD1793: read finished src:",this.readSource);
	}
	//console.log("FD1793: disk read, rem:",this.readLength,"finished:",finished);
	return finished;
};

FDisk.prototype.parse = function() {
	//console.log("FD1793: disk dump begin");
	if (!this.isReady()) {
		console.warn("FD1793: no disk");
		return;
	}
	if (this.dsk[0] == 0xEB) {
		if (this.dsk[2] != 0x90)
			console.log("FD1793: not really msdos compatible:", bufferHexdump(this.dsk, 0, 3));
	}
	else if (this.dsk[0] != 0xE9) {
		console.warn("FD1793: non msdos disk!");
		return;
	}
	//console.log("FD1793: creator:", bufferGetStr(this.dsk, 3, 7));
	var sectorSize = this.dsk[11] + this.dsk[12] * 256;
	//console.log("FD1793: sector size:", sectorSize);
	var sectorsPerCluster = this.dsk[13];
	//console.log("FD1793: sectors per cluster:", sectorSize);
	var rsvdSecCnt = this.dsk[14] + this.dsk[15] * 256;
	//console.log("FD1793: reserved sectors (1):", rsvdSecCnt);
	var numFat = this.dsk[16];
	//console.log("FD1793: count of FAT data sctructures (2):", numFat);
	var rootEntCnt = this.dsk[17] + this.dsk[18] * 256;
	//console.log("FD1793: count of 32b dir entries in root:", rootEntCnt);
	var totSec = this.dsk[19] + this.dsk[20] * 256;
	//console.log("FD1793: total sector count:", totSec);
	//console.log("FD1793: media:",bufferHexdump(this.dsk,21,1));
	var fatSize = this.dsk[22] + this.dsk[23] * 256;
	//console.log("FD1793: fat entry size (sectors):", fatSize);
	var secPerTrk = this.dsk[24] + this.dsk[25] * 256;
	//console.log("FD1793: sectors per track:", secPerTrk);
	var numHeads = this.dsk[26] + this.dsk[27] * 256;
	//console.log("FD1793: number of heads:", numHeads);
	//console.log("FD1793: hidden sec:", bufferHexdump(this.dsk, 28,4));
	//console.log("FD1793: total sector count 32:", bufferHexdump(this.dsk, 32,4));
	//console.log("FD1793: drive number:", bufferHexdump(this.dsk, 36,1));

	var rootDirSectors = Math.ceil(rootEntCnt * 32 / sectorSize);

	var dataSec = totSec - (rsvdSecCnt + (numFat * fatSize) + rootDirSectors);

	var countOfClusters = Math.floor(dataSec / sectorsPerCluster);

	//console.log("FD1793: count of clusters:",countOfClusters);


	//console.log("FD1793: disk dump finished");

	this.sectorSize = sectorSize;
	this.sectorsPerTrack = secPerTrk;
	this.totSec = totSec;
	this.numHeads = numHeads;
	this.tracksPerSide = (this.totSec / this.sectorsPerTrack / this.numHeads) | 0;
};

// fdc
var ST_NOTREADY		= 0x80; // sampled before read/write
var ST_READONLY		= 0x40;
var ST_HEADLOADED	= 0x20;
var ST_RECTYPE		= 0x20;
var ST_WRFAULT		= 0x20;
var ST_SEEKERR		= 0x10;
var ST_RECNF			= 0x10;
var ST_CRCERR			= 0x08;
var ST_TRACK0			= 0x04;
var ST_LOSTDATA		= 0x04;
var ST_INDEX			= 0x02;
var ST_DRQ				= 0x02;
var ST_BUSY				= 0x01;

var PRT_INTRQ			= 0x01;
var PRT_DRQ				= 0x80;

var CMD_READSEC				= 1;
var CMD_READADDR			= 2;


// Delays, not yet implemented:
//   A command and between the next status: mfm 14us, fm 28us
// Reset
//	- registers cleared
//	- restore (03) command
//	- steps until !TRO0 goes low (track 0)
//
function FD1793() {
	this._log = false;
	this._disks = [new FDisk(),new FDisk(),new FDisk(),new FDisk()];
	// port 4, parameter register
	// SS,MON,DDEN,HLD,DS3,DS2,DS1,DS0
	// side select: 0: side 0, 1: side 1
	// motor on: 1: motor on
	// double density: 1: on
	// hold: 1: head on disk (it is or-ed with motor on)
	// drive select: 1: drive active
	this._pr = 0; 
	this._side = 0;
	this._dsk = this._disks[0];
	this._intrq = 0;
	// Data Request - a byte is transferred
	// Cleared when the _data is read/written
	this._data = 0;
	// current track
	this._track = 0;
	// target sector
	this._sector = 0;
	// Command
	// busy bit is set
	// intrq reset
	this._command = 0;
	this._commandtr = 0;
	// Status
	// intrq reset
	//
	this._status = 0;
	this._address = new Uint8Array(8);
	this._addressidx = 0;
}

FD1793.prototype.loadDsk = function(drive, name, dsk) {
	if (drive < 0 || drive > 3) throw("FD1793: illegal drive:", drive);
	if (this._log) console.log("FD1793: loadDsk: " + name);
	this._disks[drive].loadDsk(name, dsk);
};

FD1793.prototype.exec = function() {
	var finished;
	if (this._commandtr == CMD_READSEC || this._commandtr == CMD_READADDR) {
		if (this._status & ST_DRQ) throw("invalid read");
		finished = this._dsk.read();
		if (finished) {
			this._status &= ~ST_BUSY;
			this._intrq = PRT_INTRQ;
		}
		else {
			this._status |= ST_DRQ;
			this._data = this._dsk.data;
		}
		if (this._log)
			console.log("FD1793: exec - read done, finished:",finished,"data:",Utils.toHex8(this._data),"status:",Utils.toHex8(this._status));
	}
};

FD1793.prototype.read = function(addr) {
	var result = 0;
	if (this._dsk.isReady()) this._status &= ~ST_NOTREADY;
	else this._status |= ST_NOTREADY;
	var returnStatus;
	switch(addr) {
		case 0: // status
			returnStatus = this._status;
			this._status &= (ST_BUSY|ST_NOTREADY);
			this._intrq = 0;
			result = returnStatus;
			break;

		case 1: // track
			result = this._track;
			break;

		case 2: // sector
			result = this._sector;
			break;

		case 3: // data
			if (!(this._status & ST_DRQ)) throw("invalid read");
			result = this._data;
			this._status &= ~ST_DRQ;
			//console.log("FD1793: read data:",Utils.toHex8(result));
			break;

		case 4:
			if (this._status & ST_BUSY) {
				this.exec();
			}
			// DRQ,0,0,0,0,0,0,INTRQ
			// faster to use than FDC
			result = this._intrq | ((this._status & ST_DRQ)?PRT_DRQ:0);
			break;

		default:
			console.warn("FD1793: invalid port read");
			debugger;

	}
	if (this._log)
		console.log("FD1793: read port:",addr,"result:",Utils.toHex8(result),"status:",Utils.toHex8(this._status));
	return result;
};

FD1793.prototype.command = function(val) {
	var cmd = val >>> 4;
	var param = val & 0x0f;
	var update,multiple;
	update = multiple = (param & 1);
	this._intrq = 0;
	this._command = val;
	this._commandtr = 0;
	switch(cmd) {
		case 0x00: // restor, type 1
			if (this._log)
				console.log("FD1793: CMD restore");
			this._intrq = PRT_INTRQ;
			if (this._dsk.isReady()) {
				this._track = 0;
				this._dsk.seek(this._track, 1, this._side);
			}
			else {
				this._status |= ST_SEEKERR;
			}
			break;
		case 0x01: // seek
			if (this._log)
				console.log("FD1793: CMD seek",Utils.toHex8(param));
			this._dsk.seek(this._data, this._sector, this._side);
			this._track = this._data;
			this._intrq = PRT_INTRQ;
			break;
		case 0x02: // step, u = 0
		case 0x03: // step, u = 1
			if (this._log)
				console.log("FD1793: CMD step",update);
			break;
		case 0x04: // step in, u = 0
		case 0x05: // step in, u = 1
			if (this._log)
				console.log("FD1793: CMD step in",update);
			break;
		case 0x06: // step out, u = 0
		case 0x07: // step out, u = 1
			if (this._log)
				console.log("FD1793: CMD step out",update);
			break;
		case 0x08: // read sector, m = 0
		case 0x09: // read sector, m = 1
			var rsSideCompareFlag = (param & 2) >> 1;
			var rsDelay = (param & 4) >> 2;
			var rsSideSelect = (param & 8) >> 3;
			this._commandtr = CMD_READSEC;
			this._status |= ST_BUSY;
			this._dsk.readSector(this._sector);
			if (this._log)
				console.log("FD1793: CMD read sector m:",multiple,"p:",Utils.toHex8(param),"sector:",this._sector,"status:",Utils.toHex8(this._status));
			break;
		case 0x0A: // write sector, m = 0
		case 0x0B: // write sector, m = 1
			if (this._log)
				console.log("FD1793: CMD write sector",multiple);
			break;
		case 0x0C: // read address
			this._commandtr = CMD_READADDR;
			this._status |= ST_BUSY;
			this._dsk.readAddress();
			if (this._log)
				console.log("FD1793: CMD read address m:",multiple,"p:",Utils.toHex8(param),"sector:",Utils.toHex8(this._status));
			break;
		case 0x0D: // force interrupt
			if (this._log)
				console.log("FD1793: CMD force interrupt");
			break;
		case 0x0E: // read track
			if (this._log)
				console.log("FD1793: CMD read track");
			break;
		case 0x0F: // write track
			if (this._log)
				console.log("FD1793: CMD write track");
			break;
	}
};

FD1793.prototype.write = function(addr, val) {
	switch(addr) {
		case 0: // command
			this.command(val);
			break;

		case 1: // track (currect track)
			if (this._log)
				console.log("FD1793: set track:",val);
			this._track = val;
			this._status &= ~ST_DRQ;
			break;

		case 2: // sector (desired sector)
			if (this._log)
				console.log("FD1793: set sector:",val);
			this._sector = val;
			this._status &= ~ST_DRQ;
			break;

		case 3: // data
			if (this._log)
				console.log("FD1793: set data:",Utils.toHex8(val));
			this._data = val;
			this._status &= ~ST_DRQ;
			break;

		case 4: // param reg
			if (this._log)
				console.log("FD1793: set pr:",Utils.toHex8(val));
			this._pr = val;
			// SS,MON,DDEN,HLD,DS3,DS2,DS1,DS0
			if (val & 1) this._dsk = this._disks[0];
			else if (val & 2) this._dsk = this._disks[1];
			else if (val & 4) this._dsk = this._disks[2];
			else if (val & 8) this._dsk = this._disks[3];
			else this._dsk = this._disks[0];
			this._side = (this._pr & 0x80) >>> 7;
			break;
		default:
			console.warn("FD1793: invalid port write");
			debugger;
	}
};

module.exports = FD1793;

},{"./utils.js":9}],5:[function(require,module,exports){
var Utils = require("./utils.js");
var FD1793 = require("./fd1793.js");

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

	this._fdc = new FD1793();
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
	if (addr >= 0 && addr <= 4) {
		this._fdc.write(addr, val); 
	}
	else if (addr == 8) {
		switch(val & 0x30) {
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

HBF.prototype.readPort = function(addr) {
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
	this._fdc.loadDsk(0, name, data);
};

module.exports = HBF;

},{"./fd1793.js":4,"./utils.js":9}],6:[function(require,module,exports){
var Utils = require("./utils.js");

var KSADD = 1 << 0;
var KSDEL = 1 << 1;

var SHIFT_ON = 1 << 0;
var ALT_ON = 1 << 1;
var ALTGR_ON = 1 << 2;
var SHIFT_ALTGR_ON = SHIFT_ON|ALTGR_ON;

var KC_SHIFT = 16;
var KC_ALT = 18;
var KC_ALTGR = 225;

function KEY() {
	// state
	this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
	// row selector for read
	this._row = 0;
	// mappings, per modifier combination
	this._keymap = new Map([
		[0, new Map()],
		[1, new Map()],
		[4, new Map()],
		[5, new Map()]
	]);
	// which keys are already mapped
	this._isMapped = {};
	// active modifier
	this._mod = 0;
	// store last key press for new mappings
	this._lastPress = -1;
	// normal keyboard table
	this._ntable = 
		"53206í14" +
		"^89ü*óö7" +
		"tew;z@qr" +
		"]ioő[úpu" +
		"gds\\h<af" +
		" klá űéj" +
		"bcx n yv" +
		" ,.   -m";
	// shift keyboard table
	this._stable =
		"%+\"&/Í'!" +
		"~()Ü#ÓÖ=" +
		"TEW$Z`QR" +
		"}IOŐ{ÚPU" +
		"GDS|H>AF" +
		" KLÁ ŰÉJ" +
		"BCX N YV" +
		" ?:   _M";

	// keys which are not in the table
	this._keymap.get(0).set(46, [5,0,0]); // del
	this._keymap.get(0).set( 8, [5,0,0]); // backspace
	this._keymap.get(0).set(13, [5,4,0]); // return
	this._keymap.get(0).set(16, [6,3,0]); // shift
	this._keymap.get(0).set(20, [6,5,0]); // lock
	this._keymap.get(0).set(18, [7,0,0]); // alt
	this._keymap.get(0).set(27, [7,3,0]); // esc
	this._keymap.get(0).set(17, [7,4,0]); // ctrl
	this._keymap.get(0).set(32, [7,5,0]); // space
	this._keymap.get(0).set(38, [8,1,0]); // up
	this._keymap.get(0).set(40, [8,2,0]); // down
	this._keymap.get(0).set( 9, [8,3,0]); // tab -> fire
	this._keymap.get(0).set(39, [8,5,0]); // right
	this._keymap.get(0).set(37, [8,6,0]); // left

	// copy mappings
	for (var [key, m] of this._keymap.get(0)) {
		this._keymap.get(SHIFT_ON).set(key, m);
		this._keymap.get(ALTGR_ON).set(key, m);
		this._keymap.get(SHIFT_ALTGR_ON).set(key, m);
	}
	// pre map special keys
	this._isMapped[8] = 1;
	this._isMapped[9] = 1;
	this._isMapped[13] = 1;
	this._isMapped[32] = 1;
}

KEY.prototype.addMapping = function(keyCode) {
	var res;
	var idx;
	var flags;
	var mapping;
	var key;
	key = String.fromCharCode(keyCode);
	flags = 0;
	// search no mod table
	idx = this._ntable.indexOf(key);
	//console.log("addMapping: " + key + " norm idx: " + idx);
	if (idx != -1) {
		if (this._mod & SHIFT_ON)
			flags |= KSDEL;
		mapping = [idx >> 3, idx & 7, flags];
		this._keymap.get(this._mod).set(this._lastPress, mapping);
		//console.log("addMapping: " + this._lastPress + " => " + mapping);
		return mapping;
	}
	idx = this._stable.indexOf(key);
	//console.log("addMapping: " + key + " shift idx: " + idx);
	if (idx != -1) {
		if (!(this._mod & SHIFT_ON))
			flags |= KSADD;
		mapping = [idx >> 3, idx & 7, flags];
		this._keymap.get(this._mod).set(this._lastPress, mapping);
		//console.log("addMapping: " + this._lastPress + " => " + mapping);
		return mapping;
	}
	return null;
};

KEY.prototype.fixState = function(val,down) {
	if (val & KSADD)
		// add shift on down and remove on up if needed
		this.keySet(6,3,down || (this._mod & SHIFT_ON));
	if (val & KSDEL)
		// remove shift on down and add back on up if needed
		this.keySet(6,3,!down && (this._mod & SHIFT_ON));
};

KEY.prototype.keyUpdate = function(code, down) {
	if (code == KC_SHIFT)
		this._mod = (this._mod & ~SHIFT_ON) | (down ? SHIFT_ON : 0);
	if (code == KC_ALTGR)
		this._mod = (this._mod & ~ALTGR_ON) | (down ? ALTGR_ON : 0);
	var m;
	var found;
	m = undefined;
	found = false;
	m = this._keymap.get(this._mod).get(code);
	//console.log("keyUpdate down:" + down + " (mod:" + this._mod + ") " + code + " => " + m);
	if (m) {
		this.applyMapping(m, down);
		found = true;
	}
	// on up release keys from the other tables too
	// to avoid key stuck from early shift release
	if (!down) {
		for (var k of this._keymap) {
			m = this._keymap.get(k).get(code);
			if (m) {
				this.keySet(m[0], m[1], down);
			}
		}
	}
	return found;
};

KEY.prototype.applyMapping = function(m, down) {
	//console.log("applyMapping: " + m + " down:" + down);
	this.keySet(m[0], m[1], down);
	this.fixState(m[2], down);
};

KEY.prototype.keyDown = function(code) {
	//console.log("kd: " + code + " shift: " + this._mod);
	this._lastPress = code;
	var res;
	if (code) {
		res = this.keyUpdate(code, true);
	}
	else {
		// ignore 0 keycodes
		// Firefox likes to send them.
		res = true;
	}
	return res;
};
KEY.prototype.keyUp = function(code) {
	//console.log("ku: " + code + " shift: " + this._mod);
	if (code) {
		this.keyUpdate(code, false);
	}
};
KEY.prototype.keyPress = function(code) {
	//console.log("kp: " + code + " " + String.fromCharCode(code) + " shift:" + this._mod);
	if (code && !this._isMapped[code]) {
		//console.log("not mapped: " + code);
		m = this.addMapping(code);
		if (m) {
			this._isMapped[code] = 1;
			this.applyMapping(m, true);
		}
	}
};

KEY.prototype.selectRow = function(val) {
	this._row = val;
};

KEY.prototype.readRow = function() {
	var res = this._state[this._row];
	if (!res) return 0xFF;
	return res;
};

KEY.prototype.keySet = function(row, column, down) {
	if (down)
		this._state[row] &= ~(1 << column);
	else
		this._state[row] |= (1 << column);
};

KEY.prototype.reset = function() {
	this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
};

module.exports = KEY;

},{"./utils.js":9}],7:[function(require,module,exports){
var Utils = require("./utils.js");

function MemBlock(name, isRam, size) {
	this.name = name;
	this.isRam = isRam;
	this.m = new Uint8Array(size);
}
function MMU(type) {
	this._isPlus = /\+/.test(type);
	this._u0 = new MemBlock("U0", true, 16384);
	this._u1 = new MemBlock("U1", true, 16384);
	this._u2 = new MemBlock("U2", true, 16384);
	this._u3 = new MemBlock("U3", true, 16384);
	this._vid0 = new MemBlock("VID0", true, 16384);
	if (this._isPlus) {
		this._vid1 = new MemBlock("VID1", true, 16384);
		this._vid2 = new MemBlock("VID2", true, 16384);
		this._vid3 = new MemBlock("VID3", true, 16384);
	}
	this._sys = new MemBlock("SYS", false, 16384);
	this._cart = new MemBlock("CART", false, 16384);
	this._exth = new MemBlock("EXT", false, 8192);
	this._map = [undefined, undefined, undefined, undefined];
	this._mapVal = -1;
	this._mapValVid = -1;
	this._log = false;
	this.breakAddr = null;
	this.crtmem = this._vid0.m;
	this.extmmu = null;

	this.init();
}

MMU.prototype.init = function() {
	var i;
	for (i = 0; i < this._u0.m.length; i++) this._u0.m[i] = 0;
	for (i = 0; i < this._u1.m.length; i++) this._u1.m[i] = 0;
	for (i = 0; i < this._u2.m.length; i++) this._u2.m[i] = 0;
	for (i = 0; i < this._u3.m.length; i++) this._u3.m[i] = 0;
	// for(i=0; i<this._cart.m.length; i++) this._cart.m[i] = 0;
	for (i = 0; i < this._exth.m.length; i++) this._exth.m[i] = 0;
	for (i = 0; i < this._vid0.m.length; i++) this._vid0.m[i] = 0;
	if (this._isPlus) {
		for (i = 0; i < this._vid1.m.length; i++) this._vid1.m[i] = 0;
		for (i = 0; i < this._vid2.m.length; i++) this._vid2.m[i] = 0;
		for (i = 0; i < this._vid3.m.length; i++) this._vid3.m[i] = 0;
	}

	this.setVidMap(0);
	this.setMap(0);
};

MMU.prototype.addRom = function(name, data) {
	var i;
	var dataCrc = Utils.crc32(data);
	switch(name) {
		case "TVC12_D7.64K":
			if (dataCrc != 0x1cbbeac6) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._exth.m[i] = data[i];
			break;

		case "TVC12_D4.64K":
			if (dataCrc != 0x834ca9be) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._sys.m[i] = data[i];
			break;

		case "TVC12_D3.64K":
			if (dataCrc != 0x71753d02) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._sys.m[0x2000+i] = data[i];
			break;

		case "TVC22_D7.64K":
			if (dataCrc != 0x05e1c3a8) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._exth.m[i] = data[i];
			break;

		case "TVC22_D6.64K":
			if (dataCrc != 0x05ac3a34) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._sys.m[i] = data[i];
			break;

		case "TVC22_D4.64K":
			if (dataCrc != 0xba6ad589) throw ("invalid rom ("+name+")!");
			for (i = 0; i < data.length; i++) this._sys.m[0x2000+i] = data[i];
			break;
	}
};

MMU.prototype.reset = function() {
	this.setVidMap(0);
	this.setMap(0);
};

MMU.prototype.setMap = function(newMap) {
	if (newMap == this._mapVal) return;
	this._mapVal = newMap;

	// page 0
	switch (newMap & 0x18) {
	case 0x00: this._map[0] = this._sys; break;
	case 0x08: this._map[0] = this._cart; break;
	case 0x10: this._map[0] = this._u0; break;
	case 0x18: this._map[0] = this._isPlus ? this._u3 : this._u0; break; // tvc32 & 64k+
	}

	// page 1
	if (this._isPlus && (newMap & 0x04)) {
		// 64k+
		switch(this._mapValVid & 3) {
		case 0: this._map[1] = this._vid0; break;
		case 1: this._map[1] = this._vid1; break;
		case 2: this._map[1] = this._vid2; break;
		case 3: this._map[1] = this._vid3; break;
		}
	}
	else {
		this._map[1] = this._u1;
	}

	// page 2
	if (newMap & 0x20) {
		this._map[2] = this._u2;
	}
	else if (this._isPlus) {
		switch(this._mapValVid & 0x0C) {
		case 0x00: this._map[2] = this._vid0; break;
		case 0x04: this._map[2] = this._vid1; break;
		case 0x08: this._map[2] = this._vid2; break;
		case 0x0C: this._map[2] = this._vid3; break;
		}
	}
	else {
		this._map[2] = this._vid0;
	}

	// page 3
	switch (newMap & 0xc0) {
	case 0x00: this._map[3] = this._cart; break;
	case 0x40: this._map[3] = this._sys; break;
	case 0x80: this._map[3] = this._u3; break;
	case 0xC0: this._map[3] = null; break;
	}

};

MMU.prototype.setVidMap = function(newVidMap) {
	if (!this._isPlus) return;
	if (newVidMap == this._mapValVid) return;
	this._mapValVid = newVidMap;

	if (this._mapVal & 0x04) {
		switch(newVidMap & 3) {
		case 0: this._map[1] = this._vid0; break;
		case 1: this._map[1] = this._vid1; break;
		case 2: this._map[1] = this._vid2; break;
		case 3: this._map[1] = this._vid3; break;
		}
	}

	if (!(this._mapVal & 0x20)) {
		switch(newVidMap & 0x0C) {
		case 0x00: this._map[2] = this._vid0; break;
		case 0x04: this._map[2] = this._vid1; break;
		case 0x08: this._map[2] = this._vid2; break;
		case 0x0C: this._map[2] = this._vid3; break;
		}
	}

	switch(newVidMap & 0x30) {
		case 0x00: this.crtmem = this._vid0.m; break;
		case 0x10: this.crtmem = this._vid1.m; break;
		case 0x20: this.crtmem = this._vid2.m; break;
		case 0x30: this.crtmem = this._vid3.m; break;
	}
};

MMU.prototype.getMap = function() {
	return this._mapVal;
};

MMU.prototype.toString = function() {
	var result = "";
	result += this._map[0].name;
	result += "," + this._map[1].name;
	result += "," + this._map[2].name;
	if (this._map[3]) result += "," + this._map[3].name;
	else if (this.extmmu) result += ",EXT+" + this.extmmu.name + "(" + this.extmmu.toString(true) + ")";
	else result += ",EXT";
	return result;
};

MMU.prototype.w8 = function(addrP, val) {
	var mapIdx = (addrP & 0xC000) >>> 14;
	var addr = addrP & 0x3FFF;
	var block = this._map[mapIdx];
	if (this.breakAddr && this.breakAddr[addrP]) {
		console.warn("MEM WRITE:", Utils.toHex16(addrP),"<=",Utils.toHex8(val), "(",Utils.toHex16(g.tvc._z80._s.PC),")");
		//debugger;
	}
	if ((mapIdx == 3) && !block) { // ext
		if ((addr < 0x2000) && this.extmmu) {
			this.extmmu.w8(addr, val);
		}
	}
	else if (block.isRam) {
		block.m[addr] = val & 0xFF;
	}
};
MMU.prototype.w16 = function(addr, val) {
	this.w8(addr, val);
	this.w8(addr + 1, val >>> 8);
};
MMU.prototype.w16reverse = function(addr, val) {
	this.w8(addr + 1, val >>> 8);
	this.w8(addr, val);
};
MMU.prototype.r8 = function(addrP) {
	var mapIdx = (addrP & 0xC000) >>> 14;
	var block = this._map[mapIdx];
	var result = 0;
	var addr = addrP & 0x3FFF;
	if (block) {
		result = block.m[addr];
	}
	else {
		// it should be ext
		if (mapIdx != 3) throw("Invalid memory mapping!");
		if (addr < 0x2000) {
			if (this.extmmu) {
				result = this.extmmu.r8(addr);
			}
		}
		else {
			result = this._exth.m[addr - 0x2000];
		}
	}
	return result;
};
MMU.prototype.r8s = function(addr) {
	var val = this.r8(addr);
	if (val & 0x80) val = -((~val + 1) & 0xFF);
	return val;
};
MMU.prototype.r16 = function(addr) {
	return this.r8(addr) | (this.r8(addr + 1) << 8);
};
MMU.prototype.r16nolog = MMU.prototype.r16;

module.exports = MMU;

},{"./utils.js":9}],8:[function(require,module,exports){
var Utils = require("./utils.js");
var Z80 = require("./z80.js");
var KEY = require("./key.js");
var AUD = require("./aud.js");
var VID = require("./vid.js");
var HBF = require("./hbf.js");
var MMU = require("./mmu.js");
//var AdmZip = require('adm-zip');

////////////////////////////////////////////
// TVC
////////////////////////////////////////////
function TVC(type,callback) {
	var TVCthis = this;
	this._callback = callback;
	this._clock = 0;
	this._clockdiff = 0; // how much the cpu is ahead
	this._clockfreq = 3125000;
	this._clockperline = this._clockfreq * 0.000064;// 64us = 200
	this._clockperframe = this._clockfreq / 50; // 62500, for interrupt
	this._breakpoints = Utils.loadLocal("tvc~breakpoints", null);
	this._pendIt = 0x1F;	// b4: curs/aud, b3-0 cards , 0 active
	this._ext0 = null;
	this._ext0ite = 0; // disabled
	this._ext1 = null;
	this._ext1ite = 0; // disabled
	this._ext2ite = 0; // disabled
	this._ext3ite = 0; // disabled
	this._extTypes = 0xFF;
	this._extCartMapping = 0;
	this._mmu = new MMU(type);
	this._fb = callback({id:"fb"});
	this._vid = new VID(this._mmu, this._fb);
	this._aud = new AUD(callback({id:"aud"}));
	this._aud_it = false;
	this._key = new KEY();
	this._z80 = new Z80(this._mmu, function(addr, val) {
		TVCthis.writePort(addr, val);
	}, function(addr) {
		return TVCthis.readPort(addr);
	});

	this._mmu.breakAddr = Utils.loadLocal("tvc~memory-breakpoints", null);
}

TVC.prototype.reset = function() {
	this._z80.reset();
	this._mmu.reset();
};

TVC.prototype.addRom = function(name, data) {
	console.log("ADD ROM: ", name);
	if (/DOS/.test(name)) {
		this.extensionAttach(0, new HBF(data));
	}
	else {
		this._mmu.addRom(name, data);
	}
};

// /////////////////////////////
// UI
// /////////////////////////////
TVC.prototype.keyUp = function(code) {
	this._key.keyUp(code);
};

TVC.prototype.keyDown = function(code) {
	return this._key.keyDown(code);
};

TVC.prototype.keyPress = function(code) {
	this._key.keyPress(code);
};

TVC.prototype.focusChange = function(hasFocus) {
	if (!hasFocus) {
		this._key.reset();
	}
};

// /////////////////////////////
// load cas/dsk
// /////////////////////////////
TVC.prototype.loadImg = function(name,data) {
	var extension = name.slice(-4).toLowerCase();
	if (extension == ".cas") {
		console.log("loaded:",name);
		var savemap = this._mmu.getMap();
		this._mmu.setMap(0xb0);
		for (var i = 144; i < data.length; i++) {
			this._mmu.w8(6639 + i - 144, data[i]);
		}
		this._mmu.setMap(savemap);
	}
	else if (extension == ".dsk") {
		if (this._ext0) {
			this._ext0.loadDisk(name, data);
		}
	}
/*	else if (extension == ".zip") {
		var z = new AdmZip(Buffer.from(data));
		var e = z.getEntries();
		this.loadImg(e[0].entryName, e[0].getData());
	}
	*/
};

// /////////////////////////////
// the show must go on!
// /////////////////////////////
TVC.prototype.runForAFrame = function() {
	var doBreak = false;
	var maxTime = 2 * this._clockperframe;
	var cpuTime = 0;
	var drawInfo = [false,false];
	var clocksave = this._clock;
	while (!doBreak && maxTime > 0) {
		cpuTime = this._z80.step(0);
		if (this._breakpoints) {
			doBreak = (this._breakpoints[this._z80.getRegVal("PC")] !== undefined);
		}
		this._clock += cpuTime;
		maxTime -= cpuTime;

		drawInfo = this._vid.streamSome(cpuTime);
		if (drawInfo[0]) { // crtc is initialized
			if (drawInfo[1] && this._z80.irqEnabled()) { // it
				var irqDuration = this._z80.irq();
				this._pendIt &= ~(0x10); // cursor IT
				this._vid.streamSome(irqDuration);
			}
			if (this._vid.renderStream()) {
				this._fb.refresh();
				break;
			}
		}
	}

	if (doBreak) {
		this._callback({id: "notify", str: "breakpoint: " + Utils.toHex16(this._z80.getRegVal("PC"))});
		console.warn("BREAK");
		this.dreg();
	}
	//console.log("FRAMET: " + (performance.now() - timestart));

	return doBreak;
};

// /////////////////////////////
// IO
// /////////////////////////////
TVC.prototype.writePort = function (addr, val) {
	var val1, val2, val3;
	switch(addr) {
	case 0x00:
		this._vid.setBorder(val);
		break;

	case 0x02:
		this._mmu.setMap(val);
		break;

	case 0x03:
		this._key.selectRow(val & 0xF);
		this._extCartMapping = val >>> 6;
		this._mmu.extmmu = null;
		switch(this._extCartMapping) {
			case 0:
				if (this._ext0) this._mmu.extmmu = this._ext0.mmu;
				break;
			case 1:
				if (this._ext1) this._mmu.extmmu = this._ext1.mmu;
				break;
			default:
				this._mmu.extmmu = null;
		}
		break;

	case 0x04:
		this._aud.setFreqL(val & 0xFF);
		break;

	case 0x05:
		this._aud_it = (val & 0x20) !== 0;
		this._aud.setFreqH(val & 0x0F);
		this._aud.setOn((val & 0x10) !== 0);
		//console.log("AUD: it: " + this._aud_it);
		break;

	case 0x06:
		val1 = val & 0x80; // Printer ack
		val2 = (val >> 2) & 0x0F; // Sound amp
		val3 = val & 0x03; // video mode
		this._vid.setMode(val3);
		this._aud.setAmp(val2);
		break;

	case 0x07:
		// cursor/audio irq ack
		this._pendIt |= 0x10;
		break;

	case 0x0C:
	case 0x0D:
	case 0x0E:
	case 0x0F:
		this._mmu.setVidMap(val);
		break;

	// bit7 : CSTL interrupt enable
	case 0x58:
		this._ext0ite = (val >>> 7) & 1;
		break;
	case 0x59:
		this._ext1ite = (val >>> 7) & 1;
		break;
	case 0x5A:
		this._ext2ite = (val >>> 7) & 1;
		break;
	case 0x5B:
		this._ext3ite = (val >>> 7) & 1;
		break;

	case 0x60:
	case 0x61:
	case 0x62:
	case 0x63:
		this._vid.setPalette(addr - 0x60, val);
		break;

	case 0x70:
		this._vid.setRegIdx(val);
		break;

	case 0x71:
		this._vid.setReg(val);
		break;

	default:
		if (addr >= 0x10 && addr <= 0x1F && this._ext0) {
				this._ext0.writePort(addr & 0x0F, val);
		}
		else if (addr >= 0x20 && addr <= 0x2F && this._ext1) {
				this._ext1.writePort(addr & 0x0F, val);
		}
		else {
			debugger;
			console.warn("Unhandled port write: " + Utils.toHex8(addr) + " " + Utils.toHex8(val)," (PC:",Utils.toHex16(this._z80.getRegVal("PC")),")");
		}
	}
};

TVC.prototype.readPort = function(addr) {
	var result;
	switch (addr) {
	case 0x58:
		result = this._key.readRow();
		break;

	case 0x59:
		//    59H     +++43210    R       Pending IT requests
		//    59H     765+++++    R       7: printer ack, 6: bw0/color1, 5: tape data in
		result = 0x40 | this._pendIt;
		break;

	case 0x5A:
		result = this._extTypes;
		result = 0xff;
		break;

	default:
		if (addr >= 0x10 && addr <= 0x1F && this._ext0) {
			result = this._ext0.readPort(addr & 0x0F);
		}
		else if (addr >= 0x20 && addr <= 0x2F && tihs._ext1) {
			result = this._ext1.readPort(addr & 0x0F);
		}
		else {
			console.warn("Unhandled port read: ", Utils.toHex8(addr)," (PC:",Utils.toHex16(this._z80.getRegVal("PC")),")");
			result = 0xff;
		}
	}
	return result;
};

// /////////////////////////////
// extensions
// /////////////////////////////
TVC.prototype.extensionAttach = function(port,ext) {
	if (port === 0) {
		this._ext0 = ext;
		this._ext0.mmu.name = "CART0";
		this._mmu.extmmu = this._ext0.mmu;
	}
	else if (port == 1) {
		this._ext1 = ext;
		this._ext1.mmu.name = "CART1";
	}
	else throw("invalid extension port!");
	this._extTypes &= ~(3 << (port * 2));
	this._extTypes |= (ext.getType() << (port * 2));
	console.log("Added extension: ",port," ",ext.type," extTypes:",this._extTypes.toString(2));
};

// /////////////////////////////
// debugging
// /////////////////////////////

var bpMap = {"kbd-int" : 0xd62d };
TVC.prototype.resolveAddr = function(val) {
	var addr = this._z80.getRegVal(val);
	if (isNaN(addr)) addr = parseInt(val, 16);
	if (isNaN(addr)) addr = bpMap[val];
	return addr;
};

TVC.prototype.dmem = function(addrP, lines, bytesPerLine) {
	bytesPerLine = bytesPerLine || 16;
	lines = lines || 1;
	var addr = this.resolveAddr(addrP);
	if (isNaN(addr)) {
		console.log("dumpMem: Invalid address:",addrP);
		return;
	}
	do {
		var lineStr = Utils.toHex16(addr);
		var chars = "";
		for(var i = 0; i < bytesPerLine; i++) {
			var v = this._mmu.r8(addr++);
			lineStr += " " + Utils.toHex8(v);
			if (v < 32 || v > 126) {
				chars += " ";
			}
			else {
				chars += String.fromCharCode(v);
			}
		}
		console.log(lineStr + " |"+chars+"|");
		lines--;
	} while (lines);
};

module.exports = TVC;

},{"./aud.js":2,"./hbf.js":5,"./key.js":6,"./mmu.js":7,"./utils.js":9,"./vid.js":10,"./z80.js":11}],9:[function(require,module,exports){
var Utils = {};
Utils.Path = {};
Utils.Emscripten = {};

Utils.db = null;

Utils.toHex8 = function (x) {
  var s = x.toString(16).toUpperCase();
  return "0".slice(s.length - 1) + s;
};

Utils.toHex16 = function (x) {
  var s = x.toString(16).toUpperCase();
  return "000".slice(s.length - 1) + s;
};

Utils.toHex88 = function (x, y) {
  var s = ((x << 8) | y).toString(16).toUpperCase();
  return "000".slice(s.length - 1) + s;
};

Utils.toBin8 = function (x) {
  var arr = [];
  var i;
  for (i = 0; i < 8; i++) {
    arr.push((x & 0x80) ? "1" : "0");
    x = (x << 1);
  }
  return arr.join("");
};

Utils.crc32 = function (bytes, crc) {
  var table = [0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
    0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3, 0x0EDB8832,
    0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD,
    0xE7B82D07, 0x90BF1D91, 0x1DB71064, 0x6AB020F2, 0xF3B97148,
    0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
    0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F,
    0x63066CD9, 0xFA0F3D63, 0x8D080DF5, 0x3B6E20C8, 0x4C69105E,
    0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD,
    0xA50AB56B, 0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
    0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59, 0x26D930AC,
    0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423,
    0xCFBA9599, 0xB8BDA50F, 0x2802B89E, 0x5F058808, 0xC60CD9B2,
    0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
    0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589,
    0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433, 0x7807C9A2, 0x0F00F934,
    0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97,
    0xE6635C01, 0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
    0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457, 0x65B0D9C6,
    0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49,
    0x8CD37CF3, 0xFBD44C65, 0x4DB26158, 0x3AB551CE, 0xA3BC0074,
    0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
    0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73,
    0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9, 0x5005713C, 0x270241AA,
    0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409,
    0xCE61E49F, 0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
    0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD, 0xEDB88320,
    0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF,
    0x04DB2615, 0x73DC1683, 0xE3630B12, 0x94643B84, 0x0D6D6A3E,
    0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
    0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D,
    0x806567CB, 0x196C3671, 0x6E6B06E7, 0xFED41B76, 0x89D32BE0,
    0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43,
    0x60B08ED5, 0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
    0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B, 0xD80D2BDA,
    0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55,
    0x316E8EEF, 0x4669BE79, 0xCB61B38C, 0xBC66831A, 0x256FD2A0,
    0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
    0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7,
    0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D, 0x9B64C2B0, 0xEC63F226,
    0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785,
    0x05005713, 0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
    0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21, 0x86D3D2D4,
    0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B,
    0x6FB077E1, 0x18B74777, 0x88085AE6, 0xFF0F6A70, 0x66063BCA,
    0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
    0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661,
    0xD06016F7, 0x4969474D, 0x3E6E77DB, 0xAED16A4A, 0xD9D65ADC,
    0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F,
    0x30B5FFE9, 0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
    0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF, 0xB3667A2E,
    0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1,
    0x5A05DF1B, 0x2D02EF8D];
  var i, iTop;
  crc = crc || 0;
  crc = crc ^ (-1);
  for (i = 0, iTop = bytes.length; i < iTop; i++) {
    crc = ( crc >>> 8 ) ^ table[(crc ^ bytes[i]) & 0xFF];
  }
  crc = crc ^ (-1);
  if (crc < 0) crc += 4294967296;
  return crc;
};

Utils.isBrowser = function () {
  return typeof(window) != "undefined";
};

Utils.removeLocal = function (key) {
  if (this.isBrowser()) {
    window.localStorage.removeItem(key);
  }
};

Utils.saveLocal = function (key, value) {
  if (this.isBrowser()) {
    if (value === null) {
      window.localStorage.removeItem(key);
    }
    else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }
};

Utils.loadLocal = function (key, defaultval) {
  if (this.isBrowser()) {
    var value = window.localStorage.getItem(key);
    if (value) return JSON.parse(value);
    return defaultval;
  }
  return defaultval;
};

Utils.setConfig = function (name, value) {
  var conf = Utils.loadLocal("tvc~config", {});
  conf[name] = value;
  Utils.saveLocal("tvc~config", conf);
};

Utils.getConfig = function (name, defaultval) {
  var conf = Utils.loadLocal("tvc~config", {});
  var value = conf[name];
  return value || defaultval;
};

Utils.dbInit = function (cb) {
  Utils.db = undefined;
  try {
    var request = window.indexedDB.open("tvc-db", 3);
    request.onupgradeneeded = function (event) {
      Utils.db = event.target.result;
      var os = Utils.db.createObjectStore("disks", {keyPath: "name"});
    };
    request.onsuccess = function (event) {
      Utils.db = event.target.result;
      if (cb)
        cb();
    };
  }
  catch (err) {
    console.log("WARNING: no indexedDB :(");

  }
};
Utils.dbLoadDisk = function (name, cb) {
  if (!Utils.db) return;
  Utils.db.transaction(["disks"]).objectStore("disks").get(name).onsuccess = function (event) {
    var disk = event.target.result;
    if (cb)
      cb(disk.name, disk.data);
  };
};
Utils.dbSaveDisk = function (name, data, cb) {
  if (!Utils.db) return;
  Utils.db.transaction(["disks"], "readwrite").objectStore("disks").put({name: name, data: data}).onsuccess = function (event) {
    if (cb)
      cb(name, data);
  };
};
Utils.dbDeleteDisk = function (name, cb) {
  if (!Utils.db) return;
  Utils.db.transaction(["disks"], "readwrite").objectStore("disks").delete(name).onsuccess = function (event) {
    if (cb)
      cb(name, null);
  };
};
Utils.dbListDisks = function (cb) {
  if (!Utils.db) return;
  if (!cb) cb = function (n, d) {
    console.log(n, d);
  };
  Utils.db.transaction(["disks"]).objectStore("disks").openCursor().onsuccess = function (event) {
    var cursor = event.target.result;
    if (cursor) {
      cb(cursor.value.name, cursor.value.data);
      cursor.continue();
    }
    else {
      cb(null, null);
    }
  };
};


Utils.b2s = function (data) {
  var str = "";
  for (var i = 0; i < data.length; i++) {
    str += String.fromCharCode(data[i]);
  }
  return str;
}

Utils.s2b = function (str) {
  var data = new Uint8Array(str.length);
  for (var i = 0; i < str.length; i++) {
    data[i] = str.charCodeAt(i);
  }
  return data;
}

Utils.Path.basename = function (path) {
  return path.slice(path.lastIndexOf("/") + 1);
}

Utils.Path.dirname = function (path) {
  var pathEnd = path.length;
  if (path.slice(-1) == "/")
    pathEnd--;
  var newEnd = path.lastIndexOf("/", pathEnd - 1);
  if (newEnd < 1)
    newEnd = 1;
  return path.slice(0, newEnd);
}

Utils.Path.extension3 = function (path) {
  return Utils.Path.basename(path).replace(/.*\./, "").slice(0, 3);
}

Utils.Path.join = function (p1, p2) {
  var path = _.compact(p1.split("/").concat(p2.split("/")));
  return "/" + path.join("/");
}

Utils.Emscripten.saveFs = function (root) {
  var res = [];
  saveFsImp(root, res);
  return res;
}

function saveFsImp(root, res) {
  _.forOwn(root, function (val, key) {
    if (key.slice(-8) == "TODELETE") {
      // skip
    }
    else if (val.isFolder) {
      res.push({
        name: key,
        isFolder: true,
        data: null
      });
      saveFsImp(val.contents, res);
      res.push({
        name: "..",
        isFolder: true,
        data: null
      });
    }
    else {
      res.push({
        name: key,
        isFolder: false,
        data: new Uint8Array(val.contents)
      });
    }
    return true;
  });
}

Utils.Emscripten.restoreFs = function (FS, fsDump, initPath) {
  var path = initPath || "/";
  for (var i = 0; i < fsDump.length; i++) {
    var curr = fsDump[i];
    if (curr.isFolder) {
      if (curr.name == "..") {
        path = Utils.Path.dirname(path);
      }
      else {
        path = Utils.Path.join(path, curr.name);
        FS.mkdir(path);
      }
    }
    else {
      FS.createDataFile(path, curr.name, curr.data, true, true);
    }
  }
}

Utils.Emscripten.fsGetFromDump = function (reqPath, fsDump, initPath) {
  var path = initPath || "/";
  var fileName;
  for (var i = 0; i < fsDump.length; i++) {
    var curr = fsDump[i];
    if (curr.isFolder) {
      if (curr.name == "..") {
        path = Utils.Path.dirname(path);
      }
      else {
        path = Utils.Path.join(path, curr.name);
      }
    }
    else {
      fileName = Utils.Path.join(path, curr.name);
      if (reqPath == fileName)
        return curr.data;
    }
  }
  return null;
}

Utils.Emscripten.fsGet = function (FS, path) {
  var elements = path.split("/");
  var node = FS.root;
  for (var i = 0; i < elements.length; i++) {
    if (elements[i].length == 0)
      continue;
    var node = node.contents[elements[i]];
    if (!node)
      return node;
  }
  if (node.isFile)
    return new Uint8Array(node.contents);
  return node.contents;
}

module.exports = Utils;

},{}],10:[function(require,module,exports){
var Utils = require("./utils.js");
var MMU = require("./mmu.js");

////////////////////////////////////////////
// VID
////////////////////////////////////////////
// xIxGxRxB
function toRGBA(val) {
  var intens = 0x7F | ((val & 0x40) << 1);
  var g = (0x100 - ((val >> 4) & 1)) & intens;
  var r = (0x100 - ((val >> 2) & 1)) & intens;
  var b = (0x100 - (val & 1)) & intens;
  return 0xFF000000 | (b << 16) | (g << 8) | r;
}

function COLOR() {
  this.color = 0;
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.rgba = 0xFF;
  this.setColor = function(val) {
    this.color = val;
    var intens = 0x7F | ((val & 0x40) << 1);
    this.r = (0x100 - ((val >> 2) & 1)) & intens;
    this.g = (0x100 - ((val >> 4) & 1)) & intens;
    this.b = (0x100 - (val & 1)) & intens;
    this.rgba = toRGBA(val);
  }
}

COLOR.prototype.toString = function() {
  return this.color;
}

function VID(mmu, fb) {
  this._mmu = mmu;
  this._fb = fb;
  this._timer = 0;
  this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
  this._border = 0;
  this._regIdx = 0;

  this._mode = 0; // 00: 2, 01: 4, 1x: 16 color

  this._cpufreq = 3125000;
  this._clockCh = 2; // ticks per character
  this._cclk = this._cpufreq / this._cclt; // character freq

  this._ht = 0; // horizontal total CHAR
  this._hd = 0; // horizontal displayed CHAR
  this._hsp = 0; // horizontal sync position CHAR
  this._hsw = 0; // horizontal sync width
  this._vsw = 0; // vertical sync width
  this._vt = 0; // vertical total CHAR
  this._adj = 0; // scan line adjust SCANLINE
  this._vd = 0; // vertical displayed CHAR ROW
  this._vsp = 0; // vertical sync position CHAR ROW
  this._im = 0; // interlace mode, 0 = progressive
  this._skec = 0; // cursor skew
  //this._skede = 0; // de skew (display enable)
  this._slr = 0; // scan line per character row
  this._curaddr = 0; // cursor address
  this._curmemaddr = 0; // cursor address (translated)
  this._curenabled = 0;
  this._smem = 0; // start address

  // counters
  this._row = 0; // char row

  //this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
  this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];


  this._memStart = 0; // initialized on frame start
  this._mem = 0; // act crtc addr
  this._addr = 0; // act tvc addr /raster counter inserted/
  this._vLines = -1;	// count vsync lines
  this._aLines = 0;	// count adj lines
  this._row = -1; // row
  this._line = 0; // line in a row
  this._char = 0; // char
  this._runFor = 0; // how much time to run for (in cpu clock)

  this._stream = new Int16Array(608*288*2*2); // ring buffer between the 6845 and the renderer
  this._streamh = 0; // head
  this._streamt = 0; // tail

  // renderer
  this._renderPhase = 0;
  this._renderPhaseNext = 0;
  this._renderHCnt = 0;
  this._renderVCnt = 0;
  this._renderY = 0;
  this._renderA = 0;
}

VID.prototype.statusStr = function() {
  var str = "[mode:" + this._mode + "]";
  str += "[v:" + this._char + "/" + this._vd + "/" + this._vt + "*" + this._slr + "]";
  str += "[h:" + this._row + "/" + this._hd + "/" + this._ht + "]";
  str += "[addr:" + this._curaddr + "->" + this._curmemaddr + "]";
  return str;
  /*

  this._ht = 0; // horizontal total CHAR
  this._hd = 0; // horizontal displayed CHAR
  this._hsp = 0; // horizontal sync position CHAR
  this._hsw = 0; // horizontal sync width
  this._vsw = 0; // vertical sync width
  this._vt = 0; // vertical total CHAR
  this._adj = 0; // scan line adjust SCANLINE
  this._vd = 0; // vertical displayed CHAR ROW
  this._vsp = 0; // vertical sync position CHAR ROW
  this._im = 0; // interlace mode, 0 = progressive
  this._skec = 0; // cursor skew
  //this._skede = 0; // de skew (display enable)
  this._slr = 0; // scan line per character row
  this._curaddr = 0; // cursor address
  this._curmemaddr = 0; // cursor address (translated)
  this._curenabled = 0;
  this._smem = 0; // start address

  // counters
  this._row = 0; // char row

  //this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
  this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];


  this._memStart = 0; // initialized on frame start
  this._mem = 0; // act crtc addr
  this._addr = 0; // act tvc addr /raster counter inserted/
  this._vLines = -1;	// count vsync lines
  this._aLines = 0;	// count adj lines
  this._row = -1; // row
  this._line = 0; // line in a row
  this._char = 0; // char
  this._runFor = 0; // how much time to run for (in cpu clock)

  this._stream = new Int16Array(608*288*2*2); // ring buffer between the 6845 and the renderer
  this._streamh = 0; // head
  this._streamt = 0; // tail

  // renderer
  this._renderPhase = 0;
  this._renderPhaseNext = 0;
  this._renderHCnt = 0;
  this._renderVCnt = 0;
  this._renderY = 0;
  this._renderA = 0;
*/
}


// ma: memory address (12 bit is used), rl: raster line
// address: MMMMMMRRMMMMMM
function genAddress(ma, rl) {
  ma = ma & 0xFFF;
  return ((rl & 0x03) << 6)
    | (ma & 0x3F)
    | ((ma & 0x3FC0) << 2);
}

VID.prototype.reconfig = function() {
  this._ht = this._reg[0];
  this._hd = this._reg[1];
  this._hsp = this._reg[2];
  this._hsw = this._reg[3] & 0x0F;
  this._vsw = (this._reg[3] >>> 4) & 0x0F;
  this._vt = (this._reg[4] & 0x7F);
  this._adj = this._reg[5] & 0x1F;
  this._vd = this._reg[6] & 0x7F;
  this._vsp = this._reg[7] & 0x7F;
  this._im = this._reg[8] & 0x03;
  this._skede = (this._reg[8] >> 4) & 0x03;
  this._skec = (this._reg[8] >> 6) & 0x03;
  this._slr = (this._reg[9] & 0x1F);
  this._curenabled = (this._reg[10] & 0x60) != 0x20;
  this._curstart = this._reg[10] & 0x1F;
  this._curend = this._reg[11] & 0x1F;
  this._smem = (this._reg[12] << 8) | this._reg[13];
  this._curaddr = ((this._reg[14] & 0x3F) << 8) | this._reg[15];
  this._curmemaddr = genAddress(this._curaddr, this._curstart);
  //console.log("VID reconf curaddr: m/a " + Utils.toHex16(this._curaddr) + " " + Utils.toHex16(this._curmemaddr),"VID it row: " + (this._curaddr >> 6) + " sl: " + (this._reg[10] & 0x03) + " byte: " + (this._curaddr & 63));
  //console.log("VID saddr: ",Utils.toHex16(this._smem));
  // this._reg[16] LPen (H)
  // this._reg[17] LPen (L)
}

var HSYNC = 0x0400;
var VSYNC = 0x0800;

VID.prototype.streamInitScreen = function() {
  // init screen
  this._memStart = this._smem;
  this._vLines = -1;
  this._aLines = 0;
  // init line
  this._row = 0;
  this._char = 0;
  this._line = 0;
  this._mem = this._memStart + this._row * this._hd;
  this._addr = genAddress(this._mem, this._line);
}

VID.prototype.streamSome = function(runFor) {
  // don't do anything when not yet initialized
  if (this._hd >= this._ht)
    return [false,false];

  var vidmem = this._mmu.crtmem;
  var mode = this._mode << 8;
  var mode16 = 2 << 8;
  var hsync = 0;
  var vsync = 0;
  var endScreen = false;
  var cursorIt = false;

  // finished with the screen on the previous run
  if (this._row == -1) {
    this.streamInitScreen();
  }

  // accomulate run time
  this._runFor += runFor;

  /* run till interrupt or till has time */
  while (!cursorIt && (this._runFor >= this._clockCh)) {
    // active picture
    if (this._row < this._vd) { // vertical
      // paper
      if (this._char < this._hd) { // horizontal
        // interrupt
        if (this._curenabled) {
          cursorIt = (this._mem == this._curaddr) && (this._line == this._curstart);
        }
        this.streamData(mode|vidmem[this._addr]);
        this._char++;
        this._addr++;
        this._mem++;
      }
      // border - side
      else if (this._char <= this._ht) {
        hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
        this.streamData(hsync|mode16|this._border2);
        this._char++;
      }
      else {
        throw("VID: ???");
      }
    }
    // bottom broder / vsync / top border
    else if (this._row <= this._vt) {
      // vsync
      if (this._vLines >= 0) { // active
        if (this._vLines < this._vsw) {
          vsync = VSYNC;
        }
        else {
          vsync = 0; // stop
        }
      }
      else if (this._row > this._vsp) { // start
        vsync = VSYNC;
        this._vLines = 0;
      }
      // draw border
      if (this._char <= this._ht) {
        hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
        this.streamData(vsync|hsync|mode16|this._border2);
        this._char++;
      }
      if (vsync && (this._char > this._ht)) {
        this._vLines++;
      }
    }
    // adj lines
    else if ((this._adj > 0) && (this._aLines < this._adj)) {
      // draw border
      if (this._char <= this._ht) {
        hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
        this.streamData(vsync|hsync|mode16|this._border2);
        this._char++;
      }
      if (this._char > this._ht) {
        this._aLines++;
      }
    }
    // end of screen
    else {
      this._runFor += this._clockCh; // nothing was done, adjust time
      this.streamInitScreen();
    }

    // next line
    if (this._char > this._ht) {
      this._char = 0;
      this._line++;
      if (this._line > this._slr) {
        this._line = 0;
        this._row++;
      }
      this._mem = (this._memStart + this._row * this._hd) & 0x3FFF;
      this._addr = genAddress(this._mem, this._line);
    }

    this._runFor -= this._clockCh;
  }

  return [true,  cursorIt];
}

VID.prototype.streamData = function(data) {
  this._stream[this._streamh] = data;
  this._streamh++;
  if (this._streamh == this._streamt)
    throw("streamData overflow");
  if (this._streamh == this._stream.length)
    this._streamh = 0;
}

VID.prototype.readData = function() {
  var res;
  if (this._streamh == this._streamt) {
    res = -1;
  }
  else {
    res = this._stream[this._streamt];
    this._streamt++;
    if (this._streamt == this._stream.length)
      this._streamt = 0;
  }
  return res;
}

// renders a stream into a video frame
// render starts 26 scanlines after vsync on, lasts for 288 scanlines
// line is rendered 16 chars after hsync and renders 76 chars (or hsync)
VID.prototype.renderStream = function() {
  var haveAFrame = false;
  var fbd = this._fb.buf32;
  var data;
  while (!haveAFrame && ((data = this.readData()) != -1)) {
    switch(this._renderPhase) {
    // tools
      case 100: // wait for end of hsync
        if (data & HSYNC) {
          this._renderHCnt++;
        }
        else {
          this._renderPhase = this._renderPhaseNext;
          //console.log("100 => ",this._renderPhaseNext);
        }
        break;
    // wait for vsync
      case 0:
        if (data & VSYNC) {
          // transition
          this._renderPhase = 1;
          this._renderVCnt = 0;
          //console.log("0 => 1");
        }
        break;
    // skip 26 lines
      case 1: // count lines
        if (data & HSYNC) {
          this._renderVCnt++;
          //console.log("renderVCnt",this._renderVCnt);
          if (this._renderVCnt == 26) {
            // transition
            this._renderPhase = 100;
            this._renderPhaseNext = 2;
            this._renderHCnt = 1; // we have the first one already
            this._renderY = 0;
            this._renderA = 0;
            //console.log("1 => 100");
          }
          else {
            this._renderPhase = 100;
            this._renderPhaseNext = 1;
            //console.log("1 => 100");
          }
        }
        break;

    // draw 288 lines
      case 2: // h skip
        this._renderHCnt++;
        //console.log("renderHCnt",this._renderHCnt);
        if (this._renderHCnt == 16) {
          this._renderPhase = 3;
          this._renderHCnt = 0;
          //console.log("2 => 3");
        }
        break;
      case 3: // draw 76
        this._renderHCnt++;
        //console.log("renderHCnt",this._renderHCnt," wp");
        this.writePixel(fbd, this._renderA, data);
        this._renderA += 8;
        if (this._renderHCnt == 76) {
          this._renderY++;
          //console.log("renderY",this._renderY);
          this._renderA = this._fb.width * this._renderY;
          if (this._renderY == 288) {
            // finished, next frame
            this._renderPhase = 0;
            haveAFrame = true;
            //console.log("3 => 0");
          }
          else {
            this._renderPhase = 4;
          }
        }
        break;
      case 4: // wiat for hsync
        if (data & HSYNC) {
            this._renderPhase = 100;
            this._renderPhaseNext = 2;
            this._renderHCnt = 1; // we have the first one already
            //console.log("4 => 100");
        }
        break;
    }
  }
  return haveAFrame;
}

VID.prototype.writePixel = function(fbd, actPixel, pixelData) {
  var mode = (pixelData >> 8) & 3;
  var pixelData2, d3, d2, d1, d0, p0, p1, p2, p3;
  var rgba;
  pixelData = pixelData & 0xFF;
  switch(mode) {
    case 0:
    {
      p0 = this._palette[(pixelData >> 7) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 6) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 5) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 4) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 3) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 2) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[(pixelData >> 1) & 1];
      fbd[actPixel++] = p0.rgba;
      p0 = this._palette[pixelData & 1];
      fbd[actPixel++] = p0.rgba;
    }
      break;
    case 1:
    {
      pixelData2 = pixelData >>> 4;
      pixelData <<= 1;
      d3 = (pixelData & 2) | (pixelData2 & 1);
      pixelData >>= 1;
      pixelData2 >>= 1;
      d2 = (pixelData & 2) | (pixelData2 & 1);
      pixelData >>= 1;
      pixelData2 >>= 1;
      d1 = (pixelData & 2) | (pixelData2 & 1);
      pixelData >>= 1;
      pixelData2 >>= 1;
      d0 = (pixelData & 2) | (pixelData2 & 1);
      p0 = this._palette[d0];
      fbd[actPixel++] = p0.rgba;
      fbd[actPixel++] = p0.rgba;
      p1 = this._palette[d1];
      fbd[actPixel++] = p1.rgba;
      fbd[actPixel++] = p1.rgba;
      p2 = this._palette[d2];
      fbd[actPixel++] = p2.rgba;
      fbd[actPixel++] = p2.rgba;
      p3 = this._palette[d3];
      fbd[actPixel++] = p3.rgba;
      fbd[actPixel++] = p3.rgba;
    }
      break;
    default:
    {
      rgba = toRGBA(pixelData >> 1);
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
      rgba = toRGBA(pixelData);
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
      fbd[actPixel++] = rgba;
    }
      break;
  }
}



VID.prototype.setPalette = function(idx, color) {
  this._palette[idx].setColor(color);
};

VID.prototype.getPalette = function(idx) {
  return this._palette[idx].color;
};

VID.prototype.setBorder = function(color) {
  this._border = color;
  this._border2 = ((color & 0xAA) >> 1) | (color & 0xAA);
};

VID.prototype.setReg = function(val) {
  if (this._reg[this._regIdx] != val) {
    //console.log("VID setReg: " + this._regIdx + " " + Utils.toHex8(val));
    this._reg[this._regIdx] = val;
    this.reconfig();
  }
};

VID.prototype.getReg = function() {
  return this._reg[this._regIdx];
};

VID.prototype.setRegIdx = function(idx) {
  if (idx < 0 || idx > 17) return;
  this._regIdx = idx;
};

VID.prototype.getRegIdx = function() {
  return this._regIdx;
};

VID.prototype.setMode = function(mode) {
  this._mode = mode;
};

module.exports = VID;

},{"./mmu.js":7,"./utils.js":9}],11:[function(require,module,exports){
var Utils = require("./utils.js");
var Dasm = require("./dasm.js");

var F_S = 0x80; // sign
var F_Z = 0x40; // zero
var F_5 = 0x20; // ???
var F_H = 0x10; // half-carry
var F_3 = 0x08; // ???
var F_PV = 0x04; // parity or overflow
var F_N = 0x02; // add/subtract
var F_C = 0x01; // carry

var R_PC = 0;
var R_SP = 1;
var R_IR = 2;
var R_AF = 3;
var R_BC = 4;
var R_DE = 5;
var R_HL = 6;
var R_IX = 7;
var R_IY = 8;
var R_AFa = 9;
var R_BCa = 10;
var R_DEa = 11;
var R_HLa = 12;

// TODO: endian detection
var R_I = R_IR * 2 + 1;
var R_R = R_IR * 2 + 0;
var R_A = R_AF * 2 + 1;
var R_F = R_AF * 2 + 0;
var R_B = R_BC * 2 + 1;
var R_C = R_BC * 2 + 0;
var R_D = R_DE * 2 + 1;
var R_E = R_DE * 2 + 0;
var R_H = R_HL * 2 + 1;
var R_L = R_HL * 2 + 0;
var R_Xh = R_IX * 2 + 1;
var R_Xl = R_IX * 2 + 0;
var R_Yh = R_IY * 2 + 1;
var R_Yl = R_IY * 2 + 0;
var R_Aa = R_AFa * 2 + 1;
var R_Fa = R_AFa * 2 + 0;
var R_Ba = R_BCa * 2 + 1;
var R_Ca = R_BCa * 2 + 0;
var R_Da = R_DEa * 2 + 1;
var R_Ea = R_DEa * 2 + 0;
var R_Ha = R_HLa * 2 + 1;
var R_La = R_HLa * 2 + 0;

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

	// registers
	this.REGS = new ArrayBuffer(26);
	this.R16 = new Uint16Array(this.REGS);
	this.R8 = new Uint8Array(this.REGS);
	this.R8s = new Uint8Array(this.REGS);

	this.reset();
};

//TODO: remove, safeguard
Z80State.prototype = {
	get PC() { throw("old code!!!"); },
	set PC(val) { throw("old code!!!"); },
	get SP() { throw("old code!!!"); },
	set SP(val)  { throw("old code!!!"); },
	get AF()  { throw("old code!!!"); },
	set AF(val)  { throw("old code!!!"); },
	get BC()  { throw("old code!!!"); },
	set BC(val)  { throw("old code!!!"); },
	get DE()  { throw("old code!!!"); },
	set DE(val)  { throw("old code!!!"); },
	get HL()  { throw("old code!!!"); },
	set HL(val)  { throw("old code!!!"); },
	get IX()  { throw("old code!!!"); },
	set IX(val)  { throw("old code!!!"); },
	get IY()  { throw("old code!!!"); },
	set IY(val)  { throw("old code!!!"); },
	get AFa()  { throw("old code!!!"); },
	set AFa(val)  { throw("old code!!!"); },
	get BCa()  { throw("old code!!!"); },
	set BCa(val)  { throw("old code!!!"); },
	get DEa()  { throw("old code!!!"); },
	set DEa(val)  { throw("old code!!!"); },
	get HLa()  { throw("old code!!!"); },
	set HLa(val)  { throw("old code!!!"); },
};


Z80State.prototype.reset = function () {
	// interrupt
	this.halted = 0;
	this.im = 0;
	this.IFF1 = 0;
	this.IFF2 = 0;

	// registers
	this.R8[R_I] = 0xFF;
	this.R8[R_R] = 0x00;

	this.R16[R_AF] = 0xFFFF;
	this.R16[R_BC] = 0xFFFF;
	this.R16[R_DE] = 0xFFFF;
	this.R16[R_HL] = 0xFFFF;
	this.R16[R_IX] = 0xFFFF;
	this.R16[R_IY] = 0xFFFF;

	this.R16[R_SP] = 0xFFFF;
	this.R16[R_PC] = 0x0000;


	this.R16[R_AFa] = 0xFFFF;
	this.R16[R_BCa] = 0xFFFF;
	this.R16[R_DEa] = 0xFFFF;
	this.R16[R_HLa] = 0xFFFF;
};

Z80State.prototype.toString = function() {
	var arr = [];
	arr.push("PC:");arr.push(Utils.toHex16(this.R16[R_PC]));
	arr.push(" SP:");arr.push(Utils.toHex16(this.R16[R_SP]));
	arr.push(" AF:");arr.push(Utils.toHex88(this.R8[R_A], this.R8[R_F]));
	arr.push(" SZ5H3PNC:");arr.push(Utils.toBin8(this.R8[R_F]));
	arr.push("\n");
	arr.push("BC:");arr.push(Utils.toHex88(this.R8[R_B], this.R8[R_C]));
	arr.push(" DE:");arr.push(Utils.toHex88(this.R8[R_D],this.R8[R_E]));
	arr.push(" HL:");arr.push(Utils.toHex88(this.R8[R_H],this.R8[R_L]));
	arr.push(" IX:");arr.push(Utils.toHex88(this.R8[R_Xh],this.R8[R_Xl]));
	arr.push(" IY:");arr.push(Utils.toHex88(this.R8[R_Yh],this.R8[R_Yl]));
	arr.push(" AFa:");arr.push(Utils.toHex88(this.R8[R_Aa], this.R8[R_Fa]));
	arr.push(" BCa:");arr.push(Utils.toHex88(this.R8[R_Ba], this.R8[R_Ca]));
	arr.push(" DEa:");arr.push(Utils.toHex88(this.R8[R_Da],this.R8[R_Ea]));
	arr.push(" HLa:");arr.push(Utils.toHex88(this.R8[R_Ha],this.R8[R_La]));

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
	this._btmaxlen = Utils.getConfig("btmaxlen", 10);
	this._logdasm = false;
	this._dasmtxt = "";
	this.bt = [];
}
Z80.prototype.toString = function() {
	return this._s.toString();
}

Z80.prototype.push16 = function (val) {
	var sp = (this._s.R16[R_SP] - 1) & 0xFFFF;
	this._mmu.w8(sp, (val >> 8) & 0xFF);
	sp--;
	this._mmu.w8(sp, val & 0xFF);
	this._s.R16[R_SP] = sp;
};

Z80.prototype.pop16 = function () {
	var SP = this._s.R16[R_SP];
	var val = this._mmu.r8(SP);
	SP++;
	val |= (this._mmu.r8(SP) << 8);
	this._s.R16[R_SP] = (SP + 1) & 0xFFFF;
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
		shr8(this._s.R8[reg], 0, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function sra_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shr8(this._s.R8[reg], this._s.R8[reg] & 0x80, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function rr_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shr8(this._s.R8[reg], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function rrc_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shr8(this._s.R8[reg], this._s.R8[reg] & 0x01, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function sll_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shl8(this._s.R8[reg], 1, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function sla_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shl8(this._s.R8[reg], 0, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function rl_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shl8(this._s.R8[reg], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function rlc_r(reg) {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		shl8(this._s.R8[reg], this._s.R8[reg] & 0x80, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function bit_n_ixyd(n,reg) {
	var mask = 1 << n;
	return function() {
		this._op_t = 20;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var srcval = this._mmu.r8(addr);
		var val = srcval & mask;
		this._s.R8[R_F] =
			(val & F_S) |
			((val) ? (0) : (F_Z|F_PV)) |
			((addr >>> 8) & (F_3|F_5)) |
			F_H |
			(this._s.R8[R_F] & F_C);
	}
}

function bit_n_ihl(n) {
	var mask = 1 << n;
	return function() {
		this._op_t = 12;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		var srcval = this._mmu.r8(addr);
		var val = srcval & mask;
		this._s.R8[R_F] =
			(val & F_S) |
			((val) ? (0) : (F_Z|F_PV)) |
			((addr >>> 8) & (F_3|F_5)) |
// for fuse				(srcval & (F_3|F_5)) |
			F_H |
			(this._s.R8[R_F] & F_C);
	}
}

function bit_n_r(n, reg) {
	var mask = 1 << n;
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		var srcval = this._s.R8[reg];
		var val = srcval & mask;
		this._s.R8[R_F] =
			(val & F_S) |
			((val) ? (0) : (F_Z|F_PV)) |
			(srcval & (F_3|F_5)) |
			F_H |
			(this._s.R8[R_F] & F_C);
	}
}

function or_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._s.R8[R_A] |= this._s.R8[reg];
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	}
}

function xor_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._s.R8[R_A] ^= this._s.R8[reg];
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	}
}

function and_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._s.R8[R_A] &= this._s.R8[reg];
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]] | F_H;
	}
}

function neg_a() {
	return function() {
		this._op_t = 8;
		this._op_m = 2;
		sub8(0, this._s.R8[R_A], 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function retn() {
	return function() {
		this._op_t = 14;
		this._op_m = 0;
		this._s.IFF1 = this._s.IFF2;
		this._s.R16[R_PC] = this.pop16();
	}
}

function cp_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		sub8(this._s.R8[R_A], this._s.R8[reg],0, this._op_alures);
		this._s.R8[R_F] = (this._op_alures[1] & ~(F_5|F_3)) | (this._s.R8[reg] & (F_5|F_3));
	}
}

function sbc_a_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		sub8(this._s.R8[R_A], this._s.R8[reg], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function sub_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		sub8(this._s.R8[R_A], this._s.R8[reg],0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function adc_a_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		add8(this._s.R8[R_A], this._s.R8[reg], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function add_a_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		add8(this._s.R8[R_A], this._s.R8[reg], 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function inc_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		add8(this._s.R8[reg], 1, 0, this._op_alures);
		this._s.R8[reg] = this._op_alures[0]
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask);
	}
}

function dec_r(reg) {
	var m = 1;
	var t = 4;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		m = 2;
		t = 8;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		sub8(this._s.R8[reg], 1,0, this._op_alures);
		this._s.R8[reg] = this._op_alures[0];
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask);
	}
}

function inc_ss(reg) {
	var t = 6,
		m = 1;
	if (reg == R_IX || reg == R_IY) {
		t = 10;
		m = 2;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._s.R16[reg]++;
	}
}

function dec_ss(reg) {
	var t = 6,
		m = 1;
	if (reg == R_IX || reg == R_IY) {
		t = 10;
		m = 2;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._s.R16[reg]--;
	}
}

function res_n_xd(n, reg) {
	var mask = 1 << n;
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr) & (~mask);
		this._mmu.w8(addr, val);
	}
}

function ld_r_set_n_xd(dstreg, n, reg) {
	var mask = 1 << n;
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr) | mask;
		this._s.R8[dstreg] = val;
		this._mmu.w8(addr, val);
	}
}

function ld_r_res_n_xd(dstreg, n, reg) {
	var mask = 1 << n;
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr) & (~mask);
		this._s.R8[dstreg] = val;
		this._mmu.w8(addr, val);
	}
}

function ld_r_rr_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shr8(val, this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_rrc_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shr8(val, val & 0x01, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_rl_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shl8(val, this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_rlc_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shl8(val, val & 0x80, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_sll_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shl8(val, 1, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_sla_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shl8(val, 0, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_srl_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shr8(val, 0, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_r_sra_xd(dstreg, reg) {
	return function() {
		this._op_t = 23;
		this._op_m = 4;
		var addr = (this._s.R16[reg] + this._op_displ) & 0xFFFF;
		var val = this._mmu.r8(addr);
		shr8(val, val & 0x80, this._op_alures);
		this._s.R8[dstreg] = this._op_alures[0];
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function ld_ss_nn(reg) {
	var t = 10,
		m = 3,
		offset = 0;
	if (reg == R_IX || reg == R_IY) {
		t = 14;
		m = 4;
		offset = 1;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC] + 1 + offset);
		this._s.R16[reg] = this._op_nn;
	}
}

function ld_iss_r(regl, regr) {
	return function() {
		this._op_t = 7;
		this._op_m = 1;
		this._mmu.w8(this._s.R16[regl], this._s.R8[regr]);
	}
}

function ld_r_iss(regl, regr) {
	return function() {
		this._op_t = 7;
		this._op_m = 1;
		this._s.R8[regl] = this._mmu.r8(this._s.R16[regr]);
	}
}

function ld_r_n(reg) {
	var t = 7;
	var m = 2;
	if (reg == R_Xh || reg == R_Xl || reg == R_Yh || reg == R_Yl) {
		t = 11;
		m = 3;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		this._op_n = this._mmu.r8(this._s.R16[R_PC] + m-1);
		this._s.R8[reg] = this._op_n;
	}
}

function sbc_ss_ss(regl, regr) {
	return function() {
		this._op_t = 15;
		this._op_m = 2;
		sub16(this._s.R16[regl], this._s.R16[regr], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R16[regl] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function adc_ss_ss(regl, regr) {
	return function() {
		this._op_t = 15;
		this._op_m = 2;
		add16(this._s.R16[regl], this._s.R16[regr], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R16[regl] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	}
}

function add_ss_ss(regl, regr) {
	var t = 11,
		m = 1;
	if (regl == R_IX || regl == R_IY) {
		t = 15;
		m = 2;
	}
	return function() {
		this._op_t = t;
		this._op_m = m;
		add16(this._s.R16[regl], this._s.R16[regr], 0, this._op_alures);
		this._s.R16[regl] = this._op_alures[0];
		var mask = F_S|F_Z|F_PV;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask);
	}
}

function out_c_r(reg) {
	return function() {
		this._op_t = 12;
		this._op_m = 2;
		this._out(this._s.R8[R_C], this._s.R8[reg], this._s.R8[R_B]);
	}
}

function in_r_c(reg) {
	return function() {
		this._op_t = 12;
		this._op_m = 2;
		this._s.R8[reg] = this._in(this._s.R8[R_C], this._s.R8[R_B]);
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53Ptable[this._s.R8[reg]];
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
	0x01: ld_ss_nn(R_BC), // LD BC,nn
	0x02: ld_iss_r(R_BC, R_A), // LD (BC),A
	0x03: inc_ss(R_BC), // INC BC
	0x04: inc_r(R_B), // INC B
	0x05: dec_r(R_B), // DEC B
	0x06: ld_r_n(R_B), // LD B,n
	0x07:function () { // RLCA
		this._op_t = 4;
		this._op_m = 1;
		shl8(this._s.R8[R_A], this._s.R8[R_A] & 0x80, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = (this._s.R8[R_F] & ~(F_H|F_N|F_C)) | (this._op_alures[1] & F_C);
		var mask = F_S|F_Z|F_PV;
		this._s.R8[R_F] = (this._s.R8[R_F] & mask) | (this._op_alures[1] & ~mask);
	},
	0x08:function () { // EX AF,AF'
		this._op_t = 4;
		this._op_m = 1;
		var a = this._s.R8[R_A]; this._s.R8[R_A] = this._s.R8[R_Aa]; this._s.R8[R_Aa] = a;
		var f = this._s.R8[R_F]; this._s.R8[R_F] = this._s.R8[R_Fa]; this._s.R8[R_Fa] = f;
	},
	0x09: add_ss_ss(R_HL, R_BC), // ADD HL,BC
	0x0A: ld_r_iss(R_A, R_BC), // LD A,(BC)
	0x0B: dec_ss(R_BC), // DEC BC
	0x0C: inc_r(R_C), // INC C
	0x0D: dec_r(R_C), // DEC C
	0x0E: ld_r_n(R_C), // LD C,n
	0x0F:function () { // RRCA
		this._op_t = 4;
		this._op_m = 1;
		shr8(this._s.R8[R_A], this._s.R8[R_A] & 1, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		var mask = F_S|F_Z|F_PV;
		this._s.R8[R_F] = (this._s.R8[R_F] & mask) | (this._op_alures[1] & ~mask);
	},
	0x10:function () { // DJNZ (PC+e)
		var offset,pc;
		this._s.R8[R_B]--;
		if (this._s.R8[R_B] < 0) {
			this._s.R8[R_B] = 0xFF;
		}
		if (this._s.R8[R_B] == 0) {
			this._op_t = 8;
			this._op_m = 2;
		}
		else {
			this._op_t = 13;
			this._op_m = 0;
			pc = this._s.R16[R_PC];
			this._op_e = this._mmu.r8s(pc + 1);
			this._s.R16[R_PC] = pc + 2 + this._op_e;
		}
	},
	0x11: ld_ss_nn(R_DE), // LD DE,nn
	0x12: ld_iss_r(R_DE, R_A), // LD (DE),A
	0x13: inc_ss(R_DE), // INC DE
	0x14: inc_r(R_D), // INC D
	0x15: dec_r(R_D), // DEC D
	0x16: ld_r_n(R_D), // LD D,n
	0x17:function () { // RLA
		this._op_t = 4;
		this._op_m = 1;
		shl8(this._s.R8[R_A], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		var mask = F_S|F_Z|F_PV;
		this._s.R8[R_F] = (this._s.R8[R_F] & mask) | (this._op_alures[1] & ~mask);
	},
	0x18:function () { // JR (PC+e)
		this._op_t = 12;
		this._op_m = 0;
		var offset,pc;
		pc = this._s.R16[R_PC];
		this._op_e = this._mmu.r8s(pc + 1);
		offset = 2 + this._op_e;
		this._s.R16[R_PC] = pc + offset;
	},
	0x19: add_ss_ss(R_HL, R_DE), // ADD HL,DE
	0x1A: ld_r_iss(R_A, R_DE), // LD A,(DE)
	0x1B: dec_ss(R_DE), // DEC DE
	0x1C: inc_r(R_E), // INC E
	0x1D: dec_r(R_E), // DEC E
	0x1E: ld_r_n(R_E), // LD E,n
	0x1F:function () { // RRA
		this._op_t = 4;
		this._op_m = 1;
		shr8(this._s.R8[R_A], this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		var mask = F_S|F_Z|F_PV;
		this._s.R8[R_F] = (this._s.R8[R_F] & mask) | (this._op_alures[1] & ~mask);
	},
	0x20:function () { // JR NZ,(PC+e)
		var e;
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 7;
			this._op_m = 2;
		}
		else {
			this._op_t = 12;
			this._op_m = 0;
			var offset,pc;
			pc = this._s.R16[R_PC];
			this._op_e = this._mmu.r8s(pc + 1);
			offset = 2 + this._op_e;
			this._s.R16[R_PC] = pc + offset;
		}
	},
	0x21: ld_ss_nn(R_HL), // LD HL,nn
	0x22:function () { // LD (nn),HL
		this._op_t = 16;
		this._op_m = 3;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
		this._mmu.w16(this._op_nn, this._s.R16[R_HL]);
	},
	0x23: inc_ss(R_HL), // INC HL
	0x24: inc_r(R_H), // INC H
	0x25: dec_r(R_H), // DEC H
	0x26: ld_r_n(R_H), // LD H,n
	0x27:function () { // DAA
		this._op_t = 4;
		this._op_m = 1;
		var add = 0,
			carry = ( this._s.R8[R_F] & F_C ),
			lownibble = this._s.R8[R_A] & 0x0F,
			res;
		if((this._s.R8[R_F] & F_H) || (lownibble > 9)) add = 6;
		if(carry || (this._s.R8[R_A] > 0x99)) add |= 0x60;
		if(this._s.R8[R_A] > 0x99) carry=F_C;
		if (this._s.R8[R_F] & F_N) {
			sub8(this._s.R8[R_A], add, 0, this._op_alures);
		} else {
			add8(this._s.R8[R_A], add, 0, this._op_alures);
		}
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] =
			(this._s.R8[R_F] & F_N) |
			SZ53Ptable[this._s.R8[R_A]] |
			(this._op_alures[1] & F_H) |
			carry;
	},
	0x28:function () { // JR Z,(PC+e)
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 12;
			this._op_m = 0;
			var offset,pc;
			pc = this._s.R16[R_PC];
			this._op_e = this._mmu.r8s(pc + 1);
			offset = 2 + this._op_e;
			this._s.R16[R_PC] = (pc + offset) & 0xFFFF;
		}
		else {
			this._op_t = 7;
			this._op_m = 2;
		}
	},
	0x29: add_ss_ss(R_HL, R_HL), // ADD HL,HL
	0x2A:function () { // LD HL,(nn)
		this._op_t = 16;
		this._op_m = 3;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
		this._s.R16[R_HL] = this._mmu.r16(this._op_nn);
	},
	0x2B: dec_ss(R_HL), // DEC HL
	0x2C: inc_r(R_L), // INC L
	0x2D: dec_r(R_L), // DEC L
	0x2E: ld_r_n(R_L), // LD L,n
	0x2F:function () { // CPL
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = (~this._s.R8[R_A]) & 0xFF;
		this._s.R8[R_F] =
			(this._s.R8[R_F] & (F_S|F_Z|F_PV|F_C)) |
			F_H | F_N |
			(this._s.R8[R_A] & F_5) | (this._s.R8[R_A] & F_3);
	},
	0x30:function () { // JR NC,(PC+e)
		var offset;
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 7;
			this._op_m = 2;
		}
		else {
			this._op_t = 12;
			this._op_m = 0;
			var offset,pc;
			pc = this._s.R16[R_PC];
			this._op_e = this._mmu.r8s(pc + 1);
			offset = 2 + this._op_e;
			this._s.R16[R_PC] = pc + offset;
		}
	},
	0x31: ld_ss_nn(R_SP), // LD SP,nn
	0x32:function () { // LD (nn),A
		this._op_t = 13;
		this._op_m = 3;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
		this._mmu.w8(this._op_nn, this._s.R8[R_A]);
	},
	0x33: inc_ss(R_SP), // INC SP
	0x34:function () { // INC (HL)
		this._op_t = 11;
		this._op_m = 1;
		var HL = this._s.R16[R_HL]
		add8(this._mmu.r8(HL), 1, 0, this._op_alures);
		this._mmu.w8(HL, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask); 
	},
	0x35:function () { // DEC (HL)
		this._op_t = 11;
		this._op_m = 1;
		var HL = this._s.R16[R_HL];
		sub8(this._mmu.r8(HL), 1, 0, this._op_alures);
		this._mmu.w8(HL, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask); 
	},
	0x36:function () { // LD (HL),n
		this._op_t = 10;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._mmu.w8(this._s.R16[R_HL], this._op_n);
	},
	0x37:function () { // SCF
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_F] =
			(this._s.R8[R_F] & (F_S|F_Z|F_PV)) |
			(this._s.R8[R_A] & F_5) |
			(this._s.R8[R_A] & F_3) |
			F_C;
	},
	0x38:function () { // JR C,(PC+e)
		var offset;
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 12;
			this._op_m = 0;
			var offset,pc;
			pc = this._s.R16[R_PC];
			this._op_e = this._mmu.r8s(pc + 1);
			offset = 2 + this._op_e;
			this._s.R16[R_PC] = pc + offset;
		}
		else {
			this._op_t = 7;
			this._op_m = 2;
		}

	},
	0x39: add_ss_ss(R_HL, R_SP), // ADD HL,SP
	0x3A:function () { // LD A,(nn)
		this._op_t = 13;
		this._op_m = 3;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
		this._s.R8[R_A] = this._mmu.r8(this._op_nn);
	},
	0x3B: dec_ss(R_SP), // DEC SP
	0x3C: inc_r(R_A), // INC A
	0x3D: dec_r(R_A), // DEC A
	0x3E: ld_r_n(R_A), // LD A,n
	0x3F:function () { // CCF
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_F] =
			(this._s.R8[R_F] & (F_S|F_Z|F_PV)) |
			(this._s.R8[R_A] & F_5) |
			(this._s.R8[R_A] & F_3) |
			((this._s.R8[R_F] & F_C) << 4) | // F_H
			((this._s.R8[R_F] & F_C) ^ F_C);
	},
	0x40:function () { // LD B,B
		this._op_t = 4;
		this._op_m = 1;
	},
	0x41:function () { // LD B,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_C];
	},
	0x42:function () { // LD B,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_D];
	},
	0x43:function () { // LD B,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_E];
	},
	0x44:function () { // LD B,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_H];
	},
	0x45:function () { // LD B,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_L];
	},
	0x46: ld_r_iss(R_B,R_HL), // LD B,(HL)
	0x47:function () { // LD B,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_B] = this._s.R8[R_A];
	},
	0x48:function () { // LD C,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_B];
	},
	0x49:function () { // LD C,C
		this._op_t = 4;
		this._op_m = 1;
	},
	0x4A:function () { // LD C,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_D];
	},
	0x4B:function () { // LD C,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_E];
	},
	0x4C:function () { // LD C,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_H];
	},
	0x4D:function () { // LD C,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_L];
	},
	0x4E: ld_r_iss(R_C,R_HL), // LD C,(HL)
	0x4F:function () { // LD C,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_C] = this._s.R8[R_A];
	},
	0x50:function () { // LD D,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_B];
	},
	0x51:function () { // LD D,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_C];
	},
	0x52:function () { // LD D,D
		this._op_t = 4;
		this._op_m = 1;
	},
	0x53:function () { // LD D,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_E];
	},
	0x54:function () { // LD D,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_H];
	},
	0x55:function () { // LD D,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_L];
	},
	0x56: ld_r_iss(R_D,R_HL), // LD D,(HL)
	0x57:function () { // LD D,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_D] = this._s.R8[R_A];
	},
	0x58:function () { // LD E,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_B];
	},
	0x59:function () { // LD E,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_C];
	},
	0x5A:function () { // LD E,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_D];
	},
	0x5B:function () { // LD E,E
		this._op_t = 4;
		this._op_m = 1;
	},
	0x5C:function () { // LD E,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_H];
	},
	0x5D:function () { // LD E,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_L];
	},
	0x5E: ld_r_iss(R_E,R_HL), // LD E,(HL)
	0x5F:function () { // LD E,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_E] = this._s.R8[R_A];
	},
	0x60:function () { // LD H,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_B];
	},
	0x61:function () { // LD H,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_C];
	},
	0x62:function () { // LD H,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_D];
	},
	0x63:function () { // LD H,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_E];
	},
	0x64:function () { // LD H,H
		this._op_t = 4;
		this._op_m = 1;
	},
	0x65:function () { // LD H,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_L];
	},
	0x66: ld_r_iss(R_H,R_HL), // LD H,(HL)
	0x67:function () { // LD H,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_H] = this._s.R8[R_A];
	},
	0x68:function () { // LD L,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_B];
	},
	0x69:function () { // LD L,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_C];
	},
	0x6A:function () { // LD L,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_D];
	},
	0x6B:function () { // LD L,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_E];
	},
	0x6C:function () { // LD L,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_H];
	},
	0x6D:function () { // LD L,L
		this._op_t = 4;
		this._op_m = 1;
	},
	0x6E: ld_r_iss(R_L,R_HL), // LD L,(HL)
	0x6F:function () { // LD L,A
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_L] = this._s.R8[R_A];
	},
	0x70: ld_iss_r(R_HL, R_B), // LD (HL),B
	0x71: ld_iss_r(R_HL, R_C), // LD (HL),C
	0x72: ld_iss_r(R_HL, R_D), // LD (HL),D
	0x73: ld_iss_r(R_HL, R_E), // LD (HL),E
	0x74: ld_iss_r(R_HL, R_H), // LD (HL),H
	0x75: ld_iss_r(R_HL, R_L), // LD (HL),L
	0x76:function () { // HALT
		this._op_t = 4;
		this._op_m = 1;
		this._s.halted = 1;
	},
	0x77: ld_iss_r(R_HL, R_A), // LD (HL),A
	0x78:function () { // LD A,B
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_B];
	},
	0x79:function () { // LD A,C
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_C];
	},
	0x7A:function () { // LD A,D
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_D];
	},
	0x7B:function () { // LD A,E
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_E];
	},
	0x7C:function () { // LD A,H
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_H];
	},
	0x7D:function () { // LD A,L
		this._op_t = 4;
		this._op_m = 1;
		this._s.R8[R_A] = this._s.R8[R_L];
	},
	0x7E: ld_r_iss(R_A,R_HL), // LD A,(HL)
	0x7F:function () { // LD A,A
		this._op_t = 4;
		this._op_m = 1;
	},
	0x80: add_a_r(R_B), // ADD A,B
	0x81: add_a_r(R_C), // ADD A,C
	0x82: add_a_r(R_D), // ADD A,D
	0x83: add_a_r(R_E), // ADD A,E
	0x84: add_a_r(R_H), // ADD A,H
	0x85: add_a_r(R_L), // ADD A,L
	0x86:function () { // ADD A,(HL)
		this._op_t = 7;
		this._op_m = 1;
		add8(this._s.R8[R_A], this._mmu.r8(this._s.R16[R_HL]), 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0x87: add_a_r(R_A), // ADD A,A
	0x88: adc_a_r(R_B), // ADC A,B
	0x89: adc_a_r(R_C), // ADC A,C
	0x8A: adc_a_r(R_D), // ADC A,D
	0x8B: adc_a_r(R_E), // ADC A,E
	0x8C: adc_a_r(R_H), // ADC A,H
	0x8D: adc_a_r(R_L), // ADC A,L
	0x8E:function () { // ADC A,(HL)
		this._op_t = 7;
		this._op_m = 1;
		add8(this._s.R8[R_A], this._mmu.r8(this._s.R16[R_HL]), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0x8F: adc_a_r(R_A), // ADC A,A
	0x90: sub_r(R_B), // SUB B
	0x91: sub_r(R_C), // SUB C
	0x92: sub_r(R_D), // SUB D
	0x93: sub_r(R_E), // SUB E
	0x94: sub_r(R_H), // SUB H
	0x95: sub_r(R_L), // SUB L
	0x96:function () { // SUB (HL)
		this._op_t = 7;
		this._op_m = 1;
		var rhs = this._mmu.r8(this._s.R16[R_HL]);
		sub8(this._s.R8[R_A], rhs, 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0x97: sub_r(R_A), // SUB A
	0x98: sbc_a_r(R_B), // SBC A,B
	0x99: sbc_a_r(R_C), // SBC A,C
	0x9A: sbc_a_r(R_D), // SBC A,D
	0x9B: sbc_a_r(R_E), // SBC A,E
	0x9C: sbc_a_r(R_H), // SBC A,H
	0x9D: sbc_a_r(R_L), // SBC A,L
	0x9E:function () { // SBC A,(HL)
		this._op_t = 7;
		this._op_m = 1;
		var addr = this._s.R16[R_HL];
		sub8(this._s.R8[R_A], this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0x9F: sbc_a_r(R_A), // SBC A,A
	0xA0: and_r(R_B), // AND B
	0xA1: and_r(R_C), // AND C
	0xA2: and_r(R_D), // AND D
	0xA3: and_r(R_E), // AND E
	0xA4: and_r(R_H), // AND H
	0xA5: and_r(R_L), // AND L
	0xA6:function () { // AND (HL)
		this._op_t = 7;
		this._op_m = 1;
		var rhs = this._mmu.r8(this._s.R16[R_HL]);
		this._s.R8[R_A] &= rhs;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]] | F_H;
	},
	0xA7: and_r(R_A), // AND A
	0xA8: xor_r(R_B), // XOR B
	0xA9: xor_r(R_C), // XOR C
	0xAA: xor_r(R_D), // XOR D
	0xAB: xor_r(R_E), // XOR E
	0xAC: xor_r(R_H), // XOR H
	0xAD: xor_r(R_L), // XOR L
	0xAE: function () { // XOR (HL)
		this._op_t = 7;
		this._op_m = 1;
		var rhs = this._mmu.r8(this._s.R16[R_HL]);
		this._s.R8[R_A] ^= rhs;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xAF: xor_r(R_A), // XOR A
	0xB0: or_r(R_B), // OR B
	0xB1: or_r(R_C), // OR C
	0xB2: or_r(R_D), // OR D
	0xB3: or_r(R_E), // OR E
	0xB4: or_r(R_H), // OR H
	0xB5: or_r(R_L), // OR L
	0xB6: function () { // OR (HL)
		this._op_t = 7;
		this._op_m = 1;
		var val = this._mmu.r8(this._s.R16[R_HL]);
		this._s.R8[R_A] |= val;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xB7: or_r(R_A), // OR A
	0xB8: cp_r(R_B), // CP B
	0xB9: cp_r(R_C), // CP C
	0xBA: cp_r(R_D), // CP D
	0xBB: cp_r(R_E), // CP E
	0xBC: cp_r(R_H), // CP H
	0xBD: cp_r(R_L), // CP L
	0xBE:function () { // CP (HL)
		this._op_t = 7;
		this._op_m = 1;
		var rhs = this._mmu.r8(this._s.R16[R_HL]);
		sub8(this._s.R8[R_A], rhs, 0, this._op_alures);
		this._s.R8[R_F] = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
	},
	0xBF: cp_r(R_A), // CP A
	0xC0:function () { // RET NZ
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 5;
			this._op_m = 1;
		}
		else {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
	},
	0xC1:function () { // POP BC
		this._op_t = 10;
		this._op_m = 1;
		this._s.R16[R_BC] = this.pop16();
	},
	0xC2:function () { // JP NZ,(nn)
		this._op_t = 10;
		if (this._s.R8[R_F] & F_Z) {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
	},
	0xC3:function () { // JP (nn)
		this._op_t = 10;
		this._op_m = 0;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = this._op_nn;
	},
	0xC4:function () { // CALL NZ,(nn)
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
	},
	0xC5:function () { // PUSH BC
		this._op_t = 11;
		this._op_m = 1;
		this.push16(this._s.R16[R_BC]);
	},
	0xC6:function () { // ADD A,n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		var val = this._op_n;
		add8(this._s.R8[R_A], val, 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xC7:function () { // RST 0H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x00;
	},
	0xC8:function () { // RET Z
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
		else {
			this._op_t = 5;
			this._op_m = 1;
		}
	},
	0xC9:function () { // RET
		this._op_t = 10;
		this._op_m = 0;
		this._s.R16[R_PC] = this.pop16();
	},
	0xCA:function () { // JP Z,(nn)
		this._op_t = 10;
		if (this._s.R8[R_F] & F_Z) {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
		else {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xCB:function () { // CB
		throw ("invalid call");
	},
	0xCB00: rlc_r(R_B), // RLC B
	0xCB01: rlc_r(R_C), // RLC C
	0xCB02: rlc_r(R_D), // RLC D
	0xCB03: rlc_r(R_E), // RLC E
	0xCB04: rlc_r(R_H), // RLC H
	0xCB05: rlc_r(R_L), // RLC L
	0xCB06:function () { // RLC (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		var val = this._mmu.r8(addr);
		shl8(val, val & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB07: rlc_r(R_A), // RLC A
	0xCB08: rrc_r(R_B), // RRC B
	0xCB09: rrc_r(R_C), // RRC C
	0xCB0A: rrc_r(R_D), // RRC D
	0xCB0B: rrc_r(R_E), // RRC E
	0xCB0C: rrc_r(R_H), // RRC H
	0xCB0D: rrc_r(R_L), // RRC L
	0xCB0E:function () { // RRC (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB0F: rrc_r(R_A), // RRC A
	0xCB10: rl_r(R_B), // RL B
	0xCB11: rl_r(R_C), // RL C
	0xCB12: rl_r(R_D), // RL D
	0xCB13: rl_r(R_E), // RL E
	0xCB14: rl_r(R_H), // RL H
	0xCB15: rl_r(R_L), // RL L
	0xCB16:function () { // RL (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		shl8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB17: rl_r(R_A), // RL A
	0xCB18: rr_r(R_B), // RR B
	0xCB19: rr_r(R_C), // RR C
	0xCB1A: rr_r(R_D), // RR D
	0xCB1B: rr_r(R_E), // RR E
	0xCB1C: rr_r(R_H), // RR H
	0xCB1D: rr_r(R_L), // RR L
	0xCB1E:function () { // RR (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		shr8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB1F: rr_r(R_A), // RR A
	0xCB20: sla_r(R_B), // SLA B
	0xCB21: sla_r(R_C), // SLA C
	0xCB22: sla_r(R_D), // SLA D
	0xCB23: sla_r(R_E), // SLA E
	0xCB24: sla_r(R_H), // SLA H
	0xCB25: sla_r(R_L), // SLA L
	0xCB26:function () { // SLA (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		shl8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB27: sla_r(R_A), // SLA A
	0xCB28: sra_r(R_B), // SRA B
	0xCB29: sra_r(R_C), // SRA C
	0xCB2A: sra_r(R_D), // SRA D
	0xCB2B: sra_r(R_E), // SRA E
	0xCB2C: sra_r(R_H), // SRA H
	0xCB2D: sra_r(R_L), // SRA L
	0xCB2E:function () { // SRA (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB2F: sra_r(R_A), // SRA A
	0xCB30: sll_r(R_B), // SLL B*
	0xCB31: sll_r(R_C), // SLL C*
	0xCB32: sll_r(R_D), // SLL D*
	0xCB33: sll_r(R_E), // SLL E*
	0xCB34: sll_r(R_H), // SLL H*
	0xCB35: sll_r(R_L), // SLL L*
	0xCB36:function () { // SLL (HL)*
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		shl8(this._mmu.r8(addr), 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB37: sll_r(R_A), // SLL A*
	0xCB38: srl_r(R_B), // SRL B
	0xCB39: srl_r(R_C), // SRL C
	0xCB3A: srl_r(R_D), // SRL D
	0xCB3B: srl_r(R_E), // SRL E
	0xCB3C: srl_r(R_H), // SRL H
	0xCB3D: srl_r(R_L), // SRL L
	0xCB3E:function () { // SRL (HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		shr8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCB3F: srl_r(R_A), // SRL A
	0xCB40: bit_n_r(0,R_B), // BIT 0,B
	0xCB41: bit_n_r(0,R_C), // BIT 0,C
	0xCB42: bit_n_r(0,R_D), // BIT 0,D
	0xCB43: bit_n_r(0,R_E), // BIT 0,E
	0xCB44: bit_n_r(0,R_H), // BIT 0,H
	0xCB45: bit_n_r(0,R_L), // BIT 0,L
	0xCB46: bit_n_ihl(0), // BIT 0,(HL)
	0xCB47: bit_n_r(0,R_A), // BIT 0,A
	0xCB48: bit_n_r(1,R_B), // BIT 1,B
	0xCB49: bit_n_r(1,R_C), // BIT 1,C
	0xCB4A: bit_n_r(1,R_D), // BIT 1,D
	0xCB4B: bit_n_r(1,R_E), // BIT 1,E
	0xCB4C: bit_n_r(1,R_H), // BIT 1,H
	0xCB4D: bit_n_r(1,R_L), // BIT 1,L
	0xCB4E: bit_n_ihl(1), // BIT 1,(HL)
	0xCB4F: bit_n_r(1,R_A), // BIT 1,A
	0xCB50: bit_n_r(2,R_B), // BIT 2,B
	0xCB51: bit_n_r(2,R_C), // BIT 2,C
	0xCB52: bit_n_r(2,R_D), // BIT 2,D
	0xCB53: bit_n_r(2,R_E), // BIT 2,E
	0xCB54: bit_n_r(2,R_H), // BIT 2,H
	0xCB55: bit_n_r(2,R_L), // BIT 2,L
	0xCB56: bit_n_ihl(2), // BIT 2,(HL)
	0xCB57: bit_n_r(2,R_A), // BIT 2,A
	0xCB58: bit_n_r(3,R_B), // BIT 3,B
	0xCB59: bit_n_r(3,R_C), // BIT 3,C
	0xCB5A: bit_n_r(3,R_D), // BIT 3,D
	0xCB5B: bit_n_r(3,R_E), // BIT 3,E
	0xCB5C: bit_n_r(3,R_H), // BIT 3,H
	0xCB5D: bit_n_r(3,R_L), // BIT 3,L
	0xCB5E: bit_n_ihl(3), // BIT 3,(HL)
	0xCB5F: bit_n_r(3,R_A), // BIT 3,A
	0xCB60: bit_n_r(4,R_B), // BIT 4,B
	0xCB61: bit_n_r(4,R_C), // BIT 4,C
	0xCB62: bit_n_r(4,R_D), // BIT 4,D
	0xCB63: bit_n_r(4,R_E), // BIT 4,E
	0xCB64: bit_n_r(4,R_H), // BIT 4,H
	0xCB65: bit_n_r(4,R_L), // BIT 4,L
	0xCB66: bit_n_ihl(4), // BIT 4,(HL)
	0xCB67: bit_n_r(4,R_A), // BIT 4,A
	0xCB68: bit_n_r(5,R_B), // BIT 5,B
	0xCB69: bit_n_r(5,R_C), // BIT 5,C
	0xCB6A: bit_n_r(5,R_D), // BIT 5,D
	0xCB6B: bit_n_r(5,R_E), // BIT 5,E
	0xCB6C: bit_n_r(5,R_H), // BIT 5,H
	0xCB6D: bit_n_r(5,R_L), // BIT 5,L
	0xCB6E: bit_n_ihl(5), // BIT 5,(HL)
	0xCB6F: bit_n_r(5,R_A), // BIT 5,A
	0xCB70: bit_n_r(6,R_B), // BIT 6,B
	0xCB71: bit_n_r(6,R_C), // BIT 6,C
	0xCB72: bit_n_r(6,R_D), // BIT 6,D
	0xCB73: bit_n_r(6,R_E), // BIT 6,E
	0xCB74: bit_n_r(6,R_H), // BIT 6,H
	0xCB75: bit_n_r(6,R_L), // BIT 6,L
	0xCB76: bit_n_ihl(6), // BIT 6,(HL)
	0xCB77: bit_n_r(6,R_A), // BIT 6,A
	0xCB78: bit_n_r(7,R_B), // BIT 7,B
	0xCB79: bit_n_r(7,R_C), // BIT 7,C
	0xCB7A: bit_n_r(7,R_D), // BIT 7,D
	0xCB7B: bit_n_r(7,R_E), // BIT 7,E
	0xCB7C: bit_n_r(7,R_H), // BIT 7,H
	0xCB7D: bit_n_r(7,R_L), // BIT 7,L
	0xCB7E: bit_n_ihl(7), // BIT 7,(HL)
	0xCB7F: bit_n_r(7,R_A), // BIT 7,A
	0xCB80:function () { // RES 0,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x01;
	},
	0xCB81:function () { // RES 0,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x01;
	},
	0xCB82:function () { // RES 0,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x01;
	},
	0xCB83:function () { // RES 0,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x01;
	},
	0xCB84:function () { // RES 0,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x01;
	},
	0xCB85:function () { // RES 0,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x01;
	},
	0xCB86:function () { // RES 0,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
	},
	0xCB87:function () { // RES 0,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x01;
	},
	0xCB88:function () { // RES 1,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x02;
	},
	0xCB89:function () { // RES 1,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x02;
	},
	0xCB8A:function () { // RES 1,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x02;
	},
	0xCB8B:function () { // RES 1,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x02;
	},
	0xCB8C:function () { // RES 1,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x02;
	},
	0xCB8D:function () { // RES 1,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x02;
	},
	0xCB8E:function () { // RES 1,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
	},
	0xCB8F:function () { // RES 1,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x02;
	},
	0xCB90:function () { // RES 2,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x04;
	},
	0xCB91:function () { // RES 2,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x04;
	},
	0xCB92:function () { // RES 2,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x04;
	},
	0xCB93:function () { // RES 2,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x04;
	},
	0xCB94:function () { // RES 2,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x04;
	},
	0xCB95:function () { // RES 2,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x04;
	},
	0xCB96:function () { // RES 2,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
	},
	0xCB97:function () { // RES 2,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x04;
	},
	0xCB98:function () { // RES 3,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x08;
	},
	0xCB99:function () { // RES 3,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x08;
	},
	0xCB9A:function () { // RES 3,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x08;
	},
	0xCB9B:function () { // RES 3,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x08;
	},
	0xCB9C:function () { // RES 3,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x08;
	},
	0xCB9D:function () { // RES 3,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x08;
	},
	0xCB9E:function () { // RES 3,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
	},
	0xCB9F:function () { // RES 3,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x08;
	},
	0xCBA0:function () { // RES 4,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x10;
	},
	0xCBA1:function () { // RES 4,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x10;
	},
	0xCBA2:function () { // RES 4,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x10;
	},
	0xCBA3:function () { // RES 4,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x10;
	},
	0xCBA4:function () { // RES 4,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x10;
	},
	0xCBA5:function () { // RES 4,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x10;
	},
	0xCBA6:function () { // RES 4,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
	},
	0xCBA7:function () { // RES 4,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x10;
	},
	0xCBA8:function () { // RES 5,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x20;
	},
	0xCBA9:function () { // RES 5,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x20;
	},
	0xCBAA:function () { // RES 5,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x20;
	},
	0xCBAB:function () { // RES 5,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x20;
	},
	0xCBAC:function () { // RES 5,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x20;
	},
	0xCBAD:function () { // RES 5,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x20;
	},
	0xCBAE:function () { // RES 5,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
	},
	0xCBAF:function () { // RES 5,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x20;
	},
	0xCBB0:function () { // RES 6,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x40;
	},
	0xCBB1:function () { // RES 6,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x40;
	},
	0xCBB2:function () { // RES 6,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x40;
	},
	0xCBB3:function () { // RES 6,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x40;
	},
	0xCBB4:function () { // RES 6,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x40;
	},
	0xCBB5:function () { // RES 6,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x40;
	},
	0xCBB6:function () { // RES 6,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
	},
	0xCBB7:function () { // RES 6,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x40;
	},
	0xCBB8:function () { // RES 7,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] & ~0x80;
	},
	0xCBB9:function () { // RES 7,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] & ~0x80;
	},
	0xCBBA:function () { // RES 7,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] & ~0x80;
	},
	0xCBBB:function () { // RES 7,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] & ~0x80;
	},
	0xCBBC:function () { // RES 7,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] & ~0x80;
	},
	0xCBBD:function () { // RES 7,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] & ~0x80;
	},
	0xCBBE:function () { // RES 7,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
	},
	0xCBBF:function () { // RES 7,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] & ~0x80;
	},
	0xCBC0:function () { // SET 0,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x01;
	},
	0xCBC1:function () { // SET 0,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x01;
	},
	0xCBC2:function () { // SET 0,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x01;
	},
	0xCBC3:function () { // SET 0,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x01;
	},
	0xCBC4:function () { // SET 0,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x01;
	},
	0xCBC5:function () { // SET 0,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x01;
	},
	0xCBC6:function () { // SET 0,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
	},
	0xCBC7:function () { // SET 0,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x01;
	},
	0xCBC8:function () { // SET 1,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x02;
	},
	0xCBC9:function () { // SET 1,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x02;
	},
	0xCBCA:function () { // SET 1,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x02;
	},
	0xCBCB:function () { // SET 1,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x02;
	},
	0xCBCC:function () { // SET 1,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x02;
	},
	0xCBCD:function () { // SET 1,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x02;
	},
	0xCBCE:function () { // SET 1,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
	},
	0xCBCF:function () { // SET 1,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x02;
	},
	0xCBD0:function () { // SET 2,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x04;
	},
	0xCBD1:function () { // SET 2,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x04;
	},
	0xCBD2:function () { // SET 2,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x04;
	},
	0xCBD3:function () { // SET 2,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x04;
	},
	0xCBD4:function () { // SET 2,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x04;
	},
	0xCBD5:function () { // SET 2,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x04;
	},
	0xCBD6:function () { // SET 2,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
	},
	0xCBD7:function () { // SET 2,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x04;
	},
	0xCBD8:function () { // SET 3,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x08;
	},
	0xCBD9:function () { // SET 3,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x08;
	},
	0xCBDA:function () { // SET 3,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x08;
	},
	0xCBDB:function () { // SET 3,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x08;
	},
	0xCBDC:function () { // SET 3,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x08;
	},
	0xCBDD:function () { // SET 3,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x08;
	},
	0xCBDE:function () { // SET 3,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
	},
	0xCBDF:function () { // SET 3,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x08;
	},
	0xCBE0:function () { // SET 4,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x10;
	},
	0xCBE1:function () { // SET 4,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x10;
	},
	0xCBE2:function () { // SET 4,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x10;
	},
	0xCBE3:function () { // SET 4,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x10;
	},
	0xCBE4:function () { // SET 4,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x10;
	},
	0xCBE5:function () { // SET 4,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x10;
	},
	0xCBE6:function () { // SET 4,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
	},
	0xCBE7:function () { // SET 4,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x10;
	},
	0xCBE8:function () { // SET 5,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x20;
	},
	0xCBE9:function () { // SET 5,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x20;
	},
	0xCBEA:function () { // SET 5,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x20;
	},
	0xCBEB:function () { // SET 5,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x20;
	},
	0xCBEC:function () { // SET 5,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x20;
	},
	0xCBED:function () { // SET 5,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x20;
	},
	0xCBEE:function () { // SET 5,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
	},
	0xCBEF:function () { // SET 5,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x20;
	},
	0xCBF0:function () { // SET 6,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x40;
	},
	0xCBF1:function () { // SET 6,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x40;
	},
	0xCBF2:function () { // SET 6,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x40;
	},
	0xCBF3:function () { // SET 6,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x40;
	},
	0xCBF4:function () { // SET 6,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x40;
	},
	0xCBF5:function () { // SET 6,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x40;
	},
	0xCBF6:function () { // SET 6,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
	},
	0xCBF7:function () { // SET 6,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x40;
	},
	0xCBF8:function () { // SET 7,B
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_B] | 0x80;
	},
	0xCBF9:function () { // SET 7,C
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_C] | 0x80;
	},
	0xCBFA:function () { // SET 7,D
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_D] | 0x80;
	},
	0xCBFB:function () { // SET 7,E
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_E] | 0x80;
	},
	0xCBFC:function () { // SET 7,H
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_H] = this._s.R8[R_H] | 0x80;
	},
	0xCBFD:function () { // SET 7,L
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_L] = this._s.R8[R_L] | 0x80;
	},
	0xCBFE:function () { // SET 7,(HL)
		this._op_t = 15;
		this._op_m = 2;
		var addr = this._s.R16[R_HL];
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
	},
	0xCBFF:function () { // SET 7,A
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_A] | 0x80;
	},
	0xCC:function () { // CALL Z,nn
		if (this._s.R8[R_F] & F_Z) {
			this._op_t = 17;
			this._op_m = 0;
			var pc = this._s.R16[R_PC];
			this._op_nn = this._mmu.r16(pc+1);
			this.push16(pc + 3);
			this._s.R16[R_PC] = this._op_nn;
		}
		else {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xCD:function () { // CALL nn
		this._op_t = 17;
		this._op_m = 0;
		var pc = this._s.R16[R_PC];
		this._op_nn = this._mmu.r16(pc+1);
		this.push16(pc+3);
		this._s.R16[R_PC] = this._op_nn;
	},
	0xCE:function () { // ADC A,n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		add8(this._s.R8[R_A], this._op_n, this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xCF:function () { // RST 08H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x08;
	},
	0xD0:function () { // RET NC
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 5;
			this._op_m = 1;
		}
		else {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
	},
	0xD1:function () { // POP DE
		this._op_t = 10;
		this._op_m = 1;
		this._s.R16[R_DE] = this.pop16();
	},
	0xD2:function () { // JP NC,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_C) {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
	},
	0xD3:function () { // OUT (n),A
		this._op_t = 11;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._out(this._op_n, this._s.R8[R_A], this._s.R8[R_A]);
	},
	0xD4:function () { // CALL NC,nn
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
	},
	0xD5:function () { // PUSH DE
		this._op_t = 11;
		this._op_m = 1;
		this.push16(this._s.R16[R_DE]);
	},
	0xD6:function () { // SUB n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		sub8(this._s.R8[R_A], this._op_n, 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xD7:function () { // RST 10H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x10;
	},
	0xD8:function () { // RET C
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
		else {
			this._op_t = 5;
			this._op_m = 1;
		}
	},
	0xD9:function () { // EXX
		this._op_t = 4;
		this._op_m = 1;
		var b = this._s.R8[R_B]; this._s.R8[R_B] = this._s.R8[R_Ba]; this._s.R8[R_Ba] = b;
		var c = this._s.R8[R_C]; this._s.R8[R_C] = this._s.R8[R_Ca]; this._s.R8[R_Ca] = c;
		var d = this._s.R8[R_D]; this._s.R8[R_D] = this._s.R8[R_Da]; this._s.R8[R_Da] = d;
		var e = this._s.R8[R_E]; this._s.R8[R_E] = this._s.R8[R_Ea]; this._s.R8[R_Ea] = e;
		var h = this._s.R8[R_H]; this._s.R8[R_H] = this._s.R8[R_Ha]; this._s.R8[R_Ha] = h;
		var l = this._s.R8[R_L]; this._s.R8[R_L] = this._s.R8[R_La]; this._s.R8[R_La] = l;
	},
	0xDA:function () { // JP C,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_C) {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
		else {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xDB:function () { // IN A,(n)
		this._op_t = 11;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._s.R8[R_A] = this._in(this._op_n, this._s.R8[R_A]);
	},
	0xDC:function () { // CALL C,nn
		if (this._s.R8[R_F] & F_C) {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
		else {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xDD:function () { // DD
		this._op_t = 4;
		this._op_m = 1;
	},
	0xDD09: add_ss_ss(R_IX, R_BC), // ADD IX,BC
	0xDD19: add_ss_ss(R_IX, R_DE), // ADD IX,DE
	0xDD21: ld_ss_nn(R_IX), // LD IX,nn
	0xDD22:function () { // LD (nn),IX
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_IX]);
	},
	0xDD23: inc_ss(R_IX), // INC IX
	0xDD24: inc_r(R_Xh), // INC IXH*
	0xDD25: dec_r(R_Xh), // DEC IXH*
	0xDD26: ld_r_n(R_Xh), // LD IXH,n*
	0xDD29: add_ss_ss(R_IX, R_IX), // ADD IX,IX
	0xDD2A:function () { // LD IX,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_IX] = this._mmu.r16(this._op_nn);
	},
	0xDD2B: dec_ss(R_IX), // DEC IX
	0xDD2C: inc_r(R_Xl), // INC IXL*
	0xDD2D: dec_r(R_Xl), // DEC IXL*
	0xDD2E: ld_r_n(R_Xl), // LD IXL,n*
	0xDD34:function () { // INC (IX+d)
		this._op_t = 23;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		add8(this._mmu.r8(addr), 1, 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask); 
	},
	0xDD35:function () { // DEC (IX+d)
		this._op_t = 23;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		sub8(this._mmu.r8(addr), 1, 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask); 
	},
	0xDD36:function () { // LD (IX+d),n
		this._op_t = 19;
		this._op_m = 4;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._mmu.r8(this._s.R16[R_PC]+3));
	},
	0xDD39: add_ss_ss(R_IX, R_SP), // ADD IX,SP
	0xDD44:function () { // LD B,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_Xh];
	},
	0xDD45:function () { // LD B,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_Xl];
	},
	0xDD46:function () { // LD B,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_B] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD4C:function () { // LD C,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_Xh];
	},
	0xDD4D:function () { // LD C,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_Xl];
	},
	0xDD4E:function () { // LD C,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_C] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD54:function () { // LD D,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_Xh];
	},
	0xDD55:function () { // LD D,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_Xl];
	},
	0xDD56:function () { // LD D,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_D] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD5C:function () { // LD E,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_Xh];
	},
	0xDD5D:function () { // LD E,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_Xl];
	},
	0xDD5E:function () { // LD E,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_E] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD60:function () { // LD IXH,B*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_B];
	},
	0xDD61:function () { // LD IXH,C*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_C];
	},
	0xDD62:function () { // LD IXH,D*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_D];
	},
	0xDD63:function () { // LD IXH,E*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_E];
	},
	0xDD64:function () { // LD IXH,IXH*
		this._op_t = 8;
		this._op_m = 2;
	},
	0xDD65:function () { // LD IXH,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_Xl];
	},
	0xDD66:function () { // LD H,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_H] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD67:function () { // LD IXH,A*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xh] = this._s.R8[R_A];
	},
	0xDD68:function () { // LD IXL,B*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_B];
	},
	0xDD69:function () { // LD IXL,C*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_C];
	},
	0xDD6A:function () { // LD IXL,D*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_D];
	},
	0xDD6B:function () { // LD IXL,E*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_E];
	},
	0xDD6C:function () { // LD IXL,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_Xh];
	},
	0xDD6D:function () { // LD IXL,IXL*
		this._op_t = 8;
		this._op_m = 2;
	},
	0xDD6E:function () { // LD L,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_L] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD6F:function () { // LD IXL,A*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Xl] = this._s.R8[R_A];
	},
	0xDD70:function () { // LD (IX+d),B
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_B]);
	},
	0xDD71:function () { // LD (IX+d),C
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_C]);
	},
	0xDD72:function () { // LD (IX+d),D
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_D]);
	},
	0xDD73:function () { // LD (IX+d),E
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_E]);
	},
	0xDD74:function () { // LD (IX+d),H
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_H]);
	},
	0xDD75:function () { // LD (IX+d),L
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_L]);
	},
	0xDD77:function () { // LD (IX+d),A
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IX] + this._op_displ, this._s.R8[R_A]);
	},
	0xDD7C:function () { // LD A,IXH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_Xh];
	},
	0xDD7D:function () { // LD A,IXL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_Xl];
	},
	0xDD7E:function () { // LD A,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_A] = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
	},
	0xDD84: add_a_r(R_Xh), // ADD A,IXH*
	0xDD85: add_a_r(R_Xl), // ADD A,IXL*
	0xDD86:function () { // ADD A,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		add8(this._s.R8[R_A], this._mmu.r8(this._s.R16[R_IX] + this._op_displ), 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDD8C: adc_a_r(R_Xh), // ADC A,IXH*
	0xDD8D: adc_a_r(R_Xl), // ADC A,IXL*
	0xDD8E:function () { // ADC A,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		add8(this._s.R8[R_A], this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDD94: sub_r(R_Xh), // SUB IXH*
	0xDD95: sub_r(R_Xl), // SUB IXL*
	0xDD96:function () { // SUB (IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		sub8(this._s.R8[R_A], this._mmu.r8(addr), 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDD9C: sbc_a_r(R_Xh), // SBC A,IXH*
	0xDD9D: sbc_a_r(R_Xl), // SBC A,IXL*
	0xDD9E:function () { // SBC A,(IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		sub8(this._s.R8[R_A], this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDA4: and_r(R_Xh), // AND IXH*
	0xDDA5: and_r(R_Xl), // AND IXL*
	0xDDA6:function () { // AND (IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		this._s.R8[R_A] &= this._mmu.r8(addr);
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]] | F_H;
	},
	0xDDAC: xor_r(R_Xh), // XOR IXH*
	0xDDAD: xor_r(R_Xl), // XOR IXL*
	0xDDAE:function () { // XOR (IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IX] + this._op_displ;
		this._s.R8[R_A] ^= this._mmu.r8(addr);
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xDDB4: or_r(R_Xh), // OR IXH*
	0xDDB5: or_r(R_Xl), // OR IXL*
	0xDDB6:function () { // OR (IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var val = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
		this._s.R8[R_A] |= val;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xDDBC: cp_r(R_Xh), // CP IXH*
	0xDDBD: cp_r(R_Xl), // CP IXL*
	0xDDBE:function () { // CP (IX+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var rhs = this._mmu.r8(this._s.R16[R_IX] + this._op_displ);
		sub8(this._s.R8[R_A], rhs, 0, this._op_alures);
		this._s.R8[R_F] = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
	},
	0xDDCB00: ld_r_rlc_xd(R_B, R_IX), // LD B,RLC (IX+d)*
	0xDDCB01: ld_r_rlc_xd(R_C, R_IX), // LD C,RLC (IX+d)*
	0xDDCB02: ld_r_rlc_xd(R_D, R_IX), // LD D,RLC (IX+d)*
	0xDDCB03: ld_r_rlc_xd(R_E, R_IX), // LD E,RLC (IX+d)*
	0xDDCB04: ld_r_rlc_xd(R_H, R_IX), // LD H,RLC (IX+d)*
	0xDDCB05: ld_r_rlc_xd(R_L, R_IX), // LD L,RLC (IX+d)*
	0xDDCB06:function () { // RLC (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		var val = this._mmu.r8(addr);
		shl8(val, val & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB07: ld_r_rlc_xd(R_A, R_IX), // LD A,RLC (IX+d)*
	0xDDCB08: ld_r_rrc_xd(R_B, R_IX), // LD B,RRC (IX+d)*
	0xDDCB09: ld_r_rrc_xd(R_C, R_IX), // LD C,RRC (IX+d)*
	0xDDCB0A: ld_r_rrc_xd(R_D, R_IX), // LD D,RRC (IX+d)*
	0xDDCB0B: ld_r_rrc_xd(R_E, R_IX), // LD E,RRC (IX+d)*
	0xDDCB0C: ld_r_rrc_xd(R_H, R_IX), // LD H,RRC (IX+d)*
	0xDDCB0D: ld_r_rrc_xd(R_L, R_IX), // LD L,RRC (IX+d)*
	0xDDCB0E:function () { // RRC (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB0F: ld_r_rrc_xd(R_A, R_IX), // LD A,RRC (IX+d)*
	0xDDCB10: ld_r_rl_xd(R_B, R_IX), // LD B,RL (IX+d)*
	0xDDCB11: ld_r_rl_xd(R_C, R_IX), // LD C,RL (IX+d)*
	0xDDCB12: ld_r_rl_xd(R_D, R_IX), // LD D,RL (IX+d)*
	0xDDCB13: ld_r_rl_xd(R_E, R_IX), // LD E,RL (IX+d)*
	0xDDCB14: ld_r_rl_xd(R_H, R_IX), // LD H,RL (IX+d)*
	0xDDCB15: ld_r_rl_xd(R_L, R_IX), // LD L,RL (IX+d)*
	0xDDCB16:function () { // RL (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		shl8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB17: ld_r_rl_xd(R_A, R_IX), // LD A,RL (IX+d)*
	0xDDCB18: ld_r_rr_xd(R_B, R_IX), // LD B,RR (IX+d)*
	0xDDCB19: ld_r_rr_xd(R_C, R_IX), // LD C,RR (IX+d)*
	0xDDCB1A: ld_r_rr_xd(R_D, R_IX), // LD D,RR (IX+d)*
	0xDDCB1B: ld_r_rr_xd(R_E, R_IX), // LD E,RR (IX+d)*
	0xDDCB1C: ld_r_rr_xd(R_H, R_IX), // LD H,RR (IX+d)*
	0xDDCB1D: ld_r_rr_xd(R_L, R_IX), // LD L,RR (IX+d)*
	0xDDCB1E:function () { // RR (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		shr8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB1F: ld_r_rr_xd(R_A, R_IX), // LD A,RR (IX+d)*
	0xDDCB20: ld_r_sla_xd(R_B, R_IX), // LD B,SLA (IX+d)*
	0xDDCB21: ld_r_sla_xd(R_C, R_IX), // LD C,SLA (IX+d)*
	0xDDCB22: ld_r_sla_xd(R_D, R_IX), // LD D,SLA (IX+d)*
	0xDDCB23: ld_r_sla_xd(R_E, R_IX), // LD E,SLA (IX+d)*
	0xDDCB24: ld_r_sla_xd(R_H, R_IX), // LD H,SLA (IX+d)*
	0xDDCB25: ld_r_sla_xd(R_L, R_IX), // LD L,SLA (IX+d)*
	0xDDCB26:function () { // SLA (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		shl8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB27: ld_r_sla_xd(R_A, R_IX), // LD A,SLA (IX+d)*
	0xDDCB28: ld_r_sra_xd(R_B, R_IX), // LD B,SRA (IX+d)*
	0xDDCB29: ld_r_sra_xd(R_C, R_IX), // LD C,SRA (IX+d)*
	0xDDCB2A: ld_r_sra_xd(R_D, R_IX), // LD D,SRA (IX+d)*
	0xDDCB2B: ld_r_sra_xd(R_E, R_IX), // LD E,SRA (IX+d)*
	0xDDCB2C: ld_r_sra_xd(R_H, R_IX), // LD H,SRA (IX+d)*
	0xDDCB2D: ld_r_sra_xd(R_L, R_IX), // LD L,SRA (IX+d)*
	0xDDCB2E:function () { // SRA (IX+d)
		this._op_t = 23
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB2F: ld_r_sra_xd(R_A, R_IX), // LD A,SRA (IX+d)*
	0xDDCB30: ld_r_sll_xd(R_B, R_IX), // LD B,SLL (IX+d)*
	0xDDCB31: ld_r_sll_xd(R_C, R_IX), // LD C,SLL (IX+d)*
	0xDDCB32: ld_r_sll_xd(R_D, R_IX), // LD D,SLL (IX+d)*
	0xDDCB33: ld_r_sll_xd(R_E, R_IX), // LD E,SLL (IX+d)*
	0xDDCB34: ld_r_sll_xd(R_H, R_IX), // LD H,SLL (IX+d)*
	0xDDCB35: ld_r_sll_xd(R_L, R_IX), // LD L,SLL (IX+d)*
	0xDDCB36:function () { // SLL (IX+d)*
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		shl8(this._mmu.r8(addr), 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB37: ld_r_sll_xd(R_A, R_IX), // LD A,SLL (IX+d)*
	0xDDCB38: ld_r_srl_xd(R_B, R_IX), // LD B,SRL (IX+d)*
	0xDDCB39: ld_r_srl_xd(R_C, R_IX), // LD C,SRL (IX+d)*
	0xDDCB3A: ld_r_srl_xd(R_D, R_IX), // LD D,SRL (IX+d)*
	0xDDCB3B: ld_r_srl_xd(R_E, R_IX), // LD E,SRL (IX+d)*
	0xDDCB3C: ld_r_srl_xd(R_H, R_IX), // LD H,SRL (IX+d)*
	0xDDCB3D: ld_r_srl_xd(R_L, R_IX), // LD L,SRL (IX+d)*
	0xDDCB3E:function () { // SRL (IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		shr8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDDCB3F: ld_r_srl_xd(R_A, R_IX), // LD A,SRL (IX+d)*
	0xDDCB40: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB41: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB42: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB43: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB44: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB45: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB46: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)
	0xDDCB47: bit_n_ixyd(0, R_IX), // BIT 0,(IX+d)*
	0xDDCB48: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB49: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB4A: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB4B: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB4C: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB4D: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB4E: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)
	0xDDCB4F: bit_n_ixyd(1, R_IX), // BIT 1,(IX+d)*
	0xDDCB50: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB51: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB52: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB53: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB54: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB55: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB56: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)
	0xDDCB57: bit_n_ixyd(2, R_IX), // BIT 2,(IX+d)*
	0xDDCB58: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB59: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB5A: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB5B: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB5C: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB5D: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB5E: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)
	0xDDCB5F: bit_n_ixyd(3, R_IX), // BIT 3,(IX+d)*
	0xDDCB60: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB61: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB62: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB63: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB64: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB65: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB66: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)
	0xDDCB67: bit_n_ixyd(4, R_IX), // BIT 4,(IX+d)*
	0xDDCB68: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB69: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB6A: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB6B: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB6C: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB6D: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB6E: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)
	0xDDCB6F: bit_n_ixyd(5, R_IX), // BIT 5,(IX+d)*
	0xDDCB70: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB71: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB72: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB73: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB74: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB75: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB76: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)
	0xDDCB77: bit_n_ixyd(6, R_IX), // BIT 6,(IX+d)*
	0xDDCB78: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB79: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB7A: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB7B: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB7C: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB7D: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB7E: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)
	0xDDCB7F: bit_n_ixyd(7, R_IX), // BIT 7,(IX+d)*
	0xDDCB80: ld_r_res_n_xd(R_B, 0, R_IX),// LD B,RES 0,(IX+d)*
	0xDDCB81: ld_r_res_n_xd(R_C, 0, R_IX), // LD C,RES 0,(IX+d)*
	0xDDCB82: ld_r_res_n_xd(R_D, 0, R_IX), // LD D,RES 0,(IX+d)*
	0xDDCB83: ld_r_res_n_xd(R_E, 0, R_IX), // LD E,RES 0,(IX+d)*
	0xDDCB84: ld_r_res_n_xd(R_H, 0, R_IX), // LD H,RES 0,(IX+d)*
	0xDDCB85: ld_r_res_n_xd(R_L, 0, R_IX), // LD L,RES 0,(IX+d)*
	0xDDCB86:function () { // RES 0,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
	},
	0xDDCB87: ld_r_res_n_xd(R_A, 0, R_IX), // LD A,RES 0,(IX+d)*
	0xDDCB88: ld_r_res_n_xd(R_B, 1, R_IX), // LD B,RES 1,(IX+d)*
	0xDDCB89: ld_r_res_n_xd(R_C, 1, R_IX), // LD C,RES 1,(IX+d)*
	0xDDCB8A: ld_r_res_n_xd(R_D, 1, R_IX), // LD D,RES 1,(IX+d)*
	0xDDCB8B: ld_r_res_n_xd(R_E, 1, R_IX), // LD E,RES 1,(IX+d)*
	0xDDCB8C: ld_r_res_n_xd(R_H, 1, R_IX), // LD H,RES 1,(IX+d)*
	0xDDCB8D: ld_r_res_n_xd(R_L, 1, R_IX), // LD L,RES 1,(IX+d)*
	0xDDCB8E:function () { // RES 1,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
	},
	0xDDCB8F: ld_r_res_n_xd(R_A, 1, R_IX), // LD A,RES 1,(IX+d)*
	0xDDCB90: ld_r_res_n_xd(R_B, 2, R_IX), // LD B,RES 2,(IX+d)*
	0xDDCB91: ld_r_res_n_xd(R_C, 2, R_IX), // LD C,RES 2,(IX+d)*
	0xDDCB92: ld_r_res_n_xd(R_D, 2, R_IX), // LD D,RES 2,(IX+d)*
	0xDDCB93: ld_r_res_n_xd(R_E, 2, R_IX), // LD E,RES 2,(IX+d)*
	0xDDCB94: ld_r_res_n_xd(R_H, 2, R_IX), // LD H,RES 2,(IX+d)*
	0xDDCB95: ld_r_res_n_xd(R_L, 2, R_IX), // LD L,RES 2,(IX+d)*
	0xDDCB96:function () { // RES 2,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
	},
	0xDDCB97: ld_r_res_n_xd(R_A, 2, R_IX), // LD A,RES 2,(IX+d)*
	0xDDCB98: ld_r_res_n_xd(R_B, 3, R_IX), // LD B,RES 3,(IX+d)*
	0xDDCB99: ld_r_res_n_xd(R_C, 3, R_IX), // LD C,RES 3,(IX+d)*
	0xDDCB9A: ld_r_res_n_xd(R_D, 3, R_IX), // LD D,RES 3,(IX+d)*
	0xDDCB9B: ld_r_res_n_xd(R_E, 3, R_IX), // LD E,RES 3,(IX+d)*
	0xDDCB9C: ld_r_res_n_xd(R_H, 3, R_IX), // LD H,RES 3,(IX+d)*
	0xDDCB9D: ld_r_res_n_xd(R_L, 3, R_IX), // LD L,RES 3,(IX+d)*
	0xDDCB9E:function () { // RES 3,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
	},
	0xDDCB9F: ld_r_res_n_xd(R_A, 3, R_IX), // LD A,RES 3,(IX+d)*
	0xDDCBA0: ld_r_res_n_xd(R_B, 4, R_IX), // LD B,RES 4,(IX+d)*
	0xDDCBA1: ld_r_res_n_xd(R_C, 4, R_IX), // LD C,RES 4,(IX+d)*
	0xDDCBA2: ld_r_res_n_xd(R_D, 4, R_IX), // LD D,RES 4,(IX+d)*
	0xDDCBA3: ld_r_res_n_xd(R_E, 4, R_IX), // LD E,RES 4,(IX+d)*
	0xDDCBA4: ld_r_res_n_xd(R_H, 4, R_IX), // LD H,RES 4,(IX+d)*
	0xDDCBA5: ld_r_res_n_xd(R_L, 4, R_IX), // LD L,RES 4,(IX+d)*
	0xDDCBA6:function () { // RES 4,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
	},
	0xDDCBA7: ld_r_res_n_xd(R_A, 4, R_IX), // LD A,RES 4,(IX+d)*
	0xDDCBA8: ld_r_res_n_xd(R_B, 5, R_IX), // LD B,RES 5,(IX+d)*
	0xDDCBA9: ld_r_res_n_xd(R_C, 5, R_IX), // LD C,RES 5,(IX+d)*
	0xDDCBAA: ld_r_res_n_xd(R_D, 5, R_IX), // LD D,RES 5,(IX+d)*
	0xDDCBAB: ld_r_res_n_xd(R_E, 5, R_IX), // LD E,RES 5,(IX+d)*
	0xDDCBAC: ld_r_res_n_xd(R_H, 5, R_IX), // LD H,RES 5,(IX+d)*
	0xDDCBAD: ld_r_res_n_xd(R_L, 5, R_IX), // LD L,RES 5,(IX+d)*
	0xDDCBAE:function () { // RES 5,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
	},
	0xDDCBAF: ld_r_res_n_xd(R_A, 5, R_IX), // LD A,RES 5,(IX+d)*
	0xDDCBB0: ld_r_res_n_xd(R_B, 6, R_IX), // LD B,RES 6,(IX+d)*
	0xDDCBB1: ld_r_res_n_xd(R_C, 6, R_IX), // LD C,RES 6,(IX+d)*
	0xDDCBB2: ld_r_res_n_xd(R_D, 6, R_IX), // LD D,RES 6,(IX+d)*
	0xDDCBB3: ld_r_res_n_xd(R_E, 6, R_IX), // LD E,RES 6,(IX+d)*
	0xDDCBB4: ld_r_res_n_xd(R_H, 6, R_IX), // LD H,RES 6,(IX+d)*
	0xDDCBB5: ld_r_res_n_xd(R_L, 6, R_IX), // LD L,RES 6,(IX+d)*
	0xDDCBB6:function () { // RES 6,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
	},
	0xDDCBB7: ld_r_res_n_xd(R_A, 6, R_IX), // LD A,RES 6,(IX+d)*
	0xDDCBB8: ld_r_res_n_xd(R_B, 7, R_IX), // LD B,RES 7,(IX+d)*
	0xDDCBB9: ld_r_res_n_xd(R_C, 7, R_IX), // LD C,RES 7,(IX+d)*
	0xDDCBBA: ld_r_res_n_xd(R_D, 7, R_IX), // LD D,RES 7,(IX+d)*
	0xDDCBBB: ld_r_res_n_xd(R_E, 7, R_IX), // LD E,RES 7,(IX+d)*
	0xDDCBBC: ld_r_res_n_xd(R_H, 7, R_IX), // LD H,RES 7,(IX+d)*
	0xDDCBBD: ld_r_res_n_xd(R_L, 7, R_IX), // LD L,RES 7,(IX+d)*
	0xDDCBBE:function () { // RES 7,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
	},
	0xDDCBBF: ld_r_res_n_xd(R_A, 7, R_IX), // LD A,RES 7,(IX+d)*
	0xDDCBC0: ld_r_set_n_xd(R_B, 0, R_IX), // LD B,SET 0,(IX+d)*
	0xDDCBC1: ld_r_set_n_xd(R_C, 0, R_IX), // LD C,SET 0,(IX+d)*
	0xDDCBC2: ld_r_set_n_xd(R_D, 0, R_IX), // LD D,SET 0,(IX+d)*
	0xDDCBC3: ld_r_set_n_xd(R_E, 0, R_IX), // LD E,SET 0,(IX+d)*
	0xDDCBC4: ld_r_set_n_xd(R_H, 0, R_IX), // LD H,SET 0,(IX+d)*
	0xDDCBC5: ld_r_set_n_xd(R_L, 0, R_IX), // LD L,SET 0,(IX+d)*
	0xDDCBC6:function () { // SET 0,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
	},
	0xDDCBC7: ld_r_set_n_xd(R_A, 0, R_IX), // LD A,SET 0,(IX+d)*
	0xDDCBC8: ld_r_set_n_xd(R_B, 1, R_IX), // LD B,SET 1,(IX+d)*
	0xDDCBC9: ld_r_set_n_xd(R_C, 1, R_IX), // LD C,SET 1,(IX+d)*
	0xDDCBCA: ld_r_set_n_xd(R_D, 1, R_IX), // LD D,SET 1,(IX+d)*
	0xDDCBCB: ld_r_set_n_xd(R_E, 1, R_IX), // LD E,SET 1,(IX+d)*
	0xDDCBCC: ld_r_set_n_xd(R_H, 1, R_IX), // LD H,SET 1,(IX+d)*
	0xDDCBCD: ld_r_set_n_xd(R_L, 1, R_IX), // LD L,SET 1,(IX+d)*
	0xDDCBCE:function () { // SET 1,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
	},
	0xDDCBCF: ld_r_set_n_xd(R_A, 1, R_IX), // LD A,SET 1,(IX+d)*
	0xDDCBD0: ld_r_set_n_xd(R_B, 2, R_IX), // LD B,SET 2,(IX+d)*
	0xDDCBD1: ld_r_set_n_xd(R_C, 2, R_IX), // LD C,SET 2,(IX+d)*
	0xDDCBD2: ld_r_set_n_xd(R_D, 2, R_IX), // LD D,SET 2,(IX+d)*
	0xDDCBD3: ld_r_set_n_xd(R_E, 2, R_IX), // LD E,SET 2,(IX+d)*
	0xDDCBD4: ld_r_set_n_xd(R_H, 2, R_IX), // LD H,SET 2,(IX+d)*
	0xDDCBD5: ld_r_set_n_xd(R_L, 2, R_IX), // LD L,SET 2,(IX+d)*
	0xDDCBD6:function () { // SET 2,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
	},
	0xDDCBD7: ld_r_set_n_xd(R_A, 2, R_IX), // LD A,SET 2,(IX+d)*
	0xDDCBD8: ld_r_set_n_xd(R_B, 3, R_IX), // LD B,SET 3,(IX+d)*
	0xDDCBD9: ld_r_set_n_xd(R_C, 3, R_IX), // LD C,SET 3,(IX+d)*
	0xDDCBDA: ld_r_set_n_xd(R_D, 3, R_IX), // LD D,SET 3,(IX+d)*
	0xDDCBDB: ld_r_set_n_xd(R_E, 3, R_IX), // LD E,SET 3,(IX+d)*
	0xDDCBDC: ld_r_set_n_xd(R_H, 3, R_IX), // LD H,SET 3,(IX+d)*
	0xDDCBDD: ld_r_set_n_xd(R_L, 3, R_IX), // LD L,SET 3,(IX+d)*
	0xDDCBDE:function () { // SET 3,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
	},
	0xDDCBDF: ld_r_set_n_xd(R_A, 3, R_IX), // LD A,SET 3,(IX+d)*
	0xDDCBE0: ld_r_set_n_xd(R_B, 4, R_IX), // LD B,SET 4,(IX+d)*
	0xDDCBE1: ld_r_set_n_xd(R_C, 4, R_IX), // LD C,SET 4,(IX+d)*
	0xDDCBE2: ld_r_set_n_xd(R_D, 4, R_IX), // LD D,SET 4,(IX+d)*
	0xDDCBE3: ld_r_set_n_xd(R_E, 4, R_IX), // LD E,SET 4,(IX+d)*
	0xDDCBE4: ld_r_set_n_xd(R_H, 4, R_IX), // LD H,SET 4,(IX+d)*
	0xDDCBE5: ld_r_set_n_xd(R_L, 4, R_IX), // LD L,SET 4,(IX+d)*
	0xDDCBE6:function () { // SET 4,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
	},
	0xDDCBE7: ld_r_set_n_xd(R_A, 4, R_IX), // LD A,SET 4,(IX+d)*
	0xDDCBE8: ld_r_set_n_xd(R_B, 5, R_IX), // LD B,SET 5,(IX+d)*
	0xDDCBE9: ld_r_set_n_xd(R_C, 5, R_IX), // LD C,SET 5,(IX+d)*
	0xDDCBEA: ld_r_set_n_xd(R_D, 5, R_IX), // LD D,SET 5,(IX+d)*
	0xDDCBEB: ld_r_set_n_xd(R_E, 5, R_IX), // LD E,SET 5,(IX+d)*
	0xDDCBEC: ld_r_set_n_xd(R_H, 5, R_IX), // LD H,SET 5,(IX+d)*
	0xDDCBED: ld_r_set_n_xd(R_L, 5, R_IX), // LD L,SET 5,(IX+d)*
	0xDDCBEE:function () { // SET 5,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
	},
	0xDDCBEF: ld_r_set_n_xd(R_A, 5, R_IX), // LD A,SET 5,(IX+d)*
	0xDDCBF0: ld_r_set_n_xd(R_B, 6, R_IX), // LD B,SET 6,(IX+d)*
	0xDDCBF1: ld_r_set_n_xd(R_C, 6, R_IX), // LD C,SET 6,(IX+d)*
	0xDDCBF2: ld_r_set_n_xd(R_D, 6, R_IX), // LD D,SET 6,(IX+d)*
	0xDDCBF3: ld_r_set_n_xd(R_E, 6, R_IX), // LD E,SET 6,(IX+d)*
	0xDDCBF4: ld_r_set_n_xd(R_H, 6, R_IX), // LD H,SET 6,(IX+d)*
	0xDDCBF5: ld_r_set_n_xd(R_L, 6, R_IX), // LD L,SET 6,(IX+d)*
	0xDDCBF6:function () { // SET 6,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
	},
	0xDDCBF7: ld_r_set_n_xd(R_A, 6, R_IX), // LD A,SET 6,(IX+d)*
	0xDDCBF8: ld_r_set_n_xd(R_B, 7, R_IX), // LD B,SET 7,(IX+d)*
	0xDDCBF9: ld_r_set_n_xd(R_C, 7, R_IX), // LD C,SET 7,(IX+d)*
	0xDDCBFA: ld_r_set_n_xd(R_D, 7, R_IX), // LD D,SET 7,(IX+d)*
	0xDDCBFB: ld_r_set_n_xd(R_E, 7, R_IX), // LD E,SET 7,(IX+d)*
	0xDDCBFC: ld_r_set_n_xd(R_H, 7, R_IX), // LD H,SET 7,(IX+d)*
	0xDDCBFD: ld_r_set_n_xd(R_L, 7, R_IX), // LD L,SET 7,(IX+d)*
	0xDDCBFE:function () { // SET 7,(IX+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IX]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
	},
	0xDDCBFF: ld_r_set_n_xd(R_A, 7, R_IX), // LD A,SET 7,(IX+d)*
	0xDDE1:function () { // POP IX
		this._op_t = 14;
		this._op_m = 2;
		this._s.R16[R_IX] = this.pop16();
	},
	0xDDE3:function () { // EX (SP),IX
		this._op_t = 23;
		this._op_m = 2;
		var addr = this._s.R16[R_SP];
		var memval = this._mmu.r16(addr);
		this._mmu.w16reverse(addr, this._s.R16[R_IX]);
		this._s.R16[R_IX] = memval;
	},
	0xDDE5:function () { // PUSH IX
		this._op_t = 15;
		this._op_m = 2;
		this.push16(this._s.R16[R_IX]);
	},
	0xDDE9:function () { // JP (IX)
		this._op_t = 8;
		this._op_m = 0;
		this._s.R16[R_PC] = this._s.R16[R_IX];
	},
	0xDDF9:function () { // LD SP,IX
		this._op_t = 10;
		this._op_m = 2;
		this._s.R16[R_SP] = this._s.R16[R_IX];
	},
	0xDE:function () { // SBC A,n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		sub8(this._s.R8[R_A], this._op_n, this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0]
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xDF:function () { // RST 18H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x18;
	},
	0xE0:function () { // RET PO
		if (this._s.R8[R_F] & F_PV) {
			this._op_t = 5;
			this._op_m = 1;
		}
		else {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
	},
	0xE1:function () { // POP HL
		this._op_t = 10;
		this._op_m = 1;
		this._s.R16[R_HL] = this.pop16();
	},
	0xE2:function () { // JP PO,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_PV) {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
	},
	0xE3:function () { // EX (SP),HL
		this._op_t = 19;
		this._op_m = 1;
		var addr = this._s.R16[R_SP];
		var memval = this._mmu.r16(addr);
		this._mmu.w16reverse(addr, this._s.R16[R_HL]);
		this._s.R16[R_HL] = memval;
	},
	0xE4:function () { // CALL PO,nn
		if (this._s.R8[R_F] & F_PV) {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
	},
	0xE5:function () { // PUSH HL
		this._op_t = 11;
		this._op_m = 1;
		this.push16(this._s.R16[R_HL]);
	},
	0xE6:function () { // AND n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._s.R8[R_A] &= this._op_n;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]] | F_H;
	},
	0xE7:function () { // RST 20H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x20;
	},
	0xE8:function () { // RET PE
		if (this._s.R8[R_F] & F_PV) {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
		else {
			this._op_t = 5;
			this._op_m = 1;
		}
	},
	0xE9:function () { // JP (HL)
		this._op_t = 4;
		this._op_m = 0;
		this._s.R16[R_PC] = this._s.R16[R_HL];
	},
	0xEA:function () { // JP PE,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_PV) {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
			this._op_m = 0;
		}
		else {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xEB:function () { // EX DE,HL
		this._op_t = 4;
		this._op_m = 1;
		var DE = this._s.R16[R_DE];
		this._s.R16[R_DE] = this._s.R16[R_HL];
		this._s.R16[R_HL] = DE;
	},
	0xEC:function () { // CALL PE,nn
		if (this._s.R8[R_F] & F_PV) {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
		else {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
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
	0xED40: in_r_c(R_B), // IN B,(C)
	0xED41: out_c_r(R_B), // OUT (C),B
	0xED42: sbc_ss_ss(R_HL, R_BC), // SBC HL,BC
	0xED43:function () { // LD (nn),BC
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_BC]);
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
		this._s.R8[R_I]= this._s.R8[R_A];
	},
	0xED48: in_r_c(R_C), // IN C,(C)
	0xED49: out_c_r(R_C), // OUT (C),C
	0xED4A: adc_ss_ss(R_HL, R_BC), // ADC HL,BC
	0xED4B:function () { // LD BC,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_BC] = this._mmu.r16(this._op_nn);
	},
	0xED4C: neg_a(), // NEG*
	0xED4D:function () { // RETI
		this._op_t = 14;
		this._op_m = 0;
		this._s.R16[R_PC] = this.pop16();
	},
	0xED4E:function () { // IM 0*
		this._op_t = 8;
		this._op_m = 2;
		this._s.im = 0;
	},
	0xED4F:function () { // LD R,A
		this._op_t = 9;
		this._op_m = 2;
		this._s.R8[R_R] = this._s.R8[R_A];
	},
	0xED50: in_r_c(R_D), // IN D,(C)
	0xED51: out_c_r(R_D), // OUT (C),D
	0xED52: sbc_ss_ss(R_HL, R_DE), // SBC HL,DE
	0xED53:function () { // LD (nn),DE
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_DE]);
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
		this._s.R8[R_A] = this._s.R8[R_I];
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53table[this._s.R8[R_A]] | (this._s.IFF2 ? F_PV : 0);
	},
	0xED58: in_r_c(R_E), // IN E,(C)
	0xED59: out_c_r(R_E), // OUT (C),E
	0xED5A: adc_ss_ss(R_HL, R_DE), // ADC HL,DE
	0xED5B:function () { // LD DE,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_DE] = this._mmu.r16(this._op_nn);
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
		this._s.R8[R_A] = this._s.R8[R_R];
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53table[this._s.R8[R_A]] | (this._s.IFF2 ? F_PV : 0);
	},
	0xED60: in_r_c(R_H), // IN H,(C)
	0xED61: out_c_r(R_H), // OUT (C),H
	0xED62: sbc_ss_ss(R_HL, R_HL), // SBC HL,HL
	0xED63:function () { // LD (nn), HL
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_HL]);
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
		var HL = this._s.R16[R_HL]
		var memval = this._mmu.r8(HL);
		this._mmu.w8(HL, ((this._s.R8[R_A] & 0x0F) << 4) | (memval >>> 4));
		this._s.R8[R_A] = (this._s.R8[R_A] & 0xF0) | (memval & 0x0F);
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53Ptable[this._s.R8[R_A]];
	},
	0xED68: in_r_c(R_L), // IN L,(C)
	0xED69: out_c_r(R_L), // OUT (C),L
	0xED6A: adc_ss_ss(R_HL, R_HL), // ADC HL,HL
	0xED6B:function () { // LD HL,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_HL] = this._mmu.r16(this._op_nn);
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
		var HL = this._s.R16[R_HL]
		var memval = this._mmu.r8(HL);
		this._mmu.w8(HL, ((memval & 0x0F) << 4) | (this._s.R8[R_A] & 0x0F));
		this._s.R8[R_A] = (this._s.R8[R_A] & 0xF0) | (memval >>> 4);
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53Ptable[this._s.R8[R_A]];
	},
	0xED70:function () { // IN (C)
		this._op_t = 12;
		this._op_m = 2;
		var val = this._in(this._s.R8[R_C], this._s.R8[R_B]);
		this._s.R8[R_F] = (this._s.R8[R_F] & F_C) | SZ53Ptable[val];
	},
	0xED71:function () { // OUT (C),0*
		this._op_t = 12;
		this._op_m = 2;
		this._out(this._s.R8[R_C], 0, this._s.R8[R_B]);
	},
	0xED72: sbc_ss_ss(R_HL, R_SP), // SBC HL,SP
	0xED73:function () { // LD (nn),SP
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_SP]);
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
	0xED78: in_r_c(R_A), // IN A,(C)
	0xED79: out_c_r(R_A), // OUT (C),A
	0xED7A: adc_ss_ss(R_HL, R_SP), // ADC HL,SP
	0xED7B:function () { // LD SP,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_SP] = this._mmu.r16(this._op_nn);
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
		var DE = this._s.R16[R_DE];
		var HL = this._s.R16[R_HL];
		var BC = this._s.R16[R_BC];
		var memval = this._mmu.r8(HL);
		this._mmu.w8(DE, memval);
		DE++;
		HL++;
		BC--;
		this._s.R16[R_DE] = DE;
		this._s.R16[R_HL] = HL;
		this._s.R16[R_BC] = BC;
		memval = (memval + this._s.R8[R_A]) & 0xFF;
		this._s.R8[R_F] =
			(this._s.R8[R_F] & (F_S|F_Z|F_C)) |
			(BC != 0 ? F_PV : 0) |
			(memval & F_3) |
			((memval & 0x02) ? F_5 : 0);
	},
	0xEDA1:function () { // CPI
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var memval = this._mmu.r8(HL);
		sub8(this._s.R8[R_A], memval, 0, this._op_alures);
		HL++;
		BC--;
		this._s.R16[R_HL] = HL;
		this._s.R16[R_BC] = BC;
		memval = (this._s.R8[R_A] - memval - ((this._op_alures[1] & F_H) ? 1 : 0)) & 0xFF;
		this._s.R8[R_F] =
			F_N |
			(this._s.R8[R_F] & F_C) |
			(this._op_alures[1] & (F_S|F_Z|F_H)) |
			(memval & F_3) |
			((memval & 0x02) ? F_5 : 0) |
			(BC != 0 ? F_PV : 0);
	},
	0xEDA2:function () { // INI
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var regval = this._in(this._s.R8[R_C], this._s.R8[R_B]);
		this._mmu.w8(HL, regval);
		HL++;
		this._s.R16[R_HL] = HL;
		sub8(this._s.R8[R_B], 1, 0, this._op_alures);
		this._s.R8[R_B] = this._op_alures[0];
		this._s.R8[R_F] =
			(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
			((regval & 0x80) ? F_N : 0) |
			((regval + ((BC+1) & 0xFF)) > 0xFF ? (F_H|F_C) : 0) |
			(SZ53Ptable[((regval + ((BC+1) & 0xFF)) & 7) ^ this._s.R8[R_B]] & F_PV);
	},
	0xEDA3:function () { // OUTI
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var memval = this._mmu.r8(HL);
		HL++;
		this._s.R16[R_HL] = HL;
		sub8(this._s.R8[R_B], 1, 0, this._op_alures);
		this._s.R8[R_B] = this._op_alures[0];
		this._out(this._s.R8[R_C], memval, this._s.R8[R_B]);
		this._s.R8[R_F] =
			(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
			((memval & 0x80) ? F_N : 0) |
			((memval + this._s.R8[R_L]) > 0xFF ? (F_H|F_C) : 0) |
			(SZ53Ptable[((memval + this._s.R8[R_L]) & 7) ^ this._s.R8[R_B]] & F_PV);
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
		var DE = this._s.R16[R_DE];
		var HL = this._s.R16[R_HL];
		var BC = this._s.R16[R_BC];
		var memval = this._mmu.r8(HL);
		this._mmu.w8(DE, memval);
		DE--;
		HL--;
		BC--;
		this._s.R16[R_DE] = DE;
		this._s.R16[R_HL] = HL;
		this._s.R16[R_BC] = BC;
		memval = (memval + this._s.R8[R_A]) & 0xFF;
		this._s.R8[R_F] =
			(this._s.R8[R_F] & (F_S|F_Z|F_C)) |
			(BC != 0 ? F_PV : 0) |
			(memval & F_3) |
			((memval & 0x02) ? F_5 : 0);
	},
	0xEDA9:function () { // CPD
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var memval = this._mmu.r8(HL);
		sub8(this._s.R8[R_A], memval, 0, this._op_alures);
		HL--;
		BC--;
		this._s.R16[R_HL] = HL;
		this._s.R16[R_BC] = BC;
		memval = (this._s.R8[R_A] - memval - ((this._op_alures[1] & F_H) ? 1 : 0)) & 0xFF;
		this._s.R8[R_F] =
			F_N |
			(this._s.R8[R_F] & F_C) |
			(this._op_alures[1] & (F_S|F_Z|F_H)) |
			(memval & F_3) |
			((memval & 0x02) ? F_5 : 0) |
			(BC != 0 ? F_PV : 0);
	},
	0xEDAA:function () { // IND
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var regval = this._in(this._s.R8[R_C], this._s.R8[R_B]);
		this._mmu.w8(HL, regval);
		HL--;
		this._s.R16[R_HL] = HL;
		sub8(this._s.R8[R_B], 1, 0, this._op_alures);
		this._s.R8[R_B] = this._op_alures[0];
		this._s.R8[R_F] =
			(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
			((regval & 0x80) ? F_N : 0) |
			((regval + ((BC-1) & 0xFF)) > 0xFF ? (F_H|F_C) : 0) |
			(SZ53Ptable[((regval + ((BC-1) & 0xFF)) & 7) ^ this._s.R8[R_B]] & F_PV);
	},
	0xEDAB:function () { // OUTD
		this._op_t = 16;
		this._op_m = 2;
		var BC = this._s.R16[R_BC];
		var HL = this._s.R16[R_HL];
		var memval = this._mmu.r8(HL);
		HL--;
		this._s.R16[R_HL] = HL;
		sub8(this._s.R8[R_B], 1, 0, this._op_alures);
		this._s.R8[R_B] = this._op_alures[0];
		this._out(this._s.R8[R_C], memval, this._s.R8[R_B]);
		this._s.R8[R_F] =
			(this._op_alures[1] & (F_S|F_Z|F_5|F_3)) |
			((memval & 0x80) ? F_N : 0) |
			((memval + this._s.R8[R_L]) > 0xFF ? (F_H|F_C) : 0) |
			(SZ53Ptable[((memval + this._s.R8[R_L]) & 7) ^ this._s.R8[R_B]] & F_PV);
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

		if (this._s.R16[R_BC] !== 0) { // repeat
			this._op_t = 21;
			this._op_m = 0; // repeat this instruction
		}
	},
	0xEDB1:function () { // CPIR
		this._opcodes[0xEDA1].call(this);

		if (this._s.R16[R_BC] != 0 && !(this._s.R8[R_F] & F_Z)) {
			this._op_t = 21;
			this._op_m = 0;
		}
	},
	0xEDB2:function () { // INIR
		this._opcodes[0xEDA2].call(this);

		if (this._s.R8[R_B] != 0) {
			this._op_t = 21;
			this._op_m = 0;
		}
	},
	0xEDB3:function () { // OTIR
		this._opcodes[0xEDA3].call(this);

		if (this._s.R8[R_B] != 0) {
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

		if (this._s.R16[R_BC] !== 0) { // repeat
			this._op_t = 21;
			this._op_m = 0; // repeat this instruction
		}
	},
	0xEDB9:function () { // CPDR
		this._opcodes[0xEDA9].call(this);

		if (this._s.R16[R_BC] != 0 && !(this._s.R8[R_F] & F_Z)) {
			this._op_t = 21;
			this._op_m = 0;
		}
	},
	0xEDBA:function () { // INDR
		this._opcodes[0xEDAA].call(this);

		if (this._s.R8[R_B] !== 0) { // repeat
			this._op_t = 21;
			this._op_m = 0; // repeat this instruction
		}
	},
	0xEDBB:function () { // OTDR
		this._opcodes[0xEDAB].call(this);

		if (this._s.R8[R_B] !== 0) { // repeat
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
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._s.R8[R_A] = (this._s.R8[R_A] ^ this._op_n) & 0xFF;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xEF:function () { // RST 28H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x28;
	},
	0xF0:function () { // RET P
		if (this._s.R8[R_F] & F_S) {
			this._op_t = 5;
			this._op_m = 1;
		}
		else {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
	},
	0xF1:function () { // POP AF
		this._op_t = 10;
		this._op_m = 1;
		this._s.R16[R_AF] = this.pop16();
	},
	0xF2:function () { // JP P,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_S) {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
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
		if (this._s.R8[R_F] & F_S) {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
		else {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
	},
	0xF5:function () { // PUSH AF
		this._op_t = 11;
		this._op_m = 1;
		this.push16(this._s.R16[R_AF]);
	},
	0xF6:function () { // OR n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		this._s.R8[R_A] = this._s.R8[R_A] | this._op_n;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xF7:function () { // RST 30H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x30;
	},
	0xF8:function () { // RET M
		if (this._s.R8[R_F] & F_S) {
			this._op_t = 11;
			this._op_m = 0;
			this._s.R16[R_PC] = this.pop16();
		}
		else {
			this._op_t = 5;
			this._op_m = 1;
		}
	},
	0xF9:function () { // LD SP,HL
		this._op_t = 6;
		this._op_m = 1;
		this._s.R16[R_SP] = this._s.R16[R_HL];
	},
	0xFA:function () { // JP M,nn
		this._op_t = 10;
		if (this._s.R8[R_F] & F_S) {
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this._s.R16[R_PC] = this._op_nn;
		}
		else {
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xFB:function () { // EI
		this._op_t = 4;
		this._op_m = 1;
		this._s.IFF1 = 1;
		this._s.IFF2 = 1; //TODO: does not take effect until the end of next instr
	},
	0xFC:function () { // CALL M,nn
		if (this._s.R8[R_F] & F_S) {
			this._op_t = 17;
			this._op_m = 0;
			this._op_nn = this._mmu.r16(this._s.R16[R_PC]+1);
			this.push16(this._s.R16[R_PC]+3);
			this._s.R16[R_PC] = this._op_nn;
		}
		else {
			this._op_t = 10;
			this._op_m = 3;
			this._op_nn = this._mmu.r16nolog(this._s.R16[R_PC]+1);
		}
	},
	0xFD:function () { // FD
		this._op_t = 4;
		this._op_m = 1;
	},
	0xFD09: add_ss_ss(R_IY, R_BC), // ADD IY,BC
	0xFD19: add_ss_ss(R_IY, R_DE), // ADD IY,DE
	0xFD21: ld_ss_nn(R_IY), // LD IY,nn
	0xFD22:function () { // LD (nn),IY
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._mmu.w16(this._op_nn, this._s.R16[R_IY]);
	},
	0xFD23: inc_ss(R_IY), // INC IY
	0xFD24: inc_r(R_Yh), // INC IYH*
	0xFD25: dec_r(R_Yh), // DEC IYH*
	0xFD26: ld_r_n(R_Yh), // LD IYH,n*
	0xFD29: add_ss_ss(R_IY, R_IY), // ADD IY,IY
	0xFD2A:function () { // LD IY,(nn)
		this._op_t = 20;
		this._op_m = 4;
		this._op_nn = this._mmu.r16(this._s.R16[R_PC]+2);
		this._s.R16[R_IY] = this._mmu.r16(this._op_nn);
	},
	0xFD2B: dec_ss(R_IY), // DEC IY
	0xFD2C: inc_r(R_Yl), // INC IYL*
	0xFD2D: dec_r(R_Yl), // DEC IYL*
	0xFD2E: ld_r_n(R_Yl), // LD IYL,n*
	0xFD34:function () { // INC (IY+d)
		this._op_t = 23;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY] + this._op_displ;
		add8(this._mmu.r8(addr), 1, 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask);
	},
	0xFD35:function () { // DEC (IY+d)
		this._op_t = 23;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		sub8(this._mmu.r8(addr), 1, 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		var mask = F_C;
		this._s.R8[R_F] = (this._op_alures[1] & ~mask) | (this._s.R8[R_F] & mask);
	},
	0xFD36:function () { // LD (IY+d),n
		this._op_t = 19;
		this._op_m = 4;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+3);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._op_n);
	},
	0xFD39: add_ss_ss(R_IY, R_SP), // ADD IY,SP
	0xFD44:function () { // LD B,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_Yh];
	},
	0xFD45:function () { // LD B,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_B] = this._s.R8[R_Yl];
	},
	0xFD46:function () { // LD B,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_B] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD4C:function () { // LD C,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_Yh];
	},
	0xFD4D:function () { // LD C,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_C] = this._s.R8[R_Yl];
	},
	0xFD4E:function () { // LD C,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_C] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD54:function () { // LD D,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_Yh];
	},
	0xFD55:function () { // LD D,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_D] = this._s.R8[R_Yl];
	},
	0xFD56:function () { // LD D,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_D] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD5C:function () { // LD E,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_Yh];
	},
	0xFD5D:function () { // LD E,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_E] = this._s.R8[R_Yl];
	},
	0xFD5E:function () { // LD E,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_E] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD60:function () { // LD IYH,B*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_B];
	},
	0xFD61:function () { // LD IYH,C*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_C];
	},
	0xFD62:function () { // LD IYH,D*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_D];
	},
	0xFD63:function () { // LD IYH,E*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_E];
	},
	0xFD64:function () { // LD IYH,IYH*
		this._op_t = 8;
		this._op_m = 2;
	},
	0xFD65:function () { // LD IYH,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_Yl];
	},
	0xFD66:function () { // LD H,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_H] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD67:function () { // LD IYH,A*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yh] = this._s.R8[R_A];
	},
	0xFD68:function () { // LD IYL,B*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_B];
	},
	0xFD69:function () { // LD IYL,C*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_C];
	},
	0xFD6A:function () { // LD IYL,D*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_D];
	},
	0xFD6B:function () { // LD IYL,E*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_E];
	},
	0xFD6C:function () { // LD IYL,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_Yh];
	},
	0xFD6D:function () { // LD IYL,IYL*
		this._op_t = 8;
		this._op_m = 2;
	},
	0xFD6E:function () { // LD L,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_L] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD6F:function () { // LD IYL,A*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_Yl] = this._s.R8[R_A];
	},
	0xFD70:function () { // LD (IY+d),B
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_B]);
	},
	0xFD71:function () { // LD (IY+d),C
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_C]);
	},
	0xFD72:function () { // LD (IY+d),D
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_D]);
	},
	0xFD73:function () { // LD (IY+d),E
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_E]);
	},
	0xFD74:function () { // LD (IY+d),H
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_H]);
	},
	0xFD75:function () { // LD (IY+d),L
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_L]);
	},
	0xFD77:function () { // LD (IY+d),A
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._mmu.w8(this._s.R16[R_IY]+this._op_displ, this._s.R8[R_A]);
	},
	0xFD7C:function () { // LD A,IYH*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_Yh];
	},
	0xFD7D:function () { // LD A,IYL*
		this._op_t = 8;
		this._op_m = 2;
		this._s.R8[R_A] = this._s.R8[R_Yl];
	},
	0xFD7E:function () { // LD A,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		this._s.R8[R_A] = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
	},
	0xFD84: add_a_r(R_Yh), // ADD A,IYH*
	0xFD85: add_a_r(R_Yl), // ADD A,IYL*
	0xFD86:function () { // ADD A,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		add8(this._s.R8[R_A], this._mmu.r8(this._s.R16[R_IY]+this._op_displ), 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFD8C: adc_a_r(R_Yh), // ADC A,IYH*
	0xFD8D: adc_a_r(R_Yl), // ADC A,IYL*
	0xFD8E:function () { // ADC A,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		add8(this._s.R8[R_A], this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFD94: sub_r(R_Yh), // SUB IYH*
	0xFD95: sub_r(R_Yl), // SUB IYL*
	0xFD96:function () { // SUB (IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		sub8(this._s.R8[R_A], this._mmu.r8(addr), 0, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFD9C: sbc_a_r(R_Yh), // SBC A,IYH*
	0xFD9D: sbc_a_r(R_Yl), // SBC A,IYL*
	0xFD9E:function () { // SBC A,(IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		sub8(this._s.R8[R_A], this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._s.R8[R_A] = this._op_alures[0];
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDA4: and_r(R_Yh), // AND IYH*
	0xFDA5: and_r(R_Yl), // AND IYL*
	0xFDA6:function () { // AND (IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._s.R8[R_A] = this._s.R8[R_A] & this._mmu.r8(addr);
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]] | F_H;
	},
	0xFDAC: xor_r(R_Yh), // XOR IYH*
	0xFDAD: xor_r(R_Yl), // XOR IYL*
	0xFDAE:function () { // XOR (IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._s.R8[R_A] = (this._s.R8[R_A] ^ this._mmu.r8(addr)) & 0xFF;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xFDB4: or_r(R_Yh), // OR IYH*
	0xFDB5: or_r(R_Yl), // OR IYL*
	0xFDB6:function () { // OR (IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var val = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
		this._s.R8[R_A] = (this._s.R8[R_A] | val) & 0xFF;
		this._s.R8[R_F] = SZ53Ptable[this._s.R8[R_A]];
	},
	0xFDBC: cp_r(R_Yh), // CP IYH*
	0xFDBD: cp_r(R_Yl), // CP IYL*
	0xFDBE:function () { // CP (IY+d)
		this._op_t = 19;
		this._op_m = 3;
		this._op_displ = this._mmu.r8s(this._s.R16[R_PC]+2);
		var rhs = this._mmu.r8(this._s.R16[R_IY]+this._op_displ);
		sub8(this._s.R8[R_A], rhs, 0, this._op_alures);
		this._s.R8[R_F] = (this._op_alures[1] & ~(F_5|F_3)) | (rhs & (F_5|F_3));
	},
	0xFDCB00: ld_r_rlc_xd(R_B, R_IY), // LD B,RLC (IY+d)*
	0xFDCB01: ld_r_rlc_xd(R_C, R_IY), // LD C,RLC (IY+d)*
	0xFDCB02: ld_r_rlc_xd(R_D, R_IY), // LD D,RLC (IY+d)*
	0xFDCB03: ld_r_rlc_xd(R_E, R_IY), // LD E,RLC (IY+d)*
	0xFDCB04: ld_r_rlc_xd(R_H, R_IY), // LD H,RLC (IY+d)*
	0xFDCB05: ld_r_rlc_xd(R_L, R_IY), // LD L,RLC (IY+d)*
	0xFDCB06:function () { // RLC (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		var val = this._mmu.r8(addr);
		shl8(val, val & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB07: ld_r_rlc_xd(R_A, R_IY), // LD A,RLC (IY+d)*
	0xFDCB08: ld_r_rrc_xd(R_B, R_IY), // LD B,RRC (IY+d)*
	0xFDCB09: ld_r_rrc_xd(R_C, R_IY), // LD C,RRC (IY+d)*
	0xFDCB0A: ld_r_rrc_xd(R_D, R_IY), // LD D,RRC (IY+d)*
	0xFDCB0B: ld_r_rrc_xd(R_E, R_IY), // LD E,RRC (IY+d)*
	0xFDCB0C: ld_r_rrc_xd(R_H, R_IY), // LD H,RRC (IY+d)*
	0xFDCB0D: ld_r_rrc_xd(R_L, R_IY), // LD L,RRC (IY+d)*
	0xFDCB0E:function () { // RRC (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB0F: ld_r_rrc_xd(R_A, R_IY), // LD A,RRC (IY+d)*
	0xFDCB10: ld_r_rl_xd(R_B, R_IY), // LD B,RL (IY+d)*
	0xFDCB11: ld_r_rl_xd(R_C, R_IY), // LD C,RL (IY+d)*
	0xFDCB12: ld_r_rl_xd(R_D, R_IY), // LD D,RL (IY+d)*
	0xFDCB13: ld_r_rl_xd(R_E, R_IY), // LD E,RL (IY+d)*
	0xFDCB14: ld_r_rl_xd(R_H, R_IY), // LD H,RL (IY+d)*
	0xFDCB15: ld_r_rl_xd(R_L, R_IY), // LD L,RL (IY+d)*
	0xFDCB16:function () { // RL (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		shl8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB17: ld_r_rl_xd(R_A, R_IY), // LD A,RL (IY+d)*
	0xFDCB18: ld_r_rr_xd(R_B, R_IY), // LD B,RR (IY+d)*
	0xFDCB19: ld_r_rr_xd(R_C, R_IY), // LD C,RR (IY+d)*
	0xFDCB1A: ld_r_rr_xd(R_D, R_IY), // LD D,RR (IY+d)*
	0xFDCB1B: ld_r_rr_xd(R_E, R_IY), // LD E,RR (IY+d)*
	0xFDCB1C: ld_r_rr_xd(R_H, R_IY), // LD H,RR (IY+d)*
	0xFDCB1D: ld_r_rr_xd(R_L, R_IY), // LD L,RR (IY+d)*
	0xFDCB1E:function () { // RR (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		shr8(this._mmu.r8(addr), this._s.R8[R_F] & F_C, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB1F: ld_r_rr_xd(R_A, R_IY), // LD A,RR (IY+d)*
	0xFDCB20: ld_r_sla_xd(R_B, R_IY), // LD B,SLA (IY+d)*
	0xFDCB21: ld_r_sla_xd(R_C, R_IY), // LD C,SLA (IY+d)*
	0xFDCB22: ld_r_sla_xd(R_D, R_IY), // LD D,SLA (IY+d)*
	0xFDCB23: ld_r_sla_xd(R_E, R_IY), // LD E,SLA (IY+d)*
	0xFDCB24: ld_r_sla_xd(R_H, R_IY), // LD H,SLA (IY+d)*
	0xFDCB25: ld_r_sla_xd(R_L, R_IY), // LD L,SLA (IY+d)*
	0xFDCB26:function () { // SLA (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		shl8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB27: ld_r_sla_xd(R_A, R_IY), // LD A,SLA (IY+d)*
	0xFDCB28: ld_r_sra_xd(R_B, R_IY), // LD B,SRA (IY+d)*
	0xFDCB29: ld_r_sra_xd(R_C, R_IY), // LD C,SRA (IY+d)*
	0xFDCB2A: ld_r_sra_xd(R_D, R_IY), // LD D,SRA (IY+d)*
	0xFDCB2B: ld_r_sra_xd(R_E, R_IY), // LD E,SRA (IY+d)*
	0xFDCB2C: ld_r_sra_xd(R_H, R_IY), // LD H,SRA (IY+d)*
	0xFDCB2D: ld_r_sra_xd(R_L, R_IY), // LD L,SRA (IY+d)*
	0xFDCB2E:function () { // SRA (IY+d)
		this._op_t = 23
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		var memval = this._mmu.r8(addr);
		shr8(memval, memval & 0x80, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB2F: ld_r_sra_xd(R_A, R_IY), // LD A,SRA (IY+d)*
	0xFDCB30: ld_r_sll_xd(R_B, R_IY), // LD B,SLL (IY+d)*
	0xFDCB31: ld_r_sll_xd(R_C, R_IY), // LD C,SLL (IY+d)*
	0xFDCB32: ld_r_sll_xd(R_D, R_IY), // LD D,SLL (IY+d)*
	0xFDCB33: ld_r_sll_xd(R_E, R_IY), // LD E,SLL (IY+d)*
	0xFDCB34: ld_r_sll_xd(R_H, R_IY), // LD H,SLL (IY+d)*
	0xFDCB35: ld_r_sll_xd(R_L, R_IY), // LD L,SLL (IY+d)*
	0xFDCB36:function () { // SLL (IY+d)*
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		shl8(this._mmu.r8(addr), 1, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB37: ld_r_sll_xd(R_A, R_IY), // LD A,SLL (IY+d)*
	0xFDCB38: ld_r_srl_xd(R_B, R_IY), // LD B,SRL (IY+d)*
	0xFDCB39: ld_r_srl_xd(R_C, R_IY), // LD C,SRL (IY+d)*
	0xFDCB3A: ld_r_srl_xd(R_D, R_IY), // LD D,SRL (IY+d)*
	0xFDCB3B: ld_r_srl_xd(R_E, R_IY), // LD E,SRL (IY+d)*
	0xFDCB3C: ld_r_srl_xd(R_H, R_IY), // LD H,SRL (IY+d)*
	0xFDCB3D: ld_r_srl_xd(R_L, R_IY), // LD L,SRL (IY+d)*
	0xFDCB3E:function () { // SRL (IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		shr8(this._mmu.r8(addr), 0, this._op_alures);
		this._mmu.w8(addr, this._op_alures[0]);
		this._s.R8[R_F] = this._op_alures[1];
	},
	0xFDCB3F: ld_r_srl_xd(R_A, R_IY), // LD A,SRL (IY+d)*
	0xFDCB40: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB41: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB42: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB43: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB44: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB45: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB46: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)
	0xFDCB47: bit_n_ixyd(0,R_IY), // BIT 0,(IY+d)*
	0xFDCB48: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB49: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB4A: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB4B: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB4C: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB4D: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB4E: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)
	0xFDCB4F: bit_n_ixyd(1,R_IY), // BIT 1,(IY+d)*
	0xFDCB50: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB51: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB52: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB53: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB54: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB55: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB56: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)
	0xFDCB57: bit_n_ixyd(2,R_IY), // BIT 2,(IY+d)*
	0xFDCB58: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB59: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB5A: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB5B: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB5C: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB5D: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB5E: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)
	0xFDCB5F: bit_n_ixyd(3,R_IY), // BIT 3,(IY+d)*
	0xFDCB60: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB61: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB62: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB63: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB64: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB65: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB66: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)
	0xFDCB67: bit_n_ixyd(4,R_IY), // BIT 4,(IY+d)*
	0xFDCB68: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB69: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB6A: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB6B: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB6C: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB6D: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB6E: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)
	0xFDCB6F: bit_n_ixyd(5,R_IY), // BIT 5,(IY+d)*
	0xFDCB70: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB71: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB72: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB73: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB74: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB75: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB76: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)
	0xFDCB77: bit_n_ixyd(6,R_IY), // BIT 6,(IY+d)*
	0xFDCB78: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB79: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB7A: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB7B: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB7C: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB7D: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB7E: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)
	0xFDCB7F: bit_n_ixyd(7,R_IY), // BIT 7,(IY+d)*
	0xFDCB80: ld_r_res_n_xd(R_B, 0, R_IY), // LD B,RES 0,(IY+d)*
	0xFDCB81: ld_r_res_n_xd(R_C, 0, R_IY), // LD C,RES 0,(IY+d)*
	0xFDCB82: ld_r_res_n_xd(R_D, 0, R_IY), // LD D,RES 0,(IY+d)*
	0xFDCB83: ld_r_res_n_xd(R_E, 0, R_IY), // LD E,RES 0,(IY+d)*
	0xFDCB84: ld_r_res_n_xd(R_H, 0, R_IY), // LD H,RES 0,(IY+d)*
	0xFDCB85: ld_r_res_n_xd(R_L, 0, R_IY), // LD L,RES 0,(IY+d)*
	0xFDCB86:function () { // RES 0,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x01);
	},
	0xFDCB87: ld_r_res_n_xd(R_A, 0, R_IY), // LD A,RES 0,(IY+d)*
	0xFDCB88: ld_r_res_n_xd(R_B, 1, R_IY), // LD B,RES 1,(IY+d)*
	0xFDCB89: ld_r_res_n_xd(R_C, 1, R_IY), // LD C,RES 1,(IY+d)*
	0xFDCB8A: ld_r_res_n_xd(R_D, 1, R_IY), // LD D,RES 1,(IY+d)*
	0xFDCB8B: ld_r_res_n_xd(R_E, 1, R_IY), // LD E,RES 1,(IY+d)*
	0xFDCB8C: ld_r_res_n_xd(R_H, 1, R_IY), // LD H,RES 1,(IY+d)*
	0xFDCB8D: ld_r_res_n_xd(R_L, 1, R_IY), // LD L,RES 1,(IY+d)*
	0xFDCB8E:function () { // RES 1,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x02);
	},
	0xFDCB8F: ld_r_res_n_xd(R_A, 1, R_IY), // LD A,RES 1,(IY+d)*
	0xFDCB90: ld_r_res_n_xd(R_B, 2, R_IY), // LD B,RES 2,(IY+d)*
	0xFDCB91: ld_r_res_n_xd(R_C, 2, R_IY), // LD C,RES 2,(IY+d)*
	0xFDCB92: ld_r_res_n_xd(R_D, 2, R_IY), // LD D,RES 2,(IY+d)*
	0xFDCB93: ld_r_res_n_xd(R_E, 2, R_IY), // LD E,RES 2,(IY+d)*
	0xFDCB94: ld_r_res_n_xd(R_H, 2, R_IY), // LD H,RES 2,(IY+d)*
	0xFDCB95: ld_r_res_n_xd(R_L, 2, R_IY), // LD L,RES 2,(IY+d)*
	0xFDCB96:function () { // RES 2,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x04);
	},
	0xFDCB97: ld_r_res_n_xd(R_A, 2, R_IY), // LD A,RES 2,(IY+d)*
	0xFDCB98: ld_r_res_n_xd(R_B, 3, R_IY), // LD B,RES 3,(IY+d)*
	0xFDCB99: ld_r_res_n_xd(R_C, 3, R_IY), // LD C,RES 3,(IY+d)*
	0xFDCB9A: ld_r_res_n_xd(R_D, 3, R_IY), // LD D,RES 3,(IY+d)*
	0xFDCB9B: ld_r_res_n_xd(R_E, 3, R_IY), // LD E,RES 3,(IY+d)*
	0xFDCB9C: ld_r_res_n_xd(R_H, 3, R_IY), // LD H,RES 3,(IY+d)*
	0xFDCB9D: ld_r_res_n_xd(R_L, 3, R_IY), // LD L,RES 3,(IY+d)*
	0xFDCB9E:function () { // RES 3,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x08);
	},
	0xFDCB9F: ld_r_res_n_xd(R_A, 3, R_IY), // LD A,RES 3,(IY+d)*
	0xFDCBA0: ld_r_res_n_xd(R_B, 4, R_IY), // LD B,RES 4,(IY+d)*
	0xFDCBA1: ld_r_res_n_xd(R_C, 4, R_IY), // LD C,RES 4,(IY+d)*
	0xFDCBA2: ld_r_res_n_xd(R_D, 4, R_IY), // LD D,RES 4,(IY+d)*
	0xFDCBA3: ld_r_res_n_xd(R_E, 4, R_IY), // LD E,RES 4,(IY+d)*
	0xFDCBA4: ld_r_res_n_xd(R_H, 4, R_IY), // LD H,RES 4,(IY+d)*
	0xFDCBA5: ld_r_res_n_xd(R_L, 4, R_IY), // LD L,RES 4,(IY+d)*
	0xFDCBA6:function () { // RES 4,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x10);
	},
	0xFDCBA7: ld_r_res_n_xd(R_A, 4, R_IY), // LD A,RES 4,(IY+d)*
	0xFDCBA8: ld_r_res_n_xd(R_B, 5, R_IY), // LD B,RES 5,(IY+d)*
	0xFDCBA9: ld_r_res_n_xd(R_C, 5, R_IY), // LD C,RES 5,(IY+d)*
	0xFDCBAA: ld_r_res_n_xd(R_D, 5, R_IY), // LD D,RES 5,(IY+d)*
	0xFDCBAB: ld_r_res_n_xd(R_E, 5, R_IY), // LD E,RES 5,(IY+d)*
	0xFDCBAC: ld_r_res_n_xd(R_H, 5, R_IY), // LD H,RES 5,(IY+d)*
	0xFDCBAD: ld_r_res_n_xd(R_L, 5, R_IY), // LD L,RES 5,(IY+d)*
	0xFDCBAE:function () { // RES 5,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x20);
	},
	0xFDCBAF: ld_r_res_n_xd(R_A, 5, R_IY), // LD A,RES 5,(IY+d)*
	0xFDCBB0: ld_r_res_n_xd(R_B, 6, R_IY), // LD B,RES 6,(IY+d)*
	0xFDCBB1: ld_r_res_n_xd(R_C, 6, R_IY), // LD C,RES 6,(IY+d)*
	0xFDCBB2: ld_r_res_n_xd(R_D, 6, R_IY), // LD D,RES 6,(IY+d)*
	0xFDCBB3: ld_r_res_n_xd(R_E, 6, R_IY), // LD E,RES 6,(IY+d)*
	0xFDCBB4: ld_r_res_n_xd(R_H, 6, R_IY), // LD H,RES 6,(IY+d)*
	0xFDCBB5: ld_r_res_n_xd(R_L, 6, R_IY), // LD L,RES 6,(IY+d)*
	0xFDCBB6:function () { // RES 6,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x40);
	},
	0xFDCBB7: ld_r_res_n_xd(R_A, 6, R_IY), // LD A,RES 6,(IY+d)*
	0xFDCBB8: ld_r_res_n_xd(R_B, 7, R_IY), // LD B,RES 7,(IY+d)*
	0xFDCBB9: ld_r_res_n_xd(R_C, 7, R_IY), // LD C,RES 7,(IY+d)*
	0xFDCBBA: ld_r_res_n_xd(R_D, 7, R_IY), // LD D,RES 7,(IY+d)*
	0xFDCBBB: ld_r_res_n_xd(R_E, 7, R_IY), // LD E,RES 7,(IY+d)*
	0xFDCBBC: ld_r_res_n_xd(R_H, 7, R_IY), // LD H,RES 7,(IY+d)*
	0xFDCBBD: ld_r_res_n_xd(R_L, 7, R_IY), // LD L,RES 7,(IY+d)*
	0xFDCBBE:function () { // RES 7,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) & ~0x80);
	},
	0xFDCBBF: ld_r_res_n_xd(R_A, 7, R_IY), // LD A,RES 7,(IY+d)*
	0xFDCBC0: ld_r_set_n_xd(R_B, 0, R_IY), // LD B,SET 0,(IY+d)*
	0xFDCBC1: ld_r_set_n_xd(R_C, 0, R_IY), // LD C,SET 0,(IY+d)*
	0xFDCBC2: ld_r_set_n_xd(R_D, 0, R_IY), // LD D,SET 0,(IY+d)*
	0xFDCBC3: ld_r_set_n_xd(R_E, 0, R_IY), // LD E,SET 0,(IY+d)*
	0xFDCBC4: ld_r_set_n_xd(R_H, 0, R_IY), // LD H,SET 0,(IY+d)*
	0xFDCBC5: ld_r_set_n_xd(R_L, 0, R_IY), // LD L,SET 0,(IY+d)*
	0xFDCBC6:function () { // SET 0,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x01);
	},
	0xFDCBC7: ld_r_set_n_xd(R_A, 0, R_IY), // LD A,SET 0,(IY+d)*
	0xFDCBC8: ld_r_set_n_xd(R_B, 1, R_IY), // LD B,SET 1,(IY+d)*
	0xFDCBC9: ld_r_set_n_xd(R_C, 1, R_IY), // LD C,SET 1,(IY+d)*
	0xFDCBCA: ld_r_set_n_xd(R_D, 1, R_IY), // LD D,SET 1,(IY+d)*
	0xFDCBCB: ld_r_set_n_xd(R_E, 1, R_IY), // LD E,SET 1,(IY+d)*
	0xFDCBCC: ld_r_set_n_xd(R_H, 1, R_IY), // LD H,SET 1,(IY+d)*
	0xFDCBCD: ld_r_set_n_xd(R_L, 1, R_IY), // LD L,SET 1,(IY+d)*
	0xFDCBCE:function () { // SET 1,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x02);
	},
	0xFDCBCF: ld_r_set_n_xd(R_A, 1, R_IY), // LD A,SET 1,(IY+d)*
	0xFDCBD0: ld_r_set_n_xd(R_B, 2, R_IY), // LD B,SET 2,(IY+d)*
	0xFDCBD1: ld_r_set_n_xd(R_C, 2, R_IY), // LD C,SET 2,(IY+d)*
	0xFDCBD2: ld_r_set_n_xd(R_D, 2, R_IY), // LD D,SET 2,(IY+d)*
	0xFDCBD3: ld_r_set_n_xd(R_E, 2, R_IY), // LD E,SET 2,(IY+d)*
	0xFDCBD4: ld_r_set_n_xd(R_H, 2, R_IY), // LD H,SET 2,(IY+d)*
	0xFDCBD5: ld_r_set_n_xd(R_L, 2, R_IY), // LD L,SET 2,(IY+d)*
	0xFDCBD6:function () { // SET 2,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x04);
	},
	0xFDCBD7: ld_r_set_n_xd(R_A, 2, R_IY), // LD A,SET 2,(IY+d)*
	0xFDCBD8: ld_r_set_n_xd(R_B, 3, R_IY), // LD B,SET 3,(IY+d)*
	0xFDCBD9: ld_r_set_n_xd(R_C, 3, R_IY), // LD C,SET 3,(IY+d)*
	0xFDCBDA: ld_r_set_n_xd(R_D, 3, R_IY), // LD D,SET 3,(IY+d)*
	0xFDCBDB: ld_r_set_n_xd(R_E, 3, R_IY), // LD E,SET 3,(IY+d)*
	0xFDCBDC: ld_r_set_n_xd(R_H, 3, R_IY), // LD H,SET 3,(IY+d)*
	0xFDCBDD: ld_r_set_n_xd(R_L, 3, R_IY), // LD L,SET 3,(IY+d)*
	0xFDCBDE:function () { // SET 3,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x08);
	},
	0xFDCBDF: ld_r_set_n_xd(R_A, 3, R_IY), // LD A,SET 3,(IY+d)*
	0xFDCBE0: ld_r_set_n_xd(R_B, 4, R_IY), // LD B,SET 4,(IY+d)*
	0xFDCBE1: ld_r_set_n_xd(R_C, 4, R_IY), // LD C,SET 4,(IY+d)*
	0xFDCBE2: ld_r_set_n_xd(R_D, 4, R_IY), // LD D,SET 4,(IY+d)*
	0xFDCBE3: ld_r_set_n_xd(R_E, 4, R_IY), // LD E,SET 4,(IY+d)*
	0xFDCBE4: ld_r_set_n_xd(R_H, 4, R_IY), // LD H,SET 4,(IY+d)*
	0xFDCBE5: ld_r_set_n_xd(R_L, 4, R_IY), // LD L,SET 4,(IY+d)*
	0xFDCBE6:function () { // SET 4,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x10);
	},
	0xFDCBE7: ld_r_set_n_xd(R_A, 4, R_IY), // LD A,SET 4,(IY+d)*
	0xFDCBE8: ld_r_set_n_xd(R_B, 5, R_IY), // LD B,SET 5,(IY+d)*
	0xFDCBE9: ld_r_set_n_xd(R_C, 5, R_IY), // LD C,SET 5,(IY+d)*
	0xFDCBEA: ld_r_set_n_xd(R_D, 5, R_IY), // LD D,SET 5,(IY+d)*
	0xFDCBEB: ld_r_set_n_xd(R_E, 5, R_IY), // LD E,SET 5,(IY+d)*
	0xFDCBEC: ld_r_set_n_xd(R_H, 5, R_IY), // LD H,SET 5,(IY+d)*
	0xFDCBED: ld_r_set_n_xd(R_L, 5, R_IY), // LD L,SET 5,(IY+d)*
	0xFDCBEE:function () { // SET 5,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x20);
	},
	0xFDCBEF: ld_r_set_n_xd(R_A, 5, R_IY), // LD A,SET 5,(IY+d)*
	0xFDCBF0: ld_r_set_n_xd(R_B, 6, R_IY), // LD B,SET 6,(IY+d)*
	0xFDCBF1: ld_r_set_n_xd(R_C, 6, R_IY), // LD C,SET 6,(IY+d)*
	0xFDCBF2: ld_r_set_n_xd(R_D, 6, R_IY), // LD D,SET 6,(IY+d)*
	0xFDCBF3: ld_r_set_n_xd(R_E, 6, R_IY), // LD E,SET 6,(IY+d)*
	0xFDCBF4: ld_r_set_n_xd(R_H, 6, R_IY), // LD H,SET 6,(IY+d)*
	0xFDCBF5: ld_r_set_n_xd(R_L, 6, R_IY), // LD L,SET 6,(IY+d)*
	0xFDCBF6:function () { // SET 6,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x40);
	},
	0xFDCBF7: ld_r_set_n_xd(R_A, 6, R_IY), // LD A,SET 6,(IY+d)*
	0xFDCBF8: ld_r_set_n_xd(R_B, 7, R_IY), // LD B,SET 7,(IY+d)*
	0xFDCBF9: ld_r_set_n_xd(R_C, 7, R_IY), // LD C,SET 7,(IY+d)*
	0xFDCBFA: ld_r_set_n_xd(R_D, 7, R_IY), // LD D,SET 7,(IY+d)*
	0xFDCBFB: ld_r_set_n_xd(R_E, 7, R_IY), // LD E,SET 7,(IY+d)*
	0xFDCBFC: ld_r_set_n_xd(R_H, 7, R_IY), // LD H,SET 7,(IY+d)*
	0xFDCBFD: ld_r_set_n_xd(R_L, 7, R_IY), // LD L,SET 7,(IY+d)*
	0xFDCBFE:function () { // SET 7,(IY+d)
		this._op_t = 23;
		this._op_m = 4;
		var addr = this._s.R16[R_IY]+this._op_displ;
		this._mmu.w8(addr, this._mmu.r8(addr) | 0x80);
	},
	0xFDCBFF: ld_r_set_n_xd(R_A, 7, R_IY), // LD A,SET 7,(IY+d)*
	0xFDE1:function () { // POP IY
		this._op_t = 14;
		this._op_m = 2;
		this._s.R16[R_IY] = this.pop16();
	},
	0xFDE3:function () { // EX (SP),IY
		this._op_t = 23;
		this._op_m = 2;
		var addr = this._s.R16[R_SP];
		var memval = this._mmu.r16(addr);
		this._mmu.w16reverse(addr, this._s.R16[R_IY]);
		this._s.R16[R_IY] = memval;
	},
	0xFDE5:function () { // PUSH IY
		this._op_t = 15;
		this._op_m = 2;
		this.push16(this._s.R16[R_IY]);
	},
	0xFDE9:function () { // JP (IY)
		this._op_t = 8;
		this._op_m = 0;
		this._s.R16[R_PC] = this._s.R16[R_IY];
	},
	0xFDF9:function () { // LD SP,IY
		this._op_t = 10;
		this._op_m = 2;
		this._s.R16[R_SP] = this._s.R16[R_IY];
	},
	0xFE:function () { // CP n
		this._op_t = 7;
		this._op_m = 2;
		this._op_n = this._mmu.r8(this._s.R16[R_PC]+1);
		sub8(this._s.R8[R_A], this._op_n, 0, this._op_alures);
		this._s.R8[R_F] = (this._op_alures[1] & ~(F_5|F_3)) | (this._op_n & (F_5|F_3));
	},
	0xFF:function () { // RST 38H
		this._op_t = 11;
		this._op_m = 0;
		this.push16(this._s.R16[R_PC]+1);
		this._s.R16[R_PC] = 0x38;
	}
};

Z80.prototype.step = function (runFor) {
	var actRuntime = 0;
	while (runFor >= 0) {
		var pc = this._s.R16[R_PC];
		var btpc = this._s.R16[R_PC];
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
			} while (opcodeb2 == 0xDD || opcodeb2 == 0xFD);
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
		else if (opcode == 0xED || opcode == 0xCB) {
			opcode = (opcode << 8) | this._mmu.r8(pc + 1);
			rAdd += 2;
		}
		// single byte op
		else {
			rAdd += 1;
		}
		this._s.R8[R_R] = (this._s.R8[R_R] & 0x80) | ((this._s.R8[R_R] + rAdd) & 0x7F);
		var f = this._opcodes[opcode];
		if (!f) {
			if (isFDorDD) {
				f = this._opcodes[opcode & 0xFF];
				pc += 1;
				this._s.R16[R_PC] = pc;
				tAdd += 4;
			}
		}
		if (!f) {
			//console.log(this._mmu.dasm(pc, 5, "??? ").join("\n"));
			throw ("not implemented:" + Utils.toHex8(opcode));
		}
		//this.logasm();
		f.call(this);
		if (this._btmaxlen) {
			this.bt.push([btpc, opcode, this._op_n, this._op_nn, this._op_e, this._op_displ]);
			if (this.bt.length > this._btmaxlen) this.bt.shift();
		}
		if (this._logdasm) {
			var o = [btpc, opcode, this._op_n, this._op_nn, this._op_e, this._op_displ];
			var strinn = Utils.toHex16(o[0]) + " " + Dasm.Dasm(o)[0] + "\n";
			this._dasmtxt += strinn;
		}
		if (this._op_t === 0) {
			throw ("you forgot something!");
		}
		if (this._op_m && !this._s.halted) {
			this._s.R16[R_PC] = pc + this._op_m;
		}
		var instrTime = this._op_t + tAdd;
		runFor -= instrTime;
		actRuntime += instrTime;
	}
	return actRuntime;
};

Z80.prototype.irqEnabled = function() {
	return this._s.IFF1;
}
Z80.prototype.irq = function() {
	var res = 0;
	if (this._s.IFF1) {
		if (this._s.im == 1) {
			this._s.IFF1 = 0;
			this._s.IFF2 = 0;
			this.push16(this._s.R16[R_PC]);
			this._s.R16[R_PC] = 0x0038;
			res = 11 + 2; // rst 38 + 2 wait states
		}
		else {
			throw("not implemented im mode:", this._s.im);
		}
	}
	return res;
}

Z80.prototype.reset = function () {
	this._s.reset();
	this.bt = [];
};

Z80.prototype.btToString = function(limit) {
	var self = this;
	var arr = [];
	var i = 0;
	if (limit) {
		i = this.bt.length - limit;
		if (i < 0) i = 0;
	}
	for(; i<this.bt.length; i++) {
		var o = this.bt[i];
		arr.push(Utils.toHex16(o[0]) + " " + Dasm.Dasm(o)[0]);
	}
	var r = function(addr) {
		return self._mmu.r8(addr);
	}
	arr.push(Utils.toHex16(this._s.R16[R_PC]) + " " + Dasm.Dasm([r, this._s.R16[R_PC]])[0]);
	return arr;
};

var strToReg = {
	"PC" : R_PC,
	"SP" : R_SP,
	"IR" : R_IR,
	"AF" : R_AF,
	"BC" : R_BC,
	"DE" : R_DE,
	"HL" : R_HL,
	"IX" : R_IX,
	"IY" : R_IY,
	"AFa" : R_AFa,
	"BCa" : R_BCa,
	"DEa" : R_DEa,
	"HLa" : R_HLa,
	"I" : R_IR * 2 + 1,
	"R" : R_IR * 2 + 0,
	"A" : R_AF * 2 + 1,
	"F" : R_AF * 2 + 0,
	"B" : R_BC * 2 + 1,
	"C" : R_BC * 2 + 0,
	"D" : R_DE * 2 + 1,
	"E" : R_DE * 2 + 0,
	"H" : R_HL * 2 + 1,
	"L" : R_HL * 2 + 0,
	"Xh" : R_IX * 2 + 1,
	"Xl" : R_IX * 2 + 0,
	"Yh" : R_IY * 2 + 1,
	"Yl" : R_IY * 2 + 0,
	"Aa" : R_AFa * 2 + 1,
	"Fa" : R_AFa * 2 + 0,
	"Ba" : R_BCa * 2 + 1,
	"Ca" : R_BCa * 2 + 0,
	"Da" : R_DEa * 2 + 1,
	"Ea" : R_DEa * 2 + 0,
	"Ha" : R_HLa * 2 + 1,
	"La" : R_HLa * 2 + 0
};

function is16BitReg(reg) {
	if (reg.length == 1)
		return false;
	if ((reg.length == 2) && ("alh".indexOf(reg.charAt(1)) != -1))
		return false;
	return true;
}

Z80.prototype.setRegVal = function (reg, val) {
	if (reg == "IFFI1")
		this._s.IFF1 = val;
	else if (reg == "IFFI2")
		this._s.IFF2 = val;
	else if (reg == "im")
		this._s.im = val;
	else if (reg == "halted")
		this._s.halted = val;
	else if (is16BitReg(reg))
		this._s.R16[strToReg[reg]] = val;
	else
		this._s.R8[strToReg[reg]] = val;
}

Z80.prototype.getRegVal = function (reg) {
	if (reg == "IFFI1")
		return this._s.IFF1;
	if (reg == "IFFI2")
		return this._s.IFF2;
	if (reg == "im")
		return this._s.im;
	if (reg == "halted")
		return this._s.halted;
	if (is16BitReg(reg))
		return this._s.R16[strToReg[reg]];
	return this._s.R8[strToReg[reg]];
}

module.exports = Z80;

},{"./dasm.js":3,"./utils.js":9}]},{},[1])(1)
});
