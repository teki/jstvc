define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	function AUD() {
		this._clock = 0;
		this._amp = 0;
		this._pitch = 0;
		this._freq = 0;
		this._vol = 0;
		this._on = false;
//		this._context = new webkitAudioContext();
		this._oscillator = undefined;
		this._gain = undefined;
	}

	/*
	AUD.prototype.freqChanged = function() {
		//console.log("AUD: pitch " + this._pitch + " freq: " + this._freq + " vol: " + this._amp);
		if (this._oscillator) {
			var vol = this._on ? this._vol : 0;
			if (this._gain.gain.value != vol)
				this._gain.gain.value = vol;
			if (this._oscillator.frequency.value != this._freq)
				this._oscillator.frequency.value = this._freq;
			return;
		}
		this._gain = this._context.createGain();
		this._oscillator = this._context.createOscillator();
		this._oscillator.connect(this._gain);
		this._gain.connect(this._context.destination);
		this._oscillator.frequency.value = this._freq;
		this._gain.gain.value = this._vol;
		this._oscillator.start(0);
	}
*/
	AUD.prototype.setAmp = function(val) {
		//console.log("AUD: setamp " + val);
		this._amp = val;
		this._vol = this._amp / 15;
//		this.freqChanged();
	};

	AUD.prototype.setFreqL = function(val) {
		this._pitch = (this._pitch & 0x0F00) | (val & 0xFF);
		this._freq = 195312.5/(4096-this._pitch);
//		this.freqChanged();
	};

	AUD.prototype.setFreqH = function(val) {
		this._pitch = (this._pitch & 0xFF) | (val << 8);
		this._freq = 195312.5/(4096-this._pitch);
//		this.freqChanged();
	};

	AUD.prototype.setOn = function(val) {
		this._on = val;
//		this.freqChanged();
	};

	exports.AUD = AUD;
	return exports;
});
