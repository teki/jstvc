var TVCModule;
var Utils;
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
	requirejs(["scripts/tvc.js","scripts/utils.js"], function(TVC, UTILS) {
		TVCModule = TVC;
		Utils = UTILS;
        Utils.dbInit();
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
	$("#bstop").text("continue");
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
	else roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
	if (/DOS/.test(type)) roms.push("D_TVCDOS.128");
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
	g.fb.refresh = function() {
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
	};
	var emuDefs = [
		"64k  1.2",
		"64k+ 1.2",
		"64k+ 2.2",
		"64k+ 1.2, VT-DOS",
		"64k+ 2.2, VT-DOS"
			];
	var defaultType = Utils.loadLocal("tvc~defmachtype", emuDefs[0]);
	emuCreate(defaultType);
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
	var i;
	var imgdrop = $("#slocal");
	$("#loadlocal").on("click", function () {
		var imgname = imgdrop[0].value;
        Utils.dbLoadDisk(imgname, function(name,data) {
            g.tvc.loadImg(name, new Uint8Array(data));
            $("#monitor").focus();
            notify("loaded", name + "\nTip: run + [enter]");
        });
	});
    Utils.dbInit(function() {
        Utils.dbListDisks(function (name, data) {
            if (data) {
                $("<option>").text(name).val(name).appendTo(imgdrop);
            }
        });
    });
	var gamesdrop = $("#sgames");
	$("#loadgame").on("click", function () {
		var name = gamesdrop[0].value;
		getData(name, "games/" + name)
			.then(function(dataname, data) {
				g.tvc.loadImg(dataname, new Uint8Array(data));
				$("#monitor").focus();
				notify("loaded", dataname + "\nTip: run + [enter]");
			});
	});
	for(i = 0; i < gamelist.length; i++ ) {
			$("<option>").text(gamelist[i].replace(".zip","")).val(gamelist[i]).appendTo(gamesdrop);
	}
	// machine type
	var machdrop = $("#smach");
	for (i = 0; i < emuDefs.length; i++ ) {
		$("<option>").text(emuDefs[i]).val(emuDefs[i]).appendTo(machdrop);
	}
	machdrop.on("change", function(e) {
		var machType = machdrop[0].value;
		Utils.saveLocal("tvc~defmachtype", machType);
		emuCreate(machType);
	});
	machdrop.val(defaultType);
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
	if (!g.isRunning)
		return;
	var breakPointHit = g.tvc.runForAFrame();
	if (breakPointHit)
		emuBreak();
	if (g.isRunning)
		emuContinue();
}

