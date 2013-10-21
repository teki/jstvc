define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	function AUD() {
		this._amp = 0;
		this._pitch = 0;
		this._on = false;
		this._idx = 0;
		this._vol = 0;
		this._voln = -1;
		this._freq = 1000;
		this._freqn = -1;
		var self = this;
		this._sink = Sink(function(buffer,ch) {self.schedule(buffer, ch);}, 1);
	}

	AUD.prototype.setAmp = function(val) {
		this._amp = val;
		this._voln = this._amp / 15;
	};

	AUD.prototype.setFreqL = function(val) {
		this._pitch = (this._pitch & 0x0F00) | (val & 0xFF);
		this._freqn = 195312.5/(4096-this._pitch);
	};

	AUD.prototype.setFreqH = function(val) {
		this._pitch = (this._pitch & 0xFF) | (val << 8);
		this._freqn = 195312.5/(4096-this._pitch);
	};

	AUD.prototype.setOn = function(val) {
		this._on = val;
		this._voln = val ? (this._amp / 15) : 0;
	};

	AUD.prototype.schedule = function(buffer, ch) {
		var k = 2* Math.PI * this._freq / this._sink.sampleRate;
		var needsUpdate = (this._voln >= 0) || (this._freqn >= 0);
		var sample,dist,spc,i;
		if (needsUpdate) {
			spc = this._sink.sampleRate / this._freq;
			dist = spc - (this._idx % spc);
			for (i=0; i < buffer.length; i++) {
				if (needsUpdate && ((dist--) < 0)) { // switch on 0
					this._idx = 0;
					if (this._freqn >= 0) {
						this._freq = this._freqn;
						this._freqn = -1;
					}
					if (this._voln >= 0) {
						this._vol = this._voln;
						this._voln = -1;
					}
					k = 2* Math.PI * this._freq / this._sink.sampleRate;
					needsUpdate = false;
				}
				sample = Math.sin(k * this._idx) * this._vol;
				buffer[i] = sample;
				this._idx++;
			}
		}
		else {
			for (i=0; i < buffer.length; i++) {
				sample = Math.sin(k * this._idx) * this._vol;
				buffer[i] = sample;
				this._idx++;
			}
		}
	};

	exports.AUD = AUD;
	return exports;
});
