var TVC = require("./tvc.js");

var notify = function(msg, msg2) {
}

var getElement = function(n) {
	return document.querySelector(n);
}

function triggerEvent(name) {
	var event = document.createEvent('Event');
	event.initEvent(name, true, true); //can bubble, and is cancellable
	document.dispatchEvent(event);
}

/* jQuery promise based async data download */
var getData = function (name, url) {
	return new Promise(function (resolve, reject) {
		var oReq = new XMLHttpRequest();
		oReq.open("GET", url, true);
		oReq.responseType = "arraybuffer";
		oReq.onload = function (oEvent) {
			if (oReq.status == 200) {
				var ab = oReq.response;
				resolve(name, new Uint8Array(ab));
			}
			else {
				console.log("Error, failed to load:",name,oReq);
				reject(this);
			}
		};
		oReq.send(null);
	});
}

function Emu()
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
	//getElement("#bstop").text("continue");
}

Emu.prototype.emuReset = function() {
	this.tvc.reset();
}

Emu.prototype.emuCreate = function(type) {
	notify("loading roms");
	let self = this;
	this.isRunning = false;
	this.tvc = new TVC(type, function(e){return self.tvcInfoCallback(e);});
	/*
	var roms;
	if (/2\.2/.test(type)) roms = ["TVC22_D4.64K", "TVC22_D6.64K", "TVC22_D7.64K"];
	else roms = ["TVC12_D3.64K", "TVC12_D4.64K", "TVC12_D7.64K"];
	//if (/DOS/.test(type)) roms.push("D_TVCDOS.128");
	// load roms
	var loadRom = function(idx) {
		if (idx === roms.length) {
			// start
			self.isRunning = true;
			self.emuContinue();
			triggerEvent("emu.started");
			return;
		}
		return fetch("roms/" + roms[idx])
		.then(function(r) {
			if (r.status === 200)
				return r.arrayBuffer()
			else
				console.log("Failed to load:", name);
		})
		.then(function(data) {
			self.tvc.addRom(roms[idx], new Uint8Array(data));
			return loadRom(idx + 1);
		})
	}
	loadRom(0);
	*/
//	self.isRunning = true;
//	self.emuContinue();
//	triggerEvent("emu.started");
}

Emu.prototype.emuToggleRun = function() {
	this.isRunning = !this.isRunning;
	if (this.isRunning) {
		//getElement("#bstop").text("stop");
		this.emuContinue();
	}
	else {
		//getElement("#bstop").text("continue");
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
	// frame buffer
	this.canvas = getElement("#tvcanvas");
	this.ctx = this.canvas.getContext("2d");
	this.fb = {};
	this.fb.prevUpdateTime = this.timenow();
	this.fb.updatecnt = 0;
	this.fb.updates = [];
	this.fb.skipcnt = 0;
	//this.fb.fps = getElement("#fps");
	this.fb.fpsv = 0;
	this.fb.width = this.canvas.width;
	this.fb.height = this.canvas.height;
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
	// img loading + selection
	var loadDiskByName = function(name) {
		return fetch(name)
		.then(function(r) {
			if (r.status === 200)
				return r.arrayBuffer()
			else
				console.log("Failed to load:", name);
		})
		.then(function(data) {
			self.tvc.loadImg(name, new Uint8Array(data));
			getElement("#monitor").focus();
			notify("loaded", name);
		});
	};
	// load first disk
//	document.addEventListener("emu.started", function () {
//		//loadDiskByName("mralex.dsk");
//		loadDiskByName("mralex.tvz").then(function(){
//			self.tvc.restoreState();
//		});
//	});
	// keyboard
	document.addEventListener("keydown", function(e){self.handleKeyDown(e);});
	document.addEventListener("keyup", function(e){self.handleKeyUp(e);});
	document.addEventListener("keypress", function(e){self.handleKeyPress(e);});
	// focus on canvas
	window.addEventListener("focus", function(e){self.handleFocus(e);});
	window.addEventListener("blur", function(e){self.handleFocusLost(e);});
	// disable selection
	this.canvas.addEventListener("selectstart", function(e) { e.preventDefault(); return false; });
	loadDiskByName("mralex.tvz").then(function(){
		self.tvc.restoreState();
		self.isRunning = true;
		self.emuContinue();
	});
}

// event handlers
Emu.prototype.handleKeyPress = function(e) {
	if (!this.tvc)
		return;
	switch (e.key) {
	case '4':
		e.preventDefault();
		//this.tvc.saveState();
		var a = getElement("#downloadState");
		const dataUrl = window.URL.createObjectURL(new Blob([this.tvc.savedState], {type : 'application/octet-stream'}));
		a.setAttribute("href", dataUrl);
		a.setAttribute("download", "tvc_save_state.tvz");
		return;
	case '3':
		e.preventDefault();
		this.tvc.restoreState();
		return;
	case '2':
		e.preventDefault();
		this.tvc.reset();
		return;
	case '1':
		e.preventDefault();
		this.emuToggleRun();
		return;
	}
	e.preventDefault();
	this.tvc.keyPress(e.which);
}

Emu.prototype.handleKeyDown = function(e) {
	if (!this.tvc)
		return;
	if (this.tvc.keyDown(e.which))
		e.preventDefault();
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
			if(this.tvc.runForAFrame2())
				this.emuBreak();
      var t2 = this.timenow();
      var tdiff = t2 - t1;
		}
		if (this.isRunning)
			this.emuContinue();
	}
}

module.exports = Emu;
