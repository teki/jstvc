define(["scripts/utils.js", "scripts/mmu.js"], function(Utils, MMU) {
  var exports = {};

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
    this._timer = 0;
    this._palette = [new COLOR(),new COLOR(),new COLOR(),new COLOR()];
    this._border = 0;
    this._regIdx = 0;

    this._mode = 0; // 00: 2, 01: 4, 1x: 16 color

    this._cpufreq = 3125000;
    this._clockCh = 2; // ticks per character
    this._cclk = this._cpufreq / this._cclt; // character freq

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

    // counters
    this._row = 0; // char row

    //this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
    this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];


    this._memStart = 0; // initialized on frame start
    this._mem = 0; // act crtc addr
    this._addr = 0; // act tvc addr /raster counter inserted/
    this._vLines = -1;	// count vsync lines
    this._aLines = 0;	// count adj lines
    this._row = -1; // row
    this._line = 0; // line in a row
    this._char = 0; // char
    this._runFor = 0; // how much time to run for (in cpu clock)

    this._stream = new Int16Array(608*288*2*2); // ring buffer between the 6845 and the renderer
    this._streamh = 0; // head
    this._streamt = 0; // tail

    // renderer
    this._renderPhase = 0;
    this._renderPhaseNext = 0;
    this._renderHCnt = 0;
    this._renderVCnt = 0;
    this._renderY = 0;
    this._renderA = 0;
  }

  VID.prototype.statusStr = function() {
    var str = "[mode:" + this._mode + "]";
    str += "[v:" + this._char + "/" + this._vd + "/" + this._vt + "*" + this._slr + "]";
    str += "[h:" + this._row + "/" + this._hd + "/" + this._ht + "]";
    str += "[addr:" + this._curaddr + "->" + this._curmemaddr + "]";
    return str;
   /*

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

    // counters
    this._row = 0; // char row

    //this._reg = [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ];
    this._reg = [ 0, 0, 0, 0, 0,  0, 0, 0,  0,  0,  0,  0,  0,  0, 0, 0,  0,  0 ];


    this._memStart = 0; // initialized on frame start
    this._mem = 0; // act crtc addr
    this._addr = 0; // act tvc addr /raster counter inserted/
    this._vLines = -1;	// count vsync lines
    this._aLines = 0;	// count adj lines
    this._row = -1; // row
    this._line = 0; // line in a row
    this._char = 0; // char
    this._runFor = 0; // how much time to run for (in cpu clock)

    this._stream = new Int16Array(608*288*2*2); // ring buffer between the 6845 and the renderer
    this._streamh = 0; // head
    this._streamt = 0; // tail

    // renderer
    this._renderPhase = 0;
    this._renderPhaseNext = 0;
    this._renderHCnt = 0;
    this._renderVCnt = 0;
    this._renderY = 0;
    this._renderA = 0;
*/
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
  }

  var HSYNC = 0x0400;
  var VSYNC = 0x0800;

  VID.prototype.streamInitScreen = function() {
    // init screen
    this._memStart = this._smem;
    this._vLines = -1;
    this._aLines = 0;
    // init line
    this._row = 0;
    this._char = 0;
    this._line = 0;
    this._mem = this._memStart + this._row * this._hd;
    this._addr = genAddress(this._mem, this._line);
  }

  VID.prototype.streamSome = function(runFor) {
    // don't do anything when not yet initialized
    if (this._hd >= this._ht)
      return [false,false];

    var vidmem = this._mmu.crtmem;
    var mode = this._mode << 8;
    var mode16 = 2 << 8;
    var hsync = 0;
    var vsync = 0;
    var endScreen = false;
    var cursorIt = false;

    // finished with the screen on the previous run
    if (this._row == -1) {
      this.streamInitScreen();
    }

    // accomulate run time
    this._runFor += runFor;

    /* run till interrupt or till has time */
    while (!cursorIt && (this._runFor >= this._clockCh)) {
      // active picture
      if (this._row < this._vd) { // vertical
        // paper
        if (this._char < this._hd) { // horizontal
          // interrupt
          if (this._curenabled) {
            cursorIt = (this._mem == this._curaddr) && (this._line == this._curstart);
          }
          this.streamData(mode|vidmem[this._addr]);
          this._char++;
          this._addr++;
          this._mem++;
        }
        // border - side
        else if (this._char <= this._ht) {
          hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
          this.streamData(hsync|mode16|this._border2);
          this._char++;
        }
        else {
          throw("VID: ???");
        }
      }
      // bottom broder / vsync / top border
      else if (this._row <= this._vt) {
        // vsync
        if (this._vLines >= 0) { // active
          if (this._vLines < this._vsw) {
            vsync = VSYNC;
          }
          else {
            vsync = 0; // stop
          }
        }
        else if (this._row > this._vsp) { // start
          vsync = VSYNC;
          this._vLines = 0;
        }
        // draw border
        if (this._char <= this._ht) {
          hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
          this.streamData(vsync|hsync|mode16|this._border2);
          this._char++;
        }
        if (vsync && (this._char > this._ht)) {
          this._vLines++;
        }
      }
      // adj lines
      else if ((this._adj > 0) && (this._aLines < this._adj)) {
        // draw border
        if (this._char <= this._ht) {
          hsync = ((this._char > this._hsp) && (this._char < (this._hsp + this._hsw))) ? HSYNC : 0;
          this.streamData(vsync|hsync|mode16|this._border2);
          this._char++;
        }
        if (this._char > this._ht) {
          this._aLines++;
        }
      }
      // end of screen
      else {
        this._runFor += this._clockCh; // nothing was done, adjust time
        this.streamInitScreen();
      }

      // next line
      if (this._char > this._ht) {
        this._char = 0;
        this._line++;
        if (this._line > this._slr) {
          this._line = 0;
          this._row++;
        }
        this._mem = (this._memStart + this._row * this._hd) & 0x3FFF;
        this._addr = genAddress(this._mem, this._line);
      }

      this._runFor -= this._clockCh;
    }

    return [true,  cursorIt];
  }

  VID.prototype.streamData = function(data) {
    this._stream[this._streamh] = data;
    this._streamh++;
    if (this._streamh == this._streamt)
      throw("streamData overflow");
    if (this._streamh == this._stream.length)
      this._streamh = 0;
  }

  VID.prototype.readData = function() {
    var res;
    if (this._streamh == this._streamt) {
      res = -1;
    }
    else {
      res = this._stream[this._streamt];
      this._streamt++;
      if (this._streamt == this._stream.length)
        this._streamt = 0;
    }
    return res;
  }

  // renders a stream into a video frame
  // render starts 26 scanlines after vsync on, lasts for 288 scanlines
  // line is rendered 16 chars after hsync and renders 76 chars (or hsync)
  VID.prototype.renderStream = function() {
    var haveAFrame = false;
    var fbd = this._fb.buf32;
    var data;
    while (!haveAFrame && ((data = this.readData()) != -1)) {
      switch(this._renderPhase) {
      // tools
        case 100: // wait for end of hsync
          if (data & HSYNC) {
            this._renderHCnt++;
          }
          else {
            this._renderPhase = this._renderPhaseNext;
            //console.log("100 => ",this._renderPhaseNext);
          }
          break;
      // wait for vsync
        case 0:
          if (data & VSYNC) {
            // transition
            this._renderPhase = 1;
            this._renderVCnt = 0;
            //console.log("0 => 1");
          }
          break;
      // skip 26 lines
        case 1: // count lines
          if (data & HSYNC) {
            this._renderVCnt++;
            //console.log("renderVCnt",this._renderVCnt);
            if (this._renderVCnt == 26) {
              // transition
              this._renderPhase = 100;
              this._renderPhaseNext = 2;
              this._renderHCnt = 1; // we have the first one already
              this._renderY = 0;
              this._renderA = 0;
              //console.log("1 => 100");
            }
            else {
              this._renderPhase = 100;
              this._renderPhaseNext = 1;
              //console.log("1 => 100");
            }
          }
          break;

      // draw 288 lines
        case 2: // h skip
          this._renderHCnt++;
          //console.log("renderHCnt",this._renderHCnt);
          if (this._renderHCnt == 16) {
            this._renderPhase = 3;
            this._renderHCnt = 0;
            //console.log("2 => 3");
          }
          break;
        case 3: // draw 76
          this._renderHCnt++;
          //console.log("renderHCnt",this._renderHCnt," wp");
          this.writePixel(fbd, this._renderA, data);
          this._renderA += 8;
          if (this._renderHCnt == 76) {
            this._renderY++;
            //console.log("renderY",this._renderY);
            this._renderA = this._fb.width * this._renderY;
            if (this._renderY == 288) {
              // finished, next frame
              this._renderPhase = 0;
              haveAFrame = true;
              //console.log("3 => 0");
            }
            else {
              this._renderPhase = 4;
            }
          }
          break;
        case 4: // wiat for hsync
          if (data & HSYNC) {
              this._renderPhase = 100;
              this._renderPhaseNext = 2;
              this._renderHCnt = 1; // we have the first one already
              //console.log("4 => 100");
          }
          break;
      }
    }
    return haveAFrame;
  }

  VID.prototype.writePixel = function(fbd, actPixel, pixelData) {
    var mode = (pixelData >> 8) & 3;
    var pixelData2, d3, d2, d1, d0, p0, p1, p2, p3;
    var rgba;
    pixelData = pixelData & 0xFF;
    switch(mode) {
      case 0:
      {
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
        break;
      case 1:
      {
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
        break;
      default:
      {
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
        break;
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

  exports.VID = VID;
  return exports;
});

