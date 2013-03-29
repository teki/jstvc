define(["scripts/utils.js"], function(Utils) {
	var exports = {};

	var KSADD = 1;
	var KSDEL = 2;
	function KEY() {
		this._row = 0;
		this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
		this._keymap = {};
		this._skeymap = {};
		this._shift = false;
		var normmap = [
			"53206 14",
			" 89    7",
			"TEW Z QR",
			" IO   PU",
			"GDS H AF",
			" KL    J",
			"BCX N YV",
			"       M" ];
		for (var i in normmap) {
			for(var j = 0; j < 8; j++) {
				var code = normmap[i][j];
				if (code != " ") {
					this._keymap[code.charCodeAt(0)] = [i,j,0];
				}
			}
		}
		this._keymap[  8] = [5,0,0]; // backspace
		this._keymap[ 13] = [5,4,0]; // return
		this._keymap[ 16] = [6,3,0]; // shift
		this._keymap[ 17] = [7,4,0]; // ctrl
		this._keymap[ 18] = [7,0,0]; // alt
		this._keymap[ 20] = [6,5,0]; // lock
		this._keymap[ 27] = [7,3,0]; // esc
		this._keymap[ 32] = [7,5,0]; // space
		this._keymap[ 37] = [8,6,0]; // left
		this._keymap[ 38] = [8,1,0]; // up
		this._keymap[ 39] = [8,5,0]; // right
		this._keymap[ 40] = [8,2,0]; // down
		this._keymap[ 46] = [5,0,0]; // del
		this._keymap[ 59] = [2,3,0]; // ;
		this._keymap[186] = [2,3,0]; // ;
		this._keymap[187] = [1,7,KSADD]; // =
		this._keymap[188] = [7,1,0]; // ,
		this._keymap[189] = [7,6,0]; // -
		this._keymap[190] = [7,2,0]; // .
		this._keymap[191] = [0,4,KSADD]; // /
		this._keymap[192] = [2,5,KSADD]; // `
		this._keymap[219] = [3,4,0]; // [
		this._keymap[220] = [4,3,0]; // \
		this._keymap[221] = [3,0,0]; // ]
		this._keymap[222] = [0,6,KSADD]; // '


		// shift
		this._skeymap[ 48] = [1,2,0]; // )
		this._skeymap[ 49] = [0,7,0]; // !
		this._skeymap[ 50] = [2,5,KSDEL]; // @
		this._skeymap[ 51] = [1,4,0]; // #
		this._skeymap[ 52] = [2,3,0]; // $
		this._skeymap[ 53] = [0,0,0]; // %
		this._skeymap[ 54] = [1,0,KSDEL]; // ^
		this._skeymap[ 55] = [0,3,0]; // &
		this._skeymap[ 56] = [1,4,KSDEL]; // *
		this._skeymap[ 57] = [1,1,0]; // (
		this._skeymap[ 59] = [7,2,0]; // :
		this._skeymap[186] = [7,2,0]; // :
		this._skeymap[187] = [0,1,0]; // +
		this._skeymap[188] = [4,5,KSDEL]; // <
		this._skeymap[190] = [4,5,0]; // >
		this._skeymap[191] = [7,1,KSADD]; // ?
		this._skeymap[222] = [0,2,0]; // "
	}

	KEY.prototype.selectRow = function(val) {
		this._row = val;
	}

	KEY.prototype.readRow = function() {
		var res = this._state[this._row];
		if (!res) return 0xFF;
		return res;
	}

	KEY.prototype.keySet = function(row, column, down) {
		if (down)
			this._state[row] &= ~(1 << column);
		else
			this._state[row] |= (1 << column);
	}

	KEY.prototype.fixState = function(val,down) {
		if (val & KSADD)
			// add shift on down and remove on up if needed
			this.keySet(6,3,down || this._shift);
		if (val & KSDEL)
			// remove shift on down and add back on up if needed
			this.keySet(6,3,!down && this._shift);
	}

	KEY.prototype.keyUpdate = function(code, down) {
		if (code == 16)
			this._shift = down;
		var m = undefined;
		if (this._shift)
			m = this._skeymap[code];
		if (!m)
			m = this._keymap[code];
		if (m) {
			this.keySet(m[0], m[1], down);
			this.fixState(m[2], down);
			// on up release keys from the other table too
			// to avoid key stuck from early shift release
			if (!down) {
				m = (this._shift) ? this._keymap[code] : this._skeymap[code];
				if (m) {
					this.keySet(m[0], m[1], down);
				}
			}
		}
	}

	KEY.prototype.keyDown = function(code) {
		this.keyUpdate(code, true);
	}
	KEY.prototype.keyUp = function(code) {
		this.keyUpdate(code, false);
	}

	KEY.prototype.reset = function() {
		this._state = [0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF,0xFF];
	}

	exports.KEY = KEY;
	return exports;
});

