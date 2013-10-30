define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	function AUD(context) {
		this._amp = 0;
		this._pitch = 0;
		this._on = false;
		this._idx = 0;
		this._vol = 0;
		this._voln = -1;
		this._freq = 1000;
		this._freqn = -1;
		var self = this;
		this._context = context;
		this._node = undefined;
		this._gain = undefined;
		if (this._context) {
			if (context.createJavascriptNode) {
				this._node = context.createJavascriptNode(2048,0,1);
			}
			else if (context.createScriptProcessor) {
				this._node = context.createScriptProcessor(2048,0,1);
			}
			if (this._node) {
				this._node.onaudioprocess = function(e) { self.process(e) };
				this._gain = context.createGain();
				this._gain.gain.value = 0;
				this._node.connect(this._gain);
				this._gain.connect(this._context.destination);
			}
		}
	}

	AUD.prototype.process = function(e) {
		var data = e.outputBuffer.getChannelData(0);
		this.schedule(data, e.outputBuffer.sampleRate);
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

	AUD.prototype.schedule = function(buffer, sampleRate) {
		var needsUpdate = (this._voln >= 0) || (this._freqn >= 0);
		var sample,dist,spc,i;
		spc = sampleRate / this._freq;
		if (needsUpdate) {
			for (i=0; i < buffer.length; i++) {
				dist = spc - (this._idx % spc);
				if (needsUpdate && (dist < 2)) { // switch on 0
					this._idx = 0;
					if (this._freqn >= 0) {
						this._freq = this._freqn;
						this._freqn = -1;
					}
					if (this._voln >= 0) {
						this._vol = this._voln;
						this._voln = -1;
						this._gain.gain.value = this._vol;
					}
					needsUpdate = false;
				}
				if (dist < (spc/2)) {
					sample = 1;
				}
				else {
					sample = -1;
				}
				buffer[i] = sample;
				this._idx++;
			}
		}
		else {
			for (i=0; i < buffer.length; i++) {
				dist = spc - (this._idx % spc);
				if (this._vol <= 0.001) {
					sample = 0;
				}
				else if (dist < (spc/2)) {
					sample = 1;
				}
				else {
					sample = -1;
				}
				buffer[i] = sample;
				this._idx++;
			}
		}
	};

	exports.AUD = AUD;
	return exports;
});
