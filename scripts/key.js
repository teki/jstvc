var KSADD = 1 << 0;
var KSDEL = 1 << 1;

var SHIFT_ON = 1 << 0;
var ALT_ON = 1 << 1;
var ALTGR_ON = 1 << 2;
var SHIFT_ALTGR_ON = SHIFT_ON | ALTGR_ON;

var KC_SHIFT = 16;
var KC_ALT = 18;
var KC_ALTGR = 225;

export function KEY() {
	// state
	this._state = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
	// row selector for read
	this._row = 0;
	// mappings, per modifier combination
	this._keymap = new Map([
		[0, new Map()],
		[1, new Map()],
		[4, new Map()],
		[5, new Map()] ]);
	// which keys are already mapped
	this._isMapped = {};
	// active modifier
	this._mod = 0;
	// store last key press for new mappings
	this._lastPress = -1;
	// normal keyboard table
	this._ntable =
		"53206í14" +
		"^89ü*óö7" +
		"tew;z@qr" +
		"]ioő[úpu" +
		"gds\\h<af" +
		" klá űéj" +
		"bcx n yv" +
		" ,.   -m";
	// shift keyboard table
	this._stable =
		"%+\"&/Í'!" +
		"~()Ü#ÓÖ=" +
		"TEW$Z`QR" +
		"}IOŐ{ÚPU" +
		"GDS|H>AF" +
		" KLÁ ŰÉJ" +
		"BCX N YV" +
		" ?:   _M";

	// keys which are not in the table
	this._keymap.get(0).set(8, [5, 0, 0]); // backspace
	this._keymap.get(0).set(46, [5, 0, 0]); // del
	this._keymap.get(0).set(13, [5, 4, 0]); // return
	this._keymap.get(0).set(16, [6, 3, 0]); // shift
	this._keymap.get(0).set(20, [6, 5, 0]); // lock
	this._keymap.get(0).set(18, [7, 0, 0]); // alt
	this._keymap.get(0).set(27, [7, 3, 0]); // esc
	this._keymap.get(0).set(17, [7, 4, 0]); // ctrl
	this._keymap.get(0).set(32, [7, 5, 0]); // space
	this._keymap.get(0).set(38, [8, 1, 0]); // up
	this._keymap.get(0).set(40, [8, 2, 0]); // down
	this._keymap.get(0).set(9, [8, 3, 0]); // tab -> fire
	this._keymap.get(0).set(39, [8, 5, 0]); // right
	this._keymap.get(0).set(37, [8, 6, 0]); // left

	// copy mappings
	this._keymap.get(0).forEach(function (m, key) {
		this._keymap.get(SHIFT_ON).set(key, m);
		this._keymap.get(ALTGR_ON).set(key, m);
		this._keymap.get(SHIFT_ALTGR_ON).set(key, m);
	}, this);
	// pre map special keys
	this._isMapped[8] = 1;
	this._isMapped[9] = 1;
	this._isMapped[13] = 1;
	this._isMapped[32] = 1;
}

KEY.prototype.addMapping = function (keyCode) {
	var res;
	var idx;
	var flags;
	var mapping;
	var key;
	key = String.fromCharCode(keyCode);
	flags = 0;
	// search no mod table
	idx = this._ntable.indexOf(key);
	//console.log("addMapping: " + key + " norm idx: " + idx);
	if (idx != -1) {
		if (this._mod & SHIFT_ON)
			flags |= KSDEL;
		mapping = [idx >> 3, idx & 7, flags];
		this._keymap.get(this._mod).set(this._lastPress, mapping);
		//console.log("addMapping: " + this._lastPress + " => " + mapping);
		return mapping;
	}
	idx = this._stable.indexOf(key);
	//console.log("addMapping: " + key + " shift idx: " + idx);
	if (idx != -1) {
		if (!(this._mod & SHIFT_ON))
			flags |= KSADD;
		mapping = [idx >> 3, idx & 7, flags];
		this._keymap.get(this._mod).set(this._lastPress, mapping);
		//console.log("addMapping: " + this._lastPress + " => " + mapping);
		return mapping;
	}
	return null;
};

KEY.prototype.fixState = function (val, down) {
	if (val & KSADD)
		// add shift on down and remove on up if needed
		this.keySet(6, 3, down || (this._mod & SHIFT_ON));
	if (val & KSDEL)
		// remove shift on down and add back on up if needed
		this.keySet(6, 3, !down && (this._mod & SHIFT_ON));
};

KEY.prototype.keyUpdate = function (code, down) {
	if (code == KC_SHIFT)
		this._mod = (this._mod & ~SHIFT_ON) | (down ? SHIFT_ON : 0);
	if (code == KC_ALTGR)
		this._mod = (this._mod & ~ALTGR_ON) | (down ? ALTGR_ON : 0);
	var m;
	var found;
	m = undefined;
	found = false;
	m = this._keymap.get(this._mod).get(code);
	//console.log("keyUpdate down:" + down + " (mod:" + this._mod + ") " + code + " => " + m);
	if (m) {
		this.applyMapping(m, down);
		found = true;
	}
	// on up release keys from the other tables too
	// to avoid key stuck from early shift release
	if (!down) {
		this._keymap.forEach(function (v, k) {
			m = v.get(code);
			if (m) {
				this.keySet(m[0], m[1], down);
			}
		}, this);
	}
	return found;
};

KEY.prototype.applyMapping = function (m, down) {
	//console.log("applyMapping: " + m + " down:" + down);
	this.keySet(m[0], m[1], down);
	this.fixState(m[2], down);
};

KEY.prototype.keyDown = function (code) {
	//console.log("kd: " + code + " shift: " + this._mod);
	this._lastPress = code;
	var res;
	if (code) {
		res = this.keyUpdate(code, true);
	}
	else {
		// ignore 0 keycodes
		// Firefox likes to send them.
		res = true;
	}
	return res;
};
KEY.prototype.keyUp = function (code) {
	//console.log("ku: " + code + " shift: " + this._mod);
	if (code) {
		this.keyUpdate(code, false);
	}
};
KEY.prototype.keyPress = function (code) {
	//console.log("kp: " + code + " " + String.fromCharCode(code) + " shift:" + this._mod);
	if (code && !this._isMapped[code]) {
		//console.log("not mapped: " + code);
		let m = this.addMapping(code);
		if (m) {
			this._isMapped[code] = 1;
			this.applyMapping(m, true);
		}
	}
};

KEY.prototype.selectRow = function (val) {
	this._row = val;
};

KEY.prototype.readRow = function () {
	var res = this._state[this._row];
	if (!res) return 0xFF;
	return res;
};

KEY.prototype.keySet = function (row, column, down) {
	if (down)
		this._state[row] &= ~(1 << column);
	else
		this._state[row] |= (1 << column);
};

KEY.prototype.reset = function () {
	this._state = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];
};
