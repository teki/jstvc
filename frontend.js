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

function getData(url) {
	var defer = $.Deferred();
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";
	oReq.onload = function (oEvent) {
		var arrayBuffer = oReq.response;
		if (arrayBuffer) {
			defer.resolve(arrayBuffer);
		}
		else {
			defer.reject(this);
		}
	};
	oReq.send(null);
	return defer;
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
	if (/2\.2/.test(type)) {
		roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
	}
	else {
		roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K", "D_TVCDOS.128"];
	}
	// load roms
	getData("roms/"+roms[0])
	.then(function(data) {
		g.tvc.addRom(roms[0], new Uint8Array(data));
		return getData("roms/"+roms[1]);
	})
	.then(function(data) {
		g.tvc.addRom(roms[1], new Uint8Array(data));
		return getData("roms/"+roms[2]);
	})
	.then(function(data) {
		g.tvc.addRom(roms[2], new Uint8Array(data));
		return getData("roms/"+roms[3]);
		//// start
		//g.isRunning = true;
		//emuContinue();
	})
	.then(function(data) {
		g.tvc.addRom(roms[3], new Uint8Array(data));
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
	g.fb.fps = $("#fps")[0];
	g.fb.width = g.canvas[0].width;
	g.fb.height = g.canvas[0].height;
	g.fb.imageData = g.ctx.createImageData(g.fb.width, g.fb.height);
	g.fb.buf = new ArrayBuffer(g.fb.imageData.data.length);
	g.fb.buf8 = new Uint8ClampedArray(g.fb.buf);
	g.fb.buf32 = new Uint32Array(g.fb.buf);
	g.fb.refresh = function() {
		g.fb.imageData.data.set(g.fb.buf8);
		g.ctx.putImageData(g.fb.imageData, 0, 0);
		g.fb.updatecnt += 1;
		var timenow = g.timenow();
		if ((timenow - g.fb.updatetime) > 500) {
			var fps = ~~(g.fb.updatecnt / ((timenow - g.fb.updatetime) / 1000));
			notify("running " + fps.toString(10) + "fps");
			g.fb.updatetime = timenow;
			g.fb.updatecnt = 0;
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
	// run + update + continue
	if (g.tvc.runForAFrame()) {
		g.isRunning = false;
		$("#bstop").text("continue");
	}
	else {
		//g.regs.innerHTML = g.tvc._z80.toString();
		emuContinue();
	}
}

