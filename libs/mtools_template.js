var MTOOLS = function (inOutParams) {
  var Utils = inOutParams.utils;

  inOutParams.out = "";
  inOutParams.err = "";

  var dskName = "abcdx.dsk"

  var Module = {
    'arguments': ["-c", inOutParams.cmd, "-i", "/" + dskName].concat(inOutParams.params),
    'print': function (x) {
    },
    'noFSInit': true,
    'preRun': function () {
      FS.init(null,
          function (x) {
            inOutParams.out += String.fromCharCode(x);
          },
          function (x) {
            inOutParams.err += String.fromCharCode(x);
          }
      );
      // source/destionation disc, mformat doesn't need one
      if (inOutParams.dsk)
        FS.createDataFile("/", dskName, inOutParams.dsk, true, true);
      // source file, will be saved to the disk
      if (inOutParams.fileData)
        FS.createDataFile("/", inOutParams.params[2], inOutParams.fileData, true, true);
      // work in this directory
      if (inOutParams.fsRoot) {
        FS.mkdir(inOutParams.fsRoot);
        FS.chdir(inOutParams.fsRoot);
      }
      // restore a saved filesystem state
      if (inOutParams.fs)
        Utils.Emscripten.restoreFs(FS, inOutParams.fs, inOutParams.fsRoot);
    },
    'postRun': function () {
      var copyDskBack = true;
      // data was requested if the last param is "."
      if (inOutParams.cmd == "mcopy" && inOutParams.params.slice(-1)[0] == ".") {
        copyDskBack = false;
        // dumpFs: return the resulting FS for reuse
        if (inOutParams.dumpFs) {
          inOutParams.fs = Utils.Emscripten.saveFs(Utils.Emscripten.fsGet(FS, inOutParams.fsRoot));
        }
        // just regular getFile*
        else {
          var fname = inOutParams.params[0];
          fname = fname.slice(fname.lastIndexOf("/") + 1);
          // return data in data
          inOutParams.data = Utils.Emscripten.fsGet(FS, fname);
        }
      }
      else if (inOutParams.cmd == "mformat") {
        copyDskBack = false;
        // return new disk in data
        inOutParams.data = Utils.Emscripten.fsGet(FS, dskName);
      }
      if (copyDskBack && inOutParams.dsk) {
        var content = Utils.Emscripten.fsGet(FS, dskName);
        if (content && (content.length == inOutParams.dsk.length)) {
          // copy instead of replace, it is a reference from the editor
          for (var i = 0; i < content.length; i++) {
            inOutParams.dsk[i] = content[i];
          }
        }
      }
      if (inOutParams.cb) {
        inOutParams.cb(inOutParams);
      }
    }
  };

  _srandom = function (v) {
  };
  _random = function () {
    return Math.floor(2147483647 * Math.random());
  };

  /* %%CODE%% */


};
