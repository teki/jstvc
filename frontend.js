import { Utils, LocalSetting } from "./scripts/utils.js";
import { TVC } from "./scripts/tvc.js";

const SettingDebuggerMemWatch = new LocalSetting("tvc~dbgmemwatch", []);

let app = undefined;
let g = {
	canvas: undefined, /* canvas dom object */
	tvc: undefined, /* TVC object */
	fb: undefined, /* frame buffer object */
	animPrevFrame: 0,
	screenFps: 0,
	memWatch: SettingDebuggerMemWatch.get(),
	dbgUpdateTime: 0,
};

const emuConfigs = [
	"64k+ 1.2, VT-DOS",
	"64k+ 1.2, VT-DOS (fastboot)",
	"64k+ 2.2, VT-DOS",
	"64k  1.2",
	"64k+ 1.2",
	"64k+ 2.2"
];
const SettingDefaultEmuType = new LocalSetting("tvc~defmachtype", emuConfigs[0]);
const SettingShowDebugger = new LocalSetting("tvc~showdebugger", false);

let appData = {
	statusTxt: '',
	fpsTxt: '',
	disks: gamelist,
	selectedDisk: '',
	emuDefs: emuConfigs,
	emuSelected: SettingDefaultEmuType.get(),
	isRunning: true, /* run the emu in the animation callback */
	showDlg: '',
	showDbg: SettingShowDebugger.get(),
	dbgRegs: '',
	dbgMemInput: '',
	dbgMemWatchOut: '',
};

let appDataWatch = {
	selectedDisk: function (newDisk, oldDisk) {
		this.loadDiskByNameAndPlay(newDisk);
	},
	emuSelected: function (newEmu, oldEmu) {
		SettingDefaultEmuType.set(newEmu);
		this.emuCreate(newEmu);
	},
	showDbg: (showDebugger) => {
		SettingShowDebugger.set(showDebugger);
		console.log(showDebugger);
	},
};

let tvcInfoCallback = function (e) {
	let res = undefined;
	switch (e.id) {
		case "fb":
			res = g.fb;
			break;
		case "notify":
			app.setStatusTxt(e.str);
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

let appMethods = {
	emuBreak: function () {
		this.isRunning = false;
	},

	emuReset: function () {
		g.tvc.reset();
	},

	emuCreate: async function (type) {
		this.setStatusTxt("creating emu: " + type + ", loading roms...");
		this.isRunning = false;
		g.tvc = new TVC(type, tvcInfoCallback);
		var roms;
		if (/2\.2/.test(type)) {
			roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
		}
		else {
			roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
		}
		if (/DOS/.test(type)) roms.push("D_TVCDOS.128");
		let fastboot = /fastboot/.test(type);
		// load roms
		for (const romName of roms) {
			let resp = await fetch("roms/" + romName);
			let romData = new Uint8Array(await resp.arrayBuffer());
			let isPatched = false;
			if (fastboot && romName == "TVC12_D4.64K") {
				//TODO: do thsi with asm()
				/* fastboot patch
				C34A E5 5D 54 <- original
				0E 00  LD C,0	// disable memtest
				06 40  LD B,40
				09     ADD HL,BC
				AF     XOR A
				C9     RET
				*/
				let addr = 0x34a;
				romData[addr] = 0x0e; addr++;
				romData[addr] = 0x00; addr++;
				romData[addr] = 0x06; addr++;
				romData[addr] = 0x40; addr++;
				romData[addr] = 0x09; addr++;
				romData[addr] = 0xaf; addr++;
				romData[addr] = 0xc9; addr++;
				/*
				DA19 11 15 DC <- original
				18 5C JR DA77  // disable tvc logo
				*/
				addr = 0x1a19;
				romData[addr] = 0x18; addr++;
				romData[addr] = 0x5c; addr++;
				isPatched = true;
			}
			g.tvc.addRom(romName, romData, isPatched);
		}
		// start
		this.isRunning = true;
		this.emuContinue();
		//this.loadDiskByName(this.disks[0]);
		this.setStatusTxt(type + " started");
	},

	refreshGui: function () {
		g.fb.imageData.data.set(g.fb.buf8);
		this.ctx.putImageData(g.fb.imageData, 0, 0);
		g.fb.updatecnt++;
		let timenow = performance.now();
		if ((timenow - g.fb.prevUpdateTime) > 1000) {
			g.fb.prevUpdateTime = timenow;

			g.fb.updates.push([g.fb.updatecnt, timenow]);
			if (g.fb.updates.length > 5) g.fb.updates.shift();


			var lastUpdateIdx = g.fb.updates.length - 1;
			var cntdiff = g.fb.updates[lastUpdateIdx][0] - g.fb.updates[0][0];
			var timediff = g.fb.updates[lastUpdateIdx][1] - g.fb.updates[0][1];

			g.fb.fpsv = ~~(cntdiff / (timediff / 1000));
			//console.log(g.fb.updates,g.fb.fpsv);
			this.fpsTxt = " [" + g.fb.fpsv.toString(10) + "/" + g.screenFps + " fps]";
		}
	},

	loadDiskByName: async function (name) {
		this.setStatusTxt("loading " + name);
		let resp = await fetch("games/" + name);
		g.tvc.loadImg(name, new Uint8Array(await resp.arrayBuffer()));
		this.$refs.monitor.focus();
		this.setStatusTxt("loaded " + name);
	},

	loadDiskByNameAndPlay: async function (name) {
		this.setStatusTxt("loading " + name);
		if (!this.emuSelected.includes('fastboot')) {
			let fastBootEmu = this.emuDefs.find(e => e.includes('fastboot'));
			SettingDefaultEmuType.set(fastBootEmu);
			await this.emuCreate(fastBootEmu);
		}
		let resp = await fetch("games/" + name);
		g.tvc.loadImg(name, new Uint8Array(await resp.arrayBuffer()));
		this.$refs.monitor.focus();
		this.setStatusTxt("loaded " + name);
		this.showDialog('');
		this.emuTypeString([
			[108, 76, 0],
			[111, 79, 0],
			[97, 65, 0],
			[100, 68, 0],
			[34, 222, 16],
			[42, 56, 16],
			[34, 222, 16],
			[0, 13, 0],
		], 700);
	},

	emuTypeString: function (str, delay) {
		const intDelay = 50;
		for (let c of str) {
			if (c[2]) {
				setTimeout(() => g.tvc.keyDown(c[2]), delay);
				delay += intDelay;
			}
			setTimeout(() => g.tvc.keyDown(c[1]), delay);
			delay += intDelay;
			if (c[0]) {
				setTimeout(() => g.tvc.keyPress(c[0]), delay);
				delay += intDelay;
			}
			setTimeout(() => g.tvc.keyUp(c[1]), delay);
			delay += intDelay;
			if (c[2]) {
				setTimeout(() => g.tvc.keyUp(c[2]), delay);
				delay += intDelay;
			}
		}
	},

	emuInit: function () {
		this.setStatusTxt("init page");
		/* init */
		// frame buffer
		g.canvas = this.$refs.tvcanvas;
		this.ctx = g.canvas.getContext("2d");
		g.fb = {};
		g.fb.prevUpdateTime = performance.now();
		g.fb.updatecnt = 0;
		g.fb.updates = [];
		g.fb.skipcnt = 0;
		g.fb.fpsv = 0;
		g.fb.width = g.canvas.width;
		g.fb.height = g.canvas.height;
		g.fb.imageData = this.ctx.createImageData(g.fb.width, g.fb.height);
		g.fb.buf = new ArrayBuffer(g.fb.imageData.data.length);
		g.fb.buf8 = new Uint8ClampedArray(g.fb.buf);
		g.fb.buf32 = new Uint32Array(g.fb.buf);
		g.fb.refresh = function () { app.refreshGui(); };
		let defaultType = SettingDefaultEmuType.get();
		this.emuCreate(defaultType);
		// gui
		/* TODO
		$("#bpoints").change(function (e) {
			var newbplst = [];
			var bplst = $("#bpoints")[0].value.split(",");
			g.tvc.setBreakPoints(bplst);
			$("#step").focus();
		});
		// img loading + selection
		var i;
		var imgdrop = $("#slocal");
		$("#loadlocal").on("click", function () {
			var imgname = imgdrop[0].value;
			Utils.dbLoadDisk(imgname, function (name, data) {
				g.tvc.loadImg(name, new Uint8Array(data));
				$("#monitor").focus();
				this.statusTxt = "loaded", name + "\nTip: run + [enter]";
			});
		});
		Utils.dbInit(function () {
			Utils.dbListDisks(function (name, data) {
				if (data) {
					$("<option>").text(name).val(name).appendTo(imgdrop);
				}
			});
		});
		*/
		// keyboard
		document.addEventListener("keydown", function (e) { app.handleKeyDown(e); });
		document.addEventListener("keyup", function (e) { app.handleKeyUp(e); });
		document.addEventListener("keypress", function (e) { app.handleKeyPress(e); });
		// focus on canvas
		window.addEventListener("focus", function (e) { app.handleFocus(e); });
		window.addEventListener("blur", function (e) { app.handleFocusLost(e); });
	},
	// event handlers
	handleKeyPress: function (e) {
		if (g.tvc && this.isRunning) {
			g.tvc.keyPress(e.which);
			e.preventDefault();
		}
	},
	handleKeyDown: function (e) {
		if (g.tvc && this.isRunning) {
			if (g.tvc.keyDown(e.which))
				e.preventDefault();
		}
	},
	handleKeyUp: function (e) {
		if (g.tvc && this.isRunning) {
			g.tvc.keyUp(e.which);
		}
	},
	handleFocus: function (e) {
		if (g.tvc && this.isRunning)
			g.tvc.focusChange(true);
	},
	handleFocusLost: function (e) {
		if (g.tvc && this.isRunning)
			g.tvc.focusChange(false);
	},
	handleMonitorClicked: function (e) {
		this.showDialog('');
		this.$refs.monitor.focus();
	},
	// emulator functions
	emuContinue: function () {
		window.requestAnimationFrame(function () { app.emuRunFrame(); });
	},

	emuRunFrame: function () {
		let now = performance.now();
		if (g.animPrevFrame > 0) {
			let timeDiff = now - g.animPrevFrame;
			if (timeDiff <= 18 && timeDiff >= 14) g.screenFps = 60;
			else if (timeDiff <= 35 && timeDiff >= 31) g.screenFps = 30;
			else if (timeDiff <= 9 && timeDiff >= 5) g.screenFps = 144;
			else g.screenFps = Math.floor(1 / timeDiff);
		}
		g.animPrevFrame = now;
		var skipRun;
		if (this.isRunning) {
			skipRun = false;
			g.fb.skipcnt++;
			//TODO: this is hard coded for 60fps
			if (g.fb.skipcnt == 6) {
				skipRun = g.fb.fpsv > 49;
				g.fb.skipcnt = 0;
			}
			if (!skipRun) {
				//var t1 = performance.now()
				if (g.tvc.runForAFrame())
					this.emuBreak();
				//var t2 = performance.now();
				//var tdiff = t2 - t1;
				//console.log("runduration: " + tdiff);
			}
			if (this.isRunning)
				this.emuContinue();
		}
		if (this.showDbg) {
			if (now - g.dbgUpdateTime > 300) {
				g.dbgUpdateTime = now;
				this.dbgRefreshDbgInfo();
			}
		}
	},
	emuToggleRun: function () {
		this.isRunning = !this.isRunning;
		if (this.isRunning) {
			this.setStatusTxt("running");
			this.emuContinue();
		}
		else {
			this.setStatusTxt("stopped");
		}
	},
	showDialog: function (dlgName) {
		if (this.showDlg == dlgName) {
			this.showDlg = '';
		}
		else {
			this.showDlg = dlgName;
		}
	},
	setStatusTxt: function (msg) {
		this.statusTxt = msg;
		console.log(msg);
	},
	dbgStop: function () {
		if (this.isRunning) {
			this.emuToggleRun();
			this.dbgRefreshDbgInfo();
		}
	},
	dbgCont: function () {
		if (!this.isRunning) {
			this.emuToggleRun();
			this.dbgRefreshDbgInfo();
		}
	},
	dbgStep: function () {
		if (!this.isRunning) {
			g.tvc.dstep(true, false);
			this.dbgRefreshDbgInfo();
		}
	},
	dbgRefreshDbgInfo: function () {
		let regs = g.tvc.dregGet();
		this.dbgRegs = regs.join("\n");
		let memInfo = [];
		for (const m of g.memWatch) {
			memInfo = memInfo.concat(g.tvc.dmemGet(m));
		}
		this.dbgMemWatchOut = memInfo;
	},
	dbgMemWatch: function () {
		if (!this.dbgMemInput)
			return;
		// normalize address, accepts registers too
		let addr = Utils.toHex16(g.tvc.resolveAddr(this.dbgMemInput));
		if (!g.memWatch.includes(addr)) {
			g.memWatch.push(addr);
			g.memWatch.sort();
			SettingDebuggerMemWatch.set(g.memWatch);
			this.dbgRefreshDbgInfo();
		}
	},
	dbgMemWatchDel: function (m) {
		let addr = Utils.toHex16(g.tvc.resolveAddr(m.split(" ", 1)[0]));
		console.log(addr);
		g.memWatch = g.memWatch.filter(e => e != addr);
		SettingDebuggerMemWatch.set(g.memWatch);
		this.dbgRefreshDbgInfo();
	},
	dbgMemBreak: function () {

	},
};

export function appStart() {
	app = new Vue({
		el: '#app',
		data: appData,
		watch: appDataWatch,
		methods: appMethods,
		computed: {
			statusMsg: function () {
				let msg = this.statusTxt;
				if (this.isRunning) {
					msg += this.fpsTxt;
				}
				return msg;
			}
		}
	});
	Utils.dbInit();
	app.emuInit();
}
