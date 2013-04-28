var TVCModule;
var g = {};
g.isRunning = true;
g.tvc = undefined;
g.canvas = undefined;
g.regs = undefined;
g.fb = undefined;
g.bgcolor = -1;

var callback = function(e) {
	var res,valstr;
	switch(e.id) {
		case "fb":
			res = g.fb;
			break;
		case "notify":
			notify(e.str);
			break;
	}
	return res;
};

function appStart() {
	requirejs(["scripts/tvc.js"], function(tvc) {
		TVCModule = tvc;
		emuInit();
	});
}

function getData(name, url) {
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
function emuBreak() {
	g.isRunning = false;
}
function emuReset() {
	g.tvc.reset();
}
function emuCreate(type) {
	notify("loading roms");
	g.isRunning = false;
	g.tvc = new TVCModule.TVC(type,callback);
	var roms;
	if (/2\.2/.test(type)) roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
	else if (/DOS/.test(type)) roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K", "D_TVCDOS.128"];
	else roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
	// load roms
	getData(roms[0], "roms/"+roms[0])
	.then(function(dataname, data) {
		g.tvc.addRom(dataname, new Uint8Array(data));
		return getData(roms[1], "roms/"+roms[1]);
	})
	.then(function(dataname, data) {
		g.tvc.addRom(dataname, new Uint8Array(data));
		return getData(roms[2], "roms/"+roms[2]);
	})
	.then(function(dataname, data) {
		g.tvc.addRom(dataname, new Uint8Array(data));
		if (roms.length > 3) {
			return getData(roms[3], "roms/"+roms[3]);
		}
	})
	.then(function(dataname, data) {
		if (dataname) {
			g.tvc.addRom(dataname, new Uint8Array(data));
		}
		// start
		g.isRunning = true;
		emuContinue();
	});
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

function emuInit() {
	notify("init page");
	/* polyfills */
	if(window.requestAnimationFrame) g.requestAnimationFrame = function(f) {window.requestAnimationFrame(f);};
	else if (window.mozRequestAnimationFrame) g.requestAnimationFrame = function(f) {window.mozRequestAnimationFrame(f);};
	else if (window.webkitRequestAnimationFrame) g.requestAnimationFrame = function(f) {window.webkitRequestAnimationFrame(f);};
	else if (window.msRequestAnimationFrame) g.requestAnimationFrame = function(f) {window.msRequestAnimationFrame(f);};
	if (typeof(performance) != "undefined")
		g.timenow = function() {return performance.now();};
	else
		g.timenow = Date.now;
	/* init */
	g.regs = $("#regs")[0];
	g.statusline = $("#statusline")[0];
	// frame buffer
	g.canvas = $("#tvcanvas");
	g.ctx = g.canvas[0].getContext("2d");
	g.fb = {};
	g.fb.updatetime = g.timenow();
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
	g.fb.refresh = function() {
		g.fb.imageData.data.set(g.fb.buf8);
		g.ctx.putImageData(g.fb.imageData, 0, 0);
		g.fb.updatecnt++;
		var timenow = g.timenow();
		if ((timenow - g.fb.updatetime) > 1000) {
			g.fb.updates.push([g.fb.updatecnt, timenow]);
			if (g.fb.updates.length > 5) g.fb.updates.shift();
			g.fb.updatetime = timenow;

			var cntdiff = g.fb.updates[g.fb.updates.length -1][0] - g.fb.updates[0][0];
			var timediff = g.fb.updates[g.fb.updates.length -1][1] - g.fb.updates[0][1];

			g.fb.fpsv = ~~(cntdiff / (timediff / 1000));
			notify("running " + g.fb.fpsv.toString(10) + "fps");
		}
	};
	emuCreate("64k 1.2");
	// gui
	$("#breset").on("click", function() {
		emuReset();
	});
	$("#bstop").on("click", function() {
		emuToggleRun();
	});
	$("#bpoints").change(function (e) {
		var newbplst = [];
		var bplst = $("#bpoints")[0].value.split(",");
		g.tvc.setBreakPoints(bplst);
		$("#step").focus();
	});
	// img loading + selection
	var imgdrop = $("#scas");
	$("#bload").on("click", function () {
		var imgname = imgdrop[0].value;
		getData("data/" + imgname)
			.then(function(data) {
				g.tvc.reset();
				g.tvc.loadImg(imgname, new Uint8Array(data));
				$("#monitor").focus();
				notify("loaded", imgname + "\nTip: run + [enter]");
			});
	});
	for( var i = 0; i < datalist.length; i++ )
	{
			$("<option>").text(datalist[i]).val(datalist[i]).appendTo(imgdrop);
	}
	// machine type
	var machdrop = $("#smach");
	$("<option>").text("64k  1.2").val("64k 1.2").appendTo(machdrop);
	$("<option>").text("64k+ 1.2").val("64k+ 1.2").appendTo(machdrop);
	$("<option>").text("64k+ 2.2").val("64k+ 2.2").appendTo(machdrop);
	$("<option>").text("64k 1.2, VT-DOS").val("64k 1.2, VT-DOS").appendTo(machdrop);
	machdrop.on("change", function(e) {
		var machType = machdrop[0].value;
		emuCreate(machType);
	});
	// keyboard
	$(document).keydown(handleKeyDown);
	$(document).keyup(handleKeyUp);
	// focus on canvas
	$(window).focus(handleFocus);
	$(window).blur(handleFocusLost);
	// disable selection
	g.canvas.on("selectstart", function(e) { e.preventDefault(); return false; });
}

// event handlers
function handleKeyDown(e) {
	if (g.tvc) {
		g.tvc.keyDown(e.which);
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
	if (!g.isRunning) {
		return;
	}
	g.fb.skipcnt++;
	var skip = (g.fb.fpsv >= 45) && (g.fb.skipcnt == 8);
	if (g.fb.skipcnt >= 8) g.fb.skipcnt = 0;

	if (!skip && g.tvc.runForAFrame()) {
		g.isRunning = false;
		$("#bstop").text("continue");
	}
	else {
		emuContinue();
	}
}

