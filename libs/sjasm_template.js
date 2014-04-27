var ASM = function (asmInOut) {
  var Utils = asmInOut.utils;

  // Module: passing parameters to the app
  var Module = {
    'arguments': [asmInOut.fileName],
    'print': function (x) {},
    // set up our own fs
    'noFSInit': true,
    'preRun': function () {
      FS.init(
          function() {
            return null;
          },
          function (x) {
            // stdout
            asmInOut.out += String.fromCharCode(x);
          },
          function (x) {
            // stderr
            asmInOut.err += String.fromCharCode(x);
          }
      );
      FS.mkdir(asmInOut.fsRoot);
      Utils.Emscripten.restoreFs(FS, asmInOut.fs, asmInOut.fsRoot);
      FS.chdir(asmInOut.fsRoot);
    },
    'postRun': function () {
      asmInOut.resFs = Utils.Emscripten.saveFs(Utils.Emscripten.fsGet(FS, asmInOut.fsRoot));
    }
  };
/* %%CODE%% */
};

