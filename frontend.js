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
		case "bg":
			if (g.bgcolor != e.val) {
				valstr = e.val.toString(16);
				$("#monitor").css("background-color","#000000".slice(0,-valstr.length)+valstr); 
				g.bgcolor = e.val;
			}
			break;
	}
	return res;
}

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
	}
	oReq.send(null);
	return defer;
}
function emuBreak() {
	g.isRunning = false;
	emuUpdateDbgInfo();
}
function emuUpdateDbgInfo() {
	return;
	var arr = [];
	arr.push(g.tvc._z80.toString());
	arr = arr.concat(g.tvc._z80.btToString());
	arr[arr.length-1] = '<span class="greenline">' + arr[arr.length-1] + "</span>";
	g.regs.innerHTML = arr.join("\n");
}
function emuReset() {
	g.tvc.reset();
}
function emuToggleRun() {
	g.isRunning = !g.isRunning;
	if (g.isRunning) {
		$("#bstop")[0].innerText = "stop";
		emuContinue();
	}
	else {
		$("#bstop")[0].innerText = "run";
		emuUpdateDbgInfo();
	}
}
function notify(msg, msg2) {
	$("#statusline")[0].innerHTML = msg;
}

function emuInit() {
	notify("loading roms");
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
	g.fb.data = g.ctx.createImageData(g.fb.width, g.fb.height);
	g.fb.refresh = function() {
		g.ctx.putImageData(g.fb.data, 0, 0);
		g.fb.updatecnt += 1;
		var timenow = g.timenow();
		if ((timenow - g.fb.updatetime) > 500) {
			var fps = ~~(g.fb.updatecnt / ((timenow - g.fb.updatetime) / 1000));
			notify("running " + fps.toString(10) + "fps");
			g.fb.updatetime = timenow;
			g.fb.updatecnt = 0;
		}
	}
	g.tvc = new TVCModule.TVC(callback);
	// gui
	$("#breset").on("click", function() {
		emuReset();
	});
	$("#bstop").on("click", function() {
		emuToggleRun();
	});
	$("#step").on("click", function() {
		emuStep();
	});
	$("#bpoints").change(function (e) {
		var newbplst = [];
		var bplst = $("#bpoints")[0].value.split(",");
		g.tvc.setBreakPoints(bplst);
		$("#step").focus();
	});
	$("#bload").on("click", function () {
		var casname = $("#scas")[0].value;
		getData("data/" + casname)
			.then(function(data) {
				g.tvc.reset();
				g.tvc.loadCas(new Uint8Array(data));
				$("#monitor").focus();
				notify("loaded", casname + "\nTip: run + [enter]");
			});
	});
	var casdrop = $("#scas");
	for( var i = 0; i < datalist.length; i++ )
	{
			$("<option>").text(datalist[i]).val(datalist[i]).appendTo(casdrop);
	}
	$(document).keydown(handleKeyDown);
	$(document).keyup(handleKeyUp);
	$(window).focus(handleFocus);
	$(window).blur(handleFocusLost);

	// load roms
	getData("TVC12_D3.64K")
		.then(function(data) {
			g.tvc.addRom("D3", new Uint8Array(data));
			return getData("TVC12_D4.64K");
		})
	.then(function(data) {
		g.tvc.addRom("D4", new Uint8Array(data));
		return getData("TVC12_D7.64K");
	})
	.then(function(data) {
		g.tvc.addRom("D7", new Uint8Array(data));
		// start
		emuContinue();
	});
}
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
function emuContinue() {
	g.requestAnimationFrame(emuRunFrame);
};
function emuRunFrame() {
	if (!g.isRunning) {
		return;
	}
	// run + update + continue
	if (g.tvc.runForAFrame()) {
		g.isRunning = false;
		emuUpdateDbgInfo();
	}
	else {
		//g.regs.innerHTML = g.tvc._z80.toString();
		emuContinue();
	}
};
function emuStep() {
	var arr = [];
	if (!g.isRunning) {
		g.tvc.runOne();
		emuUpdateDbgInfo();
	}
};
