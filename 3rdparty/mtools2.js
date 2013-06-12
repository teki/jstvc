var MTOOLS = function(mtp) {
    mtp.out = "";
    mtp.err = "";
    var Module = {
        'arguments': ["-c", mtp.cmd, "-i", "a.dsk"].concat(mtp.params),
        'print': function(x) {},
        'noFSInit': true,
        'preRun': function() {
            FS.init(null,
                function(x) {mtp.out += String.fromCharCode(x);},
                function(x) {mtp.err += String.fromCharCode(x);}
            );
            if (mtp.dsk)
                FS.createDataFile("/", "a.dsk", mtp.dsk, true, true);
            if (mtp.fileData)
                FS.createDataFile("/", mtp.params[1], mtp.fileData, true, true);
        },
        'postRun': function() {
            if (mtp.cmd == "mcopy" && mtp.params.slice(-1)[0] == ".") {
                if (mtp.hasOwnProperty("dumpFs")) {
                    mtp.fs = {root: JSON.stringify(FS.root), nextInode: JSON.stringify(FS.nextInode)};
                }
                else {
                    var fname = mtp.params[0];
                    fname = fname.slice(fname.lastIndexOf("/")+1);

                    mtp.data = FS.root.contents.hasOwnProperty(fname);
                    if (mtp.data) {
                        var content = FS.root.contents[fname].contents;
                        mtp.data = new Uint8Array(content.length);
                        for(var i=0; i<content.length; i++) {
                            mtp.data[i] = content[i];
                        }
                    }
                }
            }
            else if (mtp.cmd == "mformat") {
                mtp.data = FS.root.contents.hasOwnProperty("a.dsk");
                if (mtp.data) {
                    var content = FS.root.contents["a.dsk"].contents;
                    mtp.data = new Uint8Array(content.length);
                    for(var i=0; i<content.length; i++) {
                        mtp.data[i] = content[i];
                    }
                }
            }
            if (mtp.cb) {
                mtp.cb(mtp);
            }
        }
    };
		_srandom = function(v) {};
		_random = function() {return Math.floor(2147483647*Math.random());};

// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
var runtimeInitialized = false;
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function addPreRun(func) {
  if (!Module['preRun']) Module['preRun'] = [];
  else if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
  Module['preRun'].push(func);
}
var awaitingMemoryInitializer = false;
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, TOTAL_STACK);
    runPostSets();
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
  awaitingMemoryInitializer = false;
}
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 22304;
assert(STATICTOP < TOTAL_MEMORY);
var _timezone;
var _stdout;
var _stdin;
var _stderr;
var ___progname;
var _warnx;
var _stdout = _stdout=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stdin = _stdin=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,70,108,117,115,104,105,110,103,32,100,101,118,105,99,101,32,97,102,116,101,114,32,51,50,32,107,66,121,116,101,115,32,111,102,32,100,97,116,97,46,46,46,0,0,79,112,101,110,32,115,117,99,99,101,115,115,102,117,108,46,46,46,0,0,82,111,111,116,32,100,105,114,101,99,116,111,114,121,32,111,114,32,101,109,112,116,121,32,102,105,108,101,0,0,0,0,32,86,111,108,117,109,101,32,104,97,115,32,110,111,32,108,97,98,101,108,0,0,0,0,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,0,0,98,111,111,116,115,101,99,116,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,61,0,100,101,118,105,99,101,32,105,110,102,111,114,109,97,116,105,111,110,58,0,10,73,110,102,111,115,101,99,116,111,114,58,0,0,0,0,10,84,111,116,97,108,32,102,105,108,101,115,32,108,105,115,116,101,100,58,0,0,0,0,78,111,32,102,105,108,101,115,0,0,0,0,111,112,116,105,111,110,32,45,112,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,32,121,101,116,0,0,0,61,61,61,61,61,61,61,61,61,61,61,61,61,0,0,0,68,101,98,117,103,32,77,111,100,101,46,46,46,0,0,0,109,99,108,97,115,115,101,114,97,115,101,58,32,119,114,111,110,103,32,110,117,109,32,111,102,32,97,114,103,115,0,0,69,114,114,111,114,32,119,105,116,104,32,100,117,112,50,40,41,32,115,116,100,111,117,116,0,0,0,0,101,120,105,116,105,110,103,46,0,0,0,0,73,110,112,117,116,32,101,114,114,111,114,0,80,114,101,115,115,32,60,120,62,32,97,110,100,32,60,69,78,84,69,82,62,32,116,111,32,97,98,111,114,116,0,0,10,80,114,101,115,115,32,60,69,78,84,69,82,62,32,116,111,32,99,111,110,116,105,110,117,101,0,0,98,117,105,108,116,105,110,0,5,0,0,0,11,0,0,0,23,0,0,0,47,0,0,0,97,0,0,0,197,0,0,0,141,1,0,0,29,3,0,0,61,6,0,0,131,12,0,0,21,25,0,0,53,50,0,0,117,100,0,0,237,200,0,0,221,145,1,0,191,35,3,0,135,71,6,0,77,143,12,0,157,30,25,0,73,61,50,0,151,122,100,0,57,245,200,0,129,234,145,1,33,213,35,3,67,170,71,6,137,84,143,12,39,169,30,25,91,82,61,50,191,164,122,100,0,0,0,0,240,25,80,0,0,0,0,0,0,0,0,0,0,0,0,0,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,115,0,0,0,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,70,80,0,0,0,0,0,0,0,0,0,63,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,28,80,0,0,32,0,0,228,27,80,0,0,8,0,0,184,27,80,0,0,0,0,0,40,0,0,0,9,0,0,0,1,0,0,0,4,0,0,0,1,0,0,0,2,0,0,0,252,0,0,0,40,0,0,0,9,0,0,0,2,0,0,0,7,0,0,0,2,0,0,0,2,0,0,0,253,0,0,0,40,0,0,0,8,0,0,0,1,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,254,0,0,0,40,0,0,0,8,0,0,0,2,0,0,0,7,0,0,0,2,0,0,0,1,0,0,0,255,0,0,0,80,0,0,0,9,0,0,0,2,0,0,0,7,0,0,0,2,0,0,0,3,0,0,0,249,0,0,0,80,0,0,0,15,0,0,0,2,0,0,0,14,0,0,0,1,0,0,0,7,0,0,0,249,0,0,0,80,0,0,0,18,0,0,0,2,0,0,0,14,0,0,0,1,0,0,0,9,0,0,0,240,0,0,0,80,0,0,0,36,0,0,0,2,0,0,0,15,0,0,0,2,0,0,0,9,0,0,0,240,0,0,0,1,0,0,0,8,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,240,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,111,112,116,105,111,110,32,100,111,101,115,110,39,116,32,116,97,107,101,32,97,110,32,97,114,103,117,109,101,110,116,32,45,45,32,37,46,42,115,0,0,0,0,0,0,0,0,0,88,29,80,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,3,0,0,112,72,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,59,0,0,0,90,0,0,0,120,0,0,0,151,0,0,0,181,0,0,0,212,0,0,0,243,0,0,0,17,1,0,0,48,1,0,0,78,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,29,80,0,1,0,0,0,180,29,80,0,4,0,0,0,96,29,80,0,16,0,0,0,80,29,80,0,128,0,0,0,88,65,80,0,2,0,0,0,244,28,80,0,32,0,0,0,144,28,80,0,64,0,0,0,48,28,80,0,0,1,0,0,192,57,80,0,28,68,80,0,180,66,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,115,0,0,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,45,45,32,37,99,0,0,0,0,0,0,0,0,0,0,0,0,172,55,80,0,116,8,80,0,2,0,0,0,80,54,80,0,120,8,80,0,2,0,0,0,64,53,80,0,92,8,80,0,2,0,0,0,140,52,80,0,112,8,80,0,2,0,0,0,184,51,80,0,104,8,80,0,2,0,0,0,196,50,80,0,100,8,80,0,2,0,0,0,96,49,80,0,108,8,80,0,2,0,0,0,180,48,80,0,124,8,80,0,2,0,0,0,20,48,80,0,88,8,80,0,2,0,0,0,72,46,80,0,132,8,80,0,1,0,0,0,160,45,80,0,128,8,80,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,67,80,0,148,57,80,0,156,48,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,27,80,0,0,0,0,0,1,0,0,0,36,27,80,0,0,0,0,0,2,0,0,0,196,26,80,0,0,0,0,0,2,0,0,0,160,26,80,0,0,0,0,0,0,0,0,0,64,26,80,0,0,0,0,0,2,0,0,0,196,25,80,0,0,0,0,0,2,0,0,0,184,25,80,0,0,0,0,0,2,0,0,0,140,25,80,0,0,0,0,0,2,0,0,0,120,25,80,0,0,0,0,0,2,0,0,0,36,25,80,0,0,0,0,0,2,0,0,0,12,25,80,0,0,0,0,0,2,0,0,0,228,24,80,0,0,0,0,0,1,0,0,0,100,83,80,0,0,0,0,0,2,0,0,0,88,83,80,0,0,0,0,0,2,0,0,0,112,65,80,0,140,0,0,0,0,0,0,0,136,64,80,0,18,0,0,0,0,0,0,0,212,63,80,0,172,0,0,0,0,0,0,0,56,63,80,0,226,0,0,0,0,0,0,0,232,61,80,0,180,0,0,0,0,0,0,0,132,60,80,0,204,0,0,0,0,0,0,0,20,59,80,0,108,0,0,0,0,0,0,0,248,57,80,0,108,0,0,0,2,0,0,0,68,57,80,0,16,0,0,0,0,0,0,0,132,56,80,0,184,0,0,0,0,0,0,0,192,55,80,0,188,0,0,0,0,0,0,0,180,54,80,0,22,0,0,0,0,0,0,0,112,53,80,0,40,0,0,0,0,0,0,0,168,52,80,0,200,0,0,0,0,0,0,0,216,51,80,0,34,0,0,0,0,0,0,0,212,50,80,0,198,0,0,0,0,0,0,0,124,49,80,0,46,0,0,0,0,0,0,0,200,48,80,0,108,0,0,0,1,0,0,0,52,48,80,0,204,0,0,0,0,0,0,0,120,46,80,0,52,0,0,0,0,0,0,0,180,45,80,0,52,0,0,0,1,0,0,0,208,44,80,0,90,0,0,0,0,0,0,0,212,42,80,0,88,0,0,0,0,0,0,0,20,42,80,0,224,0,0,0,0,0,0,0,148,41,80,0,204,0,0,0,1,0,0,0,88,40,80,0,204,0,0,0,0,0,0,0,96,39,80,0,192,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,60,35,80,0,12,0,0,0,80,0,0,0,2,0,15,0,32,35,80,0,12,0,0,0,80,0,0,0,2,0,15,0,228,34,80,0,12,0,0,0,80,0,0,0,2,0,15,0,220,34,80,0,12,0,0,0,80,0,0,0,2,0,18,0,136,34,80,0,12,0,0,0,80,0,0,0,2,0,18,0,92,34,80,0,12,0,0,0,80,0,0,0,2,0,18,0,212,33,80,0,12,0,0,0,80,0,0,0,2,0,9,0,108,33,80,0,12,0,0,0,80,0,0,0,2,0,9,0,52,33,80,0,12,0,0,0,80,0,0,0,2,0,9,0,8,33,80,0,12,0,0,0,40,0,0,0,2,0,9,0,228,32,80,0,12,0,0,0,40,0,0,0,2,0,9,0,192,32,80,0,12,0,0,0,40,0,0,0,2,0,9,0,52,32,80,0,12,0,0,0,40,0,0,0,2,0,8,0,32,32,80,0,12,0,0,0,40,0,0,0,1,0,9,0,136,31,80,0,12,0,0,0,40,0,0,0,1,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,181,1,0,0,199,252,233,226,228,224,229,231,234,235,232,239,238,236,196,197,201,230,198,244,246,242,251,249,255,214,220,162,163,165,80,102,225,237,243,250,241,209,170,186,191,114,172,189,188,161,171,187,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,172,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,97,98,103,112,83,115,181,116,102,116,111,100,248,216,95,78,61,177,60,62,124,124,247,126,176,183,183,86,110,178,95,95,51,3,0,0,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,82,3,0,0,199,252,233,226,228,224,229,231,234,235,232,239,238,236,196,197,201,230,198,244,246,242,251,249,255,214,220,248,163,216,215,95,225,237,243,250,241,209,170,186,191,174,172,189,188,161,171,187,95,95,95,95,95,193,194,192,169,95,95,95,95,162,165,172,95,95,95,95,95,95,227,195,95,95,95,95,95,95,95,164,240,208,201,203,200,105,205,206,207,95,95,95,95,124,73,95,211,223,212,210,245,213,181,254,222,218,217,253,221,222,175,180,173,177,95,190,182,167,247,184,176,168,183,185,179,178,95,95,84,3,0,0,199,252,233,226,228,117,99,231,108,235,213,245,238,90,196,67,201,76,108,244,246,76,108,83,115,214,220,84,116,76,215,99,225,237,243,250,65,97,90,122,69,101,32,122,67,115,171,187,95,95,95,95,95,193,194,69,83,95,95,95,95,90,122,172,95,95,95,95,95,95,65,97,95,95,95,95,95,95,95,164,240,208,68,203,100,209,205,206,101,95,114,95,95,84,85,95,211,223,212,78,110,241,83,115,82,218,114,85,253,221,116,180,173,126,46,126,126,167,247,184,176,168,183,185,117,82,114,95,92,3,0,0,199,252,233,226,227,224,229,231,234,235,232,205,245,236,195,194,201,192,200,244,245,242,218,249,204,213,220,162,163,217,80,211,225,237,243,250,241,209,170,186,191,210,172,189,188,161,171,187,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,172,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,97,98,103,112,83,115,181,116,102,116,111,100,248,216,95,78,61,177,60,62,124,124,247,126,176,183,183,86,110,178,95,95,95,3,0,0,199,252,233,226,194,224,182,231,234,235,232,239,238,95,192,167,201,200,202,244,203,207,251,249,164,212,220,162,163,217,219,102,124,180,243,250,168,32,179,175,206,114,172,189,188,190,171,187,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,172,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,97,98,103,112,83,115,181,116,102,116,111,100,248,216,95,78,61,177,60,62,124,124,247,126,176,183,183,86,110,178,95,95,97,3,0,0,199,252,233,226,228,224,229,231,234,235,232,239,238,236,196,197,201,230,198,244,246,242,251,249,255,214,220,248,163,216,80,102,225,237,243,250,241,209,170,186,191,114,172,189,188,161,171,164,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,172,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,95,97,98,103,112,83,115,181,116,102,116,111,100,248,216,95,78,61,177,60,62,124,124,247,126,176,183,183,86,110,178,95,95,182,3,0,0,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244,245,246,247,248,249,250,251,252,253,254,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,250,49,192,142,216,142,192,252,185,0,1,190,0,124,191,0,128,243,165,234,0,0,0,8,184,1,2,187,0,124,186,128,0,185,1,0,205,19,114,5,234,0,124,0,0,205,25,0,0,0,0,0,76,26,80,0,76,26,80,0,68,83,80,0,64,29,80,0,0,0,0,0,0,0,0,0,240,27,80,0,128,25,80,0,180,81,80,0,97,109,98,105,103,117,111,117,115,32,111,112,116,105,111,110,32,45,45,32,37,46,42,115,0,0,0,0,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,118,102,97,116,95,108,111,111,117,112,32,91,48,93,10,0,0,80,82,69,67,77,68,0,0,105,110,105,116,58,32,110,111,110,45,101,120,105,115,116,97,110,116,32,112,97,114,116,105,116,105,111,110,0,0,0,0,72,73,68,68,69,78,0,0,100,105,115,97,98,108,101,45,120,100,102,32,0,0,0,0,83,69,67,84,79,82,83,0,32,32,115,116,97,114,116,61,37,100,10,0,67,97,110,110,111,116,32,109,111,118,101,32,97,32,114,111,111,116,32,100,105,114,101,99,116,111,114,121,58,32,0,0,69,110,116,101,114,32,116,104,101,32,110,101,119,32,118,111,108,117,109,101,32,108,97,98,101,108,32,58,32,0,0,0,72,69,65,68,83,0,0,0,105,115,32,114,101,115,101,114,118,101,100,0,67,89,76,73,78,68,69,82,83,0,0,0,45,84,32,37,108,100,32,0,68,114,105,118,101,32,108,101,116,116,101,114,32,109,105,115,115,105,110,103,10,0,0,0,84,82,65,67,75,83,0,0,37,99,58,0,77,79,68,69,0,0,0,0,66,97,100,32,99,108,117,115,116,101,114,32,37,108,100,32,102,111,117,110,100,10,0,0,43,115,32,0,68,79,84,68,79,84,0,0,59,43,61,91,93,39,44,34,42,92,60,62,47,63,58,124,0,0,0,0,77,84,79,79,76,83,82,67,0,0,0,0,66,105,103,32,100,105,115,107,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,111,110,32,116,104,105,115,32,97,114,99,104,105,116,101,99,116,117,114,101,10,0,0,0,70,65,84,95,66,73,84,83,0,0,0,0,120,97,117,116,104,0,0,0,108,111,111,112,32,100,101,116,101,99,116,101,100,33,32,111,108,100,114,101,108,61,37,100,32,110,101,119,114,101,108,61,37,100,32,97,98,115,61,37,100,10,0,0,47,100,101,118,47,116,116,121,0,0,0,0,70,97,116,32,101,114,114,111,114,32,100,101,116,101,99,116,101,100,10,0,70,65,84,0,46,0,0,0,67,97,110,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,39,37,99,58,39,10,0,0,0,0,80,65,82,84,73,84,73,79,78,0,0,0,82,79,85,78,68,79,87,78,40,111,102,102,115,101,116,32,43,32,108,101,110,32,43,32,103,114,97,105,110,32,45,32,49,41,32,61,32,37,120,10,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,108,111,111,107,117,112,70,111,114,73,110,115,101,114,116,10,0,79,70,70,83,69,84,0,0,73,110,118,97,108,105,100,32,112,97,114,116,105,116,105,111,110,32,37,100,32,40,109,117,115,116,32,98,101,32,98,101,116,119,101,101,110,32,48,32,97,110,100,32,52,41,44,32,105,103,110,111,114,105,110,103,32,105,116,10,0,0,0,0,70,73,76,69,0,0,0,0,99,111,110,102,105,103,117,114,101,100,32,119,105,116,104,32,116,104,101,32,102,111,108,108,111,119,105,110,103,32,111,112,116,105,111,110,115,58,32,0,115,99,115,105,95,105,111,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,10,0,0,0,0,110,111,110,101,0,0,0,0,32,32,101,110,100,58,0,0,41,10,0,0,32,86,111,108,117,109,101,32,108,97,98,101,108,32,105,115,32,37,115,10,0,0,0,0,101,120,99,108,117,115,105,118,101,0,0,0,97,108,114,101,97,100,121,32,101,120,105,115,116,115,0,0,115,121,110,99,0,0,0,0,45,116,32,37,100,32,0,0,67,111,117,108,100,32,110,111,116,32,102,111,114,107,0,0,66,97,100,32,110,117,109,98,101,114,32,37,115,10,0,0,115,119,97,112,0,0,0,0,37,46,42,108,117,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,118,93,32,109,115,100,111,115,102,105,108,101,32,91,109,115,100,111,115,102,105,108,101,115,46,46,46,93,10,0,0,0,67,111,112,121,105,110,103,32,37,115,10,0,67,97,114,100,45,84,121,112,101,32,100,101,116,101,99,116,101,100,58,32,37,115,10,0,114,101,109,111,116,101,0,0,83,101,99,116,111,114,32,98,101,121,111,110,100,32,101,110,100,10,0,0,45,97,32,0,68,79,84,0,47,46,109,116,111,111,108,115,114,99,0,0,105,110,105,116,32,37,99,58,32,115,101,99,116,111,114,32,115,105,122,101,32,40,37,100,41,32,110,111,116,32,97,32,115,109,97,108,108,32,112,111,119,101,114,32,111,102,32,116,119,111,10,0,118,111,108,100,0,0,0,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,44,32,97,117,116,104,101,110,116,105,99,97,116,105,111,110,32,102,97,105,108,101,100,33,10,37,115,10,0,0,0,99,108,117,115,116,101,114,32,116,111,111,32,98,105,103,10,0,0,0,0,45,0,0,0,70,65,84,32,101,114,114,111,114,10,0,0,102,105,108,116,101,114,0,0,52,46,48,46,49,56,0,0,109,102,111,114,109,97,116,95,111,110,108,121,0,0,0,0,111,102,102,115,101,116,32,43,32,108,101,110,32,43,32,103,114,97,105,110,32,45,32,49,32,61,32,37,120,10,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,118,102,97,116,95,108,111,111,107,117,112,10,0,110,111,108,111,99,107,0,0,105,110,105,116,58,32,66,105,103,32,100,105,115,107,115,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,115,99,115,105,0,0,0,0,37,115,32,40,71,78,85,32,109,116,111,111,108,115,41,32,37,115,10,0,108,105,110,101,32,116,111,111,32,108,111,110,103,0,0,0,32,32,116,121,112,101,61,48,120,37,120,10,0,0,0,0,32,105,110,116,111,32,111,110,101,32,111,102,32,105,116,115,32,111,119,110,32,115,117,98,100,105,114,101,99,116,111,114,105,101,115,32,40,0,0,0,32,86,111,108,117,109,101,32,108,97,98,101,108,32,105,115,32,37,115,32,40,97,98,98,114,61,37,115,41,10,0,0,101,110,100,32,111,102,32,102,105,108,101,32,117,110,101,120,112,101,99,116,101,100,0,0,115,101,99,111,110,100,97,114,121,0,0,0,32,35,10,9,0,0,0,0,109,102,111,114,109,97,116,32,99,111,109,109,97,110,100,32,108,105,110,101,58,32,109,102,111,114,109,97,116,32,0,0,66,97,99,107,117,112,98,111,111,116,32,109,117,115,116,32,98,101,32,99,111,109,112,114,105,115,101,100,32,98,101,116,119,101,101,110,32,50,32,97,110,100,32,51,50,10,0,0,110,117,109,101,114,97,108,32,101,120,112,101,99,116,101,100,0,0,0,0,37,46,42,108,117,37,48,57,108,117,0,0,34,37,115,34,32,105,115,32,97,32,100,105,114,101,99,116,111,114,121,10,0,0,0,0,85,115,105,110,103,32,68,101,118,105,99,101,58,32,37,115,10,0,0,0,101,120,112,101,99,116,101,100,32,48,32,111,114,32,49,0,83,101,99,116,111,114,32,98,101,102,111,114,101,32,115,116,97,114,116,10,0,0,0,0,43,97,32,0,105,110,105,116,32,37,99,58,32,115,101,99,116,111,114,32,115,105,122,101,32,116,111,111,32,98,105,103,10,0,0,0,47,101,116,99,47,100,101,102,97,117,108,116,47,109,116,111,111,108,115,0,49,54,48,107,0,0,0,0,67,97,110,39,116,32,99,111,110,110,101,99,116,32,116,111,32,102,108,111,112,112,121,100,32,115,101,114,118,101,114,32,111,110,32,37,115,44,32,112,111,114,116,32,37,105,32,40,37,115,41,33,0,0,0,0,70,97,116,32,112,114,111,98,108,101,109,32,119,104,105,108,101,32,100,101,99,111,100,105,110,103,32,37,100,32,37,120,10,0,0,0,78,111,32,102,114,101,101,32,99,108,117,115,116,101,114,32,37,100,32,37,100,10,0,0,80,105,112,101,32,114,101,97,100,32,101,114,114,111,114,0,105,58,101,102,112,113,114,119,120,117,104,0,49,56,48,107,0,0,0,0,105,58,104,111,58,0,0,0,105,58,104,0,51,50,48,107,0,0,0,0,73,110,116,101,114,110,97,108,32,101,114,114,111,114,44,32,100,105,114,116,121,32,101,110,100,32,116,111,111,32,98,105,103,32,100,105,114,116,121,95,101,110,100,61,37,120,32,99,117,114,95,115,105,122,101,61,37,120,32,108,101,110,61,37,120,32,111,102,102,115,101,116,61,37,100,32,115,101,99,116,111,114,83,105,122,101,61,37,120,10,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,118,102,97,116,95,108,111,111,107,117,112,32,91,48,93,10,0,51,54,48,107,0,0,0,0,105,110,105,116,58,32,115,101,116,32,100,101,102,97,117,108,116,32,112,97,114,97,109,115,0,0,0,0,100,111,117,98,108,101,45,100,101,110,115,105,116,121,45,53,45,49,47,52,0,0,0,0,45,45,118,101,114,115,105,111,110,0,0,0,100,100,53,49,52,0,0,0,32,32,115,116,97,114,116,58,0,0,0,0,67,97,110,110,111,116,32,109,111,118,101,32,100,105,114,101,99,116,111,114,121,32,0,0,55,50,48,107,0,0,0,0,112,114,105,109,97,114,121,0,37,48,50,120,32,0,0,0,80,97,114,116,105,116,105,111,110,32,37,100,32,105,115,32,110,111,116,32,97,108,105,103,110,101,100,10,0,0,0,0,100,111,117,98,108,101,45,100,101,110,115,105,116,121,45,51,45,49,47,50,0,0,0,0,99,121,108,105,110,100,101,114,115,58,32,37,100,10,10,0,79,110,108,121,32,115,101,99,116,111,114,32,115,105,122,101,115,32,111,102,32,53,49,50,44,32,49,48,50,52,44,32,50,48,52,56,32,111,114,32,52,48,57,54,32,98,121,116,101,115,32,97,114,101,32,97,108,108,111,119,101,100,10,0,100,100,51,49,50,0,0,0,37,115,58,32,34,37,115,34,32,105,115,32,114,101,97,100,32,111,110,108,121,44,32,101,114,97,115,101,32,97,110,121,119,97,121,32,40,121,47,110,41,32,63,32,0,0,0,0,105,58,118,68,58,111,104,0,84,104,105,115,32,99,111,109,109,97,110,100,32,105,115,32,111,110,108,121,32,97,118,97,105,108,97,98,108,101,32,102,111,114,32,76,73,78,85,88,32,10,0,0,70,105,108,101,32,34,37,115,34,32,116,111,111,32,98,105,103,10,0,0,37,49,49,46,49,49,115,0,49,46,52,52,109,0,0,0,32,9,0,0,109,97,116,116,114,105,98,32,0,0,0,0,105,58,68,58,111,104,0,0,47,101,116,99,47,109,116,111,111,108,115,0,104,105,103,104,45,100,101,110,115,105,116,121,45,51,45,49,47,50,0,0,67,97,110,39,116,32,111,112,101,110,32,114,101,109,111,116,101,32,100,114,105,118,101,58,32,37,115,0,47,0,0,0,66,97,100,32,70,65,84,32,101,110,116,114,121,32,37,100,32,97,116,32,37,100,10,0,101,99,104,111,32,37,115,0,104,100,51,49,50,0,0,0,49,46,50,109,0,0,0,0,78,111,116,104,105,110,103,32,108,101,102,116,10,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,100,105,114,95,119,114,105,116,101,10,0,0,0,104,105,103,104,45,100,101,110,115,105,116,121,45,53,45,49,47,52,0,0,117,110,107,110,111,119,110,0,104,100,53,49,52,0,0,0,45,86,0,0,117,110,114,101,99,111,103,110,105,122,101,100,32,107,101,121,119,111,114,100,0,0,0,0,32,32,97,99,116,105,118,101,61,37,120,10,0,0,0,0,69,97,115,121,44,32,105,115,110,39,116,32,105,116,63,32,73,32,119,111,110,100,101,114,32,119,104,121,32,68,79,83,32,99,97,110,39,116,32,100,111,32,116,104,105,115,46,10,0,0,0,0,67,97,110,110,111,116,32,99,114,101,97,116,101,32,101,110,116,114,121,32,110,97,109,101,100,32,46,32,111,114,32,46,46,10,0,0,37,115,58,32,67,97,110,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,100,114,105,118,101,10,0,0,0,0,100,114,105,118,101,32,108,101,116,116,101,114,32,101,120,112,101,99,116,101,100,0,0,0,78,101,119,32,37,115,32,110,97,109,101,32,102,111,114,32,34,37,115,34,58,32,0,0,37,48,51,120,32,32,0,0,99,108,101,97,114,95,100,114,105,118,101,0,104,101,97,100,115,58,32,37,100,10,0,0,97,114,103,115,115,105,122,101,32,109,117,115,116,32,98,101,32,108,101,115,115,32,116,104,97,110,32,54,10,0,0,0,85,115,97,103,101,58,32,37,115,58,32,109,115,100,111,115,100,105,114,101,99,116,111,114,121,10,0,0,43,100,114,105,118,101,0,0,82,101,109,111,118,105,110,103,32,0,0,0,67,97,110,39,116,32,115,116,97,116,32,115,111,117,114,99,101,32,102,105,108,101,10,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,0,99,121,99,108,101,115,58,32,37,105,44,32,111,100,97,116,115,58,32,37,105,44,37,105,44,37,105,10,0,0,0,0,32,32,32,32,32,32,32,45,119,32,119,114,105,116,101,32,111,110,32,100,101,118,105,99,101,32,101,108,115,101,32,114,101,97,100,10,0,0,0,0,100,114,105,118,101,43,0,0,67,111,117,108,100,32,110,111,116,32,111,112,101,110,32,37,115,32,40,37,115,41,10,0,37,115,58,32,70,105,108,101,32,34,37,115,34,32,110,111,116,32,102,111,117,110,100,10,0,0,0,0,67,97,110,39,116,32,115,101,116,32,100,105,115,107,32,112,97,114,97,109,101,116,101,114,115,32,102,111,114,32,37,99,0,0,0,0,47,117,115,114,47,108,111,99,97,108,47,101,116,99,47,109,116,111,111,108,115,46,99,111,110,102,0,0,100,114,105,118,101,0,0,0,65,117,116,104,32,102,97,105,108,101,100,58,32,73,47,79,32,69,114,114,111,114,0,0,37,108,117,0,97,108,108,111,99,32,102,97,116,32,109,97,112,0,0,0,36,42,40,41,123,125,91,93,92,63,96,126,0,0,0,0,101,110,116,114,121,45,62,98,101,103,105,110,83,108,111,116,32,61,61,32,98,101,103,105,110,83,108,111,116,0,0,0,80,79,83,73,88,76,89,95,67,79,82,82,69,67,84,0,105,110,32,102,105,108,101,32,37,115,58,32,37,115,10,0,99,111,108,117,109,110,32,37,108,100,32,0,87,101,105,114,100,58,32,114,101,97,100,32,115,105,122,101,32,40,37,100,41,32,110,111,116,32,97,32,109,117,108,116,105,112,108,101,32,111,102,32,115,101,99,116,111,114,32,115,105,122,101,32,40,37,100,41,10,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,118,93,32,100,114,105,118,101,10,0,0,0,65,116,116,101,109,112,116,32,116,111,32,119,114,105,116,101,32,114,111,111,116,32,100,105,114,101,99,116,111,114,121,32,112,111,105,110,116,101,114,10,0,0,0,0,102,111,114,32,100,114,105,118,101,32,37,99,58,32,0,0,112,108,97,105,110,32,102,108,111,112,112,121,58,32,100,101,118,105,99,101,32,34,37,115,34,32,98,117,115,121,32,40,37,115,41,58,0,0,0,0,105,58,118,104,0,0,0,0,83,121,110,116,97,120,32,101,114,114,111,114,32,97,116,32,108,105,110,101,32,37,100,32,0,0,0,0,109,116,111,111,108,115,0,0,108,97,115,116,32,97,108,108,111,99,97,116,101,100,32,99,108,117,115,116,101,114,61,37,117,10,0,0,85,115,97,103,101,58,32,37,115,32,102,105,108,101,115,10,0,0,0,0,87,97,114,110,105,110,103,58,32,112,114,105,118,105,108,101,103,101,100,32,102,108,97,103,32,105,103,110,111,114,101,100,32,102,111,114,32,100,114,105,118,101,32,37,99,58,32,100,101,102,105,110,101,100,32,105,110,32,102,105,108,101,32,37,115,10,0,0,109,122,105,112,0,0,0,0,32,104,61,37,100,32,115,61,37,100,32,99,61,37,100,10,0,0,0,0,80,97,114,116,105,116,105,111,110,32,37,100,10,0,0,0,102,114,101,101,32,99,108,117,115,116,101,114,115,61,37,117,10,0,0,0,32,68,105,114,101,99,116,111,114,121,32,104,97,115,32,110,111,32,112,97,114,101,110,116,32,101,110,116,114,121,10,0,67,111,117,108,100,32,110,111,116,32,111,112,101,110,32,84,97,114,103,101,116,10,0,0,66,111,116,104,32,99,108,101,97,114,32,97,110,100,32,110,101,119,32,108,97,98,101,108,32,115,112,101,99,105,102,105,101,100,10,0,105,102,32,121].concat([111,117,32,115,117,112,112,108,121,32,97,32,103,101,111,109,101,116,114,121,44,32,121,111,117,32,97,108,115,111,32,109,117,115,116,32,115,117,112,112,108,121,32,111,110,101,32,111,102,32,116,104,101,32,96,109,102,111,114,109,97,116,95,111,110,108,121,39,32,111,114,32,96,102,105,108,116,101,114,39,32,102,108,97,103,115,0,0,109,119,114,105,116,101,0,0,85,115,97,103,101,58,32,37,115,32,91,45,112,114,97,100,99,118,93,32,91,45,73,93,32,91,45,66,32,98,111,111,116,115,101,99,116,45,116,101,109,112,108,97,116,101,93,32,91,45,115,32,115,101,99,116,111,114,115,93,32,91,45,116,32,99,121,108,105,110,100,101,114,115,93,32,91,45,104,32,104,101,97,100,115,93,32,91,45,84,32,116,121,112,101,93,32,91,45,98,32,98,101,103,105,110,93,32,91,45,108,32,108,101,110,103,116,104,93,32,100,114,105,118,101,10,0,0,102,105,108,101,32,105,115,32,114,101,97,100,32,111,110,108,121,44,32,111,118,101,114,119,114,105,116,101,32,97,110,121,119,97,121,32,40,121,47,110,41,32,63,32,0,0,0,0,115,105,103,110,97,116,117,114,101,61,48,120,37,48,56,120,10,0,0,0,37,115,58,10,0,0,0,0,105,110,99,111,109,112,108,101,116,101,32,103,101,111,109,101,116,114,121,58,32,101,105,116,104,101,114,32,105,110,100,105,99,97,116,101,32,97,108,108,32,111,102,32,116,114,97,99,107,47,104,101,97,100,115,47,115,101,99,116,111,114,115,32,111,114,32,110,111,110,101,32,111,102,32,116,104,101,109,0,115,101,99,116,111,114,115,32,112,101,114,32,116,114,97,99,107,58,32,37,100,10,0,0,109,116,121,112,101,0,0,0,70,108,97,103,32,37,99,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,109,116,111,111,108,115,10,0,0,0,0,85,115,97,103,101,58,32,91,45,98,93,32,37,115,32,102,105,108,101,32,102,97,116,10,0,0,0,0,109,105,115,115,105,110,103,32,102,105,108,101,110,97,109,101,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,37,115,32,98,121,116,101,115,32,102,114,101,101,10,10,0,0,0,109,116,111,111,108,115,116,101,115,116,0,0,77,84,79,79,76,83,95,68,73,82,95,76,69,78,0,0,67,97,110,110,111,116,32,114,101,109,111,118,101,32,114,111,111,116,32,100,105,114,101,99,116,111,114,121,10,0,0,0,83,101,99,116,111,114,32,119,114,105,116,116,101,110,0,0,66,111,111,116,32,115,101,99,116,111,114,32,104,101,120,100,117,109,112,0,66,97,100,32,116,97,114,103,101,116,32,37,115,10,0,0,109,99,100,58,32,67,97,110,39,116,32,111,112,101,110,32,109,99,119,100,32,46,102,105,108,101,32,102,111,114,32,119,114,105,116,105,110,103,10,0,85,115,97,103,101,58,32,109,99,97,116,32,91,45,86,93,32,91,45,119,93,32,100,101,118,105,99,101,10,0,0,0,105,58,97,115,104,0,0,0,109,115,104,111,114,116,110,97,109,101,0,0,85,115,97,103,101,58,32,37,115,32,91,45,86,93,32,91,45,113,93,32,91,45,101,93,32,91,45,117,93,32,91,45,114,124,45,119,124,45,112,124,45,120,93,32,91,100,114,105,118,101,58,93,10,9,45,113,32,112,114,105,110,116,32,115,116,97,116,117,115,10,9,45,101,32,101,106,101,99,116,32,100,105,115,107,10,9,45,102,32,101,106,101,99,116,32,100,105,115,107,32,101,118,101,110,32,119,104,101,110,32,109,111,117,110,116,101,100,10,9,45,114,32,119,114,105,116,101,32,112,114,111,116,101,99,116,101,100,32,40,114,101,97,100,45,111,110,108,121,41,10,9,45,119,32,110,111,116,32,119,114,105,116,101,45,112,114,111,116,101,99,116,101,100,32,40,114,101,97,100,45,119,114,105,116,101,41,10,9,45,112,32,112,97,115,115,119,111,114,100,32,119,114,105,116,101,32,112,114,111,116,101,99,116,101,100,10,9,45,120,32,112,97,115,115,119,111,114,100,32,112,114,111,116,101,99,116,101,100,10,9,45,117,32,117,110,112,114,111,116,101,99,116,32,116,105,108,108,32,100,105,115,107,32,101,106,101,99,116,105,110,103,10,0,0,0,0,69,114,114,111,114,32,119,114,105,116,105,110,103,32,112,97,114,116,105,116,105,111,110,32,116,97,98,108,101,0,0,0,114,101,97,100,32,98,111,111,116,32,115,101,99,116,111,114,0,0,0,0,67,97,110,39,116,32,115,101,116,32,100,105,115,107,32,112,97,114,97,109,101,116,101,114,115,32,102,111,114,32,37,99,58,32,37,115,0,0,0,0,105,58,98,111,58,115,58,104,0,0,0,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,97,108,114,101,97,100,121,32,115,101,116,32,40,37,112,41,33,10,0,0,47,101,116,99,47,100,101,102,97,117,108,116,47,109,116,111,111,108,115,46,99,111,110,102,0,0,0,0,65,117,116,104,32,102,97,105,108,101,100,58,32,68,101,118,105,99,101,32,108,111,99,107,101,100,65,117,116,104,32,102,97,105,108,101,100,58,32,66,97,100,32,112,97,99,107,101,116,0,0,0,109,115,104,111,119,102,97,116,0,0,0,0,77,116,111,111,108,115,32,118,101,114,115,105,111,110,32,37,115,44,32,100,97,116,101,100,32,37,115,10,0,0,0,0,87,114,105,116,105,110,103,32,115,101,99,116,111,114,0,0,84,114,111,117,98,108,101,32,105,110,105,116,105,97,108,105,122,105,110,103,32,97,32,70,65,84,32,115,101,99,116,111,114,10,0,0,32,32,32,32,32,32,32,37,115,58,32,91,45,86,93,32,91,45,119,93,32,91,45,97,93,32,91,45,98,93,32,91,45,115,93,32,91,45,102,93,32,109,115,100,111,115,102,105,108,101,32,91,109,115,100,111,115,102,105,108,101,115,46,46,46,93,10,0,100,105,114,67,97,99,104,101,46,99,0,0,83,104,111,114,116,32,119,114,105,116,101,32,37,100,32,105,110,115,116,101,97,100,32,111,102,32,37,100,10,0,0,0,68,69,70,65,85,76,84,95,67,79,68,69,80,65,71,69,0,0,0,0,109,114,101,110,0,0,0,0,115,109,98,102,115,0,0,0,82,101,116,114,121,32,119,105,116,104,32,116,104,101,32,45,102,32,115,119,105,116,99,104,32,116,111,32,103,111,32,97,104,101,97,100,32,97,110,121,119,97,121,115,10,0,0,0,98,97,99,107,117,112,32,98,111,111,116,32,115,101,99,116,111,114,61,37,100,10,0,0,85,115,97,103,101,58,32,37,115,58,32,91,45,86,93,32,91,45,119,93,32,91,45,97,93,32,91,45,98,93,32,91,45,115,93,32,91,45,102,93,32,109,115,100,111,115,100,105,114,101,99,116,111,114,121,10,0,0,0,0,77,84,79,79,76,83,95,68,65,84,69,95,83,84,82,73,78,71,0,0,98,117,102,102,101,114,95,102,108,117,115,104,58,32,115,104,111,114,116,32,119,114,105,116,101,10,0,0,109,109,111,118,101,0,0,0,112,114,111,99,0,0,0,0,105,110,99,111,110,115,105,115,116,101,110,99,121,32,100,101,116,101,99,116,101,100,33,10,0,0,0,0,105,110,102,111,83,101,99,116,111,114,32,108,111,99,97,116,105,111,110,61,37,100,10,0,85,115,97,103,101,58,32,37,115,32,91,45,86,93,32,91,45,116,32,116,114,97,99,107,115,93,32,91,45,104,32,104,101,97,100,115,93,32,91,45,110,32,115,101,99,116,111,114,115,93,32,91,45,118,32,108,97,98,101,108,93,32,91,45,49,93,32,91,45,52,93,32,91,45,56,93,32,91,45,102,32,115,105,122,101,93,32,91,45,78,32,115,101,114,105,97,108,110,117,109,98,101,114,93,32,91,45,107,93,32,91,45,66,32,98,111,111,116,115,101,99,116,111,114,93,32,91,45,114,32,114,111,111,116,95,100,105,114,95,108,101,110,93,32,91,45,76,32,102,97,116,95,108,101,110,93,32,91,45,70,93,32,91,45,73,32,102,115,86,101,114,115,105,111,110,93,32,91,45,67,93,32,91,45,99,32,99,108,117,115,116,101,114,95,115,105,122,101,93,32,91,45,72,32,104,105,100,100,101,110,95,115,101,99,116,111,114,115,93,32,91,45,83,32,104,97,114,100,115,101,99,116,111,114,115,105,122,101,93,32,91,45,77,32,115,111,102,116,115,101,99,116,111,114,115,105,122,101,93,32,91,45,51,93,32,91,45,50,32,116,114,97,99,107,48,115,101,99,116,111,114,115,93,32,91,45,48,32,114,97,116,101,48,93,32,91,45,65,32,114,97,116,101,97,110,121,93,32,91,45,97,93,100,101,118,105,99,101,10,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,10,0,0,0,0,77,84,79,79,76,83,95,84,87,69,78,84,89,95,70,79,85,82,95,72,79,85,82,95,67,76,79,67,75,0,0,0,109,114,101,97,100,0,0,0,37,115,58,32,99,97,110,39,116,32,111,112,101,110,32,37,115,46,10,0,85,115,117,97,108,108,121,44,32,97,32,100,105,115,107,32,115,104,111,117,108,100,32,104,97,118,101,32,101,120,97,99,116,108,121,32,111,110,101,32,97,99,116,105,118,101,32,112,97,114,116,105,116,105,111,110,10,0,0,0,114,111,111,116,67,108,117,115,116,101,114,61,37,117,10,0,45,99,0,0,67,97,110,39,116,32,115,116,97,116,32,37,115,58,32,37,115,0,0,0,77,84,79,79,76,83,95,68,79,84,84,69,68,95,68,73,82,0,0,0,109,114,100,0,87,97,114,110,105,110,103,58,32,37,100,32,97,99,116,105,118,101,32,40,98,111,111,116,97,98,108,101,41,32,112,97,114,116,105,116,105,111,110,115,32,112,114,101,115,101,110,116,10,0,0,0,70,83,32,118,101,114,115,105,111,110,61,48,120,37,48,52,120,10,0,0,68,101,118,105,99,101,32,116,111,111,32,98,105,103,32,102,111,114,32,97,32,37,100,32,98,105,116,32,70,65,84,10,0,0,0,0,10,32,86,111,108,117,109,101,32,83,101,114,105,97,108,32,78,117,109,98,101,114,32,105,115,32,37,48,52,108,88,45,37,48,52,108,88,0,0,0,77,84,79,79,76,83,95,78,65,77,69,95,78,85,77,69,82,73,67,95,84,65,73,76,0,0,0,0,109,112,97,114,116,105,116,105,111,110,0,0,47,101,116,99,47,109,116,97,98,0,0,0,87,97,114,110,105,110,103,58,32,110,111,32,97,99,116,105,118,101,32,40,98,111,111,116,97,98,108,101,41,32,112,97,114,116,105,116,105,111,110,32,112,114,101,115,101,110,116,10,0,0,0,0,69,110,100,32,112,111,115,105,116,105,111,110,32,109,105,115,109,97,116,99,104,32,102,111,114,32,112,97,114,116,105,116,105,111,110,32,37,100,10,0,69,120,116,101,110,100,101,100,32,102,108,97,103,115,61,48,120,37,48,52,120,10,0,0,67,111,110,116,114,97,100,105,99,116,105,111,110,32,98,101,116,119,101,101,110,32,70,65,84,32,115,105,122,101,32,111,110,32,99,111,109,109,97,110,100,32,108,105,110,101,32,97,110,100,32,70,65,84,32,115,105,122,101,32,105,110,32,99,111,110,102,32,102,105,108,101,10,0,0,0,32,86,111,108,117,109,101,32,105,110,32,100,114,105,118,101,32,37,99,32,105,115,32,37,115,0,0,0,46,46,0,0,32,32,32,32,32,32,32,37,115,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,102,105,108,101,32,91,102,105,108,101,115,46,46,46,93,32,116,97,114,103,101,116,95,100,105,114,101,99,116,111,114,121,10,0,0,0,76,97,98,101,108,32,116,111,111,32,108,111,110,103,10,0,77,84,79,79,76,83,95,82,65,84,69,95,65,78,89,0,109,109,111,117,110,116,0,0,37,115,58,32,115,116,97,116,40,37,115,41,32,102,97,105,108,101,100,58,32,37,115,46,10,0,0,0,80,97,114,116,105,116,105,111,110,32,37,100,32,101,120,99,101,101,100,115,32,98,101,121,111,110,100,32,101,110,100,32,111,102,32,100,105,115,107,10,0,0,0,0,46,32,0,0,66,105,103,32,102,97,116,108,101,110,61,37,117,10,0,0,73,110,116,101,114,110,97,108,32,101,114,114,111,114,32,119,104,105,108,101,32,99,97,108,99,117,108,97,116,105,110,103,32,99,108,117,115,116,101,114,32,115,105,122,101,10,0,0,32,86,111,108,117,109,101,32,105,110,32,100,114,105,118,101,32,37,99,32,105,115,32,37,115,32,40,97,98,98,114,61,37,115,41,0,87,97,114,110,105,110,103,58,32,34,37,115,34,32,105,115,32,111,117,116,32,111,102,32,100,97,116,101,44,32,114,101,109,111,118,105,110,103,32,105,116,10,0,0,77,84,79,79,76,83,95,82,65,84,69,95,48,0,0,0,102,105,108,101,110,97,109,101,61,34,37,115,34,10,0,0,109,109,100,0,115,116,97,116,117,115,58,32,0,0,0,0,109,112,97,114,116,105,116,105,111,110,32,45,99,32,45,116,32,37,100,32,45,104,32,37,100,32,45,115,32,37,100,32,45,98,32,37,117,32,37,99,58,10,0,0,100,105,115,107,32,116,121,112,101,61,34,37,56,46,56,115,34,10,0,0,78,111,116,32,101,110,111,117,103,104,32,115,101,99,116,111,114,115,10,0,32,86,111,108,117,109,101,32,105,110,32,100,114,105,118,101,32,37,99,32,104,97,115,32,110,111,32,108,97,98,101,108,0,0,0,0,66,97,100,32,115,105,122,101,32,37,115,10,0,0,0,0,32,37,100,10,0,0,0,0,105,58,97,98,66,47,115,112,116,84,110,109,118,81,68,58,111,104,0,0,77,84,79,79,76,83,95,78,79,95,86,70,65,84,0,0,70,97,116,32,101,114,114,111,114,10,0,0,109,108,97,98,101,108,0,0,32,110,111,110,32,101,109,112,116,121,10,0,84,104,101,32,102,111,108,108,111,119,105,110,103,32,99,111,109,109,97,110,100,32,119,105,108,108,32,114,101,99,114,101,97,116,101,32,116,104,101,32,112,97,114,116,105,116,105,111,110,32,102,111,114,32,100,114,105,118,101,32,37,99,58,10,0,0,0,0,100,105,115,107,32,108,97,98,101,108,61,34,37,49,49,46,49,49,115,34,10,0,0,0,66,97,100,32,102,97,116,32,115,105,122,101,10,0,0,0,10,68,105,114,101,99,116,111,114,121,32,102,111,114,32,37,115,10,0,0,119,0,0,0,77,84,79,79,76,83,95,83,75,73,80,95,67,72,69,67,75,0,0,0,101,110,100,32,111,102,32,102,105,108,101,32,105,110,32,102,105,108,101,95,114,101,97,100,10,0,0,0,109,105,110,102,111,0,0,0,85,110,107,110,111,119,110,32,115,105,122,101,10,0,0,0,115,101,114,105,97,108,32,110,117,109,98,101,114,58,32,37,48,56,88,10,0,0,0,0,83,101,118,101,114,97,108,32,102,105,108,101,32,110,97,109,101,115,32,103,105,118,101,110,44,32,98,117,116,32,108,97,115,116,32,97,114,103,117,109,101,110,116,32,40,37,115,41,32,110,111,116,32,97,32,100,105,114,101,99,116,111,114,121,10,0,0,0,70,115,45,62,110,117,109,95,99,108,117,115,32,61,61,32,40,114,101,97,108,95,114,101,109,95,115,101,99,116,32,45,32,70,115,45,62,110,117,109,95,102,97,116,32,42,32,70,115,45,62,102,97,116,95,108,101,110,41,32,47,32,70,115,45,62,99,108,117,115,116,101,114,95,115,105,122,101,0,0,109,109,0,0,105,110,105,116,32,37,99,58,32,110,111,110,32,68,79,83,32,109,101,100,105,97,0,0,77,84,79,79,76,83,95,70,65,84,95,67,79,77,80,65,84,73,66,73,76,73,84,89,0,0,0,0,65,117,116,104,32,102,97,105,108,101,100,58,32,87,114,111,110,103,32,116,114,97,110,115,109,105,115,115,105,111,110,32,112,114,111,116,111,99,111,108,32,118,101,114,115,105,111,110,0,0,0,0,47,101,116,99,47,109,116,111,111,108,115,46,99,111,110,102,0,0,0,0,109,102,111,114,109,97,116,0,115,116,111,112,32,109,111,116,111,114,58,32,0,0,0,0,115,101,99,116,111,114,115,58,32,37,100,32,104,101,97,100,115,58,32,37,100,32,37,100,10,0,0,0,60,37,108,117,0,0,0,0,84,114,121,105,110,103,32,116,111,32,114,101,109,111,118,101,32,46,32,111,114,32,46,46,32,101,110,116,114,121,10,0,100,111,115,52,61,48,120,37,120,10,0,0,40,40,70,115,45,62,110,117,109,95,99,108,117,115,43,50,41,32,42,32,102,97,116,95,110,121,98,98,108,101,115,41,32,60,61,32,40,70,115,45,62,102,97,116,95,108,101,110,42,70,115,45,62,115,101,99,116,111,114,95,115,105,122,101,42,50,41,0,97,108,108,111,99,32,102,97,116,32,115,101,99,116,111,114,32,98,117,102,102,101,114,0,100,100,0,0,66,97,100,32,115,108,111,116,115,32,37,100,32,37,100,32,105,110,32,102,114,101,101,32,114,97,110,103,101,10,0,0,119,114,105,116,101,32,105,110,32,99,111,112,121,0,0,0,77,84,79,79,76,83,95,76,79,87,69,82,95,67,65,83,69,0,0,0,109,100,117,0,100,111,111,114,32,117,110,108,111,99,107,58,32,0,0,0,85,115,101,32,116,104,101,32,45,114,32,102,108,97,103,32,116,111,32,114,101,109,111,118,101,32,105,116,32,98,101,102,111,114,101,32,97,116,116,101,109,112,116,105,110,103,32,116,111,32,114,101,99,114,101,97,116,101,32,105,116,10,0,0,114,101,115,101,114,118,101,100,61,48,120,37,120,10,0,0,32,116,111,32,37,100,32,105,110,32,111,114,100,101,114,32,116,111,32,116,97,107,101,32,117,112,32,101,120,99,101,115,115,32,99,108,117,115,116,101,114,32,97,114,101,97,10,0,121,121,0,0,109,116,111,111,108,115,95,108,111,119,101,114,95,99,97,115,101,61,37,100,10,0,0,0,98,117,102,102,101,114,95,102,108,117,115,104,58,32,119,114,105,116,101,0,109,100,111,99,116,111,114,102,97,116,0,0,80,97,114,116,105,116,105,111,110,32,102,111,114,32,100,114,105,118,101,32,37,99,58,32,97,108,114,101,97,100,121,32,101,120,105,115,116,115,10,0,112,104,121,115,105,99,97,108,32,100,114,105,118,101,32,105,100,58,32,48,120,37,120,10,0,0,0,0,71,114,111,119,105,110,103,32,102,97,116,32,115,105,122,101,32,102,114,111,109,32,37,100,0,0,0,0,121,121,121,121,0,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,100,93,32,100,114,105,118,101,58,10,0,0,67,111,117,108,100,32,110,111,116,32,99,104,100,105,114,32,98,97,99,107,32,116,111,32,46,46,0,0,109,116,111,111,108,115,95,115,107,105,112,95,99,104,101,99,107,61,37,100,10,0,0,0,109,100,105,114,0,0,0,0,85,115,101,32,116,104,101,32,45,102,32,102,108,97,103,32,116,111,32,114,101,109,111,118,101,32,105,116,32,97,110,121,119,97,121,115,10,0,0,0,32,32,32,32,0,0,0,0,98,105,103,32,115,105,122,101,58,32,37,100,32,115,101,99,116,111,114,115,10,0,0,0,115,104,0,0,83,108,97,99,107,61,37,100,10,0,0,0,37,48,50,100,0,0,0,0,67,97,110,39,116,32,111,112,101,110,32,37,115,58,32,37,115,0,0,0,77,84,79,79,52,48,49,56,0,0,0,0,105,58,115,58,99,119,83,58,69,58,0,0,109,116,111,111,108,115,95,102,97,116,95,99,111,109,112,97,116,105,98,105,108,105,116,121,61,37,100,10,0,0,0,0,109,100,101,108,116,114,101,101,0,0,0,0,80,97,114,116,105,116,105,111,110,32,102,111,114,32,100,114,105,118,101,32,37,99,58,32,109,97,121,32,98,101,32,97,110,32,101,120,116,101,110,100,101,100,32,112,97,114,116,105,116,105,111,110,10,0,0,0,32,32,32,32,32,0,0,0,101,110,95,85,83,0,0,0,104,105,100,100,101,110,32,115,101,99,116,111,114,115,58,32,37,100,10,0,114,101,109,95,115,101,99,116,32,62,61,32,70,115,45,62,110,117,109,95,99,108,117,115,32,42,32,70,115,45,62,99,108,117,115,116,101,114,95,115,105,122,101,32,43,32,70,115,45,62,102,97,116,95,108,101,110,32,42,32,70,115,45,62,110,117,109,95,102,97,116,0,37,48,52,100,0,0,0,0,67,97,110,39,116,32,99,104,97,110,103,101,32,115,116,97,116,117,115,32,111,102,47,101,106,101,99,116,32,109,111,117,110,116,101,100,32,100,101,118,105,99,101,10,0,0,0,0,85,115,97,103,101,58,32,37,115,32,109,115,100,111,115,102,105,108,101,32,91,109,115,100,111,115,102,105,108,101,115,46,46,46,93,10,0,0,0,0,9,112,114,101,99,109,100,61,37,115,10,0,109,100,101,108,0,0,0,0,105,58,47,97,104,114,115,65,72,82,83,88,112,0,0,0,80,97,114,116,105,116,105,111,110,32,102,111,114,32,100,114,105,118,101,32,37,99,58,32,100,111,101,115,32,110,111,116,32,101,120,105,115,116,10,0,76,80,84,0,83,116,97,114,116,32,112,111,115,105,116,105,111,110,32,109,105,115,109,97,116,99,104,32,102,111,114,32,112,97,114,116,105,116,105,111,110,32,37,100,10,0,0,0,115,101,99,116,111,114,115,32,112,101,114,32,102,97,116,58,32,37,100,10,0,0,0,0,84,111,111,32,102,101,119,32,99,108,117,115,116,101,114,115,32,102,111,114,32,116,104,105,115,32,102,97,116,32,115,105,122,101,46,32,80,108,101,97,115,101,32,99,104,111,111,115,101,32,97,32,49,54,45,98,105,116,32,102,97,116,32,105,110,32,121,111,117,114,32,47,101,116,99,47,109,116,111,111,108,115,46,99,111,110,102,32,111,114,32,46,109,116,111,111,108,115,114,99,32,102,105,108,101,10,0,0,37,50,100,58,37,48,50,100,37,99,0,0,58,47,0,0,97,109,117,70,111,114,109,97,116,46,115,104,0,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,102,105,108,101,32,116,97,114,103,101,116,102,105,108,101,10,0,0,0,0,37,115,32,110,111,116,32,97,32,118,97,108,105,100,32,115,101,114,105,97,108,32,110,117,109,98,101,114,10,0,0,0,101,120,99,108,117,115,105,118,101,32,0,0,109,99,111,112,121,0,0,0,68,114,105,118,101,32,39,37,99,58,39,32,105,115,32,110,111,116,32,119,114,105,116,101,45,112,114,111,116,101,99,116,101,100,10,0,85,115,101,32,116,104,101,32,45,73,32,102,108,97,103,32,116,111,32,105,110,105,116,105,97,108,105,122,101,32,116,104,101,32,112,97,114,116,105,116,105,111,110,32,116,97,98,108,101,44,32,97,110,100,32,115,101,116,32,116,104,101,32,98,111,111,116,32,115,105,103,110,97,116,117,114,101,10,0,0,73,110,116,101,114,110,97,108,32,101,114,114,111,114,58,32,99,108,97,115,104,95,97,99,116,105,111,110,61,37,100,10,0,0,0,0,67,79,77,0,109,101,100,105,97,32,100,101,115,99,114,105,112,116,111,114,32,98,121,116,101,58,32,48,120,37,120,10,0,0,0,0,32,116,111,32,37,100,10,0,37,115,47,37,115,0,0,0,32,32,32,32,32,32,32,37,115,32,91,45,115,112,97,116,110,109,81,86,66,84,93,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,115,111,117,114,99,101,102,105,108,101,32,91,115,111,117,114,99,101,102,105,108,101,115,46,46,46,93,32,116,97,114,103,101,116,100,105,114,101,99,116,111,114,121,10,0,0,76,79,71,78,65,77,69,0,67,97,108,108,105,110,103,32,97,109,117,70,111,114,109,97,116,46,115,104,32,119,105,116,104,32,97,114,103,115,58,32,37,115,44,37,115,10,0,0,115,121,110,99,32,0,0,0,109,99,108,97,115,115,101,114,97,115,101,0,66,111,111,116,32,115,105,103,110,97,116,117,114,101,32,110,111,116,32,115,101,116,10,0,115,107,105,112,112,105,110,103,32,100,105,114,101,99,116,111,114,121,32,115,121,109,108,105,110,107,32,37,115,10,0,0,32,32,32,0,115,109,97,108,108,32,115,105,122,101,58,32,37,100,32,115,101,99,116,111,114,115,10,0,70,97,116,32,115,105,122,101,32,109,105,115,99,97,108,99,117,108,97,116,105,111,110,44,32,115,104,114,105,110,107,105,110,103,32,110,117,109,95,99,108,117,115,32,102,114,111,109,32,37,100,32,0,0,0,0,105,58,49,52,56,102,58,116,58,110,58,118,58,113,117,98,107,75,58,66,58,114,58,76,58,73,58,70,67,99,58,88,104,58,115,58,84,58,108,58,78,58,72,58,77,58,83,58,50,58,51,48,58,65,97,100,58,109,58,0,85,115,97,103,101,58,32,37,115,32,91,45,115,112,97,116,110,109,81,86,66,84,93,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,115,111,117,114,99,101,102,105,108,101,32,116,97,114,103,101,116,102,105,108,101,10,0,0,0,0,42,0,0,0,37,115,58,32,0,0,0,0,73,110,116,101,114,110,97,108,32,101,114,114,111,114,44,32,111,102,102,115,101,116,32,116,111,111,32,98,105,103,10,0,112,108,97,105,110,95,105,111,0,0,0,0,109,99,100,0,68,105,114,101,99,116,111,114,121,32,0,0,114,101,97,100,32,77,66,82,0,0,0,0,78,85,76,0,109,97,120,32,97,118,97,105,108,97,98,108,101,32,114,111,111,116,32,100,105,114,101,99,116,111,114,121,32,115,108,111,116,115,58,32,37,100,10,0,87,101,105,114,100,44,32,102,97,116,32,98,105,116,115,32,61,32,48,10,0,0,0,0,32,37,115,0,47,100,101,118,47,110,117,108,108,0,0,0,118,111,108,100,32,0,0,0,87,114,111,116,101,32,116,111,32,37,100,10,0,0,0,0,115,101,101,107,0,0,0,0,101,97,114,108,121,32,101,114,114,111,114,0,109,99,97,116,0,0,0,0,111,112,101,110,32,77,66,82,0,0,0,0,80,82,78,0,102,97,116,115,58,32,37,100,10,0,0,0,32,37,115,32,37,100,32,0,70,97,105,108,117,114,101,32,116,111,32,109,97,107,101,32,100,105,114,101,99,116,111,114,121,32,37,115,10,0,0,0,100,105,115,107,101,116,116,101,32,37,99,58,32,105,115,32,76,105,110,117,120,32,76,73,76,79,44,32,110,111,116,32,68,79,83,0,37,115,10,0,109,102,111,114,109,97,116,95,111,110,108,121,32,0,0,0,65,117,116,104,32,102,97,105,108,101,100,58,32,88,45,67,111,111,107,105,101,32,100,111,101,115,110,39,116,32,109,97,116,99,104,0,83,67,77,68,95,87,82,73,84,69,0,0,109,98,97,100,98,108,111,99,107,115,0,0,123,99,111,109,109,97,110,100,32,108,105,110,101,125,0,0,32,111,114,32,110,111,110,101,32,111,102,32,116,104,101,109,10,0,0,0,62,32,0,0,65,85,88,0,114,101,115,101,114,118,101,100,32,40,98,111,111,116,41,32,115,101,99,116,111,114,115,58,32,37,100,10,0,0,0,0,42,116,111,116,95,115,101,99,116,111,114,115,32,33,61,32,48,0,0,0,84,114,111,117,98,108,101,32,119,114,105,116,105,110,103,32,116,104,101,32,105,110,102,111,32,115,101,99,116,111,114,10,0,0,0,0,32,32,0,0,109,107,100,105,114,0,0,0,120,0,0,0,66,97,100,32,115,108,111,116,115,32,37,100,32,37,100,32,105,110,32,97,100,100,32,102,114,101,101,32,101,110,116,114,121,10,0,0,102,105,108,101,32,114,101,97,100,0,0,0,112,114,105,118,105,108,101,103,101,100,0,0,83,67,77,68,95,82,69,65,68,0,0,0,109,97,116,116,114,105,98,0,82,101,109,111,118,105,110,103,32,110,111,110,45,101,120,105,115,116,101,110,116,32,101,110,116,114,121,10,0,0,0,0,89,111,117,32,115,104,111,117,108,100,32,101,105,116,104,101,114,32,105,110,100,105,99,97,116,101,32,98,111,116,104,32,116,104,101,32,110,117,109,98,101,114,32,111,102,32,115,101,99,116,111,114,115,32,97,110,100,32,116,104,101,32,110,117,109,98,101,114,32,111,102,32,104,101,97,100,115,44,10,0,67,79,78,0,99,108,117,115,116,101,114,32,115,105,122,101,58,32,37,100,32,115,101,99,116,111,114,115,10,0,0,0,109,102,111,114,109,97,116,46,99,0,0,0,65,109,98,105,103,111,117,115,32,37,115,10,0,0,0,0,115,99,115,105,32,0,0,0,83,104,111,117,108,100,32,110,111,116,32,104,97,112,112,101,110,10,0,0,85,110,97,108,105,103,110,101,100,32,119,114,105,116,101,10,0,0,0,0,45,45,104,101,108,112,0,0,37,115,58,32,37,115,10,0,115,101,99,116,111,114,32,115,105,122,101,58,32,37,100,32,98,121,116,101,115,10,0,0,67,111,117,108,100,32,110,111,116,32,111,112,101,110,32,114,111,111,116,32,100,105,114,101,99,116,111,114,121,10,0,0,32,37,56,108,100,0,0,0,67,111,112,121,105,110,103,32,0,0,0,0,37,99,0,0,34,42,92,60,62,47,63,58,124,5,0,0,37,115,58,32,110,111,32,109,97,116,99,104,32,102,111,114,32,116,97,114,103,101,116,10,0,0,0,0,114,0,0,0,67,111,117,108,100,32,110,111,116,32,99,104,100,105,114,32,105,110,116,111,32,37,115,32,40,37,115,41,10,0,0,0,83,116,114,101,97,109,99,97,99,104,101,32,97,108,108,111,99,97,116,105,111,110,32,112,114,111,98,108,101,109,58,37,99,32,37,100,10,0,0,0,115,119,97,112,32,0,0,0,83,99,115,105,32,98,117,102,102,101,114,32,116,111,111,32,115,109,97,108,108,10,0,0,115,105,103,97,99,116,105,111,110,0,0,0,82,101,97,100,32,115,101,99,116,111,114,0,115,83,113,41,58,32,0,0,98,97,110,110,101,114,58,34,37,46,56,115,34,10,0,0,47,98,105,110,47,115,104,0,70,65,84,37,50,46,50,100,32,32,0,0,65,117,116,104,32,115,117,99,99,101,115,115,0,0,0,0,60,68,73,82,62,32,32,32,32,0,0,0,70,105,108,101,32,34,37,115,34,32,101,120,105,115,116,115,44,32,111,118,101,114,119,114,105,116,101,32,40,121,47,110,41,32,63,32,0,0,0,0,65,109,98,105,103,111,117,115,10,0,0,0,102,108,111,112,112,121,100,95,105,111,0,0,66,97,100,32,111,102,102,115,101,116,10,0,67,97,110,39,116,32,115,116,97,116,32,45,58,32,37,115,0,0,0,0,91,49,93,32,66,97,100,32,97,100,100,114,101,115,115,32,37,100,10,0,74,97,110,117,97,114,121,32,57,116,104,44,32,50,48,49,51,0,0,0,85,110,107,110,111,119,110,32,109,101,100,105,97,32,116,121,112,101,10,0,44,32,0,0,69,114,114,111,114,32,114,101,97,100,105,110,103,32,102,114,111,109,32,39,37,115,39,44,32,119,114,111,110,103,32,112,97,114,97,109,101,116,101,114,115,63,0,0,111,79,0,0,67,0,0,0,37,115,32,37,115,32,0,0,65,116,116,101,109,112,116,32,116,111,32,99,111,112,121,32,102,105,108,101,32,111,110,32,105,116,115,101,108,102,10,0,102,108,111,112,112,121,100,95,108,115,101,101,107,0,0,0,69,114,114,111,114,32,114,101,97,100,105,110,103,32,102,97,116,32,110,117,109,98,101,114,32,37,100,10,0,0,0,0,79,110,108,121,32,114,111,111,116,32,99,97,110,32,117,115,101,32,102,111,114,99,101,46,32,83,111,114,114,121,46,10,0,0,0,0,70,105,108,101,32,100,111,101,115,32,110,111,116,32,114,101,115,105,100,101,32,111,110,32,97,32,68,111,115,32,102,115,10,0,0,0,9,112,97,114,116,105,116,105,111,110,61,37,100,10,0,0,37,99,37,100,0,0,0,0,50,77,0,0,83,117,112,112,111,114,116,101,100,32,99,111,109,109,97,110,100,115,58,0,37,100,32,115,101,99,116,111,114,115,32,105,110,32,116,111,116,97,108,10,0,0,0,0,94,43,61,47,91,93,58,44,63,42,92,60,62,124,34,46,0,0,0,0,10,115,41,107,105,112,32,83,41,107,105,112,45,97,108,108,32,113,41,117,105,116,32,40,97,65,114,82,0,0,0,0,80,97,114,116,105,116,105,111,110,115,32,37,100,32,97,110,100,32,37,100,32,98,97,100,108,121,32,111,114,100,101,114,101,100,32,111,114,32,111,118,101,114,108,97,112,112,105,110,103,10,0,0,115,104,111,114,116,32,114,101,97,100,32,111,110,32,98,111,111,116,32,115,101,99,116,111,114,0,0,0,37,45,49,50,115,32,0,0,67,97,110,110,111,116,32,109,111,118,101,32,102,105,108,101,115,32,97,99,114,111,115,115,32,100,105,102,102,101,114,101,110,116,32,100,114,105,118,101,115,10,0,0,78,111,116,32,111,107,32,85,110,105,120,32,102,105,108,101,32,61,61,62,32,103,111,111,100,10,0,0,46,46,47,0,102,108,111,112,112,121,100,95,108,115,101,101,107,54,52,0,73,110,105,116,105,97,108,32,98,121,116,101,32,111,102,32,102,97,116,32,105,115,32,110,111,116,32,48,120,102,102,10,0,0,0,0,0,0,0,0,46,32,32,32,32,32,32,0,105,58,118,99,115,110,78,58,104,0,0,0,9,111,102,102,115,101,116,61,48,120,37,108,120,10,0,0,83,107,105,112,112,105,110,103,32,34,37,115,34,44,32,105,115,32,110,111,116,32,97,32,100,105,114,101,99,116,111,114,121,10,0,0,84,104,101,32,100,101,118,105,108,32,105,115,32,105,110,32,116,104,101,32,100,101,116,97,105,108,115,58,32,122,101,114,111,32,110,117,109,98,101,114,32,111,102,32,104,101,97,100,115,32,111,114,32,115,101,99,116,111,114,115,10,0,0,0,85,110,107,110,111,119,110,32,109,116,111,111,108,115,32,99,111,109,109,97,110,100,32,39,37,115,39,10,0,0,0,0,105,110,105,116,58,32,111,112,101,110,58,32,37,115,0,0,37,115,58,32,78,111,32,100,105,114,101,99,116,111,114,121,32,115,108,111,116,115,10,0,85,115,97,103,101,58,32,37,115,32,91,45,118,115,99,86,110,93,32,91,45,78,32,115,101,114,105,97,108,93,32,100,114,105,118,101,58,10,0,0,111,41,118,101,114,119,114,105,116,101,32,79,41,118,101,114,119,114,105,116,101,45,97,108,108,0,0,0,111,112,101,110,32,98,111,111,116,32,115,101,99,116,111,114,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,0,0,0,34,37,115,34,32,105,115,32,110,111,116,32,97,32,114,101,103,117,108,97,114,32,102,105,108,101,10,0,72,79,77,69,0,0,0,0,69,114,97,115,105,110,103,58,0,0,0,0,79,110,108,121,32,111,110,101,32,111,102,32,116,104,101,32,45,99,32,111,114,32,45,115,32,111,112,116,105,111,110,115,32,109,97,121,32,98,101,32,103,105,118,101,110,10,0,0,9,116,114,97,99,107,115,61,37,100,32,104,101,97,100,115,61,37,100,32,115,101,99,116,111,114,115,61,37,100,32,104,105,100,100,101,110,61,37,100,10,0,0,0,46,47,0,0,66,97,100,32,109,101,100,105,97,32,116,121,112,101,115,32,37,48,50,120,47,37,48,50,120,44,32,112,114,111,98,97,98,108,121,32,110,111,110,45,77,83,68,79,83,32,100,105,115,107,10,0,121,121,121,121,45,109,109,45,100,100,0,0,83,107,105,112,112,105,110,103,32,34,37,115,34,44,32,105,115,32,97,32,100,105,114,101,99,116,111,114,121,10,0,0,68,114,105,118,101,32,39,37,99,58,39,32,105,115,32,110,111,116,32,97,32,112,97,114,116,105,116,105,111,110,0,0,97,41,117,116,111,114,101,110,97,109,101,32,65,41,117,116,111,114,101,110,97,109,101,45,97,108,108,32,114,41,101,110,97,109,101,32,82,41,101,110,97,109,101,45,97,108,108,32,0,0,0,0,37,99,58,10,0,0,0,0,37,45,49,53,115,0,0,0,77,84,79,79,76,83,95,78,70,65,84,83,0,0,0,0,70,105,108,101,32,34,37,115,34,32,101,120,105,115,116,115,46,32,84,111,32,111,118,101,114,119,114,105,116,101,44,32,116,114,121,32,97,103,97,105,110,44,32,97,110,100,32,101,120,112,108,105,99,105,116,108,121,32,115,112,101,99,105,102,121,32,116,97,114,103,101,116,32,100,105,114,101,99,116,111,114,121,10,0,45,97,32,97,110,100,32,45,115,32,111,112,116,105,111,110,115,32,97,114,101,32,109,117,116,117,97,108,108,121,32,101,120,99,108,117,115,105,118,101,10,0,0,0,85,115,97,103,101,58,32,37,115,58,32,91,45,99,32,99,108,117,115,116,101,114,76,105,115,116,93,32,91,45,115,32,115,101,99,116,111,114,76,105,115,116,93,32,91,45,99,93,32,91,45,86,93,32,100,101,118,105,99,101,10,0,0,0,78,111,116,32,97,32,110,117,109,98,101,114,58,32,37,115,10,0,0,0,108,111,99,97,108,104,111,115,116,0,0,0,67,111,117,108,100,32,110,111,116,32,114,101,97,100,32,102,105,114,115,116,32,70,65,84,32,115,101,99,116,111,114,10,0,0,0,0,9,102,105,108,101,61,34,37,115,34,32,102,97,116,95,98,105,116,115,61,37,100,32,10,0,0,0,0,85,110,101,120,112,101,99,116,101,100,32,101,110,116,114,121,32,116,121,112,101,32,37,100,10,0,0,0,73,102,32,116,104,105,115,32,105,115,32,97,32,80,67,77,67,73,65,32,99,97,114,100,44,32,111,114,32,97,32,100,105,115,107,32,112,97,114,116,105,116,105,111,110,101,100,32,111,110,32,97,110,111,116,104,101,114,32,99,111,109,112,117,116,101,114,44,32,116,104,105,115,32,109,101,115,115,97,103,101,32,109,97,121,32,98,101,32,105,110,32,101,114,114,111,114,58,32,97,100,100,32,109,116,111,111,108,115,95,115,107,105,112,95,99,104,101,99,107,61,49,32,116,111,32,121,111,117,114,32,46,109,116,111,111,108,115,114,99,32,102,105,108,101,32,116,111,32,115,117,112,112,114,101,115,115,32,116,104,105,115,32,119,97,114,110,105,110,103,10,0,101,114,114,111,114,32,105,110,32,102,97,116,95,119,114,105,116,101,0,0,105,58,119,97,88,98,102,100,115,47,104,0,101,110,97,98,108,101,45,114,97,119,45,116,101,114,109,32,0,0,0,0,37,115,58,32,100,114,105,118,101,32,39,37,99,58,39,32,105,115,32,110,111,116,32,97,32,90,105,112,32,111,114,32,74,97,122,32,100,114,105,118,101,10,0,0,68,114,105,118,101,32,39,37,99,58,39,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,78,79,32,78,65,77,69,32,32,32,32,0,83,104,111,114,116,0,0,0,45,83,32,37,100,32,0,0,91,37,115,93,37,42,115,0,117,110,105,120,0,0,0,0,80,114,111,98,97,98,108,121,32,110,111,110,32,77,83,45,68,79,83,32,100,105,115,107,10,0,0,0,43,112,58,100,104,0,0,0,85,115,97,103,101,58,32,37,115,58,32,91,45,86,93,32,109,115,100,111,115,100,105,114,101,99,116,111,114,121,10,0,68,117,112,32,101,114,114,111,114,0,0,0,112,97,114,115,101,95,118,115,101,115,58,32,105,110,118,97,108,105,100,32,86,83,69,32,73,68,32,37,100,32,97,116,32,37,100,46,10,0,0,0,10,42,42,42,32,77,97,121,98,101,32,116,114,121,32,119,105,116,104,111,117,116,32,112,97,114,116,105,116,105,111,110,61,37,100,32,105,110,32,100,101,118,105,99,101,32,100,101,102,105,110,105,116,105,111,110,32,42,42,42,10,10,0,0,34,36,92,0,100,105,115,97,98,108,101,45,100,101,98,117,103,32,0,0,42,91,63,0,105,58,97,100,112,114,99,73,84,58,116,58,104,58,115,58,102,118,112,98,58,108,58,83,58,66,58,0,32,32,32,32,32,32,32,37,115,32,91,45,118,86,93,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,102,105,108,101,32,91,102,105,108,101,115,46,46,46,93,32,116,97,114,103,101,116,95,100,105,114,101,99,116,111,114,121,10,0,68,101,108,101,116,101,32,118,111,108,117,109,101,32,108,97,98,101,108,32,40,121,47,110,41,58,32,0,76,111,110,103,0,0,0,0,47,46,109,99,119,100,0,0,45,72,32,37,100,32,0,0,85,110,107,110,111,119,110,32,103,101,111,109,101,116,114,121,32,40,89,111,117,32,109,117,115,116,32,116,101,108,108,32,116,104,101,32,99,111,109,112,108,101,116,101,32,103,101,111,109,101,116,114,121,32,111,102,32,116,104,101,32,100,105,115,107,44,32,10,101,105,116,104,101,114,32,105,110,32,47,101,116,99,47,109,116,111,111,108,115,46,99,111,110,102,32,111,114,32,111,110,32,116,104,101,32,99,111,109,109,97,110,100,32,108,105,110,101,41,32,0,100,105,114,95,103,114,111,119,58,32,109,97,108,108,111,99,0,0,0,0,60,111,117,116,45,111,102,45,109,101,109,111,114,121,62,0,69,114,114,111,114,32,111,112,101,110,105,110,103,32,100,101,118,105,99,101,0,0,0,0,67,108,117,115,116,101,114,32,37,108,100,32,105,115,32,98,117,115,121,10,0,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,112,93,32,91,45,97,124,43,97,93,32,91,45,104,124,43,104,93,32,91,45,114,124,43,114,93,32,91,45,115,124,43,115,93,32,109,115,100,111,115,102,105,108,101,32,91,109,115,100,111,115,102,105,108,101,115,46,46,46,93,10,0,0,0,100,101,102,105,110,101,100,32,105,110,32,37,115,10,0,0,105,110,105,116,58,32,97,108,108,111,99,97,116,101,32,98,117,102,102,101,114,0,0,0,50,53,53,46,50,53,53,46,50,53,53,46,50,53,53,0,105,110,105,116,32,37,99,58,32,99,111,117,108,100,32,110,111,116,32,114,101,97,100,32,98,111,111,116,32,115,101,99,116,111,114,0,67,108,117,115,116,101,114,32,35,32,97,116,32,37,100,32,116,111,111,32,98,105,103,40,37,35,120,41,10,0,0,0,66,97,100,32,99,111,100,101,112,97,103,101,32,37,100,10,0,0,0,0,79,117,116,32,111,102,32,109,101,109,111,114,121,32,101,114,114,111,114,32,105,110,32,118,102,97,116,95,108,111,111,107,117,112,95,108,111,111,112,10,0,0,0,0,65,117,116,104,32,102,97,105,108,101,100,58,32,80,97,99,107,101,116,32,111,118,101,114,115,105,122,101,100,0,0,0,67,104,97,110,103,101,32,111,102,32,116,114,97,110,115,102,101,114,32,100,105,114,101,99,116,105,111,110,33,10,0,0,80,111,115,115,105,98,108,121,32,117,110,112,97,114,116,105,116,105,111,110,101,100,32,100,101,118,105,99,101,10,0,0,66,97,100,32,115,108,111,116,32,37,100,10,0,0,0,0,100,105,115,97,98,108,101,45,110,101,119,45,118,111,108,100,32,0,0,0,45,37,108,117,0,0,0,0,85,115,97,103,101,58,32,37,115,32,91,45,118,86,93,32,91,45,68,32,99,108,97,115,104,95,111,112,116,105,111,110,93,32,102,105,108,101,32,116,97,114,103,101,116,102,105,108,101,10,0,0,46,46,32,32,32,32,32,0,78,101,119,32,108,97,98,101,108,32,116,111,111,32,108,111,110,103,10,0,64,64,0,0,37,115,32,102,105,108,101,32,110,97,109,101,32,34,37,115,34,32,37,115,46,10,0,0,47,116,109,112,0,0,0,0,32,45,104,32,37,100,32,45,115,32,37,100,32,0,0,0,101,110,100,32,111,102,32,102,105,108,101,32,105,110,32,102,97,116,95,119,114,105,116,101])
.concat([10,0,0,0,32,32,32,32,32,32,32,37,115,32,98,121,116,101,115,10,0,0,0,0,32,105,110,116,111,32,111,110,101,32,111,102,32,105,116,115,32,111,119,110,32,115,117,98,100,105,114,101,99,116,111,114,105,101,115,32,0,0,0,0,97,98,43,0,67,108,117,115,116,101,114,32,37,108,100,32,97,108,114,101,97,100,121,32,109,97,114,107,101,100,10,0,47,37,115,0,9,35,102,110,61,37,100,32,109,111,100,101,61,37,100,32,0,0,0,0,65,100,100,32,109,116,111,111,108,115,95,115,107,105,112,95,99,104,101,99,107,61,49,32,116,111,32,121,111,117,114,32,46,109,116,111,111,108,115,114,99,32,102,105,108,101,32,116,111,32,115,107,105,112,32,116,104,105,115,32,116,101,115,116,10,0,0,0,66,97,100,32,115,108,111,116,115,32,37,100,32,37,100,32,105,110,32,97,100,100,32,117,115,101,100,32,101,110,116,114,121,10,0,0,84,111,111,32,109,97,110,121,32,99,108,117,115,116,101,114,115,32,105,110,32,70,65,84,10,0,0,0,67,111,117,108,100,110,39,116,32,111,112,101,110,32,116,97,114,103,101,116,32,102,105,108,101,10,0,0,83,104,111,114,116,32,98,117,102,102,101,114,32,102,105,108,108,10,0,0,78,111,32,100,105,114,101,99,116,111,114,121,32,115,108,111,116,115,10,0,87,97,114,110,105,110,103,58,32,105,110,99,111,110,115,105,115,116,101,110,116,32,112,97,114,116,105,116,105,111,110,32,116,97,98,108,101,10,0,0,67,111,117,108,100,110,39,116,32,111,112,101,110,32,115,111,117,114,99,101,32,102,105,108,101,10,0,0,100,105,115,97,98,108,101,45,118,111,108,100,32,0,0,0,32,9,10,35,58,61,0,0,32,32,110,114,61,37,100,10,0,0,0,0,101,120,112,101,99,116,101,100,32,37,99,0,99,111,110,116,97,105,110,115,32,105,108,108,101,103,97,108,32,99,104,97,114,97,99,116,101,114,40,115,41,0,0,0,77,67,87,68,0,0,0,0,98,97,100,32,110,117,109,98,101,114,32,111,102,32,112,97,114,97,109,101,116,101,114,115,0,0,0,0,45,105,32,37,115,32,0,0,79,110,108,121,32,111,110,101,32,111,102,32,45,116,32,111,114,32,45,84,32,109,97,121,32,98,101,32,115,112,101,99,105,102,105,101,100,10,0,0,37,99,32,37,115,32,37,105,32,37,105,32,37,105,32,37,105,32,37,108,105,0,0,0,32,32,32,32,32,32,37,51,100,32,102,105,108,101,0,0,67,97,110,110,111,116,32,114,101,99,117,114,115,105,118,101,108,121,32,99,111,112,121,32,100,105,114,101,99,116,111,114,121,32,0,0,69,114,97,115,101,32,67,121,99,108,101,32,37,105,44,32,119,114,105,116,105,110,103,32,100,97,116,97,58,32,48,120,37,50,46,50,120,46,46,46,10,0,0,0,117,110,116,101,114,109,105,110,97,116,101,100,32,115,116,114,105,110,103,32,99,111,110,115,116,97,110,116,0,0,0,0,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,13,37,100,47,37,100,13,0,0,0,0,43,104,32,0,100,114,105,118,101,32,37,99,58,10,0,0,84,111,116,97,108,32,110,117,109,98,101,114,32,111,102,32,115,101,99,116,111,114,115,32,40,37,100,41,32,110,111,116,32,97,32,109,117,108,116,105,112,108,101,32,111,102,32,115,101,99,116,111,114,115,32,112,101,114,32,116,114,97,99,107,32,40,37,100,41,33,10,0,32,34,32,101,120,112,101,99,116,101,100,0,101,120,116,114,97,99,116,0,68,105,115,107,32,102,117,108,108,10,0,0,67,79,68,69,80,65,71,69,0,0,0,0,66,76,79,67,75,83,73,90,69,0,0,0,84,104,105,115,45,62,100,105,114,116,121,32,61,32,37,100,10,0,0,0,99,121,108,105,110,100,101,114,32,115,105,122,101,32,110,111,116,32,109,117,108,116,105,112,108,101,32,111,102,32,115,101,99,116,111,114,32,115,105,122,101,10,0,0,115,105,122,101,32,110,111,116,32,109,117,108,116,105,112,108,101,32,111,102,32,99,121,108,105,110,100,101,114,32,115,105,122,101,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,105,110,105,116,95,103,101,111,109,101,116,114,121,95,98,111,111,116,0,0,102,114,101,101,68,105,114,67,97,99,104,101,82,97,110,103,101,0,0,0,99,97,108,99,95,102,97,116,95,115,105,122,101,0,0,0,174,0,0,0,116,0,0,0,150,0,0,0,132,0,0,0,96,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,164,0,0,0,8,0,0,0,128,0,0,0,150,0,0,0,132,0,0,0,96,0,0,0,118,0,0,0,0,0,0,0,0,0,0,0,164,0,0,0,0,0,0,0,10,0,0,0,220,0,0,0,92,0,0,0,202,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,210,0,0,0,0,0,0,0,178,0,0,0,176,0,0,0,20,0,0,0,214,0,0,0,106,0,0,0,170,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,0,0,0,76,0,0,0,0,0,0,0,206,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,82,0,0,0,126,0,0,0,162,0,0,0,48,0,0,0,0,0,0,0,166,0,0,0,26,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,182,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,144,0,0,0,72,0,0,0,130,0,0,0,62,0,0,0,0,0,0,0,44,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,140,67,80,0,216,78,80,0,88,64,80,0,108,54,80,0,156,44,80,0,128,37,80,0])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
HEAP32[((5246876)>>2)]=(([32,0])[0]);
HEAP32[((5246888)>>2)]=(([36,0])[0]);
HEAP32[((5246900)>>2)]=(([8,0])[0]);
HEAP32[((5246912)>>2)]=(([8,0])[0]);
HEAP32[((5246924)>>2)]=(([12,0])[0]);
HEAP32[((5246936)>>2)]=(([16,0])[0]);
HEAP32[((5246948)>>2)]=(([16,0])[0]);
HEAP32[((5246960)>>2)]=(([20,0])[0]);
HEAP32[((5246972)>>2)]=(([24,0])[0]);
HEAP32[((5246984)>>2)]=(([28,0])[0]);
HEAP32[((5246996)>>2)]=(([52,0])[0]);
HEAP32[((5247008)>>2)]=(([60,0])[0]);
HEAP32[((5247020)>>2)]=(([64,0])[0]);
_warnx = 78;
}
if (!awaitingMemoryInitializer) runPostSets();
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      function ExitStatus() {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
        Module.print('Exit Status: ' + status);
      };
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      exitRuntime();
      ABORT = true;
      throw new ExitStatus();
    }function _exit(status) {
      __exit(status);
    }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }function _perror(s) {
      // void perror(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/perror.html
      var stdout = HEAP32[((_stdout)>>2)];
      if (s) {
        _fputs(s, stdout);
        _fputc(58, stdout);
        _fputc(32, stdout);
      }
      var errnum = HEAP32[((___errno_location())>>2)];
      _puts(_strerror(errnum));
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  var ___errno=___errno_location;
  function _strstr(ptr1, ptr2) {
      var check = 0, start;
      do {
        if (!check) {
          start = ptr1;
          check = ptr2;
        }
        var curr1 = HEAP8[((ptr1++)|0)];
        var curr2 = HEAP8[((check++)|0)];
        if (curr2 == 0) return start;
        if (curr2 != curr1) {
          // rewind to one character after start, to find ez in eeez
          ptr1 = start + 1;
          check = 0;
        }
      } while (curr1);
      return 0;
    }
  function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      _memcpy(newStr, ptr, len);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _strndup(ptr, size) {
      var len = _strlen(ptr);
      if (size >= len) {
        return _strdup(ptr);
      }
      if (size < 0) {
        size = 0;
      }
      var newStr = _malloc(size + 1);
      _memcpy(newStr, ptr, size);
      HEAP8[(((newStr)+(size))|0)]=0;
      return newStr;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  function _strncpy(pdest, psrc, num) {
      pdest = pdest|0; psrc = psrc|0; num = num|0;
      var padding = 0, curr = 0, i = 0;
      while ((i|0) < (num|0)) {
        curr = padding ? 0 : HEAP8[(((psrc)+(i))|0)];
        HEAP8[(((pdest)+(i))|0)]=curr
        padding = padding ? 1 : (HEAP8[(((psrc)+(i))|0)] == 0);
        i = (i+1)|0;
      }
      return pdest|0;
    }
  function _strcat(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      pdest = (pdest + _strlen(pdest))|0;
      do {
        HEAP8[((pdest+i)|0)]=HEAP8[((psrc+i)|0)];
        i = (i+1)|0;
      } while (HEAP8[(((psrc)+(i-1))|0)] != 0);
      return pdest|0;
    }
  var _environ=allocate(1, "i32*", ALLOC_STACK);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './mtools';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        for (var j = 0; j < line.length; j++) {
          HEAP8[(((poolPtr)+(j))|0)]=line.charCodeAt(j);
        }
        HEAP8[(((poolPtr)+(j))|0)]=0;
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  function _toupper(chr) {
      if (chr >= 97 && chr <= 122) {
        return chr - 97 + 65;
      } else {
        return chr;
      }
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
    }function __parseInt(str, endptr, base, min, max, bits, unsign) {
      // Skip space.
      while (_isspace(HEAP8[(str)])) str++;
      // Check for a plus/minus sign.
      var multiplier = 1;
      if (HEAP8[(str)] == 45) {
        multiplier = -1;
        str++;
      } else if (HEAP8[(str)] == 43) {
        str++;
      }
      // Find base.
      var finalBase = base;
      if (!finalBase) {
        if (HEAP8[(str)] == 48) {
          if (HEAP8[((str+1)|0)] == 120 ||
              HEAP8[((str+1)|0)] == 88) {
            finalBase = 16;
            str += 2;
          } else {
            finalBase = 8;
            str++;
          }
        }
      }
      if (!finalBase) finalBase = 10;
      // Get digits.
      var chr;
      var ret = 0;
      while ((chr = HEAP8[(str)]) != 0) {
        var digit = parseInt(String.fromCharCode(chr), finalBase);
        if (isNaN(digit)) {
          break;
        } else {
          ret = ret * finalBase + digit;
          str++;
        }
      }
      // Apply sign.
      ret *= multiplier;
      // Set end pointer.
      if (endptr) {
        HEAP32[((endptr)>>2)]=str
      }
      // Unsign if needed.
      if (unsign) {
        if (Math.abs(ret) > max) {
          ret = max;
          ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          ret = unSign(ret, bits);
        }
      }
      // Validate range.
      if (ret > max || ret < min) {
        ret = ret > max ? max : min;
        ___setErrNo(ERRNO_CODES.ERANGE);
      }
      if (bits == 64) {
        return tempRet0 = Math.min(Math.floor((ret)/4294967296), 4294967295)>>>0,ret>>>0;
      }
      return ret;
    }function _strtol(str, endptr, base) {
      return __parseInt(str, endptr, base, -2147483648, 2147483647, 32);  // LONG_MIN, LONG_MAX.
    }
  function _strtoul(str, endptr, base) {
      return __parseInt(str, endptr, base, 0, 4294967295, 32, true);  // ULONG_MAX.
    }
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      if (!FS.streams[stream]) return -1;
      var streamObj = FS.streams[stream];
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _read(stream, _fgetc.ret, 1);
      if (ret == 0) {
        streamObj.eof = true;
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }function _fgets(s, n, stream) {
      // char *fgets(char *restrict s, int n, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgets.html
      if (!FS.streams[stream]) return 0;
      var streamObj = FS.streams[stream];
      if (streamObj.error || streamObj.eof) return 0;
      var byte_;
      for (var i = 0; i < n - 1 && byte_ != 10; i++) {
        byte_ = _fgetc(stream);
        if (byte_ == -1) {
          if (streamObj.error || (streamObj.eof && i == 0)) return 0;
          else if (streamObj.eof) break;
        }
        HEAP8[(((s)+(i))|0)]=byte_
      }
      HEAP8[(((s)+(i))|0)]=0
      return s;
    }
  function __isFloat(text) {
      return !!(/^[+-]?[0-9]*\.?[0-9]+([eE][+-]?[0-9]+)?$/.exec(text));
    }function __scanString(format, get, unget, varargs) {
      if (!__scanString.whiteSpace) {
        __scanString.whiteSpace = {};
        __scanString.whiteSpace[32] = 1;
        __scanString.whiteSpace[9] = 1;
        __scanString.whiteSpace[10] = 1;
        __scanString.whiteSpace[' '] = 1;
        __scanString.whiteSpace['\t'] = 1;
        __scanString.whiteSpace['\n'] = 1;
      }
      // Supports %x, %4x, %d.%d, %lld, %s, %f, %lf.
      // TODO: Support all format specifiers.
      format = Pointer_stringify(format);
      var soFar = 0;
      if (format.indexOf('%n') >= 0) {
        // need to track soFar
        var _get = get;
        get = function() {
          soFar++;
          return _get();
        }
        var _unget = unget;
        unget = function() {
          soFar--;
          return _unget();
        }
      }
      var formatIndex = 0;
      var argsi = 0;
      var fields = 0;
      var argIndex = 0;
      var next;
      mainLoop:
      for (var formatIndex = 0; formatIndex < format.length;) {
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'n') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          HEAP32[((argPtr)>>2)]=soFar;
          formatIndex += 2;
          continue;
        }
        // TODO: Support strings like "%5c" etc.
        if (format[formatIndex] === '%' && format[formatIndex+1] == 'c') {
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          fields++;
          next = get();
          HEAP8[(argPtr)]=next
          formatIndex += 2;
          continue;
        }
        // remove whitespace
        while (1) {
          next = get();
          if (next == 0) return fields;
          if (!(next in __scanString.whiteSpace)) break;
        }
        unget();
        if (format[formatIndex] === '%') {
          formatIndex++;
          var suppressAssignment = false;
          if (format[formatIndex] == '*') {
            suppressAssignment = true;
            formatIndex++;
          }
          var maxSpecifierStart = formatIndex;
          while (format[formatIndex].charCodeAt(0) >= 48 &&
                 format[formatIndex].charCodeAt(0) <= 57) {
            formatIndex++;
          }
          var max_;
          if (formatIndex != maxSpecifierStart) {
            max_ = parseInt(format.slice(maxSpecifierStart, formatIndex), 10);
          }
          var long_ = false;
          var half = false;
          var longLong = false;
          if (format[formatIndex] == 'l') {
            long_ = true;
            formatIndex++;
            if(format[formatIndex] == 'l') {
              longLong = true;
              formatIndex++;
            }
          } else if (format[formatIndex] == 'h') {
            half = true;
            formatIndex++;
          }
          var type = format[formatIndex];
          formatIndex++;
          var curr = 0;
          var buffer = [];
          // Read characters according to the format. floats are trickier, they may be in an unfloat state in the middle, then be a valid float later
          if (type == 'f' || type == 'e' || type == 'g' || type == 'E') {
            var last = 0;
            next = get();
            while (next > 0) {
              buffer.push(String.fromCharCode(next));
              if (__isFloat(buffer.join(''))) {
                last = buffer.length;
              }
              next = get();
            }
            for (var i = 0; i < buffer.length - last + 1; i++) {
              unget();
            }
            buffer.length = last;
          } else {
            next = get();
            var first = true;
            while ((curr < max_ || isNaN(max_)) && next > 0) {
              if (!(next in __scanString.whiteSpace) && // stop on whitespace
                  (type == 's' ||
                   ((type === 'd' || type == 'u' || type == 'i') && ((next >= 48 && next <= 57) ||
                                                                     (first && next == 45))) ||
                   (type === 'x' && (next >= 48 && next <= 57 ||
                                     next >= 97 && next <= 102 ||
                                     next >= 65 && next <= 70))) &&
                  (formatIndex >= format.length || next !== format[formatIndex].charCodeAt(0))) { // Stop when we read something that is coming up
                buffer.push(String.fromCharCode(next));
                next = get();
                curr++;
                first = false;
              } else {
                break;
              }
            }
            unget();
          }
          if (buffer.length === 0) return 0;  // Failure.
          if (suppressAssignment) continue;
          var text = buffer.join('');
          var argPtr = HEAP32[(((varargs)+(argIndex))>>2)];
          argIndex += Runtime.getNativeFieldSize('void*');
          switch (type) {
            case 'd': case 'u': case 'i':
              if (half) {
                HEAP16[((argPtr)>>1)]=parseInt(text, 10);
              } else if(longLong) {
                (tempI64 = [parseInt(text, 10)>>>0,Math.min(Math.floor((parseInt(text, 10))/4294967296), 4294967295)>>>0],HEAP32[((argPtr)>>2)]=tempI64[0],HEAP32[(((argPtr)+(4))>>2)]=tempI64[1]);
              } else {
                HEAP32[((argPtr)>>2)]=parseInt(text, 10);
              }
              break;
            case 'x':
              HEAP32[((argPtr)>>2)]=parseInt(text, 16)
              break;
            case 'f':
            case 'e':
            case 'g':
            case 'E':
              // fallthrough intended
              if (long_) {
                (HEAPF64[(tempDoublePtr)>>3]=parseFloat(text),HEAP32[((argPtr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((argPtr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)])
              } else {
                HEAPF32[((argPtr)>>2)]=parseFloat(text)
              }
              break;
            case 's':
              var array = intArrayFromString(text);
              for (var j = 0; j < array.length; j++) {
                HEAP8[(((argPtr)+(j))|0)]=array[j]
              }
              break;
          }
          fields++;
        } else if (format[formatIndex] in __scanString.whiteSpace) {
          next = get();
          while (next in __scanString.whiteSpace) {
            if (next <= 0) break mainLoop;  // End of input.
            next = get();
          }
          unget(next);
          formatIndex++;
        } else {
          // Not a specifier.
          next = get();
          if (format[formatIndex].charCodeAt(0) !== next) {
            unget(next);
            break mainLoop;
          }
          formatIndex++;
        }
      }
      return fields;
    }function _sscanf(s, format, varargs) {
      // int sscanf(const char *restrict s, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var index = 0;
      var get = function() { return HEAP8[(((s)+(index++))|0)]; };
      var unget = function() { index--; };
      return __scanString(format, get, unget, varargs);
    }
  function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }function _sprintf(s, format, varargs) {
      // int sprintf(char *restrict s, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      return _snprintf(s, undefined, format, varargs);
    }
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }function _strncasecmp(px, py, n) {
      px = px|0; py = py|0; n = n|0;
      var i = 0, x = 0, y = 0;
      while ((i>>>0) < (n>>>0)) {
        x = _tolower(HEAP8[(((px)+(i))|0)]);
        y = _tolower(HEAP8[(((py)+(i))|0)]);
        if (((x|0) == (y|0)) & ((x|0) == 0)) return 0;
        if ((x|0) == 0) return -1;
        if ((y|0) == 0) return 1;
        if ((x|0) == (y|0)) {
          i = (i + 1)|0;
          continue;
        } else {
          return ((x>>>0) > (y>>>0) ? 1 : -1)|0;
        }
      }
      return 0;
    }
  function _strcspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (setcurr) return str - pstr;
        str++;
      }
    }
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  var ___tm_struct_layout={__size__:44,tm_sec:0,tm_min:4,tm_hour:8,tm_mday:12,tm_mon:16,tm_year:20,tm_wday:24,tm_yday:28,tm_isdst:32,tm_gmtoff:36,tm_zone:40};
  var ___tm_current=allocate(4*26, "i8", ALLOC_STACK);
  var ___tm_timezones={};
  var __tzname=allocate(8, "i32*", ALLOC_STACK);
  var __daylight=allocate(1, "i32*", ALLOC_STACK);
  var __timezone=allocate(1, "i32*", ALLOC_STACK);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[((__timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((__daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset())
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((__tzname)>>2)]=winterNamePtr
      HEAP32[(((__tzname)+(4))>>2)]=summerNamePtr
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var offsets = ___tm_struct_layout;
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[(((tmPtr)+(offsets.tm_sec))>>2)]=date.getSeconds()
      HEAP32[(((tmPtr)+(offsets.tm_min))>>2)]=date.getMinutes()
      HEAP32[(((tmPtr)+(offsets.tm_hour))>>2)]=date.getHours()
      HEAP32[(((tmPtr)+(offsets.tm_mday))>>2)]=date.getDate()
      HEAP32[(((tmPtr)+(offsets.tm_mon))>>2)]=date.getMonth()
      HEAP32[(((tmPtr)+(offsets.tm_year))>>2)]=date.getFullYear()-1900
      HEAP32[(((tmPtr)+(offsets.tm_wday))>>2)]=date.getDay()
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(offsets.tm_yday))>>2)]=yday
      HEAP32[(((tmPtr)+(offsets.tm_gmtoff))>>2)]=start.getTimezoneOffset() * 60
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(offsets.tm_isdst))>>2)]=dst
      var timezone = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | date.toString().match(/\(([A-Z]+)\)/)[1];
      if (!(timezone in ___tm_timezones)) {
        ___tm_timezones[timezone] = allocate(intArrayFromString(timezone), 'i8', ALLOC_NORMAL);
      }
      HEAP32[(((tmPtr)+(offsets.tm_zone))>>2)]=___tm_timezones[timezone]
      return tmPtr;
    }function _localtime(time) {
      return _localtime_r(time, ___tm_current);
    }
  var _putc=_fputc;
  function _strpbrk(ptr1, ptr2) {
      var curr;
      var searchSet = {};
      while (1) {
        var curr = HEAP8[((ptr2++)|0)];
        if (!curr) break;
        searchSet[curr] = 1;
      }
      while (1) {
        curr = HEAP8[(ptr1)];
        if (!curr) break;
        if (curr in searchSet) return ptr1;
        ptr1++;
      }
      return 0;
    }
  function _pipe(fildes) {
      // int pipe(int fildes[2]);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/pipe.html
      // It is possible to implement this using two device streams, but pipes make
      // little sense in a single-threaded environment, so we do not support them.
      ___setErrNo(ERRNO_CODES.ENOSYS);
      return -1;
    }
  function _fork() {
      // pid_t fork(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fork.html
      // We don't support multiple processes.
      ___setErrNo(ERRNO_CODES.EAGAIN);
      return -1;
    }
  var ___flock_struct_layout={__size__:16,l_type:0,l_whence:2,l_start:4,l_len:8,l_pid:12,l_xxx:14};function _fcntl(fildes, cmd, varargs, dup2) {
      // int fcntl(int fildes, int cmd, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/fcntl.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      var stream = FS.streams[fildes];
      switch (cmd) {
        case 0:
          var arg = HEAP32[((varargs)>>2)];
          if (arg < 0) {
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          }
          var newStream = {};
          for (var member in stream) {
            newStream[member] = stream[member];
          }
          arg = dup2 ? arg : Math.max(arg, FS.streams.length); // dup2 wants exactly arg; fcntl wants a free descriptor >= arg
          for (var i = FS.streams.length; i < arg; i++) {
            FS.streams[i] = null; // Keep dense
          }
          FS.streams[arg] = newStream;
          return arg;
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          var flags = 0;
          if (stream.isRead && stream.isWrite) flags = 2;
          else if (!stream.isRead && stream.isWrite) flags = 1;
          else if (stream.isRead && !stream.isWrite) flags = 0;
          if (stream.isAppend) flags |= 8;
          // Synchronization and blocking flags are irrelevant to us.
          return flags;
        case 4:
          var arg = HEAP32[((varargs)>>2)];
          stream.isAppend = Boolean(arg | 8);
          // Synchronization and blocking flags are irrelevant to us.
          return 0;
        case 7:
        case 20:
          var arg = HEAP32[((varargs)>>2)];
          var offset = ___flock_struct_layout.l_type;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=3
          return 0;
        case 8:
        case 9:
        case 21:
        case 22:
          // Pretend that the locking is successful.
          return 0;
        case 6:
        case 5:
          // These are for sockets. We don't have them fully implemented yet.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default:
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
      }
      // Should never be reached. Only to silence strict warnings.
      return -1;
    }function _dup(fildes) {
      // int dup(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/dup.html
      return _fcntl(fildes, 0, allocate([0, 0, 0, 0], 'i32', ALLOC_STACK));  // F_DUPFD.
    }
  function _execl(/* ... */) {
      // int execl(const char *path, const char *arg0, ... /*, (char *)0 */);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/exec.html
      // We don't support executing external code.
      ___setErrNo(ERRNO_CODES.ENOEXEC);
      return -1;
    }var _execvp=_execl;
  function _kill(pid, sig) {
      // int kill(pid_t pid, int sig);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/kill.html
      // Makes no sense in a single-process environment.
      ___setErrNo(ERRNO_CODES.EPERM);
      return -1;
    }
  function _wait(stat_loc) {
      // pid_t wait(int *stat_loc);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/wait.html
      // Makes no sense in a single-process environment.
      ___setErrNo(ERRNO_CODES.ECHILD);
      return -1;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _strspn(pstr, pset) {
      var str = pstr, set, strcurr, setcurr;
      while (1) {
        strcurr = HEAP8[(str)];
        if (!strcurr) return str - pstr;
        set = pset;
        while (1) {
          setcurr = HEAP8[(set)];
          if (!setcurr || setcurr == strcurr) break;
          set++;
        }
        if (!setcurr) return str - pstr;
        str++;
      }
    }
  function _strcpy(pdest, psrc) {
      pdest = pdest|0; psrc = psrc|0;
      var i = 0;
      do {
        HEAP8[(((pdest+i)|0)|0)]=HEAP8[(((psrc+i)|0)|0)];
        i = (i+1)|0;
      } while ((HEAP8[(((psrc)+(i-1))|0)])|0 != 0);
      return pdest|0;
    }
  function _iscntrl(chr) {
      return (0 <= chr && chr <= 0x1F) || chr === 0x7F;
    }
  function _islower(chr) {
      return chr >= 97 && chr <= 122;
    }
  function _isupper(chr) {
      return chr >= 65 && chr <= 90;
    }
  function _inet_addr(ptr) {
      var b = Pointer_stringify(ptr).split(".");
      if (b.length !== 4) return -1; // we return -1 for error, and otherwise a uint32. this helps inet_pton differentiate
      return (Number(b[0]) | (Number(b[1]) << 8) | (Number(b[2]) << 16) | (Number(b[3]) << 24)) >>> 0;
    }
  function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  var ___hostent_struct_layout={__size__:20,h_name:0,h_aliases:4,h_addrtype:8,h_length:12,h_addr_list:16};function _gethostbyname(name) {
      name = Pointer_stringify(name);
        if (!_gethostbyname.id) {
          _gethostbyname.id = 1;
          _gethostbyname.table = {};
        }
      var id = _gethostbyname.id++;
      assert(id < 65535);
      var fakeAddr = 172 | (29 << 8) | ((id & 0xff) << 16) | ((id & 0xff00) << 24);
      _gethostbyname.table[id] = name;
      // generate hostent
      var ret = _malloc(___hostent_struct_layout.__size__);
      var nameBuf = _malloc(name.length+1);
      writeStringToMemory(name, nameBuf);
      setValue(ret+___hostent_struct_layout.h_name, nameBuf, 'i8*');
      var aliasesBuf = _malloc(4);
      setValue(aliasesBuf, 0, 'i8*');
      setValue(ret+___hostent_struct_layout.h_aliases, aliasesBuf, 'i8**');
      setValue(ret+___hostent_struct_layout.h_addrtype, 1, 'i32');
      setValue(ret+___hostent_struct_layout.h_length, 4, 'i32');
      var addrListBuf = _malloc(12);
      setValue(addrListBuf, addrListBuf+8, 'i32*');
      setValue(addrListBuf+4, 0, 'i32*');
      setValue(addrListBuf+8, fakeAddr, 'i32');
      setValue(ret+___hostent_struct_layout.h_addr_list, addrListBuf, 'i8**');
      return ret;
    }
var _endhostent; // stub for _endhostent
  var Sockets={BACKEND_WEBSOCKETS:0,BACKEND_WEBRTC:1,BUFFER_SIZE:10240,MAX_BUFFER_SIZE:10485760,backend:0,nextFd:1,fds:{},sockaddr_in_layout:{__size__:20,sin_family:0,sin_port:4,sin_addr:8,sin_zero:12,sin_zero_b:16},msghdr_layout:{__size__:28,msg_name:0,msg_namelen:4,msg_iov:8,msg_iovlen:12,msg_control:16,msg_controllen:20,msg_flags:24},backends:{0:{connect:function (info) {
            console.log('opening ws://' + info.host + ':' + info.port);
            info.socket = new WebSocket('ws://' + info.host + ':' + info.port, ['binary']);
            info.socket.binaryType = 'arraybuffer';
            var i32Temp = new Uint32Array(1);
            var i8Temp = new Uint8Array(i32Temp.buffer);
            info.inQueue = [];
            info.hasData = function() { return info.inQueue.length > 0 }
            if (!info.stream) {
              var partialBuffer = null; // in datagram mode, inQueue contains full dgram messages; this buffers incomplete data. Must begin with the beginning of a message
            }
            info.socket.onmessage = function(event) {
              assert(typeof event.data !== 'string' && event.data.byteLength); // must get binary data!
              var data = new Uint8Array(event.data); // make a typed array view on the array buffer
              if (info.stream) {
                info.inQueue.push(data);
              } else {
                // we added headers with message sizes, read those to find discrete messages
                if (partialBuffer) {
                  // append to the partial buffer
                  var newBuffer = new Uint8Array(partialBuffer.length + data.length);
                  newBuffer.set(partialBuffer);
                  newBuffer.set(data, partialBuffer.length);
                  // forget the partial buffer and work on data
                  data = newBuffer;
                  partialBuffer = null;
                }
                var currPos = 0;
                while (currPos+4 < data.length) {
                  i8Temp.set(data.subarray(currPos, currPos+4));
                  var currLen = i32Temp[0];
                  assert(currLen > 0);
                  if (currPos + 4 + currLen > data.length) {
                    break; // not enough data has arrived
                  }
                  currPos += 4;
                  info.inQueue.push(data.subarray(currPos, currPos+currLen));
                  currPos += currLen;
                }
                // If data remains, buffer it
                if (currPos < data.length) {
                  partialBuffer = data.subarray(currPos);
                }
              }
            }
            function send(data) {
              // TODO: if browser accepts views, can optimize this
              // ok to use the underlying buffer, we created data and know that the buffer starts at the beginning
              info.socket.send(data.buffer);
            }
            var outQueue = [];
            var intervalling = false, interval;
            function trySend() {
              if (info.socket.readyState != info.socket.OPEN) {
                if (!intervalling) {
                  intervalling = true;
                  console.log('waiting for socket in order to send');
                  interval = setInterval(trySend, 100);
                }
                return;
              }
              for (var i = 0; i < outQueue.length; i++) {
                send(outQueue[i]);
              }
              outQueue.length = 0;
              if (intervalling) {
                intervalling = false;
                clearInterval(interval);
              }
            }
            info.sender = function(data) {
              if (!info.stream) {
                // add a header with the message size
                var header = new Uint8Array(4);
                i32Temp[0] = data.length;
                header.set(i8Temp);
                outQueue.push(header);
              }
              outQueue.push(new Uint8Array(data));
              trySend();
            };
          }},1:{}}};function _socket(family, type, protocol) {
      var fd = Sockets.nextFd++;
      assert(fd < 64); // select() assumes socket fd values are in 0..63
      var stream = type == 200;
      if (protocol) {
        assert(stream == (protocol == 1)); // if stream, must be tcp
      }
      if (Sockets.backend == Sockets.BACKEND_WEBRTC) {
        assert(!stream); // If WebRTC, we can only support datagram, not stream
      }
      Sockets.fds[fd] = {
        connected: false,
        stream: stream
      };
      return fd;
    }
  function _htons(value) {
      return ((value & 0xff) << 8) + ((value & 0xff00) >> 8);
    }
  function __inet_ntop_raw(addr) {
      return (addr & 0xff) + '.' + ((addr >> 8) & 0xff) + '.' + ((addr >> 16) & 0xff) + '.' + ((addr >> 24) & 0xff)
    }function _connect(fd, addr, addrlen) {
      var info = Sockets.fds[fd];
      if (!info) return -1;
      info.connected = true;
      info.addr = getValue(addr + Sockets.sockaddr_in_layout.sin_addr, 'i32');
      info.port = _htons(getValue(addr + Sockets.sockaddr_in_layout.sin_port, 'i16'));
      info.host = __inet_ntop_raw(info.addr);
      // Support 'fake' ips from gethostbyname
      var parts = info.host.split('.');
      if (parts[0] == '172' && parts[1] == '29') {
        var low = Number(parts[2]);
        var high = Number(parts[3]);
        info.host = _gethostbyname.table[low + 0xff*high];
        assert(info.host, 'problem translating fake ip ' + parts);
      }
      Sockets.backends[Sockets.backend].connect(info);
      return 0;
    }
  function _setsockopt(d, level, optname, optval, optlen) {
      console.log('ignoring setsockopt command');
      return 0;
    }
  function _atoi(ptr) {
      return _strtol(ptr, null, 10);
    }
  function _shutdown(fd, how) {
      var info = Sockets.fds[fd];
      if (!info) return -1;
      info.socket.close();
      Sockets.fds[fd] = null;
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      if (FS.streams[fildes] && !FS.streams[fildes].object.isDevice) {
        var stream = FS.streams[fildes];
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          position += stream.object.contents.length;
        }
        if (position < 0) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else {
          stream.ungotten = [];
          stream.position = position;
          return position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }var _lseek64=_lseek;
  var ___stat_struct_layout={__size__:68,st_dev:0,st_ino:4,st_mode:8,st_nlink:12,st_uid:16,st_gid:20,st_rdev:24,st_size:28,st_atime:32,st_spare1:36,st_mtime:40,st_spare2:44,st_ctime:48,st_spare3:52,st_blksize:56,st_blocks:60,st_spare4:64};function _stat(path, buf, dontResolveLastLink) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/stat.html
      // int stat(const char *path, struct stat *buf);
      // NOTE: dontResolveLastLink is a shortcut for lstat(). It should never be
      //       used in client code.
      var obj = FS.findObject(Pointer_stringify(path), dontResolveLastLink);
      if (obj === null || !FS.forceLoadFile(obj)) return -1;
      var offsets = ___stat_struct_layout;
      // Constants.
      HEAP32[(((buf)+(offsets.st_nlink))>>2)]=1
      HEAP32[(((buf)+(offsets.st_uid))>>2)]=0
      HEAP32[(((buf)+(offsets.st_gid))>>2)]=0
      HEAP32[(((buf)+(offsets.st_blksize))>>2)]=4096
      // Variables.
      HEAP32[(((buf)+(offsets.st_ino))>>2)]=obj.inodeNumber
      var time = Math.floor(obj.timestamp / 1000);
      if (offsets.st_atime === undefined) {
        offsets.st_atime = offsets.st_atim.tv_sec;
        offsets.st_mtime = offsets.st_mtim.tv_sec;
        offsets.st_ctime = offsets.st_ctim.tv_sec;
        var nanosec = (obj.timestamp % 1000) * 1000;
        HEAP32[(((buf)+(offsets.st_atim.tv_nsec))>>2)]=nanosec
        HEAP32[(((buf)+(offsets.st_mtim.tv_nsec))>>2)]=nanosec
        HEAP32[(((buf)+(offsets.st_ctim.tv_nsec))>>2)]=nanosec
      }
      HEAP32[(((buf)+(offsets.st_atime))>>2)]=time
      HEAP32[(((buf)+(offsets.st_mtime))>>2)]=time
      HEAP32[(((buf)+(offsets.st_ctime))>>2)]=time
      var mode = 0;
      var size = 0;
      var blocks = 0;
      var dev = 0;
      var rdev = 0;
      if (obj.isDevice) {
        //  Device numbers reuse inode numbers.
        dev = rdev = obj.inodeNumber;
        size = blocks = 0;
        mode = 0x2000;  // S_IFCHR.
      } else {
        dev = 1;
        rdev = 0;
        // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
        //       but this is not required by the standard.
        if (obj.isFolder) {
          size = 4096;
          blocks = 1;
          mode = 0x4000;  // S_IFDIR.
        } else {
          var data = obj.contents || obj.link;
          size = data.length;
          blocks = Math.ceil(data.length / 4096);
          mode = obj.link === undefined ? 0x8000 : 0xA000;  // S_IFREG, S_IFLNK.
        }
      }
      HEAP32[(((buf)+(offsets.st_dev))>>2)]=dev;
      HEAP32[(((buf)+(offsets.st_rdev))>>2)]=rdev;
      HEAP32[(((buf)+(offsets.st_size))>>2)]=size
      HEAP32[(((buf)+(offsets.st_blocks))>>2)]=blocks
      if (obj.read) mode |= 0x16D;  // S_IRUSR | S_IXUSR | S_IRGRP | S_IXGRP | S_IROTH | S_IXOTH.
      if (obj.write) mode |= 0x92;  // S_IWUSR | S_IWGRP | S_IWOTH.
      HEAP32[(((buf)+(offsets.st_mode))>>2)]=mode
      return 0;
    }function _lstat(path, buf) {
      // int lstat(const char *path, struct stat *buf);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/lstat.html
      return _stat(path, buf, true);
    }
  function _strncat(pdest, psrc, num) {
      var len = _strlen(pdest);
      var i = 0;
      while(1) {
        HEAP8[((pdest+len+i)|0)]=HEAP8[((psrc+i)|0)];
        if (HEAP8[(((pdest)+(len+i))|0)] == 0) break;
        i ++;
        if (i == num) {
          HEAP8[(((pdest)+(len+i))|0)]=0
          break;
        }
      }
      return pdest;
    }
  function _access(path, amode) {
      // int access(const char *path, int amode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/access.html
      path = Pointer_stringify(path);
      var target = FS.findObject(path);
      if (target === null) return -1;
      if ((amode & 2 && !target.write) ||  // W_OK.
          ((amode & 1 || amode & 4) && !target.read)) {  // X_OK, R_OK.
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        return 0;
      }
    }
  var _atol=_atoi;
var _srandom; // stub for _srandom
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
var _random; // stub for _random
  function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
  function _fflush(stream) {
      // int fflush(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fflush.html
      var flush = function(filedes) {
        // Right now we write all data directly, except for output devices.
        if (FS.streams[filedes] && FS.streams[filedes].object.output) {
          if (!FS.streams[filedes].isTerminal) { // don't flush terminals, it would cause a \n to also appear
            FS.streams[filedes].object.output(null);
          }
        }
      };
      try {
        if (stream === 0) {
          for (var i = 0; i < FS.streams.length; i++) if (FS.streams[i]) flush(i);
        } else {
          flush(stream);
        }
        return 0;
      } catch (e) {
        ___setErrNo(ERRNO_CODES.EIO);
        return -1;
      }
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      return Number(FS.streams[stream] && FS.streams[stream].eof);
    }
  function _ferror(stream) {
      // int ferror(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ferror.html
      return Number(FS.streams[stream] && FS.streams[stream].error);
    }
  var _getc=_fgetc;
  function _ungetc(c, stream) {
      // int ungetc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ungetc.html
      if (FS.streams[stream]) {
        c = unSign(c & 0xFF);
        FS.streams[stream].ungotten.push(c);
        return c;
      } else {
        return -1;
      }
    }function _fscanf(stream, format, varargs) {
      // int fscanf(FILE *restrict stream, const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      if (FS.streams[stream]) {
        var stack = [];
        var get = function() { var ret = _fgetc(stream); stack.push(ret); return ret };
        var unget = function(c) { return _ungetc(stack.pop(), stream) };
        return __scanString(format, get, unget, varargs);
      } else {
        return -1;
      }
    }function _scanf(format, varargs) {
      // int scanf(const char *restrict format, ... );
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/scanf.html
      var stdin = HEAP32[((_stdin)>>2)];
      return _fscanf(stdin, format, varargs);
    }
  function _dup2(fildes, fildes2) {
      // int dup2(int fildes, int fildes2);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/dup.html
      if (fildes2 < 0) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (fildes === fildes2 && FS.streams[fildes]) {
        return fildes;
      } else {
        _close(fildes2);
        return _fcntl(fildes, 0, allocate([fildes2, 0, 0, 0], 'i32', ALLOC_STACK), true);  // F_DUPFD.
      }
    }
  var _execlp=_execl;
  function _fstat(fildes, buf) {
      // int fstat(int fildes, struct stat *buf);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/fstat.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else {
        var pathArray = intArrayFromString(FS.streams[fildes].path);
        return _stat(allocate(pathArray, 'i8', ALLOC_STACK), buf);
      }
    }
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (!path.object.write) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        delete path.parentObject.contents[path.name];
        return 0;
      }
    }
  function _utimes() { throw 'utimes not implemented' }
  function _mknod(path, mode, dev) {
      // int mknod(const char *path, mode_t mode, dev_t dev);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/mknod.html
      if (dev !== 0 || !(mode & 0xC000)) {  // S_IFREG | S_IFDIR.
        // Can't create devices or pipes through mknod().
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var properties = {contents: [], isFolder: Boolean(mode & 0x4000)};  // S_IFDIR.
        path = FS.analyzePath(Pointer_stringify(path));
        try {
          FS.createObject(path.parentObject, path.name, properties,
                          mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
          return 0;
        } catch (e) {
          return -1;
        }
      }
    }function _mkdir(path, mode) {
      // int mkdir(const char *path, mode_t mode);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/mkdir.html
      return _mknod(path, 0x4000 | (mode & 0x180), 0);  // S_IFDIR, S_IRUSR | S_IWUSR.
    }
  function _getlogin_r(name, namesize) {
      // int getlogin_r(char *name, size_t namesize);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/getlogin.html
      var ret = 'root';
      if (namesize < ret.length + 1) {
        return ___setErrNo(ERRNO_CODES.ERANGE);
      } else {
        for (var i = 0; i < ret.length; i++) {
          HEAP8[(((name)+(i))|0)]=ret.charCodeAt(i)
        }
        HEAP8[(((name)+(i))|0)]=0
        return 0;
      }
    }function _getlogin() {
      // char *getlogin(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/getlogin.html
      if (!_getlogin.ret) _getlogin.ret = _malloc(8);
      return _getlogin_r(_getlogin.ret, 8) ? 0 : _getlogin.ret;
    }
  function _getpwnam() { throw 'getpwnam: TODO' }
  function _getgid() {
      // gid_t getgid(void);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/getgid.html
      // We have just one process/group/user, all with ID 0.
      return 0;
    }var _geteuid=_getgid;
  function _getpwuid(uid) {
      return 0; // NULL
    }
  function _isprint(chr) {
      return 0x1F < chr && chr < 0x7F;
    }
  function _strcasecmp(px, py) {
      px = px|0; py = py|0;
      return _strncasecmp(px, py, -1)|0;
    }
var _setmntent; // stub for _setmntent
var _getmntent; // stub for _getmntent
var _endmntent; // stub for _endmntent
  function _setlocale(category, locale) {
      if (!_setlocale.ret) _setlocale.ret = allocate([0], 'i8', ALLOC_NORMAL);
      return _setlocale.ret;
    }
  function _lockf(fildes, func, size) {
      // int lockf(int fildes, int function, off_t size);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lockf.html
      if (FS.streams[fildes]) {
        // Pretend whatever locking or unlocking operation succeeded. Locking does
        // not make much sense, since we have a single process/thread.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _setgid(gid) {
      // int setgid(gid_t gid);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/setgid.html
      // We have just one process/group/user, so it makes no sense to set IDs.
      ___setErrNo(ERRNO_CODES.EPERM);
      return -1;
    }
  var _setuid=_setgid;
  var _seteuid=_setgid;
  var _getuid=_getgid;
  var _getegid=_getgid;
  function _signal(sig, func) {
      // TODO
      return 0;
    }
  function _sigaction(set) {
      // TODO:
      return 0;
    }
  function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    }
  function _chdir(path) {
      // int chdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/chdir.html
      // NOTE: The path argument may be a string, to simplify fchdir().
      if (typeof path !== 'string') path = Pointer_stringify(path);
      path = FS.analyzePath(path);
      if (!path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (!path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return -1;
      } else {
        FS.currentPath = path.path;
        return 0;
      }
    }
  function _readdir_r(dirp, entry, result) {
      // int readdir_r(DIR *dirp, struct dirent *entry, struct dirent **result);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EBADF);
      }
      var stream = FS.streams[dirp];
      var loc = stream.position;
      var entries = 0;
      for (var key in stream.contents) entries++;
      if (loc < -2 || loc >= entries) {
        HEAP32[((result)>>2)]=0
      } else {
        var name, inode, type;
        if (loc === -2) {
          name = '.';
          inode = 1;  // Really undefined.
          type = 4; //DT_DIR
        } else if (loc === -1) {
          name = '..';
          inode = 1;  // Really undefined.
          type = 4; //DT_DIR
        } else {
          var object;
          name = stream.contents[loc];
          object = stream.object.contents[name];
          inode = object.inodeNumber;
          type = object.isDevice ? 2 // DT_CHR, character device.
                : object.isFolder ? 4 // DT_DIR, directory.
                : object.link !== undefined ? 10 // DT_LNK, symbolic link.
                : 8; // DT_REG, regular file.
        }
        stream.position++;
        var offsets = ___dirent_struct_layout;
        HEAP32[(((entry)+(offsets.d_ino))>>2)]=inode
        HEAP32[(((entry)+(offsets.d_off))>>2)]=stream.position
        HEAP32[(((entry)+(offsets.d_reclen))>>2)]=name.length + 1
        for (var i = 0; i < name.length; i++) {
          HEAP8[(((entry + offsets.d_name)+(i))|0)]=name.charCodeAt(i)
        }
        HEAP8[(((entry + offsets.d_name)+(i))|0)]=0
        HEAP8[(((entry)+(offsets.d_type))|0)]=type
        HEAP32[((result)>>2)]=entry
      }
      return 0;
    }function _readdir(dirp) {
      // struct dirent *readdir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      } else {
        if (!_readdir.result) _readdir.result = _malloc(4);
        _readdir_r(dirp, FS.streams[dirp].currentEntry, _readdir.result);
        if (HEAP32[((_readdir.result)>>2)] === 0) {
          return 0;
        } else {
          return FS.streams[dirp].currentEntry;
        }
      }
    }
  function _fchdir(fildes) {
      // int fchdir(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fchdir.html
      if (FS.streams[fildes]) {
        return _chdir(FS.streams[fildes].path);
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _opendir(dirname) {
      // DIR *opendir(const char *dirname);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/opendir.html
      // NOTE: Calculating absolute path redundantly since we need to associate it
      //       with the opened stream.
      var path = FS.absolutePath(Pointer_stringify(dirname));
      if (path === null) {
        ___setErrNo(ERRNO_CODES.ENOENT);
        return 0;
      }
      var target = FS.findObject(path);
      if (target === null) return 0;
      if (!target.isFolder) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return 0;
      } else if (!target.read) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return 0;
      }
      var id = FS.streams.length; // Keep dense
      var contents = [];
      for (var key in target.contents) contents.push(key);
      FS.streams[id] = {
        path: path,
        object: target,
        // An index into contents. Special values: -2 is ".", -1 is "..".
        position: -2,
        isRead: true,
        isWrite: false,
        isAppend: false,
        error: false,
        eof: false,
        ungotten: [],
        // Folder-specific properties:
        // Remember the contents at the time of opening in an array, so we can
        // seek between them relying on a single order.
        contents: contents,
        // Each stream has its own area for readdir() returns.
        currentEntry: _malloc(___dirent_struct_layout.__size__)
      };
      return id;
    }
  function _closedir(dirp) {
      // int closedir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/closedir.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EBADF);
      } else {
        _free(FS.streams[dirp].currentEntry);
        FS.streams[dirp] = null;
        return 0;
      }
    }
  function _fdopen(fildes, mode) {
      // FILE *fdopen(int fildes, const char *mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fdopen.html
      if (FS.streams[fildes]) {
        var stream = FS.streams[fildes];
        mode = Pointer_stringify(mode);
        if ((mode.indexOf('w') != -1 && !stream.isWrite) ||
            (mode.indexOf('r') != -1 && !stream.isRead) ||
            (mode.indexOf('a') != -1 && !stream.isAppend) ||
            (mode.indexOf('+') != -1 && (!stream.isRead || !stream.isWrite))) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return 0;
        } else {
          stream.error = false;
          stream.eof = false;
          return fildes;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
    }
  function _isatty(fildes) {
      // int isatty(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/isatty.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
      if (FS.streams[fildes].isTerminal) return 1;
      ___setErrNo(ERRNO_CODES.ENOTTY);
      return 0;
    }
  var _vfprintf=_fprintf;
  function _llvm_va_end() {}
var _tcgetattr; // stub for _tcgetattr
var _tcsetattr; // stub for _tcsetattr
var _tcflush; // stub for _tcflush
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function _memchr(ptr, chr, num) {
      chr = unSign(chr);
      for (var i = 0; i < num; i++) {
        if (HEAP8[(ptr)] == chr) return ptr;
        ptr++;
      }
      return 0;
    }
  var _llvm_memset_p0i8_i64=_memset;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _putchar(c) {
      // int putchar(int c);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/putchar.html
      return _fputc(c, HEAP32[((_stdout)>>2)]);
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(name.lastIndexOf('.')+1)];
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
___buildEnvironment(ENV);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_unix_to_dos,0,_get_dir_data,0,_cleanup_tty,0,_scsi_read,0,_read_pass_through
,0,_mcd_callback,0,_normal_map,0,_mdir,0,_mbadblocks,0,_floppyd_flush
,0,_mformat,0,_unix_showfat,0,_pre_allocate_file,0,_get_dosConvert_pass_through,0,_fast_fat16_encode
,0,_read_filter,0,_mmd,0,_del_file,0,_view_attrib,0,_minfo
,0,_tty_time_out,0,_get_data_pass_through,0,_mpartition,0,_free_file,0,_createDirCallback
,0,_mmove,0,_recursive_attrib,0,_list_file,0,_unix_to_unix,0,_fast_fat32_encode
,0,_buf_free,0,_func1,0,_func2,0,_dos_copydir,0,_floppyd_reader
,0,_buf_write,0,_writeit,0,_write_filter,0,__warnx,0,_makeit
,0,_read_file,0,__unix_loop,0,_fast_fat16_decode,0,_mshortname,0,_mshowfat
,0,_fs_flush,0,_unix_copydir,0,_file_geom,0,__dos_loop,0,_dispatchToFile
,0,_attrib_file,0,_dos_name,0,_floppyd_geom,0,_mdel,0,_comp
,0,_floppyd_writer,0,_directory_dos_to_unix,0,_file_write,0,_file_data,0,_signal_handler
,0,_rename_directory,0,_unix_doctorfat,0,_write_file,0,_scsi_write,0,_buf_flush
,0,_file_free,0,_list_recurs_directory,0,_dos_showfat,0,_renameit,0,_mattrib
,0,_print_short_name,0,_buf_read,0,_fast_fat32_decode,0,_fat12_decode,0,_file_flush
,0,_concise_view_attrib,0,_replay_attrib,0,_root_map,0,_rename_oldsyntax,0,_finish_sc
,0,_flush_file,0,_file_discard,0,_get_file_data,0,_fat12_encode,0,_floppyd_data
,0,_mcat,0,_file_read,0,_floppyd_write,0,_floppyd_read,0,_mclasserase
,0,_dir_free,0,_mdoctorfat,0,_file_mdu,0,_mdu,0,_list_non_recurs_directory
,0,_mzip,0,_labelit,0,_rename_file,0,_mmount,0,_mlabel
,0,_fs_free,0,_mcopy,0,_free_filter,0,_dos_to_dos,0,_get_dosConvert
,0,_dos_to_unix,0,_floppyd_free,0,_dos_doctorfat,0,_dir_mdu,0,_write_pass_through,0,_label_name_uc,0,_mtoolstest,0,_mcd,0];
// EMSCRIPTEN_START_FUNCS
function _buf_flush(r1){var r2,r3,r4;r2=r1+32|0;do{if((HEAP32[r2>>2]|0)==0){r3=0}else{r4=__buf_flush(r1);if((r4|0)!=0){r3=r4;break}HEAP32[r2>>2]=0;r3=0}}while(0);return r3}function _buf_free(r1){var r2;r2=r1+52|0;r1=HEAP32[r2>>2];if((r1|0)!=0){_free(r1)}HEAP32[r2>>2]=0;return 0}function __buf_flush(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=HEAP32[r1+8>>2];if((r2|0)==0){r3=0;return r3}r4=r1+20|0;if((HEAP32[r4>>2]|0)==0){r3=0;return r3}r5=HEAP32[r1+44>>2];if((r5|0)<0){_fwrite(5259820,18,1,HEAP32[_stderr>>2]);r3=-1;return r3}r6=(r1+36|0)>>2;r7=HEAP32[r6];r8=(r1+40|0)>>2;r9=HEAP32[r8];r10=r2;r11=HEAP32[HEAP32[r2>>2]+4>>2];L20:do{if((r9|0)==(r7|0)){r12=0}else{r2=r7+r5|0;r13=r9-r7|0;r14=HEAP32[r1+52>>2]+r7|0;r15=0;while(1){r16=FUNCTION_TABLE[r11](r10,r14,r2,r13);if((r16|0)<1){break}r17=r16+r15|0;if((r13|0)==(r16|0)){r12=r17;break L20}else{r2=r16+r2|0;r13=r13-r16|0;r14=r14+r16|0;r15=r17}}r12=(r15|0)==0?r16:r15}}while(0);if((r12|0)==(HEAP32[r8]-HEAP32[r6]|0)){HEAP32[r4>>2]=0;HEAP32[r8]=0;HEAP32[r6]=0;r3=0;return r3}if((r12|0)<0){_perror(5257328);r3=-1;return r3}else{_fwrite(5254748,26,1,HEAP32[_stderr>>2]);r3=-1;return r3}}function _isInBuffer(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=r3>>2;r3=(r1+44|0)>>2;r5=HEAP32[r3];r6=HEAP32[r1+48>>2];do{if((r5|0)<=(r2|0)){if((r6+r5|0)>>>0<=r2>>>0){break}r7=r6+(r5-r2)|0;if(HEAP32[r4]>>>0<=r7>>>0){r8=2;return r8}HEAP32[r4]=r7;r8=2;return r8}}while(0);r7=r1+48|0;do{if((r6+r5|0)==(r2|0)){r9=HEAP32[r1+16>>2];if(r6>>>0>=r9>>>0){break}r10=HEAP32[r4];r11=r1+24|0;r12=HEAP32[r11>>2];if(r10>>>0<r12>>>0){break}r13=r9-r6|0;if(r10>>>0>r13>>>0){HEAP32[r4]=r13;r14=r13;r15=HEAP32[r11>>2]}else{r14=r10;r15=r12}HEAP32[r4]=r14-(r14>>>0)%(r15>>>0)|0;r8=1;return r8}}while(0);if((__buf_flush(r1)|0)<0){r8=3;return r8}r15=(r2>>>0)%(HEAP32[r1+24>>2]>>>0);r14=r2-r15|0;HEAP32[r3]=r14;HEAP32[r7>>2]=0;r7=r1+28|0;r1=HEAP32[r7>>2];r2=r1-r15|0;r15=HEAP32[r4];if(r15>>>0>r2>>>0){HEAP32[r4]=r2;r16=HEAP32[r7>>2];r17=HEAP32[r3];r18=r2}else{r16=r1;r17=r14;r18=r15}r15=r16-(r17>>>0)%(r16>>>0)|0;if(r18>>>0<=r15>>>0){r8=0;return r8}HEAP32[r4]=r15;r8=0;return r8}function _cp_open(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;r4=(r1|0)==0?850:r1;r1=_calloc(1,132);r5=r1;if((r1|0)==0){r6=r5;STACKTOP=r3;return r6}else{r7=5247636}while(1){r8=HEAP32[r7>>2];if((r8|0)==0){r2=55;break}if((r8|0)==(r4|0)){r2=54;break}else{r7=r7+132|0}}if(r2==54){r8=r1;HEAP32[r8>>2]=r7+4|0;r9=r8}else if(r2==55){r9=r1}r2=HEAP32[r9>>2];if((r2|0)==0){_fprintf(HEAP32[_stderr>>2],5263e3,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));_free(r1);r6=0;STACKTOP=r3;return r6}else{r10=0;r11=r2}while(1){r2=HEAP8[r11+r10|0]<<24>>24;if((r2&128|0)!=0){HEAP8[r1+(r2&127)+4|0]=(r10|128)&255}r2=r10+1|0;if((r2|0)==128){r6=r5;break}r10=r2;r11=HEAP32[r9>>2]}STACKTOP=r3;return r6}function _buf_init(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;if(((r2|0)%(r3|0)|0)!=0){_fwrite(5264304,35,1,HEAP32[_stderr>>2]);_exit(1)}if(((r3|0)%(r4|0)|0)!=0){_fwrite(5264260,42,1,HEAP32[_stderr>>2]);_exit(1)}r5=(r1+12|0)>>2;r6=HEAP32[r5];if((r6|0)!=0){r7=r1+4|0;HEAP32[r7>>2]=HEAP32[r7>>2]-1|0;r7=r6+4|0;HEAP32[r7>>2]=HEAP32[r7>>2]+1|0;r8=HEAP32[r5];return r8}r7=_malloc(56),r6=r7>>2;r9=r7;if((r7|0)==0){r8=0;return r8}r10=_malloc(r2);HEAP32[r6+13]=r10;if((r10|0)==0){_free(r7);r8=0;return r8}else{HEAP32[r6+4]=r2;HEAP32[r6+5]=0;HEAP32[r6+7]=r3;HEAP32[r6+6]=r4;r4=(r7+32|0)>>2;HEAP32[r4]=0;HEAP32[r4+1]=0;HEAP32[r4+2]=0;HEAP32[r4+3]=0;HEAP32[r4+4]=0;HEAP32[r6+2]=r1;HEAP32[r6]=5265124;HEAP32[r6+1]=1;HEAP32[r6+3]=0;HEAP32[r5]=r9;r8=r9;return r8}}function _buf_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r5=r1>>2;r6=STACKTOP;STACKTOP=STACKTOP+4|0;r7=r6,r8=r7>>2;HEAP32[r8]=r4;if((r4|0)==0){r9=0;STACKTOP=r6;return r9}r4=_isInBuffer(r1,r3,r7);do{if((r4|0)==0|(r4|0)==1){r7=HEAP32[r5+7];r10=r1+44|0;r11=r1+48|0;r12=r11;r13=HEAP32[r12>>2];r14=r13+HEAP32[r10>>2]|0;r15=r7-(r14>>>0)%(r7>>>0)|0;r7=HEAP32[r5+4]-r13|0;r16=HEAP32[r5+2];r17=r1+52|0;r18=FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]>>2]](r16,HEAP32[r17>>2]+r13|0,r14,r15>>>0>r7>>>0?r7:r15);if((r18|0)<0){r9=r18;STACKTOP=r6;return r9}r15=HEAP32[r12>>2]+r18|0;HEAP32[r11>>2]=r15;r11=HEAP32[r10>>2];if((r11+r15|0)>>>0>=r3>>>0){r19=r11;r20=r15;r21=r17;break}_fwrite(5263640,18,1,HEAP32[_stderr>>2]);_exit(1)}else if((r4|0)==3){r9=-1;STACKTOP=r6;return r9}else{r19=HEAP32[r5+11];r20=HEAP32[r5+12];r21=r1+52|0}}while(0);r1=r3-r19|0;r19=HEAP32[r21>>2]+r1|0;r21=r20-r1|0;r1=HEAP32[r8];if(r1>>>0>r21>>>0){HEAP32[r8]=r21;r22=r21}else{r22=r1}_memcpy(r2,r19,r22);r9=r22;STACKTOP=r6;return r9}function _buf_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r5=r1>>2;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+4|0;r8=r7,r9=r8>>2;HEAP32[r9]=r4;if((r4|0)==0){r10=0;STACKTOP=r7;return r10}HEAP32[r5+8]=1;r4=_isInBuffer(r1,r3,r8);do{if((r4|0)==0){r8=HEAP32[r5+7];if(((r3>>>0)%(r8>>>0)|0)==0){r11=HEAP32[r9];r12=HEAP32[r5+6];if(r11>>>0>=r12>>>0){r13=r11;r14=r12;r6=107;break}}r12=r1+44|0;r11=HEAP32[r12>>2];r15=r8-(r11>>>0)%(r8>>>0)|0;r8=HEAP32[r5+2];r16=r1+52|0;r17=FUNCTION_TABLE[HEAP32[HEAP32[r8>>2]>>2]](r8,HEAP32[r16>>2],r11,r15);if((r17|0)<0){r10=r17;STACKTOP=r7;return r10}r11=r1+24|0;r8=HEAP32[r11>>2];do{if(((r17>>>0)%(r8>>>0)|0)==0){r18=r17}else{_fprintf(HEAP32[_stderr>>2],5252616,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r17,HEAP32[tempInt+4>>2]=r8,tempInt));r19=(r17>>>0)%(HEAP32[r11>>2]>>>0);if((r17|0)!=(r19|0)){r18=r17-r19|0;break}_fwrite(5251820,13,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);r17=r1+48|0;HEAP32[r17>>2]=r18;if((r18|0)==0){_memset(HEAP32[r16>>2],0,r15);HEAP32[r17>>2]=r15;r20=r15}else{r20=r18}r17=r1+48|0;r21=r3-HEAP32[r12>>2]|0;r22=HEAP32[r9];r23=r20;r24=r17;r25=r17;break}else if((r4|0)==1){r13=HEAP32[r9];r14=HEAP32[r5+6];r6=107;break}else if((r4|0)==2){r17=r3-HEAP32[r5+11]|0;r11=r1+48|0;r8=r11;r19=HEAP32[r8>>2];r26=r19-r17|0;r27=HEAP32[r9];if(r27>>>0<=r26>>>0){r21=r17;r22=r27;r23=r19;r24=r11;r25=r8;break}HEAP32[r9]=r26;r21=r17;r22=r26;r23=r19;r24=r11;r25=r8;break}else if((r4|0)==3){r10=-1;STACKTOP=r7;return r10}else{_exit(1)}}while(0);do{if(r6==107){r4=r13-(r13>>>0)%(r14>>>0)|0;HEAP32[r9]=r4;r20=HEAP32[r5+11];r18=r3-r20|0;r8=HEAP32[r5+4]-r18|0;if(r4>>>0>r8>>>0){HEAP32[r9]=r8;r28=r8}else{r28=r4}r4=r1+48|0;r8=r4;r11=HEAP32[r8>>2]+r28|0;HEAP32[r4>>2]=r11;r19=HEAP32[r5+2];r26=HEAP32[HEAP32[r19>>2]+24>>2];if((r26|0)==0){r21=r18;r22=r28;r23=r11;r24=r4;r25=r8;break}FUNCTION_TABLE[r26](r19,r20+r11|0);r21=r18;r22=r28;r23=HEAP32[r8>>2];r24=r4;r25=r8}}while(0);r28=HEAP32[r5+13]+r21|0;r3=r22+r21|0;if(r3>>>0>r23>>>0){r23=r22-(r3>>>0)%(HEAP32[r5+6]>>>0)|0;HEAP32[r9]=r23;HEAP32[r24>>2]=r23+r21|0;r29=r23}else{r29=r22}_memcpy(r28,r2,r29);r2=(r1+20|0)>>2;r28=(r1+36|0)>>2;do{if((HEAP32[r2]|0)==0){HEAP32[r28]=r21-(r21>>>0)%(HEAP32[r5+6]>>>0)|0;r30=r1+40|0;r6=121;break}else{if(r21>>>0<HEAP32[r28]>>>0){HEAP32[r28]=r21-(r21>>>0)%(HEAP32[r5+6]>>>0)|0}r22=r1+40|0;r23=HEAP32[r22>>2];if((r29+r21|0)>>>0>r23>>>0){r30=r22;r6=121;break}else{r31=r23;break}}}while(0);if(r6==121){r6=HEAP32[r5+6];r5=r21-1+r29+r6|0;r28=r5-(r5>>>0)%(r6>>>0)|0;HEAP32[r30>>2]=r28;r31=r28}r28=HEAP32[r25>>2];if(r31>>>0>r28>>>0){r25=(r1+24|0)>>2;r1=HEAP32[r25];_fprintf(HEAP32[_stderr>>2],5251132,(tempInt=STACKTOP,STACKTOP=STACKTOP+20|0,HEAP32[tempInt>>2]=r31,HEAP32[tempInt+4>>2]=r28,HEAP32[tempInt+8>>2]=r29,HEAP32[tempInt+12>>2]=r21,HEAP32[tempInt+16>>2]=r1,tempInt));r1=r21-1+r29|0;_fprintf(HEAP32[_stderr>>2],5250416,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1+HEAP32[r25]|0,tempInt));r21=HEAP32[r25];r25=r1+r21|0;_fprintf(HEAP32[_stderr>>2],5249744,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r25-(r25>>>0)%(r21>>>0)|0,tempInt));_fprintf(HEAP32[_stderr>>2],5264240,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2],tempInt));_exit(1)}HEAP32[r2]=1;r10=r29;STACKTOP=r7;return r10}function _set_cmd_line_image(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3,r5=r4>>2;r6=HEAP32[1311906];do{if((r6|0)<(HEAP32[1311237]-2|0)){r7=r6}else{r8=(r6<<1)+4|0;HEAP32[1311237]=r8;r9=_realloc(HEAP32[1311840],r8*72&-1);HEAP32[1311840]=r9;if((r9|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else{r7=HEAP32[1311906];break}}}while(0);L174:do{if((r7|0)>0){r6=r7;while(1){r9=HEAP32[1311840];r8=r6-1|0;_memcpy(r9+(r6*72&-1)|0,r9+(r8*72&-1)|0,72);if((r8|0)>0){r6=r8}else{break L174}}}}while(0);HEAP32[1311907]=0;HEAP32[1311906]=r7+1|0;_memset(HEAP32[1311840],0,72);HEAP32[HEAP32[1311840]+44>>2]=2;HEAP8[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+4|0]=58;HEAP8[5247608]=58;r7=_strstr(r1,5263284);if((r7|0)==0){r6=_strdup(r1);HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)>>2]=r6;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+32>>2]=0}else{r6=_strndup(r1,r7-r1|0);HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)>>2]=r6;HEAP32[r5]=0;r6=_strtol(r7+2|0,r4,0);L181:do{if((r6|0)<1){r10=0}else{r4=HEAP32[r5];r7=r4+1|0;HEAP32[r5]=r7;r1=HEAP8[r4];do{if(r1<<24>>24==109|r1<<24>>24==77){r11=r6<<20;r2=144;break}else if(r1<<24>>24==103|r1<<24>>24==71){r11=r6<<30;r2=144;break}else if(r1<<24>>24==115|r1<<24>>24==83){r11=r6<<9;r2=144;break}else if(r1<<24>>24==107|r1<<24>>24==75){r11=r6<<10;r2=144;break}else if(r1<<24>>24==0){r12=r6}else{r10=0;break L181}}while(0);if(r2==144){if(HEAP8[r7]<<24>>24==0){r12=r11}else{r10=0;break}}r10=r12}}while(0);HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+32>>2]=r10}HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+8>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+16>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+20>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+24>>2]=0;r10=_strchr(HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)>>2],124);if((r10|0)==0){STACKTOP=r3;return}HEAP8[r10]=0;_strncpy(5248832,r10+1|0,256);HEAP8[5249088]=0;HEAP32[1311699]=0;HEAP32[1311703]=5259412;HEAP32[1311306]=0;HEAP32[1311307]=0;HEAP32[1311160]=5248832;HEAP32[1310728]=0;while(1){if((_parse_one(0)|0)==0){break}}STACKTOP=r3;return}function _parse_one(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+1040|0;r4=r3;r5=r3+1024;r6=r3+1028;_skip_junk(0);r7=HEAP32[1311160];if((r7|0)==0){HEAP32[1310727]=0;HEAP32[1310728]=0;r8=0;STACKTOP=r3;return r8}HEAP32[1310728]=r7;r9=_strcspn(r7,5263764);HEAP32[1310727]=r9;HEAP32[1311160]=r7+r9|0;do{if((r9|0)==5){if((_strncasecmp(5252472,r7,5)|0)==0){r10=1;r2=161;break}else{break}}else if((r9|0)==11){r2=160}else if((r9|0)==6){if((_strncasecmp(5252348,r7,6)|0)==0){r10=2;r2=161;break}if((_strncasecmp(5252212,r7,6)|0)==0){r10=3;r2=161;break}if((r9|0)==11){r2=160;break}else{r2=194;break}}else{r2=194}}while(0);do{if(r2==160){if((_strncasecmp(5252128,r7,11)|0)==0){r10=4;r2=161;break}else{break}}else if(r2==194){if(!((HEAP32[1310726]|0)==1&(r9|0)==1)){break}r11=HEAP8[r7];r12=r4|0;_finish_drive_clause();r13=HEAP32[1311705];r14=_toupper(r11<<24>>24);r11=HEAP32[1311906];L213:do{if((r11|0)>0){r15=r14<<24>>24;r16=0;r17=0;while(1){r18=HEAP32[1311840];do{if((HEAP8[r18+(r16*72&-1)+4|0]<<24>>24|0)==(r15|0)){if((HEAP32[r18+(r16*72&-1)+56>>2]|0)==(r13|0)){r2=199;break}else{r19=r17;break}}else{r2=199}}while(0);if(r2==199){r2=0;_memcpy(r18+(r17*72&-1)|0,r18+(r16*72&-1)|0,72);r19=r17+1|0}r20=r16+1|0;if((r20|0)==(r11|0)){r21=r19;break L213}else{r16=r20;r17=r19}}}else{r21=0}}while(0);HEAP32[1311906]=r21;do{if((r21|0)<(HEAP32[1311237]-2|0)){r22=r21;r23=HEAP32[1311840]}else{r11=(r21<<1)+4|0;HEAP32[1311237]=r11;r13=_realloc(HEAP32[1311840],r11*72&-1);r11=r13;HEAP32[1311840]=r11;if((r13|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else{r22=HEAP32[1311906];r23=r11;break}}}while(0);HEAP32[1311907]=r22;HEAP32[1311906]=r22+1|0;_memset(r23+(r22*72&-1)|0,0,72);HEAP32[HEAP32[1311840]+(r22*72&-1)+44>>2]=2;r11=HEAP32[1311907];r13=HEAP32[1311840];r14=_sscanf(HEAP32[1310728],5263912,(tempInt=STACKTOP,STACKTOP=STACKTOP+28|0,HEAP32[tempInt>>2]=r13+(r11*72&-1)+4|0,HEAP32[tempInt+4>>2]=r12,HEAP32[tempInt+8>>2]=r13+(r11*72&-1)+8|0,HEAP32[tempInt+12>>2]=r13+(r11*72&-1)+16|0,HEAP32[tempInt+16>>2]=r13+(r11*72&-1)+20|0,HEAP32[tempInt+20>>2]=r13+(r11*72&-1)+24|0,HEAP32[tempInt+24>>2]=r5,tempInt));HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+32>>2]=HEAP32[r5>>2];do{if((r14|0)==3){r2=208}else if((r14|0)==6){r2=209}else if((r14|0)==0|(r14|0)==1|(r14|0)==4|(r14|0)==5){_syntax(5263836,1)}else if((r14|0)==2){HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+8>>2]=0;r2=208;break}}while(0);do{if(r2==208){HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+24>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+20>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+16>>2]=0;r2=209;break}}while(0);if(r2==209){HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+32>>2]=0}r14=HEAP32[1311907];r11=HEAP32[1311840];if((HEAP32[r11+(r14*72&-1)+16>>2]|0)==0){HEAP32[r11+(r14*72&-1)+24>>2]=0;HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+20>>2]=0;r24=HEAP32[1311907];r25=HEAP32[1311840]}else{r24=r14;r25=r11}r11=_toupper(HEAP8[r25+(r24*72&-1)+4|0]<<24>>24)&255;HEAP8[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+4|0]=r11;r11=HEAP8[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+4|0];r14=HEAP8[5247608];do{if(r14<<24>>24==0){r2=215}else if(r14<<24>>24!=58){if(r14<<24>>24>r11<<24>>24){r2=215;break}else{break}}}while(0);if(r2==215){HEAP8[5247608]=r11}r14=_strdup(r12);HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)>>2]=r14;if((r14|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}_finish_drive_clause();HEAP32[1311160]=0;r8=1;STACKTOP=r3;return r8}}while(0);if(r2==161){_finish_drive_clause();_skip_junk(0);r24=HEAP32[1311160];if((r24|0)==0){HEAP32[1310727]=0;HEAP32[1310728]=0;_syntax(5252072,0)}HEAP32[1310728]=r24;r25=_strcspn(r24,5263764);HEAP32[1310727]=r25;HEAP32[1311160]=r24+r25|0;if((r25|0)!=1){_syntax(5252072,0)}do{if((r10|0)==3){r26=HEAP32[1311906];r2=175;break}else if((r10|0)==4|(r10|0)==1){r25=HEAP32[1311705];r5=_toupper(HEAP8[r24]<<24>>24);r22=HEAP32[1311906];L263:do{if((r22|0)>0){r23=r5<<24>>24;r21=0;r19=0;while(1){r4=HEAP32[1311840];do{if((HEAP8[r4+(r21*72&-1)+4|0]<<24>>24|0)==(r23|0)){if((HEAP32[r4+(r21*72&-1)+56>>2]|0)==(r25|0)){r2=172;break}else{r27=r19;break}}else{r2=172}}while(0);if(r2==172){r2=0;_memcpy(r4+(r19*72&-1)|0,r4+(r21*72&-1)|0,72);r27=r19+1|0}r18=r21+1|0;if((r18|0)==(r22|0)){r28=r27;break L263}else{r21=r18;r19=r27}}}else{r28=0}}while(0);HEAP32[1311906]=r28;if((r10|0)==3){r26=r28;r2=175;break}else if((r10|0)==4){r8=1}else{r29=r28;r2=182;break}STACKTOP=r3;return r8}else{r29=HEAP32[1311906];r2=182;break}}while(0);if(r2==175){do{if((r26|0)<(HEAP32[1311237]-2|0)){r30=r26}else{r28=(r26<<1)+4|0;HEAP32[1311237]=r28;r10=_realloc(HEAP32[1311840],r28*72&-1);HEAP32[1311840]=r10;if((r10|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else{r30=HEAP32[1311906];break}}}while(0);L282:do{if((r30|0)>0){r26=r30;while(1){r10=HEAP32[1311840];r28=r26-1|0;_memcpy(r10+(r26*72&-1)|0,r10+(r28*72&-1)|0,72);if((r28|0)>0){r26=r28}else{break L282}}}}while(0);HEAP32[1311907]=0;HEAP32[1311906]=r30+1|0;_memset(HEAP32[1311840],0,72);HEAP32[HEAP32[1311840]+44>>2]=2}else if(r2==182){do{if((r29|0)<(HEAP32[1311237]-2|0)){r31=r29;r32=HEAP32[1311840]}else{r30=(r29<<1)+4|0;HEAP32[1311237]=r30;r26=_realloc(HEAP32[1311840],r30*72&-1);r30=r26;HEAP32[1311840]=r30;if((r26|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else{r31=HEAP32[1311906];r32=r30;break}}}while(0);HEAP32[1311907]=r31;HEAP32[1311906]=r31+1|0;_memset(r32+(r31*72&-1)|0,0,72);HEAP32[HEAP32[1311840]+(r31*72&-1)+44>>2]=2}_memset(HEAP32[1311840]+(HEAP32[1311907]*72&-1)|0,0,72);HEAP32[1310725]=r1;HEAP32[1311700]=0;r1=_toupper(HEAP8[HEAP32[1310728]]<<24>>24)&255;HEAP8[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+4|0]=r1;r1=HEAP8[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+4|0];r31=HEAP8[5247608];do{if(r31<<24>>24==0){r2=190}else if(r31<<24>>24!=58){if(r31<<24>>24>r1<<24>>24){r2=190;break}else{break}}}while(0);if(r2==190){HEAP8[5247608]=r1}r1=r6|0;_skip_junk(1);r6=HEAP32[1311160];if(HEAP8[r6]<<24>>24!=58){_sprintf(r1,5263784,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=58,tempInt));_syntax(r1,1)}HEAP32[1311160]=r6+1|0;r8=1;STACKTOP=r3;return r8}r6=HEAP32[1311907];L305:do{if((r6|0)>=0){if((_set_var(5246860,14,HEAP32[1311840]+(r6*72&-1)|0)|0)==0){r8=1;STACKTOP=r3;return r8}r1=HEAP32[1311907];r31=HEAP32[1311840];r32=HEAP32[1310727];r29=HEAP32[1310728];do{if((r32|0)==4){if((_strncasecmp(5250048,r29,4)|0)==0){r33=0;r2=225;break}if((_strncasecmp(5249976,r29,4)|0)==0){r33=2;r2=225;break}if((r32|0)==6){r2=235;break}else if((r32|0)==12){r2=236;break}else if((r32|0)==10){r2=238;break}else if((r32|0)!=4){r34=0;break}if((_strncasecmp(5250524,r29,4)|0)==0){r35=0;r2=228;break}if((_strncasecmp(5250292,r29,4)|0)==0){r35=5;r2=228;break}if((_strncasecmp(5250096,r29,4)|0)==0){r35=7;r2=228;break}else{r34=0;break}}else if((r32|0)==9){if((_strncasecmp(5250020,r29,9)|0)==0){r33=1;r2=225;break}else{r34=0;break}}else if((r32|0)==6){r2=235}else if((r32|0)==12){r2=236}else if((r32|0)==10){r2=238}else{r34=0}}while(0);do{if(r2==225){r30=r31+(r1*72&-1)+12|0;HEAP32[r30>>2]=HEAP32[r30>>2]|HEAP32[(r33<<3)+5244676>>2];r8=1;STACKTOP=r3;return r8}else if(r2==235){if((_strncasecmp(5250484,r29,6)|0)==0){r35=1;r2=228;break}if((_strncasecmp(5250384,r29,6)|0)==0){r35=3;r2=228;break}if((_strncasecmp(5250192,r29,6)|0)==0){r35=6;r2=228;break}else{r34=0;break}}else if(r2==236){if((_strncasecmp(5250400,r29,12)|0)==0){r35=2;r2=228;break}else{r34=0;break}}else if(r2==238){if((_strncasecmp(5259608,r29,10)|0)==0){r35=4;r2=228;break}else{r34=0;break}}}while(0);if(r2==228){r30=HEAP32[(r35<<3)+5245152>>2];HEAP32[1311700]=HEAP32[1311700]|r30;_skip_junk(0);r26=HEAP32[1311160];do{if((r26|0)!=0){if(HEAP8[r26]<<24>>24!=61){break}HEAP32[1311160]=r26+1|0;_skip_junk(1);r28=HEAP32[1311160];r10=_strtol(r28,5244640,0);r27=HEAP32[1311160];if((r28|0)==(r27|0)){_syntax(5250780,0)}HEAP32[1311160]=r27+1|0;HEAP32[1310726]=HEAP32[1310726]+1|0;if((r10|0)==1){break}else if((r10|0)==0){r8=1;STACKTOP=r3;return r8}else{_syntax(5250856,0)}}}while(0);r26=r31+(r1*72&-1)+40|0;HEAP32[r26>>2]=HEAP32[r26>>2]|r30;r8=1;STACKTOP=r3;return r8}while(1){r26=HEAP32[(r34<<4)+5247368>>2];if((_strlen(r26)|0)==(r32|0)){if((_strncasecmp(r26,r29,r32)|0)==0){break}}r26=r34+1|0;if(r26>>>0<15){r34=r26}else{break L305}}r32=r31+(r1*72&-1)+44|0;if((HEAP32[r32>>2]|0)==0){HEAP32[r32>>2]=2}r32=r31+(r1*72&-1)+16|0;if((HEAP32[r32>>2]|0)==0){HEAP32[r32>>2]=HEAP32[(r34<<4)+5247376>>2]}r32=r31+(r1*72&-1)+20|0;if((HEAP32[r32>>2]|0)==0){HEAP32[r32>>2]=HEAPU16[(r34<<4)+5247380>>1]}r32=r31+(r1*72&-1)+24|0;if((HEAP32[r32>>2]|0)==0){HEAP32[r32>>2]=HEAPU16[(r34<<4)+5247382>>1]}r32=r31+(r1*72&-1)+8|0;if((HEAP32[r32>>2]|0)!=0){r8=1;STACKTOP=r3;return r8}HEAP32[r32>>2]=HEAP8[(r34<<4)+5247372|0]<<24>>24;r8=1;STACKTOP=r3;return r8}}while(0);if((_set_var(5245348,11,0)|0)==0){r8=1;STACKTOP=r3;return r8}else{_syntax(5251912,1)}}function _read_config(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=0;HEAP32[1311705]=0;HEAP32[1311906]=0;HEAP32[1311237]=2;r2=_calloc(2,72);HEAP32[1311840]=r2;if((r2|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}if((_parse(5256864,1)|_parse(5254272,1)|_parse(5252444,1)|0)==0){_parse(5251708,1);_parse(5250932,1)}r2=_getenv(5261256);do{if((r2|0)==0){r3=_getenv(5258672);do{if((r3|0)==0){r4=_getlogin();if((r4|0)==0){r1=279;break}else{r5=r4;r1=278;break}}else{r5=r3;r1=278}}while(0);do{if(r1==278){r3=_getpwnam(r5);if((r3|0)==0){r1=279;break}else{r6=r3;break}}}while(0);if(r1==279){r3=_getpwuid(_getgid());if((r3|0)==0){break}else{r6=r3}}r3=HEAP32[r6+24>>2];if((r3|0)==0){break}else{r7=r3;r1=281;break}}else{r7=r2;r1=281}}while(0);if(r1==281){_strncpy(5243600,r7,1024);HEAP8[5244624]=0;_memcpy(_strlen(5243600)+5243600|0,5250228,11);_parse(5243600,0)}_memset(HEAP32[1311840]+(HEAP32[1311906]*72&-1)|0,0,72);r7=_getenv(5249540);do{if((r7|0)==0){r8=0}else{_parse(r7,0);r8=0;break}}while(0);while(1){r7=_getenv(HEAP32[(r8*12&-1)+5245348>>2]);do{if((r7|0)!=0){r1=(r8*12&-1)+5245356|0;r2=HEAP32[r1>>2];if((r2|0)==0){r6=_strtol(r7,0,0);HEAP32[HEAP32[(r8*12&-1)+5245352>>2]>>2]=r6;r9=HEAP32[r1>>2]}else{r9=r2}if((r9|0)==2){r2=_strtoul(r7,0,0);HEAP32[HEAP32[(r8*12&-1)+5245352>>2]>>2]=r2;break}else if((r9|0)==1){HEAP32[HEAP32[(r8*12&-1)+5245352>>2]>>2]=r7;break}else{break}}}while(0);r7=r8+1|0;if((r7|0)==11){break}else{r8=r7}}if((HEAP32[1311255]|0)==0){return}HEAP32[1311262]=1;return}function _parse(r1,r2){var r3,r4,r5;r3=STACKTOP;r4=HEAP32[1311699];if((r4|0)!=0){_fprintf(HEAP32[_stderr>>2],5254236,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));_exit(1)}r4=_fopen(r1,5259996);HEAP32[1311699]=r4;if((r4|0)==0){r5=0;STACKTOP=r3;return r5}HEAP32[1311705]=HEAP32[1311705]+1|0;HEAP32[1311703]=r1;HEAP32[1311306]=0;HEAP32[1311307]=0;HEAP32[1311160]=0;HEAP32[1310728]=0;HEAP32[1311907]=-1;while(1){if((_parse_one(r2)|0)==0){break}}_finish_drive_clause();_fclose(HEAP32[1311699]);HEAP32[1311703]=0;HEAP32[1311699]=0;r5=1;STACKTOP=r3;return r5}function _copyfile(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+131076|0;if((r1|0)==0){_fwrite(5263720,26,1,HEAP32[_stderr>>2]);r5=-1;STACKTOP=r4;return r5}if((r2|0)==0){_fwrite(5263612,26,1,HEAP32[_stderr>>2]);r5=-1;STACKTOP=r4;return r5}r6=r1|0;FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+20>>2]](r1,0,r4+131072,0,0);r7=r4|0;r8=r2;r9=r2;r2=0;while(1){r10=FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]>>2]](r1,r7,r2,131072);if((r10|0)<0){r3=311;break}if((r10|0)==0){r5=0;r3=326;break}if((HEAP32[1311336]|0)!=0){r5=-1;r3=329;break}r11=HEAP32[HEAP32[r9>>2]+4>>2];r12=r2;r13=r10;r14=r7;r15=0;while(1){r16=FUNCTION_TABLE[r11](r8,r14,r12,r13);if((r16|0)<1){r3=316;break}r17=r16+r15|0;if((r13|0)==(r16|0)){r18=r17;break}else{r12=r16+r12|0;r13=r13-r16|0;r14=r14+r16|0;r15=r17}}if(r3==316){r3=0;r18=(r15|0)==0?r16:r15}if((r18|0)==(r10|0)){r2=r10+r2|0}else{r3=319;break}}if(r3==311){_perror(5259596);r5=-1;STACKTOP=r4;return r5}else if(r3==319){if((r18|0)<0){_perror(5257116)}else{_fprintf(HEAP32[_stderr>>2],5254528,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r18,HEAP32[tempInt+4>>2]=r10,tempInt))}if((HEAP32[___errno_location()>>2]|0)!=28){r5=r10;STACKTOP=r4;return r5}HEAP32[1311336]=1;r5=r10;STACKTOP=r4;return r5}else if(r3==329){STACKTOP=r4;return r5}else if(r3==326){STACKTOP=r4;return r5}}function _isHashed(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=HEAP8[r2];L448:do{if(r3<<24>>24==0){r4=0}else{r5=0;r6=0;r7=r2;r8=r3;while(1){r9=_toupper(r8<<24>>24)<<24>>24;r10=Math.imul(r9+2|0,r9)^((r5>>>27|r5<<5)^Math.imul(r6+2|0,r6));r9=r7+1|0;r11=HEAP8[r9];if(r11<<24>>24==0){r4=r10;break L448}else{r5=r10;r6=r6+1|0;r7=r9;r8=r11}}}}while(0);r3=Math.imul(r4+2|0,r4);r4=r3<<12&16773120^r3;if((1<<(r4&31)&HEAP32[r1+((r4>>>5&127)<<2)+12>>2]|0)==0){r12=0;r13=r12&1;return r13}if((HEAP32[r1+(r4>>>25<<2)+524>>2]&1<<(r4>>>20&31)|0)==0){r12=0;r13=r12&1;return r13}r12=(HEAP32[r1+((r4>>>13&127)<<2)+1036>>2]&1<<(r4>>>8&31)|0)!=0;r13=r12&1;return r13}function _mtoolstest(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=0;do{if((r1|0)>1){r4=HEAP32[r2+4>>2];r5=HEAP8[r4];if(r5<<24>>24==0){r6=0;break}if(HEAP8[r4+1|0]<<24>>24!=58){r6=0;break}r6=_toupper(r5<<24>>24)<<24>>24}else{r6=0}}while(0);r2=HEAP32[1311840]|0;if((HEAP32[r2>>2]|0)==0){r7=HEAP32[1311262];r8=_printf(5257688,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7,tempInt));r9=HEAP32[1311255];r10=_printf(5257516,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt));r11=HEAP32[1311261];r12=_printf(5257304,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11,tempInt));_exit(0)}r1=(r6|0)==0;r5=r2,r2=r5>>2;while(1){r4=HEAP8[r5+4|0];do{if(r1){r3=349}else{if((r6|0)==(r4<<24>>24|0)){r3=349;break}else{break}}}while(0);if(r3==349){r3=0;_printf(5264100,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4<<24>>24,tempInt));r13=(r5+12|0)>>2;r14=HEAP32[r13];_printf(5263460,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r2+14],HEAP32[tempInt+4>>2]=r14,tempInt));r14=HEAP32[r2+17];if((r14|0)==0){_puts(5243384)}else{_printf(5262876,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt))}r14=HEAP32[r2+2];_printf(5261844,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r2],HEAP32[tempInt+4>>2]=r14,tempInt));r14=HEAP32[r2+5];r15=HEAP32[r2+6];r16=HEAP32[r2+7];_printf(5261324,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=HEAP32[r2+4],HEAP32[tempInt+4>>2]=r14,HEAP32[tempInt+8>>2]=r15,HEAP32[tempInt+12>>2]=r16,tempInt));_printf(5260936,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2+8],tempInt));_printf(5260572,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2+9],tempInt));r16=(r5+40|0)>>2;if((HEAP32[r16]|0)!=0){_putchar(9)}do{if((r5|0)==0){r3=365}else{r15=HEAP32[r16];if((r15&256|0)==0){r17=r15}else{_printf(5260072,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=HEAP32[r16]}if((r17&1|0)==0){r18=r17}else{_printf(5259812,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r18=HEAP32[r16]}if((r18&2|0)==0){r19=r18}else{_printf(5259608,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r19=HEAP32[r16]}if((r19&16|0)==0){r20=r19}else{_printf(5259336,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r20=HEAP32[r16]}if((r20&32|0)==0){r21=r20;break}_printf(5259176,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=365;break}}while(0);if(r3==365){r3=0;r21=HEAP32[r16]}if((r21|0)!=0){_putchar(10)}do{if((HEAP32[r13]|0)!=0){_putchar(9);r4=HEAP32[r13];if((r4&8192|0)==0){r22=r4}else{_printf(5258720,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r22=HEAP32[r13]}if((r22&2048|0)==0){r23=r22}else{_printf(5258360,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r23=HEAP32[r13]}if((r23|0)==0){break}_putchar(10)}}while(0);r13=HEAP32[r2+13];if((r13|0)!=0){_printf(5257992,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r13,tempInt))}_putchar(10)}r13=r5+72|0;if((HEAP32[r13>>2]|0)==0){break}else{r5=r13,r2=r5>>2}}r7=HEAP32[1311262];r8=_printf(5257688,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7,tempInt));r9=HEAP32[1311255];r10=_printf(5257516,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt));r11=HEAP32[1311261];r12=_printf(5257304,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11,tempInt));_exit(0)}function _finish_drive_clause(){var r1,r2,r3,r4,r5;r1=0;r2=STACKTOP;r3=HEAP32[1311907];if((r3|0)==-1){HEAP32[1310725]=0;STACKTOP=r2;return}r4=HEAP32[1311840]>>2;if((HEAP32[((r3*72&-1)>>2)+r4]|0)==0){_syntax(5253596,0)}r5=(HEAP32[((r3*72&-1)+16>>2)+r4]|0)==0;do{if(r5){if((HEAP32[((r3*72&-1)+20>>2)+r4]|0)!=0){_syntax(5253420,0)}if((HEAP32[((r3*72&-1)+24>>2)+r4]|0)==0){break}if(!r5){r1=390;break}_syntax(5253420,0)}else{r1=390}}while(0);do{if(r1==390){if((HEAP32[((r3*72&-1)+20>>2)+r4]|0)==0){_syntax(5253420,0)}if((HEAP32[((r3*72&-1)+24>>2)+r4]|0)==0){_syntax(5253420,0)}if((HEAP32[((r3*72&-1)+40>>2)+r4]&144|0)!=0){break}_syntax(5253116,0)}}while(0);HEAP32[((r3*72&-1)+56>>2)+r4]=HEAP32[1311705];HEAP32[HEAP32[1311840]+(HEAP32[1311907]*72&-1)+68>>2]=HEAP32[1311703];do{if((HEAP32[1311700]&2|0)==0){r4=HEAP32[1311907];r3=HEAP32[1311840];if((r3+(r4*72&-1)|0)==0){break}r1=r3+(r4*72&-1)+40|0;r4=HEAP32[r1>>2];if((r4&1|0)==0){break}HEAP32[r1>>2]=r4|2}}while(0);do{if((HEAP32[1310725]|0)==0){r4=HEAP32[1311907];r1=HEAP32[1311840];if((HEAP32[r1+(r4*72&-1)+40>>2]&2|0)==0){break}r3=HEAP32[_stderr>>2];r5=_toupper(HEAP8[r1+(r4*72&-1)+4|0]<<24>>24);r4=HEAP32[1311703];_fprintf(r3,5252892,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r5,HEAP32[tempInt+4>>2]=r4,tempInt));r4=HEAP32[1311840]+(HEAP32[1311907]*72&-1)+40|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-3}}while(0);HEAP32[1310725]=0;HEAP32[1311907]=-1;STACKTOP=r2;return}function _syntax(r1,r2){var r3;if((r2|0)!=0){HEAP32[1311307]=HEAP32[1311306]}r2=HEAP32[1311907];if((r2|0)>-1){r3=HEAP8[HEAP32[1311840]+(r2*72&-1)+4|0]}else{r3=0}_fprintf(HEAP32[_stderr>>2],5252808,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311307],tempInt));if(r3<<24>>24!=0){_fprintf(HEAP32[_stderr>>2],5252744,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3<<24>>24,tempInt))}r3=HEAP32[1310728];if((r3|0)!=0){_fprintf(HEAP32[_stderr>>2],5252604,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3-5248832|0,tempInt))}_fprintf(HEAP32[_stderr>>2],5252588,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311703],HEAP32[tempInt+4>>2]=r1,tempInt));_exit(1)}function _set_var(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+12|0;r6=r5;if((r2|0)<=0){r7=1;STACKTOP=r5;return r7}r8=HEAP32[1310727];r9=HEAP32[1310728];r10=0;while(1){r11=HEAP32[r1+(r10*12&-1)>>2];if((_strlen(r11)|0)==(r8|0)){if((_strncasecmp(r11,r9,r8)|0)==0){break}}r11=r10+1|0;if((r11|0)<(r2|0)){r10=r11}else{r7=1;r4=441;break}}if(r4==441){STACKTOP=r5;return r7}r4=r6|0;_skip_junk(1);r6=HEAP32[1311160];if(HEAP8[r6]<<24>>24!=61){_sprintf(r4,5263784,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=61,tempInt));_syntax(r4,1)}HEAP32[1311160]=r6+1|0;r6=r1+(r10*12&-1)+8|0;r4=HEAP32[r6>>2];do{if((r4|0)==2){_skip_junk(1);r2=HEAP32[1311160];r8=_strtoul(r2,5244640,0);r9=HEAP32[1311160];if((r2|0)==(r9|0)){_syntax(5250780,0)}else{HEAP32[1311160]=r9+1|0;HEAP32[1310726]=HEAP32[1310726]+1|0;HEAP32[r3+HEAP32[r1+(r10*12&-1)+4>>2]>>2]=r8;r12=HEAP32[r6>>2];break}}else{r12=r4}}while(0);if((r12|0)==0){_skip_junk(1);r4=HEAP32[1311160];r6=_strtol(r4,5244640,0);r8=HEAP32[1311160];if((r4|0)==(r8|0)){_syntax(5250780,0)}HEAP32[1311160]=r8+1|0;HEAP32[1310726]=HEAP32[1310726]+1|0;HEAP32[r3+HEAP32[r1+(r10*12&-1)+4>>2]>>2]=r6;r7=0;STACKTOP=r5;return r7}else if((r12|0)==1){_skip_junk(1);r12=HEAP32[1311160];if(HEAP8[r12]<<24>>24!=34){_syntax(5264184,0)}r6=r12+1|0;r12=_strchr(r6,34);if((r12|0)==0){_syntax(5264032,1)}HEAP8[r12]=0;HEAP32[1311160]=r12+1|0;r12=_strdup(r6);HEAP32[r3+HEAP32[r1+(r10*12&-1)+4>>2]>>2]=r12;r7=0;STACKTOP=r5;return r7}else{r7=0;STACKTOP=r5;return r7}}function _skip_junk(r1){var r2,r3,r4,r5;r2=0;HEAP32[1311307]=HEAP32[1311306];r3=HEAP32[1311160];L602:while(1){r4=(r3|0)==0;do{if(!r4){r5=HEAP8[r3];if(r5<<24>>24==0){break}if((_memchr(5250692,r5<<24>>24,5)|0)==0){r2=458;break L602}if(r4){break}r5=HEAP8[r3];if(r5<<24>>24==0|r5<<24>>24==35){break}r5=r3+1|0;HEAP32[1311160]=r5;r3=r5;continue L602}}while(0);r4=HEAP32[1311699];if((r4|0)==0){r2=455;break}if((_fgets(5248832,256,r4)|0)==0){r2=455;break}HEAP32[1311306]=HEAP32[1311306]+1|0;HEAP32[1311160]=5248832;HEAP32[1310726]=0;HEAP8[5249088]=0;if((_strlen(5248832)|0)==256){r2=454;break}else{r3=5248832}}if(r2==454){_syntax(5250552,1)}else if(r2==455){HEAP32[1311160]=0;if((r1|0)==0){return}else{_syntax(5250656,1)}}else if(r2==458){HEAP32[1310726]=HEAP32[1310726]+1|0;return}}function _allocDirCache(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=STACKTOP;if((r2|0)<0){_fprintf(HEAP32[_stderr>>2],5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));_exit(1)}L625:do{if((HEAP32[r1>>2]|0)==5265052){r4=r1}else{r5=r1;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L625}else{r5=r6}}}}while(0);r1=r4+352|0;r4=r1>>2;r5=HEAP32[r4];do{if((r5|0)==0){r6=_calloc(1,1548);HEAP32[r1>>2]=r6;if((r6|0)==0){r7=0;STACKTOP=r3;return r7}r6=r2<<1;r8=_calloc(r6+7|0,4);HEAP32[HEAP32[r4]>>2]=r8;r8=HEAP32[r4];if((HEAP32[r8>>2]|0)!=0){HEAP32[r8+4>>2]=r6+2|0;_memset(HEAP32[r4]+12|0,0,128);_memset(HEAP32[r4]+524|0,0,128);_memset(HEAP32[r4]+1036|0,0,128);HEAP32[HEAP32[r4]+8>>2]=0;break}_free(r8);r7=0;STACKTOP=r3;return r7}else{r8=(r5+4|0)>>2;if((HEAP32[r8]|0)>(r2|0)){break}r6=(r5|0)>>2;r9=(r2<<1)+2|0;r10=_realloc(HEAP32[r6],r9<<2);r11=r10;HEAP32[r6]=r11;if((r10|0)==0){r7=0;STACKTOP=r3;return r7}r10=HEAP32[r8];L643:do{if((r10|0)<(r9|0)){HEAP32[r11+(r10<<2)>>2]=0;r12=r10+1|0;if((r12|0)==(r9|0)){break}else{r13=r12}while(1){HEAP32[HEAP32[r6]+(r13<<2)>>2]=0;r12=r13+1|0;if((r12|0)==(r9|0)){break L643}else{r13=r12}}}}while(0);HEAP32[r8]=r9}}while(0);r7=HEAP32[r4];STACKTOP=r3;return r7}function _dir_grow(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r1;L651:do{if((r1|0)==0){r4=0}else{r5=r3;while(1){if((HEAP32[r5>>2]|0)==5264944){r4=r5;break L651}r6=HEAP32[r5+8>>2];if((r6|0)==0){r4=0;break L651}else{r5=r6}}}}while(0);if((_getfreeMinClusters(r1,1)|0)==0){r7=-1;return r7}r5=Math.imul(HEAP32[r4+28>>2],HEAP32[r4+24>>2]);r4=_malloc(r5);if((r4|0)==0){_perror(5262716);r7=-1;return r7}_memset(r4,0,r5);r6=HEAP32[HEAP32[r1>>2]+4>>2];L663:do{if((r5|0)==0){r8=0}else{r1=r2<<5;r9=r5;r10=r4;r11=0;while(1){r12=FUNCTION_TABLE[r6](r3,r10,r1,r9);if((r12|0)<1){break}r13=r12+r11|0;if((r9|0)==(r12|0)){r8=r13;break L663}else{r1=r12+r1|0;r9=r9-r12|0;r10=r10+r12|0;r11=r13}}r8=(r11|0)==0?r12:r11}}while(0);_free(r4);r7=((r8|0)<(r5|0))<<31>>31;return r7}function __fprintPwd(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;r7=HEAP32[r2>>2];if((HEAP32[r2+4>>2]|0)==-3){r8=r7;L674:do{if((HEAP32[r7>>2]|0)==5264944){r9=r8}else{r10=r8;while(1){r11=HEAP32[r10+8>>2];if((HEAP32[r11>>2]|0)==5264944){r9=r11;break L674}else{r10=r11}}}}while(0);_fputc(HEAP8[r9+96|0]<<24>>24,r1);_fputc(58,r1);if((r3|0)!=0){STACKTOP=r5;return}_fputc(47,r1);STACKTOP=r5;return}L683:do{if((HEAP32[r7>>2]|0)==5265052){r12=r7}else{r3=r7;while(1){r9=HEAP32[r3+8>>2];if((HEAP32[r9>>2]|0)==5265052){r12=r9;break L683}else{r3=r9}}}}while(0);__fprintPwd(r1,r12+44|0,1,r4);do{if((r4|0)!=0){r12=r2+40|0;if((_strpbrk(r12,5262424)|0)==0){break}_fputc(47,r1);r7=HEAP8[r12];if(r7<<24>>24==0){STACKTOP=r5;return}else{r13=r12;r14=r7}while(1){if((_memchr(5262424,r14<<24>>24,4)|0)==0){r15=r14}else{_fputc(92,r1);r15=HEAP8[r13]}_fputc(r15<<24>>24,r1);r7=r13+1|0;r12=HEAP8[r7];if(r12<<24>>24==0){break}else{r13=r7;r14=r12}}STACKTOP=r5;return}}while(0);r14=r6|0;r6=0;r13=r14;while(1){r15=HEAP8[r2+(r6+40)|0];if(r15<<24>>24==0){r16=r13;break}HEAP8[r13]=r15;r15=r13+1|0;r4=r6+1|0;if(r4>>>0<255){r6=r4;r13=r15}else{r16=r15;break}}HEAP8[r16]=0;_fprintf(r1,5263456,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));STACKTOP=r5;return}function _addUsedEntry(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r7=STACKTOP;if((r3|0)<(r2|0)){_fprintf(HEAP32[_stderr>>2],5263548,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2,HEAP32[tempInt+4>>2]=r3,tempInt));_exit(1)}if((r3|0)<0){_fprintf(HEAP32[_stderr>>2],5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));_exit(1)}r8=(r1+4|0)>>2;if((HEAP32[r8]|0)<=(r3|0)){r9=(r1|0)>>2;r10=(r3<<1)+2|0;r11=_realloc(HEAP32[r9],r10<<2);r12=r11;HEAP32[r9]=r12;if((r11|0)==0){r13=0;STACKTOP=r7;return r13}r11=HEAP32[r8];L716:do{if((r11|0)<(r10|0)){HEAP32[r12+(r11<<2)>>2]=0;r14=r11+1|0;if((r14|0)==(r10|0)){break}else{r15=r14}while(1){HEAP32[HEAP32[r9]+(r15<<2)>>2]=0;r14=r15+1|0;if((r14|0)==(r10|0)){break L716}else{r15=r14}}}}while(0);HEAP32[r8]=r10}r10=_calloc(1,56);r8=r10;if((r10|0)==0){r13=0;STACKTOP=r7;return r13}HEAP32[r10>>2]=1;r15=(r10+16|0)>>2;HEAP32[r15]=0;r9=(r10+12|0)>>2;HEAP32[r9]=0;r11=(r10+4|0)>>2;HEAP32[r11]=r2;r12=(r10+8|0)>>2;HEAP32[r12]=r3;HEAP32[r10+52>>2]=-1;_freeDirCacheRange(r1,r2,r3);L725:do{if((r2|0)<(r3|0)){r14=r1|0;r16=r2;while(1){HEAP32[HEAP32[r14>>2]+(r16<<2)>>2]=r8;r17=r16+1|0;if((r17|0)==(r3|0)){break L725}else{r16=r17}}}}while(0);HEAP32[r11]=r2;HEAP32[r12]=r3;if((r4|0)!=0){HEAP32[r15]=_strdup(r4)}HEAP32[r9]=_strdup(r5);_memcpy(r10+20|0,r6|0,32);r6=r1+8|0;if((HEAP32[r11]|0)!=(HEAP32[r6>>2]|0)){r13=r8;STACKTOP=r7;return r13}HEAP32[r6>>2]=HEAP32[r12];r12=HEAP32[r15];if((r12|0)!=0){r15=HEAP8[r12];L738:do{if(r15<<24>>24==0){r18=0}else{r6=0;r11=0;r10=r12;r5=r15;while(1){r4=_toupper(r5<<24>>24)<<24>>24;r3=Math.imul(r4+2|0,r4)^((r6>>>27|r6<<5)^Math.imul(r11+2|0,r11));r4=r10+1|0;r2=HEAP8[r4];if(r2<<24>>24==0){r18=r3;break L738}else{r6=r3;r11=r11+1|0;r10=r4;r5=r2}}}}while(0);r15=Math.imul(r18+2|0,r18);r18=r15<<12&16773120^r15;r15=((r18>>>5&127)<<2)+r1+12|0;HEAP32[r15>>2]=1<<(r18&31)|HEAP32[r15>>2];r15=(r18>>>25<<2)+r1+524|0;HEAP32[r15>>2]=1<<(r18>>>20&31)|HEAP32[r15>>2];r15=((r18>>>13&127)<<2)+r1+1036|0;HEAP32[r15>>2]=1<<(r18>>>8&31)|HEAP32[r15>>2]}r15=HEAP32[r9];r9=HEAP8[r15];L743:do{if(r9<<24>>24==0){r19=0}else{r18=0;r12=0;r5=r15;r10=r9;while(1){r11=_toupper(r10<<24>>24)<<24>>24;r6=Math.imul(r11+2|0,r11)^((r18>>>27|r18<<5)^Math.imul(r12+2|0,r12));r11=r5+1|0;r2=HEAP8[r11];if(r2<<24>>24==0){r19=r6;break L743}else{r18=r6;r12=r12+1|0;r5=r11;r10=r2}}}}while(0);r9=Math.imul(r19+2|0,r19);r19=r9<<12&16773120^r9;r9=((r19>>>5&127)<<2)+r1+12|0;HEAP32[r9>>2]=1<<(r19&31)|HEAP32[r9>>2];r9=(r19>>>25<<2)+r1+524|0;HEAP32[r9>>2]=1<<(r19>>>20&31)|HEAP32[r9>>2];r9=((r19>>>13&127)<<2)+r1+1036|0;HEAP32[r9>>2]=1<<(r19>>>8&31)|HEAP32[r9>>2];r13=r8;STACKTOP=r7;return r13}function _addFreeEndEntry(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r5=0;r6=STACKTOP;r7=r1+8|0;if(HEAP32[r7>>2]>>>0>r2>>>0){HEAP32[r7>>2]=r2}if(r3>>>0<r2>>>0){_fprintf(HEAP32[_stderr>>2],5259560,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2,HEAP32[tempInt+4>>2]=r3,tempInt));_exit(1)}if((r3|0)==(r2|0)){r8=0;STACKTOP=r6;return r8}if((r3|0)<0){_fprintf(HEAP32[_stderr>>2],5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));_exit(1)}r7=(r1+4|0)>>2;do{if((HEAP32[r7]|0)>(r3|0)){r5=564}else{r9=(r1|0)>>2;r10=(r3<<1)+2|0;r11=_realloc(HEAP32[r9],r10<<2);r12=r11;HEAP32[r9]=r12;if((r11|0)==0){r13=0;break}r11=HEAP32[r7];L764:do{if((r11|0)<(r10|0)){HEAP32[r12+(r11<<2)>>2]=0;r14=r11+1|0;if((r14|0)==(r10|0)){break}else{r15=r14}while(1){HEAP32[HEAP32[r9]+(r15<<2)>>2]=0;r14=r15+1|0;if((r14|0)==(r10|0)){break L764}else{r15=r14}}}}while(0);HEAP32[r7]=r10;r5=564;break}}while(0);L769:do{if(r5==564){r7=_calloc(1,56),r15=r7>>2;r9=r7;if((r7|0)==0){r13=0;break}HEAP32[r15]=0;HEAP32[r15+4]=0;HEAP32[r15+3]=0;HEAP32[r15+1]=r2;HEAP32[r15+2]=r3;HEAP32[r15+13]=-1;_freeDirCacheRange(r1,r2,r3);if((r2|0)>=(r3|0)){r13=r9;break}r15=r1|0;r7=r2;while(1){HEAP32[HEAP32[r15>>2]+(r7<<2)>>2]=r9;r11=r7+1|0;if((r11|0)==(r3|0)){r13=r9;break L769}else{r7=r11}}}}while(0);if((r4|0)!=0){HEAP32[r13+52>>2]=r2}do{if((r2|0)!=0){r13=r1|0;r4=HEAP32[r13>>2]>>2;r5=HEAP32[(r2-1<<2>>2)+r4],r7=r5>>2;r9=HEAP32[(r2<<2>>2)+r4],r15=r9>>2;if((r9|0)==0){break}if((HEAP32[r15]|0)!=0|(r5|0)==0){break}if((HEAP32[r7]|0)!=0){break}r10=HEAP32[r15+1];r11=(r9+8|0)>>2;r12=HEAP32[r11];L784:do{if(r10>>>0<r12>>>0){HEAP32[(r10<<2>>2)+r4]=r5;r14=r10+1|0;r16=HEAP32[r11];if(r14>>>0<r16>>>0){r17=r14}else{r18=r16;break}while(1){HEAP32[HEAP32[r13>>2]+(r17<<2)>>2]=r5;r16=r17+1|0;r14=HEAP32[r11];if(r16>>>0<r14>>>0){r17=r16}else{r18=r14;break L784}}}else{r18=r12}}while(0);HEAP32[r7+2]=r18;HEAP32[r7+13]=HEAP32[r15+13];_free(r9)}}while(0);do{if((r3|0)==0){r19=r1|0}else{r18=r1|0;r17=HEAP32[r18>>2]>>2;r12=HEAP32[(r3-1<<2>>2)+r17],r11=r12>>2;r5=HEAP32[(r3<<2>>2)+r17],r13=r5>>2;if((r5|0)==0){r19=r18;break}if((HEAP32[r13]|0)!=0|(r12|0)==0){r19=r18;break}if((HEAP32[r11]|0)!=0){r19=r18;break}r10=HEAP32[r13+1];r4=(r5+8|0)>>2;r14=HEAP32[r4];L795:do{if(r10>>>0<r14>>>0){HEAP32[(r10<<2>>2)+r17]=r12;r16=r10+1|0;r20=HEAP32[r4];if(r16>>>0<r20>>>0){r21=r16}else{r22=r20;break}while(1){HEAP32[HEAP32[r18>>2]+(r21<<2)>>2]=r12;r20=r21+1|0;r16=HEAP32[r4];if(r20>>>0<r16>>>0){r21=r20}else{r22=r16;break L795}}}else{r22=r14}}while(0);HEAP32[r11+2]=r22;HEAP32[r11+13]=HEAP32[r13+13];_free(r5);r19=r18}}while(0);r8=HEAP32[HEAP32[r19>>2]+(r2<<2)>>2];STACKTOP=r6;return r8}function _addEndEntry(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=STACKTOP;r4=r2+1|0;if((r4|0)<0){_fprintf(HEAP32[_stderr>>2],5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));_exit(1)}r5=(r1+4|0)>>2;if((HEAP32[r5]|0)<=(r4|0)){r6=(r1|0)>>2;r7=(r4<<1)+2|0;r8=_realloc(HEAP32[r6],r7<<2);r9=r8;HEAP32[r6]=r9;if((r8|0)==0){r10=0;STACKTOP=r3;return r10}r8=HEAP32[r5];L812:do{if((r8|0)<(r7|0)){HEAP32[r9+(r8<<2)>>2]=0;r11=r8+1|0;if((r11|0)==(r7|0)){break}else{r12=r11}while(1){HEAP32[HEAP32[r6]+(r12<<2)>>2]=0;r11=r12+1|0;if((r11|0)==(r7|0)){break L812}else{r12=r11}}}}while(0);HEAP32[r5]=r7}r7=_calloc(1,56),r5=r7>>2;r12=r7;if((r7|0)==0){r10=0;STACKTOP=r3;return r10}HEAP32[r5]=2;HEAP32[r5+4]=0;HEAP32[r5+3]=0;HEAP32[r5+1]=r2;HEAP32[r5+2]=r4;HEAP32[r5+13]=-1;_freeDirCacheRange(r1,r2,r4);HEAP32[HEAP32[r1>>2]+(r2<<2)>>2]=r12;r10=r12;STACKTOP=r3;return r10}function _freeDirCacheRange(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=0;r5=STACKTOP;if(r3>>>0<r2>>>0){_fprintf(HEAP32[_stderr>>2],5257084,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2,HEAP32[tempInt+4>>2]=r3,tempInt));_exit(1)}if(r2>>>0>=r3>>>0){r6=-1;STACKTOP=r5;return r6}r7=r1|0;r1=r3^-1;r8=r2;L829:while(1){r2=HEAP32[r7>>2];r9=HEAP32[r2+(r8<<2)>>2],r10=r9>>2;do{if((r9|0)==0){r11=r8+1|0}else{r12=r9+4|0;if((HEAP32[r12>>2]|0)!=(r8|0)){r4=613;break L829}r13=r9+8|0;r14=HEAP32[r13>>2];r15=r14>>>0>r3>>>0?r3:r14;if(r8>>>0<r15>>>0){r16=r14^-1;r17=(r16>>>0>r1>>>0?r16:r1)^-1;r16=r8;r18=r2;while(1){HEAP32[r18+(r16<<2)>>2]=0;r19=r16+1|0;if((r19|0)==(r17|0)){break}r16=r19;r18=HEAP32[r7>>2]}r20=HEAP32[r13>>2]}else{r20=r14}HEAP32[r12>>2]=r15;if((r15|0)!=(r20|0)){r11=r15;break}r18=HEAP32[r10+13];r16=HEAP32[r10+4];if((r16|0)!=0){_free(r16)}r16=HEAP32[r10+3];if((r16|0)!=0){_free(r16)}_free(r9);if((r18|0)!=-1&r18>>>0<r8>>>0){r6=r8;r4=628;break L829}else{r11=r15}}}while(0);if(r11>>>0<r3>>>0){r8=r11}else{r6=-1;r4=626;break}}if(r4==613){___assert_func(5254516,194,5264832,5252540)}else if(r4==626){STACKTOP=r5;return r6}else if(r4==628){STACKTOP=r5;return r6}}function __fprintShortPwd(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=HEAP32[r2>>2];if((HEAP32[r2+4>>2]|0)==-3){r6=r5;L857:do{if((HEAP32[r5>>2]|0)==5264944){r7=r6}else{r8=r6;while(1){r9=HEAP32[r8+8>>2];if((HEAP32[r9>>2]|0)==5264944){r7=r9;break L857}else{r8=r9}}}}while(0);_fputc(HEAP8[r7+96|0]<<24>>24,r1);_fputc(58,r1);if((r3|0)!=0){return}_fputc(47,r1);return}L866:do{if((HEAP32[r5>>2]|0)==5265052){r10=r5}else{r3=r5;while(1){r7=HEAP32[r3+8>>2];if((HEAP32[r7>>2]|0)==5265052){r10=r7;break L866}else{r3=r7}}}}while(0);__fprintShortPwd(r1,r10+44|0,1);_fputc(47,r1);r10=7;while(1){if((r10|0)<=-1){r11=2;break}if(HEAP8[r2+(r10+8)|0]<<24>>24==32){r10=r10-1|0}else{r12=0;r4=639;break}}L873:do{if(r4==639){while(1){r4=0;_fputc(HEAP8[r2+(r12+8)|0]<<24>>24,r1);r5=r12+1|0;if((r5|0)>(r10|0)){r11=2;break L873}else{r12=r5;r4=639}}}}while(0);while(1){if((r11|0)<=-1){r4=647;break}if(HEAP8[r2+(r11+16)|0]<<24>>24==32){r11=r11-1|0}else{break}}if(r4==647){return}if((r11|0)>0){_fputc(46,r1)}if((r11|0)<0){return}else{r13=0}while(1){_fputc(HEAP8[r2+(r13+16)|0]<<24>>24,r1);r4=r13+1|0;if((r4|0)>(r11|0)){break}else{r13=r4}}return}function _sprintPwd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=HEAP32[r1>>2];if((HEAP32[r1+4>>2]|0)==-3){r4=r3;L893:do{if((HEAP32[r3>>2]|0)==5264944){r5=r4}else{r6=r4;while(1){r7=HEAP32[r6+8>>2];if((HEAP32[r7>>2]|0)==5264944){r5=r7;break L893}else{r6=r7}}}}while(0);HEAP8[r2]=HEAP8[r5+96|0];HEAP8[r2+1|0]=58;HEAP8[r2+2|0]=47;r8=r2+3|0;return r8}L899:do{if((HEAP32[r3>>2]|0)==5265052){r9=r3}else{r5=r3;while(1){r4=HEAP32[r5+8>>2];if((HEAP32[r4>>2]|0)==5265052){r9=r4;break L899}else{r5=r4}}}}while(0);r3=_sprintPwd(r9+44|0,r2);if(HEAP8[r3-1|0]<<24>>24==47){r10=r3}else{HEAP8[r3]=47;r10=r3+1|0}r3=0;r2=r10;while(1){r9=HEAP8[r1+(r3+40)|0];if(r9<<24>>24==0){r11=r2;break}HEAP8[r2]=r9;r9=r2+1|0;r5=r3+1|0;if(r5>>>0<255){r3=r5;r2=r9}else{r11=r9;break}}HEAP8[r11]=0;r8=r10+(r11-r10)|0;return r8}function _zero_fat(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r3=0;r4=(r1+28|0)>>2;r5=_malloc(HEAP32[r4]);if((r5|0)==0){_perror(5257056);r6=-1;return r6}r7=r1+60|0;L916:do{if((HEAP32[r7>>2]|0)==0){r8=r1+56|0}else{r9=r1+52|0;r10=r1+56|0;r11=r2&255;r12=r5+1|0;r13=r5+2|0;r14=r1+72|0;r15=r5+3|0;r16=r5+4|0;r17=r5+5|0;r18=r5+6|0;r19=r5+7|0;r20=r1+8|0;r21=r1+144|0;r22=0;r23=HEAP32[r10>>2];L919:while(1){r24=HEAP32[r9>>2]+Math.imul(r23,r22)|0;r25=0;r26=r23;while(1){if(r25>>>0>=r26>>>0){break}do{if(r25>>>0<2){_memset(r5,0,HEAP32[r4]);if((r25|0)!=0){break}HEAP8[r5]=r11;HEAP8[r12]=-1;HEAP8[r13]=-1;if((HEAP32[r14>>2]|0)<=12){break}HEAP8[r15]=-1;if((HEAP32[r14>>2]|0)<=16){break}HEAP8[r16]=-1;HEAP8[r17]=-1;HEAP8[r18]=-1;HEAP8[r19]=15}}while(0);r27=HEAP32[r20>>2];r28=HEAP32[r21>>2];r29=r27;r30=HEAP32[HEAP32[r27>>2]+4>>2];r27=r24+r25<<r28;r31=1<<r28;r28=r5;r32=0;while(1){r33=FUNCTION_TABLE[r30](r29,r28,r27,r31);if((r33|0)<1){r3=681;break}r34=r33+r32|0;if((r31|0)==(r33|0)){r35=r34;break}else{r27=r33+r27|0;r31=r31-r33|0;r28=r28+r33|0;r32=r34}}if(r3==681){r3=0;r35=(r32|0)==0?r33:r32}if((r35|0)!=(HEAP32[r4]|0)){break L919}r25=r25+1|0;r26=HEAP32[r10>>2]}r25=r22+1|0;if(r25>>>0<HEAP32[r7>>2]>>>0){r22=r25;r23=r26}else{r8=r10;break L916}}_fwrite(5254412,34,1,HEAP32[_stderr>>2]);_free(r5);r6=-1;return r6}}while(0);_free(r5);HEAP32[r1+32>>2]=0;r5=(HEAP32[r8>>2]+63|0)>>>6;r8=_calloc(r5,20);r7=r8;if((r8|0)==0){HEAP32[r1+76>>2]=0;_perror(5252508);r6=-1;return r6}if((r5|0)==0){HEAP32[r1+76>>2]=r7;r6=0;return r6}else{r36=0}while(1){r8=r36+1|0;r4=(r7+(r36*20&-1)|0)>>2;HEAP32[r4]=0;HEAP32[r4+1]=0;HEAP32[r4+2]=0;HEAP32[r4+3]=0;HEAP32[r4+4]=0;if((r8|0)<(r5|0)){r36=r8}else{break}}HEAP32[r1+76>>2]=r7;r6=0;return r6}function _safePopenOut(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=STACKTOP;STACKTOP=STACKTOP+12|0;r5=r4;r6=r4+8;r7=r5|0;if((_pipe(r7)|0)!=0){r8=-2;STACKTOP=r4;return r8}r9=_fork();if((r9|0)==-1){r8=-2;STACKTOP=r4;return r8}else if((r9|0)==0){_close(HEAP32[r7>>2]);_destroy_privs();_close(1);_close(2);r10=r5+4|0;if((_dup(HEAP32[r10>>2])|0)<0){_perror(5262308);_exit(1)}else{_close(HEAP32[r10>>2]);_execl(HEAP32[r1>>2],r1+4|0);_exit(1)}}else{_close(HEAP32[r5+4>>2]);r5=_read(HEAP32[r7>>2],r2,r3);_kill(r9,9);_wait(r6);r8=(r5|0)>-1?r5:-1;STACKTOP=r4;return r8}}function _expand(r1,r2){var r3,r4,r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+276|0;r4=r3+256;r5=r4>>2;HEAP32[r5]=HEAP32[1311707];HEAP32[r5+1]=HEAP32[1311708];HEAP32[r5+2]=HEAP32[1311709];HEAP32[r5+3]=HEAP32[1311710];HEAP32[r5+4]=HEAP32[1311711];HEAP8[r2+2047|0]=0;if((r1|0)==0){r6=0;STACKTOP=r3;return r6}if(HEAP8[r1]<<24>>24==0){r6=5260912;STACKTOP=r3;return r6}if((_strpbrk(r1,5252524)|0)==0){_strncpy(r2,r1,2047);r6=r2;STACKTOP=r3;return r6}r5=r3|0;_snprintf(r5,255,5251796,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));HEAP32[r4+12>>2]=r5;r5=_safePopenOut(r4|0,r2,2047);if((r5|0)<0){_perror(5251076);_exit(1)}if((r5|0)==0){_strncpy(r2,r1,2047);r6=r2;STACKTOP=r3;return r6}else{HEAP8[r2+(r5-1)|0]=0;r6=r2;STACKTOP=r3;return r6}}function _fat_write(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48;r2=r1>>2;r3=0;r4=r1+48|0;if((HEAP32[r4>>2]|0)==0){return}r5=(r1+60|0)>>2;r6=(HEAP32[r2+8]|0)==0?HEAP32[r5]:1;L987:do{if((r6|0)!=0){r7=(r1+56|0)>>2;r8=(r1+76|0)>>2;r9=r1+100|0;r10=r1+52|0;r11=(r1+28|0)>>2;r12=r1+8|0;r13=r1+144|0;r14=r6-1|0;r15=r1+104|0;r16=HEAP32[r7];r17=0;r18=r16;r19=r16;L989:while(1){L991:do{if((r18|0)==0){r20=0;r21=r19}else{r16=(r17|0)==(r14|0);r22=0;r23=0;r24=r19;while(1){r25=HEAP32[r8]+(r22*20&-1)+4|0;if((HEAP32[r25>>2]|0)==0&(HEAP32[r25+4>>2]|0)==0){r26=r23+64|0;r27=r24}else{L997:do{if(r16){r25=0;r28=r23;r29=r24;while(1){if(r28>>>0>=r29>>>0){r30=r28;break L997}r31=HEAP32[r8];r32=r31+(r22*20&-1)+4|0;r33=HEAP32[r32>>2];r34=HEAP32[r32+4>>2];r32=_bitshift64Shl(1,0,r25);r35=tempRet0;if(!((r33&r32|0)==0&(r34&r35|0)==0)){r34=((HEAP32[r9>>2]+r14|0)>>>0)%(HEAP32[r5]>>>0);do{if((r34|0)==0){r3=736}else{if((HEAP32[r15>>2]|0)!=0){r3=736;break}r36=HEAP32[r11];break}}while(0);L1023:do{if(r3==736){r3=0;r33=HEAP32[r10>>2];r37=Math.imul(r29,r34);r38=HEAP32[r31+(r22*20&-1)>>2]+Math.imul(HEAP32[r11],r25)|0;r39=HEAP32[r12>>2];r40=HEAP32[r13>>2];r41=r39;r42=HEAP32[HEAP32[r39>>2]+4>>2];r39=r33+r28+r37<<r40;r37=1<<r40;r40=r38;r38=0;while(1){r43=FUNCTION_TABLE[r42](r41,r40,r39,r37);if((r43|0)<1){break}r33=r43+r38|0;if((r37|0)==(r43|0)){r36=r33;break L1023}else{r39=r43+r39|0;r37=r37-r43|0;r40=r40+r43|0;r38=r33}}r36=(r38|0)==0?r43:r38}}while(0);if((r36|0)<(HEAP32[r11]|0)){r44=r36;break L989}r31=(HEAP32[r8]+(r22*20&-1)+4|0)>>2;r34=HEAP32[r31+1]&(r35^-1);HEAP32[r31]=HEAP32[r31]&(r32^-1);HEAP32[r31+1]=r34}r34=r25+1|0;r31=r28+1|0;if(r34>>>0>=64){r30=r31;break L997}r25=r34;r28=r31;r29=HEAP32[r7]}}else{r29=0;r28=r23;r25=r24;while(1){if(r28>>>0>=r25>>>0){r30=r28;break L997}r31=HEAP32[r8];r34=r31+(r22*20&-1)+4|0;r40=HEAP32[r34>>2];r37=HEAP32[r34+4>>2];if(!((r40&_bitshift64Shl(1,0,r29)|0)==0&(r37&tempRet0|0)==0)){r37=((HEAP32[r9>>2]+r17|0)>>>0)%(HEAP32[r5]>>>0);do{if((r37|0)==0){r3=750}else{if((HEAP32[r15>>2]|0)!=0){r3=750;break}r45=HEAP32[r11];break}}while(0);L1006:do{if(r3==750){r3=0;r32=HEAP32[r10>>2];r35=Math.imul(r25,r37);r40=HEAP32[r31+(r22*20&-1)>>2]+Math.imul(HEAP32[r11],r29)|0;r34=HEAP32[r12>>2];r39=HEAP32[r13>>2];r41=r34;r42=HEAP32[HEAP32[r34>>2]+4>>2];r34=r32+r28+r35<<r39;r35=1<<r39;r39=r40;r40=0;while(1){r46=FUNCTION_TABLE[r42](r41,r39,r34,r35);if((r46|0)<1){break}r32=r46+r40|0;if((r35|0)==(r46|0)){r45=r32;break L1006}else{r34=r46+r34|0;r35=r35-r46|0;r39=r39+r46|0;r40=r32}}r45=(r40|0)==0?r46:r40}}while(0);if((r45|0)<(HEAP32[r11]|0)){r44=r45;break L989}}r31=r29+1|0;r37=r28+1|0;if(r31>>>0>=64){r30=r37;break L997}r29=r31;r28=r37;r25=HEAP32[r7]}}}while(0);r26=r30;r27=HEAP32[r7]}if(r26>>>0>=r27>>>0){r20=r27;r21=r27;break L991}r22=r22+1|0;r23=r26;r24=r27}}}while(0);r24=r17+1|0;if(r24>>>0<r6>>>0){r17=r24;r18=r20;r19=r21}else{break L987}}if((r44|0)<0){_perror(5262072);_exit(1)}else{_fwrite(5263336,25,1,HEAP32[_stderr>>2]);_exit(1)}}}while(0);r44=r1+112|0;r21=HEAP32[r44>>2];if(!((r21|0)==0|(r21|0)==-1)){r21=r1+28|0;r1=_malloc(HEAP32[r21>>2]);if((r1|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}HEAP8[r1+3|0]=65;HEAP8[r1+2|0]=97;HEAP8[r1+1|0]=82;HEAP8[r1]=82;_memset(r1+4|0,0,480);_memset(r1+496|0,0,14);HEAP8[r1+487|0]=97;HEAP8[r1+486|0]=65;HEAP8[r1+485|0]=114;HEAP8[r1+484|0]=114;r20=HEAP32[r2+29];HEAP8[r1+495|0]=r20>>>24&255;HEAP8[r1+494|0]=r20>>>16&255;HEAP8[r1+493|0]=r20>>>8&255;HEAP8[r1+492|0]=r20&255;r20=HEAP32[r2+30];HEAP8[r1+491|0]=r20>>>24&255;HEAP8[r1+490|0]=r20>>>16&255;HEAP8[r1+489|0]=r20>>>8&255;HEAP8[r1+488|0]=r20&255;HEAP8[r1+511|0]=-86;HEAP8[r1+510|0]=85;r20=HEAP32[r2+2];r6=HEAP32[r2+36];r27=r20;r26=HEAP32[HEAP32[r20>>2]+4>>2];r20=HEAP32[r44>>2]<<r6;r44=1<<r6;r6=r1;r30=0;while(1){r47=FUNCTION_TABLE[r26](r27,r6,r20,r44);if((r47|0)<1){r3=769;break}r45=r47+r30|0;if((r44|0)==(r47|0)){r48=r45;break}else{r20=r47+r20|0;r44=r44-r47|0;r6=r6+r47|0;r30=r45}}if(r3==769){r48=(r30|0)==0?r47:r30}if((r48|0)!=(HEAP32[r21>>2]|0)){_fwrite(5259508,32,1,HEAP32[_stderr>>2])}_free(r1)}HEAP32[r4>>2]=0;HEAP32[r2+34]=0;return}function _fat12_decode(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=r1>>2;r4=0;r5=STACKTOP;r6=(r2*3&-1)>>>1;r7=r1+144|0;r8=r6>>>(HEAP32[r7>>2]>>>0);r9=(r1+128|0)>>2;do{if((r8|0)==(HEAP32[r9]|0)){r10=HEAP32[r3+33];if((r10|0)==0){r4=780;break}else{r11=r10;r4=783;break}}else{r4=780}}while(0);do{if(r4==780){r10=_loadSector(r1,r8,0,0);if((r10|0)==0){r12=-1;r13=HEAP32[r9];break}else{HEAP32[r9]=r8;HEAP32[r3+33]=r10;HEAP32[r3+34]=0;r11=r10;r4=783;break}}}while(0);do{if(r4==783){r10=r11+(HEAP32[r3+35]&r6)|0;if((r10|0)==0){r12=-1;r13=r8;break}r12=HEAPU8[r10];r13=r8}}while(0);r8=r6+1|0;r6=r8>>>(HEAP32[r7>>2]>>>0);do{if((r6|0)==(r13|0)){r7=HEAP32[r3+33];if((r7|0)==0){r4=787;break}else{r14=r7;r4=789;break}}else{r4=787}}while(0);do{if(r4==787){r13=_loadSector(r1,r6,0,0);if((r13|0)==0){break}HEAP32[r9]=r6;HEAP32[r3+33]=r13;HEAP32[r3+34]=0;r14=r13;r4=789;break}}while(0);do{if(r4==789){r6=r14+(HEAP32[r3+35]&r8)|0;if((r6|0)==0){break}r9=HEAPU8[r6];if(r2>>>0<2|(r12|0)<0){break}if((HEAP32[r3+23]+1|0)>>>0<r2>>>0){break}if((r2&1|0)==0){r15=r9<<8&3840|r12;STACKTOP=r5;return r15}else{r15=r9<<4|r12>>>4&15;STACKTOP=r5;return r15}}}while(0);_fprintf(HEAP32[_stderr>>2],5260296,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r15=1;STACKTOP=r5;return r15}function _fat12_encode(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=r1>>2;r5=0;r6=(r2*3&-1)>>>1;r7=r1+144|0;r8=r6>>>(HEAP32[r7>>2]>>>0);r9=(r1+128|0)>>2;do{if((r8|0)==(HEAP32[r9]|0)){if((HEAP32[r4+34]|0)==0){r5=803;break}r10=HEAP32[r4+33];if((r10|0)==0){r5=803;break}else{r11=r10;r5=806;break}}else{r5=803}}while(0);do{if(r5==803){r10=_loadSector(r1,r8,1,0);if((r10|0)==0){r12=0;r13=HEAP32[r9];break}else{HEAP32[r9]=r8;HEAP32[r4+33]=r10;HEAP32[r4+34]=1;r11=r10;r5=806;break}}}while(0);if(r5==806){r12=r11+(HEAP32[r4+35]&r6)|0;r13=r8}r8=r6+1|0;r6=r8>>>(HEAP32[r7>>2]>>>0);do{if((r6|0)==(r13|0)){if((HEAP32[r4+34]|0)==0){r5=810;break}r7=HEAP32[r4+33];if((r7|0)==0){r5=810;break}else{r14=r7;r5=812;break}}else{r5=810}}while(0);do{if(r5==810){r13=_loadSector(r1,r6,1,0);if((r13|0)==0){r15=0;break}HEAP32[r9]=r6;HEAP32[r4+33]=r13;HEAP32[r4+34]=1;r14=r13;r5=812;break}}while(0);if(r5==812){r15=r14+(HEAP32[r4+35]&r8)|0}if((r2&1|0)==0){HEAP8[r12]=r3&255;r2=HEAP8[r15]&240|r3>>>8&15;r8=r2&255;HEAP8[r15]=r8;return}else{HEAP8[r12]=(HEAP8[r12]&15|r3<<4)&255;r2=r3>>>4&255;r8=r2&255;HEAP8[r15]=r8;return}}function _fast_fat16_decode(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1>>2;r4=0;r5=r2<<1;r2=r5>>>(HEAP32[r3+36]>>>0);r6=r1+128|0;do{if((r2|0)==(HEAP32[r6>>2]|0)){r7=HEAP32[r3+33];if((r7|0)==0){r4=821;break}else{r8=r7;break}}else{r4=821}}while(0);do{if(r4==821){r7=_loadSector(r1,r2,0,0);if((r7|0)==0){r9=1;return r9}else{HEAP32[r6>>2]=r2;HEAP32[r3+33]=r7;HEAP32[r3+34]=0;r8=r7;break}}}while(0);r2=r8+(HEAP32[r3+35]&r5)|0;if((r2|0)==0){r9=1;return r9}r9=HEAPU16[r2>>1];return r9}function _fast_fat16_encode(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=r2<<1;r2=r5>>>(HEAP32[r1+144>>2]>>>0);r6=r1+128|0;r7=r1+136|0;do{if((r2|0)==(HEAP32[r6>>2]|0)){if((HEAP32[r7>>2]|0)==0){r4=832;break}r8=HEAP32[r1+132>>2];if((r8|0)==0){r4=832;break}else{r9=r8;break}}else{r4=832}}while(0);if(r4==832){r4=_loadSector(r1,r2,1,0);HEAP32[r6>>2]=r2;HEAP32[r1+132>>2]=r4;HEAP32[r7>>2]=1;r9=r4}HEAP16[r9+(HEAP32[r1+140>>2]&r5)>>1]=r3&65535;return}function _fast_fat32_decode(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=r1>>2;r4=0;r5=r2<<2;r2=r5>>>(HEAP32[r3+36]>>>0);r6=r1+128|0;do{if((r2|0)==(HEAP32[r6>>2]|0)){r7=HEAP32[r3+33];if((r7|0)==0){r4=836;break}else{r8=r7;break}}else{r4=836}}while(0);do{if(r4==836){r7=_loadSector(r1,r2,0,0);if((r7|0)==0){r9=1;return r9}else{HEAP32[r6>>2]=r2;HEAP32[r3+33]=r7;HEAP32[r3+34]=0;r8=r7;break}}}while(0);r2=r8+(HEAP32[r3+35]&r5)|0;if((r2|0)==0){r9=1;return r9}r9=HEAP32[r2>>2]&268435455;return r9}function _fast_fat32_encode(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;r5=r2<<2;r2=r5>>>(HEAP32[r1+144>>2]>>>0);r6=r1+128|0;r7=r1+136|0;do{if((r2|0)==(HEAP32[r6>>2]|0)){if((HEAP32[r7>>2]|0)==0){r4=847;break}r8=HEAP32[r1+132>>2];if((r8|0)==0){r4=847;break}else{r9=r8;break}}else{r4=847}}while(0);if(r4==847){r4=_loadSector(r1,r2,1,0);HEAP32[r6>>2]=r2;HEAP32[r1+132>>2]=r4;HEAP32[r7>>2]=1;r9=r4}r4=r9+(HEAP32[r1+140>>2]&r5)|0;HEAP32[r4>>2]=HEAP32[r4>>2]&-268435456|r3&268435455;return}function _get_next_free_cluster(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=STACKTOP;r5=(r1+116|0)>>2;r6=HEAP32[r5];r7=(r6|0)==-1?r2:r6;r6=HEAP32[r1+92>>2];do{if(r7>>>0<2){r3=851}else{if(r7>>>0<(r6+1|0)>>>0){r8=r7;break}else{r3=851;break}}}while(0);if(r3==851){r8=1}r7=r8+1|0;r8=(r1+92|0)>>2;L1160:do{if(r7>>>0<(r6+2|0)>>>0){r2=r1+36|0;r9=r1+68|0;r10=r1+32|0;r11=r7;while(1){r12=FUNCTION_TABLE[HEAP32[r2>>2]](r1,r11);if((r12|0)==0){break}do{if(r12>>>0<2){r3=859}else{if(r12>>>0>(HEAP32[r8]+1|0)>>>0){r3=859;break}else{break}}}while(0);do{if(r3==859){r3=0;if(r12>>>0>=HEAP32[r9>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r12,HEAP32[tempInt+4>>2]=r11,tempInt));HEAP32[r10>>2]=HEAP32[r10>>2]+1|0}}while(0);if((r12|0)==1){break L1160}else if((r12|0)==0){break}r13=r11+1|0;if(r13>>>0<(HEAP32[r8]+2|0)>>>0){r11=r13}else{r3=854;break L1160}}HEAP32[r5]=r11;r14=r11;STACKTOP=r4;return r14}else{r3=854}}while(0);L1174:do{if(r3==854){L1176:do{if(r7>>>0>2){r6=r1+36|0;r10=r1+68|0;r9=r1+32|0;r2=2;while(1){r13=FUNCTION_TABLE[HEAP32[r6>>2]](r1,r2);if((r13|0)==0){break}do{if(r13>>>0<2){r3=867}else{if(r13>>>0>(HEAP32[r8]+1|0)>>>0){r3=867;break}else{break}}}while(0);do{if(r3==867){r3=0;if(r13>>>0>=HEAP32[r10>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r2,tempInt));HEAP32[r9>>2]=HEAP32[r9>>2]+1|0}}while(0);if((r13|0)==1){break L1174}else if((r13|0)==0){break}r15=r2+1|0;if(r15>>>0<r7>>>0){r2=r15}else{break L1176}}HEAP32[r5]=r2;r14=r2;STACKTOP=r4;return r14}}while(0);r11=HEAP32[r5];_fprintf(HEAP32[_stderr>>2],5251052,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r1+124>>2],HEAP32[tempInt+4>>2]=r11,tempInt));r14=1;STACKTOP=r4;return r14}}while(0);_fwrite(5250372,10,1,HEAP32[_stderr>>2]);r14=1;STACKTOP=r4;return r14}function _fat_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r5=r1>>2;r6=0;HEAP32[r5+8]=0;HEAP32[r5+12]=0;r7=r1+116|0;HEAP32[r7>>2]=-1;r8=r1+120|0;HEAP32[r8>>2]=-1;r9=(r1+128|0)>>2;HEAP32[r9]=0;r10=(r1+132|0)>>2;HEAP32[r10]=0;r11=r1+56|0;r12=HEAP32[r11>>2];if((r12|0)==0){r13=HEAPU8[r2+37|0]<<8|HEAPU8[r2+36|0]|(HEAPU8[r2+39|0]<<8|HEAPU8[r2+38|0])<<16;HEAP32[r11>>2]=r13;r11=r2+40|0;HEAP32[r5+26]=HEAPU8[r11]>>>7&255^1;HEAP32[r5+25]=HEAP8[r11]&15;HEAP32[r5+27]=HEAPU8[r2+45|0]<<8|HEAPU8[r2+44|0]|(HEAPU8[r2+47|0]<<8|HEAPU8[r2+46|0])<<16;HEAP32[r5+22]=HEAP32[r5+13]+Math.imul(HEAP32[r5+15],r13)|0;r13=r1+28|0;r11=HEAP32[r13>>2];r14=HEAPU8[r2+49|0]<<8|HEAPU8[r2+48|0];r15=r1+112|0;HEAP32[r15>>2]=r14;if(!(r11>>>0<512|(r14|0)==0)){r14=_malloc(r11);if((r14|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}r11=HEAP32[r5+2];r16=HEAP32[r5+36];r17=r11;r18=HEAP32[HEAP32[r11>>2]>>2];r11=HEAP32[r15>>2]<<r16;r15=1<<r16;r16=r14;r19=0;while(1){r20=FUNCTION_TABLE[r18](r17,r16,r11,r15);if((r20|0)<1){r6=898;break}r21=r20+r19|0;if((r15|0)==(r20|0)){r22=r21;break}else{r11=r20+r11|0;r15=r15-r20|0;r16=r16+r20|0;r19=r21}}if(r6==898){r22=(r19|0)==0?r20:r19}do{if((r22|0)==(HEAP32[r13>>2]|0)){if((HEAPU8[r14+1|0]<<8|HEAPU8[r14]|(HEAPU8[r14+3|0]<<8|HEAPU8[r14+2|0])<<16|0)!=1096897106){break}if((HEAPU8[r14+485|0]<<8|HEAPU8[r14+484|0]|(HEAPU8[r14+487|0]<<8|HEAPU8[r14+486|0])<<16|0)!=1631679090){break}HEAP32[r8>>2]=HEAPU8[r14+489|0]<<8|HEAPU8[r14+488|0]|(HEAPU8[r14+491|0]<<8|HEAPU8[r14+490|0])<<16;HEAP32[r7>>2]=HEAPU8[r14+493|0]<<8|HEAPU8[r14+492|0]|(HEAPU8[r14+495|0]<<8|HEAPU8[r14+494|0])<<16}}while(0);_free(r14)}HEAP32[r5+18]=32;HEAP32[r5+16]=268435455;HEAP32[r5+17]=268435446;HEAP32[r5+9]=146;HEAP32[r5+10]=60;if((_check_media_type(r1,r2,r3)|0)==0){r23=(_check_fat(r1)|0)!=0}else{r23=1}r24=r23&1;return r24}HEAP32[r5+26]=1;HEAP32[r5+25]=0;r23=r1+60|0;r14=HEAP32[r5+13]+Math.imul(r12,HEAP32[r23>>2])|0;HEAP32[r5+20]=r14;HEAP32[r5+22]=r14+HEAP32[r5+21]|0;HEAP32[r5+28]=-1;if((r4|0)!=0){HEAP32[r23>>2]=1}if((_check_media_type(r1,r2,r3)|0)!=0){r24=-1;return r24}r3=r1+72|0;do{if(HEAP32[r5+23]>>>0>4084){HEAP32[r3>>2]=16;HEAP32[r5+16]=65535;HEAP32[r5+17]=65526;HEAP32[r5+9]=86;HEAP32[r5+10]=30;if((HEAP32[1311255]|0)!=0){break}r2=3>>>(HEAP32[r5+36]>>>0);do{if((r2|0)==(HEAP32[r9]|0)){r23=HEAP32[r10];if((r23|0)==0){r6=887;break}else{r25=r23;break}}else{r6=887}}while(0);do{if(r6==887){r23=_loadSector(r1,r2,0,0);if((r23|0)==0){r24=-1;return r24}else{HEAP32[r9]=r2;HEAP32[r10]=r23;HEAP32[r5+34]=0;r25=r23;break}}}while(0);r2=r25+(HEAP32[r5+35]&3)|0;if((r2|0)==0){r24=-1;return r24}if(HEAP8[r2]<<24>>24==-1){break}else{r24=-1}return r24}else{HEAP32[r3>>2]=12;HEAP32[r5+16]=4095;HEAP32[r5+17]=4086;HEAP32[r5+9]=148;HEAP32[r5+10]=168}}while(0);r24=_check_fat(r1);return r24}function _getfree(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=0;r3=STACKTOP;L1244:do{if((r1|0)==0){r4=0}else{r5=r1;while(1){if((HEAP32[r5>>2]|0)==5264944){r4=r5;break L1244}r6=HEAP32[r5+8>>2];if((r6|0)==0){r4=0;break L1244}else{r5=r6}}}}while(0);r1=r4;r5=r4+120|0;r6=HEAP32[r5>>2];if((r6|0)==-1|(r6|0)==0){r7=(r4+92|0)>>2;L1252:do{if((HEAP32[r7]+2|0)>>>0>2){r8=r4+36|0;r9=r4+68|0;r10=r4+32|0;r11=r10;r12=r10|0;r10=2;r13=0;L1254:while(1){r14=FUNCTION_TABLE[HEAP32[r8>>2]](r1,r10);do{if((r14|0)==0){r2=928}else{do{if(r14>>>0<2){r2=925}else{if(r14>>>0>(HEAP32[r7]+1|0)>>>0){r2=925;break}else{break}}}while(0);do{if(r2==925){r2=0;if(r14>>>0>=HEAP32[r9>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r14,HEAP32[tempInt+4>>2]=r10,tempInt));HEAP32[r12>>2]=HEAP32[r11>>2]+1|0}}while(0);if((r14|0)==1){r15=-1;break L1254}else if((r14|0)==0){r2=928;break}else{r16=r13;break}}}while(0);if(r2==928){r2=0;r16=r13+1|0}r14=r10+1|0;if(r14>>>0<(HEAP32[r7]+2|0)>>>0){r10=r14;r13=r16}else{r17=r16;break L1252}}STACKTOP=r3;return r15}else{r17=0}}while(0);HEAP32[r5>>2]=r17;r18=r17}else{r18=r6}r15=Math.imul(HEAP32[r4+24>>2],r18)<<HEAP32[r4+144>>2];STACKTOP=r3;return r15}function _getfreeMinClusters(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=0;r4=STACKTOP;L1272:do{if((r1|0)==0){r5=0}else{r6=r1;while(1){if((HEAP32[r6>>2]|0)==5264944){r5=r6;break L1272}r7=HEAP32[r6+8>>2];if((r7|0)==0){r5=0;break L1272}else{r6=r7}}}}while(0);r1=r5;r6=r5;r7=r5+120|0;do{if((HEAP32[1312285]|0)!=0){if((HEAP32[r7>>2]|0)!=-1){break}_getfree(r1)}}while(0);r1=HEAP32[r7>>2];if((r1|0)!=-1){if(r1>>>0>=r2>>>0){r8=1;STACKTOP=r4;return r8}_fwrite(5264204,10,1,HEAP32[_stderr>>2]);HEAP32[1311336]=1;r8=0;STACKTOP=r4;return r8}r1=HEAP32[r5+116>>2];r7=(r5+92|0)>>2;do{if(r1>>>0<2){r3=947}else{if(r1>>>0<(HEAP32[r7]+2|0)>>>0){r9=r1;break}else{r3=947;break}}}while(0);if(r3==947){r9=1}r1=r9+1|0;r9=r5+36|0;r10=r5+68|0;r11=r5+32|0;r5=r11;r12=r11|0;r11=r1;r13=0;L1294:while(1){if(r11>>>0>=(HEAP32[r7]+2|0)>>>0){r14=2;r15=r13;r3=959;break}r16=FUNCTION_TABLE[HEAP32[r9>>2]](r6,r11);do{if((r16|0)==0){r3=956}else{do{if(r16>>>0<2){r3=953}else{if(r16>>>0>(HEAP32[r7]+1|0)>>>0){r3=953;break}else{break}}}while(0);do{if(r3==953){r3=0;if(r16>>>0>=HEAP32[r10>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r16,HEAP32[tempInt+4>>2]=r11,tempInt));HEAP32[r12>>2]=HEAP32[r5>>2]+1|0}}while(0);if((r16|0)==0){r3=956;break}else if((r16|0)==1){break L1294}else{r17=r13;break}}}while(0);if(r3==956){r3=0;r17=r13+1|0}if(r17>>>0>=r2>>>0){r8=1;r3=975;break}r11=r11+1|0;r13=r17}if(r3==975){STACKTOP=r4;return r8}L1311:do{if(r3==959){while(1){r3=0;if(r14>>>0>=r1>>>0){break}r17=FUNCTION_TABLE[HEAP32[r9>>2]](r6,r14);do{if((r17|0)==0){r3=966}else{do{if(r17>>>0<2){r3=963}else{if(r17>>>0>(HEAP32[r7]+1|0)>>>0){r3=963;break}else{break}}}while(0);do{if(r3==963){r3=0;if(r17>>>0>=HEAP32[r10>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r17,HEAP32[tempInt+4>>2]=r14,tempInt));HEAP32[r12>>2]=HEAP32[r5>>2]+1|0}}while(0);if((r17|0)==0){r3=966;break}else if((r17|0)==1){break L1311}else{r18=r15;break}}}while(0);if(r3==966){r3=0;r18=r15+1|0}if(r18>>>0<r2>>>0){r14=r14+1|0;r15=r18;r3=959}else{r8=1;r3=973;break}}if(r3==973){STACKTOP=r4;return r8}_fwrite(5264204,10,1,HEAP32[_stderr>>2]);HEAP32[1311336]=1;r8=0;STACKTOP=r4;return r8}}while(0);_fwrite(5250372,10,1,HEAP32[_stderr>>2]);r8=0;STACKTOP=r4;return r8}function _fs_free(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=r1+76|0;r3=HEAP32[r2>>2];if((r3|0)!=0){r4=(HEAP32[r1+56>>2]+63|0)>>>6;L1335:do{if((r4|0)==0){r5=r3}else{r6=0;r7=r3;while(1){r8=HEAP32[r7+(r6*20&-1)>>2];if((r8|0)==0){r9=r7}else{_free(r8);r9=HEAP32[r2>>2]}r8=r6+1|0;if((r8|0)<(r4|0)){r6=r8;r7=r9}else{r5=r9;break L1335}}}}while(0);_free(r5)}r5=HEAP32[r1+148>>2];if((r5|0)==0){return 0}_free(r5);return 0}function _check_media_type(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=r1>>2;r5=0;r6=STACKTOP;HEAP32[r4+23]=Math.floor(((r3-HEAP32[r4+22]|0)>>>0)/(HEAP32[r4+6]>>>0));HEAP32[r4+8]=0;r3=(HEAP32[r4+14]+63|0)>>>6;r7=_calloc(r3,20);r8=r7;if((r7|0)==0){HEAP32[r4+19]=0;_perror(5252508);r9=-1;STACKTOP=r6;return r9}if((r3|0)==0){HEAP32[r4+19]=r8}else{r7=0;while(1){r10=r7+1|0;r11=(r8+(r7*20&-1)|0)>>2;HEAP32[r11]=0;HEAP32[r11+1]=0;HEAP32[r11+2]=0;HEAP32[r11+3]=0;HEAP32[r11+4]=0;if((r10|0)<(r3|0)){r7=r10}else{break}}HEAP32[r4+19]=r8}r8=r1+128|0;do{if((HEAP32[r8>>2]|0)==0){r7=HEAP32[r4+33];if((r7|0)==0){r5=996;break}else{r12=r7;break}}else{r5=996}}while(0);do{if(r5==996){r7=_loadSector(r1,0,0,0);if((r7|0)!=0){HEAP32[r8>>2]=0;HEAP32[r4+33]=r7;HEAP32[r4+34]=0;r12=r7;break}_fwrite(5261808,32,1,HEAP32[_stderr>>2]);r9=-1;STACKTOP=r6;return r9}}while(0);if((HEAP32[1311255]|0)!=0){r9=0;STACKTOP=r6;return r9}r4=HEAP8[r12];do{if(r4<<24>>24==0){if(HEAP8[r12+1|0]<<24>>24!=0){break}if(HEAP8[r12+2|0]<<24>>24==0){r9=0}else{break}STACKTOP=r6;return r9}}while(0);r8=HEAP8[r2+21|0];do{if(r4<<24>>24!=r8<<24>>24&(r8&255)>239){if(!(r4<<24>>24==-7|r4<<24>>24==-9)){r5=1007;break}if(r8<<24>>24!=-16|(r4&255)<240){r5=1007;break}else{break}}else{if((r4&255)<240){r5=1007;break}else{break}}}while(0);if(r5==1007){_fprintf(HEAP32[_stderr>>2],5261372,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r4&255,HEAP32[tempInt+4>>2]=r8&255,tempInt));r9=-1;STACKTOP=r6;return r9}do{if(HEAP8[r12+1|0]<<24>>24==-1){if(HEAP8[r12+2|0]<<24>>24==-1){r9=0}else{break}STACKTOP=r6;return r9}}while(0);_fwrite(5260876,32,1,HEAP32[_stderr>>2]);r9=-1;STACKTOP=r6;return r9}function _check_fat(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;if((HEAP32[1311255]|0)!=0){r4=0;STACKTOP=r3;return r4}r5=HEAP32[r1+56>>2];r6=r1+92|0;r7=HEAP32[r6>>2];if(r5>>>0<(Math.floor(((Math.imul((HEAP32[r1+72>>2]|0)/4&-1,r7+2|0)-1|0)>>>1>>>0)/(HEAP32[r1+28>>2]>>>0))+1|0)>>>0){r4=-1;STACKTOP=r3;return r4}r5=r1+68|0;if((r7+1|0)>>>0>=HEAP32[r5>>2]>>>0){_fwrite(5263584,25,1,HEAP32[_stderr>>2]);r4=-1;STACKTOP=r3;return r4}r8=r7>>>0>4096?4096:r7;if(r8>>>0<=3){r4=0;STACKTOP=r3;return r4}r7=r1+36|0;r9=3;while(1){r10=FUNCTION_TABLE[HEAP32[r7>>2]](r1,r9);if((r10|0)==1){r11=1;break}if(r10>>>0<HEAP32[r5>>2]>>>0){if(r10>>>0>HEAP32[r6>>2]>>>0){r11=r10;break}}r10=r9+1|0;if(r10>>>0<r8>>>0){r9=r10}else{r4=0;r2=1033;break}}if(r2==1033){STACKTOP=r3;return r4}_fprintf(HEAP32[_stderr>>2],5262968,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r11,tempInt));_fwrite(5262240,25,1,HEAP32[_stderr>>2]);r4=-1;STACKTOP=r3;return r4}function _loadSector(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44;r5=0;r6=STACKTOP;r7=r1+56|0;if(HEAP32[r7>>2]>>>0<=r2>>>0){r8=0;STACKTOP=r6;return r8}r9=r2>>>6;r10=r2&63;r11=(r1+76|0)>>2;r12=HEAP32[r11];do{if((HEAP32[r12+(r9*20&-1)>>2]|0)==0){r13=r1+28|0;r14=_malloc(HEAP32[r13>>2]<<6);HEAP32[HEAP32[r11]+(r9*20&-1)>>2]=r14;r14=HEAP32[HEAP32[r11]+(r9*20&-1)>>2];if((r14|0)==0){r8=0;STACKTOP=r6;return r8}else{_memset(r14,-18,HEAP32[r13>>2]<<6);r15=HEAP32[r11];break}}else{r15=r12}}while(0);r12=r15+(r9*20&-1)+12|0;r13=HEAP32[r12>>2];r14=HEAP32[r12+4>>2];r12=_bitshift64Shl(1,0,r10);r16=tempRet0;L1422:do{if((r13&r12|0)==0&(r14&r16|0)==0){r17=r1+60|0;r18=HEAP32[r17>>2];do{if((r18|0)==0){r19=r4;r5=1057}else{r20=r1+100|0;r21=r1+52|0;r22=64-r10|0;r23=(r1+144|0)>>2;r24=r1+8|0;r25=r1+28|0;r26=0;r27=r18;r28=r15;r29=r14;r30=r13;while(1){r31=HEAP32[r21>>2];r32=Math.imul(HEAP32[r7>>2],((HEAP32[r20>>2]+r26|0)>>>0)%(r27>>>0));r33=HEAP32[r23];r34=r31+r2+r32|0;r32=HEAP32[r24>>2];r31=FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]>>2]](r32,(r10<<r33)+HEAP32[r28+(r9*20&-1)>>2]|0,r34<<r33,((r30|0)==0&(r29|0)==0?r22:1)<<r33);if((r31|0)>=0){if(r31>>>0<HEAP32[r25>>2]>>>0){r33=HEAP32[r23];r32=HEAP32[r24>>2];r35=r32;r36=HEAP32[HEAP32[r32>>2]>>2];r32=r34<<r33;r34=1<<r33;r37=(r10<<r33)+HEAP32[HEAP32[r11]+(r9*20&-1)>>2]|0;r33=0;while(1){r38=FUNCTION_TABLE[r36](r35,r37,r32,r34);if((r38|0)<1){r5=1048;break}r39=r38+r33|0;if((r34|0)==(r38|0)){r40=r39;break}else{r32=r38+r32|0;r34=r34-r38|0;r37=r37+r38|0;r33=r39}}if(r5==1048){r5=0;r40=(r33|0)==0?r38:r33}r41=(r40|0)>=(HEAP32[r25>>2]|0)&1}else{r41=r31>>HEAP32[r23]}if((r41|0)!=0){break}}_fprintf(HEAP32[_stderr>>2],5260468,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r26,tempInt));r37=r26+1|0;r34=HEAP32[r17>>2];if(r37>>>0>=r34>>>0){r8=0;r5=1068;break}r32=HEAP32[r11];r35=r32+(r9*20&-1)+12|0;r26=r37;r27=r34;r28=r32;r29=HEAP32[r35+4>>2];r30=HEAP32[r35>>2]}if(r5==1068){STACKTOP=r6;return r8}r30=HEAP32[r11]+(r9*20&-1)+12|0;r29=(HEAP32[r30>>2]|0)==0&(HEAP32[r30+4>>2]|0)==0?r4:1;if((r41|0)>0){r42=0}else{r19=r29;r5=1057;break}while(1){r30=_bitshift64Shl(1,0,r42+r10|0);r28=(HEAP32[r11]+(r9*20&-1)+12|0)>>2;r27=HEAP32[r28+1]|tempRet0;HEAP32[r28]=HEAP32[r28]|r30;HEAP32[r28+1]=r27;r27=r42+1|0;if((r27|0)==(r41|0)){break}else{r42=r27}}r27=(r29|0)==0;if(!(r27&(r41|0)==1)){r43=r27;break}_loadSector(r1,r2+1|0,r3,1);r43=r27;break}}while(0);if(r5==1057){r43=(r19|0)==0}if(r43&(HEAP32[1312285]|0)!=0){r44=0}else{break}while(1){_loadSector(r1,r44+r2|0,r3,1);r17=r44+1|0;if((r17|0)==1024){break L1422}else{r44=r17}}}}while(0);if((r3|0)==1){r3=(HEAP32[r11]+(r9*20&-1)+4|0)>>2;r44=HEAP32[r3+1]|r16;HEAP32[r3]=HEAP32[r3]|r12;HEAP32[r3+1]=r44;HEAP32[r1+48>>2]=1}r8=(r10<<HEAP32[r1+144>>2])+HEAP32[HEAP32[r11]+(r9*20&-1)>>2]|0;STACKTOP=r6;return r8}function _fat_free(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;L1460:do{if((r1|0)==0){r5=0}else{r6=r1;while(1){if((HEAP32[r6>>2]|0)==5264944){r5=r6;break L1460}r7=HEAP32[r6+8>>2];if((r7|0)==0){r5=0;break L1460}else{r6=r7}}}}while(0);if((r2|0)==0){STACKTOP=r4;return 0}r1=r5+32|0;r6=r1;r7=r5;r8=r5+36|0;r9=r5+40|0;r10=r5+120|0;r11=r10;r12=r5+68|0;r13=r1|0;r1=r5+92|0;r5=r2;while(1){if((HEAP32[r6>>2]|0)!=0){r3=1087;break}r2=FUNCTION_TABLE[HEAP32[r8>>2]](r7,r5);do{if((r2|0)!=0){if(r2>>>0>=2){if(r2>>>0<=(HEAP32[r1>>2]+1|0)>>>0){break}}if(r2>>>0>=HEAP32[r12>>2]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2,HEAP32[tempInt+4>>2]=r5,tempInt));HEAP32[r13>>2]=HEAP32[r6>>2]+1|0}}while(0);FUNCTION_TABLE[HEAP32[r9>>2]](r7,r5,0);r14=HEAP32[r11>>2];if((r14|0)!=-1){HEAP32[r10>>2]=r14+1|0}if(r2>>>0<HEAP32[r12>>2]>>>0){r5=r2}else{r3=1086;break}}if(r3==1087){STACKTOP=r4;return 0}else if(r3==1086){STACKTOP=r4;return 0}}function _fatFreeWithDir(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=0;r4=r2|0;do{if((_strncmp(r4,5260916,8)|0)==0){r3=1091}else{if((_strncmp(r4,5263256,8)|0)==0){r3=1091;break}else{break}}}while(0);do{if(r3==1091){if((_strncmp(r2+8|0,5258796,3)|0)!=0){break}_fwrite(5256944,31,1,HEAP32[_stderr>>2]);r5=-1;return r5}}while(0);r3=HEAPU8[r2+27|0]<<8|HEAPU8[r2+26|0];r4=r1;L1493:do{if((HEAP32[r1>>2]|0)==5264944){r6=r4}else{r7=r4;while(1){r8=HEAP32[r7+8>>2];if((HEAP32[r8>>2]|0)==5264944){r6=r8;break L1493}else{r7=r8}}}}while(0);do{if((HEAP32[r6+72>>2]|0)==32){if((HEAP32[r6+108>>2]|0)==0){r9=r3;break}r9=(HEAPU8[r2+21|0]<<8|HEAPU8[r2+20|0])<<16|r3}else{r9=r3}}while(0);_fat_free(r1,r9);r5=0;return r5}function __countBlocks(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r3+4;HEAP32[r5>>2]=0;HEAP32[r4>>2]=0;r6=(r1+68|0)>>2;if(HEAP32[r6]>>>0<r2>>>0|r2>>>0<2){r7=0;STACKTOP=r3;return r7}r8=r1+36|0;r9=r1+32|0;r10=r1+92|0;r11=r2;r2=0;while(1){r12=r2+1|0;r13=FUNCTION_TABLE[HEAP32[r8>>2]](r1,r11);do{if((r13|0)!=0){if(r13>>>0>=2){if(r13>>>0<=(HEAP32[r10>>2]+1|0)>>>0){break}}if(r13>>>0>=HEAP32[r6]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r11,tempInt));HEAP32[r9>>2]=HEAP32[r9>>2]+1|0}}while(0);r14=(__loopDetect(r5,r12,r4,r13)|0)<0?-1:r13;if(r14>>>0>HEAP32[r6]>>>0|r14>>>0<2){r7=r12;break}else{r11=r14;r2=r12}}STACKTOP=r3;return r7}function _printFat(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=0;r3=STACKTOP;L1517:do{if((HEAP32[r1>>2]|0)==5265052){r4=r1}else{r5=r1;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L1517}else{r5=r6}}}}while(0);r1=HEAP32[r4+32>>2];if((r1|0)==0){_puts(5242980);STACKTOP=r3;return}r5=r4+8|0;r6=r4+356|0;r7=r4+360|0;r4=r7;r8=1;r9=0;r10=0;r11=0;r12=r1;while(1){do{if(r8){r2=1123}else{if((r12|0)==(r9+1|0)){r13=r10;break}if((r10|0)!=(r9|0)){_printf(5263196,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt))}_printf(5259448,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r2=1123;break}}while(0);if(r2==1123){r2=0;_printf(5256936,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r12,tempInt));r13=r12}r1=HEAP32[r5>>2],r14=r1>>2;r15=FUNCTION_TABLE[HEAP32[r14+9]](r1,r12);do{if((r15|0)!=0){if(r15>>>0>=2){if(r15>>>0<=(HEAP32[r14+23]+1|0)>>>0){break}}if(r15>>>0>=HEAP32[r14+17]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r15,HEAP32[tempInt+4>>2]=r12,tempInt));r16=r1+32|0;HEAP32[r16>>2]=HEAP32[r16>>2]+1|0}}while(0);r17=r11+1|0;r18=HEAP32[r6>>2];if((r18|0)!=0&r18>>>0<r17>>>0){if((HEAP32[r4>>2]|0)==(r15|0)){r2=1131;break}}if((r18<<1|1)>>>0<=r17>>>0){HEAP32[r6>>2]=r17;HEAP32[r7>>2]=r15}if(r15>>>0<=HEAP32[HEAP32[r5>>2]+68>>2]>>>0&(r15|0)!=1){r8=0;r9=r12;r10=r13;r11=r17;r12=r15}else{break}}if(r2==1131){_fprintf(HEAP32[_stderr>>2],5249620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r18,HEAP32[tempInt+4>>2]=r17,HEAP32[tempInt+8>>2]=r15,tempInt))}if((r13|0)!=(r12|0)){_printf(5263196,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r12,tempInt))}_putchar(62);STACKTOP=r3;return}function _printFatWithOffset(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=0;r4=STACKTOP;L1557:do{if((HEAP32[r1>>2]|0)==5265052){r5=r1}else{r6=r1;while(1){r7=HEAP32[r6+8>>2];if((HEAP32[r7>>2]|0)==5265052){r5=r7;break L1557}else{r6=r7}}}}while(0);r1=HEAP32[r5+32>>2];if((r1|0)==0){_puts(5242980);STACKTOP=r4;return}r6=r5+8|0;r7=HEAP32[r6>>2];r8=Math.imul(HEAP32[r7+28>>2],HEAP32[r7+24>>2]);L1565:do{if((r8|0)>(r2|0)){r9=r1}else{r10=r5+356|0;r11=r5+360|0;r12=r11;r13=r1;r14=1;r15=r2;r16=r7,r17=r16>>2;while(1){r18=FUNCTION_TABLE[HEAP32[r17+9]](r16,r13);do{if((r18|0)!=0){if(r18>>>0>=2){if(r18>>>0<=(HEAP32[r17+23]+1|0)>>>0){break}}if(r18>>>0>=HEAP32[r17+17]>>>0){break}_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r18,HEAP32[tempInt+4>>2]=r13,tempInt));r19=r16+32|0;HEAP32[r19>>2]=HEAP32[r19>>2]+1|0}}while(0);r20=HEAP32[r10>>2];if((r20|0)!=0&r20>>>0<r14>>>0){if((HEAP32[r12>>2]|0)==(r18|0)){break}}if((r20<<1|1)>>>0<=r14>>>0){HEAP32[r10>>2]=r14;HEAP32[r11>>2]=r18}r19=HEAP32[r6>>2];if(r18>>>0>HEAP32[r19+68>>2]>>>0){r3=1164;break}r21=r15-r8|0;if((r21|0)<(r8|0)){r9=r18;break L1565}else{r13=r18;r14=r14+1|0;r15=r21;r16=r19,r17=r16>>2}}if(r3==1164){STACKTOP=r4;return}_fprintf(HEAP32[_stderr>>2],5249620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r20,HEAP32[tempInt+4>>2]=r14,HEAP32[tempInt+8>>2]=r18,tempInt));STACKTOP=r4;return}}while(0);_printf(5252504,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt));STACKTOP=r4;return}function _OpenRoot(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=STACKTOP;STACKTOP=STACKTOP+324|0;r3=r2;r4=r2+4;r5=r2+16;r6=r2+320,r7=r6>>2;_memset(r5,0,304);r8=r1;r9=r1;L1590:do{if((HEAP32[r9>>2]|0)==5264944){r10=r8}else{r11=r8;while(1){r12=HEAP32[r11+8>>2];if((HEAP32[r12>>2]|0)==5264944){r10=r12;break L1590}else{r11=r12}}}}while(0);if((HEAP32[r10+72>>2]|0)==32){r13=HEAP32[r10+108>>2]}else{r13=0}HEAP32[r5+4>>2]=-3;HEAP8[r5+40|0]=0;r10=r4|0;_strncpy(r10,5251768,8);r11=r4+8|0;HEAP8[r11]=HEAP8[5258796];HEAP8[r11+1|0]=HEAP8[5258797|0];HEAP8[r11+2|0]=HEAP8[5258798|0];HEAP32[r3>>2]=0;r4=_localtime(r3)>>2;_strncpy(r5+8|0,r10,8);_strncpy(r5+16|0,r11,3);HEAP8[r5+19|0]=16;HEAP8[r5+21|0]=0;r11=HEAP32[r4+1];r10=(HEAP32[r4]|0)/2&-1;r3=(HEAP32[r4+2]<<3)+(r11>>>3)&255;HEAP8[r5+31|0]=r3;HEAP8[r5+23|0]=r3;r3=(r11<<5)+r10&255;HEAP8[r5+30|0]=r3;HEAP8[r5+22|0]=r3;r3=HEAP32[r4+4]+1|0;r10=HEAP32[r4+3];r11=(HEAP32[r4+5]<<1)+(r3>>>3)+96&255;HEAP8[r5+33|0]=r11;HEAP8[r5+25|0]=r11;HEAP8[r5+27|0]=r11;r11=(r3<<5)+r10&255;HEAP8[r5+32|0]=r11;HEAP8[r5+24|0]=r11;HEAP8[r5+26|0]=r11;HEAP8[r5+35|0]=(r13&65535)>>>8&255;HEAP8[r5+34|0]=r13&255;HEAP8[r5+29|0]=r13>>>24&255;HEAP8[r5+28|0]=r13>>>16&255;HEAP32[r5+36>>2]=0;if((r13|0)==0){L1599:do{if((HEAP32[r9>>2]|0)==5264944){r14=r8}else{r11=r8;while(1){r10=HEAP32[r11+8>>2];if((HEAP32[r10>>2]|0)==5264944){r14=r10;break L1599}else{r11=r10}}}}while(0);r15=Math.imul(HEAP32[r14+28>>2],HEAP32[r14+84>>2]);r16=__internalFileOpen(r1,r13,r15,r5);HEAP32[r7]=r16;_bufferize(r6);r17=HEAP32[r7];STACKTOP=r2;return r17}L1605:do{if((r1|0)==0){r18=0}else{r14=r8;while(1){if((HEAP32[r14>>2]|0)==5264944){r18=r14;break L1605}r9=HEAP32[r14+8>>2];if((r9|0)==0){r18=0;break L1605}else{r14=r9}}}}while(0);r8=__countBlocks(r18,r13);r15=Math.imul(Math.imul(HEAP32[r18+28>>2],r8),HEAP32[r18+24>>2]);r16=__internalFileOpen(r1,r13,r15,r5);HEAP32[r7]=r16;_bufferize(r6);r17=HEAP32[r7];STACKTOP=r2;return r17}function __internalFileOpen(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+368|0;r7=r6,r8=r7>>2;r9=r6+364,r10=r9>>2;L1612:do{if((r1|0)==0){r11=0}else{r12=r1;while(1){if((HEAP32[r12>>2]|0)==5264944){r11=r12;break L1612}r13=HEAP32[r12+8>>2];if((r13|0)==0){r11=0;break L1612}else{r12=r13}}}}while(0);r1=r11;if(!HEAP8[5245236]){r12=_calloc(1,32);HEAP32[1311704]=r12;L1620:do{if((r12|0)!=0){HEAP32[r12>>2]=64;HEAP32[HEAP32[1311704]+4>>2]=66;HEAP32[HEAP32[1311704]+8>>2]=110;HEAP32[HEAP32[1311704]+12>>2]=0;r13=HEAP32[1311704],r14=r13>>2;r15=r13+12|0;r16=HEAP32[r15>>2];r17=(r16|0)>97?r16:97;HEAP32[r14+6]=((r17<<2|0)/5&-1)-2|0;HEAP32[r15>>2]=r17;HEAP32[r14+4]=0;HEAP32[r14+5]=0;r14=_calloc(r17,4);r15=r14;r16=r13+28|0;HEAP32[r16>>2]=r15;if(!((r14|0)!=0&(r17|0)>0)){break}HEAP32[r15>>2]=5242884;if((r17|0)>1){r18=1}else{break}while(1){HEAP32[HEAP32[r16>>2]+(r18<<2)>>2]=5242884;r15=r18+1|0;if((r15|0)<(r17|0)){r18=r15}else{break L1620}}}}while(0);HEAP8[5245236]=1}r18=(r11+4|0)>>2;HEAP32[r18]=HEAP32[r18]+1|0;r11=(r2|0)==1;do{if(!r11){HEAP32[r8+2]=r1;HEAP32[r8]=5265052;do{if((r2|0)==0){if((r4|0)!=0){if((HEAP8[r4+19|0]&16)<<24>>24==0){r5=1194;break}}HEAP32[r8+4]=156;break}else{r5=1194}}while(0);if(r5==1194){HEAP32[r8+4]=14}HEAP32[r8+8]=r2;HEAP32[r8+89]=0;HEAP32[r8+90]=r2;if((__hash_lookup(HEAP32[1311704],r7,r9,0,0)|0)!=0){break}r12=HEAP32[r10]+4|0;HEAP32[r12>>2]=HEAP32[r12>>2]+1|0;HEAP32[r18]=HEAP32[r18]-1|0;r19=HEAP32[r10];STACKTOP=r6;return r19}}while(0);r18=_calloc(1,364);HEAP32[r10]=r18;if((r18|0)==0){r19=0;STACKTOP=r6;return r19}HEAP32[r18+352>>2]=0;HEAP32[HEAP32[r10]+28>>2]=0;HEAP32[HEAP32[r10]+24>>2]=0;r18=HEAP32[r10],r10=r18>>2;_memcpy(r18+44|0,r4,304);do{if((HEAP32[r4+4>>2]|0)==-3){HEAP32[r10+11]=r18}else{r9=HEAP32[r10+11];if((r9|0)==0){break}r7=r9+4|0;HEAP32[r7>>2]=HEAP32[r7>>2]+1|0}}while(0);HEAP32[r10]=5265052;HEAP32[r10+2]=r1;do{if((r2|0)==0){if((r4|0)!=0){if((HEAP8[r4+19|0]&16)<<24>>24==0){r5=1206;break}}HEAP32[r10+4]=156;break}else{r5=1206}}while(0);if(r5==1206){HEAP32[r10+4]=14}HEAP32[r10+8]=r11?0:r2;HEAP32[r10+89]=0;HEAP32[r10+90]=0;HEAP32[r10+10]=65535;HEAP32[r10+5]=r3;HEAP32[r10+1]=1;HEAP32[r10+3]=0;_hash_add(HEAP32[1311704],r18,r18+348|0);r19=r18;STACKTOP=r6;return r19}function _OpenFileByDirentry(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;r4=r1|0;r5=HEAP32[r4>>2];r6=r5;L1658:do{if((HEAP32[r5>>2]|0)==5264944){r7=r6}else{r8=r6;while(1){r9=HEAP32[r8+8>>2];if((HEAP32[r9>>2]|0)==5264944){r7=r9;break L1658}else{r8=r9}}}}while(0);r8=HEAPU8[r1+35|0]<<8|HEAPU8[r1+34|0];do{if((HEAP32[r7+72>>2]|0)==32){if((HEAP32[r7+108>>2]|0)==0){r10=r8;break}r10=(HEAPU8[r1+29|0]<<8|HEAPU8[r1+28|0])<<16|r8}else{r10=r8}}while(0);r8=HEAP8[r1+19|0];do{if((r10|0)==0){if((r8&16)<<24>>24==0){break}r11=_OpenRoot(r5);STACKTOP=r2;return r11}}while(0);r7=r1+19|0;if((r8&16)<<24>>24==0){r12=HEAPU8[r1+37|0]<<8|HEAPU8[r1+36|0]|(HEAPU8[r1+39|0]<<8|HEAPU8[r1+38|0])<<16;r13=r5}else{L1673:do{if((r5|0)==0){r14=0}else{r8=r6;while(1){if((HEAP32[r8>>2]|0)==5264944){r14=r8;break L1673}r9=HEAP32[r8+8>>2];if((r9|0)==0){r14=0;break L1673}else{r8=r9}}}}while(0);r6=__countBlocks(r14,r10);r12=Math.imul(Math.imul(HEAP32[r14+28>>2],r6),HEAP32[r14+24>>2]);r13=HEAP32[r4>>2]}r4=__internalFileOpen(r13,r10,r12,r1);HEAP32[r3>>2]=r4;if((HEAP8[r7]&16)<<24>>24==0){r11=r4;STACKTOP=r2;return r11}_bufferize(r3);r4=HEAP32[r3>>2];if((r10|0)!=1){r11=r4;STACKTOP=r2;return r11}_dir_grow(r4,0);r11=r4;STACKTOP=r2;return r11}function _root_map(r1,r2,r3,r4,r5){var r6,r7,r8;r4=HEAP32[r1+8>>2]>>2;r1=Math.imul(HEAP32[r4+7],HEAP32[r4+21]);if(r1>>>0<r2>>>0){HEAP32[r3>>2]=0;HEAP32[___errno_location()>>2]=28;r6=-2;return r6}r7=r1-r2|0;r1=HEAP32[r3>>2];if(r1>>>0>r7>>>0){HEAP32[r3>>2]=r7;r8=r7}else{r8=r1}if((r8|0)==0){r6=0;return r6}HEAP32[r5>>2]=(HEAP32[r4+20]<<HEAP32[r4+36])+r2|0;r6=1;return r6}function _flush_file(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=r1+44|0;r3=r2;L1700:do{if((HEAP32[r1>>2]|0)==5265052){r4=r1}else{r5=r1;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L1700}else{r5=r6}}}}while(0);if((HEAP32[r4+16>>2]|0)==156){return 0}r4=HEAP32[r1+32>>2];r1=HEAP32[r2>>2];r5=r2+8|0;r6=r1;L1707:do{if((HEAP32[r1>>2]|0)==5264944){r7=r6}else{r8=r6;while(1){r9=HEAP32[r8+8>>2];if((HEAP32[r9>>2]|0)==5264944){r7=r9;break L1707}else{r8=r9}}}}while(0);r6=r5+26|0;r1=r5+27|0;r8=HEAPU8[r1]<<8|HEAPU8[r6];do{if((HEAP32[r7+72>>2]|0)==32){if((HEAP32[r7+108>>2]|0)==0){r10=r8;break}r10=(HEAPU8[r5+21|0]<<8|HEAPU8[r2+28|0])<<16|r8}else{r10=r8}}while(0);if((r4|0)==(r10|0)){return 0}HEAP8[r1]=(r4&65535)>>>8&255;HEAP8[r6]=r4&255;r6=r2+28|0;HEAP8[r6+1|0]=r4>>>24&255;HEAP8[r6]=r4>>>16&255;_dir_write(r3);return 0}function _free_file(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;r5=HEAP32[r1+8>>2];r6=HEAP32[r1+28>>2];do{if((r6|0)<0){if((_getfreeMinClusters(r5,-r6|0)|0)==1){r2=1261;break}else{break}}else{r2=1261}}while(0);if(r2==1261){r2=r5+124|0;HEAP32[r2>>2]=HEAP32[r2>>2]-r6|0}_free_stream(r1+44|0);L1725:do{if((HEAP32[r1>>2]|0)==5265052){r7=r1}else{r6=r1;while(1){r2=HEAP32[r6+8>>2];if((HEAP32[r2>>2]|0)==5265052){r7=r2;break L1725}else{r6=r2}}}}while(0);r6=r7+352|0;r7=HEAP32[r6>>2];if((r7|0)==0){r8=HEAP32[1311704];r9=r1;r10=r1+348|0;r11=r10;r12=HEAP32[r11>>2];r13=_hash_remove(r8,r9,r12);STACKTOP=r3;return 0}r2=_freeDirCacheRange(r7,0,HEAP32[r7+4>>2]);L1732:do{if((r2|0)>-1){HEAP8[r4]=0;r5=r1;r14=HEAP32[HEAP32[r1>>2]+4>>2];r15=r2<<5;r16=1;r17=r4;while(1){r18=FUNCTION_TABLE[r14](r5,r17,r15,r16);if((r18|0)<1){break L1732}if((r16|0)==(r18|0)){break L1732}else{r15=r18+r15|0;r16=r16-r18|0;r17=r17+r18|0}}}}while(0);_free(r7);HEAP32[r6>>2]=0;r8=HEAP32[1311704];r9=r1;r10=r1+348|0;r11=r10;r12=HEAP32[r11>>2];r13=_hash_remove(r8,r9,r12);STACKTOP=r3;return 0}function _normal_map(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r6=r3>>2;r3=0;r7=STACKTOP;r8=(r1+8|0)>>2;r9=HEAP32[r8],r10=r9>>2;HEAP32[r5>>2]=0;r11=r9+24|0;r12=Math.imul(HEAP32[r10+7],HEAP32[r11>>2]);r13=(r2|0)%(r12|0);r14=(r4|0)==1;do{if(r14){r15=HEAP32[r1+20>>2]-r2|0;r16=HEAP32[r6];if(r16>>>0<=r15>>>0){r17=r16;break}HEAP32[r6]=r15;r17=r15}else{r17=HEAP32[r6]}}while(0);if((r17|0)==0){r18=0;STACKTOP=r7;return r18}r17=r1+32|0;do{if(HEAP32[r17>>2]>>>0<2){if(r14){HEAP32[r6]=0;r18=0;STACKTOP=r7;return r18}r15=_get_next_free_cluster(HEAP32[r8],1);if((r15|0)==1){HEAP32[___errno_location()>>2]=28;r18=-2;STACKTOP=r7;return r18}else{r16=r1;r19=r1+348|0;_hash_remove(HEAP32[1311704],r16,HEAP32[r19>>2]);HEAP32[r17>>2]=r15;_hash_add(HEAP32[1311704],r16,r19);r19=HEAP32[r8];FUNCTION_TABLE[HEAP32[r19+40>>2]](r19,r15,HEAP32[r10+16]);r15=r19+120|0;r19=HEAP32[r15>>2];if((r19|0)==-1){break}HEAP32[r15>>2]=r19-1|0;break}}}while(0);r14=(r2|0)/(r12|0)&-1;r19=r1+40|0;r15=HEAP32[r19>>2];r16=r14>>>0<r15>>>0;r20=r1+36|0;r21=r16?0:r15;r15=Math.floor(((r13-1+HEAP32[r6]|0)>>>0)/(r12>>>0))+r14|0;L1760:do{if(r21>>>0>r15>>>0){r22=r21}else{r23=r9+68|0;r24=(r4|0)==2;r25=r1+356|0;r26=r1+360|0;r27=HEAP32[(r16?r17:r20)>>2];r28=r21;L1762:while(1){if((r28|0)==(r14|0)){HEAP32[r19>>2]=r14;HEAP32[r20>>2]=r27}r29=HEAP32[r8],r30=r29>>2;r31=FUNCTION_TABLE[HEAP32[r30+9]](r29,r27);if((r31|0)==0){r32=0;r3=1328;break}r33=r31>>>0<2;do{if(r33){r3=1292}else{if(r31>>>0>(HEAP32[r30+23]+1|0)>>>0){r3=1292;break}else{break}}}while(0);if(r3==1292){r3=0;if(r31>>>0<HEAP32[r30+17]>>>0){_fprintf(HEAP32[_stderr>>2],5251772,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r31,HEAP32[tempInt+4>>2]=r27,tempInt));r34=r29+32|0;HEAP32[r34>>2]=HEAP32[r34>>2]+1|0}if(r33){r32=r31;r3=1329;break}}if((r28|0)==(r15|0)){r22=r15;break L1760}do{if(r31>>>0>HEAP32[r23>>2]>>>0&r24){r34=_get_next_free_cluster(HEAP32[r8],r27);if((r34|0)==1){r3=1299;break L1762}r35=HEAP32[r8];r36=r35+40|0;FUNCTION_TABLE[HEAP32[r36>>2]](r35,r27,r34);FUNCTION_TABLE[HEAP32[r36>>2]](r35,r34,HEAP32[r35+64>>2]);r36=r35+120|0;r35=HEAP32[r36>>2];if((r35|0)==-1){r37=r34;break}HEAP32[r36>>2]=r35-1|0;r37=r34}else{r37=r31}}while(0);if(r28>>>0<r14>>>0){if(r37>>>0>HEAP32[r23>>2]>>>0){r3=1304;break}}else{if((r37|0)!=(r27+1|0)){r22=r28;break L1760}}r38=r28+1|0;r39=HEAP32[r25>>2];if((r39|0)!=0&r39>>>0<r38>>>0){if((HEAP32[r26>>2]|0)==(r37|0)){r3=1311;break}}if((r39<<1|1)>>>0<=r38>>>0){HEAP32[r25>>2]=r38;HEAP32[r26>>2]=r37}if(r38>>>0>r15>>>0){r22=r38;break L1760}else{r27=r37;r28=r38}}if(r3==1299){HEAP32[___errno_location()>>2]=28;r18=-2;STACKTOP=r7;return r18}else if(r3==1304){HEAP32[r6]=0;r18=0;STACKTOP=r7;return r18}else if(r3==1311){_fprintf(HEAP32[_stderr>>2],5249620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r39,HEAP32[tempInt+4>>2]=r38,HEAP32[tempInt+8>>2]=r37,tempInt));HEAP32[___errno_location()>>2]=5;r18=-2;STACKTOP=r7;return r18}else if(r3==1328){r28=HEAP32[_stderr>>2];r26=_fprintf(r28,5251016,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r27,HEAP32[tempInt+4>>2]=r32,tempInt));_exit(1)}else if(r3==1329){r28=HEAP32[_stderr>>2];r26=_fprintf(r28,5251016,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r27,HEAP32[tempInt+4>>2]=r32,tempInt));_exit(1)}}}while(0);r32=Math.imul(1-r14+r22|0,r12)-r13|0;r22=HEAP32[r6];if(r22>>>0>r32>>>0){HEAP32[r6]=r32;r40=r32}else{r40=r22}r22=r40+r2|0;do{if((HEAP32[1312285]|0)!=0&(r4|0)==2){if(r22>>>0<HEAP32[r1+20>>2]>>>0){r41=r40;break}r2=r12-1|0;r32=r2+r40-((r2+r22|0)>>>0)%(r12>>>0)|0;HEAP32[r6]=r32;r41=r32}else{r41=r40}}while(0);r40=Math.floor(((r41+r13|0)>>>0)/(r12>>>0));r12=HEAP32[r20>>2];if((r40-2+r12|0)>>>0>HEAP32[r10+23]>>>0){_fwrite(5250348,16,1,HEAP32[_stderr>>2]);_exit(1)}HEAP32[r5>>2]=(Math.imul(HEAP32[r11>>2],r12-2|0)+HEAP32[r10+22]<<HEAP32[r10+36])+r13|0;r18=1;STACKTOP=r7;return r18}function _read_file(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r5+4;HEAP32[r6>>2]=r4;if((r3|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r4=HEAP32[HEAP32[r1+8>>2]+8>>2];r8=FUNCTION_TABLE[HEAP32[r1+16>>2]](r1,r3,r6,1,r7);if((r8|0)<1){r9=r8;STACKTOP=r5;return r9}r9=FUNCTION_TABLE[HEAP32[HEAP32[r4>>2]>>2]](r4,r2,HEAP32[r7>>2],HEAP32[r6>>2]);STACKTOP=r5;return r9}function _write_file(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5,r7=r6>>2;r8=r5+4;HEAP32[r7]=r4;r9=r1+8|0;r10=HEAP32[HEAP32[r9>>2]+8>>2];if((r3|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r11=FUNCTION_TABLE[HEAP32[r1+16>>2]](r1,r3,r6,2,r8);if((r11|0)<1){r12=r11;STACKTOP=r5;return r12}L1828:do{if((HEAP32[1312285]|0)==0){r13=FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+4>>2]](r10,r2,HEAP32[r8>>2],HEAP32[r7])}else{r11=HEAP32[r7];r6=r10;r14=HEAP32[HEAP32[r10>>2]+4>>2];if((r11|0)==0){r13=0;break}r15=HEAP32[r8>>2];r16=r11;r11=r2;r17=0;while(1){r18=FUNCTION_TABLE[r14](r6,r11,r15,r16);if((r18|0)<1){break}r19=r18+r17|0;if((r16|0)==(r18|0)){r13=r19;break L1828}else{r15=r18+r15|0;r16=r16-r18|0;r11=r11+r18|0;r17=r19}}r13=(r17|0)==0?r18:r17}}while(0);r18=(r13|0)>(r4|0)?r4:r13;do{if((r18|0)>0){r13=r18+r3|0;r4=r1+20|0;r2=HEAP32[r4>>2];if((r13|0)<=(r2|0)){r20=r2;break}HEAP32[r4>>2]=r13;r20=r13}else{r20=HEAP32[r1+20>>2]}}while(0);r3=HEAP32[r9>>2];r9=Math.imul(HEAP32[r3+28>>2],HEAP32[r3+24>>2]);r13=r9-1|0;r4=Math.floor(((r13+r20|0)>>>0)/(r9>>>0));r20=Math.floor(((HEAP32[r1+24>>2]+r13|0)>>>0)/(r9>>>0))-r4|0;r4=(r20|0)<0?0:r20;r20=r1+28|0;r1=r4-HEAP32[r20>>2]|0;do{if((r1|0)>0){if((_getfreeMinClusters(r3,r1)|0)==1){break}else{r12=r18}STACKTOP=r5;return r12}}while(0);r9=r3+124|0;HEAP32[r9>>2]=HEAP32[r9>>2]+r1|0;HEAP32[r20>>2]=r4;r12=r18;STACKTOP=r5;return r12}function _func1(r1){var r2,r3,r4,r5,r6,r7;r2=HEAP32[r1+32>>2];if((r2|0)==0){r3=r1;L1850:do{if((HEAP32[r1>>2]|0)==5265052){r4=r3}else{r5=r3;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L1850}else{r5=r6}}}}while(0);r7=(HEAP32[r4+16>>2]|0)!=156&1}else{r7=r2}return HEAP32[r1+8>>2]^r7}function _func2(r1){var r2,r3,r4,r5,r6;r2=HEAP32[r1+32>>2];if((r2|0)!=0){r3=r2;return r3}r2=r1;L1859:do{if((HEAP32[r1>>2]|0)==5265052){r4=r2}else{r5=r2;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L1859}else{r5=r6}}}}while(0);r3=(HEAP32[r4+16>>2]|0)!=156&1;return r3}function _comp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;if((HEAP32[r1+8>>2]|0)!=(HEAP32[r2+8>>2]|0)){r3=1;r4=r3&1;return r4}r5=HEAP32[r1+32>>2];if((r5|0)==0){r6=r1;L1870:do{if((HEAP32[r1>>2]|0)==5265052){r7=r6}else{r8=r6;while(1){r9=HEAP32[r8+8>>2];if((HEAP32[r9>>2]|0)==5265052){r7=r9;break L1870}else{r8=r9}}}}while(0);r10=(HEAP32[r7+16>>2]|0)!=156&1}else{r10=r5}r5=HEAP32[r2+32>>2];if((r5|0)==0){r7=r2;L1877:do{if((HEAP32[r2>>2]|0)==5265052){r11=r7}else{r6=r7;while(1){r1=HEAP32[r6+8>>2];if((HEAP32[r1>>2]|0)==5265052){r11=r1;break L1877}else{r6=r1}}}}while(0);r12=(HEAP32[r11+16>>2]|0)!=156&1}else{r12=r5}r3=(r10|0)!=(r12|0);r4=r3&1;return r4}function _unix_normalize(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r4;r6=r4+16;r7=r5|0;r8=HEAP8[r3|0];do{if(r8<<24>>24>32){HEAP8[r7]=r8;r9=r5+1|0;r10=HEAP8[r3+1|0];if(r10<<24>>24<=32){r11=r9;break}HEAP8[r9]=r10;r10=r5+2|0;r9=HEAP8[r3+2|0];if(r9<<24>>24<=32){r11=r10;break}HEAP8[r10]=r9;r9=r5+3|0;r10=HEAP8[r3+3|0];if(r10<<24>>24<=32){r11=r9;break}HEAP8[r9]=r10;r10=r5+4|0;r9=HEAP8[r3+4|0];if(r9<<24>>24<=32){r11=r10;break}HEAP8[r10]=r9;r9=r5+5|0;r10=HEAP8[r3+5|0];if(r10<<24>>24<=32){r11=r9;break}HEAP8[r9]=r10;r10=r5+6|0;r9=HEAP8[r3+6|0];if(r9<<24>>24<=32){r11=r10;break}HEAP8[r10]=r9;r9=r5+7|0;r10=HEAP8[r3+7|0];if(r10<<24>>24<=32){r11=r9;break}HEAP8[r9]=r10;r11=r5+8|0}else{r11=r7}}while(0);r7=HEAP8[r3+8|0];do{if(r7<<24>>24>32){HEAP8[r11]=46;HEAP8[r11+1|0]=r7;r8=r11+2|0;r10=HEAP8[r3+9|0];if(r10<<24>>24<=32){r12=r8;break}HEAP8[r8]=r10;r10=r11+3|0;r8=HEAP8[r3+10|0];if(r8<<24>>24<=32){r12=r10;break}HEAP8[r10]=r8;r12=r11+4|0}else{r12=r11}}while(0);HEAP8[r12]=0;r12=r1|0;r1=0;while(1){r11=HEAP8[r5+r1|0];if(r11<<24>>24==0){r13=r1;break}if(r11<<24>>24<32|r11<<24>>24==127){HEAP8[r6+r1|0]=HEAP8[HEAP32[r12>>2]+(r11&127)|0]}else{HEAP8[r6+r1|0]=r11}r11=r1+1|0;if(r11>>>0<13){r1=r11}else{r13=r11;break}}HEAP8[r6+r13|0]=0;r13=HEAP8[r6|0];do{if(r13<<24>>24==0){r14=r2}else{HEAP8[r2]=r13;r1=r2+1|0;r12=HEAP8[r6+1|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+2|0;r1=HEAP8[r6+2|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r1=r2+3|0;r12=HEAP8[r6+3|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+4|0;r1=HEAP8[r6+4|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r1=r2+5|0;r12=HEAP8[r6+5|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+6|0;r1=HEAP8[r6+6|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r1=r2+7|0;r12=HEAP8[r6+7|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+8|0;r1=HEAP8[r6+8|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r1=r2+9|0;r12=HEAP8[r6+9|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+10|0;r1=HEAP8[r6+10|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r1=r2+11|0;r12=HEAP8[r6+11|0];if(r12<<24>>24==0){r14=r1;break}HEAP8[r1]=r12;r12=r2+12|0;r1=HEAP8[r6+12|0];if(r1<<24>>24==0){r14=r12;break}HEAP8[r12]=r1;r14=r2+13|0}}while(0);HEAP8[r14]=0;STACKTOP=r4;return r2}function _get_file_data(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14;r6=STACKTOP;STACKTOP=STACKTOP+4|0;r7=r6;if((r2|0)!=0){r8=r1+44|0;r9=r8+8|0;r10=HEAPU8[r9+25|0];r11=r10>>>1;r12=HEAPU8[r8+32|0];r8=r10<<3&8|r12>>>5;r10=HEAPU8[r9+23|0];r13=HEAPU8[r9+22|0];r9=((((((((r11&3|0)==0&r8>>>0<3)<<31>>31)+HEAP32[(r8-1<<2)+5245088>>2]+(r11*365&-1)+(r12&31)+((r11+8|0)>>>2)+3650)*24&-1)+(r10>>>3))*60&-1)+(r10<<3&56|r13>>>5))*60&-1;_tzset();r10=(r13<<1&62)+HEAP32[_timezone>>2]+r9|0;HEAP32[r7>>2]=r10;r9=_localtime(r7);if((r9|0)==0){r14=r10}else{r14=((HEAP32[r9+32>>2]|0)!=0?-3600:0)+r10|0}HEAP32[r2>>2]=r14}if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r1+20>>2]}if((r4|0)!=0){HEAP32[r4>>2]=HEAP8[r1+63|0]&16}if((r5|0)==0){STACKTOP=r6;return 0}HEAP32[r5>>2]=HEAP32[r1+32>>2];STACKTOP=r6;return 0}function __loopDetect(r1,r2,r3,r4){var r5,r6,r7;r5=STACKTOP;r6=HEAP32[r1>>2];do{if((r6|0)!=0&r6>>>0<r2>>>0){if((HEAP32[r3>>2]|0)!=(r4|0)){break}_fprintf(HEAP32[_stderr>>2],5249620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r6,HEAP32[tempInt+4>>2]=r2,HEAP32[tempInt+8>>2]=r4,tempInt));r7=-1;STACKTOP=r5;return r7}}while(0);if((r6<<1|1)>>>0>r2>>>0){r7=0;STACKTOP=r5;return r7}HEAP32[r1>>2]=r2;HEAP32[r3>>2]=r4;r7=0;STACKTOP=r5;return r7}function _dos_name(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13;r3=r4>>2;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r7=r6;r8=r6+4;HEAP32[r3]=0;if(HEAP8[r2]<<24>>24==0){r9=r2}else{r9=HEAP8[r2+1|0]<<24>>24==58?r2+2|0:r2}r2=_strrchr(r9,47);r10=(r2|0)==0?r9:r2+1|0;r2=_strrchr(r10,92);r9=(r2|0)==0?r10:r2+1|0;r2=r5|0;_memset(r2,32,11);r10=_strspn(r9,5255972);if((r10|0)==0){r11=r9}else{HEAP32[r3]=3;r11=r9+r10|0}r10=_strrchr(r11,46);_TranslateToDos(r1,r11,r2,8,r10,r7,r4);if((r10|0)!=0){_TranslateToDos(r1,r10+1|0,r5+8|0,3,0,r8,r4)}r4=HEAP32[r3];if((r4&2|0)==0){r12=r4}else{_autorename(r2,126,32,HEAP32[1310878],8,0);r12=HEAP32[r3]}if((r12|0)!=0){STACKTOP=r6;return}if((HEAP32[r7>>2]|0)==2){HEAP32[r3]=8;r13=24}else{r13=16}if((HEAP32[r8>>2]|0)!=2){STACKTOP=r6;return}HEAP32[r3]=r13;STACKTOP=r6;return}function _TranslateToDos(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r8=r7>>2;r9=r6>>2;r6=0;r10=STACKTOP;STACKTOP=STACKTOP+12|0;r11=r10;r12=r11|0;L1973:do{if((r4|0)==0){r13=0;r14=r2}else{if((r5|0)==0){r15=0;r16=r2;while(1){HEAP8[r11+r15|0]=HEAP8[r16];r17=r15+1|0;if((r17|0)==(r4|0)){break}else{r15=r17;r16=r16+1|0}}r13=r4;r14=r2+r4|0;break}else{r16=0;r15=r2;while(1){if(r15>>>0>=r5>>>0){r13=r16;r14=r15;break L1973}HEAP8[r11+r16|0]=HEAP8[r15];r17=r15+1|0;r18=r16+1|0;if(r18>>>0<r4>>>0){r16=r18;r15=r17}else{r13=r18;r14=r17;break L1973}}}}}while(0);do{if((r7|0)!=0){r2=(r5|0)!=0;if(!(r2&r14>>>0<r5>>>0)){if(r2){break}if(!(HEAP8[r14]<<24>>24!=0&(r13|0)==(r4|0))){break}}HEAP32[r8]=HEAP32[r8]|3}}while(0);HEAP8[r11+r13|0]=0;HEAP8[r11+r4|0]=0;HEAP32[r9]=0;r4=r12;r13=r12;while(1){r14=HEAP8[r13];if(r14<<24>>24==32|r14<<24>>24==46){HEAP32[r8]=HEAP32[r8]|3;r19=r4}else if(r14<<24>>24==0){break}else{do{if((_iscntrl(r14<<24>>24)|0)==0){r5=(_islower(HEAP8[r13]<<24>>24)|0)==0;r7=HEAP8[r13]<<24>>24;if(!r5){HEAP8[r4]=_toupper(r7)&255;if((HEAP32[r9]|0)!=1|(HEAP32[1311260]|0)!=0){HEAP32[r9]=2;break}else{HEAP32[r8]=HEAP32[r8]|1;break}}r5=(_isupper(r7)|0)==0;HEAP8[r4]=HEAP8[r13];if(r5){break}if((HEAP32[r9]|0)!=2|(HEAP32[1311260]|0)!=0){HEAP32[r9]=1;break}else{HEAP32[r8]=HEAP32[r8]|1;break}}else{HEAP32[r8]=HEAP32[r8]|3;HEAP8[r4]=95}}while(0);r19=r4+1|0}r4=r19;r13=r13+1|0}r13=r4-r11|0;if((r4|0)==(r12|0)){STACKTOP=r10;return}else{r20=0}while(1){r12=HEAP8[r11+r20|0];if(r12<<24>>24==0){r6=1490;break}do{if(r12<<24>>24<32|r12<<24>>24==127){r4=HEAP8[(r12&127)+r1+4|0];r19=r3+r20|0;HEAP8[r19]=r4;if(r4<<24>>24!=0){break}HEAP8[r19]=95;HEAP32[r8]=1}else{HEAP8[r3+r20|0]=r12}}while(0);r12=r20+1|0;if(r12>>>0<r13>>>0){r20=r12}else{r6=1492;break}}if(r6==1492){STACKTOP=r10;return}else if(r6==1490){STACKTOP=r10;return}}function _pre_allocate_file(r1,r2){var r3,r4,r5,r6,r7,r8;if((r2|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r3=HEAP32[r1+20>>2];if(r3>>>0>=r2>>>0){r4=0;return r4}r5=r1+24|0;if(HEAP32[r5>>2]>>>0>=r2>>>0){r4=0;return r4}HEAP32[r5>>2]=r2;r5=HEAP32[r1+8>>2];r6=Math.imul(HEAP32[r5+28>>2],HEAP32[r5+24>>2]);r7=r6-1|0;r8=Math.floor(((r7+r3|0)>>>0)/(r6>>>0));r3=Math.floor(((r7+r2|0)>>>0)/(r6>>>0))-r8|0;r8=(r3|0)<0?0:r3;r3=r1+28|0;r1=r8-HEAP32[r3>>2]|0;do{if((r1|0)>0){if((_getfreeMinClusters(r5,r1)|0)==1){break}else{r4=-1}return r4}}while(0);r6=r5+124|0;HEAP32[r6>>2]=HEAP32[r6>>2]+r1|0;HEAP32[r3>>2]=r8;r4=0;return r4}function _unix_name(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+32|0;r8=r7;r9=r7+12;r10=r7+16;r11=r8|0;_strncpy(r11,r2,8);HEAP8[r8+8|0]=0;r2=_strchr(r11,32);if((r2|0)!=0){HEAP8[r2]=0}r2=((r4&24)<<24>>24==0&(HEAP32[1311261]|0)!=0?r4|24:r4)<<24>>24;do{if((r2&8|0)!=0){r4=HEAP8[r11];if(r4<<24>>24==0){break}HEAP8[r11]=_tolower(r4<<24>>24)&255;r4=r8+1|0;r12=HEAP8[r4];if(r12<<24>>24==0){break}HEAP8[r4]=_tolower(r12<<24>>24)&255;r12=r8+2|0;r4=HEAP8[r12];if(r4<<24>>24==0){break}HEAP8[r12]=_tolower(r4<<24>>24)&255;r4=r8+3|0;r12=HEAP8[r4];if(r12<<24>>24==0){break}HEAP8[r4]=_tolower(r12<<24>>24)&255;r12=r8+4|0;r4=HEAP8[r12];if(r4<<24>>24==0){break}HEAP8[r12]=_tolower(r4<<24>>24)&255;r4=r8+5|0;r12=HEAP8[r4];if(r12<<24>>24==0){break}HEAP8[r4]=_tolower(r12<<24>>24)&255;r12=r8+6|0;r4=HEAP8[r12];if(r4<<24>>24==0){break}HEAP8[r12]=_tolower(r4<<24>>24)&255;r4=r8+7|0;r12=HEAP8[r4];if(r12<<24>>24==0){break}HEAP8[r4]=_tolower(r12<<24>>24)&255}}while(0);r8=r9|0;_strncpy(r8,r3,3);HEAP8[r9+3|0]=0;r3=_strchr(r8,32);if((r3|0)!=0){HEAP8[r3]=0}do{if((r2&16|0)==0){r6=1516}else{r3=HEAP8[r8];if(r3<<24>>24==0){_strcpy(r10|0,r11);break}r12=_tolower(r3<<24>>24)&255;HEAP8[r8]=r12;r3=r9+1|0;r4=HEAP8[r3];if(r4<<24>>24==0){r13=r12;r6=1517;break}HEAP8[r3]=_tolower(r4<<24>>24)&255;r4=r9+2|0;r3=HEAP8[r4];if(r3<<24>>24==0){r6=1516;break}HEAP8[r4]=_tolower(r3<<24>>24)&255;r6=1516;break}}while(0);do{if(r6==1516){r13=HEAP8[r8];r6=1517;break}}while(0);do{if(r6==1517){r9=r10|0;_strcpy(r9,r11);if(r13<<24>>24==0){break}r2=r10+_strlen(r9)|0;tempBigInt=46;HEAP8[r2]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r2+1|0]=tempBigInt&255;_strcat(r9,r8)}}while(0);r8=r1|0;r1=0;while(1){r13=HEAP8[r10+r1|0];if(r13<<24>>24==0){r14=r1;r6=1535;break}if(r13<<24>>24<32|r13<<24>>24==127){HEAP8[r5+r1|0]=HEAP8[HEAP32[r8>>2]+(r13&127)|0]}else{HEAP8[r5+r1|0]=r13}r13=r1+1|0;if(r13>>>0<12){r1=r13}else{r14=r13;r6=1536;break}}if(r6==1535){r1=r5+r14|0;HEAP8[r1]=0;STACKTOP=r7;return r5}else if(r6==1536){r1=r5+r14|0;HEAP8[r1]=0;STACKTOP=r7;return r5}}function _free_filter(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP8[r4]=26;if((HEAP32[r1+28>>2]|0)!=2){r5=0;STACKTOP=r3;return r5}r6=HEAP32[r1+8>>2];r7=r6;r8=HEAP32[HEAP32[r6>>2]+4>>2];r6=HEAP32[r1+16>>2];r1=1;r9=r4;r4=0;while(1){r10=FUNCTION_TABLE[r8](r7,r9,r6,r1);if((r10|0)<1){break}r11=r10+r4|0;if((r1|0)==(r10|0)){r5=r11;r2=1544;break}else{r6=r10+r6|0;r1=r1-r10|0;r9=r9+r10|0;r4=r11}}if(r2==1544){STACKTOP=r3;return r5}r5=(r4|0)==0?r10:r4;STACKTOP=r3;return r5}function _read_filter(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;if((r3|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r5=(r1+20|0)>>2;if((HEAP32[r5]|0)!=(r3|0)){_fwrite(5260264,11,1,HEAP32[_stderr>>2]);_exit(1)}r3=r1+28|0;if((HEAP32[r3>>2]|0)==2){_fwrite(5263096,30,1,HEAP32[_stderr>>2]);_exit(1)}HEAP32[r3>>2]=1;r3=HEAP32[r1+8>>2];r6=r1+16|0;r7=r6;r8=FUNCTION_TABLE[HEAP32[HEAP32[r3>>2]>>2]](r3,r2,HEAP32[r7>>2],r4);if((r8|0)<0){r9=r8;return r9}L2104:do{if((r8|0)>0){r4=r1+32|0;r3=0;r10=0;while(1){r11=HEAP8[r2+r10|0];if(r11<<24>>24==26){r12=r3;r13=r10;break L2104}else if(r11<<24>>24==13){r14=r3}else{HEAP8[r2+r3|0]=r11;HEAP32[r4>>2]=r11<<24>>24;r14=r3+1|0}r11=r10+1|0;if((r11|0)<(r8|0)){r3=r14;r10=r11}else{r12=r14;r13=r11;break L2104}}}else{r12=0;r13=0}}while(0);HEAP32[r6>>2]=HEAP32[r7>>2]+r13|0;HEAP32[r5]=HEAP32[r5]+r12|0;r9=r12;return r9}function _write_filter(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1028|0;r7=r6;if((r3|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r8=(r1+20|0)>>2;r9=HEAP32[r8];if((r9|0)==-1){r10=-1;STACKTOP=r6;return r10}if((r9|0)!=(r3|0)){_fwrite(5260264,11,1,HEAP32[_stderr>>2]);_exit(1)}r9=r1+28|0;if((HEAP32[r9>>2]|0)==1){_fwrite(5263096,30,1,HEAP32[_stderr>>2]);_exit(1)}HEAP32[r9>>2]=2;L2126:do{if((r4|0)==0){r11=0;r12=0}else{r9=0;r13=0;while(1){r14=HEAP8[r2+r9|0];r15=r13+1|0;r16=r7+r13|0;if(r14<<24>>24==10){HEAP8[r16]=13;HEAP8[r7+r15|0]=10;r17=r13+2|0}else{HEAP8[r16]=r14;r17=r15}r15=r9+1|0;if(r17>>>0<1024&r15>>>0<r4>>>0){r9=r15;r13=r17}else{r11=r15;r12=r17;break L2126}}}}while(0);HEAP32[r8]=r11+r3|0;r3=HEAP32[r1+8>>2];r17=r1+16|0;r1=r17;r4=r3;r2=HEAP32[HEAP32[r3>>2]+4>>2];do{if((r12|0)==0){r18=0}else{r3=HEAP32[r1>>2];r13=r12;r9=r7|0;r15=0;while(1){r19=FUNCTION_TABLE[r2](r4,r9,r3,r13);if((r19|0)<1){r5=1577;break}r14=r19+r15|0;if((r13|0)==(r19|0)){r20=r14;break}else{r3=r19+r3|0;r13=r13-r19|0;r9=r9+r19|0;r15=r14}}if(r5==1577){r20=(r15|0)==0?r19:r15}if((r20|0)<=0){r18=r20;break}HEAP32[r17>>2]=HEAP32[r1>>2]+r20|0;r18=r20}}while(0);if((r18|0)==(r12|0)){r10=r11;STACKTOP=r6;return r10}HEAP32[r8]=-1;r10=-1;STACKTOP=r6;return r10}function _floppyd_read(r1,r2,r3,r4){return _floppyd_io(r1,r2,r3,r4,70)}function _floppyd_write(r1,r2,r3,r4){return _floppyd_io(r1,r2,r3,r4,112)}function _floppyd_flush(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+20|0;r3=r2;r4=r2+4;r5=r4|0;HEAP8[r5]=0;HEAP8[r4+1|0]=0;HEAP8[r4+2|0]=0;HEAP8[r4+3|0]=1;HEAP8[r4+4|0]=3;HEAP8[r4+5|0]=0;HEAP8[r4+6|0]=0;HEAP8[r4+7|0]=0;HEAP8[r4+8|0]=1;HEAP8[r4+9|0]=0;r4=(r1+16|0)>>2;if((_write(HEAP32[r4],r5,10)|0)<10){r6=6;STACKTOP=r2;return r6}r5=r3|0;do{if((_read(HEAP32[r4],r5,4)|0)>=4){if((HEAPU8[r3+1|0]<<16|HEAPU8[r5]<<24|HEAPU8[r3+2|0]<<8|HEAPU8[r3+3|0]|0)!=8){break}_read(HEAP32[r4],r5,4);_read(HEAP32[r4],r5,4);STACKTOP=r2;return 0}}while(0);HEAP32[___errno_location()>>2]=5;r6=-1;STACKTOP=r2;return r6}function _floppyd_free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+20|0;r3=r2;r4=r2+4;r5=(r1+16|0)>>2;r1=HEAP32[r5];if((r1|0)<=2){r6=0;STACKTOP=r2;return r6}r7=r4|0;HEAP8[r7]=0;HEAP8[r4+1|0]=0;HEAP8[r4+2|0]=0;HEAP8[r4+3|0]=1;HEAP8[r4+4|0]=4;if((_write(r1,r7,5)|0)<5){r6=6;STACKTOP=r2;return r6}_shutdown(HEAP32[r5],1);r7=r3|0;do{if((_read(HEAP32[r5],r7,4)|0)>=4){r1=r3+1|0;r4=r3+2|0;r8=r3+3|0;if((HEAPU8[r1]<<16|HEAPU8[r7]<<24|HEAPU8[r4]<<8|HEAPU8[r8]|0)!=8){break}if((_read(HEAP32[r5],r7,4)|0)<4){r9=-1}else{r9=HEAPU8[r1]<<16|HEAPU8[r7]<<24|HEAPU8[r4]<<8|HEAPU8[r8]}if((_read(HEAP32[r5],r7,4)|0)<4){r10=-1}else{r10=HEAPU8[r1]<<16|HEAPU8[r7]<<24|HEAPU8[r4]<<8|HEAPU8[r8]}HEAP32[___errno_location()>>2]=r10;_close(HEAP32[r5]);r6=r9;STACKTOP=r2;return r6}}while(0);HEAP32[___errno_location()>>2]=5;r6=-1;STACKTOP=r2;return r6}function _FloppydOpen(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+72|0;r8=r7;r9=r7+4;r10=r7+20;r11=r7+44;r12=r7+64;r13=r7+68,r14=r13>>2;if((r1|0)==0){r15=0;STACKTOP=r7;return r15}if((HEAP32[r1+40>>2]&64|0)==0){r15=0;STACKTOP=r7;return r15}r1=_calloc(1,44),r16=r1>>2;if((r1|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r15=0;STACKTOP=r7;return r15}HEAP32[r16]=5264980;HEAP32[r16+2]=0;HEAP32[r16+5]=0;HEAP32[r16+6]=0;HEAP32[r16+1]=1;HEAP32[r16+3]=0;r17=(r1+40|0)>>2;r18=_strdup(r2);r2=r18;while(1){HEAP32[r14]=r2;r19=HEAP8[r2];if(r19<<24>>24==0){break}else if(r19<<24>>24==47){r6=1619;break}r2=r2+1|0}if(r6==1619){HEAP32[r14]=r2+1|0}HEAP8[r2]=0;r2=HEAP32[r14];r19=HEAP8[r2];if((r19-48&255)<10){r20=_strtoul(r2,r13,0);r21=HEAP32[r14];r22=r21;r23=HEAP8[r21];r24=r20&65535}else{r22=r2;r23=r19;r24=5703}if(r23<<24>>24==47){r23=r22+1|0;HEAP32[r14]=r23;r25=r23}else{r25=r22}HEAP32[r17]=0;if((HEAP8[r25]-48&255)<10){HEAP32[r17]=_strtoul(r25,r13,0)}r13=_strdup(r18);r25=r18;while(1){HEAP32[r14]=r25;r22=HEAP8[r25];if(r22<<24>>24==0){break}else if(r22<<24>>24==58){r6=1629;break}r25=r25+1|0}if(r6==1629){HEAP32[r14]=r25+1|0}HEAP8[r25]=0;r25=_atoi(HEAP32[r14])+r24|0;r24=r25&65535;do{if(HEAP8[r18]<<24>>24==0){r6=1632}else{if((_strcmp(r18,5262232)|0)==0){r6=1632;break}else{r26=r18;break}}}while(0);if(r6==1632){_free(r18);r26=_strdup(5261796)}r18=(r1+32|0)>>2;HEAP32[r18]=11;r14=(r1+36|0)>>2;HEAP32[r14]=0;r22=r12;r23=r11|0;r19=r11+4|0;r2=r11+8|0;r20=r11;r11=r9|0;r21=r10>>2;r27=r10+16|0;r28=r10|0;r10=r9+1|0;r29=r9+2|0;r30=r9+3|0;r31=r9+4|0;r32=r9+5|0;r33=r9+6|0;r34=r9+7|0;r35=r8|0;r36=r8+1|0;r37=r8+2|0;r38=r8+3|0;while(1){r8=_inet_addr(r26);do{if((r8|0)==-1){if((_strcmp(r26,5262916)|0)==0){r39=-1;break}r40=_gethostbyname(r26);if((r40|0)==0){r41=-1}else{r42=HEAP32[HEAP32[r40+16>>2]>>2];r41=HEAPU8[r42]|HEAPU8[r42+1|0]<<8|HEAPU8[r42+2|0]<<16|HEAPU8[r42+3|0]<<24|0}_endhostent();r39=r41}else{r39=r8}}while(0);r43=_socket(1,200,0);if((r43|0)<0){r6=1641;break}HEAP32[r23>>2]=1;HEAP16[r19>>1]=_htons(r24);HEAP32[r2>>2]=r39;if((_connect(r43,r20,20)|0)<0){r6=1641;break}HEAP32[r12>>2]=1;_setsockopt(r43,50,90,r22,4);HEAP32[r21]=HEAP32[1312286];HEAP32[r21+1]=HEAP32[1312287];HEAP32[r21+2]=HEAP32[1312288];HEAP32[r21+3]=HEAP32[1312289];HEAP32[r21+4]=HEAP32[1312290];HEAP32[r21+5]=HEAP32[1312291];HEAP32[r27>>2]=r13;r8=_strlen(r13);r42=_malloc(r8+104|0);if((r42|0)==0){r6=1643;break}r40=_safePopenOut(r28,r42+4|0,r8+100|0);do{if((r40|0)<1){r44=2}else{HEAP8[r11]=0;HEAP8[r10]=0;HEAP8[r29]=0;HEAP8[r30]=4;r8=HEAP32[r18];HEAP8[r31]=r8>>>24&255;HEAP8[r32]=r8>>>16&255;HEAP8[r33]=r8>>>8&255;HEAP8[r34]=r8&255;if((_write(r43,r11,8)|0)<8){r44=6;break}if((_read(r43,r35,4)|0)<4){r44=3;break}r8=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38];if((r8|0)<4){r44=3;break}if((_read(r43,r35,4)|0)<4){r44=-1;break}r45=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38];if((r45|0)!=0){r44=r45;break}do{if((r8|0)>7){if((_read(r43,r35,4)|0)<4){r46=-1}else{r46=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]}HEAP32[r18]=r46;if((r8|0)<=11){break}if((_read(r43,r35,4)|0)<4){r47=-1}else{r47=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]}HEAP32[r14]=r47}}while(0);HEAP8[r42]=r40>>>24&255;HEAP8[r42+1|0]=r40>>>16&255;HEAP8[r42+2|0]=r40>>>8&255;HEAP8[r42+3|0]=r40&255;r8=r40+4|0;if((_write(r43,r42,r8)|0)<(r8|0)){r44=6;break}if((_read(r43,r35,4)|0)<4){r44=1;break}if((HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]|0)!=4){r44=1;break}if((_read(r43,r35,4)|0)<4){r44=-1;break}r44=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]}}while(0);if(!((HEAP32[r18]|0)!=10&(r44|0)==3)){r6=1664;break}HEAP32[r18]=10}do{if(r6==1641){r18=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r4,200,5250960,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r26,HEAP32[tempInt+4>>2]=r25<<16>>16,HEAP32[tempInt+8>>2]=r18,tempInt));r6=1666;break}else if(r6==1643){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else if(r6==1664){if((r44|0)!=0){_fprintf(HEAP32[_stderr>>2],5250300,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[(r44<<2)+5265160>>2],tempInt));r6=1666;break}_free(r26);_free(r13);r18=(r1+16|0)>>2;HEAP32[r18]=r43;if((r43|0)==-1){break}L2258:do{if((HEAP32[r14]&1|0)!=0){HEAP8[r11]=0;HEAP8[r10]=0;HEAP8[r29]=0;HEAP8[r30]=1;HEAP8[r31]=(r3&3|0)==0?6:7;HEAP8[r32]=0;HEAP8[r33]=0;HEAP8[r34]=0;HEAP8[r9+8|0]=4;r47=HEAP32[r17];HEAP8[r9+9|0]=r47>>>24&255;HEAP8[r9+10|0]=r47>>>16&255;HEAP8[r9+11|0]=r47>>>8&255;HEAP8[r9+12|0]=r47&255;if((_write(r43,r11,13)|0)<13){break}do{if((_read(HEAP32[r18],r35,4)|0)<4){r6=1673}else{if((HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]|0)!=8){r6=1673;break}if((_read(HEAP32[r18],r35,4)|0)<4){r48=-1}else{r48=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]}if((_read(HEAP32[r18],r35,4)|0)<4){r49=-1}else{r49=HEAPU8[r36]<<16|HEAPU8[r35]<<24|HEAPU8[r37]<<8|HEAPU8[r38]}HEAP32[___errno_location()>>2]=r49;if((r48|0)<0){break}else{break L2258}}}while(0);if(r6==1673){HEAP32[___errno_location()>>2]=5}r47=_strerror(HEAP32[___errno_location()>>2]);_sprintf(r4,5251740,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r47,tempInt));_close(HEAP32[r18]);_free(r1);r15=0;STACKTOP=r7;return r15}}while(0);if((r5|0)!=0){HEAP32[r5>>2]=2147483647}r15=r1;STACKTOP=r7;return r15}}while(0);if(r6==1666){HEAP32[r16+4]=-1}_free(r1);r15=0;STACKTOP=r7;return r15}function _floppyd_geom(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=r2>>2;r6=r2+44|0;HEAP32[r6>>2]=2;r7=r2+48|0;HEAP32[r7>>2]=128;if((r4|0)==240|(r4|0)>255){r2=HEAPU8[r5+27|0]<<8|HEAPU8[r5+26|0];HEAP32[r3+5]=r2;r8=HEAPU8[r5+25|0]<<8|HEAPU8[r5+24|0];HEAP32[r3+6]=r8;r9=HEAPU8[r5+20|0]<<8|HEAPU8[r5+19|0];r10=r9<<16>>16==0?HEAPU8[r5+33|0]<<8|HEAPU8[r5+32|0]|(HEAPU8[r5+35|0]<<8|HEAPU8[r5+34|0])<<16:r9&65535;r9=Math.imul(r2,r8);r5=Math.floor(((r9-1+r10|0)>>>0)/(r9>>>0));HEAP32[r3+4]=r5;r11=r8;r12=r5;r13=r2;r14=r11<<9;r15=Math.imul(r14,r12);r16=Math.imul(r15,r13);r17=r1+28|0;r18=r16;HEAP32[r17>>2]=r18;return 0}if((r4|0)<=247){_fwrite(5260336,19,1,HEAP32[_stderr>>2]);_exit(1)}r2=r4&3;r4=HEAP32[(r2*28&-1)+5244704>>2];HEAP32[r3+5]=r4;r5=HEAP32[(r2*28&-1)+5244696>>2];HEAP32[r3+4]=r5;r8=HEAP32[(r2*28&-1)+5244700>>2];HEAP32[r3+6]=r8;HEAP32[r6>>2]=128;HEAP32[r7>>2]=-2;r11=r8;r12=r5;r13=r4;r14=r11<<9;r15=Math.imul(r14,r12);r16=Math.imul(r15,r13);r17=r1+28|0;r18=r16;HEAP32[r17>>2]=r18;return 0}function _floppyd_data(r1,r2,r3,r4,r5){if((r2|0)!=0){HEAP32[r2>>2]=0}if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r1+28>>2]}if((r4|0)!=0){HEAP32[r4>>2]=0}if((r5|0)==0){return 0}HEAP32[r5>>2]=0;return 0}function _floppyd_writer(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=STACKTOP;STACKTOP=STACKTOP+20|0;r5=r4;r6=r4+4;r7=r6|0;HEAP8[r7]=0;HEAP8[r6+1|0]=0;HEAP8[r6+2|0]=0;HEAP8[r6+3|0]=1;HEAP8[r6+4|0]=1;HEAP8[r6+5|0]=r3>>>24&255;HEAP8[r6+6|0]=r3>>>16&255;HEAP8[r6+7|0]=r3>>>8&255;HEAP8[r6+8|0]=r3&255;if((_write(r1,r7,9)|0)<9){r8=6;STACKTOP=r4;return r8}if((_write(r1,r2,r3)|0)<(r3|0)){r8=6;STACKTOP=r4;return r8}r3=r5|0;do{if((_read(r1,r3,4)|0)>=4){r2=r5+1|0;r7=r5+2|0;r6=r5+3|0;if((HEAPU8[r2]<<16|HEAPU8[r3]<<24|HEAPU8[r7]<<8|HEAPU8[r6]|0)!=8){break}if((_read(r1,r3,4)|0)<4){r9=-1}else{r9=HEAPU8[r2]<<16|HEAPU8[r3]<<24|HEAPU8[r7]<<8|HEAPU8[r6]}if((_read(r1,r3,4)|0)<4){r10=-1}else{r10=HEAPU8[r2]<<16|HEAPU8[r3]<<24|HEAPU8[r7]<<8|HEAPU8[r6]}HEAP32[___errno_location()>>2]=r10;if(!((HEAP32[___errno_location()>>2]|0)!=0&(r9|0)==0)){r8=r9;STACKTOP=r4;return r8}if((HEAP32[___errno_location()>>2]|0)!=9){r8=-1;STACKTOP=r4;return r8}HEAP32[___errno_location()>>2]=30;r8=-1;STACKTOP=r4;return r8}}while(0);HEAP32[___errno_location()>>2]=5;r8=-1;STACKTOP=r4;return r8}function _floppyd_reader(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+20|0;r6=r5;r7=r5+4;r8=r7|0;HEAP8[r8]=0;HEAP8[r7+1|0]=0;HEAP8[r7+2|0]=0;HEAP8[r7+3|0]=1;r9=r7+4|0;tempBigInt=0;HEAP8[r9]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+3|0]=tempBigInt&255;HEAP8[r7+8|0]=4;HEAP8[r7+9|0]=r3>>>24&255;HEAP8[r7+10|0]=r3>>>16&255;HEAP8[r7+11|0]=r3>>>8&255;HEAP8[r7+12|0]=r3&255;if((_write(r1,r8,13)|0)<13){r10=6;STACKTOP=r5;return r10}r8=r6|0;do{if((_read(r1,r8,4)|0)>=4){r3=r6+1|0;r7=r6+2|0;r9=r6+3|0;if((HEAPU8[r3]<<16|HEAPU8[r8]<<24|HEAPU8[r7]<<8|HEAPU8[r9]|0)!=8){break}if((_read(r1,r8,4)|0)<4){r11=-1}else{r11=HEAPU8[r3]<<16|HEAPU8[r8]<<24|HEAPU8[r7]<<8|HEAPU8[r9]}if((_read(r1,r8,4)|0)<4){r12=-1}else{r12=HEAPU8[r3]<<16|HEAPU8[r8]<<24|HEAPU8[r7]<<8|HEAPU8[r9]}if((r11|0)==-1){HEAP32[___errno_location()>>2]=r12;r10=-1;STACKTOP=r5;return r10}if((_read(r1,r8,4)|0)<4){r13=-1}else{r13=HEAPU8[r3]<<16|HEAPU8[r8]<<24|HEAPU8[r7]<<8|HEAPU8[r9]}if((r13|0)==(r11|0)){r14=0}else{HEAP32[___errno_location()>>2]=5;r10=-1;STACKTOP=r5;return r10}while(1){if(r14>>>0>=r11>>>0){r10=r11;r4=1748;break}r9=_read(r1,r2+r14|0,r11-r14|0);if((r9|0)==0){break}else{r14=r9+r14|0}}if(r4==1748){STACKTOP=r5;return r10}HEAP32[___errno_location()>>2]=5;r10=-1;STACKTOP=r5;return r10}}while(0);HEAP32[___errno_location()>>2]=5;r10=-1;STACKTOP=r5;return r10}function _alloc_ht(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=r2<<2;r5=0;while(1){if((r5|0)==29){r3=1754;break}r6=HEAP32[(r5<<2)+5243392>>2];if((r6|0)>(r4|0)){r7=r5;r8=r6;r3=1758;break}else{r5=r5+1|0}}L2367:do{if(r3==1754){r5=r2<<1;r4=0;while(1){if((r4|0)==29){r9=0;r3=1759;break L2367}r6=HEAP32[(r4<<2)+5243392>>2];if((r6|0)>(r5|0)){r7=r4;r8=r6;r3=1758;break L2367}else{r4=r4+1|0}}}}while(0);do{if(r3==1758){if((r7|0)==29){r9=0;r3=1759;break}else{r10=r8;break}}}while(0);L2374:do{if(r3==1759){while(1){r3=0;if((r9|0)==29){r11=-1;break}r8=HEAP32[(r9<<2)+5243392>>2];if((r8|0)>(r2|0)){r10=r8;break L2374}else{r9=r9+1|0;r3=1759}}return r11}}while(0);r3=r1+12|0;r9=HEAP32[r3>>2];r2=(r10|0)<(r9|0)?r9:r10;HEAP32[r1+24>>2]=((r2<<2|0)/5&-1)-2|0;HEAP32[r3>>2]=r2;HEAP32[r1+16>>2]=0;HEAP32[r1+20>>2]=0;r3=_calloc(r2,4);r10=r3;r9=r1+28|0;HEAP32[r9>>2]=r10;if((r3|0)==0){r11=-1;return r11}if((r2|0)>0){r12=0;r13=r10}else{r11=0;return r11}while(1){HEAP32[r13+(r12<<2)>>2]=5242884;r10=r12+1|0;if((r10|0)>=(r2|0)){r11=0;break}r12=r10;r13=HEAP32[r9>>2]}return r11}function _floppyd_io(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+44|0;r8=r7;r9=r7+8;r10=r7+12;r11=HEAP32[r1+20>>2]+r3|0;r3=(r1+24|0)>>2;L2390:do{if((r11|0)==(HEAP32[r3]|0)){r12=r1+16|0}else{r13=(HEAP32[r1+36>>2]&2|0)==0;r14=r1+16|0;r15=HEAP32[r14>>2];r16=r10|0;HEAP8[r16]=0;HEAP8[r10+1|0]=0;HEAP8[r10+2|0]=0;HEAP8[r10+3|0]=1;r17=r10+4|0;if(!r13){HEAP8[r17]=8;HEAP8[r10+5|0]=0;HEAP8[r10+6|0]=0;HEAP8[r10+7|0]=0;HEAP8[r10+8|0]=12;r13=r10+9|0;tempBigInt=0;HEAP8[r13]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+3|0]=tempBigInt&255;HEAP8[r10+13|0]=r11>>>24&255;HEAP8[r10+14|0]=r11>>>16&255;HEAP8[r10+15|0]=r11>>>8&255;HEAP8[r10+16|0]=r11&255;r13=r10+17|0;tempBigInt=0;HEAP8[r13]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+3|0]=tempBigInt&255;if((_write(r15,r16,21)|0)<21){r12=r14;break}r13=r9|0;do{if((_read(r15,r13,4)|0)<4){r6=1776}else{r18=r9+1|0;r19=r9+2|0;r20=r9+3|0;if((HEAPU8[r18]<<16|HEAPU8[r13]<<24|HEAPU8[r19]<<8|HEAPU8[r20]|0)!=12){r6=1776;break}r21=r8|0;if((_read(r15,r21,8)|0)<8){r22=-1}else{r22=((((((HEAPU8[r21]<<8|HEAPU8[r8+1|0])<<8|HEAPU8[r8+2|0])<<8|HEAPU8[r8+3|0])<<8|HEAPU8[r8+4|0])<<8|HEAPU8[r8+5|0])<<8|HEAPU8[r8+6|0])<<8|HEAPU8[r8+7|0]}if((_read(r15,r13,4)|0)<4){r23=-1}else{r23=HEAPU8[r18]<<16|HEAPU8[r13]<<24|HEAPU8[r19]<<8|HEAPU8[r20]}HEAP32[___errno_location()>>2]=r23;if((r22|0)<0){break}else{r12=r14;break L2390}}}while(0);if(r6==1776){HEAP32[___errno_location()>>2]=5}_perror(5260860);HEAP32[r3]=-1;r24=-1;STACKTOP=r7;return r24}HEAP8[r17]=2;HEAP8[r10+5|0]=0;HEAP8[r10+6|0]=0;HEAP8[r10+7|0]=0;HEAP8[r10+8|0]=8;if((r11|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}HEAP8[r10+9|0]=r11>>>24&255;HEAP8[r10+10|0]=r11>>>16&255;HEAP8[r10+11|0]=r11>>>8&255;HEAP8[r10+12|0]=r11&255;r13=r10+13|0;tempBigInt=0;HEAP8[r13]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r13+3|0]=tempBigInt&255;if((_write(r15,r16,17)|0)<17){r12=r14;break}r13=r9|0;do{if((_read(r15,r13,4)|0)<4){r6=1788}else{r20=r9+1|0;r19=r9+2|0;r18=r9+3|0;if((HEAPU8[r20]<<16|HEAPU8[r13]<<24|HEAPU8[r19]<<8|HEAPU8[r18]|0)!=8){r6=1788;break}if((_read(r15,r13,4)|0)<4){r25=-1}else{r25=HEAPU8[r20]<<16|HEAPU8[r13]<<24|HEAPU8[r19]<<8|HEAPU8[r18]}if((_read(r15,r13,4)|0)<4){r26=-1}else{r26=HEAPU8[r20]<<16|HEAPU8[r13]<<24|HEAPU8[r19]<<8|HEAPU8[r18]}HEAP32[___errno_location()>>2]=r26;if((r25|0)<0){break}else{r12=r14;break L2390}}}while(0);if(r6==1788){HEAP32[___errno_location()>>2]=5}_perror(5260452);HEAP32[r3]=-1;r24=-1;STACKTOP=r7;return r24}}while(0);r6=FUNCTION_TABLE[r5](HEAP32[r12>>2],r2,r4);if((r6|0)==-1){_perror(5260252);HEAP32[r3]=-1;r24=-1;STACKTOP=r7;return r24}else{HEAP32[r3]=r6+r11|0;r24=r6;STACKTOP=r7;return r24}}function _get_dosConvert(r1){return HEAP32[r1+148>>2]}function _hash_add(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39;r4=(r1+16|0)>>2;r5=HEAP32[r4];r6=(r1+12|0)>>2;do{if((r5|0)>=(HEAP32[r1+24>>2]|0)){r7=HEAP32[r6];r8=(r1+28|0)>>2;r9=HEAP32[r8];r10=(r1+20|0)>>2;if((_alloc_ht(r1,((HEAP32[r10]<<2)+r5+4|0)/5&-1)|0)!=0){break}L2438:do{if((r7|0)>0){r11=r1|0;r12=r1+4|0;r13=0;while(1){r14=HEAP32[r9+(r13<<2)>>2];if(!((r14|0)==5242884|(r14|0)==5247364)){r15=FUNCTION_TABLE[HEAP32[r11>>2]](r14);r16=HEAP32[r6];r17=(r15>>>0)%(r16>>>0);r15=HEAP32[r8];r18=HEAP32[r15+(r17<<2)>>2];r19=(r18|0)==5242884;L2444:do{if(r19|(r18|0)==5247364){r20=r17;r21=r19;r22=r15}else{r23=-1;r24=r17;r25=r16;r26=r15;while(1){if((r23|0)==-1){r27=FUNCTION_TABLE[HEAP32[r12>>2]](r14);r28=HEAP32[r6];r29=(r27>>>0)%((r28-1|0)>>>0);r30=r28;r31=HEAP32[r8]}else{r29=r23;r30=r25;r31=r26}r28=(r29+(r24+1)|0)%(r30|0);r27=HEAP32[r31+(r28<<2)>>2];r32=(r27|0)==5242884;if(r32|(r27|0)==5247364){r20=r28;r21=r32;r22=r31;break L2444}else{r23=r29;r24=r28;r25=r30;r26=r31}}}}while(0);if(r21){HEAP32[r4]=HEAP32[r4]+1|0}HEAP32[r10]=HEAP32[r10]+1|0;HEAP32[r22+(r20<<2)>>2]=r14}r15=r13+1|0;if((r15|0)==(r7|0)){break L2438}else{r13=r15}}}}while(0);_free(r9)}}while(0);if((HEAP32[r4]|0)==(HEAP32[r6]|0)){r33=-1;return r33}r20=r2;r2=FUNCTION_TABLE[HEAP32[r1>>2]](r20);r22=HEAP32[r6];r21=(r2>>>0)%(r22>>>0);r2=r1+28|0;r31=HEAP32[r2>>2];r30=HEAP32[r31+(r21<<2)>>2];r29=(r30|0)==5242884;L2460:do{if(r29|(r30|0)==5247364){r34=r21;r35=r29;r36=r31}else{r5=r1+4|0;r7=-1;r10=r21;r8=r22;r13=r31;while(1){if((r7|0)==-1){r12=FUNCTION_TABLE[HEAP32[r5>>2]](r20);r11=HEAP32[r6];r37=(r12>>>0)%((r11-1|0)>>>0);r38=r11;r39=HEAP32[r2>>2]}else{r37=r7;r38=r8;r39=r13}r11=(r37+(r10+1)|0)%(r38|0);r12=HEAP32[r39+(r11<<2)>>2];r15=(r12|0)==5242884;if(r15|(r12|0)==5247364){r34=r11;r35=r15;r36=r39;break L2460}else{r7=r37;r10=r11;r8=r38;r13=r39}}}}while(0);if(r35){HEAP32[r4]=HEAP32[r4]+1|0}r4=r1+20|0;HEAP32[r4>>2]=HEAP32[r4>>2]+1|0;HEAP32[r36+(r34<<2)>>2]=r20;if((r3|0)==0){r33=0;return r33}HEAP32[r3>>2]=r34;r33=0;return r33}function __hash_lookup(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r6=0;r7=r2;r2=FUNCTION_TABLE[HEAP32[r1>>2]](r7);r8=(r1+12|0)>>2;r9=HEAP32[r8];r10=(r1+28|0)>>2;r11=r1+8|0;if((r9|0)==0){r12=-1;return r12}r13=r1+4|0;r1=(r5|0)==0;r5=-1;r14=(r2>>>0)%(r9>>>0);r2=-1;r15=r9;L2479:while(1){r9=HEAP32[HEAP32[r10]+(r14<<2)>>2];if((r9|0)==5242884){break}do{if((r9|0)!=5247364){if(r1){if((FUNCTION_TABLE[HEAP32[r11>>2]](r9,r7)|0)==0){break L2479}else{break}}else{if((r9|0)==(r7|0)){break L2479}else{break}}}}while(0);if((r5|0)==-1){r16=(FUNCTION_TABLE[HEAP32[r13>>2]](r7)>>>0)%((HEAP32[r8]-1|0)>>>0)}else{r16=r5}if((r2|0)==-1){r17=(HEAP32[HEAP32[r10]+(r14<<2)>>2]|0)==5247364?r14:-1}else{r17=r2}r9=r15-1|0;if((r9|0)==0){r12=-1;r6=1852;break}else{r5=r16;r14=(r16+(r14+1)|0)%(HEAP32[r8]|0);r2=r17;r15=r9}}if(r6==1852){return r12}r6=HEAP32[r10];r15=HEAP32[r6+(r14<<2)>>2];if((r15|0)==5242884){r12=-1;return r12}if((r2|0)==-1){r18=r14}else{HEAP32[r6+(r2<<2)>>2]=r15;HEAP32[HEAP32[r10]+(r14<<2)>>2]=5247364;r18=r2}if((r4|0)!=0){HEAP32[r4>>2]=r18}HEAP32[r3>>2]=HEAP32[HEAP32[r10]+(r18<<2)>>2];r12=0;return r12}function _fs_flush(r1){_fat_write(r1);return 0}function _find_device(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55;r9=0;r10=STACKTOP;STACKTOP=STACKTOP+716|0;r11=r10+712,r12=r11>>2;HEAP32[r12]=0;r13=r10+512|0;r14=r1<<24>>24;_sprintf(r13,5262168,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r15=HEAP32[1311840];r16=r15|0;L2509:do{if((HEAP32[r16>>2]|0)==0){r17=0;r18=r15}else{r19=r11;r20=r3;r21=r3+40|0;r22=(r8|0)!=0?r2|2:r2;r23=(r8|0)==0;r24=r3+60|0;r25=r4|0;r26=r4+11|0;r27=r4+12|0;r28=r4+21|0;r29=r10|0;r30=r4+2|0;r31=0;r32=r16;while(1){r33=r32;_free_stream(r19);L2513:do{if(HEAP8[r32+4|0]<<24>>24==r1<<24>>24){_memcpy(r20,r32,72);_expand(HEAP32[r32>>2],r5);HEAP32[r12]=0;L2515:do{if((HEAP32[r21>>2]&64|0)==0){r34=_SimpleFileOpen(r3,r33,r5,r22,r13,0,1,r7);r35=r34;HEAP32[r12]=r35;if((r34|0)!=0){r36=r35;r37=0;break}if(r23){r38=r31;r39=r35;r9=1867;break}do{if((HEAP32[___errno_location()>>2]|0)!=1){if((HEAP32[___errno_location()>>2]|0)==13){break}if((HEAP32[___errno_location()>>2]|0)!=30){r38=r31;r39=r35;r9=1867;break L2515}}}while(0);r35=_SimpleFileOpen(r3,r33,r5,r2,r13,0,1,r7);r34=r35;HEAP32[r12]=r34;r38=(r35|0)==0?r31:1;r39=r34;r9=1867;break}else{r34=_FloppydOpen(r3,r5,r2,r13,r7);HEAP32[r12]=r34;r38=r31;r39=r34;r9=1867;break}}while(0);if(r9==1867){r9=0;if((r39|0)==0){r40=r38;break}else{r36=r39;r37=r38}}r34=HEAP32[r24>>2];r35=(r34|0)==0?512:r34;r34=(r35|0)>4096?4096:r35;r35=(r36|0)>>2;r41=HEAP32[HEAP32[r35]>>2];r42=0;r43=r34;r44=r25;r45=0;while(1){r46=FUNCTION_TABLE[r41](r36,r44,r42,r43);if((r46|0)<1){r9=1870;break}r47=r46+r45|0;if((r43|0)==(r46|0)){r48=r47;break}else{r42=r46+r42|0;r43=r43-r46|0;r44=r44+r46|0;r45=r47}}if(r9==1870){r9=0;r48=(r45|0)==0?r46:r45}if((r48|0)!=(r34|0)){_sprintf(r13,5262932,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r40=r37;break}r44=HEAPU8[r27]<<8|HEAPU8[r26];r43=r44<<16>>16;if(r44<<16>>16>-1&(r44&65535)<4096){_memset(r4+r43|0,0,4096-r43|0)}r43=HEAP8[r28];do{if((r43&255)<240){r44=HEAP32[HEAP32[r35]>>2];r42=512;r41=512;r47=r29;r49=0;while(1){r50=FUNCTION_TABLE[r44](r36,r47,r42,r41);if((r50|0)<1){r9=1879;break}r51=r50+r49|0;if((r41|0)==(r50|0)){r52=r51;break}else{r42=r50+r42|0;r41=r41-r50|0;r47=r47+r50|0;r49=r51}}if(r9==1879){r9=0;r52=(r49|0)==0?r50:r49}if((r52|0)==512){r53=HEAPU8[r29];r9=1885;break}else{HEAP32[r6>>2]=0;break}}else{r53=r43&255|256;r9=1885;break}}while(0);do{if(r9==1885){r9=0;HEAP32[r6>>2]=r53;if((r53|0)<241){break}HEAP32[___errno_location()>>2]=0;if((FUNCTION_TABLE[HEAP32[HEAP32[r35]+16>>2]](r36,r3,r33,HEAP32[r6>>2],r4)|0)==0){r17=r37;r18=r33;break L2509}if((HEAP32[___errno_location()>>2]|0)==0){_sprintf(r13,5252408,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r40=r37;break L2513}else{r43=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r13,199,5254184,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r14,HEAP32[tempInt+4>>2]=r43,tempInt));r40=r37;break L2513}}}while(0);if(HEAP8[r30]<<24>>24==76){_sprintf(r13,5259296,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r40=r37;break}else{_sprintf(r13,5256760,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r40=r37;break}}else{r40=r31}}while(0);r54=r32+72|0;if((HEAP32[r54>>2]|0)==0){break}else{r31=r40;r32=r54}}r17=r40;r18=r54}}while(0);if(HEAP8[r18+4|0]<<24>>24==0){_free_stream(r11);_fprintf(HEAP32[_stderr>>2],5259332,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r13,tempInt));r55=0;STACKTOP=r10;return r55}if((r8|0)!=0){HEAP32[r8>>2]=r17}r55=HEAP32[r12];STACKTOP=r10;return r55}function _hash_remove(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r4+4;HEAP32[r5>>2]=r3;do{if((r3|0)>-1){if((HEAP32[r1+12>>2]|0)<=(r3|0)){break}r7=(r3<<2)+HEAP32[r1+28>>2]|0;if((HEAP32[r7>>2]|0)!=(r2|0)){break}r8=r1+20|0;HEAP32[r8>>2]=HEAP32[r8>>2]-1|0;HEAP32[r7>>2]=5247364;STACKTOP=r4;return 0}}while(0);if((__hash_lookup(r1,r2,r6,r5,1)|0)!=0){_fwrite(5259640,28,1,HEAP32[_stderr>>2]);_exit(1)}r6=r1+20|0;HEAP32[r6>>2]=HEAP32[r6>>2]-1|0;HEAP32[HEAP32[r1+28>>2]+(HEAP32[r5>>2]<<2)>>2]=5247364;STACKTOP=r4;return 0}function __match(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+256|0;r7=r6;r8=HEAP8[r2];L2585:do{if(r8<<24>>24==0|(r4|0)==0){r9=r3;r10=r1}else{r11=r7|0;r12=r2;r13=r3;r14=r1;r15=r4;r16=r8;L2587:while(1){r17=r16<<24>>24;L2589:do{if((r17|0)==63){r18=HEAP8[r14];if(r18<<24>>24==0){r19=0;r5=1957;break L2587}if((r13|0)==0){r20=r15;r21=0;r22=r12;r5=1951;break}HEAP8[r13]=r18;r20=r15;r21=r13+1|0;r22=r12;r5=1951;break}else if((r17|0)==91){r18=r12+1|0;r23=r15-1|0;r24=r13+1|0;r25=HEAP8[r18]<<24>>24==94;r26=r25&1;_memset(r11,0,256);r27=r25?r12+2|0:r18;while(1){r18=HEAP8[r27];if(r18<<24>>24==0){r19=0;r5=1959;break L2587}else if(r18<<24>>24==93){break}r25=r27+1|0;if(HEAP8[r25]<<24>>24!=45){HEAP8[(r18<<24>>24)+r7|0]=1;r27=r25;continue}r25=r27+2|0;r28=HEAP8[r25];if(r28<<24>>24==93){r29=256;r30=r25}else{r29=r28<<24>>24;r30=r27+3|0}r28=r18<<24>>24;if((r28|0)>(r29|0)){r27=r30;continue}_memset(r7+r28|0,1,1-r28+r29|0);r27=r30}r28=(r13|0)!=0;if(r28){HEAP8[r13]=HEAP8[r14]}r18=HEAP8[r14]<<24>>24;do{if(HEAP8[r7+r18|0]<<24>>24==0){if(HEAP8[r7+_tolower(r18)|0]<<24>>24!=0){if(r28){HEAP8[r13]=_tolower(HEAP8[r14]<<24>>24)&255}r31=r26^1;break}if(HEAP8[r7+_toupper(HEAP8[r14]<<24>>24)|0]<<24>>24==0){r31=r26;break}if(r28){HEAP8[r13]=_toupper(HEAP8[r14]<<24>>24)&255}r31=r26^1}else{r31=r26^1}}while(0);if((r31|0)==0){r19=0;r5=1961;break L2587}else{r20=r23;r21=r24;r22=r27;r5=1951;break}}else if((r17|0)==42){L2623:do{if(r16<<24>>24!=42|(r15|0)==0){r32=r12;r33=r15}else{r26=r12;r28=r15;while(1){r18=r26+1|0;r25=r28-1|0;if(HEAP8[r18]<<24>>24!=42|(r25|0)==0){r32=r18;r33=r25;break L2623}else{r26=r18;r28=r25}}}}while(0);if(HEAP8[r14]<<24>>24==0){r34=r33;r35=r14;r36=r13;r37=r32;break}else{r38=r13;r39=r14}while(1){if((__match(r39,r32,r38,r33)|0)!=0){r19=1;r5=1958;break L2587}if((r38|0)==0){r40=0}else{HEAP8[r38]=HEAP8[r39];r40=r38+1|0}r27=r39+1|0;if(HEAP8[r27]<<24>>24==0){r34=r33;r35=r27;r36=r40;r37=r32;break L2589}else{r38=r40;r39=r27}}}else if((r17|0)==92){r27=r12+1|0;r41=r15-1|0;r42=r27;r43=HEAP8[r27];r5=1948;break}else{r41=r15;r42=r12;r43=r16;r5=1948}}while(0);do{if(r5==1948){r5=0;if((_toupper(HEAP8[r14]<<24>>24)|0)!=(_toupper(r43<<24>>24)|0)){r19=0;r5=1962;break L2587}if((r13|0)==0){r20=r41;r21=0;r22=r42;r5=1951;break}HEAP8[r13]=HEAP8[r42];r20=r41;r21=r13+1|0;r22=r42;r5=1951;break}}while(0);if(r5==1951){r5=0;r34=r20-1|0;r35=r14+1|0;r36=r21;r37=r22+1|0}r17=HEAP8[r37];if(r17<<24>>24==0|(r34|0)==0){r9=r36;r10=r35;break L2585}else{r12=r37;r13=r36;r14=r35;r15=r34;r16=r17}}if(r5==1957){STACKTOP=r6;return r19}else if(r5==1958){STACKTOP=r6;return r19}else if(r5==1959){STACKTOP=r6;return r19}else if(r5==1961){STACKTOP=r6;return r19}else if(r5==1962){STACKTOP=r6;return r19}}}while(0);if((r9|0)!=0){HEAP8[r9]=0}r19=HEAP8[r10]<<24>>24==0&1;STACKTOP=r6;return r19}function _unix_loop(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r2>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+76|0;r7=r6;r8=r6+4;r9=r2+40|0,r10=r9>>2;HEAP32[r10]=0;HEAP32[r1+11]=0;r11=_strlen(r3);do{if((r11|0)>1){r12=r11-1|0;if(HEAP8[r3+r12|0]<<24>>24!=47){r5=1966;break}r13=_strdup(r3);HEAP8[r13+r12|0]=0;HEAP32[r1+12]=r13;break}else{r5=1966}}while(0);if(r5==1966){HEAP32[r1+12]=r3}HEAP32[r1]=84;r11=r2+24|0;do{if((HEAP32[r11>>2]&1|0)==0){r5=1977}else{r13=_SimpleFileOpen(0,0,r3,0,0,0,0,0);HEAP32[r10]=r13;if((r13|0)==0){_perror(r3);r14=16;STACKTOP=r6;return r14}FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r13,0,0,r7,0);if((HEAP32[r7>>2]|0)==0){r5=1979;break}_free_stream(r9);do{if((r4|0)==0){if((_lstat(r3,r8)|0)!=0){break}if((HEAP32[r8+8>>2]&61440|0)!=40960){break}_fprintf(HEAP32[_stderr>>2],5258764,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r14=0;STACKTOP=r6;return r14}}while(0);if((HEAP32[r11>>2]&16|0)==0){r14=0;STACKTOP=r6;return r14}else{HEAP32[r10]=_OpenDir(r3);r5=1977;break}}}while(0);do{if(r5==1977){if((HEAP32[r7>>2]|0)==0){r5=1979;break}r15=FUNCTION_TABLE[HEAP32[r1+1]](0,r2);break}}while(0);if(r5==1979){r15=FUNCTION_TABLE[HEAP32[r1+3]](r2)}_free_stream(r9);r14=r15;STACKTOP=r6;return r14}function __unix_loop(r1,r2,r3){return _unix_dir_loop(r1,r2)}function _target_lookup(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=r1>>2;r4=STACKTOP;STACKTOP=STACKTOP+20|0;r5=r4,r6=r5>>2;r7=(r1+24|0)>>2;r8=HEAP32[r7];do{if((r8&8192|0)==0){if(HEAP8[r2]<<24>>24!=0){if(HEAP8[r2+1|0]<<24>>24==58){break}}r9=_strdup(r2);r10=(r1+56|0)>>2;HEAP32[r10]=r9;if((_access(r9,0)|0)==0){r11=4;STACKTOP=r4;return r11}r9=HEAP32[r10];r12=_strrchr(r9,47);if((r12|0)==0){HEAP32[r3+15]=r9;HEAP32[r10]=_strdup(5249700);r11=4;STACKTOP=r4;return r11}else{HEAP8[r12]=0;HEAP32[r3+15]=r12+1|0;r11=4;STACKTOP=r4;return r11}}}while(0);r12=r5>>2;r10=r5|0;HEAP32[r12]=0;HEAP32[r12+1]=0;HEAP32[r12+2]=0;HEAP32[r12+3]=0;HEAP32[r7]=17;r12=_common_dos_loop(r1,r2,r5,2);HEAP32[r7]=r8;if((r12&16|0)!=0){r11=r12;STACKTOP=r4;return r11}if((HEAP32[r6+3]|0)!=0){HEAP32[r3+15]=0;HEAP32[r3+13]=HEAP32[r6+2];_free_stream(r5);r11=r12;STACKTOP=r4;return r11}r5=HEAP32[r6+1];if((r5|0)==0){_fprintf(HEAP32[_stderr>>2],5259968,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r11=2;STACKTOP=r4;return r11}else if((r5|0)==1){HEAP32[r3+15]=_strdup(HEAP32[r6+4]);HEAP32[r3+13]=HEAP32[r10>>2];r11=r12;STACKTOP=r4;return r11}else{_fprintf(HEAP32[_stderr>>2],5259796,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r11=16;STACKTOP=r4;return r11}}function _fs_init(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+6224|0;r6=r5;r7=r5+2052,r8=r7>>2;r9=r5+2124;r10=r5+2128;r11=_calloc(1,152),r12=r11>>2;if((r11|0)==0){r13=0;STACKTOP=r5;return r13}r14=(r11+44|0)>>2;HEAP32[r14]=0;r15=r11+8|0;r16=r15>>2;HEAP32[r16]=0;HEAP32[r12+1]=1;HEAP32[r12+3]=0;HEAP32[r12]=5264944;r17=(r11+124|0)>>2;HEAP32[r17]=0;HEAP32[r17+1]=0;HEAP32[r17+2]=0;HEAP32[r17+3]=0;HEAP8[r11+96|0]=r1;HEAP32[r12+29]=0;r17=_find_device(r1,r2,r7,r10,r5+4|0,r6,r9,r3);HEAP32[r14]=r17;if((r17|0)==0){r13=0;STACKTOP=r5;return r13}r3=HEAPU8[r10+12|0]<<8|HEAPU8[r10+11|0];r2=r11+28|0;HEAP32[r2>>2]=r3;if(r3>>>0>8192){_fprintf(HEAP32[_stderr>>2],5250900,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1<<24>>24,tempInt));r13=0;STACKTOP=r5;return r13}else{r18=0}while(1){if(r18>>>0>=24){break}if((1<<r18|0)==(r3|0)){r4=2016;break}else{r18=r18+1|0}}do{if(r4==2016){if((r18|0)==24){break}r19=r11+144|0;HEAP32[r19>>2]=r18;r20=r11+140|0;HEAP32[r20>>2]=r3-1|0;r21=(r7+24|0)>>2;r22=Math.imul(HEAP32[r21],HEAP32[r8+5]);r23=r11+16|0;HEAP32[r23>>2]=0;r24=HEAP32[r6>>2];do{if((r24&-8|0)==248){r25=r24&3;HEAP32[r12+6]=HEAP32[(r25*28&-1)+5244712>>2];r26=Math.imul(HEAP32[(r25*28&-1)+5244696>>2],r22);HEAP32[r12+13]=1;HEAP32[r12+14]=HEAP32[(r25*28&-1)+5244716>>2];HEAP32[r12+21]=HEAP32[(r25*28&-1)+5244708>>2];HEAP32[r12+15]=2;HEAP32[r2>>2]=512;HEAP32[r19>>2]=9;HEAP32[r20>>2]=511;HEAP32[r12+18]=12;r27=r26;r28=9;r29=512}else{r26=HEAPU8[r10+20|0]<<8|HEAPU8[r10+19|0];if((r26|0)==0){r30=HEAPU8[r10+33|0]<<8|HEAPU8[r10+32|0]|(HEAPU8[r10+35|0]<<8|HEAPU8[r10+34|0])<<16}else{r30=r26}HEAP32[r12+6]=HEAPU8[r10+13|0];HEAP32[r12+13]=HEAPU8[r10+15|0]<<8|HEAPU8[r10+14|0];r26=HEAPU8[r10+23|0]<<8|HEAPU8[r10+22|0];HEAP32[r12+14]=r26;HEAP32[r12+21]=Math.floor(((HEAPU8[r10+18|0]<<8|HEAPU8[r10+17|0])<<5>>>0)/(r3>>>0));HEAP32[r12+15]=HEAPU8[r10+16|0];r25=(r26|0)==0?r10+64|0:r10+36|0;if(HEAP8[r25+2|0]<<24>>24!=41){r27=r30;r28=r18;r29=r3;break}HEAP32[r23>>2]=1;HEAP32[r12+5]=HEAPU8[r25+4|0]<<8|HEAPU8[r25+3|0]|(HEAPU8[r25+6|0]<<8|HEAPU8[r25+5|0])<<16;r27=r30;r28=r18;r29=r3}}while(0);if(r27>>>0>=HEAP32[r9>>2]>>>(r28>>>0)>>>0){_fwrite(5249552,45,1,HEAP32[_stderr>>2]);_exit(1)}do{if((HEAP32[1311255]|0)==0){r23=HEAP32[r21];if(((r27>>>0)%(r23>>>0)|0)==0){break}_fprintf(HEAP32[_stderr>>2],5264112,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r27,HEAP32[tempInt+4>>2]=r23,tempInt));_fwrite(5263480,65,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);r23=(HEAP32[r8+4]|0)!=0?r22:512;if((r23|0)>256){r20=HEAP32[r21];r31=r20<<(r20&1)}else{r31=r23}r23=r31<<(r31&1);r20=HEAP32[r8+15];r19=(r20|0)==0|r20>>>0<r29>>>0?r29:r20;if((r23|0)==0){r32=r17}else{r32=_buf_init(r17,Math.imul(r23<<3,r19),Math.imul(r19,r23),r29)}HEAP32[r16]=r32;if((r32|0)==0){_perror(5262892);HEAP32[r16]=HEAP32[r14]}if((_fat_read(r11,r10,r27,HEAP32[r8+12]&127)|0)!=0){HEAP32[r12+15]=1;_free_stream(r15);_free(HEAP32[r16]);r13=0;STACKTOP=r5;return r13}r23=_cp_open(HEAP32[r8+16]);r19=r11+148|0;HEAP32[r19>>2]=r23;if((r23|0)!=0){r13=r11;STACKTOP=r5;return r13}r23=r11+76|0;r20=HEAP32[r23>>2];do{if((r20|0)!=0){r24=(HEAP32[r12+14]+63|0)>>>6;L2762:do{if((r24|0)==0){r33=r20}else{r25=0;r26=r20;while(1){r34=HEAP32[r26+(r25*20&-1)>>2];if((r34|0)==0){r35=r26}else{_free(r34);r35=HEAP32[r23>>2]}r34=r25+1|0;if((r34|0)<(r24|0)){r25=r34;r26=r35}else{r33=r35;break L2762}}}}while(0);_free(r33);r24=HEAP32[r19>>2];if((r24|0)==0){break}_free(r24)}}while(0);_free_stream(r15);_free(HEAP32[r16]);r13=0;STACKTOP=r5;return r13}}while(0);_fprintf(HEAP32[_stderr>>2],5250240,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r1<<24>>24,HEAP32[tempInt+4>>2]=r3,tempInt));r13=0;STACKTOP=r5;return r13}function _main_loop(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=0;r5=STACKTOP;do{if((r3|0)!=1){r6=HEAP32[r1+60>>2];if((r6|0)==0){break}_fprintf(HEAP32[_stderr>>2],5256608,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt))}}while(0);L2779:do{if((r3|0)<1|(HEAP32[1311336]|0)!=0){r7=0}else{r6=r1+64|0;r8=r1+68|0;r9=r1+12|0;r10=r1+20|0;r11=r1+28|0;r12=0;r13=0;while(1){r14=((r12<<2)+r2|0)>>2;r15=HEAP32[r14];HEAP32[r6>>2]=r15;r16=_strrchr(r15,47);HEAP32[r8>>2]=(_strpbrk((r16|0)==0?r15:r16+1|0,5262444)|0)!=0&1;r16=HEAP32[r14];do{if((HEAP32[r9>>2]|0)==0){r4=2064}else{if(HEAP8[r16]<<24>>24!=0){if(HEAP8[r16+1|0]<<24>>24==58){r4=2064;break}}r17=_unix_loop(0,r1,r16,1);break}}while(0);if(r4==2064){r4=0;r17=_common_dos_loop(r1,r16,0,HEAP32[r10>>2])}if((r17&20|0)==0){r15=HEAP32[r14];_fprintf(HEAP32[_stderr>>2],5252380,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311159],HEAP32[tempInt+4>>2]=r15,tempInt));r18=r17|16}else{r18=r17}r15=r18|r13;if((HEAP32[r11>>2]|0)!=0){if((r15&18|0)!=0){r7=r15;break L2779}}r19=r12+1|0;if((r19|0)>=(r3|0)|(HEAP32[1311336]|0)!=0){r7=r15;break L2779}else{r12=r19;r13=r15}}}}while(0);_free_stream(r1+52|0);if((r7&16|0)!=0){r20=1;STACKTOP=r5;return r20}if((r7&6|0)==6){r20=2;STACKTOP=r5;return r20}r20=r7>>>1&1;STACKTOP=r5;return r20}function _init_mp(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=r1>>2;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+128|0;r5=r4;r6=r1+72|0;r7=r5|0;r8=_open_mcwd(5259996);do{if((r8|0)==0){r3=2080}else{if((_fgets(r7,128,r8)|0)==0){_fclose(r8);r3=2080;break}HEAP8[r5+(_strlen(r7)-1)|0]=0;_fclose(r8);r9=HEAP8[r7];do{if(r9<<24>>24==0){r3=2084}else{if(HEAP8[r5+1|0]<<24>>24!=58){r3=2084;break}_strncpy(r6,r7,2);HEAP8[r1+74|0]=0;r10=r5+2|0;r11=r10;r12=HEAP8[r10];break}}while(0);if(r3==2084){r10=HEAP8[5247608];HEAP8[r6]=r10<<24>>24==0?65:r10;r10=r1+73|0;tempBigInt=58;HEAP8[r10]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r10+1|0]=tempBigInt&255;r11=r7;r12=r9}if(r12<<24>>24==47|r12<<24>>24==92){_strcat(r6,r11)}else{r10=_strlen(r6)+r1+72|0;tempBigInt=47;HEAP8[r10]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r10+1|0]=tempBigInt&255;_strcat(r6,r11)}if((_strlen(r6)|0)==3){break}r10=r11-1|0;if(HEAP8[r10]<<24>>24!=47){break}HEAP8[r10]=0;break}}while(0);if(r3==2080){r3=HEAP8[5247608];HEAP8[r6]=r3<<24>>24==0?65:r3;r3=r1+73|0;HEAP8[r3]=HEAP8[5258260];HEAP8[r3+1|0]=HEAP8[5258261|0];HEAP8[r3+2|0]=HEAP8[5258262|0]}HEAP32[r2+5]=0;HEAP32[r2+15]=0;HEAP32[r2+13]=0;HEAP32[r2+14]=0;HEAP32[r2+1]=100;HEAP32[r2+3]=0;r2=(r1+28|0)>>2;HEAP32[r2]=0;HEAP32[r2+1]=0;HEAP32[r2+2]=0;HEAP32[r2+3]=0;STACKTOP=r4;return}function _dispatchToFile(r1,r2){var r3;if((r1|0)==0){r3=FUNCTION_TABLE[HEAP32[r2+12>>2]](r2);return r3}else{r3=FUNCTION_TABLE[HEAP32[r2+8>>2]](r1,r2);return r3}}function _mpBuildUnixFilename(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+72|0;r3=r2;r4=r1+60|0;r5=HEAP32[r4>>2];do{if((r5|0)==0){r6=HEAP32[r1+44>>2];if((r6|0)==0){r7=HEAP32[r1+48>>2];r8=_strrchr(r7,47);r9=(r8|0)==0?r7:r8+1|0;break}r8=r1+208|0;r7=0;r10=r8;while(1){r11=HEAP8[r6+(r7+40)|0];if(r11<<24>>24==0){r12=r10;break}HEAP8[r10]=r11;r11=r10+1|0;r13=r7+1|0;if(r13>>>0<256){r7=r13;r10=r11}else{r12=r11;break}}HEAP8[r12]=0;r9=r8}else{r9=r5}}while(0);r5=r1+56|0;r12=_malloc((_strlen(HEAP32[r5>>2])+2|0)+_strlen(r9)|0);if((r12|0)==0){r14=0;STACKTOP=r2;return r14}_strcpy(r12,HEAP32[r5>>2]);if(HEAP8[r9]<<24>>24==0){r14=r12;STACKTOP=r2;return r14}do{if((HEAP32[r4>>2]|0)==0){if((HEAP32[r1+52>>2]|0)!=0){break}if((_stat(r12,r3)|0)!=0){break}if((HEAP32[r3+8>>2]&61440|0)==16384){break}else{r14=r12}STACKTOP=r2;return r14}}while(0);r3=r12+_strlen(r12)|0;tempBigInt=47;HEAP8[r3]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r3+1|0]=tempBigInt&255;if((_strcmp(r9,5249700)|0)==0){r15=5250224}else{r15=(_strcmp(r9,5255792)|0)==0?5249512:r9}r9=_strchr(r15,47);L2858:do{if((r9|0)==0){r16=r15}else{r3=r15;r1=r9;while(1){_strncat(r12,r3,r1-r3|0);r4=r12+_strlen(r12)|0;tempBigInt=92;HEAP8[r4]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r4+1|0]=tempBigInt&255;r4=r1+1|0;r5=_strchr(r4,47);if((r5|0)==0){r16=r4;break L2858}else{r3=r4;r1=r5}}}}while(0);_strcat(r12,r16);r14=r12;STACKTOP=r2;return r14}function _common_dos_loop(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+4|0;r7=r6;HEAP32[r1>>2]=98;r8=HEAP8[r2];r9=r8<<24>>24;do{if(r8<<24>>24==0){r5=2124}else{if(HEAP8[r2+1|0]<<24>>24!=58){r5=2124;break}r10=_toupper(r9);r11=r2+2|0;r12=r10&255;r13=(HEAP8[r1+72|0]<<24>>24|0)==(r10<<24>>24|0)?r1+74|0:5260912;r14=r11;r15=HEAP8[r11];break}}while(0);do{if(r5==2124){r9=HEAP8[r1+72|0];if(r9<<24>>24==0){r11=HEAP8[5247608];r12=r11<<24>>24==0?65:r11;r13=5260912;r14=r2;r15=r8;break}else{r12=r9;r13=r1+74|0;r14=r2;r15=r8;break}}}while(0);r8=r15<<24>>24==47?5260912:r13;if(!HEAP8[5245232]){HEAP8[5245232]=1;_memset(5245772,0,1024);_atexit(160)}r13=_toupper(r12&255);r12=r13&255;r15=(r12<<2)+5245772|0;r2=HEAP32[r15>>2];do{if((r2|0)==0){r5=_fs_init(r13&255,r4,0);r9=r5;if((r5|0)!=0){HEAP32[r15>>2]=r9;r16=r9;break}_fprintf(HEAP32[_stderr>>2],5249704,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r12,tempInt));HEAP32[r1+40>>2]=0;HEAP32[r7>>2]=0;r17=16;STACKTOP=r6;return r17}else{r16=r2}}while(0);r2=_OpenRoot(r16);HEAP32[r1+40>>2]=r2;HEAP32[r7>>2]=r2;if((r2|0)==0){r17=16;STACKTOP=r6;return r17}r2=_recurs_dos_loop(r1,r8,r14,r3);if((r2&8|0)==0){r18=r2}else{HEAP8[r1+72|0]=0;_unlink_mcwd();r18=_recurs_dos_loop(r1,5260912,r14,r3)}_free_stream(r7);r17=r18;STACKTOP=r6;return r17}function __dos_loop(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+308|0;r6=r5,r7=r6>>2;r8=r5+4,r9=r8>>2;HEAP32[r7]=0;HEAP32[r9+1]=-1;HEAP32[r9]=r1;HEAP32[r9+74]=0;HEAP32[r9+75]=0;L2891:do{if((HEAP32[1311336]|0)==0){r9=r2+24|0;r10=r2+32|0;r11=r2+36|0;r12=r2+40|0;r13=r8+40|0;r14=r8+19|0;r15=r2+44|0;r16=r2+8|0;r17=r6;r18=r2+4|0;r19=r1;r20=r1;r21=r2+28|0;r22=0;while(1){r23=_vfat_lookup(r8,r3,-1,HEAP32[r9>>2],HEAP32[r10>>2],HEAP32[r11>>2]);if((r23|0)==-2){r24=16;break}else if((r23|0)!=0){r25=r22;break L2891}HEAP32[r12>>2]=0;r23=HEAP32[r9>>2];do{if((r23&256|0)==0){r4=2149}else{if(HEAP8[r13]<<24>>24==0){r26=r22;break}if((_strcmp(r13,5249700)|0)==0){r26=r22;break}if((_strcmp(r13,5255792)|0)==0){r26=r22;break}else{r4=2149;break}}}while(0);if(r4==2149){r4=0;HEAP32[r7]=0;do{if((r23&1|0)==0){if((HEAP8[r14]&16)<<24>>24==0){break}if((r23&1024|0)==0){break}else{r4=2152;break}}else{r4=2152}}while(0);if(r4==2152){r4=0;r23=_OpenFileByDirentry(r8);HEAP32[r12>>2]=r23;HEAP32[r7]=r23}if((HEAP32[1311336]|0)!=0){r25=r22;break L2891}HEAP32[r15>>2]=r8;if((HEAP8[r14]&16)<<24>>24==0){r27=FUNCTION_TABLE[HEAP32[r16>>2]](r8,r2)}else{r27=FUNCTION_TABLE[HEAP32[r18>>2]](r8,r2)}_free_stream(r17);r26=r27|r22}L2914:do{if((HEAP32[r20>>2]|0)==5264944){r28=r19}else{r23=r19;while(1){r29=HEAP32[r23+8>>2];if((HEAP32[r29>>2]|0)==5264944){r28=r29;break L2914}else{r23=r29}}}}while(0);r23=r28+32|0;if((HEAP32[r23>>2]|0)==0){r30=1}else{_fwrite(5249676,19,1,HEAP32[_stderr>>2]);r30=(HEAP32[r23>>2]|0)==0}r23=r30?r26:r26|16;if((HEAP32[r21>>2]|0)==0){if((HEAP32[1311336]|0)==0){r22=r23;continue}else{r25=r23;break L2891}}else{if((HEAP32[1311336]|r23&16|0)==0){r22=r23;continue}else{r25=r23;break L2891}}}STACKTOP=r5;return r24}else{r25=0}}while(0);r24=(HEAP32[1311336]|0)==0?r25:r25|16;STACKTOP=r5;return r24}function _recurs_dos_loop(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44;r5=r1>>2;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+308|0;r8=r7,r9=r8>>2;r10=r7+304;r11=r2;r2=r3;L2928:while(1){r3=(r2|0)==0;L2930:do{if(r3){r12=r11;while(1){if((_strncmp(r12,5261368,2)|0)==0){r12=r12+2|0;continue}r13=HEAP8[r12];if(r13<<24>>24==0){r14=r12;break L2930}else if(r13<<24>>24!=47){r15=r12;r16=0;r17=1;r18=r13;break L2928}r12=r12+1|0}}else{r12=r11;while(1){if((_strncmp(r12,5261368,2)|0)==0){r12=r12+2|0;continue}if((_strcmp(r12,5249700)|0)==0){r12=r12+1|0;continue}r13=HEAP8[r12];if(r13<<24>>24==0){r14=r12;break L2930}else if(r13<<24>>24!=47){r15=r12;r16=r2;r17=0;r18=r13;break L2928}r12=r12+1|0}}}while(0);if(r3){r15=r14;r16=0;r17=1;r18=0;break}else{r11=r2;r2=0}}do{if((_strncmp(r15,5260856,3)|0)!=0){if(!((_strcmp(r15,5255792)|0)!=0|r17)){break}r2=(r16|0)!=0;r11=_strchr(r15,47);if((r11|0)==0){r19=_strlen(r15);r20=r16;r21=0}else{r19=r11-r15|0;r20=r11+1|0;r21=r16}r11=(r20|0)!=0;do{if(r11){r22=273}else{r14=HEAP32[r5+6];if((r14&4096|0)!=0){r12=r1+60|0;HEAP32[r12>>2]=r15;r13=HEAP32[r5+10];L2959:do{if((HEAP32[r13>>2]|0)==5265052){r23=r13}else{r24=r13;while(1){r25=HEAP32[r24+8>>2];if((HEAP32[r25>>2]|0)==5265052){r23=r25;break L2959}else{r24=r25}}}}while(0);r13=_handle_leaf(r23+44|0,r1,r4);HEAP32[r12>>2]=0;r26=r13;STACKTOP=r7;return r26}if((_strcmp(r15,5249700)|0)==0|r18<<24>>24==0){r13=HEAP32[r5+10];L2967:do{if((HEAP32[r13>>2]|0)==5265052){r27=r13}else{r24=r13;while(1){r25=HEAP32[r24+8>>2];if((HEAP32[r25>>2]|0)==5265052){r27=r25;break L2967}else{r24=r25}}}}while(0);r26=_handle_leaf(r27+44|0,r1,r4);STACKTOP=r7;return r26}if((_strcmp(r15,5255792)|0)==0){r13=HEAP32[r5+10];L2975:do{if((HEAP32[r13>>2]|0)==5265052){r28=r13}else{r12=r13;while(1){r24=HEAP32[r12+8>>2];if((HEAP32[r24>>2]|0)==5265052){r28=r24;break L2975}else{r12=r24}}}}while(0);r13=HEAP32[r28+44>>2];L2979:do{if((HEAP32[r13>>2]|0)==5265052){r29=r13}else{r12=r13;while(1){r24=HEAP32[r12+8>>2];if((HEAP32[r24>>2]|0)==5265052){r29=r24;break L2979}else{r12=r24}}}}while(0);r26=_handle_leaf(r29+44|0,r1,r4);STACKTOP=r7;return r26}if((r4|0)==0){r22=r14;break}HEAP32[r4+16>>2]=r15;r13=(r4+4|0)>>2;if((HEAP32[r4+12>>2]+HEAP32[r13]|0)>0){_free_stream(r4)}else{r12=HEAP32[r5+10];if((r12|0)!=0){r24=r12+4|0;HEAP32[r24>>2]=HEAP32[r24>>2]+1|0}HEAP32[r4>>2]=r12}HEAP32[r13]=HEAP32[r13]+1|0;r22=r14}}while(0);r3=r1+40|0;r13=HEAP32[r3>>2];HEAP32[r9+1]=-1;HEAP32[r9]=r13;HEAP32[r9+74]=0;HEAP32[r9+75]=0;r13=r22|128;r12=r1+32|0;r24=r1+36|0;r25=r8+40|0;r30=(r22&256|0)==0;r31=r10;r32=r1+60|0;r33=0;r34=0;L2994:while(1){r35=r34&32;r36=HEAP32[1311336];if((r36|r35|0)!=0){r37=r34;r38=r33;r39=r36;break}L2996:while(1){r36=_vfat_lookup(r8,r15,r19,r13,HEAP32[r12>>2],HEAP32[r24>>2]);if((r36|0)==-2){r26=16;r6=2231;break L2994}else if((r36|0)!=0){r40=r34;r41=r33;r6=2225;break L2994}if(r30){break}do{if(HEAP8[r25]<<24>>24!=0){if((_strcmp(r25,5249700)|0)==0){break}if((_strcmp(r25,5255792)|0)!=0){break L2996}}}while(0);r36=HEAP32[1311336];if((r36|r35|0)!=0){r37=r34;r38=r33;r39=r36;break L2994}}do{if(r11){r35=_OpenFileByDirentry(r8);HEAP32[r3>>2]=r35;HEAP32[r10>>2]=r35;r35=_recurs_dos_loop(r1,r20,r21,r4)|r34;_free_stream(r31);r42=r35}else{r43=_handle_leaf(r8,r1,r4)|r34;r35=HEAP32[r32>>2];if((r35|0)==0){r42=r43;break}if((_strcmp(r35,5250368)|0)==0){r42=r43}else{r6=2223;break L2994}}}while(0);if(r2){r40=r42;r41=1;r6=2225;break}else{r33=1;r34=r42}}if(r6==2223){r26=r43|32;STACKTOP=r7;return r26}else if(r6==2225){r37=r40;r38=r41;r39=HEAP32[1311336]}else if(r6==2231){STACKTOP=r7;return r26}if((r39|0)==0){STACKTOP=r7;return r2&(r38|0)==0?8:r37}r26=r37|16;STACKTOP=r7;return r26}}while(0);r37=r1+40|0;r38=HEAP32[r37>>2];L3021:do{if((HEAP32[r38>>2]|0)==5265052){r44=r38}else{r39=r38;while(1){r6=HEAP32[r39+8>>2];if((HEAP32[r6>>2]|0)==5265052){r44=r6;break L3021}else{r39=r6}}}}while(0);HEAP32[r37>>2]=HEAP32[r44+44>>2];r26=_recurs_dos_loop(r1,r15+2|0,r16,r4);STACKTOP=r7;return r26}function _handle_leaf(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=r2>>2;r5=STACKTOP;STACKTOP=STACKTOP+4|0;r6=r5,r7=r6>>2;HEAP32[r7]=0;if((HEAP32[1311336]|0)!=0){r8=16;STACKTOP=r5;return r8}if((r3|0)!=0){r9=(r3+12|0)>>2;r10=HEAP32[r9];if((r10|0)==0){HEAP32[r3+8>>2]=_OpenFileByDirentry(r1);HEAP32[r9]=HEAP32[r9]+1|0;_free_stream(r3);r8=0;STACKTOP=r5;return r8}else if((r10|0)==1){_free_stream(r3+8|0);_fwrite(5260240,9,1,HEAP32[_stderr>>2]);r8=48;STACKTOP=r5;return r8}else{r8=48;STACKTOP=r5;return r8}}HEAP32[r4+11]=r1;r3=HEAP32[r4+6];if((HEAP8[r1+19|0]&16)<<24>>24==0){if((r3&1|0)!=0){r10=_OpenFileByDirentry(r1);HEAP32[r4+10]=r10;HEAP32[r7]=r10}r11=FUNCTION_TABLE[HEAP32[r4+2]](r1,r2)}else{if((r3&1025|0)!=0){r3=_OpenFileByDirentry(r1);HEAP32[r4+10]=r3;HEAP32[r7]=r3}r11=FUNCTION_TABLE[HEAP32[r4+1]](r1,r2)}_free_stream(r6);r6=HEAP32[r4+15];if((r6|0)==0){r12=0}else{r12=(_strcmp(r6,5250368)|0)!=0}r8=r12?r11|32:r11;STACKTOP=r5;return r8}function _concise_view_attrib(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=HEAP32[r2+16>>2];r2=r1+19|0;r4=HEAP8[r2];if((r4&32)<<24>>24==0){r5=r4}else{_fputc(65,HEAP32[_stdout>>2]);r5=HEAP8[r2]}if((r5&16)<<24>>24==0){r6=r5}else{_fputc(68,HEAP32[_stdout>>2]);r6=HEAP8[r2]}if((r6&4)<<24>>24==0){r7=r6}else{_fputc(83,HEAP32[_stdout>>2]);r7=HEAP8[r2]}if((r7&2)<<24>>24==0){r8=r7}else{_fputc(72,HEAP32[_stdout>>2]);r8=HEAP8[r2]}if((r8&1)<<24>>24!=0){_fputc(82,HEAP32[_stdout>>2])}if((HEAP32[r3+1240>>2]|0)==0){r9=HEAP32[_stdout>>2];r10=_fputc(10,r9);return 4}_fputc(32,HEAP32[_stdout>>2]);__fprintPwd(HEAP32[_stdout>>2],r1,0,0);r9=HEAP32[_stdout>>2];r10=_fputc(10,r9);return 4}function _mattrib(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1244|0;r5=r4,r4=r5>>2;r6=r5|0;HEAP8[r6]=0;r7=r5+1|0;HEAP8[r7]=-1;r8=(r5+1236|0)>>2;HEAP32[r8]=0;r9=r5+1240|0;HEAP32[r9>>2]=1;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){r10=0;r11=0;r12=0;break}_usage(0)}else{r10=0;r11=0;r12=0}}while(0);L3077:while(1){r13=r10;r14=r11;L3079:while(1){r15=r13;while(1){while(1){r16=_getopt_internal(r1,r2,5258012,0,0,0);if((r16|0)==104){r17=1;r18=104;break}else if((r16|0)==47){HEAP32[r8]=1;continue}else if((r16|0)==112){r13=r15;r14=1;continue L3079}else if((r16|0)==-1){r3=2290;break L3077}else if((r16|0)==63){r3=2289;break L3077}else if((r16|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r16|0)==88){r10=r15;r11=r14;r12=1;continue L3077}else{r3=2278;break}}if(r3==2278){r3=0;r17=r15;r18=r16}r19=_toupper(r18);if((r19|0)==65){r20=-33}else if((r19|0)==83){r20=-5}else if((r19|0)==72){r20=-3}else if((r19|0)==82){r20=-2}else{r3=2283;break L3077}HEAP8[r7]=HEAP8[r7]&r20;r15=r17}}}if(r3==2290){r17=HEAP32[1311165];if(!((r17|0)!=(r1|0)|(r15|0)==0)){_usage(0)}L3101:do{if((r17|0)<(r1|0)){r15=r17;L3102:while(1){r20=HEAP32[r2+(r15<<2)>>2];r18=HEAP8[r20]<<24>>24;L3104:do{if((r18|0)==43){r16=r20+1|0;r11=HEAP8[r16];if(r11<<24>>24==0){break}else{r21=r16;r22=r11}while(1){r11=_toupper(r22<<24>>24);if((r11|0)==72){r23=2}else if((r11|0)==82){r23=1}else if((r11|0)==65){r23=32}else if((r11|0)==83){r23=4}else{r3=2300;break L3102}HEAP8[r6]=HEAP8[r6]|r23;r11=r21+1|0;r16=HEAP8[r11];if(r16<<24>>24==0){break L3104}else{r21=r11;r22=r16}}}else if((r18|0)==45){r16=r20+1|0;r11=HEAP8[r16];if(r11<<24>>24==0){break}else{r24=r16;r25=r11}while(1){r11=_toupper(r25<<24>>24);if((r11|0)==72){r26=-3}else if((r11|0)==83){r26=-5}else if((r11|0)==82){r26=-2}else if((r11|0)==65){r26=-33}else{r3=2306;break L3102}HEAP8[r7]=HEAP8[r7]&r26;r11=r24+1|0;r16=HEAP8[r11];if(r16<<24>>24==0){break L3104}else{r24=r11;r25=r16}}}else{r27=r15;break L3101}}while(0);r20=HEAP32[1311165]+1|0;HEAP32[1311165]=r20;if((r20|0)<(r1|0)){r15=r20}else{r27=r20;break L3101}}if(r3==2300){_usage(1)}else if(r3==2306){_usage(1)}}else{r27=r17}}while(0);if(HEAP8[r7]<<24>>24==-1){r28=HEAP8[r6]<<24>>24==0&1}else{r28=0}if((r27|0)>=(r1|0)){_usage(1)}r27=r5+4|0;_init_mp(r27);if((r28|0)==0){HEAP32[r4+3]=102;HEAP32[r4+6]=2}else{do{if((r12|0)==0){r28=r5+12|0;if((r14|0)==0){HEAP32[r28>>2]=38;break}else{HEAP32[r28>>2]=154;break}}else{HEAP32[r4+3]=152;r28=HEAP32[1311165];do{if((r1-r28|0)>1){r29=1}else{if((HEAP32[r8]|0)!=0){r29=1;break}r29=(_strpbrk(HEAP32[r2+(r28<<2)>>2],5262444)|0)!=0}}while(0);HEAP32[r9>>2]=r29&1}}while(0);HEAP32[r4+6]=0}if((HEAP32[r8]|0)==0){HEAP32[r4+5]=r6;HEAP32[r4+7]=48;r8=HEAP32[1311165];r29=(r8<<2)+r2|0;r9=r1-r8|0;r14=_main_loop(r27,r29,r9);_exit(r14)}else{HEAP32[r4+2]=54;HEAP32[r4+5]=r6;HEAP32[r4+7]=1328;r8=HEAP32[1311165];r29=(r8<<2)+r2|0;r9=r1-r8|0;r14=_main_loop(r27,r29,r9);_exit(r14)}}else if(r3==2283){_usage(1)}else if(r3==2289){_usage(1)}}function _usage(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5262800,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _replay_attrib(r1,r2){var r3,r4,r5,r6,r7,r8;r2=STACKTOP;r3=r1+19|0;r4=HEAPU8[r3];do{if((r4&6|0)==0){r5=r4&48;if((r5|0)==48|(r5|0)==0){break}STACKTOP=r2;return 4}}while(0);_printf(5251688,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=HEAP8[r3];if((r4&48)<<24>>24==48){_printf(5250896,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r6=HEAP8[r3]}else{r6=r4}if((r6&48)<<24>>24==0){_printf(5250220,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=HEAP8[r3]}else{r7=r6}if((r7&4)<<24>>24==0){r8=r7}else{_printf(5249508,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=HEAP8[r3]}if((r8&2)<<24>>24!=0){_printf(5264096,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=HEAP32[_stdout>>2];_fputc(34,r8);__fprintPwd(r8,r1,0,1);_fputc(34,r8);_putchar(10);STACKTOP=r2;return 4}function _view_attrib(r1,r2){var r3,r4;r2=STACKTOP;_printf(5259544,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=r1+19|0;r4=HEAP32[_stdout>>2];if((HEAP8[r3]&32)<<24>>24==0){_fputc(32,r4)}else{_fputc(65,r4)}_fwrite(5259544,2,1,HEAP32[_stdout>>2]);r4=HEAP32[_stdout>>2];if((HEAP8[r3]&4)<<24>>24==0){_fputc(32,r4)}else{_fputc(83,r4)}r4=HEAP32[_stdout>>2];if((HEAP8[r3]&2)<<24>>24==0){_fputc(32,r4)}else{_fputc(72,r4)}r4=HEAP32[_stdout>>2];if((HEAP8[r3]&1)<<24>>24==0){_fputc(32,r4)}else{_fputc(82,r4)}_printf(5257788,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));__fprintPwd(HEAP32[_stdout>>2],r1,0,0);_putchar(10);STACKTOP=r2;return 4}function _attrib_file(r1,r2){var r3;r3=HEAP32[r2+16>>2];if((HEAP32[r1+4>>2]|0)==-3){return 4}r2=r1+19|0;HEAP8[r2]=HEAP8[r3+1|0]&HEAP8[r2]|HEAP8[r3];_dir_write(r1);return 4}function _recursive_attrib(r1,r2){FUNCTION_TABLE[HEAP32[r2+8>>2]](r1,r2);return FUNCTION_TABLE[HEAP32[r2>>2]](HEAP32[r2+40>>2],r2,5259008)}function _scan(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r7=STACKTOP;r8=r1+36|0;if((FUNCTION_TABLE[HEAP32[r8>>2]](r1,r3)|0)!=0){r9=0;STACKTOP=r7;return r9}r10=Math.imul(HEAP32[r1+24>>2],r3-2|0)+HEAP32[r1+88>>2]<<HEAP32[r1+144>>2];r11=HEAP32[1311321];r12=r2;r13=HEAP32[r2>>2];L3200:do{if((r6|0)==0){r2=HEAP32[r13>>2];L3210:do{if((r11|0)==0){r14=0}else{r15=r10;r16=r11;r17=HEAP32[1311322];r18=0;while(1){r19=FUNCTION_TABLE[r2](r12,r17,r15,r16);if((r19|0)<1){break}r20=r19+r18|0;if((r16|0)==(r19|0)){r14=r20;break L3210}else{r15=r19+r15|0;r16=r16-r19|0;r17=r17+r19|0;r18=r20}}r14=(r18|0)==0?r19:r18}}while(0);r2=HEAP32[1311321];if((r14|0)<(r2|0)){break}if((r5|0)==0){r9=0;STACKTOP=r7;return r9}r17=HEAP32[1311322];r16=0;while(1){if((r16|0)>=(r2|0)){r9=0;break}if(HEAP8[r17+r16|0]<<24>>24==HEAP8[r5+r16|0]<<24>>24){r16=r16+1|0}else{break L3200}}STACKTOP=r7;return r9}else{r16=HEAP32[r13+4>>2];L3202:do{if((r11|0)==0){r21=0}else{r17=r10;r2=r11;r15=r5;r20=0;while(1){r22=FUNCTION_TABLE[r16](r12,r15,r17,r2);if((r22|0)<1){break}r23=r22+r20|0;if((r2|0)==(r22|0)){r21=r23;break L3202}else{r17=r22+r17|0;r2=r2-r22|0;r15=r15+r22|0;r20=r23}}r21=(r20|0)==0?r22:r20}}while(0);if((r21|0)<(HEAP32[1311321]|0)){break}else{r9=0}STACKTOP=r7;return r9}}while(0);_printf(5249484,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r21=FUNCTION_TABLE[HEAP32[r8>>2]](r1,r3);FUNCTION_TABLE[HEAP32[r1+40>>2]](r1,r3,r4);r3=(r1+120|0)>>2;r1=HEAP32[r3];if((r1|0)==-1){r9=1;STACKTOP=r7;return r9}if((r21|0)==0){r24=r1}else{r21=r1+1|0;HEAP32[r3]=r21;r24=r21}if((r4|0)==0){r9=1;STACKTOP=r7;return r9}HEAP32[r3]=r24-1|0;r9=1;STACKTOP=r7;return r9}function _mbadblocks(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1316|0;r5=r4;r6=r4+1232;r7=r4+1236;r4=2;r8=0;r9=0;r10=0;r11=0;L3237:while(1){r12=r4;r13=r8;r14=r10;r15=r11;L3239:while(1){r16=r12;r17=r13;r18=r14;L3241:while(1){r19=r16;r20=r17;L3243:while(1){r21=r19;while(1){while(1){r22=_getopt_internal(r1,r2,5257676,0,0,0)<<24>>24;if((r22|0)==99){break L3241}else if((r22|0)==83){break}else if((r22|0)==104){r3=2410;break L3237}else if((r22|0)==-1){r3=2412;break L3237}else if((r22|0)==69){break L3243}else if((r22|0)==119){r19=r21;r20=1;continue L3243}else if((r22|0)==115){break L3239}else if((r22|0)!=105){r3=2411;break L3237}_set_cmd_line_image(HEAP32[1311167])}r21=_atoi(HEAP32[1311167])}}r16=r21;r17=r20;r18=_atoi(HEAP32[1311167])}if((r15|0)!=0){r3=2403;break L3237}r12=r21;r13=r20;r14=r18;r15=_strdup(HEAP32[1311167])}if((r15|0)!=0){r3=2406;break}r4=r21;r8=r20;r9=1;r10=r18;r11=_strdup(HEAP32[1311167])}if(r3==2410){_usage296(0)}else if(r3==2411){_usage296(1)}else if(r3==2412){r11=HEAP32[1311165];if((r11+1|0)!=(r1|0)){_usage296(1)}r1=HEAP32[r2+(r11<<2)>>2];if(HEAP8[r1]<<24>>24==0){_usage296(1)}if(HEAP8[r1+1|0]<<24>>24!=58){_usage296(1)}if(HEAP8[r1+2|0]<<24>>24!=0){_usage296(1)}_init_mp(r5);r5=HEAP8[HEAP32[r2+(HEAP32[1311165]<<2)>>2]];if(!HEAP8[5245232]){HEAP8[5245232]=1;_memset(5245772,0,1024);_atexit(160)}r1=_toupper(r5&255);r5=r1&255;r11=(r5<<2)+5245772|0;r10=HEAP32[r11>>2];do{if((r10|0)==0){r8=_fs_init(r1&255,2,0);r4=r8;if((r8|0)!=0){HEAP32[r11>>2]=r4;r23=r4;break}_fprintf(HEAP32[_stderr>>2],5249704,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r5,tempInt));HEAP32[r6>>2]=0;r24=HEAP32[_stderr>>2];r25=HEAP32[r2>>2];r26=_fprintf(r24,5252040,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r25,tempInt));_exit(1)}else{r23=r10}}while(0);r10=_OpenRoot(r23);HEAP32[r6>>2]=r10;if((r10|0)==0){r24=HEAP32[_stderr>>2];r25=HEAP32[r2>>2];r26=_fprintf(r24,5252040,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r25,tempInt));_exit(1)}r25=r10;while(1){if((HEAP32[r25>>2]|0)==5264944){r27=r25;break}r10=HEAP32[r25+8>>2];if((r10|0)==0){r27=0;break}else{r25=r10}}r25=r27;r10=(r27+24|0)>>2;r24=(r27+28|0)>>2;r26=Math.imul(HEAP32[r24],HEAP32[r10]);HEAP32[1311321]=r26;r2=_malloc(r26);HEAP32[1311322]=r2;if((r2|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r28=1;r29=r6;r30=_free_stream(r29);_exit(r28)}r2=(r20|0)!=0;L3293:do{if(r2){r20=_malloc(HEAP32[1311321]*311&-1);HEAP32[1311162]=r20;if((r20|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r28=1;r29=r6;r30=_free_stream(r29);_exit(r28)}else{_srandom(_time(0));if((HEAP32[1311321]*311&-1|0)==0){break}else{r31=0}while(1){r20=_random()&255;HEAP8[HEAP32[1311162]+r31|0]=r20;r20=r31+1|0;if(r20>>>0<(HEAP32[1311321]*311&-1)>>>0){r31=r20}else{break L3293}}}}}while(0);r31=r27+88|0;r20=r27+8|0;r26=r27+144|0;r23=0;while(1){if(r23>>>0>=HEAP32[r31>>2]>>>0){r3=2441;break}r5=HEAP32[r20>>2];r32=FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]>>2]](r5,HEAP32[1311322],r23<<HEAP32[r26>>2],HEAP32[r24]);if((r32|0)<0){r3=2438;break}if((r32|0)<(HEAP32[r24]|0)){r3=2440;break}else{r23=r23+1|0}}if(r3==2441){r23=HEAP32[r27+68>>2]+1|0;r26=r21>>>0<2?2:r21;r21=(r27+92|0)>>2;r5=HEAP32[r21]+2|0;r11=r18>>>0>r5>>>0|(r18|0)==0?r5:r18;if((r15|0)==0){r18=HEAP32[r20>>2];r20=HEAP32[r18+8>>2];r5=(r20|0)==0?r18:r20;r20=r5;HEAP32[1311321]=Math.imul(HEAP32[r24],HEAP32[r10]);r24=r26>>>0>=r11>>>0;r18=HEAP32[1311336];r1=(r18|0)!=0;r4=r24|r1;if(!r2){if(r4){r28=0;r29=r6;r30=_free_stream(r29);_exit(r28)}else{r33=0;r34=r26}while(1){if(((r34>>>0)%10|0)==0){r2=HEAP32[r21];_fprintf(HEAP32[_stderr>>2],5264064,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r34,HEAP32[tempInt+4>>2]=r2,tempInt))}r2=_scan(r25,r20,r34,r23,0,0)|r33;r8=r34+1|0;if(r8>>>0>=r11>>>0|(HEAP32[1311336]|0)!=0){r28=r2;break}else{r33=r2;r34=r8}}r29=r6;r30=_free_stream(r29);_exit(r28)}L3321:do{if(r4){r35=0;r36=r1;r37=r18}else{r34=0;r33=r26;while(1){if(((r33>>>0)%10|0)==0){r8=HEAP32[r21];_fprintf(HEAP32[_stderr>>2],5264064,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r33,HEAP32[tempInt+4>>2]=r8,tempInt))}r8=_scan(r25,r20,r33,r23,HEAP32[1311162]+Math.imul((r33>>>0)%311,HEAP32[1311321])|0,1)|r34;r2=r33+1|0;r14=HEAP32[1311336];r13=(r14|0)!=0;if(r2>>>0>=r11>>>0|r13){r35=r8;r36=r13;r37=r14;break L3321}else{r34=r8;r33=r2}}}}while(0);if(r36){r38=r37}else{FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+32>>2]](r20);r38=HEAP32[1311336]}if(r24|(r38|0)!=0){r28=r35;r29=r6;r30=_free_stream(r29);_exit(r28)}else{r39=r35;r40=r26}while(1){if(((r40>>>0)%10|0)==0){r26=HEAP32[r21];_fprintf(HEAP32[_stderr>>2],5264064,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r40,HEAP32[tempInt+4>>2]=r26,tempInt))}r26=_scan(r25,r20,r40,r23,HEAP32[1311162]+Math.imul((r40>>>0)%311,HEAP32[1311321])|0,0)|r39;r35=r40+1|0;if(r35>>>0>=r11>>>0|(HEAP32[1311336]|0)!=0){r28=r26;break}else{r39=r26;r40=r35}}r29=r6;r30=_free_stream(r29);_exit(r28)}r40=_fopen(r15,5259996);if((r40|0)==0){r39=HEAP32[_stderr>>2];r11=_strerror(HEAP32[___errno_location()>>2]);_fprintf(r39,5252356,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r15,HEAP32[tempInt+4>>2]=r11,tempInt));r28=1;r29=r6;r30=_free_stream(r29);_exit(r28)}r11=r7|0;if((_fgets(r11,80,r40)|0)==0){r28=0;r29=r6;r30=_free_stream(r29);_exit(r28)}r15=(r9|0)==0;r9=r27+36|0;r39=r27+40|0;r20=r27+120|0;r27=r20;r35=(r23|0)==0;r26=0;L3347:while(1){while(1){r38=_strtoul(r7+_strspn(r11,5251684)|0,0,0);if(r15){r41=r38}else{r41=Math.floor(((r38-HEAP32[r31>>2]|0)>>>0)/(HEAP32[r10]>>>0))+2|0}if((r41|0)<2){_fwrite(5250872,20,1,HEAP32[_stderr>>2])}else{if(r41>>>0<HEAP32[r21]>>>0){break}_fwrite(5250200,18,1,HEAP32[_stderr>>2])}if((_fgets(r11,80,r40)|0)==0){r28=r26;r3=2492;break L3347}}r38=FUNCTION_TABLE[HEAP32[r9>>2]](r25,r41);do{if((r38|0)==0){r24=FUNCTION_TABLE[HEAP32[r9>>2]](r25,r41);FUNCTION_TABLE[HEAP32[r39>>2]](r25,r41,r23);r5=HEAP32[r27>>2];if((r5|0)==-1){break}if((r24|0)==0){r42=r5}else{r24=r5+1|0;HEAP32[r20>>2]=r24;r42=r24}if(r35){break}HEAP32[r20>>2]=r42-1|0}else{r24=HEAP32[_stderr>>2];if((r38|0)==(r23|0)){_fprintf(r24,5263428,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r41,tempInt));break}else{_fprintf(r24,5262776,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r41,tempInt));break}}}while(0);if((_fgets(r11,80,r40)|0)==0){r28=1;r3=2494;break}else{r26=1}}if(r3==2492){r29=r6;r30=_free_stream(r29);_exit(r28)}else if(r3==2494){r29=r6;r30=_free_stream(r29);_exit(r28)}}else if(r3==2438){_perror(5259208);r28=r32;r29=r6;r30=_free_stream(r29);_exit(r28)}else if(r3==2440){_fwrite(5256532,25,1,HEAP32[_stderr>>2]);r28=1;r29=r6;r30=_free_stream(r29);_exit(r28)}}else if(r3==2406){_fwrite(5261276,46,1,HEAP32[_stderr>>2]);_exit(1)}else if(r3==2403){_fwrite(5261276,46,1,HEAP32[_stderr>>2]);_exit(1)}}function _usage296(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5261712,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mcd_callback(r1,r2){var r3;r2=_open_mcwd(5256508);if((r2|0)==0){_fwrite(5253764,39,1,HEAP32[_stderr>>2]);r3=16;return r3}else{__fprintPwd(r2,r1,0,0);_fputc(10,r2);_fclose(r2);r3=36;return r3}}function _dos_to_unix(r1,r2){var r3,r4;if((HEAP32[HEAP32[r2+16>>2]+36>>2]|0)!=0){r3=__unix_write(r2,1,5250368);return r3}r1=_mpBuildUnixFilename(r2);if((r1|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r3=16;return r3}else{r4=__unix_write(r2,1,r1);_free(r1);r3=r4;return r3}}function _mcat(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+18324|0;r5=r4,r6=r5>>2;r7=r4+72;r8=r4+2120;r9=r4+2320,r10=r9>>2;r11=r4+2324;HEAP32[1311251]=1;if((r1|0)<2){_usage303()}r4=HEAP32[r2+4>>2];do{if(HEAP8[r4]<<24>>24==45){if(HEAP8[r4+1|0]<<24>>24==119){r12=2;r13=1;break}_usage303()}else{r12=1;r13=0}}while(0);if((r1-r12|0)<1){_usage303()}r1=HEAP32[r2+(r12<<2)>>2];r12=HEAP8[r1];if(r12<<24>>24==0){_usage303()}if(HEAP8[r1+1|0]<<24>>24!=58){_usage303()}if(HEAP8[r1+2|0]<<24>>24!=0){_usage303()}r1=r8|0;r8=_toupper(r12<<24>>24)<<24>>24;_sprintf(r1,5262168,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r8,tempInt));HEAP32[r10]=0;r12=HEAP32[1311840];r2=r5;r4=r12|0;L3418:do{if((HEAP32[r4>>2]|0)==0){r14=r12}else{r15=r9;r16=r7|0;r17=r4;while(1){r18=r17;_free_stream(r15);if((HEAP8[r17+4|0]<<24>>24|0)==(r8|0)){_memcpy(r2,r17,72);_expand(HEAP32[r17>>2],r16);r19=_FloppydOpen(r5,r16,r13,r1,0);HEAP32[r10]=r19;if((r19|0)!=0){r14=r18;break L3418}r19=_SimpleFileOpen(r5,r18,r16,r13,r1,0,1,0);HEAP32[r10]=r19;if((r19|0)!=0){r14=r18;break L3418}}r20=r17+72|0;if((HEAP32[r20>>2]|0)==0){break}else{r17=r20}}r14=r20}}while(0);if(HEAP8[r14+4|0]<<24>>24==0){_free_stream(r9);_fprintf(HEAP32[_stderr>>2],5259332,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));_exit(1)}if((r13|0)!=1){r13=HEAP32[r10];r1=r13|0;r14=r11|0;r20=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]>>2]](r13,r14,0,16e3);if((r20|0)==0){r21=r9;r22=_free_stream(r21);_exit(0)}else{r23=0;r24=r20}while(1){_fwrite(r14,1,r24,HEAP32[_stdout>>2]);r20=r24+r23|0;r5=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]>>2]](r13,r14,r20,16e3);if((r5|0)==0){break}else{r23=r20;r24=r5}}r21=r9;r22=_free_stream(r21);_exit(0)}r24=HEAP32[r6+4];r23=Math.imul(Math.imul(HEAP32[r6+6]<<9,HEAP32[r6+5]),r24);r24=r11|0;r11=(r23|0)==0;r6=HEAP32[r10];r10=r6|0;r14=0;while(1){if(r11){r25=16e3}else{r25=(r14+16e3|0)>>>0>r23>>>0?r23-r14|0:16e3}r13=_fread(r24,1,r25,HEAP32[_stdin>>2]);if((r13|0)==0){r3=2548;break}r1=FUNCTION_TABLE[HEAP32[HEAP32[r10>>2]+4>>2]](r6,r24,r14,r13);_fprintf(HEAP32[_stderr>>2],5259184,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));if((r1|0)<0){r3=2547;break}else{r14=r13+r14|0}}if(r3==2548){r21=r9;r22=_free_stream(r21);_exit(0)}else if(r3==2547){r21=r9;r22=_free_stream(r21);_exit(0)}}function _usage303(){var r1;r1=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r1,tempInt));_fwrite(5253804,29,1,HEAP32[_stderr>>2]);_fwrite(5252308,36,1,HEAP32[_stderr>>2]);_exit(1)}function _mcd(r1,r2,r3){var r4;r3=STACKTOP;STACKTOP=STACKTOP+1232|0;r4=r3;if((r1|0)>2){r3=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r3,tempInt));_fprintf(HEAP32[_stderr>>2],5262276,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2>>2],tempInt));_exit(1)}_init_mp(r4);HEAP32[r4+24>>2]=272;HEAP32[r4+4>>2]=12;if((r1|0)==1){_puts(r4+72|0);_exit(0)}else{_exit(_main_loop(r4,r2+4|0,1))}}function _mclasserase(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+6248|0;r5=r4;r6=r4+72;r7=r4+4168;r8=r4+4172;r9=r4+6220;r10=r4+6224;r11=r4+6236;r12=r4+6240;r13=r4+6244;_destroy_privs();do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage340(0)}}while(0);if((r1-2|0)>>>0>1&(r1|0)!=4){_puts(5243240);_usage340(1)}else{r14=0}L3463:while(1){while(1){r4=_getopt_internal(r1,r2,5262268,0,0,0);if((r4|0)==63){r3=2567;break L3463}else if((r4|0)==-1){r3=2562;break L3463}else if((r4|0)==104){r3=2566;break L3463}else if((r4|0)==100){break}else if((r4|0)!=112){continue}_puts(5243176)}_puts(5243208);_puts(5243224);_puts(5243208);r14=1}if(r3==2567){_usage340(1)}else if(r3==2562){r4=HEAP32[1311165];do{if((r4|0)<(r1|0)){r15=r4;while(1){r16=HEAP32[r2+(r15<<2)>>2];r17=HEAP8[r16];if(r17<<24>>24==0){r3=2606;break}if(HEAP8[r16+1|0]<<24>>24!=58){r3=2607;break}r18=_toupper(r17<<24>>24);r17=HEAP32[1311165]+1|0;HEAP32[1311165]=r17;if((r17|0)<(r1|0)){r15=r17}else{r3=2572;break}}if(r3==2572){r19=r18&255;break}else if(r3==2606){_usage340(1)}else if(r3==2607){_usage340(1)}}else{r19=97}}while(0);r18=r8|0;r8=r10|0;r10=r11|0;r11=r12|0;HEAP8[r13|0]=-1;HEAP8[r13+1|0]=0;HEAP8[r13+2|0]=-1;r12=(r14|0)==1;if(r12){_printf(5252276,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=3,HEAP32[tempInt+4>>2]=-1,HEAP32[tempInt+8>>2]=0,HEAP32[tempInt+12>>2]=-1,tempInt))}r1=_find_device(r19,0,r5,r6,r18,r7,0,0);HEAP32[r9>>2]=r1;if((r1|0)==0){_exit(1)}_free_stream(r9);_sprintf(r8,5251668,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6+43|0,tempInt));if(r12){_printf(5250836,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r18,tempInt));_printf(5250168,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r8,tempInt))}r6=_tolower(r19<<24>>24);_sprintf(r10,5249472,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt));r6=0;r19=0;while(1){if(r12){r9=HEAP8[r13+r19|0]<<24>>24;_printf(5263988,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r19+1|0,HEAP32[tempInt+4>>2]=r9,tempInt))}r9=_fopen(r18,5263424);if((r9|0)==0){r3=2583;break}if(r12){_puts(5242960);_puts(5242916);_printf(5261264,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_fflush(HEAP32[_stdout>>2])}r1=r13+r19|0;L3500:do{if((_feof(r9)|0)==0){r7=r6;while(1){if((_ferror(r9)|0)!=0){r20=r7;break L3500}_fputc(HEAP8[r1]<<24>>24,r9);r5=r7+1|0;do{if((r5|0)>32768){_fflush(r9);if(!r12){r21=0;break}_putchar(46);_fflush(HEAP32[_stdout>>2]);r21=0}else{r21=r5}}while(0);if((_feof(r9)|0)==0){r7=r21}else{r20=r21;break L3500}}}else{r20=r6}}while(0);if(r12){_puts(5243356);_puts(5243324);if((_scanf(5259952,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11,tempInt))|0)<1){_puts(5243312)}_fflush(HEAP32[_stdin>>2]);if((_strcmp(r11,5259556)|0)==0){r3=2596;break}}_fclose(r9);r1=r19+1|0;if((r1|0)<3){r6=r20;r19=r1}else{r3=2598;break}}if(r3==2596){_puts(5243300);_exit(0)}else if(r3==2583){_perror(5262752);_exit(-1)}else if(r3==2598){do{if((r14|0)==0){if((_dup2(_open(5259164,1,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt)),3)|0)!=3){_puts(5243272)}if((_dup2(_open(5259164,1,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt)),2)|0)==2){break}_puts(5243272)}}while(0);if(!r12){r22=_execl(5258264,5260912,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r8,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=0,tempInt));_exit(-1)}_printf(5258680,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r8,HEAP32[tempInt+4>>2]=r10,tempInt));r22=_execl(5258264,5260912,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r8,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=0,tempInt));_exit(-1)}}else if(r3==2566){_usage340(0)}}function _usage340(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5257464,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mcopy(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1340|0;r6=r5,r5=r6>>2;HEAP32[r5+330]=-1;HEAP32[r5+332]=-2;HEAP32[r5+323]=0;HEAP32[r5+321]=1;HEAP32[r5+322]=0;HEAP32[r5+333]=104;HEAP32[r5+331]=-2;r7=r6|0;HEAP32[r7>>2]=0;r8=r6+8|0;HEAP32[r8>>2]=0;r9=r6+4|0;HEAP32[r9>>2]=0;r10=r6+28|0;HEAP32[r10>>2]=0;r11=r6+20|0;HEAP32[r11>>2]=0;r12=r6+32|0;HEAP32[r12>>2]=0;r13=r6+40|0;HEAP32[r13>>2]=0;r14=r6+36|0;HEAP32[r14>>2]=r3;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){r15=0;break}_usage367(0)}else{r15=0}}while(0);while(1){r16=_getopt_internal(r1,r2,5256312,0,0,0);if((r16|0)==109){HEAP32[r8>>2]=1;r15=r15;continue}else if((r16|0)==68){r17=HEAP8[HEAP32[1311167]]<<24>>24;r18=(_isupper(r17)|0)==0&1;r19=_tolower(r17)<<24>>24;if((r19|0)==115){HEAP32[((r18<<2)+1284>>2)+r5]=3;r15=r15;continue}else if((r19|0)==111){HEAP32[((r18<<2)+1284>>2)+r5]=6;r15=r15;continue}else if((r19|0)==109){HEAP32[((r18<<2)+1284>>2)+r5]=0;r15=r15;continue}else if((r19|0)==97){HEAP32[((r18<<2)+1284>>2)+r5]=1;r15=r15;continue}else if((r19|0)==114){HEAP32[((r18<<2)+1284>>2)+r5]=4;r15=r15;continue}else{r4=2637;break}}else if((r16|0)==111){r18=(_isupper(111)|0)==0&1;r19=_tolower(111)<<24>>24;if((r19|0)==115){HEAP32[((r18<<2)+1284>>2)+r5]=3;r15=r15;continue}else if((r19|0)==109){HEAP32[((r18<<2)+1284>>2)+r5]=0;r15=r15;continue}else if((r19|0)==114){HEAP32[((r18<<2)+1284>>2)+r5]=4;r15=r15;continue}else if((r19|0)==111){HEAP32[((r18<<2)+1284>>2)+r5]=6;r15=r15;continue}else if((r19|0)==97){HEAP32[((r18<<2)+1284>>2)+r5]=1;r15=r15;continue}else{r15=r15;continue}}else if((r16|0)==118){HEAP32[r12>>2]=1;r15=r15;continue}else if((r16|0)==84){HEAP32[r13>>2]=1}else if((r16|0)==112){HEAP32[r9>>2]=1;r15=r15;continue}else if((r16|0)==110){HEAP32[r10>>2]=1;r15=r15;continue}else if((r16|0)==115|(r16|0)==47){HEAP32[r7>>2]=1;r15=r15;continue}else if((r16|0)==104){r4=2638;break}else if((r16|0)==63){r4=2639;break}else if((r16|0)==-1){r4=2640;break}else if((r16|0)==105){_set_cmd_line_image(HEAP32[1311167]);r15=r15;continue}else if((r16|0)==66|(r16|0)==98){HEAP32[1312285]=1;r15=r15;continue}else if((r16|0)==81){r15=1;continue}else if(!((r16|0)==97|(r16|0)==116)){r15=r15;continue}HEAP32[r11>>2]=1;r15=r15}if(r4==2637){_usage367(1)}else if(r4==2638){_usage367(0)}else if(r4==2639){_usage367(1)}else if(r4==2640){if((r1-HEAP32[1311165]|0)<1){_usage367(1)}r4=r6+44|0;_init_mp(r4);HEAP32[r5+17]=305;HEAP32[r5+18]=r15;HEAP32[r5+15]=r6;HEAP32[r5+16]=0;r15=r6+1336|0;HEAP32[r15>>2]=0;do{if((r3|0)==0){r6=r1-1|0;r11=HEAP32[r2+(r6<<2)>>2];if((_strcmp(r11,5250368)|0)==0){HEAP32[r14>>2]=1;r20=r6;break}if((r1-HEAP32[1311165]|0)==1){HEAP32[r15>>2]=1;r21=5249700;r22=r1}else{r21=r11;r22=r6}_target_lookup(r4,r21);r6=(HEAP32[r5+25]|0)==0;do{if((HEAP32[r5+24]|0)==0){if(!r6){break}_fprintf(HEAP32[_stderr>>2],5253748,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r21,tempInt));_exit(1)}else{if(!r6){break}HEAP32[r5+12]=68;HEAP32[r5+13]=208;HEAP32[r5+14]=2;r23=r22;r24=HEAP32[1311165];r25=(r24<<2)+r2|0;r26=r23-r24|0;r27=_main_loop(r4,r25,r26);_exit(r27)}}while(0);HEAP32[r5+13]=212;HEAP32[r5+12]=114;HEAP32[r5+14]=58;r23=r22;r24=HEAP32[1311165];r25=(r24<<2)+r2|0;r26=r23-r24|0;r27=_main_loop(r4,r25,r26);_exit(r27)}else{r20=r1}}while(0);HEAP32[r5+26]=_strdup(5250368);HEAP32[r5+25]=_strdup(5260912);HEAP32[r5+13]=212;HEAP32[r5+12]=94;HEAP32[r5+14]=58;r23=r20;r24=HEAP32[1311165];r25=(r24<<2)+r2|0;r26=r23-r24|0;r27=_main_loop(r4,r25,r26);_exit(r27)}}function _usage367(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5258940,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_fprintf(HEAP32[_stderr>>2],5258584,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _unix_copydir(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=r2>>2;r4=STACKTOP;STACKTOP=STACKTOP+1432|0;r5=r4,r6=r5>>2;r7=r4+16;r8=r4+88;r9=r4+92,r10=r9>>2;r11=HEAP32[r3+4],r12=r11>>2;r13=HEAP32[r3+10];do{if((HEAP32[r12]|0)==0){if((HEAP32[r3+17]|0)==0){break}else{r14=0}STACKTOP=r4;return r14}}while(0);FUNCTION_TABLE[HEAP32[HEAP32[r13>>2]+20>>2]](r13,r8,0,0,0);if((HEAP32[r12+2]|0)==0){HEAP32[r8>>2]=0}r15=r11+36|0;do{if((HEAP32[r15>>2]|0)==0){if((HEAP32[r12+8]|0)==0){break}_fwrite(5259940,8,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);_fputc(10,HEAP32[_stderr>>2])}}while(0);if((HEAP32[1311336]|0)!=0){r14=16;STACKTOP=r4;return r14}r1=_mpBuildUnixFilename(r2);if((r1|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r14=16;STACKTOP=r4;return r14}L3609:do{if((HEAP32[r15>>2]|0)==0){r12=HEAP32[r3+15];do{if((r12|0)==0){r16=HEAP32[r3+11];if((r16|0)==0){r17=HEAP32[r3+12];r18=_strrchr(r17,47);r19=(r18|0)==0?r17:r18+1|0;break}r18=r2+208|0;r17=0;r20=r18;while(1){r21=HEAP8[r16+(r17+40)|0];if(r21<<24>>24==0){r22=r20;break}HEAP8[r20]=r21;r21=r20+1|0;r23=r17+1|0;if(r23>>>0<256){r17=r23;r20=r21}else{r22=r21;break}}HEAP8[r22]=0;r19=r18}else{r19=r12}}while(0);if(HEAP8[r19]<<24>>24==0){break}if((_mkdir(r1,511)|0)==0){break}do{if((HEAP32[___errno_location()>>2]|0)==17){if((_stat(r1,r7)|0)<0){break}if((HEAP32[r7+8>>2]&61440|0)==16384){break L3609}HEAP32[___errno_location()>>2]=20}}while(0);_perror(5259548);_fprintf(HEAP32[_stderr>>2],5259264,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));_free(r1);r14=16;STACKTOP=r4;return r14}}while(0);r7=r9;_memcpy(r7,r11,1340);HEAP32[r10+15]=r7;HEAP32[r10+25]=r1;HEAP32[r10+26]=0;HEAP32[r10+28]=1;r10=FUNCTION_TABLE[HEAP32[r3]](r13,r9+44|0,5259008);r9=HEAP32[r8>>2];if(!((_strcmp(r1,5250368)|0)==0|(r9|0)==0)){HEAP32[r6]=r9;HEAP32[r6+1]=0;HEAP32[r6+2]=r9;HEAP32[r6+3]=0;_utimes(r1,r5|0)}_free(r1);r14=r10|4;STACKTOP=r4;return r14}function _unix_to_unix(r1){var r2,r3,r4;if((HEAP32[HEAP32[r1+16>>2]+36>>2]|0)!=0){r2=__unix_write(r1,0,5250368);return r2}r3=_mpBuildUnixFilename(r1);if((r3|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r2=16;return r2}else{r4=__unix_write(r1,0,r3);_free(r3);r2=r4;return r2}}function _directory_dos_to_unix(r1,r2){return _unix_copydir(r1,r2)}function _dos_copydir(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1664|0;r6=r5,r7=r6>>2;r8=r5+16,r9=r8>>2;r10=r5+320,r11=r10>>2;r12=r5+1660;r13=HEAP32[r3+4],r14=r13>>2;r15=HEAP32[r3+15];do{if((r15|0)==0){r16=HEAP32[r3+11];if((r16|0)==0){r17=HEAP32[r3+12];r18=_strrchr(r17,47);r19=(r18|0)==0?r17:r18+1|0;break}r18=r2+208|0;r17=0;r20=r18;while(1){r21=HEAP8[r16+(r17+40)|0];if(r21<<24>>24==0){r22=r20;break}HEAP8[r20]=r21;r21=r20+1|0;r23=r17+1|0;if(r23>>>0<256){r17=r23;r20=r21}else{r22=r21;break}}HEAP8[r22]=0;r19=r18}else{r19=r15}}while(0);do{if((HEAP32[r14]|0)==0){if((HEAP32[r3+17]|0)==0){break}else{r24=0}STACKTOP=r5;return r24}}while(0);r15=(r1|0)!=0;L3660:do{if(r15){r22=r2+52|0;r20=HEAP32[r22>>2];r17=HEAP32[r3+10];L3662:do{if((r20|0)!=(r17|0)){r16=r20;while(1){r21=(HEAP32[r16>>2]|0)==5265052;L3665:do{if(r21){r25=r16}else{r23=r16;while(1){r26=HEAP32[r23+8>>2];if((HEAP32[r26>>2]|0)==5265052){r25=r26;break L3665}else{r23=r26}}}}while(0);if((HEAP32[r25+48>>2]|0)==-3){break L3660}L3670:do{if(r21){r27=r16}else{r23=r16;while(1){r26=HEAP32[r23+8>>2];if((HEAP32[r26>>2]|0)==5265052){r27=r26;break L3670}else{r23=r26}}}}while(0);r21=HEAP32[r27+44>>2];if((r21|0)==(r17|0)){break L3662}else{r16=r21}}}}while(0);_fwrite(5263952,34,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);_fwrite(5263384,36,1,HEAP32[_stderr>>2]);r17=HEAP32[_stderr>>2];r20=HEAP32[r22>>2];L3675:do{if((HEAP32[r20>>2]|0)==5265052){r28=r20}else{r18=r20;while(1){r16=HEAP32[r18+8>>2];if((HEAP32[r16>>2]|0)==5265052){r28=r16;break L3675}else{r18=r16}}}}while(0);__fprintPwd(r17,r28+44|0,0,0);_fputc(10,HEAP32[_stderr>>2]);r24=16;STACKTOP=r5;return r24}}while(0);r28=HEAP32[r14+21];if((FUNCTION_TABLE[HEAP32[HEAP32[r28>>2]+20>>2]](r28,r12,0,0,0)|0)<0){_fwrite(5252232,23,1,HEAP32[_stderr>>2]);r24=16;STACKTOP=r5;return r24}do{if((HEAP32[r14+9]|0)==0){if((HEAP32[r14+8]|0)==0){break}r28=HEAP32[_stderr>>2];r27=HEAP32[r3+11];if((r27|0)==0){r25=HEAP32[r3+12];r20=_strrchr(r25,47);r29=(r20|0)==0?r25:r20+1|0}else{r20=r2+208|0;r25=0;r22=r20;while(1){r18=HEAP8[r27+(r25+40)|0];if(r18<<24>>24==0){r30=r22;break}HEAP8[r22]=r18;r18=r22+1|0;r16=r25+1|0;if(r16>>>0<256){r25=r16;r22=r18}else{r30=r18;break}}HEAP8[r30]=0;r29=r20}_fprintf(r28,5250156,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r29,tempInt))}}while(0);do{if(r15){if((HEAP32[r14+1]|0)==0){HEAP8[r13+12|0]=0}else{HEAP8[r13+12|0]=HEAP8[r1+19|0]}if((HEAP32[r3+13]|0)!=(HEAP32[r1>>2]|0)){r4=2741;break}HEAP32[r14+330]=-1;HEAP32[r14+331]=HEAP32[r1+4>>2];break}else{HEAP8[r13+12|0]=0;r4=2741;break}}while(0);if(r4==2741){HEAP32[r14+330]=-1;HEAP32[r14+331]=-2}do{if((HEAP32[r14+2]|0)==0){if(HEAP8[5245768]){r31=5245764;break}_time(5245764);HEAP8[5245768]=1;r31=5245764}else{r31=r12}}while(0);r12=HEAP32[r31>>2];r31=r10;_memcpy(r31,r13,1340);r14=r10+44|0;HEAP32[r11+15]=r31;HEAP32[r11+26]=0;HEAP32[r11+28]=1;r31=r2+52|0;r2=HEAP32[r31>>2];L3712:do{if(HEAP8[r19]<<24>>24==0){HEAP32[r11+24]=r2;r32=r2;r4=2755;break}else{HEAP32[r9+1]=-1;HEAP32[r9]=r2;HEAP32[r9+74]=0;HEAP32[r9+75]=0;do{if((_vfat_lookup(r8,r19,-1,16,0,0)|0)==0){r1=_OpenFileByDirentry(r8);r15=r10+96|0;HEAP32[r15>>2]=r1;if((r1|0)==0){r33=r15;break}r34=r10+96|0;break L3712}else{r15=r10+96|0;HEAP32[r15>>2]=0;r33=r15}}while(0);r28=HEAP32[r31>>2];r20=HEAP8[r13+12|0];HEAP32[r7]=r28;HEAP8[r6+8|0]=r20;HEAP32[r7+3]=r12;do{if((_getfreeMinClusters(r28,1)|0)==0){r35=0}else{if((_mwrite_one(r28,r19,0,80,r6,r13+1276|0)|0)<1){r35=0;break}r35=HEAP32[r7+1]}}while(0);HEAP32[r33>>2]=r35;r32=HEAP32[r11+24];r4=2755;break}}while(0);do{if(r4==2755){if((r32|0)==0){r24=16}else{r34=r10+96|0;break}STACKTOP=r5;return r24}}while(0);r10=FUNCTION_TABLE[HEAP32[r3]](HEAP32[r3+10],r14,5259008);if(HEAP8[r19]<<24>>24!=0){_free_stream(r34)}r24=r10|4;STACKTOP=r5;return r24}function _dos_to_dos(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r3=HEAP32[r2+16>>2],r4=r3>>2;r5=HEAP32[r2+60>>2];do{if((r5|0)==0){r6=HEAP32[r2+44>>2];if((r6|0)==0){r7=HEAP32[r2+48>>2];r8=_strrchr(r7,47);r9=(r8|0)==0?r7:r8+1|0;break}r8=r2+208|0;r7=0;r10=r8;while(1){r11=HEAP8[r6+(r7+40)|0];if(r11<<24>>24==0){r12=r10;break}HEAP8[r10]=r11;r11=r10+1|0;r13=r7+1|0;if(r13>>>0<256){r7=r13;r10=r11}else{r12=r11;break}}HEAP8[r12]=0;r9=r8}else{r9=r5}}while(0);do{if((r1|0)==0){HEAP8[r3+12|0]=32;HEAP32[r4+6]=0;r14=r2+52|0}else{if((HEAP32[r4+1]|0)==0){HEAP8[r3+12|0]=32;HEAP32[r4+6]=0}else{HEAP8[r3+12|0]=HEAP8[r1+19|0];HEAP32[r4+6]=0}r5=r2+52|0;if((HEAP32[r5>>2]|0)!=(HEAP32[r1>>2]|0)){r14=r5;break}HEAP32[r4+330]=-1;HEAP32[r4+331]=HEAP32[r1+4>>2];r15=r5;r16=HEAP32[r15>>2];r17=r3+1276|0;r18=r17;r19=_mwrite_one(r16,r9,0,74,r3,r18);r20=(r19|0)==1;r21=r20?4:16;return r21}}while(0);HEAP32[r4+330]=-1;HEAP32[r4+331]=-2;r15=r14;r16=HEAP32[r15>>2];r17=r3+1276|0;r18=r17;r19=_mwrite_one(r16,r9,0,74,r3,r18);r20=(r19|0)==1;r21=r20?4:16;return r21}function _unix_to_dos(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=r1>>2;r3=HEAP32[r2+4],r4=r3>>2;r5=HEAP32[r2+15];do{if((r5|0)==0){r6=HEAP32[r2+11];if((r6|0)==0){r7=HEAP32[r2+12];r8=_strrchr(r7,47);r9=(r8|0)==0?r7:r8+1|0;break}r8=r1+208|0;r7=0;r10=r8;while(1){r11=HEAP8[r6+(r7+40)|0];if(r11<<24>>24==0){r12=r10;break}HEAP8[r10]=r11;r11=r10+1|0;r13=r7+1|0;if(r13>>>0<256){r7=r13;r10=r11}else{r12=r11;break}}HEAP8[r12]=0;r9=r8}else{r9=r5}}while(0);HEAP8[r3+12|0]=32;HEAP32[r4+6]=1;HEAP32[r4+330]=-1;HEAP32[r4+331]=-2;return(_mwrite_one(HEAP32[r2+13],r9,0,74,r3,r3+1276|0)|0)==1?4:16}function __unix_write(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+252|0;r6=r5,r7=r6>>2;r8=r5+16;r9=r5+20;r10=r5+24;r11=r5+28,r12=r11>>2;r13=r5+100;r14=r5+180;r15=HEAP32[r1+16>>2],r16=r15>>2;r17=HEAP32[r1+40>>2];r18=r17|0;FUNCTION_TABLE[HEAP32[HEAP32[r18>>2]+20>>2]](r17,r8,0,0,0);if((HEAP32[r16+2]|0)==0){HEAP32[r8>>2]=0}r19=r15+36|0;r15=r19>>2;do{if((HEAP32[r15]|0)==0){do{if(!((HEAP32[r16+7]|0)!=0|(r19|0)==0)){if((_access(r3,0)|0)!=0){break}if((HEAP32[r16+334]|0)!=0){_fprintf(HEAP32[_stderr>>2],5261584,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r20=16;STACKTOP=r5;return r20}do{if((_stat(r3,r11)|0)==0){if((HEAP32[r12+2]&61440|0)!=32768){_fprintf(HEAP32[_stderr>>2],5261228,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r20=16;STACKTOP=r5;return r20}r21=HEAP32[r18>>2];do{if((r21|0)!=5264904&(r21|0)!=5264868){r4=2803}else{r22=HEAP32[r17+88>>2];if((r22|0)==-1){r4=2803;break}else{r23=r22;break}}}while(0);if(r4==2803){_fwrite(5260828,26,1,HEAP32[_stderr>>2]);r23=-1}if((_fstat(r23,r14)|0)!=0){break}if((HEAP32[r12]|0)!=(HEAP32[r14>>2]|0)){break}if((HEAP32[r12+1]|0)!=(HEAP32[r14+4>>2]|0)){break}_fwrite(5260420,31,1,HEAP32[_stderr>>2]);r20=16;STACKTOP=r5;return r20}}while(0);if((_ask_confirmation(5260200,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt))|0)==0){break}else{r20=16}STACKTOP=r5;return r20}}while(0);if((HEAP32[r15]|0)!=0){break}if((HEAP32[r16+8]|0)==0){break}_fwrite(5259940,8,1,HEAP32[_stderr>>2]);r21=HEAP32[_stderr>>2];r22=HEAP32[r1+44>>2];if((r22|0)==0){_fputs(HEAP32[r1+64>>2],r21)}else{__fprintPwd(r21,r22,0,0)}_fputc(10,HEAP32[_stderr>>2])}}while(0);if((HEAP32[1311336]|0)!=0){r20=16;STACKTOP=r5;return r20}r1=r13|0;r13=_SimpleFileOpen(0,0,r3,1537,r1,0,0,0);HEAP32[r9>>2]=r13;if((r13|0)==0){_fprintf(HEAP32[_stderr>>2],5259332,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));r20=16;STACKTOP=r5;return r20}do{if((r2|0)==0){r4=2823}else{if((HEAP32[r16+5]|0)==0){r4=2823;break}if((r17|0)!=0){r1=r17+4|0;HEAP32[r1>>2]=HEAP32[r1>>2]+1|0}r1=_calloc(1,36),r14=r1>>2;if((r1|0)==0){HEAP32[r10>>2]=0;r24=1;break}else{HEAP32[r14]=5265016;HEAP32[r14+7]=0;HEAP32[r14+5]=0;HEAP32[r14+4]=0;HEAP32[r14+2]=r17;HEAP32[r14+1]=1;HEAP32[r14+3]=0;r14=r1;r25=r14;r26=r14;r4=2827;break}}}while(0);do{if(r4==2823){if((r17|0)!=0){r16=r17+4|0;HEAP32[r16>>2]=HEAP32[r16>>2]+1|0}r25=r17;r26=r17;r4=2827;break}}while(0);if(r4==2827){HEAP32[r10>>2]=r26;r24=(_copyfile(r25,r13)|0)<0}_free_stream(r10);_free_stream(r9);r9=(HEAP32[r15]|0)!=0;if(r24){if(r9){r20=16;STACKTOP=r5;return r20}_unlink(r3);r20=16;STACKTOP=r5;return r20}if(r9){r20=4;STACKTOP=r5;return r20}r9=HEAP32[r8>>2];if((r3|0)==0){r20=4;STACKTOP=r5;return r20}if((_strcmp(r3,5250368)|0)==0|(r9|0)==0){r20=4;STACKTOP=r5;return r20}HEAP32[r7]=r9;HEAP32[r7+1]=0;HEAP32[r7+2]=r9;HEAP32[r7+3]=0;_utimes(r3,r6|0);r20=4;STACKTOP=r5;return r20}function _wipeEntry(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+304|0;r4=r3;r5=HEAP32[r1>>2];r6=r4+4|0;HEAP32[r6>>2]=-1;r7=r4|0;HEAP32[r7>>2]=r5;HEAP32[r4+296>>2]=0;HEAP32[r4+300>>2]=0;r8=HEAP32[r1+296>>2];r9=r1+300|0;if((r8|0)>=(HEAP32[r9>>2]|0)){r10=r1+8|0;HEAP8[r10]=-27;_dir_write(r1);STACKTOP=r3;return}r11=r4+8|0;r12=r8;r8=r5;while(1){HEAP32[r6>>2]=r12;r5=r8;r13=HEAP32[HEAP32[r8>>2]>>2];r14=r12<<5;r15=32;r16=r11;r17=0;while(1){r18=FUNCTION_TABLE[r13](r5,r16,r14,r15);if((r18|0)<1){r2=2853;break}r19=r18+r17|0;if((r15|0)==(r18|0)){r20=r19;break}else{r14=r18+r14|0;r15=r15-r18|0;r16=r16+r18|0;r17=r19}}if(r2==2853){r2=0;r20=(r17|0)==0?r18:r17}if((r20|0)<0){r2=2861;break}HEAP8[r11]=-27;_dir_write(r4);r16=r12+1|0;if((r16|0)>=(HEAP32[r9>>2]|0)){r2=2859;break}r12=r16;r8=HEAP32[r7>>2]}if(r2==2859){r10=r1+8|0;HEAP8[r10]=-27;_dir_write(r1);STACKTOP=r3;return}else if(r2==2861){r10=r1+8|0;HEAP8[r10]=-27;_dir_write(r1);STACKTOP=r3;return}}function _writeit(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;r7=r5+4;r8=r5+8;r9=r5+12;r10=r5+16;r11=r5+20;r12=r5+24;r13=r5+28,r14=r13>>2;r15=r3+84|0;r16=HEAP32[r15>>2];if((FUNCTION_TABLE[HEAP32[HEAP32[r16>>2]+20>>2]](r16,r11,r12,r9,0)|0)<0){_fwrite(5252232,23,1,HEAP32[_stderr>>2]);r17=-1;STACKTOP=r5;return r17}if((HEAP32[r12>>2]|0)<=-1){_fprintf(HEAP32[_stderr>>2],5251648,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r17=1;STACKTOP=r5;return r17}r16=(HEAP32[r3+32>>2]|0)!=0;if((HEAP32[r9>>2]|0)!=0){if(!r16){r17=-1;STACKTOP=r5;return r17}_fprintf(HEAP32[_stderr>>2],5250812,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r17=-1;STACKTOP=r5;return r17}if(r16){_fprintf(HEAP32[_stderr>>2],5250156,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt))}if((HEAP32[1311336]|0)!=0){r17=-1;STACKTOP=r5;return r17}r2=r3+96|0;r16=HEAP32[r2>>2];r9=HEAP32[r12>>2];r12=r16;L3883:do{if((HEAP32[r16>>2]|0)==5264944){r18=r12}else{r19=r12;while(1){r20=HEAP32[r19+8>>2];if((HEAP32[r20>>2]|0)==5264944){r18=r20;break L3883}else{r19=r20}}}}while(0);r12=Math.imul(HEAP32[r18+24>>2],HEAP32[r18+28>>2]);if((_getfreeMinClusters(r16,(((r9>>>0)%(r12>>>0)|0)!=0&1)+Math.floor((r9>>>0)/(r12>>>0))|0)|0)==0){r17=-1;STACKTOP=r5;return r17}do{if((HEAP32[r3+8>>2]|0)==0){if(HEAP8[5245768]){r21=5245764;break}_time(5245764);HEAP8[5245768]=1;r21=5245764}else{r21=r11}}while(0);r11=HEAP32[r21>>2];r21=r3+12|0;r12=HEAP8[r21];HEAP32[r6>>2]=r11;r9=_localtime(r6)>>2;r6=r4+8|0;r16=r1|0;_strncpy(r6,r16,8);r18=r4+16|0;r19=r1+8|0;_strncpy(r18,r19,3);r1=r4+19|0;HEAP8[r1]=r12;r12=r4+21|0;HEAP8[r12]=0;r20=HEAP32[r9+1];r22=(HEAP32[r9]|0)/2&-1;r23=(HEAP32[r9+2]<<3)+(r20>>>3)&255;r24=r4+31|0;HEAP8[r24]=r23;r25=r4+23|0;HEAP8[r25]=r23;r23=(r20<<5)+r22&255;r22=r4+30|0;HEAP8[r22]=r23;r20=r4+22|0;HEAP8[r20]=r23;r23=HEAP32[r9+4]+1|0;r26=HEAP32[r9+3];r27=(HEAP32[r9+5]<<1)+(r23>>>3)+96&255;r9=r4+33|0;HEAP8[r9]=r27;r28=r4+25|0;HEAP8[r28]=r27;r29=r4+27|0;HEAP8[r29]=r27;r27=(r23<<5)+r26&255;r26=r4+32|0;HEAP8[r26]=r27;r23=r4+24|0;HEAP8[r23]=r27;r30=r4+26|0;HEAP8[r30]=r27;r27=r4+34|0;r31=r4+35|0;HEAP8[r31]=0;HEAP8[r27]=1;r32=r4+28|0;r33=r4+29|0;HEAP8[r33]=0;HEAP8[r32]=0;r34=r4+36|0;r35=r4+39|0;r36=r4+38|0;r37=r4+37|0;r38=r34;tempBigInt=0;HEAP8[r38]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r38+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r38+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r38+3|0]=tempBigInt&255;r38=_OpenFileByDirentry(r4);HEAP32[r8>>2]=r38;if((r38|0)==0){_fwrite(5253056,22,1,HEAP32[_stderr>>2]);_exit(1)}r4=r3+24|0;r39=r3+20|0;if((HEAP32[r39>>2]&HEAP32[r4>>2]|0)==0){r40=r38}else{r3=_calloc(1,36),r41=r3>>2;if((r3|0)==0){r42=0}else{HEAP32[r41]=5265016;HEAP32[r41+7]=0;HEAP32[r41+5]=0;HEAP32[r41+4]=0;HEAP32[r41+2]=r38;HEAP32[r41+1]=1;HEAP32[r41+3]=0;r42=r3}HEAP32[r8>>2]=r42;r40=r42}r42=_copyfile(HEAP32[r15>>2],r40);FUNCTION_TABLE[HEAP32[HEAP32[r40>>2]+20>>2]](r40,0,r13,0,r10);_free_stream(r8);if((HEAP32[r39>>2]&HEAP32[r4>>2]|0)!=0){HEAP32[r14]=HEAP32[r14]+1|0}if((r42|0)<0){_fat_free(HEAP32[r2>>2],HEAP32[r10>>2]);r17=-1;STACKTOP=r5;return r17}r2=HEAP32[r10>>2];r10=HEAP32[r14];if((r10|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r14=HEAP8[r21];HEAP32[r7>>2]=r11;r11=_localtime(r7)>>2;_strncpy(r6,r16,8);_strncpy(r18,r19,3);HEAP8[r1]=r14;HEAP8[r12]=0;r12=HEAP32[r11+1];r14=(HEAP32[r11]|0)/2&-1;r1=(HEAP32[r11+2]<<3)+(r12>>>3)&255;HEAP8[r24]=r1;HEAP8[r25]=r1;r1=(r12<<5)+r14&255;HEAP8[r22]=r1;HEAP8[r20]=r1;r1=HEAP32[r11+4]+1|0;r20=HEAP32[r11+3];r22=(HEAP32[r11+5]<<1)+(r1>>>3)+96&255;HEAP8[r9]=r22;HEAP8[r28]=r22;HEAP8[r29]=r22;r22=(r1<<5)+r20&255;HEAP8[r26]=r22;HEAP8[r23]=r22;HEAP8[r30]=r22;HEAP8[r31]=(r2&65535)>>>8&255;HEAP8[r27]=r2&255;HEAP8[r33]=r2>>>24&255;HEAP8[r32]=r2>>>16&255;HEAP8[r35]=r10>>>24&255;HEAP8[r36]=r10>>>16&255;HEAP8[r37]=r10>>>8&255;HEAP8[r34]=r10&255;r17=0;STACKTOP=r5;return r17}function _mdel(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1240|0;r6=r5;r7=r5+8,r5=r7>>2;r8=r6+4|0;HEAP32[r8>>2]=0;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage377(0)}}while(0);while(1){r9=_getopt_internal(r1,r2,5252800,0,0,0);if((r9|0)==118){HEAP32[r8>>2]=1;continue}else if((r9|0)==104){r4=2906;break}else if((r9|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r9|0)==-1){r4=2908;break}else{r4=2907;break}}if(r4==2907){_usage377(1)}else if(r4==2906){_usage377(0)}else if(r4==2908){if((HEAP32[1311165]|0)==(r1|0)){_usage377(1)}_init_mp(r7);HEAP32[r5+2]=36;HEAP32[r5+4]=r6;HEAP32[r5+5]=2;HEAP32[r6>>2]=r3;if((r3|0)==1){HEAP32[r5+6]=16;r10=272}else if((r3|0)==0){HEAP32[r5+6]=32;r10=288}else if((r3|0)==2){HEAP32[r5+6]=48;r10=304}else{r10=HEAP32[r5+6]|256}HEAP32[r5+6]=r10;r10=HEAP32[1311165];if((r10|0)<(r1|0)){r11=r10}else{r12=r10;r13=(r12<<2)+r2|0;r14=r1-r12|0;r15=_main_loop(r7,r13,r14);_exit(r15)}while(1){r10=HEAP32[r2+(r11<<2)>>2];do{if(HEAP8[r10]<<24>>24==0){r4=2918}else{if(HEAP8[r10+1|0]<<24>>24==58){r16=2;break}else{r4=2918;break}}}while(0);if(r4==2918){r4=0;r16=0}r5=_strlen(r10+r16|0);do{if((r5|0)>1){r3=r10+(r16-1)+r5|0;if(HEAP8[r3]<<24>>24!=47){break}HEAP8[r3]=0}}while(0);r5=r11+1|0;if((r5|0)==(r1|0)){break}else{r11=r5}}r12=HEAP32[1311165];r13=(r12<<2)+r2|0;r14=r1-r12|0;r15=_main_loop(r7,r13,r14);_exit(r15)}}function _usage377(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5250112,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _del_file(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+2580|0;r5=r4;r6=r4+1040,r7=r6>>2;r8=r4+1344;r9=r4+1348;r10=r2+16|0;r11=HEAP32[r10>>2];_memcpy(r9,r2,1232);HEAP32[r9+16>>2]=r11;r2=r1+19|0;if((HEAP8[r2]&16)<<24>>24==0){r12=r11}else{r13=_OpenFileByDirentry(r1);HEAP32[r8>>2]=r13;HEAP32[r7+1]=-1;HEAP32[r7]=r13;HEAP32[r7+74]=0;HEAP32[r7+75]=0;r7=r4+1024|0;r13=_vfat_lookup(r6,5259008,1,48,r7,0);L3955:do{if((r13|0)==0){r14=r11;while(1){r15=HEAP8[r7];if(!(r15<<24>>24==-27|r15<<24>>24==0|r15<<24>>24==46)){if((HEAP32[r14>>2]|0)!=2){r3=2934;break}if((HEAP32[1311336]|0)!=0){break}r16=_del_file(r6,r9);if((r16&16|0)!=0){r3=2939;break}}r15=_vfat_lookup(r6,5259008,1,48,r7,0);if((r15|0)!=0){r17=r15;r3=2937;break L3955}}if(r3==2934){_fwrite(5259068,10,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);_fwrite(5256368,11,1,HEAP32[_stderr>>2])}else if(r3==2939){_free_stream(r8);if((r16|0)==0){break}else{r18=r16}STACKTOP=r4;return r18}_free_stream(r8);r18=16;STACKTOP=r4;return r18}else{r17=r13;r3=2937}}while(0);do{if(r3==2937){_free_stream(r8);if((r17|0)==-2){r18=16}else{break}STACKTOP=r4;return r18}}while(0);r12=HEAP32[r10>>2]}r10=r5|0;if((HEAP32[1311336]|0)!=0){r18=16;STACKTOP=r4;return r18}if((HEAP32[r1+4>>2]|0)==-3){_fwrite(5253680,29,1,HEAP32[_stderr>>2]);r18=16;STACKTOP=r4;return r18}if((HEAP32[r12+4>>2]|0)!=0){_fwrite(5252220,9,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);_fputc(10,HEAP32[_stderr>>2])}do{if((HEAP8[r2]&5)<<24>>24!=0){r12=0;r5=r10;while(1){r17=HEAP8[r1+(r12+40)|0];if(r17<<24>>24==0){r19=r5;break}HEAP8[r5]=r17;r17=r5+1|0;r8=r12+1|0;if(r8>>>0<255){r12=r8;r5=r17}else{r19=r17;break}}HEAP8[r19]=0;if((_ask_confirmation(5251548,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311159],HEAP32[tempInt+4>>2]=r10,tempInt))|0)==0){break}else{r18=16}STACKTOP=r4;return r18}}while(0);if((_fatFreeWithDir(HEAP32[r1>>2],r1+8|0)|0)!=0){r18=16;STACKTOP=r4;return r18}_wipeEntry(r1);r18=4;STACKTOP=r4;return r18}function _list_recurs_directory(r1,r2){var r3,r4,r5,r6,r7,r8;r1=STACKTOP;STACKTOP=STACKTOP+1232|0;r3=r1;r4=r3;r5=r2;_memcpy(r4,r5,1232);r6=r3+24|0;HEAP32[r6>>2]=48;HEAP32[r3+4>>2]=56;HEAP32[r3+8>>2]=56;r7=r2|0;r8=r2+40|0;r2=FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r8>>2],r3,5259008);_memcpy(r4,r5,1232);HEAP32[r6>>2]=401;r6=FUNCTION_TABLE[HEAP32[r7>>2]](HEAP32[r8>>2],r3,5259008)|r2;STACKTOP=r1;return r6}function _list_non_recurs_directory(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+1232|0;r4=r3;if((HEAP32[r2+68>>2]|0)!=0){r5=_list_file(r1,r2);STACKTOP=r3;return r5}r1=r2+40|0;if((_enterDirectory(HEAP32[r1>>2])|0)!=0){r5=16;STACKTOP=r3;return r5}_memcpy(r4,r2,1232);HEAP32[r4+4>>2]=HEAP32[r4+8>>2];r5=FUNCTION_TABLE[HEAP32[r2>>2]](HEAP32[r1>>2],r4,5259008)|4;STACKTOP=r3;return r5}function _mdir(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1236|0;r5=r4,r6=r5>>2;r7=r4+1232|0;HEAP32[r7>>2]=5249700;HEAP8[5247632]=0;HEAP8[5243524]=0;HEAP8[5249208]=0;HEAP8[5242880]=0;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage420(0)}}while(0);while(1){r4=_getopt_internal(r1,r2,5262092,0,0,0);if((r4|0)==-1){r3=2983;break}else if((r4|0)==98|(r4|0)==88){HEAP8[5247632]=1;continue}else if((r4|0)==100){HEAP8[5247612]=1;continue}else if((r4|0)==104){r3=2981;break}else if((r4|0)==102){HEAP8[5246824]=1;continue}else if((r4|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r4|0)==97){HEAP8[5249208]=1;continue}else if((r4|0)==119){HEAP8[5242880]=1;continue}else if((r4|0)==115|(r4|0)==47){HEAP8[5243524]=1;continue}else{r3=2982;break}}if(r3==2983){if((HEAP32[1311165]|0)==(r1|0)){HEAP32[1311165]=0;r8=1;r9=r7}else{r8=r1;r9=r2}_init_mp(r5);HEAP8[5247616]=0;HEAP32[1311905]=0;HEAP32[1316235]=0;HEAP32[1311839]=0;r2=r5+24|0;if(HEAP8[5243524]){HEAP32[r2>>2]=1296;HEAP32[r6+1]=134}else{HEAP32[r2>>2]=1072;HEAP32[r6+1]=190;HEAP32[r6+2]=56}HEAP32[r6+9]=5245496;HEAP32[r6+8]=5245480;r6=HEAP32[1311165];r2=_main_loop(r5,(r6<<2)+r9|0,r8-r6|0);if((HEAP32[1311905]|0)==0){_leaveDrive(r2);_exit(r2)}do{if((r2|0)==0){r6=HEAP32[1311839];if(!((r6|0)==0|(r6|0)==5262736)){_free(HEAP32[1311714])}if(HEAP8[5242880]){_fputc(10,HEAP32[_stdout>>2])}if(HEAP8[5247632]){break}_printSummary(HEAP32[1311702],HEAP32[1312207])}}while(0);_free_stream(5247620);_leaveDrive(r2);_exit(r2)}else if(r3==2981){_usage420(0)}else if(r3==2982){_usage420(1)}}function _usage420(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5254668,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_fprintf(HEAP32[_stderr>>2],5254448,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _list_file(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r2=STACKTOP;STACKTOP=STACKTOP+1128|0;r3=r2;r4=r2+8;r5=r2+12;r6=r2+16;r7=r2+20;r8=r2+32;r9=r2+68;r10=r2+104;do{if(!HEAP8[5249208]){if((HEAP8[r1+19|0]&6)<<24>>24==0){break}else{r11=0}STACKTOP=r2;return r11}}while(0);do{if(HEAP8[5247632]){r12=r1+40|0;if(HEAP8[r12]<<24>>24==0){r11=0;STACKTOP=r2;return r11}if((_strcmp(r12,5249700)|0)==0){r11=0;STACKTOP=r2;return r11}if((_strcmp(r12,5255792)|0)==0){r11=0}else{break}STACKTOP=r2;return r11}}while(0);r12=r1|0;if((_enterDirectory(HEAP32[r12>>2])|0)!=0){r11=16;STACKTOP=r2;return r11}do{if(HEAP8[5242880]){r13=HEAP32[_stdout>>2];if(((HEAP32[1311702]|0)%5|0)==0){_fputc(10,r13);break}else{_fputc(32,r13);break}}}while(0);r13=r1+19|0;if((HEAP8[r13]&16)<<24>>24==0){r14=HEAPU8[r1+37|0]<<8|HEAPU8[r1+36|0]|(HEAPU8[r1+39|0]<<8|HEAPU8[r1+38|0])<<16}else{r14=0}r15=HEAPU8[r1+20|0];r16=(r15&24|0)==0&(HEAP32[1311261]|0)!=0?r15|24:r15;r15=HEAP32[r12>>2];r12=(FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+28>>2]](r15)|0)>>2;r15=HEAP8[r1+16|0];do{if(r15<<24>>24==0){r17=0}else{if(r15<<24>>24<32|r15<<24>>24==127){HEAP8[r6|0]=HEAP8[HEAP32[r12]+(r15&127)|0]}else{HEAP8[r6|0]=r15}r18=HEAP8[r1+17|0];if(r18<<24>>24==0){r17=1;break}if(r18<<24>>24<32|r18<<24>>24==127){HEAP8[r6+1|0]=HEAP8[HEAP32[r12]+(r18&127)|0]}else{HEAP8[r6+1|0]=r18}r18=HEAP8[r1+18|0];if(r18<<24>>24==0){r17=2;break}if(r18<<24>>24<32|r18<<24>>24==127){HEAP8[r6+2|0]=HEAP8[HEAP32[r12]+(r18&127)|0];r17=3;break}else{HEAP8[r6+2|0]=r18;r17=3;break}}}while(0);HEAP8[r6+r17|0]=0;if((r16&16|0)!=0){r17=r6|0;HEAP8[r17]=_tolower(HEAP8[r17]<<24>>24)&255;r17=r6+1|0;HEAP8[r17]=_tolower(HEAP8[r17]<<24>>24)&255;r17=r6+2|0;HEAP8[r17]=_tolower(HEAP8[r17]<<24>>24)&255}HEAP8[r6+3|0]=0;r17=r7|0;r15=0;while(1){r18=HEAP8[r1+(r15+8)|0];if(r18<<24>>24==0){r19=r15;break}if(r18<<24>>24<32|r18<<24>>24==127){HEAP8[r7+r15|0]=HEAP8[HEAP32[r12]+(r18&127)|0]}else{HEAP8[r7+r15|0]=r18}r18=r15+1|0;if(r18>>>0<8){r15=r18}else{r19=r18;break}}HEAP8[r7+r19|0]=0;if((r16&8|0)!=0){HEAP8[r17]=_tolower(HEAP8[r17]<<24>>24)&255;r16=r7+1|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+2|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+3|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+4|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+5|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+6|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255;r16=r7+7|0;HEAP8[r16]=_tolower(HEAP8[r16]<<24>>24)&255}HEAP8[r7+8|0]=0;do{if(HEAP8[5242880]){if((HEAP8[r13]&16)<<24>>24==0){_printf(5261560,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5245480,tempInt));break}else{r16=13-_strlen(5245480)|0;_printf(5262224,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=5245480,HEAP32[tempInt+4>>2]=r16,HEAP32[tempInt+8>>2]=5260912,tempInt));break}}else{if(HEAP8[5247632]){r16=r10|0;r19=0;r15=r16;while(1){r12=HEAP8[r1+(r19+40)|0];if(r12<<24>>24==0){r20=r15;break}HEAP8[r15]=r12;r12=r15+1|0;r18=r19+1|0;if(r18>>>0<255){r19=r18;r15=r12}else{r20=r12;break}}HEAP8[r20]=0;_printf(5258576,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311839],HEAP32[tempInt+4>>2]=r16,tempInt));if((HEAP8[r13]&16)<<24>>24!=0){_fputc(47,HEAP32[_stdout>>2])}_fputc(10,HEAP32[_stdout>>2]);break}r15=r8|0;r19=HEAP8[r17];do{if(r19<<24>>24==0){r21=r15}else{HEAP8[r15]=r19;r12=r8+1|0;r18=HEAP8[r7+1|0];if(r18<<24>>24==0){r21=r12;break}HEAP8[r12]=r18;r18=r8+2|0;r12=HEAP8[r7+2|0];if(r12<<24>>24==0){r21=r18;break}HEAP8[r18]=r12;r12=r8+3|0;r18=HEAP8[r7+3|0];if(r18<<24>>24==0){r21=r12;break}HEAP8[r12]=r18;r18=r8+4|0;r12=HEAP8[r7+4|0];if(r12<<24>>24==0){r21=r18;break}HEAP8[r18]=r12;r12=r8+5|0;r18=HEAP8[r7+5|0];if(r18<<24>>24==0){r21=r12;break}HEAP8[r12]=r18;r18=r8+6|0;r12=HEAP8[r7+6|0];if(r12<<24>>24==0){r21=r18;break}HEAP8[r18]=r12;r12=r8+7|0;r18=HEAP8[r7+7|0];if(r18<<24>>24==0){r21=r12;break}HEAP8[r12]=r18;r21=r8+8|0}}while(0);HEAP8[r21]=0;r16=r9|0;r18=HEAP8[r6|0];do{if(r18<<24>>24==0){r22=r16}else{HEAP8[r16]=r18;r12=r9+1|0;r23=HEAP8[r6+1|0];if(r23<<24>>24==0){r22=r12;break}HEAP8[r12]=r23;r23=r9+2|0;r12=HEAP8[r6+2|0];if(r12<<24>>24==0){r22=r23;break}HEAP8[r23]=r12;r22=r9+3|0}}while(0);HEAP8[r22]=0;do{if(r19<<24>>24==32){_printf(5261212,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((HEAP32[1311263]|0)==0){_printf(5260412,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r15,HEAP32[tempInt+4>>2]=r16,tempInt));break}else{_printf(5260776,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5245480,tempInt));break}}}while(0);if((HEAP8[r13]&16)<<24>>24==0){_printf(5259932,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt))}else{_printf(5260188,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}_putchar(32);r16=r1+33|0;_sprintf(r3|0,5257896,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=(HEAPU8[r16]>>>1)+1980|0,tempInt));r19=r1+32|0;_sprintf(r4|0,5257636,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP8[r19]&31,tempInt));_sprintf(r5|0,5257636,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r16]<<3&8|HEAPU8[r19]>>>5,tempInt));r18=HEAP32[1311265];r12=HEAP8[r18];L4145:do{if(r12<<24>>24!=0){r23=r18;r24=r12;while(1){do{if((_strncasecmp(r23,5257456,4)|0)==0){_printf(5257896,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=(HEAPU8[r16]>>>1)+1980|0,tempInt));r25=r23+3|0}else{if((_strncasecmp(r23,5257300,2)|0)==0){_printf(5257636,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=(((HEAPU8[r16]>>>1)+1980|0)>>>0)%100,tempInt));r25=r23+1|0;break}if((_strncasecmp(r23,5257080,2)|0)==0){_printf(5257636,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP8[r19]&31,tempInt));r25=r23+1|0;break}if((_strncasecmp(r23,5256756,2)|0)==0){_printf(5257636,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r16]<<3&8|HEAPU8[r19]>>>5,tempInt));r25=r23+1|0;break}else{_fputc(r24<<24>>24,HEAP32[_stdout>>2]);r25=r23;break}}}while(0);r26=r25+1|0;r27=HEAP8[r26];if(r27<<24>>24==0){break L4145}else{r23=r26;r24=r27}}}}while(0);_printf(5259544,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r19=HEAP8[r1+31|0];r16=r19&255;r12=r16>>>3;if((HEAP32[1311254]|0)==0){r18=(r19&255)>103?r12-12|0:r12;r28=(r18|0)==0?12:r18;r29=(r19&255)>95?112:97}else{r28=r12;r29=32}r12=HEAPU8[r1+30|0]>>>5|r16<<3&56;_printf(5258248,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r28,HEAP32[tempInt+4>>2]=r12,HEAP32[tempInt+8>>2]=r29,tempInt));if(HEAP8[5247612]){r12=HEAPU8[r1+35|0]<<8|HEAPU8[r1+34|0];_printf(5259256,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r15,HEAP32[tempInt+4>>2]=r12,tempInt))}if(HEAP8[5245496]<<24>>24!=0){_printf(5259160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5245496,tempInt))}_putchar(10)}}while(0);HEAP32[1311701]=HEAP32[1311701]+1|0;HEAP32[1311702]=HEAP32[1311702]+1|0;HEAP32[1312206]=HEAP32[1312206]+r14|0;HEAP32[1312207]=HEAP32[1312207]+r14|0;r11=4;STACKTOP=r2;return r11}function _leaveDrive(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;if(HEAP8[5247616]<<24>>24==0){STACKTOP=r2;return}if((HEAP32[1311905]|0)!=0){do{if((r1|0)==0){r4=HEAP32[1311839];if(!((r4|0)==0|(r4|0)==5262736)){_free(HEAP32[1311714])}if(HEAP8[5242880]){_fputc(10,HEAP32[_stdout>>2])}if(HEAP8[5247632]){break}_printSummary(HEAP32[1311702],HEAP32[1312207])}}while(0);_free_stream(5247620)}do{if((r1|0)==0&(HEAP8[5247632]^1)){if((HEAP32[1311838]|0)>1){_puts(5243140);_printSummary(HEAP32[1311701],HEAP32[1312206])}r4=HEAP32[1316235];if((r4|0)==0|HEAP8[5246824]){break}HEAP32[r3>>2]=0;r5=_getfree(r4);if((r5|0)==-1){_fwrite(5256348,10,1,HEAP32[_stderr>>2]);break}r4=_dotted_num(r5,17,r3);_printf(5253616,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));r4=HEAP32[r3>>2];if((r4|0)==0){break}_free(r4)}}while(0);_free_stream(5264940);HEAP8[5247616]=0;STACKTOP=r2;return}function _printSummary(r1,r2){var r3,r4,r5;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;if((HEAP32[1311702]|0)==0){_puts(5243164);STACKTOP=r3;return}HEAP32[r4>>2]=0;_printf(5263936,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));r5=HEAP32[_stdout>>2];if((r1|0)==1){_fputc(32,r5)}else{_fputc(115,r5)}r5=_dotted_num(r2,13,r4);_printf(5263364,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r5,tempInt));r5=HEAP32[r4>>2];if((r5|0)==0){STACKTOP=r3;return}_free(r5);STACKTOP=r3;return}function _dotted_num(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r4=r3>>2;r3=STACKTOP;r5=r2<<1;r6=_malloc(r5|1);HEAP32[r4]=r6;if((r6|0)==0){r7=5260912;STACKTOP=r3;return r7}r8=(r1>>>0)%1e9;if(r1>>>0>999999999&(r5|0)>9){r9=Math.floor((r1>>>0)/1e9);_sprintf(r6,5250800,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r5-9|0,HEAP32[tempInt+4>>2]=r9,HEAP32[tempInt+8>>2]=r8,tempInt))}else{_sprintf(r6,5250104,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r5,HEAP32[tempInt+4>>2]=r8,tempInt))}r8=HEAP32[r4];r5=r8+1|0;L4223:do{if(HEAP8[r5]<<24>>24!=0){r6=r8;r9=r5;while(1){if(HEAP8[r6]<<24>>24!=48){break L4223}HEAP8[r6]=32;r1=r9+1|0;if(HEAP8[r1]<<24>>24==0){break L4223}else{r6=r9;r9=r1}}}}while(0);r5=HEAP32[r4];r8=_strlen(r5);r9=r5+r8|0;r6=r8+1|0;r1=r5+r6|0;L4228:do{if((r6|0)<4){r10=r1;r11=r9}else{r12=r1;r13=r9;while(1){if(((HEAP8[r13-1|0]<<24>>24)-48|0)>>>0>=10){r10=r12;r11=r13;break L4228}r14=r13-3|0;r15=r12-4|0;if(r15>>>0<(r5+4|0)>>>0){r10=r15;r11=r14;break L4228}else{r12=r15;r13=r14}}}}while(0);L4233:do{if(r10>>>0<r9>>>0){r1=r10;r6=r11;while(1){HEAP8[r1]=HEAP8[r6];HEAP8[r1+1|0]=HEAP8[r6+1|0];HEAP8[r1+2|0]=HEAP8[r6+2|0];r13=r1+3|0;r12=HEAP32[r4];if(r13>>>0<(r12+r8|0)>>>0){HEAP8[r13]=32;r16=HEAP32[r4]}else{r16=r12}r12=r1+4|0;if(r12>>>0<(r16+r8|0)>>>0){r1=r12;r6=r6+3|0}else{r17=r16;break L4233}}}else{r17=r5}}while(0);r7=r17+(r8-r2)|0;STACKTOP=r3;return r7}function _enterDirectory(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+584|0;r4=r3,r5=r4>>2;r6=r3+304;r7=r3+320;r8=HEAP32[1311905];if((r8|0)==(r1|0)){r9=0;STACKTOP=r3;return r9}if((r8|0)!=0){r8=HEAP32[1311839];if(!((r8|0)==0|(r8|0)==5262736)){_free(HEAP32[1311714])}if(HEAP8[5242880]){_fputc(10,HEAP32[_stdout>>2])}if(!HEAP8[5247632]){_printSummary(HEAP32[1311702],HEAP32[1312207])}_free_stream(5247620)}r8=r1;L4257:do{if((HEAP32[r1>>2]|0)==5264944){r10=r8}else{r11=r8;while(1){r12=HEAP32[r11+8>>2];if((HEAP32[r12>>2]|0)==5264944){r10=r12;break L4257}else{r11=r12}}}}while(0);r11=HEAP8[r10+96|0];if(HEAP8[5247616]<<24>>24!=r11<<24>>24){_leaveDrive(0);HEAP8[5247616]=r11;r10=r6|0;r6=r7|0;L4263:do{if((r1|0)==0){r13=0}else{r7=r8;while(1){if((HEAP32[r7>>2]|0)==5264944){r13=r7;break L4263}r12=HEAP32[r7+8>>2];if((r12|0)==0){r13=0;break L4263}else{r7=r12}}}}while(0);r8=_OpenRoot(r13);HEAP32[1316235]=r8;do{if(!HEAP8[5247632]){HEAP32[r5+1]=-1;HEAP32[r5]=r8;HEAP32[r5+74]=0;HEAP32[r5+75]=0;r7=_vfat_lookup(r4,0,0,72,r10,r6);do{if((r7|0)==0){r12=r11<<24>>24;if(HEAP8[r6]<<24>>24==0){_printf(5255764,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r12,HEAP32[tempInt+4>>2]=r10,tempInt));break}else{_printf(5256040,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r12,HEAP32[tempInt+4>>2]=r6,HEAP32[tempInt+8>>2]=r10,tempInt));break}}else if((r7|0)==-2){r9=-1;STACKTOP=r3;return r9}else{_printf(5256252,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11<<24>>24,tempInt))}}while(0);if((HEAP32[r13+16>>2]|0)==0){break}r7=HEAP32[r13+20>>2];_printf(5255480,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r7>>>16,HEAP32[tempInt+4>>2]=r7&65535,tempInt))}}while(0);HEAP32[1312206]=0;HEAP32[1311701]=0;HEAP32[1311838]=0}if((r1|0)!=0){r13=r1+4|0;HEAP32[r13>>2]=HEAP32[r13>>2]+1|0}HEAP32[1311905]=r1;L4284:do{if((HEAP32[r1>>2]|0)==5265052){r14=r1}else{r13=r1;while(1){r11=HEAP32[r13+8>>2];if((HEAP32[r11>>2]|0)==5265052){r14=r11;break L4284}else{r13=r11}}}}while(0);r1=r14+44|0;r14=r1;if((HEAP32[r1+4>>2]|0)==-3){r15=4}else{r1=r14;r13=0;while(1){r16=r13+_strlen(r1+40|0)+1|0;r11=HEAP32[r1>>2];L4291:do{if((HEAP32[r11>>2]|0)==5265052){r17=r11}else{r10=r11;while(1){r6=HEAP32[r10+8>>2];if((HEAP32[r6>>2]|0)==5265052){r17=r6;break L4291}else{r10=r6}}}}while(0);r11=r17+44|0;if((HEAP32[r11+4>>2]|0)==-3){break}else{r1=r11;r13=r16}}r15=r16+4|0}r16=_malloc(r15);do{if((r16|0)==0){HEAP32[1311714]=0;r18=5262736;r2=3182;break}else{HEAP8[_sprintPwd(r14,r16)]=0;HEAP32[1311714]=r16;r15=HEAP8[5247632];if(HEAP8[r16+3|0]<<24>>24==0&r15){HEAP8[r16+2|0]=0;r18=HEAP32[1311714];r2=3182;break}else{HEAP32[1311839]=r16;if(r15){break}else{r19=r16;r2=3184;break}}}}while(0);do{if(r2==3182){r16=HEAP8[5247632];HEAP32[1311839]=r18;if(r16){break}else{r19=r18;r2=3184;break}}}while(0);do{if(r2==3184){_printf(5256488,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r19,tempInt));if(HEAP8[5242880]|HEAP8[5247632]){break}_putchar(10)}}while(0);HEAP32[1311838]=HEAP32[1311838]+1|0;HEAP32[1312207]=0;HEAP32[1311702]=0;r9=0;STACKTOP=r3;return r9}function _dos_doctorfat(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=HEAP32[r2+40>>2];L4311:do{if((HEAP32[r3>>2]|0)==5265052){r4=r3}else{r5=r3;while(1){r6=HEAP32[r5+8>>2];if((HEAP32[r6>>2]|0)==5265052){r4=r6;break L4311}else{r5=r6}}}}while(0);r3=HEAP32[r4+8>>2];r4=HEAP32[r2+16>>2],r2=r4>>2;if((HEAP32[r2+326]|0)!=0){r7=r4+1316|0;r8=r7,r9=r8>>2;HEAP32[r9]=r3;return 4}if((HEAP32[r1+4>>2]|0)==-3){r7=r4+1316|0;r8=r7,r9=r8>>2;HEAP32[r9]=r3;return 4}r5=r4+1300|0;r6=HEAP32[r5>>2];HEAP8[r1+35|0]=(r6&65535)>>>8&255;HEAP8[r1+34|0]=r6&255;r6=HEAP32[r5>>2];HEAP8[r1+29|0]=r6>>>24&255;HEAP8[r1+28|0]=r6>>>16&255;if((HEAP32[r2+327]|0)!=0){r6=HEAP32[r2+328];HEAP8[r1+39|0]=r6>>>24&255;HEAP8[r1+38|0]=r6>>>16&255;HEAP8[r1+37|0]=r6>>>8&255;HEAP8[r1+36|0]=r6&255}_dir_write(r1);r7=r4+1316|0;r8=r7,r9=r8>>2;HEAP32[r9]=r3;return 4}function _unix_doctorfat(r1){_fwrite(5260536,33,1,HEAP32[_stderr>>2]);return 16}function _file_mdu(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;r4=HEAP32[r2+16>>2];r2=HEAP32[r1>>2];r5=r2;L4327:do{if((HEAP32[r2>>2]|0)==5264944){r6=r5}else{r7=r5;while(1){r8=HEAP32[r7+8>>2];if((HEAP32[r8>>2]|0)==5264944){r6=r8;break L4327}else{r7=r8}}}}while(0);r7=HEAPU8[r1+35|0]<<8|HEAPU8[r1+34|0];do{if((HEAP32[r6+72>>2]|0)==32){if((HEAP32[r6+108>>2]|0)==0){r9=r7;break}r9=(HEAPU8[r1+29|0]<<8|HEAPU8[r1+28|0])<<16|r7}else{r9=r7}}while(0);L4335:do{if((r2|0)==0){r10=0}else{r7=r5;while(1){if((HEAP32[r7>>2]|0)==5264944){r10=r7;break L4335}r6=HEAP32[r7+8>>2];if((r6|0)==0){r10=0;break L4335}else{r7=r6}}}}while(0);r5=__countBlocks(r10,r9);do{if((HEAP32[r4>>2]|0)==0){if((HEAP32[r4+4>>2]|0)==0){break}r11=r4+24|0;r12=r11,r13=r12>>2;r14=HEAP32[r13];r15=r14+r5|0;HEAP32[r13]=r15;STACKTOP=r3;return 4}}while(0);__fprintPwd(HEAP32[_stdout>>2],r1,0,0);_printf(5256304,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r5,tempInt));r11=r4+24|0;r12=r11,r13=r12>>2;r14=HEAP32[r13];r15=r14+r5|0;HEAP32[r13]=r15;STACKTOP=r3;return 4}function _mdoctorfat(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1324|0;r5=r4,r6=r5>>2;r7=r4+1320,r4=r7>>2;HEAP32[r6+320]=-1;HEAP32[r6+322]=-2;HEAP32[r6+313]=0;HEAP32[r6+311]=1;HEAP32[r6+312]=0;HEAP32[r6+323]=104;HEAP32[r6+321]=-2;r8=(r5+1304|0)>>2;HEAP32[r8]=0;r9=r5+1308|0;HEAP32[r9>>2]=0;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage426(0)}}while(0);r10=r5+1312|0;r11=0;L4350:while(1){while(1){r12=_getopt_internal(r1,r2,5254224,0,0,0);if((r12|0)==115){HEAP32[r9>>2]=1;HEAP32[r10>>2]=_strtoul(HEAP32[1311167],0,0);continue}else if((r12|0)==63){r3=3228;break L4350}else if((r12|0)==98){HEAP32[r8]=1;continue}else if((r12|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r12|0)==-1){r3=3229;break L4350}else if((r12|0)==111){break}else if((r12|0)==104){r3=3227;break L4350}else{continue}}r11=_strtoul(HEAP32[1311167],0,0)}if(r3==3228){_usage426(1)}else if(r3==3229){if((r1-HEAP32[1311165]|0)<2){_usage426(1)}r10=r5+4|0;_init_mp(r10);HEAP32[r6+5]=r5;HEAP32[r6+3]=216;HEAP32[r6+4]=124;HEAP32[r6+7]=49;HEAP32[r6+6]=2;HEAP32[r6+325]=_strtoul(HEAP32[r2+(HEAP32[1311165]+1<<2)>>2],0,0)+r11|0;r9=_main_loop(r10,(HEAP32[1311165]<<2)+r2|0,1);if((r9|0)!=0){_exit(r9)}r9=HEAP32[1311165]+1|0;if((r9|0)>=(r1|0)){_exit(0)}r10=r5+1316|0;r5=0;r12=r9;while(1){r9=HEAP32[r2+(r12<<2)>>2];r13=HEAP8[r9]<<24>>24==60?r9+1|0:r9;r9=_strtoul(r13,r7,0);r14=HEAP32[r4];do{if((r14|0)==0){r15=r13;r16=r9;r17=0}else{if(HEAP8[r14]<<24>>24!=45){r15=r13;r16=r9;r17=r14;break}r18=r14+1|0;r15=r18;r16=_strtoul(r18,r7,0);r17=HEAP32[r4]}}while(0);if((r17|0)==(r15|0)){r3=3240;break}do{if((r17|0)==0){r19=r17}else{if(HEAP8[r17]<<24>>24!=62){r19=r17;break}r14=r17+1|0;HEAP32[r4]=r14;r19=r14}}while(0);if((r19|0)!=0){if(HEAP8[r19]<<24>>24!=0){r3=3247;break}}L4385:do{if((r9|0)>(r16|0)){r20=r5}else{r14=r5;r13=r9;while(1){do{if((HEAP32[r8]|0)==0){if((r14|0)==0){r21=r13+r11|0;break}else{r18=HEAP32[r10>>2];r22=r13+r11|0;FUNCTION_TABLE[HEAP32[r18+40>>2]](r18,r14,r22);r21=r22;break}}else{r22=HEAP32[r10>>2];FUNCTION_TABLE[HEAP32[r22+40>>2]](r22,r13+r11|0,HEAP32[r22+68>>2]^14);r21=r14}}while(0);r22=r13+1|0;if((r22|0)>(r16|0)){r20=r21;break L4385}else{r14=r21;r13=r22}}}}while(0);r9=r12+1|0;if((r9|0)<(r1|0)){r5=r20;r12=r9}else{r3=3254;break}}if(r3==3240){_fprintf(HEAP32[_stderr>>2],5261776,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r17,tempInt));_exit(-1)}else if(r3==3254){if((r20|0)==0){_exit(0)}if((HEAP32[r8]|0)!=0){_exit(0)}r8=HEAP32[r6+329];FUNCTION_TABLE[HEAP32[r8+40>>2]](r8,r20,HEAP32[r8+64>>2]);_exit(0)}else if(r3==3247){_fprintf(HEAP32[_stderr>>2],5261776,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r19,tempInt));_exit(-1)}}else if(r3==3227){_usage426(0)}}function _usage426(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5253568,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mdu(r1,r2,r3){var r4,r5,r6,r7,r8;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1260|0;r5=r4,r4=r5>>2;r6=(r5|0)>>2;HEAP32[r6]=0;HEAP32[r4+1]=0;r7=(r5+8|0)>>2;HEAP32[r7]=0;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage435(0)}}while(0);while(1){r8=_getopt_internal(r1,r2,5253836,0,0,0);if((r8|0)==104){r3=3270;break}else if((r8|0)==-1){r3=3272;break}else if((r8|0)==63){r3=3271;break}else if((r8|0)==115){HEAP32[r7]=1;continue}else if((r8|0)==97){HEAP32[r6]=1;continue}else if((r8|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else{continue}}if(r3==3270){_usage435(0)}else if(r3==3272){if((HEAP32[1311165]|0)>=(r1|0)){_usage435(1)}do{if((HEAP32[r7]|0)!=0){if((HEAP32[r6]|0)==0){break}_fwrite(5261668,41,1,HEAP32[_stderr>>2]);_usage435(1)}}while(0);r6=r5+28|0;_init_mp(r6);HEAP32[r4+9]=186;HEAP32[r4+12]=0;HEAP32[r4+8]=218;HEAP32[r4+11]=r5;HEAP32[r4+13]=1328;r4=HEAP32[1311165];_exit(_main_loop(r6,(r4<<2)+r2|0,r1-r4|0))}else if(r3==3271){_usage435(1)}}function _usage435(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5252184,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _dir_mdu(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=STACKTOP;STACKTOP=STACKTOP+1260|0;r4=r3,r5=r4>>2;r6=HEAP32[r2+16>>2];r7=r4;_memcpy(r7,r6,1260);r8=r4+28|0;HEAP32[r5+11]=r7;r7=(r4+12|0)>>2;HEAP32[r7]=r6;HEAP32[r5+1]=1;r9=HEAP32[r1>>2];r10=HEAP32[r9>>2];L4432:do{if((r10|0)==5265052){r11=r9}else{r12=r9;while(1){r13=HEAP32[r12+8>>2];if((HEAP32[r13>>2]|0)==5265052){r11=r13;break L4432}else{r12=r13}}}}while(0);if((HEAP32[r11+16>>2]|0)==156){HEAP32[r5+6]=0}else{r11=r9;L4439:do{if((r10|0)==5264944){r14=r11}else{r12=r11;while(1){r13=HEAP32[r12+8>>2];if((HEAP32[r13>>2]|0)==5264944){r14=r13;break L4439}else{r12=r13}}}}while(0);r10=HEAPU8[r1+35|0]<<8|HEAPU8[r1+34|0];do{if((HEAP32[r14+72>>2]|0)==32){if((HEAP32[r14+108>>2]|0)==0){r15=r10;break}r15=(HEAPU8[r1+29|0]<<8|HEAPU8[r1+28|0])<<16|r10}else{r15=r10}}while(0);L4447:do{if((r9|0)==0){r16=0}else{r10=r11;while(1){if((HEAP32[r10>>2]|0)==5264944){r16=r10;break L4447}r14=HEAP32[r10+8>>2];if((r14|0)==0){r16=0;break L4447}else{r10=r14}}}}while(0);HEAP32[r5+6]=__countBlocks(r16,r15)}r15=FUNCTION_TABLE[HEAP32[r2>>2]](HEAP32[r2+40>>2],r8,5259008);do{if((HEAP32[r5+2]|0)!=0){if((HEAP32[r6+4>>2]|0)==0){break}r17=r4+24|0;r18=HEAP32[r17>>2];r19=HEAP32[r7];r20=r19+24|0,r21=r20>>2;r22=HEAP32[r21];r23=r22+r18|0;HEAP32[r21]=r23;STACKTOP=r3;return r15}}while(0);__fprintPwd(HEAP32[_stdout>>2],r1,0,0);r1=r4+24|0;_printf(5256304,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r1>>2],tempInt));r17=r1;r18=HEAP32[r17>>2];r19=HEAP32[r7];r20=r19+24|0,r21=r20>>2;r22=HEAP32[r21];r23=r22+r18|0;HEAP32[r21]=r23;STACKTOP=r3;return r15}function _mformat(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153,r154,r155,r156,r157,r158;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+6920|0;r6=r5;r7=r5+4,r8=r7>>2;r9=r5+64,r10=r9>>2;r11=r5+216;r12=r5+220;r13=r5+4316;r14=r5+4388;r15=r5+6436;r16=r5+6700;r17=r5+6712;r18=r5+6912;r19=r5+6916,r5=r19>>2;r20=r15|0;HEAP8[r20]=0;r21=(r9+24|0)>>2;HEAP32[r21]=0;HEAP32[r10+1]=1;r22=(r9+84|0)>>2;HEAP32[r22]=0;r23=_getenv(5253664);do{if((r23|0)!=0){r24=_atoi(r23);HEAP32[r22]=r24;if((r24|0)!=0){break}HEAP32[r22]=0}}while(0);r23=(r9+56|0)>>2;HEAP32[r23]=0;r24=(r9+60|0)>>2;HEAP32[r24]=2;r25=_getenv(5261568);do{if((r25|0)!=0){r26=_atoi(r25);HEAP32[r24]=r26;if((r26|0)!=0){break}HEAP32[r24]=2}}while(0);r25=(r9|0)>>2;HEAP32[r25]=5264944;r26=HEAP32[1311258];r27=HEAP32[1311257];do{if((r1|0)>1){if((_strcmp(HEAP32[r3+1],5259860)|0)!=0){break}_usage478(0)}}while(0);r28=_getopt_internal(r1,r2,5258880,0,0,0);L4472:do{if((r28|0)==-1){r29=0;r30=0;r31=0;r32=0;r33=0;r34=r26;r35=r27;r36=2;r37=0;r38=0;r39=0;r40=18;r41=0;r42=0;r43=0;r44=0;r45=-1;r46=0;r47=6;r48=0;r49=0;r50=0}else{r51=r15+260|0;r52=0;r53=0;r54=0;r55=0;r56=0;r57=r26;r58=r27;r59=2;r60=0;r61=0;r62=0;r63=18;r64=0;r65=0;r66=0;r67=0;r68=-1;r69=0;r70=6;r71=0;r72=0;r73=0;r74=r28;L4474:while(1){HEAP32[r5]=0;L4476:do{if((r74|0)==52){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=9;r95=r53;r96=40}else if((r74|0)==56){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=8;r95=r53;r96=40}else if((r74|0)==51){r75=r73;r76=r72;r77=128;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==50){r75=r73;r76=r72;r77=255;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=_atoi(HEAP32[1311167]);r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==110|(r74|0)==115){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=_atoi(HEAP32[1311167]);r95=r53;r96=r52}else if((r74|0)==102){r97=HEAP32[1311167];r98=_atoi(r97)<<1;r99=0;while(1){if(r99>>>0>=9){r4=3318;break L4474}r100=HEAP32[(r99*28&-1)+5244700>>2];r101=HEAP32[(r99*28&-1)+5244696>>2];r102=Math.imul(r101,r100);r103=HEAP32[(r99*28&-1)+5244704>>2];if((Math.imul(r102,r103)|0)==(r98|0)){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r100;r95=r103;r96=r101;break L4476}else{r99=r99+1|0}}}else if((r74|0)==73){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=_strtoul(HEAP32[1311167],r19,0);r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==65){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=_atoi(HEAP32[1311167]);r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==100){HEAP32[r24]=_atoi(HEAP32[1311167]);r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==109){r99=_strtoul(HEAP32[1311167],r19,0);if(HEAP8[HEAP32[r5]]<<24>>24==0){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r99;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52;break}r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=_strtoul(HEAP32[1311167],r19,16);r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==78){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=1;r83=_strtoul(HEAP32[1311167],r19,16);r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==70){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=1;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==108|(r74|0)==118){_strncpy(r20,HEAP32[1311167],260);HEAP8[r51]=0;r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==114){HEAP32[r22]=_strtoul(HEAP32[1311167],r19,0);r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==113|(r74|0)==117|(r74|0)==98){r4=3323;break L4474}else if((r74|0)==107){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=1;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==66){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=HEAP32[1311167];r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==116){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=_atoi(HEAP32[1311167])}else if((r74|0)==105){_set_cmd_line_image(HEAP32[1311167]);r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==72){r75=_atoi(HEAP32[1311167]);r76=1;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==76){HEAP32[r23]=_strtoul(HEAP32[1311167],r19,0);r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==77){r99=_atoi(HEAP32[1311167]);if((r99|0)==4096|(r99|0)==2048|(r99|0)==1024|(r99|0)==512){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r99;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else{r4=3333;break L4474}}else if((r74|0)==75){r99=_atoi(HEAP32[1311167]);if((r99-2|0)>>>0>29){r4=3345;break L4474}else{r75=r73;r76=r72;r77=r71;r78=r99;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}}else if((r74|0)==97){r75=r73;r76=r72;r77=r71;r78=r70;r79=1;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==84){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=_atoi(HEAP32[1311167]);r94=r54;r95=r53;r96=r52}else if((r74|0)==104){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=_atoi(HEAP32[1311167]);r96=r52}else if((r74|0)==49){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=1;r96=r52}else if((r74|0)==83){r99=_atoi(HEAP32[1311167])|128;if((r99|0)<128){r4=3325;break L4474}if((r99|0)>134){r4=3327;break L4474}else{r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r99;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}}else if((r74|0)==99){HEAP32[r21]=_atoi(HEAP32[1311167]);r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==67){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=r57;r92=1536;r93=r55;r94=r54;r95=r53;r96=r52}else if((r74|0)==48){r75=r73;r76=r72;r77=r71;r78=r70;r79=r69;r80=r68;r81=r67;r82=r66;r83=r65;r84=r64;r85=r63;r86=r62;r87=r61;r88=r60;r89=r59;r90=r58;r91=_atoi(HEAP32[1311167]);r92=r56;r93=r55;r94=r54;r95=r53;r96=r52}else{r4=3350;break L4474}}while(0);r99=HEAP32[r5];if((r99|0)!=0){if(HEAP8[r99]<<24>>24!=0){r4=3354;break}}r99=_getopt_internal(r1,r2,5258880,0,0,0);if((r99|0)==-1){r29=r96;r30=r95;r31=r94;r32=r93;r33=r92;r34=r91;r35=r90;r36=r89;r37=r88;r38=r87;r39=r86;r40=r85;r41=r84;r42=r83;r43=r82;r44=r81;r45=r80;r46=r79;r47=r78;r48=r77;r49=r76;r50=r75;break L4472}else{r52=r96;r53=r95;r54=r94;r55=r93;r56=r92;r57=r91;r58=r90;r59=r89;r60=r88;r61=r87;r62=r86;r63=r85;r64=r84;r65=r83;r66=r82;r67=r81;r68=r80;r69=r79;r70=r78;r71=r77;r72=r76;r73=r75;r74=r99}}if(r4==3354){_fprintf(HEAP32[_stderr>>2],5250080,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311167],tempInt));_exit(1)}else if(r4==3333){_fwrite(5251476,63,1,HEAP32[_stderr>>2]);_usage478(1)}else if(r4==3350){_usage478(1)}else if(r4==3323){_fprintf(HEAP32[_stderr>>2],5253532,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r74,tempInt));_exit(1)}else if(r4==3325){_usage478(1)}else if(r4==3345){_fwrite(5250732,46,1,HEAP32[_stderr>>2]);_exit(1)}else if(r4==3318){_fprintf(HEAP32[_stderr>>2],5256288,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r97,tempInt));_exit(1)}else if(r4==3327){_fwrite(5252152,29,1,HEAP32[_stderr>>2]);_usage478(1)}}}while(0);r97=HEAP32[1311165];r75=r1-r97|0;if((r75|0)>1){_usage478(1)}do{if((r75|0)==1){r76=HEAP32[(r97<<2>>2)+r3];if(HEAP8[r76]<<24>>24==0){_usage478(1)}if(HEAP8[r76+1|0]<<24>>24==58){r104=_toupper(HEAP8[HEAP32[(r1-1<<2>>2)+r3]]<<24>>24)&255;break}else{_usage478(1)}}else{if(HEAP8[5247608]<<24>>24==58){r104=58;break}_fwrite(5249440,21,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);r1=(r29|0)==0;r97=(r32|0)==0;if(!(r1|r97)){_fwrite(5263872,38,1,HEAP32[_stderr>>2]);_usage478(1)}r75=r17|0;_sprintf(r75,5262168,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r104<<24>>24,tempInt));r17=r9+44|0,r76=r17>>2;HEAP32[r76]=0;r77=HEAP32[1311840];r78=r77+4|0;r79=r17;if(HEAP8[r78]<<24>>24==0){r105=_free_stream(r79);r106=HEAP32[_stderr>>2];r107=HEAP32[r3];r108=_fprintf(r106,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r107,HEAP32[tempInt+4>>2]=r75,tempInt));_exit(1)}r17=r13;r80=(r30|0)==0;r81=(r31|0)==0;r82=(r48|0)==0;r83=(r36|0)==0;r84=(r49|0)==0;r49=r14|0;r14=r33|2;r85=(r13+16|0)>>2;r86=(r13+20|0)>>2;r87=(r13+24|0)>>2;r88=(r9+28|0)>>2;r89=(r13+48|0)>>2;r90=(r13+44|0)>>2;r91=(r37|0)==0;r92=(r9+144|0)>>2;r93=r9+140|0;r94=r13+60|0;r95=(r33|0)==0;r33=r12|0;r96=(r13+28|0)>>2;r2=r77;r77=r78;L4545:while(1){_free_stream(r79);L4547:do{if(HEAP8[r77]<<24>>24==r104<<24>>24){_memcpy(r17,r2,72);if(!r1){HEAP32[r85]=r29}if(!r80){HEAP32[r86]=r30}if(!r81){HEAP32[r87]=r31}if(!r82){HEAP32[r89]=r48}if(!r83){HEAP32[r90]=r36}if(!r84){HEAP32[r96]=r50}_expand(HEAP32[r2>>2],r49);HEAP32[r76]=0;r78=_FloppydOpen(r13,r49,r14,r75,r18);HEAP32[r76]=r78;if((r78|0)==0){r5=_SimpleFileOpen(r13,r2,r49,r14,r75,0,1,r18);HEAP32[r76]=r5;if((r5|0)==0){break}else{r109=r5}}else{r109=r78}do{if((HEAP32[r85]|r32|0)!=0){if((HEAP32[r86]|0)==0){break}if((HEAP32[r87]|0)==0){break}HEAP32[r88]=512;if((HEAP32[r89]&127|0)==0){r78=128<<(HEAP32[r90]&127);HEAP32[r88]=r78;r110=r78}else{r110=512}if(r91){r111=r110}else{HEAP32[r88]=r37;r111=r37}r78=0;while(1){if(r78>>>0>=31){break}if((r111|0)==(1<<r78|0)){r4=3394;break}else{r78=r78+1|0}}if(r4==3394){r4=0;HEAP32[r92]=r78}HEAP32[r93>>2]=r111-1|0;r5=HEAP32[r94>>2];r19=(r5|0)==0|r5>>>0<r111>>>0?r111:r5;r112=(r19|0)>8192?8192:r19;if(!r95){r113=r111;break L4545}r19=FUNCTION_TABLE[HEAP32[HEAP32[r109>>2]>>2]](r109,r33,0,r111);if((r19|0)==(HEAP32[r88]|0)){r113=r19;break L4545}_sprintf(r75,5260360,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r49,tempInt));break L4547}}while(0);_memcpy(r75,5262596,120)}}while(0);r74=r2+76|0;if(HEAP8[r74]<<24>>24==0){r4=3559;break}else{r2=r2+72|0;r77=r74}}if(r4==3559){r105=_free_stream(r79);r106=HEAP32[_stderr>>2];r107=HEAP32[r3];r108=_fprintf(r106,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r107,HEAP32[tempInt+4>>2]=r75,tempInt));_exit(1)}if(HEAP8[r77]<<24>>24==0){r105=_free_stream(r79);r106=HEAP32[_stderr>>2];r107=HEAP32[r3];r108=_fprintf(r106,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r107,HEAP32[tempInt+4>>2]=r75,tempInt));_exit(1)}if(r97){r97=Math.imul(HEAP32[r87],HEAP32[r86]);r114=Math.imul(HEAP32[r85],r97)-(HEAP32[r96]>>>0)%(r97>>>0)|0}else{r114=r32}if(!r95){r95=HEAP32[r76];FUNCTION_TABLE[HEAP32[HEAP32[r95>>2]+4>>2]](r95,r33,r114-1<<HEAP32[r92],r113)}do{if((r39|0)==0){if((r41|0)!=0){r115=r41;r116=1;break}if((HEAP32[r89]&127|0)!=0){r115=0;r116=0;break}r113=HEAP32[r88];_memset(r33,0,r113);if((r113|0)!=512){r115=0;r116=0;break}if((HEAP32[r13+36>>2]|0)!=0){r115=0;r116=0;break}r113=HEAP32[r86];r95=HEAP32[r87];r32=Math.imul(Math.imul(r95,r113),HEAP32[r85]);HEAP8[r12+447|0]=0;HEAP8[r12+448|0]=1;HEAP8[r12+449|0]=0;r97=r32-1|0;if((r113|0)==0|(r95|0)==0){r117=0;r118=1;r119=0}else{r75=(r97|0)/(r95|0)&-1;r107=(r75|0)/(r113|0)&-1;r117=(r107|0)>1023?1023:r107;r118=(r97|0)%(r95|0)+1&63;r119=(r75|0)%(r113|0)&255}HEAP8[r12+451|0]=r119;HEAP8[r12+452|0]=(r117>>>2&192|r118)&255;HEAP8[r12+453|0]=r117&255;r113=r12+454|0;tempBigInt=0;HEAP8[r113]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r113+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r113+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r113+3|0]=tempBigInt&255;HEAP8[r12+461|0]=r32>>>24&255;HEAP8[r12+460|0]=r32>>>16&255;HEAP8[r12+459|0]=r32>>>8&255;HEAP8[r12+458|0]=r32&255;HEAP8[r12+446|0]=-128;if((r32|0)<4096){r120=1}else{r120=(r32|0)<65536?4:6}HEAP8[r12+450|0]=r120;r115=0;r116=0}else{r32=_open(r39,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));if((r32|0)<0){_perror(5261192);_exit(1)}if((_read(r32,r33,r112)|0)<(r112|0)){_perror(5260748);_exit(1)}else{_close(r32);r115=1;r116=1;break}}}while(0);r39=r12+28|0;r120=HEAP32[r96];r96=r12+31|0;HEAP8[r96]=r120>>>24&255;r117=r12+30|0;HEAP8[r117]=r120>>>16&255;r118=r12+29|0;HEAP8[r118]=r120>>>8&255;HEAP8[r39]=r120&255;r120=HEAP32[r76];r76=Math.imul(Math.imul(HEAP32[r86],r112),HEAP32[r87]);r119=r9+8|0;HEAP32[r119>>2]=_buf_init(r120,r76,r76,r112);HEAP32[r10+3]=0;r112=HEAP32[r24];HEAP8[r12+16|0]=r112&255;if(!r116){HEAP8[r12+511|0]=-86;HEAP8[r12+510|0]=85}r76=r12+24|0;r120=HEAP32[r87];r41=r12+25|0;HEAP8[r41]=(r120&65535)>>>8&255;HEAP8[r76]=r120&255;r32=r12+26|0;r113=HEAP32[r86];r75=r12+27|0;HEAP8[r75]=(r113&65535)>>>8&255;HEAP8[r32]=r113&255;r95=(r13+8|0)>>2;r97=HEAP32[r95];r107=HEAP32[r21];r106=HEAP32[r88];r108=Math.floor(32768/(r106>>>0));r3=(r38|0)!=0;do{if(r3){r4=3424}else{r38=(Math.imul(Math.floor(6128/(r106>>>0))+1|0,r112)+(r108*4084&-1|2)|0)>>>0<r114>>>0?16:12;if((Math.imul(Math.floor(131051/(r106>>>0))+1|0,r112)+(r108*65524&-1|2)|0)>>>0<r114>>>0){r4=3424;break}else{r121=r38;break}}}while(0);if(r4==3424){r121=32}L4630:do{if((r97|0)==0){if(r121>>>0>12){r122=r121;r4=3436;break}r108=Math.imul(Math.floor(8173/(r106>>>0))+1|0,r112)+4085|0;do{if(r108>>>0>r114>>>0){r123=12}else{if((r107|0)==0){if(r108<<1>>>0<=r114>>>0){r123=16;break}}HEAP32[r95]=0;r124=0;r4=3440;break L4630}}while(0);HEAP32[r95]=r123;r124=r123;r4=3440;break}else{if((((r97|0)>0?r97:-r97|0)|0)>=(r121|0)){r122=r97;r4=3436;break}r108=HEAP32[_stderr>>2];if(r3){_fwrite(5255688,73,1,r108);_exit(1)}else{_fprintf(r108,5255444,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r97,tempInt));_exit(1)}}}while(0);do{if(r4==3436){HEAP32[r95]=r122;if((r122|0)!=32){r124=r122;r4=3440;break}HEAP32[r10+25]=0;HEAP32[r10+26]=1;r97=r9+52|0;HEAP32[r97>>2]=32;HEAP8[r12+21|0]=(HEAPU8[r118]<<8|HEAPU8[r39]|(HEAPU8[r96]<<8|HEAPU8[r117])<<16|0)==0?-16:-8;if((r107|0)==0){HEAP32[r21]=8;r125=8}else{r125=r107}HEAP32[r22]=0;HEAP32[r10+23]=Math.floor((r114>>>0)/(r125>>>0));HEAP32[r10+18]=32;HEAP32[r10+16]=268435455;HEAP32[r10+17]=268435446;HEAP32[r10+9]=146;HEAP32[r10+10]=60;_calc_fat_size(r9,r114);HEAP8[r12+23|0]=0;HEAP8[r12+22|0]=0;r3=HEAP32[r23];HEAP8[r12+39|0]=r3>>>24&255;HEAP8[r12+38|0]=r3>>>16&255;HEAP8[r12+37|0]=r3>>>8&255;HEAP8[r12+36|0]=r3&255;HEAP32[r10+22]=Math.imul(r3,HEAP32[r24])+HEAP32[r97>>2]|0;HEAP8[r12+41|0]=0;HEAP8[r12+40|0]=0;HEAP8[r12+43|0]=(r44&65535)>>>8&255;HEAP8[r12+42|0]=r44&255;HEAP32[r10+27]=2;HEAP8[r12+47|0]=0;HEAP8[r12+46|0]=0;HEAP8[r12+45|0]=0;HEAP8[r12+44|0]=2;HEAP8[r12+49|0]=0;HEAP8[r12+48|0]=1;HEAP32[r10+28]=1;HEAP8[r12+51|0]=(r47&65535)>>>8&255;HEAP8[r12+50|0]=r47&255;r126=r12+64|0;break}}while(0);if(r4==3440){HEAP32[r10+28]=0;r44=r9+52|0;HEAP32[r44>>2]=1;r125=HEAP32[r85];r85=(r124|0)==0;r122=HEAP32[r22];r97=(r122|0)==0;r3=(r107|0)==0;r121=(r124|0)>0?r124:-r124|0;r124=(r121|0)==12;r123=0;L4652:while(1){do{if((r120|0)==(HEAP32[(r123*28&-1)+5244700>>2]|0)){if((r125|0)!=(HEAP32[(r123*28&-1)+5244696>>2]|0)){break}if(!((r113|0)==(HEAP32[(r123*28&-1)+5244704>>2]|0)&(r85|r124))){break}if(!r97){if((r122|0)!=(HEAP32[(r123*28&-1)+5244708>>2]|0)){break}}r108=HEAP32[(r123*28&-1)+5244712>>2];if(r3){r127=r108;r4=3448;break L4652}if((r107|0)==(r108|0)){r127=r107;r4=3448;break L4652}}}while(0);r108=r123+1|0;if(r108>>>0<9){r123=r108}else{r128=r108;r129=r107;r130=r122;break}}if(r4==3448){HEAP8[r12+21|0]=HEAP32[(r123*28&-1)+5244720>>2]&255;HEAP32[r21]=r127;r122=HEAP32[(r123*28&-1)+5244708>>2];HEAP32[r22]=r122;HEAP32[r23]=HEAP32[(r123*28&-1)+5244716>>2];HEAP32[r10+18]=12;r128=r123;r129=r127;r130=r122}if((r128|0)==9){r128=(r129|0)==0;r122=(r130|0)==0;do{if((HEAPU8[r118]<<8|HEAPU8[r39]|(HEAPU8[r96]<<8|HEAPU8[r117])<<16|0)==0){if(((r114>>>0)%(Math.imul(r113,r120)>>>0)|0)!=0){r4=3453;break}HEAP8[r12+21|0]=-16;break}else{r4=3453}}while(0);if(r4==3453){HEAP8[r12+21|0]=-8}do{if(r128){if((r113|0)==1){HEAP32[r21]=1;r131=1;break}r120=r114>>>0>2e3?1:2;HEAP32[r21]=r120;if((HEAP32[r89]&127|0)==0){r131=r120;break}HEAP32[r21]=1;r131=1}else{r131=r129}}while(0);do{if(r122){if((r113|0)==1){HEAP32[r22]=4;r132=4;break}else{r129=r114>>>0>2e3?32:7;HEAP32[r22]=r129;r132=r129;break}}else{r132=r130}}while(0);do{if((r121|0)==16|(r121|0)==0){r133=65524;r134=131051;r4=3468;break}else if((r121|0)==32){HEAP32[r21]=8;r4=3487;break}else if((r121|0)==12){r133=4084;r134=6128;r4=3468}else{_fwrite(5256472,13,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);do{if(r4==3468){r113=Math.imul(Math.floor((r134>>>0)/(r106>>>0))+1|0,r112);if((r132+(r112+1)|0)>>>0>=r114>>>0){_fwrite(5256232,19,1,HEAP32[_stderr>>2]);_exit(1)}r129=r114-1-r132|0;L4696:do{if((Math.imul(r133,r131)+r113|0)>>>0<r129>>>0){r120=r131;while(1){if(r120>>>0>64){break}r117=r120<<1;HEAP32[r21]=r117;if((Math.imul(r117,r133)+r113|0)>>>0<r129>>>0){r120=r117}else{r135=r117;break L4696}}_fwrite(5255992,46,1,HEAP32[_stderr>>2]);_exit(1)}else{r135=r131}}while(0);r129=r114-r132-1|0;if((r121|0)==0){if(r129>>>0>=(Math.imul(Math.floor(8177/(r106>>>0))+1|0,r112)+(r135*4087&-1)|0)>>>0){HEAP32[r10+18]=16;HEAP32[r10+16]=65535;HEAP32[r10+17]=65526;HEAP32[r10+9]=86;HEAP32[r10+10]=30;break}r113=Math.imul(Math.floor(6128/(r106>>>0))+1|0,r112);if(r129>>>0<=(r113+(r135*4084&-1)|0)>>>0){HEAP32[r10+18]=12;HEAP32[r10+16]=4095;HEAP32[r10+17]=4086;HEAP32[r10+9]=148;HEAP32[r10+10]=168;break}do{if(r128){r120=r135<<1;if(Math.imul(r120,r106)>>>0>=32769){r4=3482;break}HEAP32[r21]=r120;break}else{r4=3482}}while(0);do{if(r4==3482){if(!r122){break}HEAP32[r22]=(r135*-4084&-1)+r132+r129-r113|0}}while(0);HEAP32[r10+18]=12;HEAP32[r10+16]=4095;HEAP32[r10+17]=4086;HEAP32[r10+9]=148;HEAP32[r10+10]=168;break}else if((r121|0)==12){HEAP32[r10+18]=12;HEAP32[r10+16]=4095;HEAP32[r10+17]=4086;HEAP32[r10+9]=148;HEAP32[r10+10]=168;break}else if((r121|0)==16){HEAP32[r10+18]=16;HEAP32[r10+16]=65535;HEAP32[r10+17]=65526;HEAP32[r10+9]=86;HEAP32[r10+10]=30;break}else if((r121|0)==32){r4=3487;break}else{break}}}while(0);if(r4==3487){HEAP32[r10+18]=32;HEAP32[r10+16]=268435455;HEAP32[r10+17]=268435446;HEAP32[r10+9]=146;HEAP32[r10+10]=60}_calc_fat_size(r9,r114);r136=HEAP32[r24];r137=HEAP32[r44>>2];r138=HEAP32[r22]}else{r136=r112;r137=1;r138=r130}r130=HEAP32[r23];HEAP8[r12+23|0]=(r130&65535)>>>8&255;HEAP8[r12+22|0]=r130&255;r23=Math.imul(r130,r136)+r137|0;HEAP32[r10+20]=r23;HEAP32[r10+22]=r23+r138|0;r126=r12+36|0}r138=_cp_open(HEAP32[r13+64>>2]);HEAP32[r10+37]=r138;if((r138|0)==0){_exit(1)}if(!r116){HEAP8[r126]=0}HEAP8[r126+1|0]=0;HEAP8[r126+2|0]=41;r138=(r43|0)!=0;r43=(r46|0)==0;if(!(r138&r43)){_srandom(_time(0))}if(r138){r139=r42}else{r139=_random()}HEAP8[r126+6|0]=r139>>>24&255;HEAP8[r126+5|0]=r139>>>16&255;HEAP8[r126+4|0]=r139>>>8&255;HEAP8[r126+3|0]=r139&255;r139=r9;__label_name(FUNCTION_TABLE[HEAP32[HEAP32[r25]+28>>2]](r139),HEAP8[r20]<<24>>24!=0?r20:5262196,r11,r16,1);_strncpy(r126+7|0,r16|0,11);r16=(r9+72|0)>>2;_sprintf(r126+18|0,5260160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r16],tempInt));HEAP8[r126+25|0]=32;r11=HEAP32[r88];HEAP8[r12+12|0]=(r11&65535)>>>8&255;HEAP8[r12+11|0]=r11&255;HEAP8[r12+13|0]=HEAP32[r21]&255;r11=HEAP32[r10+13];HEAP8[r12+15|0]=(r11&65535)>>>8&255;HEAP8[r12+14|0]=r11&255;r11=HEAP32[r87];HEAP8[r41]=(r11&65535)>>>8&255;HEAP8[r76]=r11&255;r76=HEAP32[r86];HEAP8[r75]=(r76&65535)>>>8&255;HEAP8[r32]=r76&255;if((r114|0)==0){___assert_func(5259784,72,5264812,5259488)}r76=r12+19|0;if(r114>>>0<65536){HEAP8[r12+20|0]=(r114&65535)>>>8&255;HEAP8[r76]=r114&255;r32=r12+32|0;tempBigInt=0;HEAP8[r32]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r32+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r32+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r32+3|0]=tempBigInt&255}else{HEAP8[r12+20|0]=0;HEAP8[r76]=0;HEAP8[r12+35|0]=r114>>>24&255;HEAP8[r12+34|0]=r114>>>16&255;HEAP8[r12+33|0]=r114>>>8&255;HEAP8[r12+32|0]=r114&255}do{if((HEAP32[r89]&127|0)==0){if((r115|0)!=0){r4=3521;break}HEAP8[r33]=-21;HEAP8[r12+1|0]=0;HEAP8[r12+2|0]=-112;_strncpy(r12+3|0,HEAP32[1311303],8);r4=3521;break}else{r114=r12+3|0;r76=r114|0;tempBigInt=1395477810;HEAP8[r76]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+3|0]=tempBigInt&255;r76=r114+4|0;tempBigInt=875583060;HEAP8[r76]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r76+3|0]=tempBigInt&255;HEAP8[r12+62|0]=0;HEAP8[r12+64|0]=6;r76=HEAP32[r90];HEAP8[r12+65|0]=((r11>>>0)%((1<<r76)+3>>2>>>0)|0)!=0&1;HEAP8[r12+66|0]=r34&255;HEAP8[r12+67|0]=(r35&255|0)==2?1:r35&255;HEAP8[r12+71|0]=0;HEAP8[r12+70|0]=76;HEAP8[r12+76|0]=r40&255;HEAP8[r12+77|0]=108;if((r40|0)<1){r140=78}else{r114=r40+1|0;r32=78;r75=1;while(1){HEAP8[r12+r32|0]=r75&255;r86=r75+1|0;if((r86|0)==(r114|0)){break}else{r32=r32+1|0;r75=r86}}r140=r40+78|0}HEAP8[r12+73|0]=(r140&65535)>>>8&255;HEAP8[r12+72|0]=r140&255;HEAP8[r12+r140|0]=64;r75=r140+2|0;HEAP8[r140+(r12+1)|0]=3;r32=r140+3|0;r114=(r11|0)==0;L4751:do{if(r114){r141=r32}else{r86=r140;r41=r11;r87=r76;r42=1;r138=r32;while(1){r46=r87;while(1){r142=1<<r46>>2;if((r41|0)<(r142|0)){r46=r46-1|0}else{break}}HEAP8[r12+r138|0]=r42+128&255;HEAP8[r86+(r12+4)|0]=r42&255;HEAP8[r86+(r12+5)|0]=r46&255;r78=r138+3|0;if((r41|0)==(r142|0)){r141=r78;break L4751}else{r86=r138;r41=r41-r142|0;r87=r46;r42=r42+1|0;r138=r78}}}}while(0);HEAP8[r12+r75|0]=(-3-r140+r141|0)/3&-1&255;HEAP8[r12+75|0]=(r141&65535)>>>8&255;HEAP8[r12+74|0]=r141&255;L4758:do{if(r114){r143=r141}else{r32=r141;r138=r11;r42=r76;while(1){r87=r42;while(1){r144=1<<r87-2;if((r138|0)<(r144|0)){r87=r87-1|0}else{break}}r46=r32+1|0;HEAP8[r12+r32|0]=r87&255;if((r138|0)==(r144|0)){r143=r46;break L4758}else{r32=r46;r138=r138-r144|0;r42=r87}}}}while(0);HEAP8[r12+69|0]=(r143&65535)>>>8&255;HEAP8[r12+68|0]=r143&255;L4765:do{if((r143|0)>64){r76=64;r114=0;while(1){r75=HEAPU8[r12+r76|0]+r114|0;r42=r76+1|0;if((r42|0)==(r143|0)){r145=r75;break L4765}else{r76=r42;r114=r75}}}else{r145=0}}while(0);HEAP8[r12+63|0]=-r145&255;if((r143|0)==0){r4=3521;break}else{r146=r143;break}}}while(0);if(r4==3521){r146=26-r12+r126|0}if(!r43){HEAP8[r12+7|0]=0;HEAP8[r12+8|0]=_random()&255;HEAP8[r12+9|0]=_random()&255;HEAP8[r12+10|0]=_random()&255}if(!r116){_memcpy(r12+r146|0,5249092,47);r116=r146-2|0;if((r116|0)<128){HEAP8[r33]=-21;HEAP8[r12+1|0]=r116&255;HEAP8[r12+2|0]=-112}else{HEAP8[r33]=-23;HEAP8[r12+1|0]=r146+253&255;HEAP8[r12+2|0]=0}r116=r146+24|0;HEAP8[r146+(r12+21)|0]=(r116&65535)>>>8&255;HEAP8[r146+(r12+20)|0]=r116&255}if((HEAP32[r89]&127|0)!=0){HEAP8[r33]=-21;HEAP8[r12+1|0]=-128;HEAP8[r12+2|0]=-112;HEAP32[r24]=1}if((r45|0)==-1){r147=HEAP8[r12+21|0]}else{r24=r45&255;HEAP8[r12+21|0]=r24;r147=r24}HEAP32[r10+32]=0;HEAP32[r10+33]=0;_zero_fat(r9,r147&255);r147=(r9+120|0)>>2;HEAP32[r147]=HEAP32[r10+23];HEAP32[r10+29]=2;r24=r7+44|0;HEAP32[r8+13]=-2;HEAP32[r8+4]=0;HEAP32[r8+2]=1;HEAP32[r8+3]=0;HEAP32[r8+12]=-2;HEAP32[r8+14]=222;HEAP32[r24>>2]=-2;r8=_malloc(HEAP32[r88]);if((r8|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}r45=_OpenRoot(r139);HEAP32[r6>>2]=r45;if((r45|0)==0){_fwrite(5259900,30,1,HEAP32[_stderr>>2]);_exit(1)}_memset(r8,0,HEAP32[r88]);do{if((HEAP32[r16]|0)==32){r89=HEAP32[r21];FUNCTION_TABLE[HEAP32[r10+10]](r9,HEAP32[r10+27],HEAP32[r10+16]);r116=HEAP32[r147];if((r116|0)==-1){r148=r89;break}HEAP32[r147]=r116-1|0;r148=r89}else{r148=HEAP32[r22]}}while(0);L4802:do{if((r148|0)>0){r147=r45|0;r10=0;while(1){FUNCTION_TABLE[HEAP32[HEAP32[r147>>2]+4>>2]](r45,r8,r10<<HEAP32[r92],HEAP32[r88]);r21=r10+1|0;if((r21|0)==(r148|0)){break L4802}else{r10=r21}}}}while(0);HEAP32[r24>>2]=1;if(HEAP8[r20]<<24>>24!=0){_mwrite_one(r45,r20,0,194,0,r7)}_free_stream(r6);if((HEAP32[r16]|0)==32){HEAP8[r12+18|0]=0;r149=0}else{r6=Math.imul(HEAP32[r88]>>>5,HEAP32[r22]);HEAP8[r12+18|0]=(r6&65535)>>>8&255;r149=r6&255}HEAP8[r12+17|0]=r149;_free(r8);FUNCTION_TABLE[HEAP32[HEAP32[r25]+4>>2]](r139,r33,0,HEAP32[r88]);if((HEAP32[r95]|0)==32){r95=HEAP32[HEAP32[r25]+4>>2];r8=HEAP32[r88];r149=Math.imul(r8,r47);FUNCTION_TABLE[r95](r139,r33,r149,r8)}if((HEAP32[r16]|0)!=32){r150=r9;r151=_flush_stream(r150);r152=r119;r153=_free_stream(r152);r154=HEAP32[r25];r155=r154+12|0,r156=r155>>2;r157=HEAP32[r156];r158=FUNCTION_TABLE[r157](r139);_exit(0)}r16=HEAPU8[r12+51|0]<<8|HEAPU8[r12+50|0];if((r16|0)==65535){r150=r9;r151=_flush_stream(r150);r152=r119;r153=_free_stream(r152);r154=HEAP32[r25];r155=r154+12|0,r156=r155>>2;r157=HEAP32[r156];r158=FUNCTION_TABLE[r157](r139);_exit(0)}FUNCTION_TABLE[HEAP32[HEAP32[r25]+4>>2]](r139,r33,r16<<HEAP32[r92],HEAP32[r88]);r150=r9;r151=_flush_stream(r150);r152=r119;r153=_free_stream(r152);r154=HEAP32[r25];r155=r154+12|0,r156=r155>>2;r157=HEAP32[r156];r158=FUNCTION_TABLE[r157](r139);_exit(0)}function _unlink_mcwd(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+1028|0;r3=r2;r4=r3|0;r5=_getenv(5263828);do{if((r5|0)!=0){if(HEAP8[r5]<<24>>24==0){break}_strncpy(r4,r5,1024);HEAP8[r3+1024|0]=0;r6=_unlink(r4);STACKTOP=r2;return}}while(0);r5=_getenv(5261256);do{if((r5|0)==0){r7=_getenv(5258672);do{if((r7|0)==0){r8=_getlogin();if((r8|0)==0){r1=3570;break}else{r9=r8;r1=3569;break}}else{r9=r7;r1=3569}}while(0);do{if(r1==3569){r7=_getpwnam(r9);if((r7|0)==0){r1=3570;break}else{r10=r7;break}}}while(0);if(r1==3570){r7=_getpwuid(_getgid());if((r7|0)==0){r11=0;break}else{r10=r7}}r11=HEAP32[r10+24>>2]}else{r11=r5}}while(0);_strncpy(r4,(r11|0)==0?5263312:r11,1018);HEAP8[r3+1018|0]=0;r11=r3+_strlen(r4)|0;HEAP8[r11]=HEAP8[5262580];HEAP8[r11+1|0]=HEAP8[5262581|0];HEAP8[r11+2|0]=HEAP8[5262582|0];HEAP8[r11+3|0]=HEAP8[5262583|0];HEAP8[r11+4|0]=HEAP8[5262584|0];HEAP8[r11+5|0]=HEAP8[5262585|0];HEAP8[r11+6|0]=HEAP8[5262586|0];r6=_unlink(r4);STACKTOP=r2;return}function _usage478(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5254844,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _calc_fat_size(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=STACKTOP;r4=r2-HEAP32[r1+84>>2]-HEAP32[r1+52>>2]|0;do{if((r4&1|0)==0){r5=r4}else{if((HEAP32[r1+60>>2]&1|0)!=0){r5=r4;break}r5=r4-1+(HEAP32[r1+24>>2]&1)|0}}while(0);r2=r1+72|0;r6=HEAP32[r2>>2];if((r6|0)==0){_fwrite(5259136,20,1,HEAP32[_stderr>>2]);_exit(1)}r7=(r6|0)/4&-1;r8=(r1+24|0)>>2;r9=HEAP32[r8];r10=r9<<1;r11=r10+r5|0;r12=(r1+28|0)>>2;r13=HEAP32[r12];r14=Math.imul(r10,r13);r10=(r1+60|0)>>2;r15=HEAP32[r10];r16=Math.imul(r15,r7)+r14|0;if((r6-12|0)>>>0<4){r17=Math.imul(r11,r7);r18=r16}else{r17=r11;r18=Math.floor((r16>>>0)/(r7>>>0))}r16=Math.floor(((r17-1|0)>>>0)/(r18>>>0))+1|0;r18=(r1+56|0)>>2;HEAP32[r18]=r16;r17=Math.floor(((r5-Math.imul(r16,r15)|0)>>>0)/(r9>>>0));r9=(r1+92|0)>>2;r1=(r6|0)==16&r17>>>0>65524?65524:r17;if((r6|0)==12&r1>>>0>4084){r19=4084;r20=4084}else{r19=r1;r20=r1}HEAP32[r9]=r20;if(r19>>>0>(Math.floor((Math.imul(r16<<1,r13)>>>0)/(r7>>>0))-2|0)>>>0){_fprintf(HEAP32[_stderr>>2],5258824,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r19,tempInt));r13=Math.floor((Math.imul(HEAP32[r18]<<1,HEAP32[r12])>>>0)/(r7>>>0))-2|0;HEAP32[r9]=r13;_fprintf(HEAP32[_stderr>>2],5258568,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r13,tempInt));r21=HEAP32[r9]}else{r21=r19}do{if(r21>>>0<65525){if((HEAP32[r2>>2]|0)<=16){break}_fwrite(5258140,106,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);r2=HEAP32[r8];r19=Math.imul(r2,r21);r13=HEAP32[r18];r16=HEAP32[r10];r20=Math.imul(r16,r13);if(r5>>>0<(r20+r19|0)>>>0){___assert_func(5259784,454,5264852,5257824)}r1=r5-r19-r20|0;if(r1>>>0<r2>>>0){r22=r21;r23=r13;r24=r16;r25=r2}else{_fprintf(HEAP32[_stderr>>2],5257624,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));_fprintf(HEAP32[_stderr>>2],5257428,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r18],tempInt));r2=(Math.floor(((r1-HEAP32[r8]|0)>>>0)/(HEAP32[r10]>>>0))+1|0)+HEAP32[r18]|0;HEAP32[r18]=r2;_fprintf(HEAP32[_stderr>>2],5257252,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt));r2=HEAP32[r18];r18=HEAP32[r10];r10=r5-Math.imul(r18,r2)|0;r5=HEAP32[r8];r8=Math.floor((r10>>>0)/(r5>>>0));HEAP32[r9]=r8;r22=r8;r23=r2;r24=r18;r25=r5}if(Math.imul(r22+2|0,r7)>>>0>Math.imul(r23<<1,HEAP32[r12])>>>0){___assert_func(5259784,484,5264852,5256988)}if((r22|0)==(Math.floor(((r4-Math.imul(r24,r23)|0)>>>0)/(r25>>>0))|0)){STACKTOP=r3;return}else{___assert_func(5259784,490,5264852,5256676)}}function _minfo(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+6224|0;r5=r4;r6=r4+4096;r7=r4+6144;r8=r4+6148;r9=r4+6220;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){r10=0;r11=0;break}_usage531(0)}else{r10=0;r11=0}}while(0);L4880:while(1){r12=r10;while(1){r4=_getopt_internal(r1,r2,5252800,0,0,0);if((r4|0)==104){r3=3610;break L4880}else if((r4|0)==-1){r3=3607;break L4880}else if((r4|0)==118){r10=r12;r11=1;continue L4880}else if((r4|0)!=105){r3=3611;break L4880}_set_cmd_line_image(HEAP32[1311167]);r12=HEAP32[1311167]}}if(r3==3610){_usage531(0)}else if(r3==3611){_usage531(1)}else if(r3==3607){r10=HEAP32[1311165];if((r10|0)>(r1|0)){r13=r9;r14=_free_stream(r13);_exit(0)}r4=r6|0;r6=r5+32|0;r15=r5+33|0;r16=r5+34|0;r17=r5+35|0;r18=r5+19|0;r19=r5+20|0;r20=r5+11|0;r21=r5+12|0;r22=(r8+24|0)>>2;r23=(r8+20|0)>>2;r24=r8+16|0;r25=r5+3|0;r26=r5+13|0;r27=r5+14|0;r28=r5+15|0;r29=r5+16|0;r30=r5+17|0;r31=r5+18|0;r32=r5+21|0;r33=r5+22|0;r34=r5+23|0;r35=r5+24|0;r36=r5+25|0;r37=r5+26|0;r38=r5+27|0;r39=r5+28|0;r40=r5+29|0;r41=r5+30|0;r42=r5+31|0;r43=r5+36|0;r44=r5+64|0;r45=r5+37|0;r46=r5+38|0;r47=r5+39|0;r48=r5+40|0;r49=r5+41|0;r50=r5+42|0;r51=r5+43|0;r52=r5+44|0;r53=r5+45|0;r54=r5+46|0;r55=r5+47|0;r56=r5+48|0;r57=r5+49|0;r58=r5+50|0;r59=r5+51|0;r60=(r11|0)==0;r11=(r12|0)==0;r61=0;r62=0;r63=r10;L4892:while(1){if((r63|0)==(r1|0)){if((r61|0)!=0){r3=3661;break}r10=HEAP8[5247608];r64=r10<<24>>24==0?65:r10}else{r10=HEAP32[r2+(r63<<2)>>2];r65=HEAP8[r10];if(r65<<24>>24==0){r3=3663;break}if(HEAP8[r10+1|0]<<24>>24!=58){r3=3662;break}r64=_toupper(r65<<24>>24)&255}r65=_find_device(r64,0,r8,r5,r4,r7,0,0);r10=r65;HEAP32[r9>>2]=r10;if((r65|0)==0){r3=3620;break}r66=HEAPU8[r19]<<8|HEAPU8[r18];r67=r66<<16>>16==0?HEAPU8[r15]<<8|HEAPU8[r6]|(HEAPU8[r17]<<8|HEAPU8[r16])<<16:r66&65535;r66=HEAPU8[r21]<<8|HEAPU8[r20];r68=0;while(1){if((r68|0)>=7){r69=2;break}if((r66|0)==(128<<r68|0)){r69=r68;break}else{r68=r68+1|0}}_puts(5243104);_puts(5243084);_printf(5256136,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));_printf(5253500,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r22],tempInt));_printf(5252140,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r23],tempInt));_printf(5251460,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24>>2],tempInt));r68=Math.imul(HEAP32[r23],HEAP32[r22]);if((r68|0)==0){r70=r62}else{_printf(5250700,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r66=HEAPU8[r40]<<8|HEAPU8[r39]|(HEAPU8[r42]<<8|HEAPU8[r41])<<16;r71=HEAP32[r24>>2];if((r67|0)==(Math.imul(r71,r68)-(r66>>>0)%(r68>>>0)|0)){_printf(5250056,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r71,tempInt));r72=1}else{_printf(5249432,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r67,tempInt));r72=r62}if(!r11){_printf(5263864,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r12,tempInt))}r71=HEAP32[r22];_printf(5263320,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r23],HEAP32[tempInt+4>>2]=r71,tempInt));if((r66|0)!=0|(r72|0)==0){_printf(5262588,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66,tempInt))}if((r69|0)!=2){_printf(5262216,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r69,tempInt))}r66=_tolower(r64<<24>>24);_printf(5261552,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66,tempInt));_putchar(10);r70=r72}_puts(5243060);_puts(5243036);_printf(5260136,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r25,tempInt));_printf(5259876,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r21]<<8|HEAPU8[r20],tempInt));_printf(5259756,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r26],tempInt));_printf(5259456,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r28]<<8|HEAPU8[r27],tempInt));_printf(5259244,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r29],tempInt));_printf(5259096,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r31]<<8|HEAPU8[r30],tempInt));_printf(5258800,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r19]<<8|HEAPU8[r18],tempInt));_printf(5258536,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r32],tempInt));_printf(5258116,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r34]<<8|HEAPU8[r33],tempInt));_printf(5253500,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r36]<<8|HEAPU8[r35],tempInt));_printf(5252140,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r38]<<8|HEAPU8[r37],tempInt));_printf(5257804,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r40]<<8|HEAPU8[r39]|(HEAPU8[r42]<<8|HEAPU8[r41])<<16,tempInt));_printf(5257596,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r15]<<8|HEAPU8[r6]|(HEAPU8[r17]<<8|HEAPU8[r16])<<16,tempInt));r66=(HEAPU8[r34]<<8|HEAPU8[r33])<<16>>16==0?r44:r43;_printf(5257400,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r66],tempInt));_printf(5257236,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r66+1|0],tempInt));_printf(5256976,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r66+2|0],tempInt));_printf(5256584,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r66+4|0]<<8|HEAPU8[r66+3|0]|(HEAPU8[r66+6|0]<<8|HEAPU8[r66+5|0])<<16,tempInt));_printf(5256448,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66+7|0,tempInt));_printf(5256212,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66+18|0,tempInt));do{if((HEAPU8[r34]<<8|HEAPU8[r33])<<16>>16==0){_printf(5255976,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r45]<<8|HEAPU8[r43]|(HEAPU8[r47]<<8|HEAPU8[r46])<<16,tempInt));_printf(5255664,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r49]<<8|HEAPU8[r48],tempInt));_printf(5255424,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r51]<<8|HEAPU8[r50],tempInt));_printf(5255308,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r53]<<8|HEAPU8[r52]|(HEAPU8[r55]<<8|HEAPU8[r54])<<16,tempInt));r66=HEAPU8[r57]<<8|HEAPU8[r56];if((r66|0)!=65535){_printf(5254820,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66,tempInt))}r66=HEAPU8[r59]<<8|HEAPU8[r58];if((r66|0)!=65535){_printf(5254644,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66,tempInt))}if((HEAPU8[r57]<<8|HEAPU8[r56]|0)==65535){break}r66=_malloc(HEAPU8[r21]<<8|HEAPU8[r20]);if((r66|0)==0){r3=3642;break L4892}r71=HEAPU8[r21]<<8|HEAPU8[r20];r68=HEAP32[HEAP32[r65>>2]>>2];L4932:do{if((r71|0)!=0){r73=Math.imul(HEAPU8[r57]<<8|HEAPU8[r56],r71);r74=r71;r75=r66;while(1){r76=FUNCTION_TABLE[r68](r65,r75,r73,r74);if((r76|0)<1){break L4932}if((r74|0)==(r76|0)){break L4932}else{r73=r76+r73|0;r74=r74-r76|0;r75=r75+r76|0}}}}while(0);_puts(5243124);_printf(5253392,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r66+1|0]<<8|HEAPU8[r66]|(HEAPU8[r66+3|0]<<8|HEAPU8[r66+2|0])<<16,tempInt));r68=HEAPU8[r66+489|0]<<8|HEAPU8[r66+488|0]|(HEAPU8[r66+491|0]<<8|HEAPU8[r66+490|0])<<16;if((r68|0)!=-1){_printf(5253004,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r68,tempInt))}r68=HEAPU8[r66+493|0]<<8|HEAPU8[r66+492|0]|(HEAPU8[r66+495|0]<<8|HEAPU8[r66+494|0])<<16;if((r68|0)==-1){break}_printf(5252844,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r68,tempInt))}}while(0);if(!r60){_putchar(10);r67=HEAPU8[r21]<<8|HEAPU8[r20];r68=_malloc(r67);if((r68|0)==0){r3=3653;break}r71=FUNCTION_TABLE[HEAP32[HEAP32[r65>>2]>>2]](r10,r68,0,r67);if((r71|0)<0){r3=3655;break}_print_sector(5253728,r68,r71)}r71=HEAP32[1311165]+1|0;HEAP32[1311165]=r71;if((r71|0)>(r1|0)){r3=3660;break}else{r61=1;r62=r70;r63=r71}}if(r3==3620){_exit(1)}else if(r3==3642){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);_exit(1)}else if(r3==3662){_usage531(1)}else if(r3==3663){_usage531(1)}else if(r3==3655){_perror(5254164);_exit(1)}else if(r3==3660){r13=r9;r14=_free_stream(r13);_exit(0)}else if(r3==3661){r13=r9;r14=_free_stream(r13);_exit(0)}else if(r3==3653){_fwrite(5255164,20,1,HEAP32[_stderr>>2]);_exit(1)}}}function _usage531(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5252676,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _open_mcwd(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+1100|0;r4=r3;r5=r3+72;r6=r5|0;r7=_getenv(5263828);do{if((r7|0)==0){r2=3667}else{if(HEAP8[r7]<<24>>24==0){r2=3667;break}_strncpy(r6,r7,1024);HEAP8[r5+1024|0]=0;break}}while(0);if(r2==3667){r7=_getenv(5261256);do{if((r7|0)==0){r8=_getenv(5258672);do{if((r8|0)==0){r9=_getlogin();if((r9|0)==0){r2=3671;break}else{r10=r9;r2=3670;break}}else{r10=r8;r2=3670}}while(0);do{if(r2==3670){r8=_getpwnam(r10);if((r8|0)==0){r2=3671;break}else{r11=r8;break}}}while(0);if(r2==3671){r8=_getpwuid(_getgid());if((r8|0)==0){r12=0;break}else{r11=r8}}r12=HEAP32[r11+24>>2]}else{r12=r7}}while(0);_strncpy(r6,(r12|0)==0?5263312:r12,1018);HEAP8[r5+1018|0]=0;r12=r5+_strlen(r6)|0;HEAP8[r12]=HEAP8[5262580];HEAP8[r12+1|0]=HEAP8[5262581|0];HEAP8[r12+2|0]=HEAP8[5262582|0];HEAP8[r12+3|0]=HEAP8[5262583|0];HEAP8[r12+4|0]=HEAP8[5262584|0];HEAP8[r12+5|0]=HEAP8[5262585|0];HEAP8[r12+6|0]=HEAP8[5262586|0]}do{if(HEAP8[r1]<<24>>24==114){if((_stat(r6,r4)|0)<0){r13=0;STACKTOP=r3;return r13}if(!HEAP8[5245768]){_time(5245764);HEAP8[5245768]=1}if((HEAP32[1311441]-HEAP32[r4+40>>2]|0)<=21600){break}_fprintf(HEAP32[_stderr>>2],5256076,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt));_unlink(r6);r13=0;STACKTOP=r3;return r13}}while(0);r13=_fopen(r6,r1);STACKTOP=r3;return r13}function _print_sector(r1,r2,r3){var r4,r5,r6,r7,r8;r4=STACKTOP;_printf(5253412,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));if((r3|0)>0){r5=0;r6=0}else{STACKTOP=r4;return}while(1){_printf(5252120,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt));r1=0;while(1){_printf(5251396,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r2+r1+r6|0],tempInt));r7=r1+1|0;if((r7|0)==16){r8=0;break}else{r1=r7}}while(1){r1=r2+r8+r6|0;if((_isprint(HEAPU8[r1])|0)==0){_putchar(46)}else{_putchar(HEAPU8[r1])}r1=r8+1|0;if((r1|0)==16){break}else{r8=r1}}_putchar(10);r1=r5+1|0;r7=r1<<4;if((r7|0)<(r3|0)){r5=r1;r6=r7}else{break}}STACKTOP=r4;return}function _mwrite_one(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89;r7=r6>>2;r8=0;r9=STACKTOP;STACKTOP=STACKTOP+2028|0;r10=r9;r11=r9+4;r12=r9+8;r13=r9+1032;r14=r9+1044;r15=r9+1096;r16=r9+1400;r17=r9+1404;r18=r9+1408;r19=r9+1412;r20=r9+1716;r21=r9+1980;r22=r9+1992,r23=r22>>2;if((r2|0)==0){r24=0}else{r24=_strdup(r2)}if((r3|0)==0){r25=0}else{r25=_strdup(r3)}r3=r20|0;r2=r21|0;r26=r1|0;r27=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+28>>2]](r1);L7:do{if(HEAP8[r24]<<24>>24==0){r8=8}else{if((_strcmp(r24,5249700)|0)==0){r8=8;break}if((_strcmp(r24,5255792)|0)==0){r8=8;break}r28=(r6+56|0)>>2;do{if((HEAP32[r28]|0)==104){do{if((r25|0)!=0){r29=r25;r30=r25;while(1){r31=HEAP8[r30];if(r31<<24>>24==32){r32=r29}else if(r31<<24>>24==0){break}else{r32=r30}r29=r32;r30=r30+1|0}if(HEAP8[r25]<<24>>24==0){break}HEAP8[r29+1|0]=0}}while(0);if((r24|0)==0){break}else{r33=r24;r34=r24}while(1){r30=HEAP8[r34];if(r30<<24>>24==32){r35=r33}else if(r30<<24>>24==0){break}else{r35=r34}r33=r35;r34=r34+1|0}if(HEAP8[r24]<<24>>24==0){break}HEAP8[r33+1|0]=0}}while(0);if((r25|0)==0){r36=r24;r37=0}else{FUNCTION_TABLE[HEAP32[r28]](r27,r25,0,r18,r21);HEAP8[r21+11|0]=0;r30=(HEAP32[r7+10]&1|0)==0;r36=r30?r24:r25;r37=r30?r25:0}if(HEAP8[r36]<<24>>24==0){r38=r36}else{r38=HEAP8[r36+1|0]<<24>>24==58?r36+2|0:r36}_strncpy(r3,r38,260);r30=HEAP32[r28];do{if((r37|0)==0){FUNCTION_TABLE[r30](r27,r3,0,r16,r21);HEAP8[r21+11|0]=0;HEAP32[r7+10]=HEAP32[r16>>2]}else{FUNCTION_TABLE[r30](r27,r37,0,r17,r21);HEAP8[r21+11|0]=0;r31=HEAP32[r17>>2];r39=r6+40|0;HEAP32[r39>>2]=r31;if((_strcmp(r37,r3)|0)==0){break}HEAP32[r39>>2]=r31|1}}while(0);r30=r6|0;HEAP32[r30>>2]=HEAP32[r7+2];HEAP32[r7+1]=HEAP32[r7+3];r31=r15|0;r39=r6+44|0;r40=r6+52|0;r41=(r6+40|0)>>2;r42=r22+8|0;r43=r15+4|0;r44=r15+8|0;r45=r6+48|0;r46=r15+19|0;r47=r22+4|0;r48=r13|0;r49=r14|0;r50=r15;r51=r15+8|0;r52=r21+11|0;r53=r12|0;r54=r22+32|0;r55=0;L41:while(1){r56=FUNCTION_TABLE[HEAP32[HEAP32[r26>>2]+28>>2]](r1);r57=(HEAP32[r30>>2]|0)==1;HEAP32[r31>>2]=r1;L43:do{if((_is_reserved(r3,1)|0)==0){if(HEAP8[r20+_strspn(r3,5255972)|0]<<24>>24==0){r58=0;r59=1;r60=1;r61=1;r8=62;break}r62=HEAP32[1311305];r63=1024;r64=r3;while(1){r65=HEAP8[r64];if(r65<<24>>24==0){break}if((r63|0)==0){break}if(!(r65<<24>>24>31|r65<<24>>24==5|r65<<24>>24<0)){r58=0;r59=2;r60=1;r61=1;r8=62;break L43}if((_strchr(r62,r65<<24>>24)|0)==0){r63=r63-1|0;r64=r64+1|0}else{r58=0;r59=2;r60=1;r61=1;r8=62;break L43}}if((_is_reserved(r2,0)|0)!=0){HEAP32[r41]=1;r58=0;r59=1;r60=1;r61=0;r8=62;break}r64=HEAP32[1310878];r63=11;r62=r2;while(1){r29=HEAP8[r62];if(r29<<24>>24==0){break}if((r63|0)==0){break}if(!(r29<<24>>24>31|r29<<24>>24==5|r29<<24>>24<0)){r8=45;break}if((_strchr(r64,r29<<24>>24)|0)==0){r63=r63-1|0;r62=r62+1|0}else{r8=45;break}}if(r8==45){r8=0;HEAP32[r41]=1;r58=0;r59=2;r60=1;r61=0;r8=62;break}if(r57){r66=(HEAP32[r41]|0)!=0}else{r66=0}r62=_lookupForInsert(r1,r15,r21,r3,r22,HEAP32[r39>>2],HEAP32[r40>>2],r66&1,HEAP32[r41]);if((r62|0)==5){break}else if((r62|0)==6){r8=113;break L41}else if((r62|0)==-1|(r62|0)==0){r67=-1;break L7}r62=HEAP32[r42>>2];do{if((r62|0)>-1){r68=1;r69=r62}else{r63=HEAP32[r47>>2];if((HEAP32[r41]&1|0)==0){if((r63|0)>-1){r68=1;r69=r63;break}else{r55=r55;continue L41}}if((r63|0)==-1){r55=r55;continue L41}if((r63|0)>-1){r68=0;r69=r63}else{r58=r63;r59=0;r60=1;r61=0;r8=62;break L43}}}while(0);HEAP32[r43>>2]=r69;r62=HEAP32[r31>>2];r63=r62;r64=HEAP32[HEAP32[r62>>2]>>2];r62=r69<<5;r29=32;r65=r44;r70=0;while(1){r71=FUNCTION_TABLE[r64](r63,r65,r62,r29);if((r71|0)<1){r8=56;break}r72=r71+r70|0;if((r29|0)==(r71|0)){r73=r72;break}else{r62=r71+r62|0;r29=r29-r71|0;r65=r65+r71|0;r70=r72}}if(r8==56){r8=0;r73=(r70|0)==0?r71:r70}if((r73|0)<0){r67=-1;break L7}if((r69|0)==(HEAP32[r45>>2]|0)){r74=1}else{r74=(HEAP8[r46]&16)<<24>>24!=0}r58=r69;r59=0;r60=r74&1;r61=r68;r8=62;break}else{r58=0;r59=1;r60=1;r61=1;r8=62}}while(0);L84:do{if(r8==62){r8=0;r75=((r61<<2)+r6|0)>>2;r57=HEAP32[r75];r65=(r57|0)==0;if(r65){if((_opentty(1)|0)==0){r67=-1;break L7}}r29=(r61|0)!=0;if(r29){r76=r3}else{r76=_unix_normalize(r56,r49,r21)}do{if(r65){r62=r29?5262572:5262208;r63=HEAP32[(r59<<2)+5249168>>2];r64=(r60|0)!=0;r72=r29?5:4;r77=r64?0:6;while(1){_fprintf(HEAP32[_stderr>>2],5263288,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r62,HEAP32[tempInt+4>>2]=r76,HEAP32[tempInt+8>>2]=r63,tempInt));_fwrite(5261500,48,1,HEAP32[_stderr>>2]);r78=HEAP32[_stderr>>2];if(r64){_fwrite(5260664,28,1,r78)}else{_fwrite(5261164,25,1,r78);_fwrite(5260664,28,1,HEAP32[_stderr>>2]);_fwrite(5260404,2,1,HEAP32[_stderr>>2])}_fwrite(5260128,6,1,HEAP32[_stderr>>2]);_fflush(HEAP32[_stderr>>2]);_fflush(_opentty(1));do{if((HEAP32[1311256]|0)==0){if((_fgets(r48,9,_opentty(0))|0)==0){HEAP8[r48]=113;r79=113;break}else{r79=HEAP8[r48];break}}else{r78=_fgetc(_opentty(1));_fputc(10,HEAP32[_stderr>>2]);if((r78|0)==-1){HEAP8[r48]=113;r79=113;break}else{r80=r78&255;HEAP8[r48]=r80;r79=r80;break}}}while(0);r81=_isupper(r79&255);r80=_tolower(HEAPU8[r48]);if((r80|0)==113){r8=80;break L41}else if((r80|0)==115){r8=82;break}else if((r80|0)==97){r82=1;r8=83;break}else if((r80|0)==114){r83=r72;break}else if((r80|0)!=111){continue}if(!r64){r82=r77;r8=83;break}}if(r8==82){r8=0;r83=3}else if(r8==83){r8=0;r83=r82}HEAP32[r75]=r83;if((r81|0)==0){r84=r83;break}HEAP32[((r61<<2)+8>>2)+r7]=r83;r84=r83}else{HEAP32[r75]=r57;r84=r57}}while(0);L118:do{if((r84|0)==6){HEAP32[r75]=0;r85=(r60|0)==0?6:3;r8=103;break}else{if((r84|0)==2){break L41}else if((r84|0)==1){if((r61|0)==0){_autorename(r2,126,32,HEAP32[1310878],8,1);r55=r55;continue L41}else{_autorename(r3,45,0,HEAP32[1311305],255,1);break}}else if((r84|0)==3){r67=-1;break L7}else if(!((r84|0)==4|(r84|0)==5)){r86=0;r8=125;break L41}if((_opentty(0)|0)==0){r85=r84;r8=103;break}r57=r29?5251388:5250680;r65=0;while(1){_fprintf(HEAP32[_stderr>>2],5252096,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r57,HEAP32[tempInt+4>>2]=r3,tempInt));_fflush(HEAP32[_stderr>>2]);if((_fgets(r53,1021,_opentty(0))|0)==0){r85=r84;r8=103;break L118}r70=_strlen(r53);L131:do{if((r70|0)>0){r77=r70;while(1){r64=r77-1|0;r72=r12+r64|0;r63=HEAP8[r72];if(!(r63<<24>>24==10|r63<<24>>24==13)){break L131}HEAP8[r72]=0;if((r64|0)>0){r77=r64}else{break L131}}}}while(0);if(r29){_strcpy(r3,r53);r87=r65}else{FUNCTION_TABLE[HEAP32[r28]](r56,r53,0,r11,r21);HEAP8[r52]=0;r87=HEAP32[r11>>2]}if((r87&1|0)==0){r85=r84;r8=103;break L118}else{r65=r87}}}}while(0);do{if(r8==103){r8=0;if(!((r85|0)==6&(r58|0)>-1)){if((r85|0)==4){r55=r55;continue L41}else if((r85|0)==5){break}else if((r85|0)==9){break L84}else if((r85|0)==6|(r85|0)==8){r8=113;break L41}else if((r85|0)==7|(r85|0)==3){r67=-1;break L7}else{r86=r85;r8=125;break L41}}if((HEAP8[r46]&5)<<24>>24!=0){if((_ask_confirmation(5253344,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))|0)!=0){r55=r55;continue L41}}if((_fatFreeWithDir(HEAP32[r50>>2],r51)|0)!=0){r67=-1;break L7}_wipeEntry(r15);r55=r55;continue L41}}while(0);FUNCTION_TABLE[HEAP32[r28]](r27,r3,0,r10,r21);HEAP8[r52]=0;HEAP32[r41]=HEAP32[r10>>2];r55=r55;continue L41}}while(0);if((r55|0)!=0){r8=111;break}if((_dir_grow(r1,HEAP32[r54>>2])|0)==0){r55=1}else{r67=-1;break L7}}if(r8==80){HEAP32[r75]=2}else if(r8==111){_fprintf(HEAP32[_stderr>>2],5261100,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));r67=-1;break}else if(r8==113){r55=HEAP32[r41];r54=r1;L156:do{if((HEAP32[r1>>2]|0)==5264944){r88=r54}else{r52=r54;while(1){r28=HEAP32[r52+8>>2];if((HEAP32[r28>>2]|0)==5264944){r88=r28;break L156}else{r52=r28}}}}while(0);r54=r88+32|0;if((HEAP32[r54>>2]|0)!=0){_fwrite(5249676,19,1,HEAP32[_stderr>>2]);if((HEAP32[r54>>2]|0)!=0){r67=0;break}}HEAP32[r19>>2]=r1;r54=r22+20|0;HEAP32[r19+4>>2]=HEAP32[r54>>2];r41=0;r52=r3;while(1){HEAP8[r19+(r41+40)|0]=HEAP8[r52];r28=r41+1|0;if((r28|0)==255){break}else{r41=r28;r52=r52+1|0}}HEAP8[r19+295|0]=0;HEAP8[r19+20|0]=r55&24;if((FUNCTION_TABLE[r4](r21,r3,r5,r19)|0)<=-1){r67=0;break}r52=r22+28|0;r41=HEAP32[r52>>2];do{if(r41>>>0>1){r28=HEAP32[r23+3];if((HEAP32[r23+4]-r28|0)>>>0<r41>>>0){r89=r28;break}HEAP32[r54>>2]=_write_vfat(r1,r21,r3,r28,r19);r67=1;break L7}else{r89=HEAP32[r23+3]}}while(0);HEAP32[r52>>2]=1;_write_vfat(r1,r21,0,r89,r19);r67=1;break}else if(r8==125){_fprintf(HEAP32[_stderr>>2],5258496,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r86,tempInt));r67=-1;break}HEAP32[1311336]=1;r67=-1;break}}while(0);if(r8==8){_fwrite(5252004,34,1,HEAP32[_stderr>>2]);r67=-1}if((r24|0)!=0){_free(r24)}if((r25|0)==0){STACKTOP=r9;return r67}_free(r25);STACKTOP=r9;return r67}function _is_reserved(r1,r2){var r3,r4,r5;r3=(r2|0)==0;r2=r1+3|0;do{if((_strncasecmp(r1,5259752,3)|0)==0){if(r3){if((_strncmp(r2,5257788,5)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r2]<<24>>24==0){r4=1}else{break}return r4}}}while(0);do{if((_strncasecmp(r1,5259452,3)|0)==0){if(r3){if((_strncmp(r2,5257788,5)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r2]<<24>>24==0){r4=1}else{break}return r4}}}while(0);do{if((_strncasecmp(r1,5259240,3)|0)==0){if(r3){if((_strncmp(r2,5257788,5)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r2]<<24>>24==0){r4=1}else{break}return r4}}}while(0);do{if((_strncasecmp(r1,5259092,3)|0)==0){if(r3){if((_strncmp(r2,5257788,5)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r2]<<24>>24==0){r4=1}else{break}return r4}}}while(0);do{if((_strncasecmp(r1,5258796,3)|0)==0){if(r3){if((_strncmp(r2,5257788,5)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r2]<<24>>24==0){r4=1}else{break}return r4}}}while(0);r5=r1+4|0;do{if((_strncasecmp(r1,5258532,3)|0)==0){if((HEAP8[r2]-49&255)>=4){break}if(r3){if((_strncmp(r5,5257588,4)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r5]<<24>>24==0){r4=1}else{break}return r4}}}while(0);do{if((_strncasecmp(r1,5258068,3)|0)==0){if((HEAP8[r2]-49&255)>=4){break}if(r3){if((_strncmp(r5,5257588,4)|0)==0){r4=1}else{break}return r4}else{if(HEAP8[r5]<<24>>24==0){r4=1}else{break}return r4}}}while(0);r4=0;return r4}function _label_name_uc(r1,r2,r3,r4,r5){__label_name(r1,r2,r4,r5,0);return}function __label_name(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+12|0;r8=r7;_memset(r4|0,32,11);HEAP8[r4+11|0]=0;r9=HEAP8[r2];HEAP8[r8|0]=r9;HEAP8[r8+1|0]=HEAP8[r2+1|0];HEAP8[r8+2|0]=HEAP8[r2+2|0];HEAP8[r8+3|0]=HEAP8[r2+3|0];HEAP8[r8+4|0]=HEAP8[r2+4|0];HEAP8[r8+5|0]=HEAP8[r2+5|0];HEAP8[r8+6|0]=HEAP8[r2+6|0];HEAP8[r8+7|0]=HEAP8[r2+7|0];HEAP8[r8+8|0]=HEAP8[r2+8|0];HEAP8[r8+9|0]=HEAP8[r2+9|0];HEAP8[r8+10|0]=HEAP8[r2+10|0];HEAP8[r8+11|0]=0;HEAP32[r3>>2]=0;r2=(r5|0)==0;r5=0;r10=0;r11=0;r12=r9;while(1){r9=r8+r5|0;r13=r12<<24>>24;r14=(_islower(r13)|0)==0?r10:1;r15=(_isupper(r13)|0)==0?r11:1;if(r2){r16=_toupper(r13)&255;HEAP8[r9]=r16;r17=r16}else{r17=r12}if((_memchr(5260644,r17<<24>>24,17)|0)!=0){HEAP32[r3>>2]=1;HEAP8[r9]=126}r9=r5+1|0;if((r9|0)==11){break}r5=r9;r10=r14;r11=r15;r12=HEAP8[r8+r9|0]}do{if((r14|0)==0|(r15|0)==0){r18=0}else{HEAP32[r3>>2]=1;r18=0;break}}while(0);while(1){r15=HEAP8[r8+r18|0];if(r15<<24>>24==0){r6=197;break}do{if(r15<<24>>24<32|r15<<24>>24==127){r14=HEAP8[(r15&127)+r1+4|0];r12=r4+r18|0;HEAP8[r12]=r14;if(r14<<24>>24!=0){break}HEAP8[r12]=95;HEAP32[r3>>2]=1}else{HEAP8[r4+r18|0]=r15}}while(0);r15=r18+1|0;if(r15>>>0<11){r18=r15}else{r6=198;break}}if(r6==197){STACKTOP=r7;return}else if(r6==198){STACKTOP=r7;return}}function _labelit(r1,r2,r3,r4){var r5,r6;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r2=r3;if(!HEAP8[5245768]){_time(5245764);HEAP8[5245768]=1}HEAP32[r2>>2]=HEAP32[1311441];r5=_localtime(r2)>>2;_strncpy(r4+8|0,r1|0,8);_strncpy(r4+16|0,r1+8|0,3);HEAP8[r4+19|0]=8;HEAP8[r4+21|0]=0;r1=HEAP32[r5+1];r2=(HEAP32[r5]|0)/2&-1;r6=(HEAP32[r5+2]<<3)+(r1>>>3)&255;HEAP8[r4+31|0]=r6;HEAP8[r4+23|0]=r6;r6=(r1<<5)+r2&255;HEAP8[r4+30|0]=r6;HEAP8[r4+22|0]=r6;r6=HEAP32[r5+4]+1|0;r2=HEAP32[r5+3];r1=(HEAP32[r5+5]<<1)+(r6>>>3)+96&255;HEAP8[r4+33|0]=r1;HEAP8[r4+25|0]=r1;HEAP8[r4+27|0]=r1;r1=(r6<<5)+r2&255;HEAP8[r4+32|0]=r1;HEAP8[r4+24|0]=r1;HEAP8[r4+26|0]=r1;r1=r4+34|0;HEAP8[r4+29|0]=0;HEAP8[r4+28|0]=0;HEAP8[r1]=0;HEAP8[r1+1|0]=0;HEAP8[r1+2|0]=0;HEAP8[r1+3|0]=0;HEAP8[r1+4|0]=0;HEAP8[r1+5|0]=0;STACKTOP=r3;return 0}function _mlabel(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+6080|0;r6=r5,r7=r6>>2;r8=r5+304;r9=r5+568;r10=r5+616,r11=r10>>2;r12=r5+676;r13=r5+1908;r14=r5+1912;r15=r5+1916;r16=r5+1920;r17=r5+6016;r18=r5+6020;r19=r5+6068;HEAP32[r17>>2]=0;r5=r10+44|0;HEAP32[r11+13]=-2;HEAP32[r11+4]=0;HEAP32[r11+2]=1;HEAP32[r11+3]=0;HEAP32[r11+12]=-2;HEAP32[r11+14]=222;HEAP32[r5>>2]=-2;do{if((r1|0)>1){if((_strcmp(HEAP32[r3+1],5259860)|0)!=0){r20=0;r21=0;r22=0;r23=0;break}_usage624(0)}else{r20=0;r21=0;r22=0;r23=0}}while(0);L277:while(1){r11=r20;r24=r21;r25=r22;while(1){r26=r11;L281:while(1){while(1){r27=_getopt_internal(r1,r2,5260924,0,0,0);if((r27|0)==118){continue}else if((r27|0)==99){r26=1;continue L281}else if((r27|0)==115){r20=r26;r21=r24;r22=r25;r23=1;continue L277}else if((r27|0)==110){r4=209;break L281}else if((r27|0)==78){r4=211;break L281}else if((r27|0)==104){r4=213;break L277}else if((r27|0)==-1){r4=215;break L277}else if((r27|0)!=105){r4=214;break L277}_set_cmd_line_image(HEAP32[1311167])}}if(r4==209){r4=0;_srandom(_time(0));r11=r26;r24=_random();r25=1;continue}else if(r4==211){r4=0;r27=_strtoul(HEAP32[1311167],r15,16);if(HEAP8[HEAP32[r15>>2]]<<24>>24==0){r11=r26;r24=r27;r25=2;continue}else{r4=212;break L277}}}}if(r4==212){_fprintf(HEAP32[_stderr>>2],5258328,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311167],tempInt));_exit(1)}else if(r4==213){_usage624(0)}else if(r4==214){_usage624(1)}else if(r4==215){r15=HEAP32[1311165];r22=r1-r15|0;if((r22|0)>1){_usage624(1)}do{if((r22|0)==1){r21=HEAP32[(r15<<2>>2)+r3];if(HEAP8[r21]<<24>>24==0){_usage624(1)}if(HEAP8[r21+1|0]<<24>>24==58){r21=_toupper(HEAP8[HEAP32[(r1-1<<2>>2)+r3]]<<24>>24)&255;r28=HEAP32[(HEAP32[1311165]<<2>>2)+r3]+2|0;r29=r21;break}else{_usage624(1)}}else{r21=HEAP8[5247608];r28=5260912;r29=r21<<24>>24==0?65:r21}}while(0);_init_mp(r12);if(_strlen(r28)>>>0>261){_fwrite(5255860,15,1,HEAP32[_stderr>>2]);_free_stream(r13);_exit(1)}r12=HEAP8[r28];if((r26|r23|0)==0){r30=r12<<24>>24==0&(r25|0)==0}else{r30=0}r1=r30&1;r30=r12<<24>>24==0;do{if((r26|0)==0){r31=r30?r17:0}else{if(r30){r31=0;break}_fwrite(5253080,35,1,HEAP32[_stderr>>2]);_free_stream(r13);_exit(1)}}while(0);if(!HEAP8[5245232]){HEAP8[5245232]=1;_memset(5245772,0,1024);_atexit(160)}r30=_toupper(r29&255);r29=r30&255;r26=(r29<<2)+5245772|0;r12=HEAP32[r26>>2];do{if((r12|0)==0){r15=_fs_init(r30&255,(r31|0)!=0?0:2,r31);r22=r15;if((r15|0)!=0){HEAP32[r26>>2]=r22;r32=r22;break}_fprintf(HEAP32[_stderr>>2],5249704,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r29,tempInt));HEAP32[r13>>2]=0;r33=HEAP32[_stderr>>2];r34=HEAP32[r3];r35=_fprintf(r33,5252040,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r34,tempInt));_exit(1)}else{r32=r12}}while(0);r12=_OpenRoot(r32);HEAP32[r13>>2]=r12;r32=(HEAP32[r17>>2]|0)==0;r17=r32?r1:0;if((r12|0)==0){r33=HEAP32[_stderr>>2];r34=HEAP32[r3];r35=_fprintf(r33,5252040,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r34,tempInt));_exit(1)}r34=(r6+4|0)>>2;HEAP32[r34]=-1;HEAP32[r7]=r12;HEAP32[r7+74]=0;HEAP32[r7+75]=0;r7=r9|0;r9=r8|0;if((_vfat_lookup(r6,0,0,72,r7,r9)|0)==-2){_free_stream(r13);_exit(1)}r33=(r23|0)!=0;r23=r33|r32^1;do{if(!(r32&(r33^1)&(r17|0)==0)){if((HEAP32[r34]|0)==-2){_puts(5243012);break}if(HEAP8[r9]<<24>>24==0){_printf(5249996,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7,tempInt));break}else{_printf(5250624,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r7,tempInt));break}}}while(0);r7=(r17|0)!=0;do{if(r7){_allow_interrupts(r18);_fwrite(5249368,29,1,HEAP32[_stderr>>2]);if((_fgets(r9,261,HEAP32[_stdin>>2])|0)!=0){if(HEAP8[r9]<<24>>24==0){r36=r9;break}HEAP8[r8+(_strlen(r9)-1)|0]=0;r36=r9;break}_fputc(10,HEAP32[_stderr>>2]);if((HEAP32[___errno_location()>>2]|0)==4){_free_stream(r13);_exit(1)}else{HEAP8[r9]=0;r36=r9;break}}else{r36=r28}}while(0);if(_strlen(r36)>>>0>11){_fwrite(5263264,19,1,HEAP32[_stderr>>2]);_free_stream(r13);_exit(1)}do{if(r23){if(HEAP8[r36]<<24>>24==0){r37=0;r38=1;r4=268;break}else{r4=258;break}}else{r4=258}}while(0);do{if(r4==258){if((HEAP32[r34]|0)!=-2){do{if(r7){if(HEAP8[r36]<<24>>24!=0){break}if((_ask_confirmation(5262544,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))|0)==0){break}_free_stream(r13);_exit(0)}}while(0);HEAP8[r6+19|0]=0;_wipeEntry(r6)}if(HEAP8[r36]<<24>>24==0){r39=0}else{HEAP32[r5>>2]=1;r39=(_mwrite_one(r12,r36,0,194,0,r10)|0)==0&1}if(!r23){r40=r39;r4=269;break}r37=r39;r38=HEAP8[r36]<<24>>24==0;r4=268;break}}while(0);do{if(r4==268){if(r38&(r25|0)==0){r41=0;r42=0;r43=r37;break}else{r40=r37;r4=269;break}}}while(0);if(r4==269){r37=r12;while(1){if((HEAP32[r37>>2]|0)==5264944){r44=r37;break}r12=HEAP32[r37+8>>2];if((r12|0)==0){r44=0;break}else{r37=r12}}r37=r44;r12=HEAP32[HEAP32[r44>>2]>>2];r38=0;r39=4096;r10=r16|0;r5=0;while(1){r45=FUNCTION_TABLE[r12](r44,r10,r38,r39);if((r45|0)<1){r4=274;break}r6=r45+r5|0;if((r39|0)==(r45|0)){r46=r6;break}else{r38=r45+r38|0;r39=r39-r45|0;r10=r10+r45|0;r5=r6}}if(r4==274){r46=(r5|0)==0?r45:r5}r41=r37;r42=(r46|0)==4096&1;r43=r40}r40=r16+22|0;r46=r16+23|0;r37=(HEAPU8[r46]<<8|HEAPU8[r40])<<16>>16==0?r16+64|0:r16+36|0;r5=HEAP8[r36];do{if(r23&r5<<24>>24==0){r47=0}else{__label_name(FUNCTION_TABLE[HEAP32[HEAP32[r41>>2]+28>>2]](r41),r5<<24>>24==0?5262196:r36,r14,r19,1);if((r42|0)==0){r48=r13;r49=_free_stream(r48);_exit(r43)}if(HEAPU8[r16+21|0]<=239){r47=0;break}if(HEAP8[r37+2|0]<<24>>24!=41){r47=0;break}_strncpy(r37+7|0,r19|0,11);r47=1}}while(0);do{if((r42&((r25|0)!=0&1)|0)!=0&(r42|0)!=0){if(HEAPU8[r16+21|0]<=239){r4=286;break}if(HEAP8[r37+2|0]<<24>>24!=41){r4=286;break}HEAP8[r37+6|0]=r24>>>24&255;HEAP8[r37+5|0]=r24>>>16&255;HEAP8[r37+4|0]=r24>>>8&255;HEAP8[r37+3|0]=r24&255;break}else{r4=286}}while(0);do{if(r4==286){if((r47|0)!=0){break}r48=r13;r49=_free_stream(r48);_exit(r43)}}while(0);r47=r16|0;r24=r41;r37=r41;r41=HEAP32[HEAP32[r37>>2]+4>>2];r42=0;r25=4096;r19=r47;while(1){r14=FUNCTION_TABLE[r41](r24,r19,r42,r25);if((r14|0)<1){break}if((r25|0)==(r14|0)){break}else{r42=r14+r42|0;r25=r25-r14|0;r19=r19+r14|0}}if((HEAPU8[r46]<<8|HEAPU8[r40])<<16>>16!=0){r48=r13;r49=_free_stream(r48);_exit(r43)}r40=Math.imul(HEAPU8[r16+12|0]<<8|HEAPU8[r16+11|0],HEAPU8[r16+51|0]<<8|HEAPU8[r16+50|0]);r16=HEAP32[HEAP32[r37>>2]+4>>2];r37=r40;r40=4096;r46=r47;while(1){r47=FUNCTION_TABLE[r16](r24,r46,r37,r40);if((r47|0)<1){r4=302;break}if((r40|0)==(r47|0)){r4=303;break}else{r37=r47+r37|0;r40=r40-r47|0;r46=r46+r47|0}}if(r4==302){r48=r13;r49=_free_stream(r48);_exit(r43)}else if(r4==303){r48=r13;r49=_free_stream(r48);_exit(r43)}}}function _usage624(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5261124,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _makeit(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53;r2=STACKTOP;STACKTOP=STACKTOP+348|0;r5=r2;r6=r2+4;r7=r2+8;r8=r2+20;r9=r2+24;r10=r2+36;r11=r2+40,r12=r11>>2;r13=r2+44,r14=r13>>2;r15=(r4|0)>>2;if((_getfreeMinClusters(HEAP32[r15],1)|0)==0){r16=-1;STACKTOP=r2;return r16}r17=(r3+12|0)>>2;HEAP32[r10>>2]=HEAP32[r17];r18=_localtime(r10)>>2;r10=r4+8|0;r19=r1|0;_strncpy(r10,r19,8);r20=r4+16|0;r21=r1+8|0;_strncpy(r20,r21,3);r1=r4+19|0;HEAP8[r1]=16;r22=r4+21|0;HEAP8[r22]=0;r23=HEAP32[r18+1];r24=(HEAP32[r18]|0)/2&-1;r25=(HEAP32[r18+2]<<3)+(r23>>>3)&255;r26=r4+31|0;HEAP8[r26]=r25;r27=r4+23|0;HEAP8[r27]=r25;r25=(r23<<5)+r24&255;r24=r4+30|0;HEAP8[r24]=r25;r23=r4+22|0;HEAP8[r23]=r25;r25=HEAP32[r18+4]+1|0;r28=HEAP32[r18+3];r29=(HEAP32[r18+5]<<1)+(r25>>>3)+96&255;r18=r4+33|0;HEAP8[r18]=r29;r30=r4+25|0;HEAP8[r30]=r29;r31=r4+27|0;HEAP8[r31]=r29;r29=(r25<<5)+r28&255;r28=r4+32|0;HEAP8[r28]=r29;r25=r4+24|0;HEAP8[r25]=r29;r32=r4+26|0;HEAP8[r32]=r29;r29=r4+34|0;r33=r4+35|0;HEAP8[r33]=0;HEAP8[r29]=1;r34=r4+28|0;r35=r4+29|0;HEAP8[r35]=0;HEAP8[r34]=0;r36=r4+36|0;r37=r36;tempBigInt=0;HEAP8[r37]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r37+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r37+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r37+3|0]=tempBigInt&255;r37=_OpenFileByDirentry(r4);if((r37|0)==0){_fwrite(5253056,22,1,HEAP32[_stderr>>2]);r16=-1;STACKTOP=r2;return r16}r4=r13+4|0;HEAP32[r14]=r37;HEAP32[r14+74]=0;HEAP32[r14+75]=0;HEAP32[r4>>2]=1;r14=HEAP32[r15];FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+20>>2]](r14,0,0,0,r11);r14=HEAP32[r12];r38=HEAP32[r15];r15=r38;L425:do{if((HEAP32[r38>>2]|0)==5264944){r39=r15}else{r40=r15;while(1){r41=HEAP32[r40+8>>2];if((HEAP32[r41>>2]|0)==5264944){r39=r41;break L425}else{r40=r41}}}}while(0);if((HEAP32[r39+72>>2]|0)==32){r42=HEAP32[r39+108>>2]}else{r42=0}if((r14|0)==(r42|0)){HEAP32[r12]=0;r43=0}else{r43=r14}r14=HEAP32[r17];r42=r9;HEAP32[r42>>2]=538979886;HEAP32[r42+4>>2]=538976288;r42=r9+8|0;HEAP8[r42]=HEAP8[5258796];HEAP8[r42+1|0]=HEAP8[5258797|0];HEAP8[r42+2|0]=HEAP8[5258798|0];HEAP32[r8>>2]=r14;r14=_localtime(r8)>>2;r8=r13+8|0;_strncpy(r8,r9|0,8);r9=r13+16|0;_strncpy(r9,r42,3);r42=r13+19|0;HEAP8[r42]=16;r39=r13+21|0;HEAP8[r39]=0;r15=HEAP32[r14+1];r38=(HEAP32[r14]|0)/2&-1;r40=(HEAP32[r14+2]<<3)+(r15>>>3)&255;r41=r13+31|0;HEAP8[r41]=r40;r44=r13+23|0;HEAP8[r44]=r40;r40=(r15<<5)+r38&255;r38=r13+30|0;HEAP8[r38]=r40;r15=r13+22|0;HEAP8[r15]=r40;r40=HEAP32[r14+4]+1|0;r45=HEAP32[r14+3];r46=(HEAP32[r14+5]<<1)+(r40>>>3)+96&255;r14=r13+33|0;HEAP8[r14]=r46;r47=r13+25|0;HEAP8[r47]=r46;r48=r13+27|0;HEAP8[r48]=r46;r46=(r40<<5)+r45&255;r45=r13+32|0;HEAP8[r45]=r46;r40=r13+24|0;HEAP8[r40]=r46;r49=r13+26|0;HEAP8[r49]=r46;r46=r13+34|0;r50=r13+35|0;HEAP8[r50]=(r43&65535)>>>8&255;HEAP8[r46]=r43&255;r51=r13+28|0;r52=r13+29|0;HEAP8[r52]=r43>>>24&255;HEAP8[r51]=r43>>>16&255;r43=r13+36|0;HEAP32[r43>>2]=0;_dir_write(r13);_flush_stream(r37);HEAP32[r4>>2]=0;FUNCTION_TABLE[HEAP32[HEAP32[r37>>2]+20>>2]](r37,0,0,0,r11);r11=HEAP32[r12];r4=HEAP32[r17];r53=r7;HEAP32[r53>>2]=538976302;HEAP32[r53+4>>2]=538976288;r53=r7+8|0;HEAP8[r53]=HEAP8[5258796];HEAP8[r53+1|0]=HEAP8[5258797|0];HEAP8[r53+2|0]=HEAP8[5258798|0];HEAP32[r6>>2]=r4;r4=_localtime(r6)>>2;_strncpy(r8,r7|0,8);_strncpy(r9,r53,3);HEAP8[r42]=16;HEAP8[r39]=0;r39=HEAP32[r4+1];r42=(HEAP32[r4]|0)/2&-1;r53=(HEAP32[r4+2]<<3)+(r39>>>3)&255;HEAP8[r41]=r53;HEAP8[r44]=r53;r53=(r39<<5)+r42&255;HEAP8[r38]=r53;HEAP8[r15]=r53;r53=HEAP32[r4+4]+1|0;r15=HEAP32[r4+3];r38=(HEAP32[r4+5]<<1)+(r53>>>3)+96&255;HEAP8[r14]=r38;HEAP8[r47]=r38;HEAP8[r48]=r38;r38=(r53<<5)+r15&255;HEAP8[r45]=r38;HEAP8[r40]=r38;HEAP8[r49]=r38;HEAP8[r50]=(r11&65535)>>>8&255;HEAP8[r46]=r11&255;HEAP8[r52]=r11>>>24&255;HEAP8[r51]=r11>>>16&255;HEAP32[r43>>2]=0;_dir_write(r13);r13=HEAP8[r3+8|0]|16;r43=HEAP32[r12];HEAP32[r5>>2]=HEAP32[r17];r17=_localtime(r5)>>2;_strncpy(r10,r19,8);_strncpy(r20,r21,3);HEAP8[r1]=r13;HEAP8[r22]=0;r22=HEAP32[r17+1];r13=(HEAP32[r17]|0)/2&-1;r1=(HEAP32[r17+2]<<3)+(r22>>>3)&255;HEAP8[r26]=r1;HEAP8[r27]=r1;r1=(r22<<5)+r13&255;HEAP8[r24]=r1;HEAP8[r23]=r1;r1=HEAP32[r17+4]+1|0;r23=HEAP32[r17+3];r24=(HEAP32[r17+5]<<1)+(r1>>>3)+96&255;HEAP8[r18]=r24;HEAP8[r30]=r24;HEAP8[r31]=r24;r24=(r1<<5)+r23&255;HEAP8[r28]=r24;HEAP8[r25]=r24;HEAP8[r32]=r24;HEAP8[r33]=(r43&65535)>>>8&255;HEAP8[r29]=r43&255;HEAP8[r35]=r43>>>24&255;HEAP8[r34]=r43>>>16&255;r43=r36;tempBigInt=0;HEAP8[r43]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r43+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r43+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r43+3|0]=tempBigInt&255;HEAP32[r3+4>>2]=r37;r16=0;STACKTOP=r2;return r16}function _createDirCallback(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=STACKTOP;STACKTOP=STACKTOP+20|0;r3=r1,r4=r3>>2;r5=r1+16;r6=HEAP32[r2+40>>2];r7=HEAP32[r2+60>>2];r8=HEAP32[r2+16>>2]+1244|0;if(!HEAP8[5245768]){_time(5245764);HEAP8[5245768]=1}r2=HEAP32[1311441];HEAP32[r4]=r6;HEAP8[r3+8|0]=16;HEAP32[r4+3]=r2;do{if((_getfreeMinClusters(r6,1)|0)!=0){if((_mwrite_one(r6,r7,0,80,r3,r8)|0)<1){break}r2=HEAP32[r4+1];HEAP32[r5>>2]=r2;if((r2|0)==0){r9=16;STACKTOP=r1;return r9}_free_stream(r5);r9=4;STACKTOP=r1;return r9}}while(0);HEAP32[r5>>2]=0;r9=16;STACKTOP=r1;return r9}function _mmd(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1308|0;r5=r4,r4=r5>>2;HEAP32[r4+322]=-1;HEAP32[r4+324]=-2;HEAP32[r4+315]=0;HEAP32[r4+313]=1;HEAP32[r4+314]=0;HEAP32[r4+325]=104;HEAP32[r4+323]=-2;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage635(0)}}while(0);while(1){r6=_getopt_internal(r1,r2,5251700,0,0,0);if((r6|0)==111){r7=(_isupper(111)|0)==0&1;r8=_tolower(111)<<24>>24;if((r8|0)==114){HEAP32[((r7<<2)+1252>>2)+r4]=4;continue}else if((r8|0)==97){HEAP32[((r7<<2)+1252>>2)+r4]=1;continue}else if((r8|0)==111){HEAP32[((r7<<2)+1252>>2)+r4]=6;continue}else if((r8|0)==115){HEAP32[((r7<<2)+1252>>2)+r4]=3;continue}else if((r8|0)==109){HEAP32[((r7<<2)+1252>>2)+r4]=0;continue}else{continue}}else if((r6|0)==104){r3=349;break}else if((r6|0)==-1){r3=351;break}else if((r6|0)==68){r7=HEAP8[HEAP32[1311167]]<<24>>24;r8=(_isupper(r7)|0)==0&1;r9=_tolower(r7)<<24>>24;if((r9|0)==97){HEAP32[((r8<<2)+1252>>2)+r4]=1;continue}else if((r9|0)==109){HEAP32[((r8<<2)+1252>>2)+r4]=0;continue}else if((r9|0)==111){HEAP32[((r8<<2)+1252>>2)+r4]=6;continue}else if((r9|0)==114){HEAP32[((r8<<2)+1252>>2)+r4]=4;continue}else if((r9|0)==115){HEAP32[((r8<<2)+1252>>2)+r4]=3;continue}else{r3=348;break}}else if((r6|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r6|0)==63){r3=335;break}else{r3=350;break}}if(r3==348){_usage635(1)}else if(r3==349){_usage635(0)}else if(r3==350){_usage635(1)}else if(r3==351){if((r1-HEAP32[1311165]|0)<1){_usage635(1)}else{r6=r5+4|0;_init_mp(r6);HEAP32[r4+5]=r5;HEAP32[r4+6]=2;HEAP32[r4+3]=50;HEAP32[r4+7]=5120;r4=HEAP32[1311165];_exit(_main_loop(r6,(r4<<2)+r2|0,r1-r4|0))}}else if(r3==335){_usage635(1)}}function _usage635(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5258280,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_fprintf(HEAP32[_stderr>>2],5255796,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mmount(r1,r2,r3){_fwrite(5251604,42,1,HEAP32[_stderr>>2]);_exit(1)}function _mmove(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r4=r2>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1584|0;r7=r6,r8=r7>>2;r9=r6+1304;r10=r6+1320;HEAP32[r8+322]=-1;HEAP32[r8+324]=-2;HEAP32[r8+315]=0;HEAP32[r8+313]=1;HEAP32[r8+314]=0;HEAP32[r8+325]=104;HEAP32[r8+323]=-2;r6=r7+4|0;HEAP32[r6>>2]=0;do{if((r1|0)>1){if((_strcmp(HEAP32[r4+1],5259860)|0)!=0){break}_usage650(0)}}while(0);while(1){r11=_getopt_internal(r1,r2,5251596,0,0,0);if((r11|0)==104){r5=375;break}else if((r11|0)==63){r5=376;break}else if((r11|0)==68){r12=HEAP8[HEAP32[1311167]]<<24>>24;r13=(_isupper(r12)|0)==0&1;r14=_tolower(r12)<<24>>24;if((r14|0)==111){HEAP32[((r13<<2)+1252>>2)+r8]=6;continue}else if((r14|0)==114){HEAP32[((r13<<2)+1252>>2)+r8]=4;continue}else if((r14|0)==97){HEAP32[((r13<<2)+1252>>2)+r8]=1;continue}else if((r14|0)==115){HEAP32[((r13<<2)+1252>>2)+r8]=3;continue}else if((r14|0)==109){HEAP32[((r13<<2)+1252>>2)+r8]=0;continue}else{r5=374;break}}else if((r11|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r11|0)==118){HEAP32[r6>>2]=1;continue}else if((r11|0)==111){r13=(_isupper(111)|0)==0&1;r14=_tolower(111)<<24>>24;if((r14|0)==97){HEAP32[((r13<<2)+1252>>2)+r8]=1;continue}else if((r14|0)==114){HEAP32[((r13<<2)+1252>>2)+r8]=4;continue}else if((r14|0)==111){HEAP32[((r13<<2)+1252>>2)+r8]=6;continue}else if((r14|0)==109){HEAP32[((r13<<2)+1252>>2)+r8]=0;continue}else if((r14|0)==115){HEAP32[((r13<<2)+1252>>2)+r8]=3;continue}else{continue}}else if((r11|0)==-1){r5=377;break}else{continue}}if(r5==374){_usage650(1)}else if(r5==375){_usage650(0)}else if(r5==376){_usage650(1)}else if(r5==377){if((r1-HEAP32[1311165]|0)<2){_usage650(1)}r6=r7+8|0;_init_mp(r6);HEAP32[r8+6]=r7;HEAP32[r8+7]=2;r11=HEAP32[1311165];do{if((r11|0)<(r1|0)){r13=0;r14=r11;L514:while(1){r12=HEAP32[(r14<<2>>2)+r4];r15=HEAP8[r12];r16=r15<<24>>24;do{if(r15<<24>>24==0){r17=r13}else{if(HEAP8[r12+1|0]<<24>>24!=58){r17=r13;break}if(r13<<24>>24==0){r17=_toupper(r16)&255;break}else{if((r13<<24>>24|0)==(_toupper(r16)|0)){r17=r13;break}else{r5=385;break L514}}}}while(0);r16=r14+1|0;if((r16|0)<(r1|0)){r13=r17;r14=r16}else{break}}if(r5==385){_fwrite(5260784,42,1,HEAP32[_stderr>>2]);_exit(1)}if(r17<<24>>24==0){break}HEAP8[r7+80|0]=r17}}while(0);do{if((r3|0)!=0){r17=HEAP32[1311165];if((r1-r17|0)!=2){break}r5=HEAP32[(r1-1<<2>>2)+r4];if((_strpbrk(5258260,r5)|0)!=0){break}HEAP32[r8+8]=9520;r11=HEAP32[(r17<<2>>2)+r4];r17=(r7|0)>>2;HEAP32[r17]=r11;do{if(HEAP8[r11]<<24>>24==0){r18=r11}else{if(HEAP8[r11+1|0]<<24>>24!=58){r18=r11;break}r14=r11+2|0;HEAP32[r17]=r14;r18=r14}}while(0);r11=_strrchr(r18,47);HEAP32[r17]=(r11|0)==0?r18:r11+1|0;HEAP32[r8+17]=_strdup(r5);HEAP32[r8+4]=158;r19=r10|0;r20=r7+44|0;HEAP32[r20>>2]=r19;HEAP8[r19]=0;r21=r9|0;r22=r7+40|0;HEAP32[r22>>2]=r21;HEAP8[r21]=0;r23=HEAP32[1311165];r24=(r23<<2)+r2|0;r25=r1-1|0;r26=r25-r23|0;r27=_main_loop(r6,r24,r26);_exit(r27)}}while(0);HEAP32[r8+8]=9520;_target_lookup(r6,HEAP32[(r1-1<<2>>2)+r4]);HEAP32[r8+4]=196;HEAP32[r8+3]=122;r19=r10|0;r20=r7+44|0;HEAP32[r20>>2]=r19;HEAP8[r19]=0;r21=r9|0;r22=r7+40|0;HEAP32[r22>>2]=r21;HEAP8[r21]=0;r23=HEAP32[1311165];r24=(r23<<2)+r2|0;r25=r1-1|0;r26=r25-r23|0;r27=_main_loop(r6,r24,r26);_exit(r27)}}function _usage650(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5263204,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_fprintf(HEAP32[_stderr>>2],5262476,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _setBeginEnd(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r8=(r4|0)==0|(r5|0)==0;if(r8){r9=0;r10=1;r11=0}else{r12=(r2|0)/(r5|0)&-1;r13=(r12|0)/(r4|0)&-1;r9=(r13|0)>1023?1023:r13;r10=(r2|0)%(r5|0)+1&63;r11=(r12|0)%(r4|0)&255}HEAP8[r1+1|0]=r11;HEAP8[r1+2|0]=(r9>>>2&192|r10)&255;HEAP8[r1+3|0]=r9&255;r9=r3-1|0;if(r8){r14=0;r15=1;r16=0}else{r8=(r9|0)/(r5|0)&-1;r10=(r8|0)/(r4|0)&-1;r14=(r10|0)>1023?1023:r10;r15=(r9|0)%(r5|0)+1&63;r16=(r8|0)%(r4|0)&255}HEAP8[r1+5|0]=r16;HEAP8[r1+6|0]=(r14>>>2&192|r15)&255;HEAP8[r1+7|0]=r14&255;HEAP8[r1+11|0]=r2>>>24&255;HEAP8[r1+10|0]=r2>>>16&255;HEAP8[r1+9|0]=r2>>>8&255;HEAP8[r1+8|0]=r2&255;r14=r3-r2|0;HEAP8[r1+15|0]=r14>>>24&255;HEAP8[r1+14|0]=r14>>>16&255;HEAP8[r1+13|0]=r14>>>8&255;HEAP8[r1+12|0]=r14&255;HEAP8[r1|0]=(r6|0)==0?0:-128;if((r7|0)!=0){r17=r7;r18=r17&255;r19=r1+4|0;HEAP8[r19]=r18;return}if((r14|0)<4096){r17=1;r18=r17&255;r19=r1+4|0;HEAP8[r19]=r18;return}r17=(r14|0)<65536?4:6;r18=r17&255;r19=r1+4|0;HEAP8[r19]=r18;return}function _rename_file(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=r2>>2;r4=HEAP32[r3+4],r5=r4>>2;HEAP32[r5+310]=r1;r6=HEAP32[r3+13];r7=(r6|0)==(HEAP32[r1>>2]|0);r8=r4+1244|0;HEAP32[r5+322]=-1;if(r7){r7=r1+4|0;HEAP32[r5+323]=HEAP32[r7>>2];HEAP32[r5+324]=HEAP32[r7>>2]}else{HEAP32[r5+323]=-2}r5=HEAP32[r3+15];if((r5|0)!=0){r9=r5;r10=_mwrite_one(r6,r9,0,138,r4,r8);r11=(r10|0)==1;r12=r11?4:16;return r12}r5=HEAP32[r3+11];if((r5|0)==0){r7=HEAP32[r3+12];r3=_strrchr(r7,47);r9=(r3|0)==0?r7:r3+1|0;r10=_mwrite_one(r6,r9,0,138,r4,r8);r11=(r10|0)==1;r12=r11?4:16;return r12}r3=r2+208|0;r2=0;r7=r3;while(1){r1=HEAP8[r5+(r2+40)|0];if(r1<<24>>24==0){r13=r7;break}HEAP8[r7]=r1;r1=r7+1|0;r14=r2+1|0;if(r14>>>0<256){r2=r14;r7=r1}else{r13=r1;break}}HEAP8[r13]=0;r9=r3;r10=_mwrite_one(r6,r9,0,138,r4,r8);r11=(r10|0)==1;r12=r11?4:16;return r12}function _rename_directory(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=r2+52|0;r4=HEAP32[r3>>2];r5=HEAP32[r2+40>>2];L572:do{if((r4|0)!=(r5|0)){r6=r4;while(1){r7=(HEAP32[r6>>2]|0)==5265052;L575:do{if(r7){r8=r6}else{r9=r6;while(1){r10=HEAP32[r9+8>>2];if((HEAP32[r10>>2]|0)==5265052){r8=r10;break L575}else{r9=r10}}}}while(0);if((HEAP32[r8+48>>2]|0)==-3){break}L580:do{if(r7){r11=r6}else{r9=r6;while(1){r10=HEAP32[r9+8>>2];if((HEAP32[r10>>2]|0)==5265052){r11=r10;break L580}else{r9=r10}}}}while(0);r7=HEAP32[r11+44>>2];if((r7|0)==(r5|0)){break L572}else{r6=r7}}if((HEAP32[r1+4>>2]|0)==-3){_fwrite(5249336,30,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);r12=16;return r12}else{r12=_rename_file(r1,r2);return r12}}}while(0);_fwrite(5251356,22,1,HEAP32[_stderr>>2]);__fprintPwd(HEAP32[_stderr>>2],r1,0,0);_fwrite(5250584,37,1,HEAP32[_stderr>>2]);r1=HEAP32[_stderr>>2];r2=HEAP32[r3>>2];L591:do{if((HEAP32[r2>>2]|0)==5265052){r13=r2}else{r3=r2;while(1){r5=HEAP32[r3+8>>2];if((HEAP32[r5>>2]|0)==5265052){r13=r5;break L591}else{r3=r5}}}}while(0);__fprintPwd(r1,r13+44|0,0,0);_fwrite(5249992,2,1,HEAP32[_stderr>>2]);r12=16;return r12}function _rename_oldsyntax(r1,r2){var r3,r4,r5,r6;r3=HEAP32[r2+16>>2],r4=r3>>2;HEAP32[r4+310]=r1;r5=HEAP32[r1>>2];HEAP32[r4+322]=-1;r6=r1+4|0;HEAP32[r4+323]=HEAP32[r6>>2];HEAP32[r4+324]=HEAP32[r6>>2];return(_mwrite_one(r5,HEAP32[r2+60>>2],0,138,r3,r3+1244|0)|0)==1?4:16}function _renameit(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=STACKTOP;STACKTOP=STACKTOP+312|0;r5=r2;r6=r2+4,r7=r6>>2;r8=r2+308;r9=r4+8|0;_memcpy(r9,HEAP32[r3+1240>>2]+8|0,32);_strncpy(r9,r1|0,8);_strncpy(r4+16|0,r1+8|0,3);do{if((HEAP8[r4+19|0]&16)<<24>>24!=0){r1=HEAP32[r3+48>>2];L600:do{if((HEAP32[r1>>2]|0)==5265052){r10=r1}else{r9=r1;while(1){r11=HEAP32[r9+8>>2];if((HEAP32[r11>>2]|0)==5265052){r10=r11;break L600}else{r9=r11}}}}while(0);r9=r10+44|0;r11=r9;r12=(r4|0)>>2;if((HEAP32[r9>>2]|0)==(HEAP32[r12]|0)){break}HEAP32[r7+1]=-1;HEAP32[r7]=r1;HEAP32[r7+74]=0;HEAP32[r7+75]=0;r13=_vfat_lookup(r6,5255792,2,16,0,0);do{if((r13|0)==-2){r14=16;STACKTOP=r2;return r14}else if((r13|0)==-1){_fwrite(5253024,31,1,HEAP32[_stderr>>2])}else if((r13|0)==0){r15=HEAP32[r12];FUNCTION_TABLE[HEAP32[HEAP32[r15>>2]+20>>2]](r15,0,0,0,r5);r15=HEAP32[r5>>2];r16=HEAP32[r12];r17=r16;L609:do{if((HEAP32[r16>>2]|0)==5264944){r18=r17}else{r19=r17;while(1){r20=HEAP32[r19+8>>2];if((HEAP32[r20>>2]|0)==5264944){r18=r20;break L609}else{r19=r20}}}}while(0);if((HEAP32[r18+72>>2]|0)==32){r21=HEAP32[r18+108>>2]}else{r21=0}if((r15|0)==(r21|0)){HEAP32[r5>>2]=0;r22=0}else{r22=r15}HEAP8[r6+35|0]=r22>>>8&255;HEAP8[r6+34|0]=r22&255;_dir_write(r6);if((HEAP32[r3+4>>2]|0)==0){break}_fwrite(5251952,48,1,HEAP32[_stderr>>2])}}while(0);_wipeEntry(r11);HEAP32[r8>>2]=HEAP32[r9>>2];_memcpy(r9,r4,304);r13=HEAP32[r12];if((r13|0)!=0){r1=r13+4|0;HEAP32[r1>>2]=HEAP32[r1>>2]+1|0}_free_stream(r8);r14=0;STACKTOP=r2;return r14}}while(0);_wipeEntry(HEAP32[r3+52>>2]);r14=0;STACKTOP=r2;return r14}function _consistencyCheck(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r9=0;r10=STACKTOP;HEAP32[r6>>2]=0;HEAP32[r5>>2]=1;HEAP32[r4>>2]=0;r11=(r7|0)!=0;r12=(r7+20|0)>>2;r13=(r7+24|0)>>2;r7=(r2|0)==0|(r3|0)==0;r3=1;r2=0;while(1){r14=(r3<<4)+r1+4|0;do{if(HEAP8[r14]<<24>>24==0){r15=r2}else{r16=(r3<<4)+r1|0;if(HEAP8[r16]<<24>>24!=0){HEAP32[r4>>2]=HEAP32[r4>>2]+1|0}do{if(r11){if((HEAP32[r12]|0)!=(HEAPU8[(r3<<4)+r1+5|0]+1|0)){r9=474;break}if((HEAP32[r13]|0)==(HEAP8[(r3<<4)+r1+6|0]&63|0)){r9=473;break}else{r9=474;break}}else{r9=473}}while(0);do{if(r9==473){r9=0;if((HEAP8[(r3<<4)+r1+2|0]&63)<<24>>24==1){r17=r2;break}else{r9=474;break}}}while(0);if(r9==474){r9=0;_fprintf(HEAP32[_stderr>>2],5251404,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r17=1}r18=HEAP32[r6>>2];do{if((r18|0)==0){r19=r17;r20=(r3<<4)+r1+8|0;r21=(r3<<4)+r1+9|0;r22=(r3<<4)+r1+10|0;r23=(r3<<4)+r1+11|0}else{r24=(r3<<4)+r1+8|0;r25=(r3<<4)+r1+9|0;r26=(r3<<4)+r1+10|0;r27=(r3<<4)+r1+11|0;if(HEAP32[r5>>2]>>>0<=(HEAPU8[r25]<<8|HEAPU8[r24]|(HEAPU8[r27]<<8|HEAPU8[r26])<<16)>>>0){r19=r17;r20=r24;r21=r25;r22=r26;r23=r27;break}_fprintf(HEAP32[_stderr>>2],5260696,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r18,HEAP32[tempInt+4>>2]=r3,tempInt));r19=1;r20=r24;r21=r25;r22=r26;r23=r27}}while(0);r18=(r3<<4)+r1+12|0;r27=(r3<<4)+r1+13|0;r26=(r3<<4)+r1+14|0;r25=(r3<<4)+r1+15|0;HEAP32[r5>>2]=(HEAPU8[r27]<<8|HEAPU8[r18]|(HEAPU8[r25]<<8|HEAPU8[r26])<<16)+(HEAPU8[r21]<<8|HEAPU8[r20]|(HEAPU8[r23]<<8|HEAPU8[r22])<<16)|0;HEAP32[r6>>2]=r3;do{if(r11){r24=HEAPU8[(r3<<4)+r1+2|0];r28=r24<<2&768|HEAPU8[(r3<<4)+r1+3|0];do{if((r28|0)==1023){r29=r19}else{if(((r24&63)-1+Math.imul(HEAPU8[(r3<<4)+r1+1|0]+Math.imul(HEAP32[r12],r28)|0,HEAP32[r13])|0|0)==(HEAPU8[r21]<<8|HEAPU8[r20]|(HEAPU8[r23]<<8|HEAPU8[r22])<<16|0)){r29=r19;break}_fprintf(HEAP32[_stderr>>2],5258072,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r29=1}}while(0);r28=HEAPU8[(r3<<4)+r1+6|0];r24=r28<<2&768|HEAPU8[(r3<<4)+r1+7|0];if((r24|0)==1023){r30=r29;break}if((Math.imul(HEAPU8[(r3<<4)+r1+5|0]+Math.imul(HEAP32[r12],r24)|0,HEAP32[r13])+(r28&63)|0|0)==((HEAPU8[r27]<<8|HEAPU8[r18]|(HEAPU8[r25]<<8|HEAPU8[r26])<<16)+(HEAPU8[r21]<<8|HEAPU8[r20]|(HEAPU8[r23]<<8|HEAPU8[r22])<<16)|0)){r30=r29;break}_fprintf(HEAP32[_stderr>>2],5255624,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r30=1}else{r30=r19}}while(0);if(r7){r15=r30;break}r28=HEAP32[_stdout>>2];if((r3|0)==(r8|0)){_fputc(42,r28)}else{_fputc(32,r28)}_printf(5252988,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));_printf(5251936,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r16],tempInt));_printf(5251344,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r28=HEAPU8[(r3<<4)+r1+2|0];r24=r28<<2&768|HEAPU8[(r3<<4)+r1+3|0];_printf(5252968,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=HEAPU8[(r3<<4)+r1+1|0],HEAP32[tempInt+4>>2]=r28&63,HEAP32[tempInt+8>>2]=r24,tempInt));_printf(5250568,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r14],tempInt));_printf(5249984,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r24=HEAPU8[(r3<<4)+r1+6|0];r28=r24<<2&768|HEAPU8[(r3<<4)+r1+7|0];_printf(5252968,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=HEAPU8[(r3<<4)+r1+5|0],HEAP32[tempInt+4>>2]=r24&63,HEAP32[tempInt+8>>2]=r28,tempInt));_printf(5249324,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r21]<<8|HEAPU8[r20]|(HEAPU8[r23]<<8|HEAPU8[r22])<<16,tempInt));_printf(5263772,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[r27]<<8|HEAPU8[r18]|(HEAPU8[r25]<<8|HEAPU8[r26])<<16,tempInt));_putchar(10);r15=r30}}while(0);r14=r3+1|0;if((r14|0)==5){break}else{r3=r14;r2=r15}}STACKTOP=r10;return r15}function _mpartition(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+2848|0;r6=r5,r7=r6>>2;r8=r5+4;r9=r5+8;r10=r5+12,r11=r10>>2;r12=r5+16;r13=r5+88;r14=r5+2136;r15=r5+2648;HEAP32[r9>>2]=0;HEAP32[r11]=0;r5=r14|0;r16=r14+430|0;do{if((r1|0)>1){if((_strcmp(HEAP32[r3+1],5259860)|0)!=0){r17=0;r18=0;r19=0;r20=0;r21=0;r22=0;r23=0;r24=2;r25=0;r26=0;r27=0;r28=0;r29=0;r30=0;r31=0;r32=0;r33=0;r34=0;r35=0;r36=0;break}_usage701(0)}else{r17=0;r18=0;r19=0;r20=0;r21=0;r22=0;r23=0;r24=2;r25=0;r26=0;r27=0;r28=0;r29=0;r30=0;r31=0;r32=0;r33=0;r34=0;r35=0;r36=0}}while(0);while(1){r37=_getopt_internal(r1,r2,5262448,0,0,0);if((r37|0)==118){r17=r17;r18=r18;r19=r19+1|0;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==83){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24|1;r25=r25;r26=1;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=_strtoul(HEAP32[1311167],0,0);r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==104){r17=r17;r18=r18;r19=r19;r20=r20;r21=_atoi(HEAP32[1311167]);r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==73){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24|1;r25=1;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=1;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==116){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=_atoi(HEAP32[1311167]);r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==108){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=1;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=_atoi(HEAP32[1311167]);r36=r36;continue}else if((r37|0)==102){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24|1;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=1;continue}else if((r37|0)==97){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24|1;r25=1;r26=r26;r27=r27;r28=1;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==112){r17=r17;r18=1;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==105){_set_cmd_line_image(HEAP32[1311167]);r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==100){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=1;r26=r26;r27=r27;r28=-1;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==99){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=1;r24=r24;r25=1;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==114){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=1;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=1;r35=r35;r36=r36;continue}else if((r37|0)==115){r17=r17;r18=r18;r19=r19;r20=_atoi(HEAP32[1311167]);r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==-1){break}else if((r37|0)==84){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24|1;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=_strtoul(HEAP32[1311167],0,0);r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==66){r17=HEAP32[1311167];r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=r27;r28=r28;r29=r29;r30=r30;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else if((r37|0)==98){r17=r17;r18=r18;r19=r19;r20=r20;r21=r21;r22=r22;r23=r23;r24=r24;r25=r25;r26=r26;r27=_atoi(HEAP32[1311167]);r28=r28;r29=r29;r30=1;r31=r31;r32=r32;r33=r33;r34=r34;r35=r35;r36=r36;continue}else{r4=513;break}}if(r4==513){_usage701(1)}r2=HEAP32[1311165];if((r1-r2|0)!=1){_usage701(1)}r1=HEAP32[(r2<<2>>2)+r3];r2=HEAP8[r1];if(r2<<24>>24==0){_usage701(1)}if(HEAP8[r1+1|0]<<24>>24!=58){_usage701(1)}r1=r15|0;r15=_toupper(r2<<24>>24)<<24>>24;_sprintf(r1,5262168,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));HEAP32[r7]=0;r2=HEAP32[1311840];r37=r2+4|0;r38=r6;if(HEAP8[r37]<<24>>24==0){r39=_free_stream(r38);r40=HEAP32[_stderr>>2];r41=HEAP32[r3];r42=_fprintf(r40,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r41,HEAP32[tempInt+4>>2]=r1,tempInt));_exit(1)}r6=r12;r43=(r22|0)==0;r44=(r21|0)==0;r45=(r20|0)==0;r46=r13|0;r13=(r25|0)!=0?2:0;r47=(r33|0)!=0;r48=r47?r13|512:r13;r13=(r26|0)==0;r26=(r19|0)==0;r49=(r12+24|0)>>2;r50=(r12+20|0)>>2;r51=(r12+16|0)>>2;r52=r32;r32=r2;r2=r37;L702:while(1){_free_stream(r38);do{if((HEAP8[r2]<<24>>24|0)==(r15|0)){r53=(r32+36|0)>>2;r37=HEAP32[r53];if((r37|0)==0|r37>>>0>4){_sprintf(r1,5261468,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));r54=r52;break}_memcpy(r6,r32,72);if(!r43){HEAP32[r51]=r22}if(!r44){HEAP32[r50]=r21}if(!r45){HEAP32[r49]=r20}_expand(HEAP32[r32>>2],r46);r37=_SimpleFileOpen(r12,r32,r46,r48,r1,r24,1,0);HEAP32[r7]=r37;if((r37|0)==0){r55=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r1,199,5261084,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r55,tempInt));r54=r52;break}r55=r13?0:r52;do{if((r32|0)==0){r56=r55}else{if((HEAP32[r32+40>>2]&1|0)==0){r56=r55;break}_fwrite(5249948,24,1,HEAP32[_stderr>>2]);if(r26){r56=-1987475062;break}_printf(5260620,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=-1987475062,tempInt));r56=-1987475062}}while(0);if((FUNCTION_TABLE[HEAP32[HEAP32[r37>>2]>>2]](r37,r5,0,512)|0)==512|r47){break L702}_snprintf(r1,199,5260360,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r46,tempInt));r54=r56}else{r54=r52}}while(0);r55=r32+76|0;if(HEAP8[r55]<<24>>24==0){r4=643;break}else{r52=r54;r32=r32+72|0;r2=r55}}if(r4==643){r39=_free_stream(r38);r40=HEAP32[_stderr>>2];r41=HEAP32[r3];r42=_fprintf(r40,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r41,HEAP32[tempInt+4>>2]=r1,tempInt));_exit(1)}r32=(r19|0)>1;if(r32){_print_sector(5260116,r5,512)}if(HEAP8[r2]<<24>>24==0){r39=_free_stream(r38);r40=HEAP32[_stderr>>2];r41=HEAP32[r3];r42=_fprintf(r40,5259868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r41,HEAP32[tempInt+4>>2]=r1,tempInt));_exit(1)}r1=(HEAP32[r50]|0)==0;do{if((HEAP32[r49]|0)==0){if(r1){break}r41=HEAP32[_stderr>>2];r40=_fwrite(5259672,79,1,r41);r42=HEAP32[_stderr>>2];r3=_fwrite(5259428,17,1,r42);_exit(1)}else{if(!r1){break}r41=HEAP32[_stderr>>2];r40=_fwrite(5259672,79,1,r41);r42=HEAP32[_stderr>>2];r3=_fwrite(5259428,17,1,r42);_exit(1)}}while(0);do{if((r33|0)==0){if(HEAP8[r14+510|0]<<24>>24==85){r4=554;break}else{r4=555;break}}else{do{if((r17|0)!=0){r1=_open(r17,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));if((r1|0)<0){_perror(5259228);_exit(1)}if((_read(r1,r5,512)|0)>=512){break}_perror(5259080);_exit(1)}}while(0);_memset(r14+446|0,0,64);HEAP8[r14+511|0]=-86;HEAP8[r14+510|0]=85;r4=554;break}}while(0);do{if(r4==554){if(HEAP8[r14+511|0]<<24>>24==-86){r57=0;break}else{r4=555;break}}}while(0);if(r4==555){_fwrite(5258740,23,1,HEAP32[_stderr>>2]);_fwrite(5258416,78,1,HEAP32[_stderr>>2]);r57=1}if((r34|0)==0){r58=r57}else{r34=HEAP32[r53];r14=HEAP8[(r34<<4)+r16+4|0];if(r14<<24>>24==0){_fprintf(HEAP32[_stderr>>2],5258028,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));r17=HEAP32[r53];r59=r17;r60=HEAP8[(r17<<4)+r16+4|0]}else{r59=r34;r60=r14}if((r60&63)<<24>>24==5){_fprintf(HEAP32[_stderr>>2],5257732,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));_fwrite(5257548,37,1,HEAP32[_stderr>>2]);r61=1;r62=HEAP32[r53]}else{r61=r57;r62=r59}_memset((r62<<4)+r16|0,0,16);r58=r61}r61=(r23|0)!=0;do{if(r61){if(HEAP8[(HEAP32[r53]<<4)+r16+4|0]<<24>>24==0){break}_fprintf(HEAP32[_stderr>>2],5257360,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));_fwrite(5257172,62,1,HEAP32[_stderr>>2])}}while(0);HEAP32[r11]=0;r23=(r30|0)==0;r62=(r29|0)==0;r29=0;r59=r27;r27=0;r57=1;r60=0;while(1){do{if(HEAP8[(r57<<4)+r16+4|0]<<24>>24==0){r63=r27;r64=r59;r65=r29;r66=r60}else{if(HEAP8[(r57<<4)+r16|0]<<24>>24==0){r67=r60}else{r14=r60+1|0;HEAP32[r11]=r14;r67=r14}if((HEAP32[r50]|0)==0){HEAP32[r50]=HEAPU8[(r57<<4)+r16+5|0]+1|0}if((HEAP32[r49]|0)==0){HEAP32[r49]=HEAP8[(r57<<4)+r16+6|0]&63}r14=HEAP32[r53];if(r57>>>0<r14>>>0&r23){r68=(HEAPU8[(r57<<4)+r16+13|0]<<8|HEAPU8[(r57<<4)+r16+12|0]|(HEAPU8[(r57<<4)+r16+15|0]<<8|HEAPU8[(r57<<4)+r16+14|0])<<16)+(HEAPU8[(r57<<4)+r16+9|0]<<8|HEAPU8[(r57<<4)+r16+8|0]|(HEAPU8[(r57<<4)+r16+11|0]<<8|HEAPU8[(r57<<4)+r16+10|0])<<16)|0}else{r68=r59}if(!(r57>>>0>r14>>>0&(r29|0)==0&r62)){r63=r27;r64=r68;r65=r29;r66=r67;break}r63=HEAPU8[(r57<<4)+r16+9|0]<<8|HEAPU8[(r57<<4)+r16+8|0]|(HEAPU8[(r57<<4)+r16+11|0]<<8|HEAPU8[(r57<<4)+r16+10|0])<<16;r64=r68;r65=1;r66=r67}}while(0);r14=r57+1|0;if((r14|0)==5){break}else{r29=r65;r59=r64;r27=r63;r57=r14;r60=r66}}r60=HEAP32[r49];do{if((r60|0)==0){if((HEAP32[r50]|0)!=0){r69=0;break}if((r56|0)==0){HEAP32[r50]=64;HEAP32[r49]=32;r69=32;break}if(r56>>>0<2097152&(r56&1023|0)==0){HEAP32[r50]=64;HEAP32[r49]=32;r69=32;break}r57=Math.floor((r56>>>0)/63488);do{if(((r56>>>0)%63488|0)==0){r70=0;r71=62;r72=r57}else{r27=r57+1|0;r59=r27<<10;r29=Math.floor((r56>>>0)/(r59>>>0));if(((r56>>>0)%(r59>>>0)|0)==0){r70=0;r71=r29;r72=r27;break}r59=r29+1|0;r70=(Math.floor((r56>>>0)/(Math.imul(r59,r27)>>>0))|0)==0;r71=r59;r72=r27}}while(0);HEAP32[r49]=r71;HEAP32[r50]=r72;if(!(r70|r72>>>0>255|r71>>>0>63)){r69=r71;break}HEAP32[r50]=64;HEAP32[r49]=32;r69=32}else{r69=r60}}while(0);if(r26){r73=r69}else{r26=HEAP32[r50];_fprintf(HEAP32[_stderr>>2],5256908,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r69,HEAP32[tempInt+4>>2]=r26,HEAP32[tempInt+8>>2]=r56,tempInt));r73=HEAP32[r49]}r26=HEAP32[r50];r69=Math.imul(r26,r73);if(r61){if((r65|0)!=0|(r56|0)==0){r74=r63;r75=r65}else{r74=r56-(r56>>>0)%(r69>>>0)|0;r75=1}r65=(r64|r30|0)==0?r73:r64;L813:do{if(r62){r64=HEAP32[r51];if((r64|0)==0){if((r75|0)!=0){r76=r74;r77=r65;break}_fwrite(5256568,13,1,HEAP32[_stderr>>2]);_exit(1)}r30=Math.imul(r64,r69);do{if(r23){r64=HEAP32[r53];if(r64>>>0<3|(r75|0)==0){break}r78=(r74-r30|0)<(r65|0)?r74-r65|0:r30;r79=r64;r4=602;break L813}}while(0);r80=r30-(r65|0)%(r69|0)|0;r4=600;break}else{r80=r35;r4=600}}while(0);do{if(r4==600){if(!r23){r81=r80;r4=604;break}r78=r80;r79=HEAP32[r53];r4=602;break}}while(0);do{if(r4==602){if(r79>>>0<3|(r75|0)==0){r81=r78;r4=604;break}r76=r74;r77=r74-r78|0;break}}while(0);if(r4==604){r76=r81+r65|0;r77=r65}_setBeginEnd((HEAP32[r53]<<4)+r16|0,r77,r76,r26,r73,(r66|0)==0&1,r31)}do{if((r28|0)!=0){r31=HEAP32[r53];r66=(r31<<4)+r16|0;if(HEAP8[(r31<<4)+r16+4|0]<<24>>24==0){_fprintf(HEAP32[_stderr>>2],5258028,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));break}if((r28|0)==1){HEAP8[r66|0]=-128;break}else if((r28|0)==-1){HEAP8[r66|0]=0;break}else{break}}}while(0);r28=_consistencyCheck(r16,r18,r19,r10,r9,r8,r12,HEAP32[r53])|r58;do{if((r18|0)!=0&(r28|0)==0){if(HEAP8[(HEAP32[r53]<<4)+r16+4|0]<<24>>24==0){break}_printf(5256380,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r15,tempInt));r58=HEAP32[r53];r12=Math.floor((((HEAPU8[(r58<<4)+r16+13|0]<<8|HEAPU8[(r58<<4)+r16+12|0]|(HEAPU8[(r58<<4)+r16+15|0]<<8|HEAPU8[(r58<<4)+r16+14|0])<<16)+((HEAPU8[(r58<<4)+r16+9|0]<<8|HEAPU8[(r58<<4)+r16+8|0]|(HEAPU8[(r58<<4)+r16+11|0]<<8|HEAPU8[(r58<<4)+r16+10|0])<<16)>>>0)%(r69>>>0)|0)>>>0)/(r69>>>0));HEAP32[r51]=r12;r58=HEAP32[r50];r10=HEAP32[r49];r66=HEAP32[r53];r31=HEAPU8[(r66<<4)+r16+9|0]<<8|HEAPU8[(r66<<4)+r16+8|0]|(HEAPU8[(r66<<4)+r16+11|0]<<8|HEAPU8[(r66<<4)+r16+10|0])<<16;_printf(5256168,(tempInt=STACKTOP,STACKTOP=STACKTOP+20|0,HEAP32[tempInt>>2]=r12,HEAP32[tempInt+4>>2]=r58,HEAP32[tempInt+8>>2]=r10,HEAP32[tempInt+12>>2]=r31,HEAP32[tempInt+16>>2]=r15,tempInt))}}while(0);do{if((r56|0)!=0){if(HEAP32[r9>>2]>>>0<=r56>>>0){break}_fprintf(HEAP32[_stderr>>2],5255928,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r8>>2],tempInt));_exit(1)}}while(0);r8=HEAP32[r11];if((r8|0)==0){_fwrite(5255572,48,1,HEAP32[_stderr>>2])}else if((r8|0)!=1){_fprintf(HEAP32[_stderr>>2],5255372,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r8,tempInt));_fwrite(5255248,57,1,HEAP32[_stderr>>2])}if((r28|0)!=0&(r36|0)==0){_fwrite(5254792,24,1,HEAP32[_stderr>>2]);if((r25|0)==0){_exit(1)}_fwrite(5254596,45,1,HEAP32[_stderr>>2]);_exit(1)}if((r25|0)==0){r82=_free_stream(r38);_exit(0)}if(r32){_print_sector(5254396,r5,512)}r32=HEAP32[r7];if((FUNCTION_TABLE[HEAP32[HEAP32[r32>>2]+4>>2]](r32,r5,0,512)|0)!=512){_fwrite(5254132,29,1,HEAP32[_stderr>>2]);_exit(1)}if((r19|0)<=2){r82=_free_stream(r38);_exit(0)}_print_sector(5253712,r5,512);r82=_free_stream(r38);_exit(0)}function _print_short_name(r1,r2){__fprintShortPwd(HEAP32[_stdout>>2],r1,0);_fputc(10,HEAP32[_stdout>>2]);return 4}function _dos_showfat(r1,r2){var r3,r4;r3=HEAP32[r2+40>>2];r4=HEAP32[r2+16>>2];__fprintPwd(HEAP32[_stdout>>2],r1,0,0);_fputc(32,HEAP32[_stdout>>2]);r1=HEAP32[r4+1232>>2];if((r1|0)==-1){_printFat(r3);r4=_putchar(10);return 4}else{_printFatWithOffset(r3,r1);r4=_putchar(10);return 4}}function _unix_showfat(r1){_fwrite(5260536,33,1,HEAP32[_stderr>>2]);return 16}function _zip_cmd(r1,r2,r3,r4){if((r1|0)==0){_fwrite(5249948,24,1,HEAP32[_stderr>>2]);return}_reclaim_privs();_fwrite(5249948,24,1,HEAP32[_stderr>>2]);r1=HEAP32[1310879];if((HEAP32[1311712]|0)==0){_setgid(r1)}else{_setgid(r1)}_setgid(HEAP32[1310880]);return}function _usage701(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5253216,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mshortname(r1,r2,r3){var r4,r5,r6;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1232|0;r5=r4,r4=r5>>2;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage706(0)}}while(0);while(1){r6=_getopt_internal(r1,r2,5251120,0,0,0);if((r6|0)==-1){r3=673;break}else if((r6|0)==104){r3=671;break}else if((r6|0)==63){r3=672;break}else if((r6|0)!=105){continue}_set_cmd_line_image(HEAP32[1311167])}if(r3==673){r6=HEAP32[1311165];if((r6|0)==(r1|0)){_usage706(0)}if((r6|0)<(r1|0)){_init_mp(r5);HEAP32[r4+2]=142;HEAP32[r4+4]=0;HEAP32[r4+6]=48;r4=HEAP32[1311165];_exit(_main_loop(r5,(r4<<2)+r2|0,r1-r4|0))}else{_usage706(1)}}else if(r3==671){_usage706(0)}else if(r3==672){_usage706(1)}}function _usage706(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5257952,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mshowfat(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1240|0;r5=r4,r6=r5>>2;r7=r4+4,r4=r7>>2;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){break}_usage712(0)}}while(0);r8=r7+1232|0;HEAP32[r8>>2]=-1;while(1){r9=_getopt_internal(r1,r2,5251112,0,0,0);if((r9|0)==-1){r3=696;break}else if((r9|0)==105){_set_cmd_line_image(HEAP32[1311167]);continue}else if((r9|0)==63){r3=695;break}else if((r9|0)==104){r3=694;break}else if((r9|0)!=111){continue}r9=HEAP32[1311167];HEAP32[r6]=0;r10=_strtol(r9,r5,0);L921:do{if((r10|0)<1){r11=0}else{r9=HEAP32[r6];r12=r9+1|0;HEAP32[r6]=r12;r13=HEAP8[r9];do{if(r13<<24>>24==115|r13<<24>>24==83){r14=r10<<9;r3=690;break}else if(r13<<24>>24==103|r13<<24>>24==71){r14=r10<<30;r3=690;break}else if(r13<<24>>24==109|r13<<24>>24==77){r14=r10<<20;r3=690;break}else if(r13<<24>>24==107|r13<<24>>24==75){r14=r10<<10;r3=690;break}else if(r13<<24>>24==0){r15=r10}else{r11=0;break L921}}while(0);if(r3==690){r3=0;if(HEAP8[r12]<<24>>24==0){r15=r14}else{r11=0;break}}r11=r15}}while(0);HEAP32[r8>>2]=r11}if(r3==696){if((r1-HEAP32[1311165]|0)<1){_usage712(1)}else{r11=r7|0;_init_mp(r11);HEAP32[r4+4]=r7;HEAP32[r4+2]=136;HEAP32[r4+3]=24;HEAP32[r4+6]=49;r4=HEAP32[1311165];_exit(_main_loop(r11,(r4<<2)+r2|0,r1-r4|0))}}else if(r3==695){_usage712(1)}else if(r3==694){_usage712(0)}}function _usage712(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5252872,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _mzip(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+2196|0;r5=r4;r6=r4+4;r7=r4+76;r8=r4+148;do{if((r1|0)>1){if((_strcmp(HEAP32[r2+4>>2],5259860)|0)!=0){r9=0;r10=0;break}_usage756(0)}else{r9=0;r10=0}}while(0);while(1){r4=_getopt_internal(r1,r2,5251092,0,0,0);if((r4|0)==119){if((r10&4|0)!=0){r3=717;break}r9=0;r10=r10|4;continue}else if((r4|0)==101){r9=r9;r10=r10|2;continue}else if((r4|0)==104){r3=725;break}else if((r4|0)==114){if((r10&4|0)!=0){r3=714;break}r9=2;r10=r10|4;continue}else if((r4|0)==117){if((r10&4|0)!=0){r3=723;break}r9=8;r10=r10|4;continue}else if((r4|0)==105){_set_cmd_line_image(HEAP32[1311167]);r9=r9;r10=r10;continue}else if((r4|0)==102){if((HEAP32[1310879]|0)!=0){r3=706;break}r9=r9;r10=r10|8;continue}else if((r4|0)==113){r9=r9;r10=r10|1;continue}else if((r4|0)==120){if((r10&4|0)!=0){r3=720;break}r9=5;r10=r10|4;continue}else if((r4|0)==-1){r3=727;break}else if((r4|0)==112){if((r10&4|0)!=0){r3=711;break}r9=3;r10=r10|4;continue}else{r3=726;break}}if(r3==725){_usage756(0)}else if(r3==726){_usage756(1)}else if(r3==706){_fwrite(5260500,32,1,HEAP32[_stderr>>2]);_exit(1)}else if(r3==717){_usage756(1)}else if(r3==723){_usage756(1)}else if(r3==727){r4=(r10|0)==0?1:r10;r10=HEAP32[1311165];r11=r1-r10|0;if((r11|0)>1){_usage756(1)}r12=(r11|0)==1;do{if(r12){r11=HEAP32[r2+(r10<<2)>>2];if(HEAP8[r11]<<24>>24==0){_usage756(1)}if(HEAP8[r11+1|0]<<24>>24!=58){_usage756(1)}if(!r12){r13=58;break}r13=HEAP8[HEAP32[r2+(r1-1<<2)>>2]]<<24>>24}else{r13=58}}while(0);r1=_toupper(r13);r13=HEAP32[1311840];r12=r13|0;r10=HEAP32[r12>>2];L982:do{if((r10|0)==0){r14=-1;r15=r13,r16=r15>>2}else{r11=r1<<24>>24;r17=r8|0;r18=(r4&6|0)!=0&(r4&8|0)==0;r19=r6+8|0;r20=r7+8|0;r21=r7+24|0;r22=r6+24|0;r23=(r4&5|0)==0;r24=-1;r25=r12;r26=r10;L984:while(1){r27=r25;do{if((HEAP8[r25+4|0]<<24>>24|0)==(r11|0)){_expand(r26,r17);do{if(r18){if((_stat(r17,r6)|0)!=0){r3=739;break L984}if((HEAP32[r19>>2]&61440|0)!=24576){break}r28=_setmntent(5255560,5259996);if((r28|0)==0){r3=744;break L984}r29=_getmntent(r28);L993:do{if((r29|0)!=0){r30=HEAP32[r22>>2];r31=r29;while(1){r32=HEAP32[r31>>2];do{if((r32|0)!=0){r33=HEAP32[r31+8>>2];if((_strcmp(r33,5254784)|0)==0){break}if((_strcmp(r33,5254588)|0)==0){break}if((_stat(r32,r7)|0)!=0){break}if((HEAP32[r20>>2]&61440|0)!=24576){break}if((HEAP32[r21>>2]|0)!=(r30|0)){r3=753;break L984}}}while(0);r32=_getmntent(r28);if((r32|0)==0){break L993}else{r31=r32}}}}while(0);_endmntent(r28)}}while(0);do{if((r25|0)==0){r34=0;r35=_open(r17,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{r29=r25+52|0;do{if((HEAP32[r29>>2]|0)!=0){r31=_fork();if((r31|0)==-1){r3=758;break L984}else if((r31|0)==0){r31=HEAP32[r29>>2];_execl(5260152,5257620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=5255324,HEAP32[tempInt+4>>2]=r31,HEAP32[tempInt+8>>2]=0,tempInt));break}else{_wait(r5);break}}}while(0);r29=r25+40|0;do{if((HEAP32[r29>>2]&2|0)!=0&(HEAP32[1311251]|0)==0){_setgid(HEAP32[1311713]);r31=HEAP32[1311712];if((r31|0)==0){_setgid(0);r36=_open(r17,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}else{_setgid(r31);r36=_open(r17,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}}else{r36=_open(r17,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);if((HEAP32[r29>>2]&2|0)==0){r34=1;r35=r36;break}r31=HEAP32[1310879];if((HEAP32[1311712]|0)==0){_setgid(r31)}else{_setgid(r31)}_setgid(HEAP32[1310880]);r34=1;r35=r36}}while(0);if((r35|0)==-1){r37=-1;break}_fcntl(r35,2,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=1,tempInt));if(r23){r14=r35;r15=r27,r16=r15>>2;break L982}if(r34){r38=(HEAP32[r25+40>>2]&2|0)!=0}else{r38=0}_zip_cmd(r38&1,r35,0,96);_close(r35);r37=r35}else{r37=r24}}while(0);r39=r25+72|0;r27=HEAP32[r39>>2];if((r27|0)==0){r3=777;break}else{r24=r37;r25=r39;r26=r27}}if(r3==744){_fprintf(HEAP32[_stderr>>2],5255228,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311159],HEAP32[tempInt+4>>2]=5255560,tempInt));_exit(1)}else if(r3==758){_perror(5250064);_exit(1)}else if(r3==777){r14=r37;r15=r39,r16=r15>>2;break}else if(r3==739){r26=HEAP32[_stderr>>2];r25=HEAP32[1311159];r24=_strerror(HEAP32[___errno_location()>>2]);_fprintf(r26,5255900,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r25,HEAP32[tempInt+4>>2]=r17,HEAP32[tempInt+8>>2]=r24,tempInt));_exit(1)}else if(r3==753){_endmntent(r28);_fwrite(5257904,44,1,HEAP32[_stderr>>2]);_exit(1)}}}while(0);if(HEAP8[r15+4|0]<<24>>24==0){_fprintf(HEAP32[_stderr>>2],5262124,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r2>>2],HEAP32[tempInt+4>>2]=r1<<24>>24,tempInt));_exit(1)}if((r4&5|0)!=0){if((r15|0)==0){r40=0;r41=r40&1;_get_zip_status(r41,r14)}r40=(HEAP32[r16+10]&2|0)!=0;r41=r40&1;_get_zip_status(r41,r14)}if((r4&4|0)==0){r42=r4}else{r42=(r9|0)==0?r4&-5:r4}if((r42&4|0)!=0){if((r15|0)==0){r43=0;r44=r43&1;_get_zip_status(r44,r14)}r43=(HEAP32[r16+10]&2|0)!=0;r44=r43&1;_get_zip_status(r44,r14)}if((r42&1|0)!=0){_printf(5258380,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1<<24>>24,tempInt))}if((r42&2|0)==0){_close(r14);_exit(0)}r1=(r15|0)==0;if((r42&8|0)==0){if(r1){r45=0;r46=r45&1;_zip_cmd(r46,r14,1,0);_perror(5256892);_exit(1)}r45=(HEAP32[r16+10]&2|0)!=0;r46=r45&1;_zip_cmd(r46,r14,1,0);_perror(5256892);_exit(1)}else{if(r1){r47=0;r48=r47&1;_zip_cmd(r48,r14,1,0);_perror(5257156);_exit(1)}r47=(HEAP32[r16+10]&2|0)!=0;r48=r47&1;_zip_cmd(r48,r14,1,0);_perror(5257156);_exit(1)}}else if(r3==720){_usage756(1)}else if(r3==711){_usage756(1)}else if(r3==714){_usage756(1)}}function _usage756(r1){var r2;r2=HEAP32[1311304];_fprintf(HEAP32[_stderr>>2],5254364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1311253],HEAP32[tempInt+4>>2]=r2,tempInt));_fprintf(HEAP32[_stderr>>2],5253856,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311159],tempInt));_exit(r1)}function _get_zip_status(r1,r2){_zip_cmd(r1,r2,0,128);_perror(5256156);_exit(1)}function _main(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;r5=_setlocale(0,5260912);do{if((r5|0)==0){r3=816}else{if((_strcmp(r5,5260408)|0)==0){r3=816;break}else{break}}}while(0);if(r3==816){_setlocale(0,5257796)}_init_privs();r3=HEAP32[r2>>2];r5=_strrchr(r3,47);r6=(r5|0)==0?r3:r5+1|0;HEAP32[1311159]=r3;do{if((r1|0)>2){if((_strcmp(HEAP32[r2+4>>2],5255324)|0)!=0){r7=r6;r8=r2;r9=r1;break}if((_strcmp(r6,5252836)|0)!=0){r7=r6;r8=r2;r9=r1;break}r3=r2+8|0;r7=HEAP32[r3>>2];r8=r3;r9=r1-2|0}else{r7=r6;r8=r2;r9=r1}}while(0);do{if((r9|0)>1){r1=HEAP32[r8+4>>2];if((_strcmp(r1,5251908)|0)!=0){if((_strcmp(r1,5251324)|0)!=0){break}}r1=HEAP32[1311253];_printf(5250532,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=r1,tempInt));_printf(5249908,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_printf(5249300,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_printf(5263748,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_printf(5263176,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_printf(5262428,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_printf(5262104,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_putchar(10);r10=0;STACKTOP=r4;return r10}}while(0);_read_config();_signal(1,120);_signal(2,120);_signal(15,120);_signal(3,120);r1=0;while(1){if((_strcmp(r7,HEAP32[(r1*12&-1)+5247028>>2])|0)==0){FUNCTION_TABLE[HEAP32[(r1*12&-1)+5247032>>2]](r9,r8,HEAP32[(r1*12&-1)+5247036>>2])}r2=r1+1|0;if((r2|0)==27){break}else{r1=r2}}if((_strcmp(r7,5252836)|0)!=0){_fprintf(HEAP32[_stderr>>2],5261052,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7,tempInt))}_fwrite(5260600,19,1,HEAP32[_stderr>>2]);r7=0;while(1){r1=HEAP32[_stderr>>2];if((r7&7|0)==0){_fputc(10,r1)}else{_fwrite(5260356,2,1,r1)}_fputs(HEAP32[(r7*12&-1)+5247028>>2],HEAP32[_stderr>>2]);r1=r7+1|0;if((r1|0)==27){break}else{r7=r1}}_fputc(10,HEAP32[_stderr>>2]);r10=1;STACKTOP=r4;return r10}function _scsi_read(r1,r2,r3,r4){_scsi_io(r1,r3,r4,0);return-1}function _SimpleFileOpen(r1,r2,r3,r4,r5,r6,r7,r8){var r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57;r9=r1>>2;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+2064|0;r12=r11;r13=r11+4;r14=r11+8;r15=r11+12;r16=r11+16;r17=_calloc(1,120),r18=r17>>2;if((r17|0)==0){_fwrite(5252256,19,1,HEAP32[_stderr>>2]);r19=0;STACKTOP=r11;return r19}_memset(r17,0,120);r20=r17+108|0;HEAP32[r20>>2]=512;r21=r17+100|0;HEAP32[r21>>2]=1;r22=r17;HEAP32[r22>>2]=5264868;do{if((r3|0)!=0){if((_strcmp(r3,5250368)|0)==0){break}r23=(r1|0)!=0;do{if(r23){r24=r6&1;if((r24|0)==0){HEAP32[r18+26]=HEAP32[r9+10]>>>1&1}r25=HEAP32[r9+3]|r4;r26=r1+52|0;do{if((HEAP32[r26>>2]|0)!=0){r27=_fork();if((r27|0)==0){r28=HEAP32[r26>>2];_execl(5260152,5257620,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=5255324,HEAP32[tempInt+4>>2]=r28,HEAP32[tempInt+8>>2]=0,tempInt));break}else if((r27|0)==-1){_perror(5250064);_exit(1)}else{_wait(r12);break}}}while(0);r26=r1+40|0;r27=HEAP32[r26>>2];if((r27&2|0)==0){r29=r27}else{do{if((HEAP32[1311251]|r24|0)==0){_setgid(HEAP32[1311713]);r27=HEAP32[1311712];if((r27|0)==0){_setgid(0);break}else{_setgid(r27);break}}}while(0);r29=HEAP32[r26>>2]}if((r29&1|0)==0){r30=(r29&4|0)!=0?292:438;r31=0;r32=r25;r10=867;break}else{r24=_open(r3,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[r18+22]=r24;r33=0;r34=r25;r35=r24;break}}else{r30=438;r31=1;r32=r4;r10=867;break}}while(0);if(r10==867){r24=_open(r3,r32,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r30,tempInt));HEAP32[r18+22]=r24;r33=r31;r34=r32;r35=r24}do{if(r23){if((HEAP32[r9+10]&2|0)==0){r36=r35;break}if((r6&1|0)!=0){r36=r35;break}r24=HEAP32[1310879];if((HEAP32[1311712]|0)==0){_setgid(r24)}else{_setgid(r24)}_setgid(HEAP32[1310880]);r36=HEAP32[r18+22]}else{r36=r35}}while(0);r24=(r17+88|0)>>2;if((r36|0)<0){_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}r27=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r5,199,5257644,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r3,HEAP32[tempInt+4>>2]=r27,tempInt));r19=0;STACKTOP=r11;return r19}do{if(r23){if((HEAP32[r9+10]&2|0)==0){break}if((r6&1|0)!=0){break}_fcntl(r36,2,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=1,tempInt))}}while(0);if((_fstat(HEAP32[r24],r17+16|0)|0)<0){_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}r27=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r5,199,5255328,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r3,HEAP32[tempInt+4>>2]=r27,tempInt));r19=0;STACKTOP=r11;return r19}do{if((r7|0)!=0){r27=HEAP32[r24];r28=(r34|0)==2;if(r33){if(!r28){break}}else{if((HEAP32[r9+10]&4|0)!=0|r28^1){break}}if((_lockf(r27,2,0)|0)>=0){break}if((HEAP32[___errno_location()>>2]|0)==22){break}if((HEAP32[___errno_location()>>2]|0)==95){break}if((r5|0)!=0){if(r23){r37=HEAP32[r9]}else{r37=5251892}r27=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r5,199,5252760,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r37,HEAP32[tempInt+4>>2]=r27,tempInt))}_close(HEAP32[r24]);_free(r17);r19=0;STACKTOP=r11;return r19}}while(0);if(r23){L1202:do{if((HEAP32[r9+10]&16|0)==0){r27=HEAP32[r9+4];if((r27|0)==0|(r2|0)==0){break}if((HEAP32[r2+40>>2]&16|0)!=0){break}r28=HEAP32[r2+16>>2];if((r28|0)==0|r33){break}do{if((r28|0)==(r27|0)){if((HEAP32[r2+20>>2]|0)!=(HEAP32[r9+5]|0)){break}if((HEAP32[r2+24>>2]|0)==(HEAP32[r9+6]|0)){break L1202}}}while(0);_close(HEAP32[r24]);_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}_memcpy(r5,5251272,25);r19=0;STACKTOP=r11;return r19}}while(0);HEAP32[r18+23]=HEAP32[r9+8]}else{HEAP32[r18+23]=0}HEAP32[r18+1]=1;HEAP32[r18+2]=0;HEAP32[r18+3]=0;r27=(r8|0)!=0;do{if(r27){do{if(r23){if((HEAP32[r9+10]&1|0)==0){r38=2147483647;break}r28=HEAP32[r20>>2];r25=0;while(1){if(r25>>>0>=24){r39=30;break}if((1<<r25|0)==(r28|0)){r10=915;break}else{r25=r25+1|0}}do{if(r10==915){if(r25>>>0>4294967265){r40=0}else{r39=30;break}while(1){if(r40>>>0>=24){r41=24;break}if((1<<r40|0)==(r28|0)){r41=r40;break}else{r40=r40+1|0}}r39=r41+30|0}}while(0);r38=(2<<r39)-2|1}else{r38=2147483647}}while(0);HEAP32[r8>>2]=r38;r28=HEAP32[r18+23];if(r28>>>0<=r38>>>0){HEAP32[r8>>2]=r38-r28|0;break}_close(HEAP32[r24]);_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}_memcpy(r5,5250492,30);r19=0;STACKTOP=r11;return r19}}while(0);if(r23){r28=r1+40|0;r25=HEAP32[r28>>2];if((r25&1|0)==0){r42=r25}else{HEAP32[r22>>2]=5264904;r25=r17+104|0;do{if((HEAP32[r25>>2]|0)!=0&(HEAP32[1311251]|0)==0){_setgid(HEAP32[1311713]);r26=HEAP32[1311712];if((r26|0)==0){_setgid(0);break}else{_setgid(r26);break}}}while(0);_fwrite(5249948,24,1,HEAP32[_stderr>>2]);if((HEAP32[r25>>2]|0)!=0){r26=HEAP32[1310879];if((HEAP32[1311712]|0)==0){_setgid(r26)}else{_setgid(r26)}_setgid(HEAP32[1310880])}r42=HEAP32[r28>>2]}r43=(r42&256|0)!=0}else{r43=0}HEAP32[r18+29]=r43&1;do{if(!((r6&2|0)!=0|r23^1)){r26=(r1+36|0)>>2;r44=HEAP32[r26];if(r44>>>0>4){_fprintf(HEAP32[_stderr>>2],5249836,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r44,tempInt));r45=HEAP32[r26]}else{r45=r44}if(!((r45|0)!=0&r45>>>0<5)){break}r44=r16+430|0;r46=r17;r47=HEAP32[HEAP32[r18]>>2];r48=0;r49=512;r50=r16|0;r51=0;while(1){r52=FUNCTION_TABLE[r47](r46,r50,r48,r49);if((r52|0)<1){r10=943;break}r53=r52+r51|0;if((r49|0)==(r52|0)){r54=r53;break}else{r48=r52+r48|0;r49=r49-r52|0;r50=r50+r52|0;r51=r53}}if(r10==943){r54=(r51|0)==0?r52:r51}if((r54|0)!=512){break}if((HEAPU8[r16+511|0]<<8|HEAPU8[r16+510|0]|0)!=43605){break}r50=HEAP32[r26];r49=HEAPU8[(r50<<4)+r44+9|0]<<8|HEAPU8[(r50<<4)+r44+8|0]|(HEAPU8[(r50<<4)+r44+11|0]<<8|HEAPU8[(r50<<4)+r44+10|0])<<16;do{if(r27){r50=HEAP32[r8>>2];if(r49>>>0<=r50>>>9>>>0){r48=r49<<9;HEAP32[r8>>2]=r50-r48|0;r55=r48;break}_close(HEAP32[r24]);_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}_memcpy(r5,5250492,30);r19=0;STACKTOP=r11;return r19}else{r55=r49<<9}}while(0);r49=r17+92|0;HEAP32[r49>>2]=HEAP32[r49>>2]+r55|0;r49=HEAP32[r26];if(HEAP8[(r49<<4)+r44+4|0]<<24>>24==0){if((r5|0)!=0){_memcpy(r5,5249260,29)}_close(HEAP32[r24]);_free(r17);r19=0;STACKTOP=r11;return r19}r51=r1+16|0;if((HEAP32[r51>>2]|0)==0){HEAP32[r9+5]=HEAPU8[(r49<<4)+r44+5|0]+1|0;r48=HEAPU8[(r49<<4)+r44+6|0];r50=r48&63;HEAP32[r9+6]=r50;r46=HEAP8[(r49<<4)+r44+2|0];HEAP32[r51>>2]=(r48<<2&768|HEAPU8[(r49<<4)+r44+7|0])+1-((r46&255)<<2&768|HEAPU8[(r49<<4)+r44+3|0])|0;r56=r50;r57=r46}else{r56=HEAP32[r9+6];r57=HEAP8[(r49<<4)+r44+2|0]}HEAP32[r9+7]=Math.imul(HEAPU8[(r49<<4)+r44+1|0],r56)-1+(r57&63)|0;if((HEAP32[1311255]|0)!=0){break}if((_consistencyCheck(r44,0,0,r13,r14,r15,r1,0)|0)==0){break}_fwrite(5263680,38,1,HEAP32[_stderr>>2]);_fwrite(5263128,30,1,HEAP32[_stderr>>2]);_fprintf(HEAP32[_stderr>>2],5262360,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r26],tempInt));_fwrite(5261900,171,1,HEAP32[_stderr>>2])}}while(0);HEAP32[r18+24]=-HEAP32[r18+23]|0;r19=r17;STACKTOP=r11;return r19}}while(0);r1=(r4|0)!=0&1;HEAP32[r18+22]=r1;HEAP32[r21>>2]=0;HEAP32[r18+1]=1;HEAP32[r18+2]=0;HEAP32[r18+3]=0;if((_fstat(r1,r17+16|0)|0)>=0){r19=r17;STACKTOP=r11;return r19}_free(r17);if((r5|0)==0){r19=0;STACKTOP=r11;return r19}r17=_strerror(HEAP32[___errno_location()>>2]);_snprintf(r5,199,5260276,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r17,tempInt));r19=0;STACKTOP=r11;return r19}function _file_flush(r1){return 0}function _file_discard(r1){return 0}function _signal_handler(r1){HEAP32[1311336]=1;return}function _file_data(r1,r2,r3,r4,r5){if((r2|0)!=0){HEAP32[r2>>2]=HEAP32[r1+56>>2]}if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r1+44>>2]}if((r4|0)!=0){HEAP32[r4>>2]=(HEAP32[r1+24>>2]&61440|0)==16384&1}if((r5|0)==0){return 0}HEAP32[r5>>2]=0;return 0}function _scsi_write(r1,r2,r3,r4){_scsi_io(r1,r3,r4,1);return-1}function _file_free(r1){var r2,r3;r2=HEAP32[r1+88>>2];if((r2|0)<=2){r3=0;return r3}r3=_close(r2);return r3}function _file_read(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=r1>>2;r6=0;r7=HEAP32[r5+23]+r3|0;do{if((HEAP32[r5+25]|0)==0){r6=1006}else{r3=r1+96|0;if((r7|0)==(HEAP32[r3>>2]|0)){r6=1006;break}if((_lseek(HEAP32[r5+22],r7,0)|0)>=0){r6=1006;break}_perror(5259200);HEAP32[r3>>2]=-1;r8=-1;break}}while(0);do{if(r6==1006){r1=_read(HEAP32[r5+22],r2,r4);if((r1|0)==-1){_perror(5259052);HEAP32[r5+24]=-1;r8=-1;break}else{HEAP32[r5+24]=r1+r7|0;r8=r1;break}}}while(0);if((HEAP32[r5+29]|0)==0|(r4|0)==0){return r8}else{r9=0}while(1){r5=r2+r9|0;r7=HEAP8[r5];r6=r2+(r9|1)|0;HEAP8[r5]=HEAP8[r6];HEAP8[r6]=r7;r7=r9+2|0;if(r7>>>0<r4>>>0){r9=r7}else{break}}return r8}function _file_write(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r5=r1>>2;r6=0;if((HEAP32[r5+29]|0)==0){r7=HEAP32[r5+23]+r3|0;do{if((HEAP32[r5+25]|0)!=0){r8=r1+96|0;if((r7|0)==(HEAP32[r8>>2]|0)){break}if((_lseek(HEAP32[r5+22],r7,0)|0)>=0){break}_perror(5259200);HEAP32[r8>>2]=-1;r9=-1;return r9}}while(0);r8=_write(HEAP32[r5+22],r2,r4);if((r8|0)==-1){_perror(5259052);HEAP32[r5+24]=-1;r9=-1;return r9}else{HEAP32[r5+24]=r8+r7|0;r9=r8;return r9}}r8=_malloc(r4);_memcpy(r8,r2,r4);L1364:do{if((r4|0)!=0){r2=0;while(1){r7=r8+r2|0;r10=HEAP8[r7];r11=r8+(r2|1)|0;HEAP8[r7]=HEAP8[r11];HEAP8[r11]=r10;r10=r2+2|0;if(r10>>>0<r4>>>0){r2=r10}else{break L1364}}}}while(0);r2=HEAP32[r5+23]+r3|0;do{if((HEAP32[r5+25]|0)==0){r6=1028}else{r3=r1+96|0;if((r2|0)==(HEAP32[r3>>2]|0)){r6=1028;break}if((_lseek(HEAP32[r5+22],r2,0)|0)>=0){r6=1028;break}_perror(5259200);HEAP32[r3>>2]=-1;r12=-1;break}}while(0);do{if(r6==1028){r1=_write(HEAP32[r5+22],r8,r4);if((r1|0)==-1){_perror(5259052);HEAP32[r5+24]=-1;r12=-1;break}else{HEAP32[r5+24]=r1+r2|0;r12=r1;break}}}while(0);_free(r8);r9=r12;return r9}function _reclaim_privs(){var r1;if((HEAP32[1311251]|0)!=0){return}_setgid(HEAP32[1311713]);r1=HEAP32[1311712];if((r1|0)==0){_setgid(0);return}else{_setgid(r1);return}}function _destroy_privs(){var r1,r2,r3,r4;do{if((HEAP32[1311712]|0)==0){_setgid(0);_setgid(HEAP32[1310879]);_setgid(HEAP32[1310879]);r1=HEAP32[1310879];if((HEAP32[1311712]|0)!=0){r2=r1;break}_setgid(r1);r3=HEAP32[1310880];r4=_setgid(r3);return}else{r2=HEAP32[1310879]}}while(0);_setgid(r2);r3=HEAP32[1310880];r4=_setgid(r3);return}function _init_privs(){var r1,r2,r3,r4;HEAP32[1311712]=_getgid();HEAP32[1310879]=_getgid();HEAP32[1311713]=_getgid();HEAP32[1310880]=_getgid();r1=HEAP32[1311712];r2=HEAP32[1310879];if((r1|0)==0&(r2|0)!=0){_setgid(0);r3=HEAP32[1311712];r4=HEAP32[1310879]}else{r3=r1;r4=r2}if((r3|0)==0){_setgid(r4);r3=HEAP32[1310880];r2=_setgid(r3);return}else{_setgid(r4);r3=HEAP32[1310880];r2=_setgid(r3);return}}function _flush_stream(r1){var r2,r3,r4;if((HEAP32[1312285]|0)!=0){r2=0;return r2}r3=HEAP32[HEAP32[r1>>2]+8>>2];if((r3|0)==0){r4=0}else{r4=FUNCTION_TABLE[r3](r1)}r3=HEAP32[r1+8>>2];if((r3|0)==0){r2=r4;return r2}else{return _flush_stream(r3)|r4}}function _file_geom(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r1=(r2+44|0)>>2;HEAP32[r1]=2;r6=(r2+48|0)>>2;HEAP32[r6]=128;do{if((r4|0)==240|(r4|0)>255){r7=HEAPU8[r5+27|0]<<8|HEAPU8[r5+26|0];r8=r2+20|0;HEAP32[r8>>2]=r7;r9=HEAPU8[r5+25|0]<<8|HEAPU8[r5+24|0];r10=r2+24|0;HEAP32[r10>>2]=r9;r11=HEAPU8[r5+20|0]<<8|HEAPU8[r5+19|0];r12=r11<<16>>16==0?HEAPU8[r5+33|0]<<8|HEAPU8[r5+32|0]|(HEAPU8[r5+35|0]<<8|HEAPU8[r5+34|0])<<16:r11&65535;r11=Math.imul(r7,r9);do{if((r11|0)==0){if((HEAP32[1311255]|0)==0){_fwrite(5260988,61,1,HEAP32[_stderr>>2]);_exit(1)}else{HEAP32[r8>>2]=1;HEAP32[r10>>2]=1;r13=1;r14=1;r15=1;break}}else{r13=r11;r14=r9;r15=r7}}while(0);r7=Math.floor(((r12-1+r13|0)>>>0)/(r13>>>0));HEAP32[r2+16>>2]=r7;r9=HEAPU8[r5+69|0]<<8|HEAPU8[r5+68|0];r11=HEAPU8[r5+71|0]<<8|HEAPU8[r5+70|0];r10=HEAPU8[r5+73|0]<<8|HEAPU8[r5+72|0];r8=HEAPU8[r5+75|0]<<8|HEAPU8[r5+74|0];if(HEAPU8[r5+21|0]<=239){r16=r14;r17=r7;r18=r15;break}if(HEAP8[((HEAPU8[r5+22|0]|HEAPU8[r5+23|0]<<8)<<16>>16==0?r5+64|0:r5+36|0)+2|0]<<24>>24!=41){r16=r14;r17=r7;r18=r15;break}if(r9>>>0<(r8+2|0)>>>0|(_strncmp(r5+3|0,5260596,2)|0)==0&r9>>>0<512&r11>>>0<512&r10>>>0<512&r8>>>0<512^1|r8>>>0<r10>>>0){r16=r14;r17=r7;r18=r15;break}if(!(r10>>>0>=r11>>>0&r11>>>0>75)){r16=r14;r17=r7;r18=r15;break}if(r9>>>0>63){r11=63;r10=0;while(1){r19=HEAP8[r5+r11|0]+r10&255;r20=r11+1|0;if((r20|0)<(r9|0)){r11=r20;r10=r19}else{break}}r21=r19<<24>>24==0}else{r21=1}r10=HEAP8[r5+r8|0];r11=r10&255;HEAP32[r1]=r11;if(!(r21&(r10&255)<8)){r16=r14;r17=r7;r18=r15;break}HEAP32[r6]=255;HEAP32[r1]=r11|128;r16=r14;r17=r7;r18=r15}else{if((r4|0)>247){r11=r4&3;r10=HEAP32[(r11*28&-1)+5244704>>2];HEAP32[r2+20>>2]=r10;r9=HEAP32[(r11*28&-1)+5244696>>2];HEAP32[r2+16>>2]=r9;r12=HEAP32[(r11*28&-1)+5244700>>2];HEAP32[r2+24>>2]=r12;HEAP32[r1]=128;HEAP32[r6]=-2;r16=r12;r17=r9;r18=r10;break}else{_fwrite(5260336,19,1,HEAP32[_stderr>>2]);_exit(1)}}}while(0);r6=(r2+24|0)>>2;r1=Math.imul(HEAPU8[r5+12|0]<<8|HEAPU8[r5+11|0],r16)>>>9;HEAP32[r6]=r1;if((r3|0)==0){r22=0;HEAP32[r6]=r16;return r22}if((HEAP32[r3+40>>2]&16|0)!=0){r22=0;HEAP32[r6]=r16;return r22}r5=HEAP32[r3+16>>2];if((r5|0)==0|(r2|0)==0|(r17|0)==0){r22=0;HEAP32[r6]=r16;return r22}do{if((r5|0)==(r17|0)){if((HEAP32[r3+20>>2]|0)!=(r18|0)){r23=1;break}r23=(HEAP32[r3+24>>2]|0)!=(r1|0)}else{r23=1}}while(0);r22=r23&1;HEAP32[r6]=r16;return r22}function _scsi_io(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=HEAP32[r1+92>>2]+r2|0;r2=HEAP32[r1+108>>2];r6=(r5|0)/(r2|0)&-1;if((r6|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}r7=Math.imul(r6,r2);r6=r5-r7|0;if((r6|0)<=-1){_fwrite(5259020,31,1,HEAP32[_stderr>>2]);_exit(1)}do{if(r3>>>0>512){r8=Math.floor(((r3-1+r2+r6|0)>>>0)/(r2>>>0));while(1){if(Math.imul(r2,r8)>>>0>r3>>>0){r8=r8-1|0}else{break}}if((r8|0)==0){_fwrite(5260080,22,1,HEAP32[_stderr>>2]);_exit(1)}if((r4|0)!=1|(r5|0)==(r7|0)){break}_fwrite(5259840,16,1,HEAP32[_stderr>>2]);_exit(1)}}while(0);r7=r1+104|0;do{if((HEAP32[r7>>2]|0)!=0&(HEAP32[1311251]|0)==0){_setgid(HEAP32[1311713]);r1=HEAP32[1311712];if((r1|0)==0){_setgid(0);break}else{_setgid(r1);break}}}while(0);_fwrite(5249948,24,1,HEAP32[_stderr>>2]);if((HEAP32[r7>>2]|0)==0){r9=(r4|0)==0;r10=r9?5259620:5259388;_perror(r10);return}r7=HEAP32[1310879];if((HEAP32[1311712]|0)==0){_setgid(r7)}else{_setgid(r7)}_setgid(HEAP32[1310880]);r9=(r4|0)==0;r10=r9?5259620:5259388;_perror(r10);return}function _allow_interrupts(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;STACKTOP=STACKTOP+48|0;r3=r2;r4=r2+12;r5=r2+24;r6=r2+36;r7=r6;HEAP32[r7>>2]=0;HEAP32[r7+4>>2]=0;HEAP32[r6+8>>2]=120;HEAP32[r6>>2]=0;if((_sigaction(2,r6,r1|0)|0)<0){_perror(5260104);_exit(1)}r6=r5;HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=0;HEAP32[r5+8>>2]=120;HEAP32[r5>>2]=0;if((_sigaction(2,r5,r1+12|0)|0)<0){_perror(5260104);_exit(1)}r5=r4;HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=0;HEAP32[r4+8>>2]=120;HEAP32[r4>>2]=0;if((_sigaction(2,r4,r1+24|0)|0)<0){_perror(5260104);_exit(1)}r4=r3;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;HEAP32[r3+8>>2]=120;HEAP32[r3>>2]=0;if((_sigaction(2,r3,r1+36|0)|0)<0){_perror(5260104);_exit(1)}else{STACKTOP=r2;return}}function _get_dir_data(r1,r2,r3,r4,r5){if((r2|0)!=0){HEAP32[r2>>2]=HEAP32[r1+56>>2]}if((r3|0)!=0){HEAP32[r3>>2]=HEAP32[r1+44>>2]}if((r4|0)!=0){HEAP32[r4>>2]=1}if((r5|0)==0){return 0}HEAP32[r5>>2]=0;return 0}function _free_stream(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=r1>>2;r1=HEAP32[r2];if((r1|0)==0){r3=-1;return r3}r4=r1+4|0;r1=HEAP32[r4>>2]-1|0;HEAP32[r4>>2]=r1;r4=HEAP32[r2];do{if((r1|0)==0){r5=HEAP32[r4>>2];r6=HEAP32[r5+8>>2];if((r6|0)==0){r7=0;r8=r4;r9=r5}else{r5=FUNCTION_TABLE[r6](r4);r6=HEAP32[r2];r7=r5;r8=r6;r9=HEAP32[r6>>2]}r6=HEAP32[r9+12>>2];if((r6|0)==0){r10=r7;r11=r8}else{r10=FUNCTION_TABLE[r6](r8)|r7;r11=HEAP32[r2]}r6=r11+8|0;if((HEAP32[r6>>2]|0)==0){r12=r10;r13=r11}else{r12=_free_stream(r6)|r10;r13=HEAP32[r2]}_free(r13);r14=r12}else{r6=HEAP32[r4+8>>2];if((r6|0)==0){r14=0;break}r14=_flush_stream(r6)}}while(0);HEAP32[r2]=0;r3=r14;return r3}function _get_data_pass_through(r1,r2,r3,r4,r5){var r6;r6=HEAP32[r1+8>>2];return FUNCTION_TABLE[HEAP32[HEAP32[r6>>2]+20>>2]](r6,r2,r3,r4,r5)}function _read_pass_through(r1,r2,r3,r4){var r5;r5=HEAP32[r1+8>>2];return FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]>>2]](r5,r2,r3,r4)}function _write_pass_through(r1,r2,r3,r4){var r5;r5=HEAP32[r1+8>>2];return FUNCTION_TABLE[HEAP32[HEAP32[r5>>2]+4>>2]](r5,r2,r3,r4)}function _get_dosConvert_pass_through(r1){var r2;r2=HEAP32[r1+8>>2];return FUNCTION_TABLE[HEAP32[HEAP32[r2>>2]+28>>2]](r2)}function _finish_sc(){var r1,r2,r3,r4,r5;r1=STACKTOP;r2=0;while(1){r3=(r2<<2)+5245772|0;r4=HEAP32[r3>>2];do{if((r4|0)!=0){r5=HEAP32[r4+4>>2];if((r5|0)==1){break}_fprintf(HEAP32[_stderr>>2],5260032,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2,HEAP32[tempInt+4>>2]=r5,tempInt))}}while(0);_free_stream(r3);r4=r2+1|0;if((r4|0)==256){break}else{r2=r4}}STACKTOP=r1;return}function _bufferize(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=0;r3=HEAP32[r1>>2];if((r3|0)==0){return}r4=(r3+12|0)>>2;r5=HEAP32[r4];do{if((r5|0)==0){r6=_malloc(56),r7=r6>>2;r8=r6;if((r6|0)==0){break}r9=_malloc(1048576);HEAP32[r7+13]=r9;if((r9|0)==0){_free(r6);break}else{HEAP32[r7+4]=1048576;HEAP32[r7+5]=0;HEAP32[r7+7]=512;HEAP32[r7+6]=32;r9=(r6+32|0)>>2;HEAP32[r9]=0;HEAP32[r9+1]=0;HEAP32[r9+2]=0;HEAP32[r9+3]=0;HEAP32[r9+4]=0;HEAP32[r7+2]=r3;HEAP32[r7]=5265124;HEAP32[r7+1]=1;HEAP32[r7+3]=0;HEAP32[r4]=r8;r10=r8;r2=1173;break}}else{r8=r3+4|0;HEAP32[r8>>2]=HEAP32[r8>>2]-1|0;r8=r5+4|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1|0;r10=HEAP32[r4];r2=1173;break}}while(0);do{if(r2==1173){if((r10|0)==0){break}HEAP32[r1>>2]=r10;return}}while(0);_free_stream(r1);HEAP32[r1>>2]=0;return}function _unix_dir_loop(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=STACKTOP;r4=_open(5249700,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r1+88|0;if((_chdir(HEAP32[r5>>2])|0)<0){r6=HEAP32[_stderr>>2];r7=HEAP32[r5>>2];r5=_strerror(HEAP32[___errno_location()>>2]);_fprintf(r6,526e4,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=r5,tempInt));r8=-1;STACKTOP=r3;return r8}r5=(r1+92|0)>>2;r1=_readdir(HEAP32[r5]);L1564:do{if((r1|0)==0|(HEAP32[1311336]|0)!=0){r9=0}else{r7=0;r6=r1;while(1){r10=r6;L1567:while(1){r11=r10+4|0;do{if(HEAP8[r11]<<24>>24!=0){if((_strcmp(r11,5249700)|0)==0){break}if((_strcmp(r11,5255792)|0)!=0){break L1567}}}while(0);r12=_readdir(HEAP32[r5]);if((r12|0)==0|(HEAP32[1311336]|0)!=0){r9=r7;break L1564}else{r10=r12}}r10=_unix_loop(0,r2,r11,0)|r7;r12=_readdir(HEAP32[r5]);if((r12|0)==0|(HEAP32[1311336]|0)!=0){r9=r10;break L1564}else{r7=r10;r6=r12}}}}while(0);if((_fchdir(r4)|0)<0){_perror(5257488)}_close(r4);r8=r9;STACKTOP=r3;return r8}function _OpenDir(r1){var r2,r3,r4,r5,r6;r2=_calloc(1,100),r3=r2>>2;HEAP32[r3]=5265088;HEAP32[r3+2]=0;HEAP32[r3+1]=1;HEAP32[r3+3]=0;r4=_malloc(_strlen(r1)+1|0);r5=(r2+88|0)>>2;HEAP32[r5]=r4;if((r4|0)==0){_free(r2);r6=0;return r6}_strcpy(r4,r1);if((_stat(r1,r2+16|0)|0)<0){_free(HEAP32[r5]);_free(r2);r6=0;return r6}r4=_opendir(r1);HEAP32[r3+23]=r4;if((r4|0)==0){_free(HEAP32[r5]);_free(r2);r6=0;return r6}else{r6=r2;return r6}}function _dir_free(r1){_free(HEAP32[r1+88>>2]);_closedir(HEAP32[r1+92>>2]);return 0}function _opentty(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+44|0;r3=r2;if(HEAP8[5244952]){r4=0;STACKTOP=r2;return r4}r5=HEAP32[1310724];do{if((r5|0)==0){r6=_open(5249664,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[1310722]=r6;if((r6|0)>-1){r7=_fdopen(r6,5259996);HEAP32[1310724]=r7;r8=r7}else{r8=HEAP32[1310724]}if((r8|0)!=0){r9=r8;break}if((_isatty(0)|0)!=0){HEAP32[1310722]=0;r7=HEAP32[_stdin>>2];HEAP32[1310724]=r7;r9=r7;break}HEAP8[5244952]=1;r4=0;STACKTOP=r2;return r4}else{r9=r5}}while(0);if((HEAP32[1311256]|0)==0){r4=r9;STACKTOP=r2;return r4}if(!((HEAP32[1310723]|0)!=(r1|0)&(r1|0)!=-1)){r4=r9;STACKTOP=r2;return r4}if(!HEAP8[5245340]){_tcgetattr(HEAP32[1310722],5245240);HEAP8[5245008]=1;_atexit(6);HEAP8[5245340]=1}_signal(1,120);_signal(2,120);_signal(15,120);_signal(3,120);_signal(14,42);_tcgetattr(HEAP32[1310722],r3);r9=(r3+12|0)>>2;r5=HEAP32[r9];if((r1|0)==0){HEAP32[r9]=r5|256;_tcsetattr(HEAP32[1310722],0,r3)}else{HEAP32[r9]=r5&-257;HEAP8[r3+32|0]=1;HEAP8[r3+33|0]=0;_tcsetattr(HEAP32[1310722],0,r3)}HEAP32[1310723]=r1;_tcflush(HEAP32[1310722],1);r4=HEAP32[1310724];STACKTOP=r2;return r4}function _ask_confirmation(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r4;r6=r4+12;if(HEAP8[5244952]){r7=0;STACKTOP=r4;return r7}do{if((HEAP32[1310724]|0)==0){r8=_open(5249664,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[1310722]=r8;if((r8|0)>-1){r9=_fdopen(r8,5259996);HEAP32[1310724]=r9;r10=r9}else{r10=HEAP32[1310724]}if((r10|0)!=0){break}if((_isatty(0)|0)==0){HEAP8[5244952]=1;r7=0;STACKTOP=r4;return r7}else{HEAP32[1310722]=0;r9=HEAP32[_stdin>>2];HEAP32[1310724]=r9;if((r9|0)==0){r7=0}else{break}STACKTOP=r4;return r7}}}while(0);r10=r6;r9=r5|0;while(1){HEAP32[r10>>2]=r2;_fprintf(HEAP32[_stderr>>2],r1,HEAP32[r6>>2]);_fflush(HEAP32[_stderr>>2]);do{if(HEAP8[5244952]){r11=0}else{r5=HEAP32[1310724];if((r5|0)!=0){r11=r5;break}r5=_open(5249664,0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[1310722]=r5;if((r5|0)>-1){r8=_fdopen(r5,5259996);HEAP32[1310724]=r8;r12=r8}else{r12=HEAP32[1310724]}if((r12|0)!=0){r11=r12;break}if((_isatty(0)|0)==0){HEAP8[5244952]=1;r11=0;break}else{HEAP32[1310722]=0;r8=HEAP32[_stdin>>2];HEAP32[1310724]=r8;r11=r8;break}}}while(0);_fflush(r11);if((HEAP32[1311256]|0)==0){if((_fgets(r9,9,_opentty(0))|0)==0){r3=1253;break}}else{HEAP8[r9]=_fgetc(_opentty(1))&255;_fputc(10,HEAP32[_stderr>>2])}r8=HEAP8[r9];if(r8<<24>>24==121|r8<<24>>24==89){r3=1255;break}else if(r8<<24>>24==110|r8<<24>>24==78){r7=-1;r3=1258;break}}if(r3==1253){HEAP8[r9]=110;r7=-1;STACKTOP=r4;return r7}else if(r3==1255){r7=0;STACKTOP=r4;return r7}else if(r3==1258){STACKTOP=r4;return r7}}function _cleanup_tty(){if(!((HEAP32[1310724]|0)!=0&HEAP8[5245008])){return}_tcsetattr(HEAP32[1310722],0,5245240);_signal(1,120);_signal(2,120);_signal(15,120);_signal(3,120);return}function _autorename(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r7=0;r8=STACKTOP;r9=HEAP8[r1];do{if(r9<<24>>24==0){r10=r6;r11=0;r7=1278}else{r12=r6;r13=r1;r14=r9;while(1){if((_strchr(r4,r14<<24>>24)|0)==0){r15=r12}else{HEAP8[r13]=95;r15=0}r16=r13+1|0;r17=HEAP8[r16];if(r17<<24>>24==0){break}else{r12=r15;r13=r16;r14=r17}}r14=HEAP8[r1];if(r14<<24>>24==r3<<24>>24|((r5|0)<1|r14<<24>>24==0)){r10=r15;r11=0;r7=1278;break}else{r18=-1;r19=0;r20=0;r21=0;r22=r14}while(1){r14=r22<<24>>24;do{if(r22<<24>>24==r2<<24>>24){r23=1;r24=0;r25=r19}else{if((r22-48&255)>=10){r23=r21;r24=r20;r25=-1;break}r23=r21*10&-1;r24=(r20*10&-1)-48+r14|0;r25=r18}}while(0);r26=r19+1|0;r14=HEAP8[r1+r26|0];r27=(r26|0)<(r5|0);if(r14<<24>>24==r3<<24>>24|r14<<24>>24!=0&r27^1){break}else{r18=r25;r19=r26;r20=r24;r21=r23;r22=r14}}if((r25|0)==-1){r10=r15;r11=r26;r7=1278;break}r14=r24+((r15|0)!=0&1)|0;r13=r14>>>0>999999;r12=r13?r19-1|0:r25;r17=r13?1:r14;if((r17|0)!=(r23|0)){r28=r17;r29=r26;r30=r12;r31=r15;break}if(r27){r28=r23;r29=r19+2|0;r30=r12;r31=r15;break}else{r28=r23;r29=r26;r30=r12-1|0;r31=r15;break}}}while(0);if(r7==1278){r15=r5-2|0;r26=(r11|0)>(r15|0);r28=1;r29=r26?r5:r11+2|0;r30=r26?r15:r11;r31=r10}r10=r1+r29|0;r29=HEAP8[r10];do{if((r31|0)==0){if(r28>>>0>1|(HEAP32[1311259]|0)!=0){r7=1286;break}else{break}}else{if((HEAP32[1311259]|r28|0)==0){break}else{r7=1286;break}}}while(0);if(r7==1286){_sprintf(r1+r30|0,5260588,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r2<<24>>24,HEAP32[tempInt+4>>2]=r28,tempInt))}if(r3<<24>>24==0){STACKTOP=r8;return}HEAP8[r10]=r29;STACKTOP=r8;return}function _tty_time_out(r1){_signal(14,1);if(!((HEAP32[1310724]|0)!=0&HEAP8[5245008])){_exit(0)}_tcsetattr(HEAP32[1310722],0,5245240);_exit(0)}function _write_vfat(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+576|0;r8=r7;r9=r7+304;r10=r7+320;r11=FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+28>>2]](r1);L1709:do{if((r3|0)==0){HEAP8[r10|0]=0;r12=0}else{r13=r8|0;HEAP32[r13>>2]=r1;HEAP8[r8+19|0]=15;HEAP8[r8+35|0]=0;HEAP8[r8+34|0]=0;HEAP8[r8+20|0]=0;r14=r2+11|0;r15=r2|0;r16=0;while(1){r17=HEAP8[r15]+(r16<<7|(r16&255)>>>1)&255;r18=r15+1|0;if(r18>>>0<r14>>>0){r15=r18;r16=r17}else{break}}HEAP8[r8+21|0]=r17;r16=0;r15=r3;while(1){HEAP8[r10+r16|0]=HEAP8[r15];r14=r16+1|0;if((r14|0)==256){break}else{r16=r14;r15=r15+1|0}}HEAP8[r10+256|0]=0;r15=r8+9|0;r16=r8+22|0;r14=r8+36|0;r18=r8+8|0;r19=r4+20|0;r20=r8+4|0;r21=20;while(1){r22=r21*13&-1;r23=r15;r24=r10+(r22-13)|0;r25=1;r26=0;while(1){if((r26|0)==0){HEAP8[r23+1|0]=HEAP8[r24]<<24>>24>>>8&255;HEAP8[r23|0]=HEAP8[r24];r27=HEAP8[r24]<<24>>24==0?64:0}else{HEAP8[r23|0]=-1;HEAP8[r23+1|0]=-1;r27=r26}if((r25|0)==5){break}r23=r23+2|0;r24=r24+1|0;r25=r25+1|0;r26=r27}r26=r16;r25=r10+(r22-8)|0;r24=1;r23=r27;while(1){if((r23|0)==0){HEAP8[r26+1|0]=HEAP8[r25]<<24>>24>>>8&255;HEAP8[r26|0]=HEAP8[r25];r28=HEAP8[r25]<<24>>24==0?64:0}else{HEAP8[r26|0]=-1;HEAP8[r26+1|0]=-1;r28=r23}if((r24|0)==6){break}r26=r26+2|0;r25=r25+1|0;r24=r24+1|0;r23=r28}r23=r14;r24=r10+(r22-2)|0;r25=1;r26=r28;while(1){if((r26|0)==0){HEAP8[r23+1|0]=HEAP8[r24]<<24>>24>>>8&255;HEAP8[r23|0]=HEAP8[r24];r29=HEAP8[r24]<<24>>24==0?64:0}else{HEAP8[r23|0]=-1;HEAP8[r23+1|0]=-1;r29=r26}if((r25|0)==2){break}r23=r23+2|0;r24=r24+1|0;r25=r25+1|0;r26=r29}HEAP8[r18]=((r21|0)==20?r21|64:r21)&255;r26=r19-r21|0;HEAP32[r20>>2]=r26;r25=HEAP32[r13>>2];r24=r25;r23=HEAP32[HEAP32[r25>>2]+4>>2];r25=r26<<5;r26=32;r22=r18;while(1){r30=FUNCTION_TABLE[r23](r24,r22,r25,r26);if((r30|0)<1){break}if((r26|0)==(r30|0)){break}else{r25=r30+r25|0;r26=r26-r30|0;r22=r22+r30|0}}r22=r21-1|0;if((r22|0)==0){r12=20;break L1709}else{r21=r22}}}}while(0);r29=r12+r4|0;r12=r29+1|0;r28=_allocDirCache(r1,r12);if((r28|0)==0){_fwrite(5255164,20,1,HEAP32[_stderr>>2]);_exit(1)}r1=r9|0;_unix_name(r11,r2|0,r2+8|0,0,r1);_addUsedEntry(r28,r4,r12,r10|0,r1,r5+8|0);r1=HEAP32[r5>>2];r10=r1;r12=HEAP32[HEAP32[r1>>2]+4>>2];r1=HEAP32[r5+4>>2]<<5;r4=32;r28=r5+8|0;while(1){r5=FUNCTION_TABLE[r12](r10,r28,r1,r4);if((r5|0)<1){r6=1333;break}if((r4|0)==(r5|0)){r6=1332;break}else{r1=r5+r1|0;r4=r4-r5|0;r28=r28+r5|0}}if(r6==1332){STACKTOP=r7;return r29}else if(r6==1333){STACKTOP=r7;return r29}}function _dir_write(r1){var r2,r3,r4,r5,r6,r7;r2=0;r3=(r1+4|0)>>2;r4=HEAP32[r3];if((r4|0)==-3){_fwrite(5252700,40,1,HEAP32[_stderr>>2]);_exit(1)}r5=r1|0;r6=_allocDirCache(HEAP32[r5>>2],r4+1|0);if((r6|0)==0){_fwrite(5251836,33,1,HEAP32[_stderr>>2]);_exit(1)}r4=HEAP32[HEAP32[r6>>2]+(HEAP32[r3]<<2)>>2];r7=r1+8|0;do{if((r4|0)!=0){if(HEAP8[r7]<<24>>24==-27){_addFreeEndEntry(r6,HEAP32[r4+4>>2],HEAP32[r4+8>>2],0);break}else{_memcpy(r4+20|0,r7,32);break}}}while(0);r4=HEAP32[r5>>2];r5=r4;r6=HEAP32[HEAP32[r4>>2]+4>>2];r4=HEAP32[r3]<<5;r3=32;r1=r7;while(1){r7=FUNCTION_TABLE[r6](r5,r1,r4,r3);if((r7|0)<1){r2=1346;break}if((r3|0)==(r7|0)){r2=1347;break}else{r4=r7+r4|0;r3=r3-r7|0;r1=r1+r7|0}}if(r2==1346){return}else if(r2==1347){return}}
function _vfat_lookup(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62;r7=0;r8=STACKTOP;STACKTOP=STACKTOP+372|0;r9=r8;r10=r8+56;r11=r8+112;r12=r8+116;r13=r1|0;r14=HEAP32[r13>>2];r15=FUNCTION_TABLE[HEAP32[HEAP32[r14>>2]+28>>2]](r14);r14=(r2|0)==0;if((r3|0)!=-1|r14){r16=r3}else{r16=_strlen(r2)}if(r14){r17=0}else{r14=r2+r16|0;L1783:do{if((r14|0)==0){r16=0;r3=r2;while(1){HEAP8[r12+r16|0]=HEAP8[r3];r18=r16+1|0;if((r18|0)==255){r19=255;break L1783}else{r16=r18;r3=r3+1|0}}}else{r3=0;r16=r2;while(1){if(r16>>>0>=r14>>>0){r19=r3;break L1783}HEAP8[r12+r3|0]=HEAP8[r16];r18=r3+1|0;if(r18>>>0<255){r3=r18;r16=r16+1|0}else{r19=r18;break L1783}}}}while(0);HEAP8[r12+r19|0]=0;r17=r19}r19=(r1+4|0)>>2;r14=HEAP32[r19];if((r14|0)==-2){r20=-1;STACKTOP=r8;return r20}r2=_allocDirCache(HEAP32[r13>>2],r14+1|0);if((r2|0)==0){_fwrite(5251224,39,1,HEAP32[_stderr>>2]);_exit(1)}r14=r2|0;r13=r12|0;r12=r9|0;r16=r10|0;r3=r1+8|0;r18=r1+19|0;r21=(r4&64|0)==0;r22=r1+40|0;r23=r4&32;r24=(r4&200|0)==0;r25=r10+1|0;r26=r10+2|0;r27=r10+3|0;r28=r10+4|0;r29=r10+5|0;r30=r10+6|0;r31=r10+7|0;r32=r10+8|0;r33=r10+9|0;r34=r10+10|0;r35=r10+11|0;r36=r10+12|0;r37=r10+13|0;r10=r4&16;r38=r9+1|0;r39=r9+2|0;r40=r9+3|0;r41=r9+4|0;r42=r9+5|0;r43=r9+6|0;r44=r9+7|0;r45=r9+8|0;r46=r9+9|0;r47=r9+10|0;r48=r9+11|0;r49=r9+12|0;r50=r9+13|0;r9=r4&8;L1797:while(1){r4=HEAP32[r19]+1|0;HEAP32[r11>>2]=0;r51=HEAP32[HEAP32[r14>>2]+(r4<<2)>>2];if((r51|0)==0){r4=_vfat_lookup_loop_common(r15,r1,r2,0,r11);if((r4|0)==0){r7=1363;break}else{r52=r4,r53=r52>>2}}else{HEAP32[r19]=HEAP32[r51+8>>2]-1|0;r52=r51,r53=r52>>2}r54=HEAP32[r53];if((r54|0)==0|(r54|0)==2){if((r54|0)==0){continue}else if((r54|0)==1){r7=1407;break}else{break}}else if((r54|0)!=1){r7=1366;break}_memcpy(r3,r52+20|0,32);if(!((HEAP8[r18]&8)<<24>>24==0|(r9|0)!=0)){continue}do{if(r21){r51=HEAP32[r53+4];if((r51|0)!=0){if((__match(r51,r13,r22,r17)|0)!=0){break}}if((__match(HEAP32[r53+3],r13,r22,r17)|0)==0){continue L1797}}}while(0);r51=HEAP8[r18];if(!((r51&16)<<24>>24==0|(r10|0)!=0)){if(!r24){continue}r4=HEAP32[r53+3];r55=HEAP8[r4];do{if(r55<<24>>24==0){r56=r12}else{HEAP8[r12]=r55;r57=HEAP8[r4+1|0];if(r57<<24>>24==0){r56=r38;break}HEAP8[r38]=r57;r57=HEAP8[r4+2|0];if(r57<<24>>24==0){r56=r39;break}HEAP8[r39]=r57;r57=HEAP8[r4+3|0];if(r57<<24>>24==0){r56=r40;break}HEAP8[r40]=r57;r57=HEAP8[r4+4|0];if(r57<<24>>24==0){r56=r41;break}HEAP8[r41]=r57;r57=HEAP8[r4+5|0];if(r57<<24>>24==0){r56=r42;break}HEAP8[r42]=r57;r57=HEAP8[r4+6|0];if(r57<<24>>24==0){r56=r43;break}HEAP8[r43]=r57;r57=HEAP8[r4+7|0];if(r57<<24>>24==0){r56=r44;break}HEAP8[r44]=r57;r57=HEAP8[r4+8|0];if(r57<<24>>24==0){r56=r45;break}HEAP8[r45]=r57;r57=HEAP8[r4+9|0];if(r57<<24>>24==0){r56=r46;break}HEAP8[r46]=r57;r57=HEAP8[r4+10|0];if(r57<<24>>24==0){r56=r47;break}HEAP8[r47]=r57;r57=HEAP8[r4+11|0];if(r57<<24>>24==0){r56=r48;break}HEAP8[r48]=r57;r57=HEAP8[r4+12|0];if(r57<<24>>24==0){r56=r49;break}HEAP8[r49]=r57;r56=r50}}while(0);HEAP8[r56]=0;_fprintf(HEAP32[_stderr>>2],5261436,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r12,tempInt));continue}if((r51&24)<<24>>24!=0|(r23|0)!=0){r7=1407;break}if(!r24){continue}r4=HEAP32[r53+3];r55=HEAP8[r4];do{if(r55<<24>>24==0){r58=r16}else{HEAP8[r16]=r55;r57=HEAP8[r4+1|0];if(r57<<24>>24==0){r58=r25;break}HEAP8[r25]=r57;r57=HEAP8[r4+2|0];if(r57<<24>>24==0){r58=r26;break}HEAP8[r26]=r57;r57=HEAP8[r4+3|0];if(r57<<24>>24==0){r58=r27;break}HEAP8[r27]=r57;r57=HEAP8[r4+4|0];if(r57<<24>>24==0){r58=r28;break}HEAP8[r28]=r57;r57=HEAP8[r4+5|0];if(r57<<24>>24==0){r58=r29;break}HEAP8[r29]=r57;r57=HEAP8[r4+6|0];if(r57<<24>>24==0){r58=r30;break}HEAP8[r30]=r57;r57=HEAP8[r4+7|0];if(r57<<24>>24==0){r58=r31;break}HEAP8[r31]=r57;r57=HEAP8[r4+8|0];if(r57<<24>>24==0){r58=r32;break}HEAP8[r32]=r57;r57=HEAP8[r4+9|0];if(r57<<24>>24==0){r58=r33;break}HEAP8[r33]=r57;r57=HEAP8[r4+10|0];if(r57<<24>>24==0){r58=r34;break}HEAP8[r34]=r57;r57=HEAP8[r4+11|0];if(r57<<24>>24==0){r58=r35;break}HEAP8[r35]=r57;r57=HEAP8[r4+12|0];if(r57<<24>>24==0){r58=r36;break}HEAP8[r36]=r57;r58=r37}}while(0);HEAP8[r58]=0;_fprintf(HEAP32[_stderr>>2],5260952,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r16,tempInt))}if(r7==1366){_fprintf(HEAP32[_stderr>>2],5261872,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r54,tempInt))}else if(r7==1363){if((HEAP32[r11>>2]|0)==0){_fwrite(5250448,35,1,HEAP32[_stderr>>2]);_exit(1)}else{r20=-2;STACKTOP=r8;return r20}}else if(r7==1407){do{if((r6|0)!=0){r7=HEAP32[r53+4];if((r7|0)==0){HEAP8[r6]=0;break}else{r59=0;r60=r6}while(1){r11=HEAP8[r7+r59|0];if(r11<<24>>24==0){r61=r60;break}HEAP8[r60]=r11;r11=r60+1|0;r54=r59+1|0;if(r54>>>0<255){r59=r54;r60=r11}else{r61=r11;break}}HEAP8[r61]=0}}while(0);if((r5|0)!=0){r61=HEAP32[r53+3];r60=HEAP8[r61];do{if(r60<<24>>24==0){r62=r5}else{HEAP8[r5]=r60;r59=r5+1|0;r6=HEAP8[r61+1|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r6=r5+2|0;r59=HEAP8[r61+2|0];if(r59<<24>>24==0){r62=r6;break}HEAP8[r6]=r59;r59=r5+3|0;r6=HEAP8[r61+3|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r6=r5+4|0;r59=HEAP8[r61+4|0];if(r59<<24>>24==0){r62=r6;break}HEAP8[r6]=r59;r59=r5+5|0;r6=HEAP8[r61+5|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r6=r5+6|0;r59=HEAP8[r61+6|0];if(r59<<24>>24==0){r62=r6;break}HEAP8[r6]=r59;r59=r5+7|0;r6=HEAP8[r61+7|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r6=r5+8|0;r59=HEAP8[r61+8|0];if(r59<<24>>24==0){r62=r6;break}HEAP8[r6]=r59;r59=r5+9|0;r6=HEAP8[r61+9|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r6=r5+10|0;r59=HEAP8[r61+10|0];if(r59<<24>>24==0){r62=r6;break}HEAP8[r6]=r59;r59=r5+11|0;r6=HEAP8[r61+11|0];if(r6<<24>>24==0){r62=r59;break}HEAP8[r59]=r6;r62=r5+12|0}}while(0);HEAP8[r62]=0}HEAP32[r1+296>>2]=HEAP32[r53+1];HEAP32[r1+300>>2]=HEAP32[r53+2]-1|0;r20=0;STACKTOP=r8;return r20}HEAP32[r19]=-2;r20=-1;STACKTOP=r8;return r20}function _vfat_lookup_loop_common(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+308|0;r8=r7;r9=r7+12;r10=r7+28;r11=(r2+4|0)>>2;r12=HEAP32[r11]+1|0;HEAP32[r5>>2]=0;r13=(r10+268|0)>>2;HEAP32[r13]=0;r14=(r10+264|0)>>2;HEAP32[r14]=0;r15=(r10+276|0)>>2;HEAP32[r15]=0;r16=r2|0;r17=r2+8|0;r18=r17|0;r19=(r17|0)==0;r20=r2+19|0;r21=r10+272|0;r22=r2+21|0;r23=r2+9|0;r24=r2+22|0;r25=r2+36|0;r26=(r4|0)==0;r4=0;L1886:while(1){r27=(r4|0)==0;while(1){r28=HEAP32[r11]+1|0;HEAP32[r11]=r28;r29=HEAP32[r16>>2];r30=r29;r31=HEAP32[HEAP32[r29>>2]>>2];r29=r28<<5;r28=32;r32=r18;r33=0;while(1){r34=FUNCTION_TABLE[r31](r30,r32,r29,r28);if((r34|0)<1){r6=1439;break}r35=r34+r33|0;if((r28|0)==(r34|0)){r36=r35;break}else{r29=r34+r29|0;r28=r28-r34|0;r32=r32+r34|0;r33=r35}}if(r6==1439){r6=0;r36=(r33|0)==0?r34:r33}if((r36|0)!=32){r6=1442;break L1886}if(r19){break L1886}if(!r27){break}r32=HEAP8[r18];if(r32<<24>>24==-27){r6=1472;break L1886}else if(r32<<24>>24==0){break}if(HEAP8[r20]<<24>>24!=15){r6=1473;break L1886}r28=r32&31;r29=r28&255;if((r28&255)>20){r28=HEAP32[r11];_fprintf(HEAP32[_stderr>>2],5262320,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r29,HEAP32[tempInt+4>>2]=r28,tempInt));continue}r28=HEAP8[r22];if(HEAP8[r21]<<24>>24==r28<<24>>24){r37=HEAP32[r14]}else{HEAP32[r13]=0;HEAP32[r14]=0;HEAP32[r15]=0;HEAP8[r21]=r28;r37=0}r28=r29-1|0;HEAP32[r14]=r37|1<<r28;r30=(r32&64)<<24>>24!=0;if(r30){HEAP32[r13]=r29}r29=r28*13&-1;r28=r29+(r10+5)|0;r32=r10+r29|0;r31=r23;while(1){if(HEAP8[r31+1|0]<<24>>24==0){r38=HEAP8[r31|0]}else{r38=95}HEAP8[r32]=r38;r35=r32+1|0;if(r35>>>0<r28>>>0){r32=r35;r31=r31+2|0}else{break}}r31=r29+(r10+11)|0;r32=r28;r33=r24;while(1){if(HEAP8[r33+1|0]<<24>>24==0){r39=HEAP8[r33|0]}else{r39=95}HEAP8[r32]=r39;r35=r32+1|0;if(r35>>>0<r31>>>0){r32=r35;r33=r33+2|0}else{break}}r33=r29+(r10+13)|0;r32=r31;r28=r25;while(1){if(HEAP8[r28+1|0]<<24>>24==0){r40=HEAP8[r28|0]}else{r40=95}HEAP8[r32]=r40;r35=r32+1|0;if(r35>>>0<r33>>>0){r32=r35;r28=r28+2|0}else{break}}if(!r30){continue}HEAP8[r33]=0}if(r26){r6=1449;break}else{r4=1}}do{if(r6==1442){if((r36|0)>=0){break}HEAP32[r5>>2]=-1;r41=0;STACKTOP=r7;return r41}else if(r6==1472){r41=_addFreeEndEntry(r3,r12,HEAP32[r11]+1|0,0);STACKTOP=r7;return r41}else if(r6==1473){r26=HEAP32[r13];do{if((r26|0)!=0){r40=r17;r25=r8;r39=r40|0;r24=HEAPU8[r39]|HEAPU8[r39+1|0]<<8|HEAPU8[r39+2|0]<<16|HEAPU8[r39+3|0]<<24|0;r39=r40+4|0;r40=HEAPU8[r39]|HEAPU8[r39+1|0]<<8|HEAPU8[r39+2|0]<<16|HEAPU8[r39+3|0]<<24|0;HEAP32[r25>>2]=r24;HEAP32[r25+4>>2]=r40;r25=r8+8|0;r39=r2+16|0;HEAP8[r25]=HEAP8[r39];HEAP8[r25+1|0]=HEAP8[r39+1|0];HEAP8[r25+2|0]=HEAP8[r39+2|0];r39=HEAP8[r21];r25=r8+11|0;r38=r24&255;r23=r8+1|0;r37=(r24>>>8|r40<<24)&255;while(1){r42=(r38<<7|(r38&255)>>>1)+r37&255;r40=r23+1|0;if(r40>>>0>=r25>>>0){break}r38=r42;r23=r40;r37=HEAP8[r40]}if(r39<<24>>24!=r42<<24>>24){break}r37=(1<<r26)-1|0;if((HEAP32[r14]&r37|0)!=(r37|0)){break}HEAP8[r10+(r26*13&-1)|0]=0;HEAP32[r15]=1}}while(0);if((HEAP32[r15]|0)==0){HEAP32[r13]=0;r43=0}else{r43=HEAP32[r13]}_addFreeEndEntry(r3,r12,HEAP32[r11]-r43|0,0);if((HEAP8[r20]&8)<<24>>24==0){r26=r9|0;_unix_name(r1,r18,r2+16|0,HEAP8[r2+20|0],r26);r44=r26}else{r26=(r1|0)>>2;r37=0;while(1){r23=HEAP8[r2+(r37+8)|0];if(r23<<24>>24==0){r45=r37;break}if(r23<<24>>24<32|r23<<24>>24==127){HEAP8[r9+r37|0]=HEAP8[HEAP32[r26]+(r23&127)|0]}else{HEAP8[r9+r37|0]=r23}r23=r37+1|0;if(r23>>>0<8){r37=r23}else{r45=r23;break}}r37=r9+r45|0;HEAP8[r37]=0;r23=HEAP8[r2+16|0];do{if(r23<<24>>24==0){r46=0}else{if(r23<<24>>24<32|r23<<24>>24==127){r47=HEAP8[HEAP32[r26]+(r23&127)|0]}else{r47=r23}HEAP8[r37]=r47;r38=HEAP8[r2+17|0];if(r38<<24>>24==0){r46=1;break}if(r38<<24>>24<32|r38<<24>>24==127){HEAP8[r45+(r9+1)|0]=HEAP8[HEAP32[r26]+(r38&127)|0]}else{HEAP8[r45+(r9+1)|0]=r38}r38=HEAP8[r2+18|0];if(r38<<24>>24==0){r46=2;break}if(r38<<24>>24<32|r38<<24>>24==127){HEAP8[r45+(r9+2)|0]=HEAP8[HEAP32[r26]+(r38&127)|0];r46=3;break}else{HEAP8[r45+(r9+2)|0]=r38;r46=3;break}}}while(0);HEAP8[r9+r46+r45|0]=0;r44=r9|0}r26=HEAP32[r11];r41=_addUsedEntry(r3,r26-HEAP32[r13]|0,r26+1|0,(HEAP32[r15]|0)==0?0:r10|0,r44,r17);STACKTOP=r7;return r41}else if(r6==1449){r41=_addEndEntry(r3,HEAP32[r11]);STACKTOP=r7;return r41}}while(0);_addFreeEndEntry(r3,r12,HEAP32[r11],r4);r41=_addEndEntry(r3,HEAP32[r11]);STACKTOP=r7;return r41}function _lookupForInsert(r1,r2,r3,r4,r5,r6,r7,r8,r9){var r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r10=0;r11=STACKTOP;STACKTOP=STACKTOP+580|0;r12=r11;r13=r11+4,r14=r13>>2;r15=r11+308;r16=r11+324;r17=r1|0;r18=FUNCTION_TABLE[HEAP32[HEAP32[r17>>2]+28>>2]](r1);r19=0;r20=r4;while(1){HEAP8[r16+r19|0]=HEAP8[r20];r4=r19+1|0;if((r4|0)==256){break}else{r19=r4;r20=r20+1|0}}r20=r16|0;HEAP8[r16+256|0]=0;r16=(r5+20|0)>>2;HEAP32[r16]=-1;r19=r5+8|0;HEAP32[r19>>2]=-1;r4=(r5+4|0)>>2;HEAP32[r4]=-1;r21=(r5+12|0)>>2;HEAP32[r21]=0;r22=(r5+24|0)>>2;HEAP32[r22]=0;r23=(r5+16|0)>>2;HEAP32[r23]=0;if((r9&1|0)==0){HEAP32[r5+28>>2]=1}else{HEAP32[r5+28>>2]=Math.floor(((_strlen(r20)+12|0)>>>0)/13)+1|0}r9=(r6|0)==-2;r24=r13+4|0;HEAP32[r24>>2]=-1;HEAP32[r14]=r1;HEAP32[r14+74]=0;HEAP32[r14+75]=0;HEAP32[r5>>2]=0;r14=_allocDirCache(r1,1);if((r14|0)==0){_fwrite(5249788,39,1,HEAP32[_stderr>>2]);_exit(1)}if(!r9){_unix_name(r18,r3|0,r3+8|0,0,r15|0)}r3=HEAP32[r14+8>>2];L1997:do{if((r7|0)>-1){r25=0}else{do{if((r3|0)!=0){if((_isHashed(r14,r20)|0)!=0){r25=0;break L1997}do{if(!r9){if((_isHashed(r14,r15|0)|0)==0){break}if((r8|0)==0){r25=0;break L1997}HEAP32[r4]=-2;r26=1;STACKTOP=r11;return r26}}while(0);if((r3|0)>=0){break}_fprintf(HEAP32[_stderr>>2],5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));_exit(1)}}while(0);r27=(r14+4|0)>>2;if((HEAP32[r27]|0)>(r3|0)){r25=r3;break}r28=(r14|0)>>2;r29=(r3<<1)+2|0;r30=_realloc(HEAP32[r28],r29<<2);r31=r30;HEAP32[r28]=r31;if((r30|0)==0){_fwrite(5249212,38,1,HEAP32[_stderr>>2]);_exit(1)}r30=HEAP32[r27];L2014:do{if((r30|0)<(r29|0)){HEAP32[r31+(r30<<2)>>2]=0;r32=r30+1|0;if((r32|0)==(r29|0)){break}else{r33=r32}while(1){HEAP32[HEAP32[r28]+(r33<<2)>>2]=0;r32=r33+1|0;if((r32|0)==(r29|0)){break L2014}else{r33=r32}}}}while(0);HEAP32[r27]=r29;r25=r3}}while(0);r3=r14|0;r33=r5+28|0;r8=r15|0;r15=r25;L2020:while(1){r25=HEAP32[HEAP32[r3>>2]+(r15<<2)>>2];do{if((r25|0)==0){r10=1538}else{if((HEAP32[r25>>2]|0)==2){r10=1538;break}else{r34=r25,r35=r34>>2;break}}}while(0);do{if(r10==1538){r10=0;HEAP32[r24>>2]=r15-1|0;if((_vfat_lookup_loop_common(r18,r13,r14,1,r12)|0)==0){if((HEAP32[r12>>2]|0)==0){r10=1540;break L2020}else{r34=0,r35=r34>>2;break}}else{r34=HEAP32[HEAP32[r3>>2]+(r15<<2)>>2],r35=r34>>2;break}}}while(0);r25=r34|0;r29=HEAP32[r25>>2];do{if((r29|0)==1){r27=r34+31|0;do{if((HEAP8[r27]&8)<<24>>24==0){r28=r34+8|0;r30=HEAP32[r28>>2];if((r30-1|0)!=(r7|0)){break}if((HEAP32[r22]|0)!=0){break}r31=HEAP32[r35+1];if((HEAP32[r23]|0)==(r31|0)){r36=HEAP32[r21];r37=r30}else{HEAP32[r21]=r31;r36=r31;r37=HEAP32[r28>>2]}HEAP32[r23]=r37;r28=HEAP32[r33>>2];if((r37-r36|0)>>>0<r28>>>0){break}HEAP32[r22]=1;HEAP32[r16]=r36-1+r28|0}}while(0);if((HEAP8[r27]&8)<<24>>24!=0){r10=1567;break}r38=r34+8|0;r39=HEAP32[r38>>2]-1|0;if((r39|0)==(r6|0)){r10=1567;break}r28=HEAP32[r35+4];if((r28|0)!=0){if((_strcasecmp(r28,r20)|0)==0){r10=1563;break L2020}}r28=HEAP32[r35+3];if((r28|0)!=0){if((_strcasecmp(r28,r20)|0)==0){r10=1563;break L2020}}if(r9){r10=1567;break}if((_strcasecmp(r8,r28)|0)!=0){r10=1567;break}HEAP32[r4]=r39;r10=1567;break}else if((r29|0)==0){if((HEAP32[r22]|0)!=0){r10=1567;break}r28=HEAP32[r35+1];if((HEAP32[r23]|0)==(r28|0)){r40=HEAP32[r21]}else{HEAP32[r21]=r28;r40=r28}r28=HEAP32[r35+2];HEAP32[r23]=r28;r31=HEAP32[r33>>2];if((r28-r40|0)>>>0<r31>>>0){r10=1567;break}HEAP32[r22]=1;HEAP32[r16]=r40-1+r31|0;r10=1567;break}else{r41=r29}}while(0);if(r10==1567){r10=0;r41=HEAP32[r25>>2]}if((r41|0)==2){r10=1570;break}r15=HEAP32[r35+2]}if(r10==1540){_fwrite(5263020,40,1,HEAP32[_stderr>>2]);_exit(1)}else if(r10==1563){HEAP32[r19>>2]=r39;HEAP32[r2+296>>2]=HEAP32[r35+1];HEAP32[r2+300>>2]=HEAP32[r38>>2]-1|0;r26=1;STACKTOP=r11;return r26}else if(r10==1570){if((HEAP32[r4]|0)>-1){r26=1;STACKTOP=r11;return r26}HEAP32[r5+32>>2]=HEAP32[r35+1];if((HEAP32[r22]|0)!=0){r26=6;STACKTOP=r11;return r26}L2074:do{if((HEAP32[r17>>2]|0)==5265052){r42=r1}else{r22=r1;while(1){r35=HEAP32[r22+8>>2];if((HEAP32[r35>>2]|0)==5265052){r42=r35;break L2074}else{r22=r35}}}}while(0);if((HEAP32[r42+16>>2]|0)!=156){r26=5;STACKTOP=r11;return r26}_fwrite(5263660,19,1,HEAP32[_stderr>>2]);r26=-1;STACKTOP=r11;return r26}}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[1316085];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+5264380|0;r10=(r8+2<<2)+5264380|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[1316085]=r5&(1<<r7^-1)}else{if(r12>>>0<HEAP32[1316089]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[1316087]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+5264380|0;r13=(r17+2<<2)+5264380|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[1316085]=r5&(1<<r19^-1)}else{if(r12>>>0<HEAP32[1316089]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[1316087];if((r12|0)!=0){r18=HEAP32[1316090];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+5264380|0;r11=HEAP32[1316085];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[1316085]=r11|r8;r20=r6;r21=(r12+2<<2)+5264380|0}else{r4=(r12+2<<2)+5264380|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[1316089]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[1316087]=r13;HEAP32[1316090]=r5;r14=r9;return r14}r12=HEAP32[1316086];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+5264644>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[1316089];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];L2138:do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];do{if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break L2138}else{r25=r8;r26=r12;break}}else{r25=r7;r26=r18}}while(0);while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L2160:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+5264644|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r6>>2]^-1);break L2160}else{if(r5>>>0<HEAP32[1316089]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L2160}}}while(0);if(r23>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[1316087];if((r6|0)!=0){r5=HEAP32[1316090];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+5264380|0;r12=HEAP32[1316085];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[1316085]=r12|r7;r27=r18;r28=(r6+2<<2)+5264380|0}else{r9=(r6+2<<2)+5264380|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[1316089]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[1316087]=r11;HEAP32[1316090]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3,r16=r15>>2;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[1316086];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+5264644>>2];L2208:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L2208}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break L2208}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+5264644>>2]}else{r38=r34}L2223:do{if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break L2223}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}}while(0);if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[1316087]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r19=r40,r31=r19>>2;r5=HEAP32[1316089];if(r19>>>0<r5>>>0){_abort()}r11=r19+r7|0;r18=r11;if(r19>>>0>=r11>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];L2236:do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];do{if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break L2236}else{r44=r8;r45=r6;break}}else{r44=r4;r45=r9}}while(0);while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r5>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r5>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L2258:do{if((r17|0)!=0){r13=r40+28|0;r5=(HEAP32[r13>>2]<<2)+5264644|0;do{if((r40|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r42;if((r42|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r13>>2]^-1);break L2258}else{if(r17>>>0<HEAP32[1316089]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L2258}}}while(0);if(r42>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r19+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r31]=r39|1;HEAP32[(r39>>2)+r31+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r5=(r17<<2)+5264380|0;r9=HEAP32[1316085];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[1316085]=r9|r6;r46=r5;r47=(r17+2<<2)+5264380|0}else{r13=(r17+2<<2)+5264380|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[1316089]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r18;HEAP32[r46+12>>2]=r18;HEAP32[r12+(r31+2)]=r46;HEAP32[r12+(r31+3)]=r5;break}r17=r11;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+5264644|0;HEAP32[r12+(r31+7)]=r48;HEAP32[r12+(r31+5)]=0;HEAP32[r12+(r31+4)]=0;r5=HEAP32[1316086];r30=1<<r48;if((r5&r30|0)==0){HEAP32[1316086]=r5|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r31+6)]=r6;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}r30=r39<<r49;r5=HEAP32[r6>>2];while(1){if((HEAP32[r5+4>>2]&-8|0)==(r39|0)){break}r50=(r30>>>31<<2)+r5+16|0;r6=HEAP32[r50>>2];if((r6|0)==0){r2=1733;break}else{r30=r30<<1;r5=r6}}if(r2==1733){if(r50>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r50>>2]=r17;HEAP32[r12+(r31+6)]=r5;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}}r30=r5+8|0;r6=HEAP32[r30>>2];r13=HEAP32[1316089];if(r5>>>0<r13>>>0){_abort()}if(r6>>>0<r13>>>0){_abort()}else{HEAP32[r6+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r31+2)]=r6;HEAP32[r12+(r31+3)]=r5;HEAP32[r12+(r31+6)]=0;break}}}while(0);r31=r40+8|0;if((r31|0)==0){r15=r7,r16=r15>>2;break}else{r14=r31}return r14}}while(0);r40=HEAP32[1316087];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r39=HEAP32[1316090];if(r50>>>0>15){r49=r39;HEAP32[1316090]=r49+r15|0;HEAP32[1316087]=r50;HEAP32[(r49+4>>2)+r16]=r50|1;HEAP32[r49+r40>>2]=r50;HEAP32[r39+4>>2]=r15|3}else{HEAP32[1316087]=0;HEAP32[1316090]=0;HEAP32[r39+4>>2]=r40|3;r50=r40+(r39+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r39+8|0;return r14}r39=HEAP32[1316088];if(r15>>>0<r39>>>0){r50=r39-r15|0;HEAP32[1316088]=r50;r39=HEAP32[1316091];r40=r39;HEAP32[1316091]=r40+r15|0;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r39+4>>2]=r15|3;r14=r39+8|0;return r14}do{if((HEAP32[1311266]|0)==0){r39=_sysconf(8);if((r39-1&r39|0)==0){HEAP32[1311268]=r39;HEAP32[1311267]=r39;HEAP32[1311269]=-1;HEAP32[1311270]=2097152;HEAP32[1311271]=0;HEAP32[1316196]=0;HEAP32[1311266]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r39=r15+48|0;r50=HEAP32[1311268];r40=r15+47|0;r49=r50+r40|0;r48=-r50|0;r50=r49&r48;if(r50>>>0<=r15>>>0){r14=0;return r14}r46=HEAP32[1316195];do{if((r46|0)!=0){r47=HEAP32[1316193];r41=r47+r50|0;if(r41>>>0<=r47>>>0|r41>>>0>r46>>>0){r14=0}else{break}return r14}}while(0);L2350:do{if((HEAP32[1316196]&4|0)==0){r46=HEAP32[1316091];L2352:do{if((r46|0)==0){r2=1763}else{r41=r46;r47=5264788;while(1){r51=r47|0;r42=HEAP32[r51>>2];if(r42>>>0<=r41>>>0){r52=r47+4|0;if((r42+HEAP32[r52>>2]|0)>>>0>r41>>>0){break}}r42=HEAP32[r47+8>>2];if((r42|0)==0){r2=1763;break L2352}else{r47=r42}}if((r47|0)==0){r2=1763;break}r41=r49-HEAP32[1316088]&r48;if(r41>>>0>=2147483647){r53=0;break}r5=_sbrk(r41);r17=(r5|0)==(HEAP32[r51>>2]+HEAP32[r52>>2]|0);r54=r17?r5:-1;r55=r17?r41:0;r56=r5;r57=r41;r2=1772;break}}while(0);do{if(r2==1763){r46=_sbrk(0);if((r46|0)==-1){r53=0;break}r7=r46;r41=HEAP32[1311267];r5=r41-1|0;if((r5&r7|0)==0){r58=r50}else{r58=r50-r7+(r5+r7&-r41)|0}r41=HEAP32[1316193];r7=r41+r58|0;if(!(r58>>>0>r15>>>0&r58>>>0<2147483647)){r53=0;break}r5=HEAP32[1316195];if((r5|0)!=0){if(r7>>>0<=r41>>>0|r7>>>0>r5>>>0){r53=0;break}}r5=_sbrk(r58);r7=(r5|0)==(r46|0);r54=r7?r46:-1;r55=r7?r58:0;r56=r5;r57=r58;r2=1772;break}}while(0);L2372:do{if(r2==1772){r5=-r57|0;if((r54|0)!=-1){r59=r55,r60=r59>>2;r61=r54,r62=r61>>2;r2=1783;break L2350}do{if((r56|0)!=-1&r57>>>0<2147483647&r57>>>0<r39>>>0){r7=HEAP32[1311268];r46=r40-r57+r7&-r7;if(r46>>>0>=2147483647){r63=r57;break}if((_sbrk(r46)|0)==-1){_sbrk(r5);r53=r55;break L2372}else{r63=r46+r57|0;break}}else{r63=r57}}while(0);if((r56|0)==-1){r53=r55}else{r59=r63,r60=r59>>2;r61=r56,r62=r61>>2;r2=1783;break L2350}}}while(0);HEAP32[1316196]=HEAP32[1316196]|4;r64=r53;r2=1780;break}else{r64=0;r2=1780}}while(0);do{if(r2==1780){if(r50>>>0>=2147483647){break}r53=_sbrk(r50);r56=_sbrk(0);if(!((r56|0)!=-1&(r53|0)!=-1&r53>>>0<r56>>>0)){break}r63=r56-r53|0;r56=r63>>>0>(r15+40|0)>>>0;r55=r56?r53:-1;if((r55|0)==-1){break}else{r59=r56?r63:r64,r60=r59>>2;r61=r55,r62=r61>>2;r2=1783;break}}}while(0);do{if(r2==1783){r64=HEAP32[1316193]+r59|0;HEAP32[1316193]=r64;if(r64>>>0>HEAP32[1316194]>>>0){HEAP32[1316194]=r64}r64=HEAP32[1316091],r50=r64>>2;L2392:do{if((r64|0)==0){r55=HEAP32[1316089];if((r55|0)==0|r61>>>0<r55>>>0){HEAP32[1316089]=r61}HEAP32[1316197]=r61;HEAP32[1316198]=r59;HEAP32[1316200]=0;HEAP32[1316094]=HEAP32[1311266];HEAP32[1316093]=-1;r55=0;while(1){r63=r55<<1;r56=(r63<<2)+5264380|0;HEAP32[(r63+3<<2)+5264380>>2]=r56;HEAP32[(r63+2<<2)+5264380>>2]=r56;r56=r55+1|0;if((r56|0)==32){break}else{r55=r56}}r55=r61+8|0;if((r55&7|0)==0){r65=0}else{r65=-r55&7}r55=r59-40-r65|0;HEAP32[1316091]=r61+r65|0;HEAP32[1316088]=r55;HEAP32[(r65+4>>2)+r62]=r55|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1316092]=HEAP32[1311270]}else{r55=5264788,r56=r55>>2;while(1){r66=HEAP32[r56];r67=r55+4|0;r68=HEAP32[r67>>2];if((r61|0)==(r66+r68|0)){r2=1795;break}r63=HEAP32[r56+2];if((r63|0)==0){break}else{r55=r63,r56=r55>>2}}do{if(r2==1795){if((HEAP32[r56+3]&8|0)!=0){break}r55=r64;if(!(r55>>>0>=r66>>>0&r55>>>0<r61>>>0)){break}HEAP32[r67>>2]=r68+r59|0;r55=HEAP32[1316091];r63=HEAP32[1316088]+r59|0;r53=r55;r57=r55+8|0;if((r57&7|0)==0){r69=0}else{r69=-r57&7}r57=r63-r69|0;HEAP32[1316091]=r53+r69|0;HEAP32[1316088]=r57;HEAP32[r69+(r53+4)>>2]=r57|1;HEAP32[r63+(r53+4)>>2]=40;HEAP32[1316092]=HEAP32[1311270];break L2392}}while(0);if(r61>>>0<HEAP32[1316089]>>>0){HEAP32[1316089]=r61}r56=r61+r59|0;r53=5264788;while(1){r70=r53|0;if((HEAP32[r70>>2]|0)==(r56|0)){r2=1805;break}r63=HEAP32[r53+8>>2];if((r63|0)==0){break}else{r53=r63}}do{if(r2==1805){if((HEAP32[r53+12>>2]&8|0)!=0){break}HEAP32[r70>>2]=r61;r56=r53+4|0;HEAP32[r56>>2]=HEAP32[r56>>2]+r59|0;r56=r61+8|0;if((r56&7|0)==0){r71=0}else{r71=-r56&7}r56=r59+(r61+8)|0;if((r56&7|0)==0){r72=0,r73=r72>>2}else{r72=-r56&7,r73=r72>>2}r56=r61+r72+r59|0;r63=r56;r57=r71+r15|0,r55=r57>>2;r40=r61+r57|0;r57=r40;r39=r56-(r61+r71)-r15|0;HEAP32[(r71+4>>2)+r62]=r15|3;do{if((r63|0)==(HEAP32[1316091]|0)){r54=HEAP32[1316088]+r39|0;HEAP32[1316088]=r54;HEAP32[1316091]=r57;HEAP32[r55+(r62+1)]=r54|1}else{if((r63|0)==(HEAP32[1316090]|0)){r54=HEAP32[1316087]+r39|0;HEAP32[1316087]=r54;HEAP32[1316090]=r57;HEAP32[r55+(r62+1)]=r54|1;HEAP32[(r54>>2)+r62+r55]=r54;break}r54=r59+4|0;r58=HEAP32[(r54>>2)+r62+r73];if((r58&3|0)==1){r52=r58&-8;r51=r58>>>3;L2437:do{if(r58>>>0<256){r48=HEAP32[((r72|8)>>2)+r62+r60];r49=HEAP32[r73+(r62+(r60+3))];r5=(r51<<3)+5264380|0;do{if((r48|0)!=(r5|0)){if(r48>>>0<HEAP32[1316089]>>>0){_abort()}if((HEAP32[r48+12>>2]|0)==(r63|0)){break}_abort()}}while(0);if((r49|0)==(r48|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r51^-1);break}do{if((r49|0)==(r5|0)){r74=r49+8|0}else{if(r49>>>0<HEAP32[1316089]>>>0){_abort()}r47=r49+8|0;if((HEAP32[r47>>2]|0)==(r63|0)){r74=r47;break}_abort()}}while(0);HEAP32[r48+12>>2]=r49;HEAP32[r74>>2]=r48}else{r5=r56;r47=HEAP32[((r72|24)>>2)+r62+r60];r46=HEAP32[r73+(r62+(r60+3))];L2458:do{if((r46|0)==(r5|0)){r7=r72|16;r41=r61+r54+r7|0;r17=HEAP32[r41>>2];do{if((r17|0)==0){r42=r61+r7+r59|0;r43=HEAP32[r42>>2];if((r43|0)==0){r75=0,r76=r75>>2;break L2458}else{r77=r43;r78=r42;break}}else{r77=r17;r78=r41}}while(0);while(1){r41=r77+20|0;r17=HEAP32[r41>>2];if((r17|0)!=0){r77=r17;r78=r41;continue}r41=r77+16|0;r17=HEAP32[r41>>2];if((r17|0)==0){break}else{r77=r17;r78=r41}}if(r78>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r78>>2]=0;r75=r77,r76=r75>>2;break}}else{r41=HEAP32[((r72|8)>>2)+r62+r60];if(r41>>>0<HEAP32[1316089]>>>0){_abort()}r17=r41+12|0;if((HEAP32[r17>>2]|0)!=(r5|0)){_abort()}r7=r46+8|0;if((HEAP32[r7>>2]|0)==(r5|0)){HEAP32[r17>>2]=r46;HEAP32[r7>>2]=r41;r75=r46,r76=r75>>2;break}else{_abort()}}}while(0);if((r47|0)==0){break}r46=r72+(r61+(r59+28))|0;r48=(HEAP32[r46>>2]<<2)+5264644|0;do{if((r5|0)==(HEAP32[r48>>2]|0)){HEAP32[r48>>2]=r75;if((r75|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r46>>2]^-1);break L2437}else{if(r47>>>0<HEAP32[1316089]>>>0){_abort()}r49=r47+16|0;if((HEAP32[r49>>2]|0)==(r5|0)){HEAP32[r49>>2]=r75}else{HEAP32[r47+20>>2]=r75}if((r75|0)==0){break L2437}}}while(0);if(r75>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r76+6]=r47;r5=r72|16;r46=HEAP32[(r5>>2)+r62+r60];do{if((r46|0)!=0){if(r46>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r76+4]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r46=HEAP32[(r54+r5>>2)+r62];if((r46|0)==0){break}if(r46>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r76+5]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r79=r61+(r52|r72)+r59|0;r80=r52+r39|0}else{r79=r63;r80=r39}r54=r79+4|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+(r62+1)]=r80|1;HEAP32[(r80>>2)+r62+r55]=r80;r54=r80>>>3;if(r80>>>0<256){r51=r54<<1;r58=(r51<<2)+5264380|0;r46=HEAP32[1316085];r47=1<<r54;do{if((r46&r47|0)==0){HEAP32[1316085]=r46|r47;r81=r58;r82=(r51+2<<2)+5264380|0}else{r54=(r51+2<<2)+5264380|0;r48=HEAP32[r54>>2];if(r48>>>0>=HEAP32[1316089]>>>0){r81=r48;r82=r54;break}_abort()}}while(0);HEAP32[r82>>2]=r57;HEAP32[r81+12>>2]=r57;HEAP32[r55+(r62+2)]=r81;HEAP32[r55+(r62+3)]=r58;break}r51=r40;r47=r80>>>8;do{if((r47|0)==0){r83=0}else{if(r80>>>0>16777215){r83=31;break}r46=(r47+1048320|0)>>>16&8;r52=r47<<r46;r54=(r52+520192|0)>>>16&4;r48=r52<<r54;r52=(r48+245760|0)>>>16&2;r49=14-(r54|r46|r52)+(r48<<r52>>>15)|0;r83=r80>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r83<<2)+5264644|0;HEAP32[r55+(r62+7)]=r83;HEAP32[r55+(r62+5)]=0;HEAP32[r55+(r62+4)]=0;r58=HEAP32[1316086];r49=1<<r83;if((r58&r49|0)==0){HEAP32[1316086]=r58|r49;HEAP32[r47>>2]=r51;HEAP32[r55+(r62+6)]=r47;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}if((r83|0)==31){r84=0}else{r84=25-(r83>>>1)|0}r49=r80<<r84;r58=HEAP32[r47>>2];while(1){if((HEAP32[r58+4>>2]&-8|0)==(r80|0)){break}r85=(r49>>>31<<2)+r58+16|0;r47=HEAP32[r85>>2];if((r47|0)==0){r2=1878;break}else{r49=r49<<1;r58=r47}}if(r2==1878){if(r85>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r85>>2]=r51;HEAP32[r55+(r62+6)]=r58;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}}r49=r58+8|0;r47=HEAP32[r49>>2];r52=HEAP32[1316089];if(r58>>>0<r52>>>0){_abort()}if(r47>>>0<r52>>>0){_abort()}else{HEAP32[r47+12>>2]=r51;HEAP32[r49>>2]=r51;HEAP32[r55+(r62+2)]=r47;HEAP32[r55+(r62+3)]=r58;HEAP32[r55+(r62+6)]=0;break}}}while(0);r14=r61+(r71|8)|0;return r14}}while(0);r53=r64;r55=5264788,r40=r55>>2;while(1){r86=HEAP32[r40];if(r86>>>0<=r53>>>0){r87=HEAP32[r40+1];r88=r86+r87|0;if(r88>>>0>r53>>>0){break}}r55=HEAP32[r40+2],r40=r55>>2}r55=r86+(r87-39)|0;if((r55&7|0)==0){r89=0}else{r89=-r55&7}r55=r86+(r87-47)+r89|0;r40=r55>>>0<(r64+16|0)>>>0?r53:r55;r55=r40+8|0,r57=r55>>2;r39=r61+8|0;if((r39&7|0)==0){r90=0}else{r90=-r39&7}r39=r59-40-r90|0;HEAP32[1316091]=r61+r90|0;HEAP32[1316088]=r39;HEAP32[(r90+4>>2)+r62]=r39|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1316092]=HEAP32[1311270];HEAP32[r40+4>>2]=27;HEAP32[r57]=HEAP32[1316197];HEAP32[r57+1]=HEAP32[1316198];HEAP32[r57+2]=HEAP32[1316199];HEAP32[r57+3]=HEAP32[1316200];HEAP32[1316197]=r61;HEAP32[1316198]=r59;HEAP32[1316200]=0;HEAP32[1316199]=r55;r55=r40+28|0;HEAP32[r55>>2]=7;L2556:do{if((r40+32|0)>>>0<r88>>>0){r57=r55;while(1){r39=r57+4|0;HEAP32[r39>>2]=7;if((r57+8|0)>>>0<r88>>>0){r57=r39}else{break L2556}}}}while(0);if((r40|0)==(r53|0)){break}r55=r40-r64|0;r57=r55+(r53+4)|0;HEAP32[r57>>2]=HEAP32[r57>>2]&-2;HEAP32[r50+1]=r55|1;HEAP32[r53+r55>>2]=r55;r57=r55>>>3;if(r55>>>0<256){r39=r57<<1;r63=(r39<<2)+5264380|0;r56=HEAP32[1316085];r47=1<<r57;do{if((r56&r47|0)==0){HEAP32[1316085]=r56|r47;r91=r63;r92=(r39+2<<2)+5264380|0}else{r57=(r39+2<<2)+5264380|0;r49=HEAP32[r57>>2];if(r49>>>0>=HEAP32[1316089]>>>0){r91=r49;r92=r57;break}_abort()}}while(0);HEAP32[r92>>2]=r64;HEAP32[r91+12>>2]=r64;HEAP32[r50+2]=r91;HEAP32[r50+3]=r63;break}r39=r64;r47=r55>>>8;do{if((r47|0)==0){r93=0}else{if(r55>>>0>16777215){r93=31;break}r56=(r47+1048320|0)>>>16&8;r53=r47<<r56;r40=(r53+520192|0)>>>16&4;r57=r53<<r40;r53=(r57+245760|0)>>>16&2;r49=14-(r40|r56|r53)+(r57<<r53>>>15)|0;r93=r55>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r93<<2)+5264644|0;HEAP32[r50+7]=r93;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r63=HEAP32[1316086];r49=1<<r93;if((r63&r49|0)==0){HEAP32[1316086]=r63|r49;HEAP32[r47>>2]=r39;HEAP32[r50+6]=r47;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}if((r93|0)==31){r94=0}else{r94=25-(r93>>>1)|0}r49=r55<<r94;r63=HEAP32[r47>>2];while(1){if((HEAP32[r63+4>>2]&-8|0)==(r55|0)){break}r95=(r49>>>31<<2)+r63+16|0;r47=HEAP32[r95>>2];if((r47|0)==0){r2=1913;break}else{r49=r49<<1;r63=r47}}if(r2==1913){if(r95>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r95>>2]=r39;HEAP32[r50+6]=r63;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}}r49=r63+8|0;r55=HEAP32[r49>>2];r47=HEAP32[1316089];if(r63>>>0<r47>>>0){_abort()}if(r55>>>0<r47>>>0){_abort()}else{HEAP32[r55+12>>2]=r39;HEAP32[r49>>2]=r39;HEAP32[r50+2]=r55;HEAP32[r50+3]=r63;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[1316088];if(r50>>>0<=r15>>>0){break}r64=r50-r15|0;HEAP32[1316088]=r64;r50=HEAP32[1316091];r55=r50;HEAP32[1316091]=r55+r15|0;HEAP32[(r55+4>>2)+r16]=r64|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;r3=0;if((r1|0)==0){return}r4=r1-8|0;r5=r4;r6=HEAP32[1316089];if(r4>>>0<r6>>>0){_abort()}r7=HEAP32[r1-4>>2];r8=r7&3;if((r8|0)==1){_abort()}r9=r7&-8,r10=r9>>2;r11=r1+(r9-8)|0;r12=r11;L2609:do{if((r7&1|0)==0){r13=HEAP32[r4>>2];if((r8|0)==0){return}r14=-8-r13|0,r15=r14>>2;r16=r1+r14|0;r17=r16;r18=r13+r9|0;if(r16>>>0<r6>>>0){_abort()}if((r17|0)==(HEAP32[1316090]|0)){r19=(r1+(r9-4)|0)>>2;if((HEAP32[r19]&3|0)!=3){r20=r17,r21=r20>>2;r22=r18;break}HEAP32[1316087]=r18;HEAP32[r19]=HEAP32[r19]&-2;HEAP32[r15+(r2+1)]=r18|1;HEAP32[r11>>2]=r18;return}r19=r13>>>3;if(r13>>>0<256){r13=HEAP32[r15+(r2+2)];r23=HEAP32[r15+(r2+3)];r24=(r19<<3)+5264380|0;do{if((r13|0)!=(r24|0)){if(r13>>>0<r6>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r17|0)){break}_abort()}}while(0);if((r23|0)==(r13|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r19^-1);r20=r17,r21=r20>>2;r22=r18;break}do{if((r23|0)==(r24|0)){r25=r23+8|0}else{if(r23>>>0<r6>>>0){_abort()}r26=r23+8|0;if((HEAP32[r26>>2]|0)==(r17|0)){r25=r26;break}_abort()}}while(0);HEAP32[r13+12>>2]=r23;HEAP32[r25>>2]=r13;r20=r17,r21=r20>>2;r22=r18;break}r24=r16;r19=HEAP32[r15+(r2+6)];r26=HEAP32[r15+(r2+3)];L2643:do{if((r26|0)==(r24|0)){r27=r14+(r1+20)|0;r28=HEAP32[r27>>2];do{if((r28|0)==0){r29=r14+(r1+16)|0;r30=HEAP32[r29>>2];if((r30|0)==0){r31=0,r32=r31>>2;break L2643}else{r33=r30;r34=r29;break}}else{r33=r28;r34=r27}}while(0);while(1){r27=r33+20|0;r28=HEAP32[r27>>2];if((r28|0)!=0){r33=r28;r34=r27;continue}r27=r33+16|0;r28=HEAP32[r27>>2];if((r28|0)==0){break}else{r33=r28;r34=r27}}if(r34>>>0<r6>>>0){_abort()}else{HEAP32[r34>>2]=0;r31=r33,r32=r31>>2;break}}else{r27=HEAP32[r15+(r2+2)];if(r27>>>0<r6>>>0){_abort()}r28=r27+12|0;if((HEAP32[r28>>2]|0)!=(r24|0)){_abort()}r29=r26+8|0;if((HEAP32[r29>>2]|0)==(r24|0)){HEAP32[r28>>2]=r26;HEAP32[r29>>2]=r27;r31=r26,r32=r31>>2;break}else{_abort()}}}while(0);if((r19|0)==0){r20=r17,r21=r20>>2;r22=r18;break}r26=r14+(r1+28)|0;r16=(HEAP32[r26>>2]<<2)+5264644|0;do{if((r24|0)==(HEAP32[r16>>2]|0)){HEAP32[r16>>2]=r31;if((r31|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r26>>2]^-1);r20=r17,r21=r20>>2;r22=r18;break L2609}else{if(r19>>>0<HEAP32[1316089]>>>0){_abort()}r13=r19+16|0;if((HEAP32[r13>>2]|0)==(r24|0)){HEAP32[r13>>2]=r31}else{HEAP32[r19+20>>2]=r31}if((r31|0)==0){r20=r17,r21=r20>>2;r22=r18;break L2609}}}while(0);if(r31>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r32+6]=r19;r24=HEAP32[r15+(r2+4)];do{if((r24|0)!=0){if(r24>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r32+4]=r24;HEAP32[r24+24>>2]=r31;break}}}while(0);r24=HEAP32[r15+(r2+5)];if((r24|0)==0){r20=r17,r21=r20>>2;r22=r18;break}if(r24>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r32+5]=r24;HEAP32[r24+24>>2]=r31;r20=r17,r21=r20>>2;r22=r18;break}}else{r20=r5,r21=r20>>2;r22=r9}}while(0);r5=r20,r31=r5>>2;if(r5>>>0>=r11>>>0){_abort()}r5=r1+(r9-4)|0;r32=HEAP32[r5>>2];if((r32&1|0)==0){_abort()}do{if((r32&2|0)==0){if((r12|0)==(HEAP32[1316091]|0)){r6=HEAP32[1316088]+r22|0;HEAP32[1316088]=r6;HEAP32[1316091]=r20;HEAP32[r21+1]=r6|1;if((r20|0)==(HEAP32[1316090]|0)){HEAP32[1316090]=0;HEAP32[1316087]=0}if(r6>>>0<=HEAP32[1316092]>>>0){return}_sys_trim(0);return}if((r12|0)==(HEAP32[1316090]|0)){r6=HEAP32[1316087]+r22|0;HEAP32[1316087]=r6;HEAP32[1316090]=r20;HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;return}r6=(r32&-8)+r22|0;r33=r32>>>3;L2714:do{if(r32>>>0<256){r34=HEAP32[r2+r10];r25=HEAP32[((r9|4)>>2)+r2];r8=(r33<<3)+5264380|0;do{if((r34|0)!=(r8|0)){if(r34>>>0<HEAP32[1316089]>>>0){_abort()}if((HEAP32[r34+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r25|0)==(r34|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r33^-1);break}do{if((r25|0)==(r8|0)){r35=r25+8|0}else{if(r25>>>0<HEAP32[1316089]>>>0){_abort()}r4=r25+8|0;if((HEAP32[r4>>2]|0)==(r12|0)){r35=r4;break}_abort()}}while(0);HEAP32[r34+12>>2]=r25;HEAP32[r35>>2]=r34}else{r8=r11;r4=HEAP32[r10+(r2+4)];r7=HEAP32[((r9|4)>>2)+r2];L2735:do{if((r7|0)==(r8|0)){r24=r9+(r1+12)|0;r19=HEAP32[r24>>2];do{if((r19|0)==0){r26=r9+(r1+8)|0;r16=HEAP32[r26>>2];if((r16|0)==0){r36=0,r37=r36>>2;break L2735}else{r38=r16;r39=r26;break}}else{r38=r19;r39=r24}}while(0);while(1){r24=r38+20|0;r19=HEAP32[r24>>2];if((r19|0)!=0){r38=r19;r39=r24;continue}r24=r38+16|0;r19=HEAP32[r24>>2];if((r19|0)==0){break}else{r38=r19;r39=r24}}if(r39>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r39>>2]=0;r36=r38,r37=r36>>2;break}}else{r24=HEAP32[r2+r10];if(r24>>>0<HEAP32[1316089]>>>0){_abort()}r19=r24+12|0;if((HEAP32[r19>>2]|0)!=(r8|0)){_abort()}r26=r7+8|0;if((HEAP32[r26>>2]|0)==(r8|0)){HEAP32[r19>>2]=r7;HEAP32[r26>>2]=r24;r36=r7,r37=r36>>2;break}else{_abort()}}}while(0);if((r4|0)==0){break}r7=r9+(r1+20)|0;r34=(HEAP32[r7>>2]<<2)+5264644|0;do{if((r8|0)==(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r36;if((r36|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r7>>2]^-1);break L2714}else{if(r4>>>0<HEAP32[1316089]>>>0){_abort()}r25=r4+16|0;if((HEAP32[r25>>2]|0)==(r8|0)){HEAP32[r25>>2]=r36}else{HEAP32[r4+20>>2]=r36}if((r36|0)==0){break L2714}}}while(0);if(r36>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r37+6]=r4;r8=HEAP32[r10+(r2+2)];do{if((r8|0)!=0){if(r8>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r37+4]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);r8=HEAP32[r10+(r2+3)];if((r8|0)==0){break}if(r8>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r37+5]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;if((r20|0)!=(HEAP32[1316090]|0)){r40=r6;break}HEAP32[1316087]=r6;return}else{HEAP32[r5>>2]=r32&-2;HEAP32[r21+1]=r22|1;HEAP32[(r22>>2)+r31]=r22;r40=r22}}while(0);r22=r40>>>3;if(r40>>>0<256){r31=r22<<1;r32=(r31<<2)+5264380|0;r5=HEAP32[1316085];r36=1<<r22;do{if((r5&r36|0)==0){HEAP32[1316085]=r5|r36;r41=r32;r42=(r31+2<<2)+5264380|0}else{r22=(r31+2<<2)+5264380|0;r37=HEAP32[r22>>2];if(r37>>>0>=HEAP32[1316089]>>>0){r41=r37;r42=r22;break}_abort()}}while(0);HEAP32[r42>>2]=r20;HEAP32[r41+12>>2]=r20;HEAP32[r21+2]=r41;HEAP32[r21+3]=r32;return}r32=r20;r41=r40>>>8;do{if((r41|0)==0){r43=0}else{if(r40>>>0>16777215){r43=31;break}r42=(r41+1048320|0)>>>16&8;r31=r41<<r42;r36=(r31+520192|0)>>>16&4;r5=r31<<r36;r31=(r5+245760|0)>>>16&2;r22=14-(r36|r42|r31)+(r5<<r31>>>15)|0;r43=r40>>>((r22+7|0)>>>0)&1|r22<<1}}while(0);r41=(r43<<2)+5264644|0;HEAP32[r21+7]=r43;HEAP32[r21+5]=0;HEAP32[r21+4]=0;r22=HEAP32[1316086];r31=1<<r43;do{if((r22&r31|0)==0){HEAP32[1316086]=r22|r31;HEAP32[r41>>2]=r32;HEAP32[r21+6]=r41;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20}else{if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r5=r40<<r44;r42=HEAP32[r41>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r40|0)){break}r45=(r5>>>31<<2)+r42+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){r3=2092;break}else{r5=r5<<1;r42=r36}}if(r3==2092){if(r45>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r45>>2]=r32;HEAP32[r21+6]=r42;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20;break}}r5=r42+8|0;r6=HEAP32[r5>>2];r36=HEAP32[1316089];if(r42>>>0<r36>>>0){_abort()}if(r6>>>0<r36>>>0){_abort()}else{HEAP32[r6+12>>2]=r32;HEAP32[r5>>2]=r32;HEAP32[r21+2]=r6;HEAP32[r21+3]=r42;HEAP32[r21+6]=0;break}}}while(0);r21=HEAP32[1316093]-1|0;HEAP32[1316093]=r21;if((r21|0)==0){r46=5264796}else{return}while(1){r21=HEAP32[r46>>2];if((r21|0)==0){break}else{r46=r21+8|0}}HEAP32[1316093]=-1;return}function _calloc(r1,r2){var r3,r4;do{if((r1|0)==0){r3=0}else{r4=Math.imul(r2,r1);if((r2|r1)>>>0<=65535){r3=r4;break}r3=(Math.floor((r4>>>0)/(r1>>>0))|0)==(r2|0)?r4:-1}}while(0);r2=_malloc(r3);if((r2|0)==0){return r2}if((HEAP32[r2-4>>2]&3|0)==0){return r2}_memset(r2,0,r3);return r2}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;_memcpy(r5,r1,r6>>>0<r2>>>0?r6:r2);_free(r1);r3=r5;return r3}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;do{if((HEAP32[1311266]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[1311268]=r2;HEAP32[1311267]=r2;HEAP32[1311269]=-1;HEAP32[1311270]=2097152;HEAP32[1311271]=0;HEAP32[1316196]=0;HEAP32[1311266]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;r4=r3&1;return r4}r2=HEAP32[1316091];if((r2|0)==0){r3=0;r4=r3&1;return r4}r5=HEAP32[1316088];do{if(r5>>>0>(r1+40|0)>>>0){r6=HEAP32[1311268];r7=Math.imul(Math.floor(((-40-r1-1+r5+r6|0)>>>0)/(r6>>>0))-1|0,r6);r8=r2;r9=5264788,r10=r9>>2;while(1){r11=HEAP32[r10];if(r11>>>0<=r8>>>0){if((r11+HEAP32[r10+1]|0)>>>0>r8>>>0){r12=r9;break}}r11=HEAP32[r10+2];if((r11|0)==0){r12=0;break}else{r9=r11,r10=r9>>2}}if((HEAP32[r12+12>>2]&8|0)!=0){break}r9=_sbrk(0);r10=(r12+4|0)>>2;if((r9|0)!=(HEAP32[r12>>2]+HEAP32[r10]|0)){break}r8=_sbrk(-(r7>>>0>2147483646?-2147483648-r6|0:r7)|0);r11=_sbrk(0);if(!((r8|0)!=-1&r11>>>0<r9>>>0)){break}r8=r9-r11|0;if((r9|0)==(r11|0)){break}HEAP32[r10]=HEAP32[r10]-r8|0;HEAP32[1316193]=HEAP32[1316193]-r8|0;r10=HEAP32[1316091];r13=HEAP32[1316088]-r8|0;r8=r10;r14=r10+8|0;if((r14&7|0)==0){r15=0}else{r15=-r14&7}r14=r13-r15|0;HEAP32[1316091]=r8+r15|0;HEAP32[1316088]=r14;HEAP32[r15+(r8+4)>>2]=r14|1;HEAP32[r13+(r8+4)>>2]=40;HEAP32[1316092]=HEAP32[1311270];r3=(r9|0)!=(r11|0);r4=r3&1;return r4}}while(0);if(HEAP32[1316088]>>>0<=HEAP32[1316092]>>>0){r3=0;r4=r3&1;return r4}HEAP32[1316092]=-1;r3=0;r4=r3&1;return r4}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=r4&-8,r6=r5>>2;r7=r1,r8=r7>>2;r9=r7+r5|0;r10=r9;r11=HEAP32[1316089];if(r7>>>0<r11>>>0){_abort()}r12=r4&3;if(!((r12|0)!=1&r7>>>0<r9>>>0)){_abort()}r13=(r7+(r5|4)|0)>>2;r14=HEAP32[r13];if((r14&1|0)==0){_abort()}if((r12|0)==0){if(r2>>>0<256){r15=0;return r15}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[1311268]<<1>>>0){break}else{r15=r1}return r15}}while(0);r15=0;return r15}if(r5>>>0>=r2>>>0){r12=r5-r2|0;if(r12>>>0<=15){r15=r1;return r15}HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|3;HEAP32[r13]=HEAP32[r13]|1;_dispose_chunk(r7+r2|0,r12);r15=r1;return r15}if((r10|0)==(HEAP32[1316091]|0)){r12=HEAP32[1316088]+r5|0;if(r12>>>0<=r2>>>0){r15=0;return r15}r13=r12-r2|0;HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r13|1;HEAP32[1316091]=r7+r2|0;HEAP32[1316088]=r13;r15=r1;return r15}if((r10|0)==(HEAP32[1316090]|0)){r13=HEAP32[1316087]+r5|0;if(r13>>>0<r2>>>0){r15=0;return r15}r12=r13-r2|0;if(r12>>>0>15){HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|1;HEAP32[(r13>>2)+r8]=r12;r16=r13+(r7+4)|0;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;r17=r7+r2|0;r18=r12}else{HEAP32[r3]=r4&1|r13|2;r4=r13+(r7+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r17=0;r18=0}HEAP32[1316087]=r18;HEAP32[1316090]=r17;r15=r1;return r15}if((r14&2|0)!=0){r15=0;return r15}r17=(r14&-8)+r5|0;if(r17>>>0<r2>>>0){r15=0;return r15}r18=r17-r2|0;r4=r14>>>3;L2947:do{if(r14>>>0<256){r13=HEAP32[r6+(r8+2)];r12=HEAP32[r6+(r8+3)];r16=(r4<<3)+5264380|0;do{if((r13|0)!=(r16|0)){if(r13>>>0<r11>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r12|0)==(r13|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r4^-1);break}do{if((r12|0)==(r16|0)){r19=r12+8|0}else{if(r12>>>0<r11>>>0){_abort()}r20=r12+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r13+12>>2]=r12;HEAP32[r19>>2]=r13}else{r16=r9;r20=HEAP32[r6+(r8+6)];r21=HEAP32[r6+(r8+3)];L2949:do{if((r21|0)==(r16|0)){r22=r5+(r7+20)|0;r23=HEAP32[r22>>2];do{if((r23|0)==0){r24=r5+(r7+16)|0;r25=HEAP32[r24>>2];if((r25|0)==0){r26=0,r27=r26>>2;break L2949}else{r28=r25;r29=r24;break}}else{r28=r23;r29=r22}}while(0);while(1){r22=r28+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r28=r23;r29=r22;continue}r22=r28+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r28=r23;r29=r22}}if(r29>>>0<r11>>>0){_abort()}else{HEAP32[r29>>2]=0;r26=r28,r27=r26>>2;break}}else{r22=HEAP32[r6+(r8+2)];if(r22>>>0<r11>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r16|0)){_abort()}r24=r21+8|0;if((HEAP32[r24>>2]|0)==(r16|0)){HEAP32[r23>>2]=r21;HEAP32[r24>>2]=r22;r26=r21,r27=r26>>2;break}else{_abort()}}}while(0);if((r20|0)==0){break}r21=r5+(r7+28)|0;r13=(HEAP32[r21>>2]<<2)+5264644|0;do{if((r16|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r26;if((r26|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r21>>2]^-1);break L2947}else{if(r20>>>0<HEAP32[1316089]>>>0){_abort()}r12=r20+16|0;if((HEAP32[r12>>2]|0)==(r16|0)){HEAP32[r12>>2]=r26}else{HEAP32[r20+20>>2]=r26}if((r26|0)==0){break L2947}}}while(0);if(r26>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r27+6]=r20;r16=HEAP32[r6+(r8+4)];do{if((r16|0)!=0){if(r16>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r27+4]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);r16=HEAP32[r6+(r8+5)];if((r16|0)==0){break}if(r16>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r27+5]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);if(r18>>>0<16){HEAP32[r3]=r17|HEAP32[r3]&1|2;r26=r7+(r17|4)|0;HEAP32[r26>>2]=HEAP32[r26>>2]|1;r15=r1;return r15}else{HEAP32[r3]=HEAP32[r3]&1|r2|2;HEAP32[(r2+4>>2)+r8]=r18|3;r8=r7+(r17|4)|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1;_dispose_chunk(r7+r2|0,r18);r15=r1;return r15}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r3=r2>>2;r4=0;r5=r1,r6=r5>>2;r7=r5+r2|0;r8=r7;r9=HEAP32[r1+4>>2];L3023:do{if((r9&1|0)==0){r10=HEAP32[r1>>2];if((r9&3|0)==0){return}r11=r5+ -r10|0;r12=r11;r13=r10+r2|0;r14=HEAP32[1316089];if(r11>>>0<r14>>>0){_abort()}if((r12|0)==(HEAP32[1316090]|0)){r15=(r2+(r5+4)|0)>>2;if((HEAP32[r15]&3|0)!=3){r16=r12,r17=r16>>2;r18=r13;break}HEAP32[1316087]=r13;HEAP32[r15]=HEAP32[r15]&-2;HEAP32[(4-r10>>2)+r6]=r13|1;HEAP32[r7>>2]=r13;return}r15=r10>>>3;if(r10>>>0<256){r19=HEAP32[(8-r10>>2)+r6];r20=HEAP32[(12-r10>>2)+r6];r21=(r15<<3)+5264380|0;do{if((r19|0)!=(r21|0)){if(r19>>>0<r14>>>0){_abort()}if((HEAP32[r19+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r20|0)==(r19|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r15^-1);r16=r12,r17=r16>>2;r18=r13;break}do{if((r20|0)==(r21|0)){r22=r20+8|0}else{if(r20>>>0<r14>>>0){_abort()}r23=r20+8|0;if((HEAP32[r23>>2]|0)==(r12|0)){r22=r23;break}_abort()}}while(0);HEAP32[r19+12>>2]=r20;HEAP32[r22>>2]=r19;r16=r12,r17=r16>>2;r18=r13;break}r21=r11;r15=HEAP32[(24-r10>>2)+r6];r23=HEAP32[(12-r10>>2)+r6];L3057:do{if((r23|0)==(r21|0)){r24=16-r10|0;r25=r24+(r5+4)|0;r26=HEAP32[r25>>2];do{if((r26|0)==0){r27=r5+r24|0;r28=HEAP32[r27>>2];if((r28|0)==0){r29=0,r30=r29>>2;break L3057}else{r31=r28;r32=r27;break}}else{r31=r26;r32=r25}}while(0);while(1){r25=r31+20|0;r26=HEAP32[r25>>2];if((r26|0)!=0){r31=r26;r32=r25;continue}r25=r31+16|0;r26=HEAP32[r25>>2];if((r26|0)==0){break}else{r31=r26;r32=r25}}if(r32>>>0<r14>>>0){_abort()}else{HEAP32[r32>>2]=0;r29=r31,r30=r29>>2;break}}else{r25=HEAP32[(8-r10>>2)+r6];if(r25>>>0<r14>>>0){_abort()}r26=r25+12|0;if((HEAP32[r26>>2]|0)!=(r21|0)){_abort()}r24=r23+8|0;if((HEAP32[r24>>2]|0)==(r21|0)){HEAP32[r26>>2]=r23;HEAP32[r24>>2]=r25;r29=r23,r30=r29>>2;break}else{_abort()}}}while(0);if((r15|0)==0){r16=r12,r17=r16>>2;r18=r13;break}r23=r5+(28-r10)|0;r14=(HEAP32[r23>>2]<<2)+5264644|0;do{if((r21|0)==(HEAP32[r14>>2]|0)){HEAP32[r14>>2]=r29;if((r29|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r23>>2]^-1);r16=r12,r17=r16>>2;r18=r13;break L3023}else{if(r15>>>0<HEAP32[1316089]>>>0){_abort()}r11=r15+16|0;if((HEAP32[r11>>2]|0)==(r21|0)){HEAP32[r11>>2]=r29}else{HEAP32[r15+20>>2]=r29}if((r29|0)==0){r16=r12,r17=r16>>2;r18=r13;break L3023}}}while(0);if(r29>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r30+6]=r15;r21=16-r10|0;r23=HEAP32[(r21>>2)+r6];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r30+4]=r23;HEAP32[r23+24>>2]=r29;break}}}while(0);r23=HEAP32[(r21+4>>2)+r6];if((r23|0)==0){r16=r12,r17=r16>>2;r18=r13;break}if(r23>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r30+5]=r23;HEAP32[r23+24>>2]=r29;r16=r12,r17=r16>>2;r18=r13;break}}else{r16=r1,r17=r16>>2;r18=r2}}while(0);r1=HEAP32[1316089];if(r7>>>0<r1>>>0){_abort()}r29=r2+(r5+4)|0;r30=HEAP32[r29>>2];do{if((r30&2|0)==0){if((r8|0)==(HEAP32[1316091]|0)){r31=HEAP32[1316088]+r18|0;HEAP32[1316088]=r31;HEAP32[1316091]=r16;HEAP32[r17+1]=r31|1;if((r16|0)!=(HEAP32[1316090]|0)){return}HEAP32[1316090]=0;HEAP32[1316087]=0;return}if((r8|0)==(HEAP32[1316090]|0)){r31=HEAP32[1316087]+r18|0;HEAP32[1316087]=r31;HEAP32[1316090]=r16;HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;return}r31=(r30&-8)+r18|0;r32=r30>>>3;L3123:do{if(r30>>>0<256){r22=HEAP32[r3+(r6+2)];r9=HEAP32[r3+(r6+3)];r23=(r32<<3)+5264380|0;do{if((r22|0)!=(r23|0)){if(r22>>>0<r1>>>0){_abort()}if((HEAP32[r22+12>>2]|0)==(r8|0)){break}_abort()}}while(0);if((r9|0)==(r22|0)){HEAP32[1316085]=HEAP32[1316085]&(1<<r32^-1);break}do{if((r9|0)==(r23|0)){r33=r9+8|0}else{if(r9>>>0<r1>>>0){_abort()}r10=r9+8|0;if((HEAP32[r10>>2]|0)==(r8|0)){r33=r10;break}_abort()}}while(0);HEAP32[r22+12>>2]=r9;HEAP32[r33>>2]=r22}else{r23=r7;r10=HEAP32[r3+(r6+6)];r15=HEAP32[r3+(r6+3)];L3125:do{if((r15|0)==(r23|0)){r14=r2+(r5+20)|0;r11=HEAP32[r14>>2];do{if((r11|0)==0){r19=r2+(r5+16)|0;r20=HEAP32[r19>>2];if((r20|0)==0){r34=0,r35=r34>>2;break L3125}else{r36=r20;r37=r19;break}}else{r36=r11;r37=r14}}while(0);while(1){r14=r36+20|0;r11=HEAP32[r14>>2];if((r11|0)!=0){r36=r11;r37=r14;continue}r14=r36+16|0;r11=HEAP32[r14>>2];if((r11|0)==0){break}else{r36=r11;r37=r14}}if(r37>>>0<r1>>>0){_abort()}else{HEAP32[r37>>2]=0;r34=r36,r35=r34>>2;break}}else{r14=HEAP32[r3+(r6+2)];if(r14>>>0<r1>>>0){_abort()}r11=r14+12|0;if((HEAP32[r11>>2]|0)!=(r23|0)){_abort()}r19=r15+8|0;if((HEAP32[r19>>2]|0)==(r23|0)){HEAP32[r11>>2]=r15;HEAP32[r19>>2]=r14;r34=r15,r35=r34>>2;break}else{_abort()}}}while(0);if((r10|0)==0){break}r15=r2+(r5+28)|0;r22=(HEAP32[r15>>2]<<2)+5264644|0;do{if((r23|0)==(HEAP32[r22>>2]|0)){HEAP32[r22>>2]=r34;if((r34|0)!=0){break}HEAP32[1316086]=HEAP32[1316086]&(1<<HEAP32[r15>>2]^-1);break L3123}else{if(r10>>>0<HEAP32[1316089]>>>0){_abort()}r9=r10+16|0;if((HEAP32[r9>>2]|0)==(r23|0)){HEAP32[r9>>2]=r34}else{HEAP32[r10+20>>2]=r34}if((r34|0)==0){break L3123}}}while(0);if(r34>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r35+6]=r10;r23=HEAP32[r3+(r6+4)];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r35+4]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);r23=HEAP32[r3+(r6+5)];if((r23|0)==0){break}if(r23>>>0<HEAP32[1316089]>>>0){_abort()}else{HEAP32[r35+5]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;if((r16|0)!=(HEAP32[1316090]|0)){r38=r31;break}HEAP32[1316087]=r31;return}else{HEAP32[r29>>2]=r30&-2;HEAP32[r17+1]=r18|1;HEAP32[(r18>>2)+r17]=r18;r38=r18}}while(0);r18=r38>>>3;if(r38>>>0<256){r30=r18<<1;r29=(r30<<2)+5264380|0;r34=HEAP32[1316085];r35=1<<r18;do{if((r34&r35|0)==0){HEAP32[1316085]=r34|r35;r39=r29;r40=(r30+2<<2)+5264380|0}else{r18=(r30+2<<2)+5264380|0;r6=HEAP32[r18>>2];if(r6>>>0>=HEAP32[1316089]>>>0){r39=r6;r40=r18;break}_abort()}}while(0);HEAP32[r40>>2]=r16;HEAP32[r39+12>>2]=r16;HEAP32[r17+2]=r39;HEAP32[r17+3]=r29;return}r29=r16;r39=r38>>>8;do{if((r39|0)==0){r41=0}else{if(r38>>>0>16777215){r41=31;break}r40=(r39+1048320|0)>>>16&8;r30=r39<<r40;r35=(r30+520192|0)>>>16&4;r34=r30<<r35;r30=(r34+245760|0)>>>16&2;r18=14-(r35|r40|r30)+(r34<<r30>>>15)|0;r41=r38>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r39=(r41<<2)+5264644|0;HEAP32[r17+7]=r41;HEAP32[r17+5]=0;HEAP32[r17+4]=0;r18=HEAP32[1316086];r30=1<<r41;if((r18&r30|0)==0){HEAP32[1316086]=r18|r30;HEAP32[r39>>2]=r29;HEAP32[r17+6]=r39;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}if((r41|0)==31){r42=0}else{r42=25-(r41>>>1)|0}r41=r38<<r42;r42=HEAP32[r39>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r38|0)){break}r43=(r41>>>31<<2)+r42+16|0;r39=HEAP32[r43>>2];if((r39|0)==0){r4=2408;break}else{r41=r41<<1;r42=r39}}if(r4==2408){if(r43>>>0<HEAP32[1316089]>>>0){_abort()}HEAP32[r43>>2]=r29;HEAP32[r17+6]=r42;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}r16=r42+8|0;r43=HEAP32[r16>>2];r4=HEAP32[1316089];if(r42>>>0<r4>>>0){_abort()}if(r43>>>0<r4>>>0){_abort()}HEAP32[r43+12>>2]=r29;HEAP32[r16>>2]=r29;HEAP32[r17+2]=r43;HEAP32[r17+3]=r42;HEAP32[r17+6]=0;return}function _getopt_internal(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r7=0;r8=STACKTOP;if((r3|0)==0){r9=-1;STACKTOP=r8;return r9}r10=HEAP32[1311165];do{if((r10|0)==0){HEAP32[1311163]=1;HEAP32[1311165]=1;r11=1;r12=1;r7=2447;break}else{r13=HEAP32[1311163];r14=HEAP32[1311440];if((r14|0)==-1|(r13|0)!=0){r11=r13;r12=r10;r7=2447;break}else{r15=r14;r16=r13;r17=r10;break}}}while(0);if(r7==2447){r10=(_getenv(5252572)|0)!=0&1;HEAP32[1311440]=r10;r15=r10;r16=r11;r17=r12}r12=HEAP8[r3];do{if(r12<<24>>24==45){r18=r6|2;r7=2451;break}else{r11=(r15|0)!=0|r12<<24>>24==43?r6&-2:r6;if(r12<<24>>24==43){r18=r11;r7=2451;break}else{r19=r3;r20=r11;break}}}while(0);if(r7==2451){r19=r3+1|0;r20=r18}HEAP32[1311167]=0;do{if((r16|0)==0){r21=r17;r7=2455}else{HEAP32[1311240]=-1;HEAP32[1311239]=-1;r22=r17;r23=r16;r7=2454;break}}while(0);while(1){if(r7==2455){r7=0;r16=HEAP32[1311161];if(HEAP8[r16]<<24>>24==0){r24=r21}else{r25=r16;r26=r21;break}}else if(r7==2454){r7=0;if((r23|0)==0){r21=r22;r7=2455;continue}else{r24=r22}}HEAP32[1311163]=0;if((r24|0)>=(r1|0)){r7=2457;break}r27=(r24<<2)+r2|0;r28=HEAP32[r27>>2];HEAP32[1311161]=r28;if(HEAP8[r28]<<24>>24==45){r29=r28+1|0;r30=HEAP8[r29];if(r30<<24>>24!=0){r7=2491;break}if((_strchr(r19,45)|0)!=0){r7=2491;break}}HEAP32[1311161]=5260912;if((r20&2|0)!=0){r7=2475;break}if((r20&1|0)==0){r9=-1;r7=2552;break}r16=HEAP32[1311239];do{if((r16|0)==-1){HEAP32[1311239]=r24;r31=r24;r32=0}else{r17=HEAP32[1311240];if((r17|0)==-1){r31=r24;r32=0;break}r18=r17-r16|0;r3=r24-r17|0;r12=(r18|0)%(r3|0);L3266:do{if((r12|0)==0){r33=r3}else{r6=r3;r15=r12;while(1){r11=(r6|0)%(r15|0);if((r11|0)==0){r33=r15;break L3266}else{r6=r15;r15=r11}}}}while(0);r12=(r24-r16|0)/(r33|0)&-1;if((r33|0)>0){r15=(r12|0)>0;r6=-r18|0;r11=0;while(1){r10=r11+r17|0;L3274:do{if(r15){r13=(r10<<2)+r2|0;r14=0;r34=r10;r35=HEAP32[r13>>2];while(1){r36=((r34|0)<(r17|0)?r3:r6)+r34|0;r37=(r36<<2)+r2|0;r38=HEAP32[r37>>2];HEAP32[r37>>2]=r35;HEAP32[r13>>2]=r38;r37=r14+1|0;if((r37|0)==(r12|0)){break L3274}else{r14=r37;r34=r36;r35=r38}}}}while(0);r10=r11+1|0;if((r10|0)==(r33|0)){break}else{r11=r10}}r39=HEAP32[1311165];r40=HEAP32[1311240];r41=HEAP32[1311239];r42=HEAP32[1311163]}else{r39=r24;r40=r17;r41=r16;r42=0}HEAP32[1311239]=r39-r40+r41|0;HEAP32[1311240]=-1;r31=r39;r32=r42}}while(0);r16=r31+1|0;HEAP32[1311165]=r16;r22=r16;r23=r32;r7=2454;continue}do{if(r7==2457){HEAP32[1311161]=5260912;r32=HEAP32[1311240];r23=HEAP32[1311239];do{if((r32|0)==-1){if((r23|0)==-1){break}HEAP32[1311165]=r23}else{r22=r32-r23|0;r31=r24-r32|0;r42=(r22|0)%(r31|0);L3287:do{if((r42|0)==0){r43=r31}else{r39=r31;r41=r42;while(1){r40=(r39|0)%(r41|0);if((r40|0)==0){r43=r41;break L3287}else{r39=r41;r41=r40}}}}while(0);r42=(r24-r23|0)/(r43|0)&-1;if((r43|0)>0){r17=(r42|0)>0;r41=-r22|0;r39=0;while(1){r40=r39+r32|0;L3295:do{if(r17){r33=(r40<<2)+r2|0;r21=0;r16=r40;r11=HEAP32[r33>>2];while(1){r12=((r16|0)<(r32|0)?r31:r41)+r16|0;r6=(r12<<2)+r2|0;r3=HEAP32[r6>>2];HEAP32[r6>>2]=r11;HEAP32[r33>>2]=r3;r6=r21+1|0;if((r6|0)==(r42|0)){break L3295}else{r21=r6;r16=r12;r11=r3}}}}while(0);r40=r39+1|0;if((r40|0)==(r43|0)){break}else{r39=r40}}r44=HEAP32[1311240];r45=HEAP32[1311239];r46=HEAP32[1311165]}else{r44=r32;r45=r23;r46=r24}HEAP32[1311165]=r45-r44+r46|0}}while(0);HEAP32[1311240]=-1;HEAP32[1311239]=-1;r9=-1;STACKTOP=r8;return r9}else if(r7==2491){r23=HEAP32[1311239];r32=HEAP32[1311240];if((r23|0)!=-1&(r32|0)==-1){HEAP32[1311240]=r24;r47=HEAP8[r29];r48=r24}else{r47=r30;r48=r32}if(r47<<24>>24==0){r25=r28;r26=r24;break}HEAP32[1311161]=r29;if(HEAP8[r29]<<24>>24!=45){r25=r29;r26=r24;break}if(HEAP8[r28+2|0]<<24>>24!=0){r25=r29;r26=r24;break}r32=r24+1|0;HEAP32[1311165]=r32;HEAP32[1311161]=5260912;if((r48|0)!=-1){r39=r48-r23|0;r42=r32-r48|0;r41=(r39|0)%(r42|0);L3315:do{if((r41|0)==0){r49=r42}else{r31=r42;r17=r41;while(1){r22=(r31|0)%(r17|0);if((r22|0)==0){r49=r17;break L3315}else{r31=r17;r17=r22}}}}while(0);r41=(r32-r23|0)/(r49|0)&-1;if((r49|0)>0){r17=(r41|0)>0;r31=-r39|0;r22=0;while(1){r40=r22+r48|0;L3323:do{if(r17){r11=(r40<<2)+r2|0;r16=0;r21=r40;r33=HEAP32[r11>>2];while(1){r3=((r21|0)<(r48|0)?r42:r31)+r21|0;r12=(r3<<2)+r2|0;r6=HEAP32[r12>>2];HEAP32[r12>>2]=r33;HEAP32[r11>>2]=r6;r12=r16+1|0;if((r12|0)==(r41|0)){break L3323}else{r16=r12;r21=r3;r33=r6}}}}while(0);r40=r22+1|0;if((r40|0)==(r49|0)){break}else{r22=r40}}r50=HEAP32[1311240];r51=HEAP32[1311239];r52=HEAP32[1311165]}else{r50=r48;r51=r23;r52=r32}HEAP32[1311165]=r51-r50+r52|0}HEAP32[1311240]=-1;HEAP32[1311239]=-1;r9=-1;STACKTOP=r8;return r9}else if(r7==2552){STACKTOP=r8;return r9}else if(r7==2475){HEAP32[1311165]=r24+1|0;HEAP32[1311167]=HEAP32[r27>>2];r9=1;STACKTOP=r8;return r9}}while(0);r27=(r4|0)!=0;L3336:do{if(r27){if((r25|0)==(HEAP32[r2+(r26<<2)>>2]|0)){r53=r25;break}r24=HEAP8[r25];do{if(r24<<24>>24==45){HEAP32[1311161]=r25+1|0;r54=0}else{if((r20&4|0)==0){r53=r25;break L3336}if(r24<<24>>24==58){r54=0;break}r54=(_strchr(r19,r24<<24>>24)|0)!=0&1}}while(0);r24=_parse_long_options(r2,r19,r4,r5,r54);if((r24|0)==-1){r53=HEAP32[1311161];break}HEAP32[1311161]=5260912;r9=r24;STACKTOP=r8;return r9}else{r53=r25}}while(0);r25=r53+1|0;HEAP32[1311161]=r25;r54=HEAP8[r53];r53=r54<<24>>24;do{if(r54<<24>>24==58){r7=2523}else if(r54<<24>>24==45){if(HEAP8[r25]<<24>>24==0){r7=2520;break}else{break}}else{r7=2520}}while(0);do{if(r7==2520){r20=_strchr(r19,r53);if((r20|0)==0){if(r54<<24>>24!=45){r7=2523;break}if(HEAP8[r25]<<24>>24==0){r9=-1}else{break}STACKTOP=r8;return r9}r26=HEAP8[r20+1|0];if(r27&r54<<24>>24==87&r26<<24>>24==59){do{if(HEAP8[r25]<<24>>24==0){r24=HEAP32[1311165]+1|0;HEAP32[1311165]=r24;if((r24|0)<(r1|0)){HEAP32[1311161]=HEAP32[r2+(r24<<2)>>2];break}HEAP32[1311161]=5260912;do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r19]<<24>>24==58){break}__warnx(5243564,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r53,tempInt))}}while(0);HEAP32[1311164]=r53;r9=HEAP8[r19]<<24>>24==58?58:63;STACKTOP=r8;return r9}}while(0);r24=_parse_long_options(r2,r19,r4,r5,0);HEAP32[1311161]=5260912;r9=r24;STACKTOP=r8;return r9}if(r26<<24>>24!=58){if(HEAP8[r25]<<24>>24!=0){r9=r53;STACKTOP=r8;return r9}HEAP32[1311165]=HEAP32[1311165]+1|0;r9=r53;STACKTOP=r8;return r9}HEAP32[1311167]=0;do{if(HEAP8[r25]<<24>>24==0){if(HEAP8[r20+2|0]<<24>>24==58){break}r24=HEAP32[1311165]+1|0;HEAP32[1311165]=r24;if((r24|0)<(r1|0)){HEAP32[1311167]=HEAP32[r2+(r24<<2)>>2];break}HEAP32[1311161]=5260912;do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r19]<<24>>24==58){break}__warnx(5243564,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r53,tempInt))}}while(0);HEAP32[1311164]=r53;r9=HEAP8[r19]<<24>>24==58?58:63;STACKTOP=r8;return r9}else{HEAP32[1311167]=r25}}while(0);HEAP32[1311161]=5260912;HEAP32[1311165]=HEAP32[1311165]+1|0;r9=r53;STACKTOP=r8;return r9}}while(0);do{if(r7==2523){if(HEAP8[r25]<<24>>24!=0){break}HEAP32[1311165]=HEAP32[1311165]+1|0}}while(0);do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r19]<<24>>24==58){break}__warnx(5245316,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r53,tempInt))}}while(0);HEAP32[1311164]=r53;r9=63;STACKTOP=r8;return r9}function _parse_long_options(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r6=r3>>2;r7=0;r8=STACKTOP;r9=HEAP32[1311161];r10=HEAP32[1311165];r11=r10+1|0;HEAP32[1311165]=r11;r12=_strchr(r9,61);if((r12|0)==0){r13=_strlen(r9);r14=0}else{r13=r12-r9|0;r14=r12+1|0}r12=HEAP32[r6];do{if((r12|0)!=0){r15=(r5|0)!=0&(r13|0)==1;r16=0;r17=-1;r18=r12;L3411:while(1){do{if((_strncmp(r9,r18,r13)|0)==0){if((_strlen(r18)|0)==(r13|0)){r19=r16;break L3411}if(r15){r20=r17;break}if((r17|0)==-1){r20=r16}else{r7=2575;break L3411}}else{r20=r17}}while(0);r21=r16+1|0;r22=HEAP32[(r21<<4>>2)+r6];if((r22|0)==0){r19=r20;break}else{r16=r21;r17=r20;r18=r22}}if(r7==2575){do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r2]<<24>>24==58){break}__warnx(5249180,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r9,tempInt))}}while(0);HEAP32[1311164]=0;r23=63;STACKTOP=r8;return r23}if((r19|0)==-1){break}r18=(r19<<4)+r3+4|0;r17=HEAP32[r18>>2];r16=(r14|0)==0;if(!((r17|0)!=0|r16)){do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r2]<<24>>24==58){break}__warnx(5244964,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r9,tempInt))}}while(0);if((HEAP32[((r19<<4)+8>>2)+r6]|0)==0){r24=HEAP32[((r19<<4)+12>>2)+r6]}else{r24=0}HEAP32[1311164]=r24;r23=HEAP8[r2]<<24>>24==58?58:63;STACKTOP=r8;return r23}do{if((r17-1|0)>>>0<2){if(!r16){HEAP32[1311167]=r14;break}if((r17|0)!=1){break}HEAP32[1311165]=r10+2|0;HEAP32[1311167]=HEAP32[r1+(r11<<2)>>2]}}while(0);if(!((HEAP32[r18>>2]|0)==1&(HEAP32[1311167]|0)==0)){if((r4|0)!=0){HEAP32[r4>>2]=r19}r17=HEAP32[((r19<<4)+8>>2)+r6];r16=HEAP32[((r19<<4)+12>>2)+r6];if((r17|0)==0){r23=r16;STACKTOP=r8;return r23}HEAP32[r17>>2]=r16;r23=0;STACKTOP=r8;return r23}do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r2]<<24>>24==58){break}__warnx(5243528,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt))}}while(0);if((HEAP32[((r19<<4)+8>>2)+r6]|0)==0){r25=HEAP32[((r19<<4)+12>>2)+r6]}else{r25=0}HEAP32[1311164]=r25;HEAP32[1311165]=HEAP32[1311165]-1|0;r23=HEAP8[r2]<<24>>24==58?58:63;STACKTOP=r8;return r23}}while(0);if((r5|0)!=0){HEAP32[1311165]=r10;r23=-1;STACKTOP=r8;return r23}do{if((HEAP32[1311166]|0)!=0){if(HEAP8[r2]<<24>>24==58){break}__warnx(5245292,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r9,tempInt))}}while(0);HEAP32[1311164]=0;r23=63;STACKTOP=r8;return r23}function __warnx(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP32[r4>>2]=r2;r2=HEAP32[r4>>2];r4=HEAP32[___progname>>2];_fprintf(HEAP32[_stderr>>2],5259012,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4,tempInt));if((r1|0)!=0){_fprintf(HEAP32[_stderr>>2],r1,r2)}_fputc(10,HEAP32[_stderr>>2]);STACKTOP=r3;return}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4>>>0;if(r5>>>0<r1>>>0){r6=r6+1>>>0}return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;if(r5>>>0>r1>>>0){r6=r6-1>>>0}return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_STACK);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_STACK);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math.imul(r4,r3);r6=r1>>>16;r7=(r5>>>16)+Math.imul(r4,r6)|0;r8=r2>>>16;r9=Math.imul(r8,r3);return(tempRet0=(r7>>>16)+Math.imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,0|(r7+r9<<16|r5&65535))|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6);r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8);r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13);return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7);r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9);___udivmoddi4(r10,r11,r12,tempRet0,r5);r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7);r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math.imul(r2,r6);return(tempRet0=Math.imul(r4,r5)+r9+r8|r8&0,0|r7&-1)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5);STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=0|r1&-1;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=0|r8>>>(r20>>>0);r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=0|r3&-1;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1);r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=0|(r44<<1|r47>>>31);r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51);r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39);r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=0|r61;HEAP32[r5+4>>2]=r62|0}r69=(0|r65)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}
// EMSCRIPTEN_END_FUNCS
Module["_main"] = _main;
Module["_calloc"] = _calloc;
Module["_realloc"] = _realloc;
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(!Module['preRun'] || Module['preRun'].length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/mtools"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    var ret = 0;
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}
};
