import { Utils } from "./scripts/utils.js";
import { TVC } from "./scripts/tvc.js";
var g = {};
g.isRunning = true; /* run the emu in the animation callback */
g.tvc = undefined; /* TVC object */
g.canvas = undefined; /* canvas dom object */
g.fb = undefined; /* frame buffer object */

var tvcInfoCallback = function (e) {
	var res;
	switch (e.id) {
		case "fb":
			res = g.fb;
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

let app = undefined;
export function appStart() {
	app = new Vue({
		el: '#app',
		data: {
			message: 'Hello Vue!'
		}
	});
	Utils.dbInit();
	emuInit();
}

function emuBreak() {
	g.isRunning = false;
	$("#bstop").text("continue");
}

function emuReset() {
	g.tvc.reset();
}

async function emuCreate(type) {
	notify("loading roms");
	g.isRunning = false;
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
	g.isRunning = true;
	emuContinue();
	$(document).trigger("emu.started");
}
function emuToggleRun() {
	g.isRunning = !g.isRunning;
	if (g.isRunning) {
		$("#bstop").text("stop");
		emuContinue();
	}
	else {
		$("#bstop").text("continue");
		notify("stopped");
	}
}
function notify(msg, msg2) {
	$("#statusline").text(msg);
}

function refreshGui() {
	g.fb.imageData.data.set(g.fb.buf8);
	g.ctx.putImageData(g.fb.imageData, 0, 0);
	g.fb.updatecnt++;
	var timenow = g.timenow();
	if ((timenow - g.fb.prevUpdateTime) > 1000) {
		g.fb.prevUpdateTime = timenow;

		g.fb.updates.push([g.fb.updatecnt, timenow]);
		if (g.fb.updates.length > 5) g.fb.updates.shift();


		var lastUpdateIdx = g.fb.updates.length - 1;
		var cntdiff = g.fb.updates[lastUpdateIdx][0] - g.fb.updates[0][0];
		var timediff = g.fb.updates[lastUpdateIdx][1] - g.fb.updates[0][1];

		g.fb.fpsv = ~~(cntdiff / (timediff / 1000));
		//console.log(g.fb.updates,g.fb.fpsv);
		notify("running " + g.fb.fpsv.toString(10) + "fps");
	}
}

function emuInit() {
	notify("init page");
	/* polyfills */
	if (window.requestAnimationFrame) g.requestAnimationFrame = function (f) { window.requestAnimationFrame(f); };
	else if (window.mozRequestAnimationFrame) g.requestAnimationFrame = function (f) { window.mozRequestAnimationFrame(f); };
	else if (window.webkitRequestAnimationFrame) g.requestAnimationFrame = function (f) { window.webkitRequestAnimationFrame(f); };
	else if (window.msRequestAnimationFrame) g.requestAnimationFrame = function (f) { window.msRequestAnimationFrame(f); };
	if (typeof (performance) != "undefined")
		g.timenow = function () { return performance.now(); };
	else
		g.timenow = Date.now;
	/* init */
	g.statusline = $("#statusline")[0];
	// frame buffer
	g.canvas = $("#tvcanvas");
	g.ctx = g.canvas[0].getContext("2d");
	g.fb = {};
	g.fb.prevUpdateTime = g.timenow();
	g.fb.updatecnt = 0;
	g.fb.updates = [];
	g.fb.skipcnt = 0;
	g.fb.fps = $("#fps")[0];
	g.fb.fpsv = 0;
	g.fb.width = g.canvas[0].width;
	g.fb.height = g.canvas[0].height;
	g.fb.imageData = g.ctx.createImageData(g.fb.width, g.fb.height);
	g.fb.buf = new ArrayBuffer(g.fb.imageData.data.length);
	g.fb.buf8 = new Uint8ClampedArray(g.fb.buf);
	g.fb.buf32 = new Uint32Array(g.fb.buf);
	g.fb.refresh = refreshGui;
	var emuDefs = [
		"64k+ 1.2, VT-DOS",
		"64k+ 2.2, VT-DOS",
		"64k  1.2",
		"64k+ 1.2",
		"64k+ 2.2"
	];
	var defaultType = Utils.loadLocal("tvc~defmachtype", emuDefs[0]);
	emuCreate(defaultType);
	// gui
	$("#breset").on("click", function () {
		emuReset();
	});
	$("#bstop").on("click", function () {
		emuToggleRun();
	});
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
			notify("loaded", name + "\nTip: run + [enter]");
		});
	});
	Utils.dbInit(function () {
		Utils.dbListDisks(function (name, data) {
			if (data) {
				$("<option>").text(name).val(name).appendTo(imgdrop);
			}
		});
	});
	var gamesdrop = $("#disks");
	var loadDiskByName = async function (name) {
		let resp = await fetch("games/" + name);
		g.tvc.loadImg(name, new Uint8Array(await resp.arrayBuffer()));
		$("#monitor").focus();
		notify("loaded", name);
	};
	$("#disks").change(async function () {
		var name = gamesdrop[0].value;
		loadDiskByName(name);
	});
	for (i = 0; i < gamelist.length; i++) {
		$("<option>").text(gamelist[i].replace(".zip", "")).val(gamelist[i]).appendTo(gamesdrop);
	}
	// machine type
	var machdrop = $("#smach");
	for (i = 0; i < emuDefs.length; i++) {
		$("<option>").text(emuDefs[i]).val(emuDefs[i]).appendTo(machdrop);
	}
	machdrop.on("change", function (e) {
		var machType = machdrop[0].value;
		Utils.saveLocal("tvc~defmachtype", machType);
		emuCreate(machType);
	});
	machdrop.val(defaultType);
	// load first disk
	$(document).on("emu.started", function () {
		loadDiskByName(gamesdrop[0].value);
	});
	// keyboard
	$(document).keydown(handleKeyDown);
	$(document).keyup(handleKeyUp);
	$(document).keypress(handleKeyPress);
	// focus on canvas
	$(window).focus(handleFocus);
	$(window).blur(handleFocusLost);
	// disable selection
	g.canvas.on("selectstart", function (e) { e.preventDefault(); return false; });
	// show/hide debugger
	$("#modemain").click(function () { reconfigUi("main") });
	$("#modedebug").click(function () { reconfigUi("debug") });
	$("#modeeditor").click(function () { reconfigUi("editor") });
	reconfigUi("main");
}

function reconfigUi(mode) {
	var activecss = { "background-color": "black", "color": "white" };
	var inactivecss = { "background-color": "white", "color": "black" };
	$("#modedebug").css(mode == "debug" ? activecss : inactivecss);
	$("#modeeditor").css(mode == "editor" ? activecss : inactivecss);
	$("#modemain").css(mode == "main" ? activecss : inactivecss);

	if (mode == "debug") {
		$("#debugger").show();
		$("#monitor").css({
			"transform": "scale(0.7,0.7)",
			"-webkit-transform": "scale(0.7,0.7)",
			"width": "425px",
			"height": "322px"
		});
	}
	else {
		$("#debugger").hide();
		$("#monitor").css({
			"transform": "scale(1,1)",
			"-webkit-transform": "scale(1,1)",
			"width": "608px",
			"height": "460px"
		});
	}
	if (mode == "main") {
		$("#header").show();
		$("#help").show();
	}
	else {
		$("#help").hide();
		$("#header").hide();
	}
}

// event handlers
function handleKeyPress(e) {
	if (g.tvc) {
		g.tvc.keyPress(e.which);
		e.preventDefault();
	}
}
function handleKeyDown(e) {
	if (g.tvc) {
		if (g.tvc.keyDown(e.which))
			e.preventDefault();
	}
}
function handleKeyUp(e) {
	if (g.tvc) {
		g.tvc.keyUp(e.which);
	}
}
function handleFocus(e) {
	if (g.tvc)
		g.tvc.focusChange(true);
}
function handleFocusLost(e) {
	if (g.tvc)
		g.tvc.focusChange(false);
}

// emulator functions
function emuContinue() {
	g.requestAnimationFrame(emuRunFrame);
}

function emuRunFrame() {
	var skipRun;
	if (g.isRunning) {
		skipRun = false;
		g.fb.skipcnt++;
		if (g.fb.skipcnt == 6) {
			skipRun = g.fb.fpsv > 49;
			g.fb.skipcnt = 0;
		}
		if (!skipRun) {
			var t1 = g.timenow()
			if (g.tvc.runForAFrame())
				emuBreak();
			var t2 = g.timenow();
			var tdiff = t2 - t1;
		}
		if (g.isRunning)
			emuContinue();
	}
}

