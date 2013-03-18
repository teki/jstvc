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
		$("#run")[0].value = "stop";
		emuContinue();
	}
	else {
		$("#run")[0].value = "run";
		emuUpdateDbgInfo();
	}
}
function notify(msg, msg2) {
	$.pnotify({
		title: msg,
		text: msg2,
		animation: "none",
	});
}

function emuInit() {
	notify("loading roms");
	(function() {
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
		window.requestAnimationFrame = requestAnimationFrame;
	})();
	g.regs = $("#regs")[0];
	g.lastrefresh = 0;
	// frame buffer
	g.canvas = $("#tvcanvas");
	g.ctx = g.canvas[0].getContext("2d");
	g.fb = {};
	g.fb.updatetime = performance.now();
	g.fb.updatecnt = 0;
	g.fb.fps = $("#fps")[0];
	g.fb.width = g.canvas[0].width;
	g.fb.height = g.canvas[0].height;
	g.fb.data = g.ctx.createImageData(g.fb.width, g.fb.height);
	g.fb.refresh = function() {
		g.ctx.putImageData(g.fb.data, 0, 0);
		g.fb.updatecnt += 1;
		var timenow = performance.now();
		if ((timenow - g.fb.updatetime) > 500) {
			var fps = ~~(g.fb.updatecnt / ((timenow - g.fb.updatetime) / 1000));
			g.fb.fps.innerHTML = fps.toString(10);
			g.fb.updatetime = timenow;
			g.fb.updatecnt = 0;
		}
	}
	g.tvc = new TVCModule.TVC(callback);
	// gui
	$("#breset").on("click", function() {
		emuReset();
	});
	$("#run").on("click", function() {
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
		$.pnotify({
			title: "start",
			animation: "none",
		});
		emuContinue();
	});
}
function handleKeyDown(e) {
	if (g.tvc) {
		g.tvc.keyDown(e.which);
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
	window.requestAnimationFrame(emuRunFrame);
};
function emuRunFrame() {
	if (!g.isRunning) {
		return;
	}
	// limit to pal refresh rate
	var timenow = performance.now();
	var timediff = timenow - g.lastrefresh;
	if (timediff < 20) {
		emuContinue();
		return;
	}
	g.lastrefresh = timenow;
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
