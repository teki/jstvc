var Utils = require("./utils.js");
var MMU = require("./mmu.js");

////////////////////////////////////////////
// VID
////////////////////////////////////////////
// xIxGxRxB
function toRGBA(val) {
  var intens = 0x7F | ((val & 0x40) << 1);
  var g = (0x100 - ((val >> 4) & 1)) & intens;
  var r = (0x100 - ((val >> 2) & 1)) & intens;
  var b = (0x100 - (val & 1)) & intens;
  return 0xFF000000 | (b << 16) | (g << 8) | r;
}

function COLOR() {
  this.color = 0;
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.rgba = 0xFF;
  this.setColor = function(val) {
    this.color = val;
    var intens = 0x7F | ((val & 0x40) << 1);
    this.r = (0x100 - ((val >> 2) & 1)) & intens;
    this.g = (0x100 - ((val >> 4) & 1)) & intens;
    this.b = (0x100 - (val & 1)) & intens;
    this.rgba = toRGBA(val);
  }
}

COLOR.prototype.toString = function() {
  return this.color;
}

function VID(mmu, fb) {
  this._mmu = mmu;
  this._fb = fb;

  // state
  this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
  this._border = 0;
  this._regIdx = 0;
  this._mode = 0; // 00: 2, 01: 4, 1x: 16 color

  // from registers
  this._ht = 0; // horizontal total CHAR
  this._hd = 0; // horizontal displayed CHAR
  this._hsp = 0; // horizontal sync position CHAR
  this._hsw = 0; // horizontal sync width
  this._vsw = 0; // vertical sync width
  this._vt = 0; // vertical total CHAR
  this._adj = 0; // scan line adjust SCANLINE
  this._vd = 0; // vertical displayed CHAR ROW
  this._vsp = 0; // vertical sync position CHAR ROW
  this._im = 0; // interlace mode, 0 = progressive
  this._skec = 0; // cursor skew
  //this._skede = 0; // de skew (display enable)
  this._slr = 0; // scan line per character row
  this._curaddr = 0; // cursor address
  this._curmemaddr = 0; // cursor address (translated)
  this._curenabled = 0;
  this._smem = 0; // start address

  //this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
  this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];
}

// ma: memory address (12 bit is used), rl: raster line
// address: MMMMMMRRMMMMMM
function genAddress(ma, rl) {
  ma = ma & 0xFFF;
  return ((rl & 0x03) << 6)
    | (ma & 0x3F)
    | ((ma & 0x3FC0) << 2);
}

VID.prototype.reconfig = function() {
  this._ht = this._reg[0];
  this._hd = this._reg[1];
  this._hsp = this._reg[2];
  this._hsw = this._reg[3] & 0x0F;
  this._vsw = (this._reg[3] >>> 4) & 0x0F;
  this._vt = (this._reg[4] & 0x7F);
  this._adj = this._reg[5] & 0x1F;
  this._vd = this._reg[6] & 0x7F;
  this._vsp = this._reg[7] & 0x7F;
  this._im = this._reg[8] & 0x03;
  this._skede = (this._reg[8] >> 4) & 0x03;
  this._skec = (this._reg[8] >> 6) & 0x03;
  this._slr = (this._reg[9] & 0x1F);
  this._curenabled = (this._reg[10] & 0x60) != 0x20;
  this._curstart = this._reg[10] & 0x1F;
  this._curend = this._reg[11] & 0x1F;
  this._smem = (this._reg[12] << 8) | this._reg[13];
  this._curaddr = ((this._reg[14] & 0x3F) << 8) | this._reg[15];
  this._curmemaddr = genAddress(this._curaddr, this._curstart);
  //console.log("VID reconf curaddr: m/a " + Utils.toHex16(this._curaddr) + " " + Utils.toHex16(this._curmemaddr),"VID it row: " + (this._curaddr >> 6) + " sl: " + (this._reg[10] & 0x03) + " byte: " + (this._curaddr & 63));
  //console.log("VID saddr: ",Utils.toHex16(this._smem));
  // this._reg[16] LPen (H)
  // this._reg[17] LPen (L)
  this._border2 = ((this._border & 0xAA) >> 1) | (this._border & 0xAA);
}


VID.prototype.renderFrame = function() {
  let vidmem = this._mmu.crtmem;
  let offset = this._smem;
  const borderRGBA = toRGBA(this._border2);
  let fbd = this._fb.buf32;
  let actPixel = 0;
  let pixelData2, d3, d2, d1, d0, p0, p1, p2, p3;
  // top border
  for (let row = 0; row < 24 * 608; ++row) {
    fbd[actPixel++] = borderRGBA;
  }
  if (this._mode === 0) {
    for (let row = 0; row < 240; ++row) {
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
      for (let col = 0; col < 64; ++col) {
        let pixelData = vidmem[offset + col];
        p0 = this._palette[(pixelData >> 7) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 6) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 5) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 4) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 3) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 2) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[(pixelData >> 1) & 1];
        fbd[actPixel++] = p0.rgba;
        p0 = this._palette[pixelData & 1];
        fbd[actPixel++] = p0.rgba;
      }
      offset += 64;
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
    }
  }
  else if (this._mode === 1) {
    for (let row = 0; row < 240; ++row) {
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
      for (let col = 0; col < 64; ++col) {
        let pixelData = vidmem[offset + col];
        pixelData2 = pixelData >>> 4;
        pixelData <<= 1;
        d3 = (pixelData & 2) | (pixelData2 & 1);
        pixelData >>= 1;
        pixelData2 >>= 1;
        d2 = (pixelData & 2) | (pixelData2 & 1);
        pixelData >>= 1;
        pixelData2 >>= 1;
        d1 = (pixelData & 2) | (pixelData2 & 1);
        pixelData >>= 1;
        pixelData2 >>= 1;
        d0 = (pixelData & 2) | (pixelData2 & 1);
        p0 = this._palette[d0];
        fbd[actPixel++] = p0.rgba;
        fbd[actPixel++] = p0.rgba;
        p1 = this._palette[d1];
        fbd[actPixel++] = p1.rgba;
        fbd[actPixel++] = p1.rgba;
        p2 = this._palette[d2];
        fbd[actPixel++] = p2.rgba;
        fbd[actPixel++] = p2.rgba;
        p3 = this._palette[d3];
        fbd[actPixel++] = p3.rgba;
        fbd[actPixel++] = p3.rgba;
      }
      offset += 64;
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
    }
  }
  else {
    for (let row = 0; row < 240; ++row) {
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
      for (let col = 0; col < 64; ++col) {
        let pixelData = vidmem[offset + col];
        rgba = toRGBA(pixelData >> 1);
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
        rgba = toRGBA(pixelData);
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
        fbd[actPixel++] = rgba;
      }
      offset += 64;
      for (let b = 0; b < 48; ++b) {
        fbd[actPixel++] = borderRGBA;
      }
    }
  }
  // bottom border
  for (let row = 0; row < 24 * 608; ++row) {
    fbd[actPixel++] = borderRGBA;
  }
}

VID.prototype.setPalette = function(idx, color) {
  this._palette[idx].setColor(color);
};

VID.prototype.getPalette = function(idx) {
  return this._palette[idx].color;
};

VID.prototype.setBorder = function(color) {
  this._border = color;
  this._border2 = ((color & 0xAA) >> 1) | (color & 0xAA);
};

VID.prototype.setReg = function(val) {
  if (this._reg[this._regIdx] != val) {
    //console.log("VID setReg: " + this._regIdx + " " + Utils.toHex8(val));
    this._reg[this._regIdx] = val;
    this.reconfig();
  }
};

VID.prototype.getReg = function() {
  return this._reg[this._regIdx];
};

VID.prototype.setRegIdx = function(idx) {
  if (idx < 0 || idx > 17) return;
  this._regIdx = idx;
};

VID.prototype.getRegIdx = function() {
  return this._regIdx;
};

VID.prototype.setMode = function(mode) {
  this._mode = mode;
};

module.exports = VID;
