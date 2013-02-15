define(function() {
	var Utils = {};

	Utils.toHex8 = function(x) {
		var s = x.toString(16).toUpperCase();
		return "0".slice(s.length - 1) + s;
	}

	Utils.toHex16 = function(x) {
		var s = x.toString(16).toUpperCase();
		return "000".slice(s.length - 1) + s;
	}

	Utils.toHex88 = function(x,y) {
		var s = ((x << 8) | y).toString(16).toUpperCase();
		return "000".slice(s.length - 1) + s;
	}

	Utils.toBin8 = function(x) {
		var arr = [];
		var i;
		for (i=0; i<8; i++) {
			arr.push((x & 0x80) ? "1" : "0");
			x = (x << 1);
		}
		return arr.join("");
	}

	return Utils;
});
