import { Utils } from "./scripts/utils.js";
import { TVC } from "./scripts/tvc.js";

let app = undefined;
let g = {
	canvas: undefined, /* canvas dom object */
	tvc: undefined, /* TVC object */
	fb: undefined, /* frame buffer object */
};

let appData = {
	statusTxt: '',
	disks: gamelist,
	selectedDisk: '',
	emuDefs: [
		"64k+ 1.2, VT-DOS",
		"64k+ 2.2, VT-DOS",
		"64k  1.2",
		"64k+ 1.2",
		"64k+ 2.2"
	],
	emuSelected: '',
	isRunning: true, /* run the emu in the animation callback */
};
appData.emuSelected = appData.emuDefs[0];

let appDataWatch = {
	selectedDisk: function (newDisk, oldDisk) {
		this.loadDiskByName(newDisk);
	},
	emuSelected: function (newEmu, oldEmu) {
		Utils.saveLocal("tvc~defmachtype", newEmu);
		this.emuCreate(newEmu);
	},
};

let tvcInfoCallback = function (e) {
	let res = undefined;
	switch (e.id) {
		case "fb":
			res = g.fb;
			break;
		case "notify":
			app.statusTxt = e.str;
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
		this.statusTxt = "loading roms";
		this.isRunning = false;
		g.tvc = new TVC(type, tvcInfoCallback);
		var roms;
		if (/2\.2/.test(type)) roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
		else roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
		if (/DOS/.test(type)) roms.push("D_TVCDOS.128");
		// load roms
		for (const romName of roms) {
			let resp = await fetch("roms/" + romName);
			g.tvc.addRom(romName, new Uint8Array(await resp.arrayBuffer()));
		}
		// start
		this.isRunning = true;
		this.emuContinue();
		this.loadDiskByName(this.disks[0]);
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
			this.statusTxt = "running " + g.fb.fpsv.toString(10) + "fps";
		}
	},

	loadDiskByName: async function (name) {
		let resp = await fetch("games/" + name);
		g.tvc.loadImg(name, new Uint8Array(await resp.arrayBuffer()));
		this.$refs.monitor.focus();
		this.statusTxt = "loaded", name;
	},

	emuInit: function () {
		this.statusTxt = "init page";
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
		let defaultType = Utils.loadLocal("tvc~defmachtype", this.emuDefs[0]);
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
		if (g.tvc) {
			g.tvc.keyPress(e.which);
			e.preventDefault();
		}
	},
	handleKeyDown: function (e) {
		if (g.tvc) {
			if (g.tvc.keyDown(e.which))
				e.preventDefault();
		}
	},
	handleKeyUp: function (e) {
		if (g.tvc) {
			g.tvc.keyUp(e.which);
		}
	},
	handleFocus: function (e) {
		if (g.tvc)
			g.tvc.focusChange(true);
	},
	handleFocusLost: function (e) {
		if (g.tvc)
			g.tvc.focusChange(false);
	},
	// emulator functions
	emuContinue: function () {
		window.requestAnimationFrame(function () { app.emuRunFrame(); });
	},

	emuRunFrame: function () {
		var skipRun;
		if (this.isRunning) {
			skipRun = false;
			g.fb.skipcnt++;
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
	},
	emuToggleRun: function () {
		this.isRunning = !this.isRunning;
		if (this.isRunning) {
			this.emuContinue();
		}
		else {
			this.statusTxt = "stopped";
		}
	}
};

export function appStart() {
	app = new Vue({
		el: '#app',
		data: appData,
		watch: appDataWatch,
		methods: appMethods
	});
	Utils.dbInit();
	app.emuInit();
}
