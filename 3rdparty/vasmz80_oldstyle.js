var ASM = function(code, res) {
	var Module = {
		'arguments': ["-o", "asm1.o", "-quiet", "-Fbin", "asm1.asm"],
		'print': function(x) {},
		'noFSInit': true,
		'preRun': function() {
			FS.init(null,
				function(x) {res.out += String.fromCharCode(x);},
				function(x) {res.err += String.fromCharCode(x);}
			);
			FS.createDataFile("/", "asm1.asm", code, true, true);
		},
		'postRun': function() {
			res.ret = FS.root.contents.hasOwnProperty("asm1.o");
			if (res.ret) {
				var content = FS.root.contents["asm1.o"].contents;
				res.data = new Uint8Array(content.length);
				for(var i=0; i<content.length; i++) {
					res.data[i] = content[i];
				}
			}
			else {
				res.data = null;
			}
		}
	};

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
STATICTOP += 29248;
assert(STATICTOP < TOTAL_MEMORY);
var _stdout;
var _stderr;
var _stdout = _stdout=allocate([0,0,0,0], "i8", ALLOC_STATIC);
var _stderr = _stderr=allocate([0,0,0,0], "i8", ALLOC_STATIC);
/* memory initializer */ allocate([0,0,0,0,0,0,0,0,95,95,86,65,83,77,0,0,0,0,0,0,46,116,101,120,116,0,0,0,0,0,0,0,,,,,25,0,0,0,92,96,80,0,1,0,0,0,60,96,80,0,1,0,0,0,240,95,80,0,2,0,0,0,168,95,80,0,2,0,0,0,116,95,80,0,2,0,0,0,72,95,80,0,1,0,0,0,24,95,80,0,2,0,0,0,220,93,80,0,2,0,0,0,236,94,80,0,1,0,0,0,180,94,80,0,2,0,0,0,96,94,80,0,1,0,0,0,32,106,80,0,2,0,0,0,240,93,80,0,1,0,0,0,168,93,80,0,1,0,0,0,108,93,80,0,1,0,0,0,56,93,80,0,1,0,0,0,236,92,80,0,17,0,0,0,192,92,80,0,1,0,0,0,112,92,80,0,1,0,0,0,36,92,80,0,1,0,0,0,232,91,80,0,2,0,0,0,176,91,80,0,2,0,0,0,116,91,80,0,2,0,0,0,248,90,80,0,2,0,0,0,168,90,80,0,2,0,0,0,88,97,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,101,115,111,108,118,101,40,41,0,0,0,115,101,116,116,105,110,103,32,114,101,115,111,108,118,101,45,119,97,114,110,105,110,103,32,102,108,97,103,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,114,101,112,116,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,61,1,80,0,6,0,0,0,105,1,80,0,0,0,0,0,0,0,0,0,255,255,255,255,46,114,101,112,101,97,116,0,80,108,80,0,9,25,0,0,128,0,0,0,28,0,0,0,76,108,80,0,8,25,0,0,129,0,0,0,28,0,0,0,72,108,80,0,7,25,0,0,130,0,0,0,28,0,0,0,68,108,80,0,5,9,0,0,132,0,0,0,28,0,0,0,60,108,80,0,9,28,0,0,0,0,0,0,255,0,0,0,52,108,80,0,7,28,0,0,2,0,0,0,255,0,0,0,244,107,80,0,8,28,0,0,1,0,0,0,255,0,0,0,232,107,80,0,6,4,0,0,3,0,0,0,255,0,0,0,220,107,80,0,5,8,0,0,4,0,0,0,255,0,0,0,212,107,80,0,132,0,0,0,37,0,0,0,98,0,0,0,184,107,80,0,132,0,0,0,36,0,0,0,98,0,0,0,180,107,80,0,132,0,0,0,69,0,0,0,98,0,0,0,176,107,80,0,132,0,0,0,68,0,0,0,98,0,0,0,172,107,80,0,135,12,0,0,34,0,0,0,254,0,0,0,164,107,80,0,135,12,0,0,66,0,0,0,254,0,0,0,160,107,80,0,23,0,0,0,12,0,0,0,28,0,0,0,136,107,80,0,13,1,0,0,135,0,0,0,28,0,0,0,132,107,80,0,4,1,0,0,128,0,0,0,28,0,0,0,124,107,80,0,4,1,0,0,129,0,0,0,28,0,0,0,112,107,80,0,4,1,0,0,130,0,0,0,28,0,0,0,108,107,80,0,4,1,0,0,131,0,0,0,28,0,0,0,96,107,80,0,4,1,0,0,132,0,0,0,28,0,0,0,92,107,80,0,4,1,0,0,133,0,0,0,28,0,0,0,88,107,80,0,13,0,0,0,7,0,0,0,255,0,0,0,80,107,80,0,4,0,0,0,0,0,0,0,255,0,0,0,76,107,80,0,4,0,0,0,1,0,0,0,255,0,0,0,32,107,80,0,4,0,0,0,2,0,0,0,255,0,0,0,20,107,80,0,4,0,0,0,3,0,0,0,255,0,0,0,8,107,80,0,4,0,0,0,4,0,0,0,255,0,0,0,252,106,80,0,4,0,0,0,5,0,0,0,255,0,0,0,248,106,80,0,14,0,0,0,9,0,0,0,98,0,0,0,244,106,80,0,14,0,0,0,9,0,0,0,28,0,0,0,228,106,80,0,15,0,0,0,8,0,0,0,98,0,0,0,160,106,80,0,15,0,0,0,8,0,0,0,28,0,0,0,88,106,80,0,16,0,0,0,10,0,0,0,2,0,0,0,84,106,80,0,24,0,0,0,13,0,0,0,28,0,0,0,36,106,80,0,37,1,0,0,144,0,0,0,16,0,0,0,20,106,80,0,37,1,0,0,145,0,0,0,16,0,0,0,12,106,80,0,37,1,0,0,146,0,0,0,16,0,0,0,0,106,80,0,37,1,0,0,147,0,0,0,16,0,0,0,252,105,80,0,37,0,0,0,16,0,0,0,16,0,0,0,248,105,80,0,37,0,0,0,17,0,0,0,16,0,0,0,244,105,80,0,37,0,0,0,18,0,0,0,16,0,0,0,240,105,80,0,37,0,0,0,19,0,0,0,16,0,0,0,216,105,80,0,38,0,0,0,20,0,0,0,16,0,0,0,212,105,80,0,39,0,0,0,21,0,0,0,16,0,0,0,188,105,80,0,12,1,0,0,143,0,0,0,16,0,0,0,152,105,80,0,12,0,0,0,15,0,0,0,16,0,0,0,140,105,80,0,11,1,0,0,142,0,0,0,16,0,0,0,128,105,80,0,11,0,0,0,14,0,0,0,16,0,0,0,124,105,80,0,10,1,0,0,141,0,0,0,16,0,0,0,120,105,80,0,10,0,0,0,13,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,20,92,80,0,196,91,80,0,152,91,80,0,28,91,80,0,220,90,80,0,0,0,0,0,92,102,80,0,84,108,80,0,12,103,80,0,168,100,80,0,48,98,80,0,216,95,80,0,144,93,80,0,228,90,80,0,216,87,80,0,224,84,80,0,160,111,80,0,204,109,80,0,192,108,80,0,236,107,80,0,160,84,80,0,24,107,80,0,24,106,80,0,0,0,0,0,0,0,0,0,76,109,80,0,9,0,0,0,24,112,80,0,17,1,0,0,236,111,80,0,1,1,0,0,168,111,80,0,17,1,0,0,120,111,80,0,1,1,0,0,40,111,80,0,1,1,0,0,0,111,80,0,1,1,0,0,36,103,80,0,1,1,0,0,180,110,80,0,17,1,0,0,120,110,80,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,101,80,0,135,32,0,0,0,4,0,0,4,0,0,0,74,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,101,80,0,132,0,0,0,0,0,0,0,1,0,0,0,136,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,68,101,80,0,132,0,0,0,0,0,0,0,1,0,0,0,136,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,101,80,0,13,32,0,0,132,0,0,0,1,0,0,0,136,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,68,101,80,0,13,32,0,0,132,0,0,0,1,0,0,0,136,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,101,80,0,1,0,0,0,0,0,0,0,0,0,0,0,206,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,101,80,0,13,32,0,0,1,0,0,0,0,0,0,0,206,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,4,0,0,0,0,0,0,0,1,0,0,0,128,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,56,108,80,0,4,0,0,0,0,0,0,0,1,0,0,0,128,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,7,32,0,0,10,0,0,0,0,0,0,0,101,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,135,32,0,0,128,4,0,0,4,0,0,0,9,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,13,32,0,0,4,0,0,0,1,0,0,0,128,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,56,108,80,0,13,32,0,0,4,0,0,0,1,0,0,0,128,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,13,32,0,0,1,0,0,0,0,0,0,0,198,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,6,0,0,0,1,0,0,0,0,0,0,0,39,0,0,0,156,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,56,108,80,0,6,0,0,0,1,0,0,0,0,0,0,0,232,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,12,32,0,0,11,0,0,0,0,0,0,0,198,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,108,80,0,1,0,0,0,0,0,0,0,0,0,0,0,198,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,135,32,0,0,8,0,0,0,0,0,0,0,220,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,12,32,0,0,11,0,0,0,0,0,0,0,230,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,132,0,0,0,0,0,0,0,1,0,0,0,160,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,103,80,0,132,0,0,0,0,0,0,0,1,0,0,0,160,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,13,32,0,0,132,0,0,0,1,0,0,0,160,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,103,80,0,13,32,0,0,132,0,0,0,1,0,0,0,160,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,13,32,0,0,1,0,0,0,0,0,0,0,230,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,103,80,0,1,0,0,0,0,0,0,0,0,0,0,0,230,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,100,80,0,21,0,0,0,132,96,0,0,7,0,0,0,64,203,0,0,254,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,98,80,0,135,32,0,0,0,0,0,0,0,0,0,0,204,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,95,80,0,18,0,0,0,2,0,0,0,5,0,0,0,196,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,95,80,0,199,0,0,0,0,0,0,0,0,0,0,0,234,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,95,80,0,2,0,0,0,0,0,0,0,0,0,0,0,205,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,93,80,0,1,0,0,0,0,0,0,0,0,0,0,0,0,237,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,216,90,80,0,0,0,0,0,0,0,0,0,0,0,0,0,63,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,87,80,0,7,32,0,0,0,0,0,0,0,0,0,0,191,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,84,80,0,0,0,0,0,0,0,0,0,0,0,0,0,128,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,111,80,0,0,0,0,0,0,0,0,0,0,0,0,0,136,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,132,0,0,0,0,0,0,0,1,0,0,0,184,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,192,109,80,0,132,0,0,0,0,0,0,0,1,0,0,0,184,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,13,32,0,0,132,0,0,0,1,0,0,0,184,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,192,109,80,0,13,32,0,0,132,0,0,0,1,0,0,0,184,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,13,32,0,0,1,0,0,0,0,0,0,0,254,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,1,0,0,0,0,0,0,0,0,0,0,0,254,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,12,32,0,0,11,0,0,0,0,0,0,0,88,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,7,32,0,0,8,0,0,0,0,0,0,0,72,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,109,80,0,7,32,0,0,1,0,0,0,0,0,0,0,72,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,108,80,0,0,0,0,0,0,0,0,0,0,0,0,0,169,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,224,107,80,0,0,0,0,0,0,0,0,0,0,0,0,0,185,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,128,107,80,0,0,0,0,0,0,0,0,0,0,0,0,0,161,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,12,107,80,0,0,0,0,0,0,0,0,0,0,0,0,0,177,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,16,106,80,0,0,0,0,0,0,0,0,0,0,0,0,0,47,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,148,105,80,0,0,0,0,0,0,0,0,0,0,0,0,0,39,0,0,0,227,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,105,80,0,132,32,0,0,0,0,0,0,2,0,0,0,5,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,105,80,0,128,36,0,0,0,0,0,0,4,0,0,0,11,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,104,80,0,0,0,0,0,0,0,0,0,0,0,0,0,243,0,0,0,227,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,104,80,0,1,0,0,0,0,0,0,0,6,0,0,0,16,0,0,0,127,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,140,103,80,0,1,0,0,0,0,0,0,0,6,0,0,0,16,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,103,80,0,0,0,0,0,0,0,0,0,0,0,0,0,251,0,0,0,227,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,5,0,0,0,5,1,0,0,0,0,0,0,8,0,0,0,126,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,9,0,0,0,7,0,0,0,0,0,0,0,179,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,9,0,0,0,7,1,0,0,0,0,0,0,179,118,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,9,1,0,0,7,0,0,0,0,0,0,0,116,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,9,1,0,0,7,1,0,0,0,0,0,0,116,237,118,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,8,0,0,0,7,32,0,0,0,0,0,0,235,0,0,0,127,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,8,0,0,0,7,1,0,0,0,0,0,0,235,118,0,0,28,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,8,1,0,0,7,32,0,0,0,0,0,0,227,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,8,1,0,0,7,1,0,0,0,0,0,0,227,118,0,0,28,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,12,0,0,0,11,0,0,0,0,0,0,0,180,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,10,1,0,0,7,0,0,0,0,0,0,0,124,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,10,0,0,0,7,0,0,0,0,0,0,0,185,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,220,102,80,0,70,0,0,0,135,32,0,0,0,0,0,0,227,0,0,0,255,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,220,102,80,0,70,0,0,0,135,32,0,0,0,0,0,0,84,237,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,102,80,0,0,0,0,0,0,0,0,0,0,0,0,0,217,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,102,80,0,0,0,0,0,0,0,0,0,0,0,0,0,217,0,0,0,126,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,102,80,0,18,0,0,0,7,0,0,0,5,0,0,0,196,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,102,80,0,19,0,0,0,7,0,0,0,5,0,0,0,164,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,224,101,80,0,0,0,0,0,0,0,0,0,0,0,0,0,85,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,101,80,0,0,0,0,0,0,0,0,0,0,0,0,0,118,0,0,0,227,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,101,80,0,13,32,0,0,0,0,0,0,0,0,0,0,18,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,101,80,0,0,0,0,0,0,0,0,0,0,0,0,0,91,0,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,101,80,0,21,0,0,0,0,0,0,0,9,0,0,0,70,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,100,80,0,4,0,0,0,17,0,0,0,2,0,0,0,64,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,100,80,0,13,0,0,0,22,0,0,0,0,0,0,0,219,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,100,80,0,17,0,0,0,0,0,0,0,0,0,0,0,112,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,180,100,80,0,16,0,0,0,17,0,0,0,0,0,0,0,112,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,100,80,0,4,0,0,0,22,0,0,0,2,0,0,0,0,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,100,80,0,132,0,0,0,0,0,0,0,2,0,0,0,4,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,100,80,0,128,4,0,0,0,0,0,0,4,0,0,0,3,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,100,80,0,0,0,0,0,0,0,0,0,0,0,0,0,170,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,196,99,80,0,0,0,0,0,0,0,0,0,0,0,0,0,186,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,140,99,80,0,0,0,0,0,0,0,0,0,0,0,0,0,162,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,99,80,0,0,0,0,0,0,0,0,0,0,0,0,0,178,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,24,99,80,0,0,0,0,0,0,0,0,0,0,0,0,0,84,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,98,80,0,21,0,0,0,0,0,0,0,11,0,0,0,70,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,98,80,0,18,0,0,0,1,0,0,0,6,0,0,0,32,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,98,80,0,19,0,0,0,1,0,0,0,6,0,0,0,160,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,98,80,0,1,0,0,0,0,0,0,0,6,0,0,0,24,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,98,80,0,19,0,0,0,2,0,0,0,6,0,0,0,163,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,98,80,0,18,0,0,0,2,0,0,0,6,0,0,0,195,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,98,80,0,2,0,0,0,0,0,0,0,6,0,0,0,152,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,80,0,18,0,0,0,2,0,0,0,5,0,0,0,194,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,80,0,19,0,0,0,2,0,0,0,5,0,0,0,162,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,80,0,199,0,0,0,0,0,0,0,0,0,0,0,233,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,80,0,135,0,0,0,0,0,0,0,0,0,0,0,233,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,98,80,0,2,0,0,0,0,0,0,0,0,0,0,0,195,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,208,97,80,0,25,0,0,0,0,0,0,0,0,0,0,0,207,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,97,80,0,25,0,0,0,0,0,0,0,0,0,0,0,199,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,73,0,0,0,13,0,0,0,0,0,0,0,2,0,0,0,255,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,72,0,0,0,13,0,0,0,0,0,0,0,18,0,0,0,255,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,132,32,0,0,132,0,0,0,3,0,0,0,64,0,0,0,255,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,44,97,80,0,132,32,0,0,132,0,0,0,3,0,0,0,64,127,0,0,16,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,0,17,0,0,9,0,0,0,4,0,0,0,73,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,0,17,0,0,8,0,0,0,4,0,0,0,65,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,9,0,0,0,0,0,0,0,129,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,9,32,0,0,7,0,0,0,0,0,0,0,145,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,8,0,0,0,0,0,0,0,161,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,8,32,0,0,7,0,0,0,0,0,0,0,177,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,135,32,0,0,70,2,0,0,0,0,0,0,196,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,70,2,0,0,135,0,0,0,0,0,0,0,212,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,35,0,0,0,0,0,0,0,124,221,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,36,0,0,0,0,0,0,0,124,253,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,35,0,0,0,7,0,0,0,0,0,0,0,125,221,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,36,0,0,0,7,0,0,0,0,0,0,0,125,253,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,99,2,0,0,13,0,0,0,228,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,100,2,0,0,13,0,0,0,228,253,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,71,2,0,0,13,0,0,0,228,221,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,99,2,0,0,7,0,0,0,13,0,0,0,244,0,0,0,28,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,100,2,0,0,7,0,0,0,13,0,0,0,244,253,0,0,28,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,71,2,0,0,7,0,0,0,0,0,0,0,244,221,0,0,28,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,135,32,0,0,20,0,0,0,0,0,0,0,42,0,0,0,127,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,128,36,0,0,20,0,0,0,4,0,0,0,75,237,0,0,126,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,101,0,1,0,12,0,0,0,139,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,101,2,0,0,12,0,0,0,141,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,13,0,0,0,12,0,0,0,140,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,13,0,0,0,12,0,0,0,142,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,101,0,2,0,12,0,0,0,6,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,2,0,7,0,0,0,12,0,0,0,7,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,70,0,1,0,12,0,0,0,254,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,7,32,0,0,101,2,0,0,12,0,0,0,133,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,7,0,0,0,12,0,0,0,134,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,70,2,0,0,12,0,0,0,4,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,70,2,0,0,37,0,0,0,0,0,0,0,5,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,71,0,0,0,0,0,0,0,26,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,71,0,0,0,11,0,0,0,0,0,0,0,27,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,20,0,0,0,0,0,0,0,147,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,11,0,0,0,0,0,0,0,131,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,1,0,0,0,0,0,0,0,163,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,70,0,1,0,0,0,0,0,254,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,70,2,0,0,0,0,0,0,238,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,99,2,0,0,0,0,0,0,206,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,100,2,0,0,0,0,0,0,222,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,70,2,0,0,11,0,0,0,0,0,0,0,239,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,101,0,1,0,12,0,0,0,12,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,101,2,0,0,12,0,0,0,14,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,11,32,0,0,37,0,0,0,12,0,0,0,205,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,11,0,0,0,12,0,0,0,13,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,11,0,0,0,12,0,0,0,15,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,11,0,0,0,12,0,0,0,141,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,71,0,0,0,0,0,0,0,26,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,71,0,0,0,12,0,0,0,0,0,0,0,27,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,20,0,0,0,0,0,0,0,148,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,12,0,0,0,0,0,0,0,132,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,1,0,0,0,0,0,0,0,164,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,70,0,1,0,0,0,0,0,254,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,70,2,0,0,0,0,0,0,238,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,99,2,0,0,0,0,0,0,206,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,100,2,0,0,0,0,0,0,222,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,70,2,0,0,12,0,0,0,0,0,0,0,239,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,101,0,1,0,12,0,0,0,12,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,101,2,0,0,12,0,0,0,14,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,12,32,0,0,37,0,0,0,12,0,0,0,205,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,12,0,0,0,12,0,0,0,13,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,12,0,0,0,12,0,0,0,15,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,12,0,0,0,12,0,0,0,141,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,101,0,1,0,14,0,0,0,10,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,101,2,0,0,14,0,0,0,8,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,0,1,0,14,0,0,0,14,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,0,4,0,14,0,0,0,6,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,0,8,0,14,0,0,0,4,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,0,16,0,14,0,0,0,5,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,0,0,0,14,0,0,0,7,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,37,2,0,0,14,0,0,0,12,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,9,32,0,0,101,0,1,0,12,0,0,0,2,109,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,9,32,0,0,101,2,0,0,12,0,0,0,0,109,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,9,0,0,0,12,0,0,0,3,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,9,0,0,0,12,0,0,0,1,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,8,32,0,0,101,0,1,0,12,0,0,0,66,109,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,8,32,0,0,101,2,0,0,12,0,0,0,64,109,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,8,0,0,0,12,0,0,0,67,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,8,0,0,0,12,0,0,0,65,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,35,0,0,0,101,0,1,0,12,0,0,0,130,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,35,0,0,0,101,2,0,0,12,0,0,0,128,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,35,0,0,0,12,0,0,0,131,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,35,0,0,0,12,0,0,0,129,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,36,0,0,0,101,0,1,0,12,0,0,0,194,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,36,0,0,0,101,2,0,0,12,0,0,0,192,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,36,0,0,0,12,0,0,0,195,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,36,0,0,0,12,0,0,0,193,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,0,1,0,37,0,0,0,14,0,0,0,11,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,101,2,0,0,37,0,0,0,14,0,0,0,9,109,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,37,0,0,0,32,0,0,0,12,0,0,0,12,237,0,0].concat([16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,24,0,0,0,13,0,0,0,0,0,0,0,103,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,0,0,0,24,0,0,0,0,0,0,0,119,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,39,0,0,0,13,0,0,0,0,0,0,0,64,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,0,0,0,39,0,0,0,0,0,0,0,80,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,10,32,0,0,2,0,0,0,0,0,0,0,169,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,10,0,0,0,0,0,0,0,137,0,0,0,16,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,10,32,0,0,20,0,0,0,0,0,0,0,153,0,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,73,0,0,0,0,0,0,0,10,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,72,0,0,0,0,0,0,0,26,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,20,0,0,0,0,0,0,0,58,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,44,97,80,0,13,0,0,0,20,0,0,0,0,0,0,0,250,0,0,0,128,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,15,0,0,0,0,0,0,0,87,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,13,32,0,0,14,0,0,0,0,0,0,0,95,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,132,32,0,0,1,0,0,0,2,0,0,0,6,0,0,0,255,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,6,0,0,0,135,0,0,0,0,0,0,0,249,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,128,36,0,0,2,0,0,0,4,0,0,0,1,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,14,0,0,0,13,0,0,0,0,0,0,0,79,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,15,0,0,0,13,0,0,0,0,0,0,0,71,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,17,0,0,0,13,0,0,0,0,0,0,0,226,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,6,0,0,0,0,0,0,0,115,237,0,0,254,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,44,97,80,0,20,0,0,0,6,0,0,0,0,0,0,0,8,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,135,0,0,0,0,0,0,0,34,0,0,0,127,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,0,4,0,0,4,0,0,0,67,237,0,0,126,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,97,80,0,20,0,0,0,13,0,0,0,0,0,0,0,50,0,0,0,255,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,44,97,80,0,20,0,0,0,13,0,0,0,0,0,0,0,234,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,96,80,0,0,0,0,0,0,0,0,0,0,0,0,0,168,237,0,0,126,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,96,80,0,13,0,0,0,71,0,0,0,0,0,0,0,58,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,252,96,80,0,71,0,0,0,13,0,0,0,0,0,0,0,50,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,96,80,0,0,0,0,0,0,0,0,0,0,0,0,0,184,237,0,0,126,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,148,96,80,0,0,0,0,0,0,0,0,0,0,0,0,0,152,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,13,0,0,0,0,0,0,0,138,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,9,0,0,0,0,0,0,0,11,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,8,0,0,0,0,0,0,0,27,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,35,0,0,0,0,0,0,0,43,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,36,0,0,0,0,0,0,0,59,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,7,0,0,0,0,0,0,0,130,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,11,0,0,0,0,0,0,0,11,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,33,0,0,0,12,0,0,0,0,0,0,0,11,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,13,32,0,0,33,0,0,0,0,0,0,0,154,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,9,32,0,0,33,0,0,0,0,0,0,0,10,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,8,32,0,0,33,0,0,0,0,0,0,0,26,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,35,0,0,0,33,0,0,0,0,0,0,0,42,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,36,0,0,0,33,0,0,0,0,0,0,0,58,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,7,32,0,0,33,0,0,0,0,0,0,0,146,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,11,32,0,0,33,0,0,0,0,0,0,0,10,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,96,80,0,12,32,0,0,33,0,0,0,0,0,0,0,10,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,96,80,0,22,0,0,0,13,0,0,0,0,0,0,0,224,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,56,96,80,0,13,0,0,0,22,0,0,0,0,0,0,0,240,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,95,80,0,6,0,0,0,1,0,0,0,0,0,0,0,248,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,95,80,0,0,0,0,0,0,0,0,0,0,0,0,0,160,237,0,0,126,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,95,80,0,13,0,0,0,71,0,0,0,0,0,0,0,42,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,95,80,0,71,0,0,0,13,0,0,0,0,0,0,0,34,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,95,80,0,0,0,0,0,0,0,0,0,0,0,0,0,176,237,0,0,126,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,95,80,0,0,0,0,0,0,0,0,0,0,0,0,0,144,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,8,0,0,0,12,0,0,0,143,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,7,0,0,0,12,0,0,0,143,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,35,0,0,0,12,0,0,0,140,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,36,0,0,0,12,0,0,0,140,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,2,0,0,0,12,0,0,0,13,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,95,80,0,37,32,0,0,70,2,0,0,12,0,0,0,3,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,94,80,0,199,0,0,0,7,0,0,0,10,0,0,0,100,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,94,80,0,20,0,0,0,135,0,0,0,10,0,0,0,101,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,94,80,0,7,0,0,0,199,0,0,0,10,0,0,0,108,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,94,80,0,135,0,0,0,20,0,0,0,10,0,0,0,109,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,94,80,0,0,0,0,0,0,0,0,0,0,0,0,0,139,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,94,80,0,0,0,0,0,0,0,0,0,0,0,0,0,69,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,94,80,0,0,0,0,0,0,0,0,0,0,0,0,0,216,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,93,80,0,0,0,0,0,0,0,0,0,0,0,0,0,208,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,93,80,0,0,0,0,0,0,0,0,0,0,0,0,0,240,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,93,80,0,0,0,0,0,0,0,0,0,0,0,0,0,248,237,0,0,24,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,52,93,80,0,0,0,0,0,0,0,0,0,0,0,0,0,247,0,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,92,80,0,0,4,0,0,0,0,0,0,4,0,0,0,76,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,184,92,80,0,0,0,0,0,0,0,0,0,0,0,0,0,167,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,92,80,0,0,0,0,0,0,0,0,0,0,0,0,0,68,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,92,80,0,7,32,0,0,0,0,0,0,0,0,0,0,68,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,92,80,0,12,0,0,0,0,0,0,0,0,0,0,0,77,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,92,80,0,11,0,0,0,0,0,0,0,0,0,0,0,77,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,92,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,132,0,0,0,0,0,0,0,1,0,0,0,176,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,228,91,80,0,132,0,0,0,0,0,0,0,1,0,0,0,176,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,13,32,0,0,132,0,0,0,1,0,0,0,176,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,228,91,80,0,13,32,0,0,132,0,0,0,1,0,0,0,176,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,13,32,0,0,1,0,0,0,0,0,0,0,246,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,1,0,0,0,0,0,0,0,0,0,0,0,246,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,135,32,0,0,8,0,0,0,0,0,0,0,236,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,91,80,0,12,32,0,0,11,0,0,0,0,0,0,0,246,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,168,91,80,0,0,0,0,0,0,0,0,0,0,0,0,0,139,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,108,91,80,0,0,0,0,0,0,0,0,0,0,0,0,0,155,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,240,90,80,0,0,0,0,0,0,0,0,0,0,0,0,0,187,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,90,80,0,0,0,0,0,0,0,0,0,0,0,0,0,131,237,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,90,80,0,0,0,0,0,0,0,0,0,0,0,0,0,147,237,0,0,32,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,90,80,0,0,0,0,0,0,0,0,0,0,0,0,0,179,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,89,80,0,17,0,0,0,4,0,0,0,2,0,0,0,65,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,89,80,0,17,0,0,0,0,0,0,0,0,0,0,0,113,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,89,80,0,17,0,0,0,16,0,0,0,0,0,0,0,113,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,89,80,0,17,0,0,0,21,0,0,0,15,0,0,0,113,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,89,80,0,22,0,0,0,13,0,0,0,0,0,0,0,211,0,0,0,99,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,89,80,0,22,0,0,0,4,0,0,0,2,0,0,0,1,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,92,89,80,0,0,0,0,0,0,0,0,0,0,0,0,0,171,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,89,80,0,0,0,0,0,0,0,0,0,0,0,0,0,163,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,128,40,0,0,0,0,0,0,4,0,0,0,193,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,23,0,0,0,0,0,0,0,0,0,0,0,126,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,11,32,0,0,0,0,0,0,0,0,0,0,241,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,12,32,0,0,0,0,0,0,0,0,0,0,241,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,38,0,0,0,0,0,0,0,0,0,0,0,111,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,192,88,80,0,37,0,0,0,0,0,0,0,12,0,0,0,193,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,128,40,0,0,0,0,0,0,4,0,0,0,197,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,23,0,0,0,0,0,0,0,0,0,0,0,118,237,0,0,28,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,11,32,0,0,0,0,0,0,0,0,0,0,245,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,12,32,0,0,0,0,0,0,0,0,0,0,245,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,37,0,0,0,0,0,0,0,12,0,0,0,197,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,38,0,0,0,0,0,0,0,0,0,0,0,102,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,104,88,80,0,2,0,0,0,0,0,0,0,0,0,0,0,165,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,87,80,0,0,0,0,0,0,0,0,0,0,0,0,0,127,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,87,80,0,21,0,0,0,132,32,0,0,7,0,0,0,128,203,0,0,254,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,87,80,0,0,0,0,0,0,0,0,0,0,0,0,0,201,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,87,80,0,18,0,0,0,0,0,0,0,5,0,0,0,192,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,87,80,0,0,0,0,0,0,0,0,0,0,0,0,0,69,237,0,0,98,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,196,86,80,0,0,0,0,0,0,0,0,0,0,0,0,0,77,237,0,0,254,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,196,86,80,0,0,0,0,0,0,0,0,0,0,0,0,0,217,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,86,80,0,4,32,0,0,0,0,0,0,1,0,0,0,16,203,0,0,254,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,86,80,0,9,32,0,0,0,0,0,0,0,0,0,0,98,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,86,80,0,8,32,0,0,0,0,0,0,0,0,0,0,243,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,86,80,0,7,32,0,0,0,0,0,0,0,0,0,0,66,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,86,80,0,0,0,0,0,0,0,0,0,0,0,0,0,23,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,85,80,0,13,0,0,0,11,0,0,0,0,0,0,0,111,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,228,85,80,0,13,0,0,0,12,0,0,0,0,0,0,0,111,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,85,80,0,4,32,0,0,0,0,0,0,1,0,0,0,0,203,0,0,254,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,85,80,0,8,32,0,0,0,0,0,0,0,0,0,0,80,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,85,80,0,9,32,0,0,0,0,0,0,0,0,0,0,96,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,85,80,0,0,0,0,0,0,0,0,0,0,0,0,0,7,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,85,80,0,0,0,0,0,0,0,0,0,0,0,0,0,111,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,156,84,80,0,4,32,0,0,0,0,0,0,1,0,0,0,24,203,0,0,254,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,84,80,0,8,32,0,0,0,0,0,0,0,0,0,0,251,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,84,80,0,9,32,0,0,0,0,0,0,0,0,0,0,99,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,156,84,80,0,135,32,0,0,0,0,0,0,0,0,0,0,252,0,0,0,28,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,84,80,0,0,0,0,0,0,0,0,0,0,0,0,0,31,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,84,80,0,13,0,0,0,11,0,0,0,0,0,0,0,127,221,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,36,84,80,0,13,0,0,0,12,0,0,0,0,0,0,0,127,253,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,83,80,0,4,32,0,0,0,0,0,0,1,0,0,0,8,203,0,0,254,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,83,80,0,9,32,0,0,0,0,0,0,0,0,0,0,97,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,232,83,80,0,8,32,0,0,0,0,0,0,0,0,0,0,81,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,83,80,0,0,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,116,83,80,0,0,0,0,0,0,0,0,0,0,0,0,0,103,237,0,0,126,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,80,83,80,0,21,0,0,0,0,0,0,0,8,0,0,0,199,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,112,80,0,132,0,0,0,0,0,0,0,1,0,0,0,152,0,0,0,255,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,20,112,80,0,132,0,0,0,0,0,0,0,1,0,0,0,152,127,0,0,16,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,112,80,0,13,32,0,0,132,0,0,0,1,0,0,0,152,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,20,112,80,0,13,32,0,0,132,0,0,0,1,0,0,0,152,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,112,80,0,13,32,0,0,1,0,0,0,0,0,0,0,222,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,112,80,0,1,0,0,0,0,0,0,0,0,0,0,0,222,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,20,112,80,0,135,32,0,0,0,4,0,0,4,0,0,0,66,237,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,212,111,80,0,13,0,0,0,0,0,0,0,0,0,0,0,2,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,164,111,80,0,0,0,0,0,0,0,0,0,0,0,0,0,55,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,52,85,80,0,21,0,0,0,132,32,0,0,7,0,0,0,192,203,0,0,254,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,32,111,80,0,2,0,0,0,0,0,0,0,0,0,0,0,177,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,248,110,80,0,0,0,0,0,0,0,0,0,0,0,0,0,111,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,172,110,80,0,2,0,0,0,0,0,0,0,0,0,0,0,191,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,116,110,80,0,4,0,0,0,0,0,0,0,1,0,0,0,32,203,0,0,254,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,110,80,0,4,0,0,0,0,0,0,0,1,0,0,0,48,203,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,100,110,80,0,0,0,0,0,0,0,0,0,0,0,0,0,118,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,44,110,80,0,4,32,0,0,0,0,0,0,1,0,0,0,40,203,0,0,254,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,110,80,0,4,32,0,0,0,0,0,0,1,0,0,0,56,203,0,0,126,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,212,109,80,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,7,32,0,0,8,0,0,0,0,0,0,0,85,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,7,32,0,0,10,0,0,0,0,0,0,0,69,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,12,32,0,0,11,0,0,0,0,0,0,0,214,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,132,0,0,0,0,0,0,0,1,0,0,0,144,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,188,109,80,0,132,0,0,0,0,0,0,0,1,0,0,0,144,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,13,32,0,0,132,0,0,0,1,0,0,0,144,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,188,109,80,0,13,32,0,0,132,0,0,0,1,0,0,0,144,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,13,32,0,0,1,0,0,0,0,0,0,0,214,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,109,80,0,1,0,0,0,0,0,0,0,0,0,0,0,214,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,152,109,80,0,0,0,0,0,0,0,0,0,0,0,0,0,125,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,120,109,80,0,4,0,0,0,0,0,0,0,1,0,0,0,48,203,0,0,128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,112,109,80,0,0,0,0,0,0,0,0,0,0,0,0,0,101,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,109,80,0,0,0,0,0,0,0,0,0,0,0,0,0,131,237,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,109,80,0,135,0,0,0,0,0,0,0,0,0,0,0,76,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,109,80,0,9,0,0,0,0,0,0,0,0,0,0,0,76,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,109,80,0,11,0,0,0,0,0,0,0,0,0,0,0,92,221,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,76,109,80,0,12,0,0,0,0,0,0,0,0,0,0,0,92,253,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,109,80,0,4,0,0,0,0,0,0,0,2,0,0,0,4,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,109,80,0,13,0,0,0,4,0,0,0,2,0,0,0,4,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,109,80,0,13,0,0,0,1,0,0,0,0,0,0,0,100,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,48,109,80,0,1,0,0,0,0,0,0,0,0,0,0,0,100,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,109,80,0,1,0,0,0,0,0,0,0,0,0,0,0,116,237,0,0,96,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,244,108,80,0,0,0,0,0,0,0,0,0,0,0,0,0,192,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,200,108,80,0,0,0,0,0,0,0,0,0,0,0,0,0,200,237,0,0,24,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,12,32,0,0,11,0,0,0,0,0,0,0,238,237,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,132,0,0,0,0,0,0,0,1,0,0,0,168,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,188,108,80,0,132,0,0,0,0,0,0,0,1,0,0,0,168,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,13,32,0,0,132,0,0,0,1,0,0,0,168,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,188,108,80,0,13,32,0,0,132,0,0,0,1,0,0,0,168,127,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,13,32,0,0,1,0,0,0,0,0,0,0,238,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,1,0,0,0,0,0,0,0,0,0,0,0,238,0,0,0,255,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,188,108,80,0,7,32,0,0,8,0,0,0,0,0,0,0,84,0,0,0,16,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,140,1,0,0,0,0,0,0,10,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,40,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,176,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,50,0,0,0,188,107,80,0,1,0,0,0,164,109,80,0,1,0,0,0,116,103,80,0,1,0,0,0,236,100,80,0,1,0,0,0,136,98,80,0,17,0,0,0,32,96,80,0,2,0,0,0,220,93,80,0,2,0,0,0,44,91,80,0,17,1,0,0,52,88,80,0,1,0,0,0,56,85,80,0,1,0,0,0,180,111,80,0,17,1,0,0,236,109,80,0,1,1,0,0,212,108,80,0,17,1,0,0,248,107,80,0,17,1,0,0,140,107,80,0,1,1,0,0,36,107,80,0,17,1,0,0,40,106,80,0,17,1,0,0,196,105,80,0,17,1,0,0,52,105,80,0,17,0,0,0,216,104,80,0,17,0,0,0,72,104,80,0,17,0,0,0,172,103,80,0,1,0,0,0,36,103,80,0,1,1,0,0,224,102,80,0,2,1,0,0,160,102,80,0,1,0,0,0,100,102,80,0,17,0,0,0,44,102,80,0,17,0,0,0,236,101,80,0,1,0,0,0,176,101,80,0,2,1,0,0,144,101,80,0,17,1,0,0,84,101,80,0,1,0,0,0,36,101,80,0,2,0,0,0,184,100,80,0,17,0,0,0,128,100,80,0,1,1,0,0,88,100,80,0,1,0,0,0,44,100,80,0,2,0,0,0,204,99,80,0,1,0,0,0,144,99,80,0,16,0,0,0,76,99,80,0,1,0,0,0,32,99,80,0,1,0,0,0,216,98,80,0,1,0,0,0,176,98,80,0,1,0,0,0,88,98,80,0,1,0,0,0,4,98,80,0,17,0,0,0,216,97,80,0,1,0,0,0,160,97,80,0,1,0,0,0,48,97,80,0,1,0,0,0,0,97,80,0,1,0,0,0,192,96,80,0,1,0,0,0,156,96,80,0,1,0,0,0,116,105,80,0,18,0,0,0,1,0,0,0,255,0,0,0,112,105,80,0,18,0,0,0,0,0,0,0,255,0,0,0,76,107,80,0,18,0,0,0,3,0,0,0,255,0,0,0,88,105,80,0,18,0,0,0,2,0,0,0,255,0,0,0,84,105,80,0,18,0,0,0,5,0,0,0,255,0,0,0,48,105,80,0,18,0,0,0,4,0,0,0,255,0,0,0,28,105,80,0,18,0,0,0,6,0,0,0,255,0,0,0,20,105,80,0,18,0,0,0,7,0,0,0,255,0,0,0,8,105,80,0,18,0,0,0,4,0,0,0,28,0,0,0,4,105,80,0,18,0,0,0,5,0,0,0,28,0,0,0,0,105,80,0,19,0,0,0,1,0,0,0,16,0,0,0,252,104,80,0,19,0,0,0,0,0,0,0,16,0,0,0,248,104,80,0,19,0,0,0,2,0,0,0,16,0,0,0,236,104,80,0,19,0,0,0,3,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,46,101,110,100,114,101,112,101,97,116,0,0,4,0,0,0,81,78,80,0,6,0,0,0,81,78,80,0,9,0,0,0,81,78,80,0,0,0,0,0,0,0,0,0,46,101,110,100,109,97,99,114,111,0,0,0,4,0,0,0,125,78,80,0,6,0,0,0,125,78,80,0,8,0,0,0,125,78,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,60,1,80,0,7,0,0,0,104,1,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,148,102,80,0,104,0,0,0,72,100,80,0,26,0,0,0,192,97,80,0,90,0,0,0,92,95,80,0,26,0,0,0,40,93,80,0,90,0,0,0,88,90,80,0,46,0,0,0,80,87,80,0,74,0,0,0,80,84,80,0,10,0,0,0,28,111,80,0,10,0,0,0,148,109,80,0,10,0,0,0,92,108,80,0,10,0,0,0,216,107,80,0,10,0,0,0,116,107,80,0,10,0,0,0,0,107,80,0,76,0,0,0,4,106,80,0,76,0,0,0,136,105,80,0,78,0,0,0,12,105,80,0,78,0,0,0,168,104,80,0,78,0,0,0,28,104,80,0,78,0,0,0,104,103,80,0,78,0,0,0,16,103,80,0,78,0,0,0,212,102,80,0,80,0,0,0,152,102,80,0,94,0,0,0,84,102,80,0,94,0,0,0,28,102,80,0,94,0,0,0,216,101,80,0,94,0,0,0,164,101,80,0,94,0,0,0,120,101,80,0,54,0,0,0,72,101,80,0,94,0,0,0,228,100,80,0,54,0,0,0,172,100,80,0,94,0,0,0,120,100,80,0,98,0,0,0,80,100,80,0,96,0,0,0,32,100,80,0,64,0,0,0,188,99,80,0,36,0,0,0,132,99,80,0,40,0,0,0,64,99,80,0,38,0,0,0])
.concat([8,99,80,0,52,0,0,0,200,98,80,0,38,0,0,0,128,98,80,0,58,0,0,0,56,98,80,0,68,0,0,0,248,97,80,0,30,0,0,0,200,97,80,0,14,0,0,0,148,97,80,0,2,0,0,0,36,97,80,0,16,0,0,0,244,96,80,0,12,0,0,0,180,96,80,0,12,0,0,0,124,96,80,0,6,0,0,0,80,96,80,0,84,0,0,0,24,96,80,0,84,0,0,0,224,95,80,0,24,0,0,0,156,95,80,0,34,0,0,0,100,95,80,0,100,0,0,0,56,95,80,0,100,0,0,0,12,95,80,0,56,0,0,0,224,94,80,0,56,0,0,0,160,94,80,0,56,0,0,0,64,94,80,0,92,0,0,0,24,94,80,0,92,0,0,0,212,93,80,0,82,0,0,0,152,93,80,0,82,0,0,0,88,93,80,0,82,0,0,0,48,93,80,0,18,0,0,0,220,92,80,0,102,0,0,0,176,92,80,0,8,0,0,0,100,92,80,0,84,0,0,0,24,92,80,0,94,0,0,0,220,91,80,0,32,0,0,0,160,91,80,0,62,0,0,0,36,91,80,0,42,0,0,0,232,90,80,0,86,0,0,0,152,90,80,0,86,0,0,0,96,90,80,0,86,0,0,0,12,90,80,0,86,0,0,0,220,89,80,0,86,0,0,0,148,89,80,0,86,0,0,0,84,89,80,0,4,0,0,0,0,89,80,0,88,0,0,0,184,88,80,0,70,0,0,0,44,88,80,0,70,0,0,0,224,87,80,0,70,0,0,0,156,87,80,0,48,0,0,0,88,87,80,0,106,0,0,0,8,87,80,0,72,0,0,0,184,86,80,0,72,0,0,0,100,86,80,0,44,0,0,0,28,86,80,0,44,0,0,0,87,0,0,0,5,0,0,0,80,78,80,0,7,0,0,0,80,78,80,0,10,0,0,0,80,78,80,0,0,0,0,0,0,0,0,0,5,0,0,0,124,78,80,0,7,0,0,0,124,78,80,0,9,0,0,0,124,78,80,0,0,0,0,0,0,0,0,0,100,107,80,0,20,0,80,0,0,0,0,0,0,0,0,0,0,0,0,0,36,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,88,108,80,0,2,0,0,0,26,0,0,0,108,90,80,0,1,0,0,0,28,90,80,0,1,0,0,0,232,89,80,0,1,0,0,0,164,89,80,0,1,0,0,0,100,89,80,0,1,0,0,0,16,89,80,0,1,0,0,0,196,88,80,0,1,0,0,0,112,88,80,0,1,0,0,0,240,87,80,0,1,0,0,0,168,87,80,0,1,0,0,0,100,87,80,0,1,0,0,0,24,87,80,0,1,0,0,0,204,86,80,0,2,0,0,0,116,86,80,0,1,0,0,0,48,86,80,0,1,0,0,0,232,85,80,0,1,0,0,0,164,85,80,0,1,0,0,0,96,85,80,0,2,0,0,0,8,85,80,0,2,0,0,0,168,84,80,0,1,0,0,0,104,84,80,0,1,0,0,0,40,84,80,0,1,0,0,0,236,83,80,0,1,0,0,0,172,83,80,0,1,0,0,0,120,83,80,0,1,0,0,0,84,83,80,0,1,0,0,0,104,108,80,0,0,0,0,0,56,112,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,59,0,0,0,0,0,0,0,2,0,0,0,46,98,115,115,0,0,0,0,97,117,114,119,0,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,114,115,116,0,68,111,117,98,108,101,32,105,110,100,105,114,101,99,116,105,111,110,32,102,111,114,98,105,100,100,101,110,0,0,0,0,114,114,100,0,79,112,101,114,97,116,105,111,110,115,32,98,101,116,119,101,101,110,32,105,120,47,105,121,47,104,108,32,97,114,101,32,102,111,114,98,105,100,100,101,110,0,0,0,114,114,99,97,0,0,0,0,79,112,101,114,97,116,105,111,110,115,32,98,101,116,119,101,101,110,32,100,105,102,102,101,114,101,110,116,32,105,110,100,101,120,32,114,101,103,105,115,116,101,114,115,32,97,114,101,32,102,111,114,98,105,100,100,101,110,0,0,114,114,99,0,79,110,108,121,32,111,117,116,32,40,99,41,44,48,32,105,115,32,115,117,112,112,111,114,116,101,100,32,102,111,114,32,116,104,101,32,111,112,99,111,100,101,32,37,115,0,0,0,117,110,107,110,111,119,110,0,114,114,98,0,77,105,115,115,101,100,32,109,97,116,99,104,101,100,32,105,110,100,101,120,32,114,101,103,105,115,116,101,114,115,32,111,110,32,37,115,0,0,0,0,98,121,116,101,0,0,0,0,45,97,117,116,111,101,120,112,0,0,0,0,114,114,97,0,85,110,104,97,110,100,108,101,100,32,111,112,101,114,97,110,100,32,116,121,112,101,32,119,97,110,116,101,100,32,48,120,37,120,32,103,111,116,32,48,120,37,120,0,45,100,111,116,100,105,114,0,114,114,0,0,99,111,112,121,0,0,0,0,79,112,101,114,97,110,100,32,118,97,108,117,101,32,109,117,115,116,32,101,118,97,108,117,97,116,101,32,116,111,32,97,32,99,111,110,115,116,97,110,116,32,102,111,114,32,111,112,99,111,100,101,32,37,115,0,112,108,116,111,102,102,0,0,115,121,110,116,97,120,47,111,108,100,115,116,121,108,101,47,115,121,110,116,97,120,46,99,0,0,0,0,114,108,100,0,37,115,32,115,112,101,99,105,102,105,101,114,32,104,97,115,32,110,111,32,101,102,102,101,99,116,32,111,110,32,116,104,101,32,111,112,99,111,100,101,32,37,115,0,115,101,116,0,110,117,109,98,101,114,32,111,114,32,105,100,101,110,116,105,102,105,101,114,32,101,120,112,101,99,116,101,100,0,0,0,114,108,99,97,0,0,0,0,37,115,32,115,112,101,99,105,102,105,101,114,32,114,101,100,117,110,100,97,110,116,32,102,111,114,32,116,104,101,32,111,112,99,111,100,101,32,37,115,0,0,0,0,101,120,112,114,58,32,0,0,97,116,111,109,46,99,0,0,101,113,0,0,114,108,99,0,37,115,32,115,112,101,99,105,102,105,101,114,32,105,115,32,110,111,116,32,118,97,108,105,100,32,102,111,114,32,116,104,101,32,111,112,99,111,100,101,32,37,115,0,45,111,0,0,116,101,120,116,58,32,34,37,115,34,0,0,101,113,117,0,114,108,98,0,79,110,108,121,32,111,110,101,32,111,102,32,105,111,105,32,97,110,100,32,105,111,101,32,99,97,110,32,98,101,32,115,112,101,99,105,102,105,101,100,32,97,116,32,97,32,116,105,109,101,0,0,101,110,100,115,116,114,117,99,116,117,114,101,0,0,0,0,114,108,97,0,37,115,32,115,112,101,99,105,102,105,101,114,32,105,115,32,111,110,108,121,32,118,97,108,105,100,32,102,111,114,32,82,97,98,98,105,116,32,112,114,111,99,101,115,115,111,114,115,0,0,0,0,101,110,100,115,116,114,117,99,116,0,0,0,114,108,0,0,79,112,99,111,100,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,37,115,32,40,37,115,41,32,98,117,116,32,105,116,32,99,97,110,32,98,101,32,101,109,117,108,97,116,101,100,32,40,45,114,99,109,101,109,117,41,0,0,0,0,115,116,114,117,99,116,117,114,101,0,0,0,114,101,116,105,0,0,0,0,97,108,116,100,32,115,112,101,99,105,102,105,101,114,32,99,97,110,110,111,116,32,98,101,32,117,115,101,100,32,119,105,116,104,32,105,110,100,101,120,32,114,101,103,105,115,116,101,114,115,0,0,118,111,98,106,0,0,0,0,115,116,114,117,99,116,0,0,114,101,116,110,0,0,0,0,122,49,56,48,32,116,97,114,103,101,116,32,100,111,101,115,110,39,116,32,115,117,112,112,111,114,116,32,56,32,98,105,116,32,105,110,100,101,120,32,114,101,103,105,115,116,101,114,115,0,0,0,98,105,110,0,101,118,101,110,0,0,0,0,110,111,108,105,115,116,0,0,114,101,116,0,82,97,98,98,105,116,32,116,97,114,103,101,116,32,100,111,101,115,110,39,116,32,115,117,112,112,111,114,116,32,56,32,98,105,116,32,105,110,100,101,120,32,114,101,103,105,115,116,101,114,115,0,101,108,102,0,108,105,115,116,0,0,0,0,114,101,115,0,82,97,98,98,105,116,32,116,97,114,103,101,116,32,100,111,101,115,110,39,116,32,115,117,112,112,111,114,116,32,114,115,116,32,37,100,0,0,0,0,99,108,114,0,46,0,0,0,112,108,116,114,101,108,0,0,115,116,114,105,110,103,0,0,114,100,109,111,100,101,0,0,105,110,118,97,108,105,100,32,98,114,97,110,99,104,32,116,121,112,101,32,102,111,114,32,37,115,0,0,42,42,42,32,37,100,32,109,110,101,109,111,110,105,99,32,99,111,108,108,105,115,105,111,110,115,33,33,10,0,0,0,97,115,99,105,105,122,0,0,105,110,115,116,114,117,99,116,105,111,110,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,111,110,32,115,101,108,101,99,116,101,100,32,97,114,99,104,105,116,101,99,116,117,114,101,0,0,112,117,115,104,0,0,0,0,105,110,100,101,120,32,111,102,102,115,101,116,32,115,104,111,117,108,100,32,98,101,32,97,32,99,111,110,115,116,97,110,116,0,0,0,99,104,97,110,103,105,110,103,32,108,97,98,101,108,32,37,115,32,102,114,111,109,32,37,108,117,32,116,111,32,37,108,117,10,0,0,97,115,99,105,105,0,0,0,112,111,112,0,37,115,32,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,32,40,37,100,41,0,0,37,115,10,37,115,10,37,115,10,37,115,10,0,0,0,0,108,105,110,101,58,32,37,100,32,111,102,32,37,115,0,0,119,101,97,107,0,0,0,0,111,117,116,105,0,0,0,0,114,115,116,32,118,97,108,117,101,32,111,117,116,32,111,102,32,114,97,110,103,101,32,40,37,100,47,48,120,37,48,50,120,41,0,0,114,101,115,111,108,118,101,95,115,101,99,116,105,111,110,40,37,115,41,32,112,97,115,115,32,37,100,10,0,0,0,0,108,111,99,97,108,0,0,0,111,117,116,100,0,0,0,0,105,110,118,97,108,105,100,32,98,105,116,32,110,117,109,98,101,114,32,40,37,100,41,32,115,104,111,117,108,100,32,98,101,32,105,110,32,114,97,110,103,101,32,48,46,46,55,0,101,120,116,101,114,110,0,0,111,117,116,48,0,0,0,0,111,117,116,32,111,102,32,114,97,110,103,101,32,102,111,114,32,56,32,98,105,116,32,101,120,112,114,101,115,115,105,111,110,32,40,37,100,41,0,0,37,108,100,32,40,48,120,37,108,120,41,10,0,0,0,0,103,108,111,98,97,108,0,0,111,117,116,0,73,110,100,101,120,32,114,101,103,105,115,116,101,114,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,32,111,110,32,37,115,0,120,108,105,98,0,0,0,0,111,116,105,114,0,0,0,0,79,112,99,111,100,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,37,115,32,40,37,115,41,0,37,115,40,37,115,37,108,117,41,58,9,37,49,50,108,108,117,32,98,121,116,101,37,99,10,0,0,0,97,108,105,103,110,0,0,0,108,105,98,0,111,116,105,109,114,0,0,0,105,110,100,101,120,32,111,102,102,115,101,116,32,111,117,116,32,111,102,32,98,111,117,110,100,115,32,40,37,100,41,0,116,121,112,101,61,37,115,32,0,0,0,0,120,114,101,102,0,0,0,0,111,116,105,109,0,0,0,0,108,97,115,116,32,37,100,32,98,121,116,101,115,32,111,102,32,115,116,114,105,110,103,32,99,111,110,115,116,97,110,116,32,104,97,100,32,98,101,101,110,32,99,117,116,0,0,0,99,99,102,0,102,105,108,101,0,0,0,0,112,108,116,0,120,100,101,102,0,0,0,0,111,116,100,114,0,0,0,0,115,107,105,112,112,105,110,103,32,105,110,115,116,114,117,99,116,105,111,110,32,105,110,32,115,116,114,117,99,116,32,105,110,105,116,0,115,101,99,116,0,0,0,0,100,101,102,99,0,0,0,0,99,97,110,110,111,116,32,114,101,115,111,108,118,101,32,115,101,99,116,105,111,110,32,60,37,115,62,44,32,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,112,97,115,115,101,115,32,114,101,97,99,104,101,100,0,0,0,111,116,100,109,114,0,0,0,108,97,98,101,108,32,60,37,115,62,32,104,97,100,32,97,108,114,101,97,100,121,32,98,101,101,110,32,100,101,102,105,110,101,100,0,102,117,110,99,0,0,0,0,100,101,102,108,0,0,0,0,111,116,100,109,0,0,0,0,97,108,105,103,110,109,101,110,116,32,116,111,111,32,98,105,103,0,0,0,111,98,106,0,100,97,116,97,100,101,102,40,37,108,117,32,98,105,116,115,41,0,0,0,100,101,102,112,0,0,0,0,111,114,0,0,115,121,109,98,111,108,32,60,37,115,62,32,97,108,114,101,97,100,121,32,100,101,102,105,110,101,100,32,119,105,116,104,32,37,115,32,115,99,111,112,101,0,0,0,63,63,63,0,100,101,102,115,0,0,0,0,110,111,112,0,117,110,101,120,112,101,99,116,101,100,32,101,110,100,114,32,119,105,116,104,111,117,116,32,114,101,112,116,0,0,0,0,10,84,104,101,114,101,32,104,97,118,101,32,98,101,101,110,32,37,100,32,101,114,114,111,114,115,33,10,0,0,0,0,98,105,110,97,114,121,0,0,110,101,103,0,117,110,101,120,112,101,99,116,101,100,32,101,110,100,114,32,119,105,116,104,111,117,116,32,109,97,99,114,111,0,0,0,10,84,104,101,114,101,32,104,97,118,101,32,98,101,101,110,32,110,111,32,101,114,114,111,114,115,46,10,0,0,0,0,115,101,99,116,105,111,110,0,109,117,108,117,0,0,0,0,101,108,115,101,32,119,105,116,104,111,117,116,32,105,102,0,10,10,83,121,109,98,111,108,115,58,10,0,102,97,105,108,0,0,0,0,109,117,108,116,0,0,0,0,109,97,120,105,109,117,109,32,105,102,45,110,101,115,116,105,110,103,32,100,101,112,116,104,32,101,120,99,101,101,100,101,100,32,40,37,100,32,108,101,118,101,108,115,41,0,0,0,70,37,48,50,100,32,32,37,115,10,0,0,100,101,112,104,97,115,101,0,101,110,100,0,109,117,108,0,105,102,32,119,105,116,104,111,117,116,32,101,110,100,105,102,0,0,0,0,10,10,83,111,117,114,99,101,115,58,10,0,101,110,100,109,97,99,114,111,0,0,0,0,108,115,100,114,0,0,0,0,101,110,100,105,102,32,119,105,116,104,111,117,116,32,105,102,0,0,0,0,99,98,109,0,83,37,48,50,100,32,32,37,115,10,0,0,103,108,111,98,100,97,116,0,101,110,100,109,97,99,0,0,108,115,105,114,0,0,0,0,114,101,112,101,97,116,101,100,108,121,32,100,101,102,105,110,101,100,32,115,121,109,98,111,108,0,0,0,10,10,83,101,99,116,105,111,110,115,58,10,0,0,0,0,101,110,100,109,0,0,0,0,37,99,32,101,120,112,101,99,116,101,100,0,108,115,105,100,114,0,0,0,101,120,112,114,101,115,115,105,111,110,32,109,117,115,116,32,98,101,32,97,32,99,111,110,115,116,97,110,116,0,0,0,32,91,82,93,0,0,0,0,109,97,99,114,111,0,0,0,108,115,100,100,114,0,0,0,32,37,48,50,88,0,0,0,45,100,101,98,117,103,0,0,37,48,50,120,37,99,0,0,109,97,99,0,32,42,99,117,114,114,101,110,116,32,112,99,32,100,117,109,109,121,42,0,108,114,101,116,0,0,0,0,105,100,101,110,116,105,102,105,101,114,32,101,120,112,101,99,116,101,100,0,10,32,32,32,32,32,32,32,32,32,32,32,32,32,32,32,83,37,48,50,100,58,37,48,56,108,88,58,32,0,0,0,45,99,98,109,45,112,114,103,0,0,0,0,101,110,100,114,101,112,101,97,116,0,0,0,108,108,114,101,116,0,0,0,44,32,101,120,112,101,99,116,101,100,0,0,70,37,48,50,100,58,37,48,52,100,32,37,115,32,37,115,0,0,0,0,83,101,99,116,105,111,110,115,58,10,0,0,101,110,100,114,101,112,0,0,108,100,112,0,105,110,118,97,108,105,100,32,100,97,116,97,32,111,112,101,114,97,110,100,0,0,0,0,32,32,32,32,32,0,0,0,101,110,100,114,0,0,0,0,108,100,108,0,103,97,114,98,97,103,101,32,97,116,32,101,110,100,32,111,102,32,108,105,110,101,0,0,69,37,48,52,100,0,0,0,114,101,112,101,97,116,0,0,108,100,105,115,114,0,0,0,109,105,115,115,105,110,103,32,111,112,101,114,97,110,100,0,119,0,0,0,112,104,97,115,101,0,0,0,114,101,112,116,0,0,0,0,108,100,105,114,0,0,0,0,109,105,115,115,105,110,103,32,99,108,111,115,105,110,103,32,112,97,114,101,110,116,104,101,115,101,115,0,32,42,116,109,112,37,48,57,108,117,42,0,105,110,99,108,117,100,101,0,108,100,105,0,116,111,111,32,109,97,110,121,32,99,108,111,115,105,110,103,32,112,97,114,101,110,116,104,101,115,101,115,0,0,0,0,99,97,108,108,0,0,0,0,115,101,99,61,37,115,32,0,103,111,116,111,102,102,0,0,105,110,99,100,105,114,0,0,108,100,104,108,0,0,0,0,110,111,32,115,112,97,99,101,32,98,101,102,111,114,101,32,111,112,101,114,97,110,100,115,0,0,0,0,97,108,105,103,110,61,37,108,117,32,0,0,109,100,97,116,0,0,0,0,115,121,109,98,111,108,32,60,37,115,62,32,114,101,100,101,102,105,110,101,100,0,0,0,108,100,104,0,105,110,118,97,108,105,100,32,101,120,116,101,110,115,105,111,110,0,0,0,105,110,99,98,105,110,0,0,108,100,102,0,115,121,110,116,97,120,32,101,114,114,111,114,0,0,0,0,115,105,122,101,61,0,0,0,45,113,117,105,101,116,0,0,101,110,100,105,102,0,0,0,115,112,97,99,101,40,37,108,117,44,102,105,108,108,61,0,108,100,100,115,114,0,0,0,110,111,32,115,116,114,117,99,116,117,114,101,0,0,0,0,87,69,65,75,32,0,0,0,101,108,0,0,108,100,100,114,0,0,0,0,99,97,110,110,111,116,32,100,101,99,108,97,114,101,32,115,116,114,117,99,116,117,114,101,32,119,105,116,104,105,110,32,115,116,114,117,99,116,117,114,101,0,0,0,67,79,77,77,79,78,32,0,101,108,115,101,0,0,0,0,108,100,100,0,97,115,115,101,114,116,105,111,110,32,34,37,115,34,32,102,97,105,108,101,100,58,32,37,115,0,0,0,69,88,80,79,82,84,32,0,105,102,110,117,115,101,100,0,108,100,0,0,98,97,100,32,102,105,108,101,45,111,102,102,115,101,116,32,97,114,103,117,109,101,110,116,0,0,0,0,73,78,84,69,82,78,65,76,32,0,0,0,118,97,115,109,32,111,108,100,115,116,121,108,101,32,115,121,110,116,97,120,32,109,111,100,117,108,101,32,48,46,49,49,32,40,99,41,32,50,48,48,50,45,50,48,49,51,32,70,114,97,110,107,32,87,105,108,108,101,0,0,105,102,117,115,101,100,0,0,108,106,112,0,109,97,99,114,111,32,105,100,32,105,110,115,101,114,116,32,111,110,32,101,109,112,116,121,32,115,116,97,99,107,0,0,114,101,110,100,0,0,0,0,105,102,108,101,0,0,0,0,108,99,97,108,108,0,0,0,114,101,108,111,99,32,111,114,103,32,119,97,115,32,110,111,116,32,115,101,116,0,0,0,69,88,80,82,40,0,0,0,105,102,108,116,0,0,0,0,106,112,0,0,114,101,108,111,99,32,111,114,103,32,105,115,32,97,108,114,101,97,100,121,32,115,101,116,0,0,0,0,98,111,111,108,0,0,0,0,73,77,80,32,0,0,0,0,103,111,116,114,101,108,0,0,105,102,103,101,0,0,0,0,82,69,80,69,65,84,58,37,115,58,108,105,110,101,32,37,100,0,0,0,106,114,101,0,105,108,108,101,103,97,108,32,109,97,99,114,111,32,97,114,103,117,109,101,110,116,0,0,76,65,66,32,40,48,120,37,108,108,120,41,32,0,0,0,105,102,103,116,0,0,0,0,105,110,116,101,114,110,97,108,32,101,114,114,111,114,32,37,100,32,105,110,32,108,105,110,101,32,37,100,32,111,102,32,37,115,0,0,106,114,0,0,100,105,118,105,115,105,111,110,32,98,121,32,122,101,114,111,0,0,0,0,37,115,32,0,105,102,110,101,0,0,0,0,105,112,115,101,116,0,0,0,109,97,99,114,111,32,105,100,32,112,117,108,108,32,119,105,116,104,111,117,116,32,109,97,116,99,104,105,110,103,32,112,117,115,104,0,118,97,115,109,46,99,0,0,10,0,0,0,105,102,101,113,0,0,0,0,37,48,50,120,32,0,0,0,105,112,114,101,115,0,0,0,109,97,99,114,111,32,105,100,32,115,116,97,99,107,32,111,118,101,114,102,108,111,119,0,37,56,108,108,120,58,32,0,105,102,0,0,105,110,105,114,0,0,0,0,105,108,108,101,103,97,108,32,114,101,108,111,99,97,116,105,111,110,0,0,115,101,99,116,105,111,110,32,37,115,32,40,97,116,116,114,61,60,37,115,62,32,97,108,105,103,110,61,37,108,108,117,41,58,10,0,105,102,110,100,101,102,0,0,105,110,105,0,105,110,116,101,114,110,97,108,32,115,121,109,98,111,108,32,37,115,32,114,101,100,101,102,105,110,101,100,32,98,121,32,117,115,101,114,0,0,0,0,117,0,0,0,105,102,100,101,102,0,0,0,105,110,100,114,0,0,0,0,110,111,32,99,117,114,114,101,110,116,32,109,97,99,114,111,32,116,111,32,101,120,105,116,0,0,0,0,118,97,115,109,32,116,101,115,116,32,111,117,116,112,117,116,32,109,111,100,117,108,101,32,49,46,48,32,40,99,41,32,50,48,48,50,32,86,111,108,107,101,114,32,66,97,114,116,104,101,108,109,97,110,110,0,97,115,115,101,114,116,0,0,105,110,100,0,105,108,108,101,103,97,108,32,101,115,99,97,112,101,32,115,101,113,117,101,110,99,101,32,92,37,99,0,114,111,114,103,0,0,0,0,119,114,100,0,105,110,99,0,114,101,108,111,99,97,116,105,111,110,32,110,111,116,32,97,108,108,111,119,101,100,0,0,115,101,103,37,108,108,120,0,98,121,116,0,105,110,48,0,35,37,100,32,105,115,32,110,111,116,32,97,32,118,97,108,105,100,32,119,97,114,110,105,110,103,32,109,101,115,115,97,103,101,0,0,98,105,116,0,103,111,116,0,100,99,0,0,37,100,0,0,105,110,0,0,109,105,115,115,105,110,103,32,101,110,100,32,100,105,114,101,99,116,105,118,101,32,105,110,32,114,101,112,101,97,116,45,98,108,111,99,107,0,0,0,119,98,0,0,98,108,107,119,0,0,0,0,110,111,32,99,117,114,114,101,110,116,32,115,101,99,116,105,111,110,32,115,112,101,99,105,102,105,101,100,0,0,0,0,105,109,0,0,99,111,109,112,108,101,120,32,101,120,112,114,101,115,115,105,111,110,0,0,105,110,105,116,105,97,108,105,122,101,100,32,100,97,116,97,32,105,110,32,98,115,115,0,97,46,111,117,116,0,0,0,97,100,99,0,98,108,107,0,105,100,101,116,0,0,0,0,101,120,112,114,101,115,115,105,111,110,32,109,117,115,116,32,98,101,32,99,111,110,115,116,97,110,116,0,97,46,108,115,116,0,0,0,100,115,119,0,105,98,111,120,0,0,0,0,100,97,116,97,40,37,108,117,41,58,32,0,114,101,97,100,32,101,114,114,111,114,32,111,110,32,60,37,115,62,0,0,115,112,99,0,104,97,108,116,0,0,0,0,111,112,116,105,111,110,32,45,37,99,32,119,97,115,32,115,112,101,99,105,102,105,101,100,32,116,119,105,99,101,0,0,115,117,112,112,46,99,0,0,114,101,115,101,114,118,101,0,102,115,121,115,99,97,108,108,0,0,0,0,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,37,100,32,109,97,99,114,111,32,97,114,103,117,109,101,110,116,115,32,101,120,99,101,101,100,101,100,0,0,0,102,105,108,108,0,0,0,0,102,108,97,103,0,0,0,0,109,97,99,114,111,32,100,101,102,105,110,105,116,105,111,110,32,105,110,115,105,100,101,32,109,97,99,114,111,32,34,37,115,34,0,0,45,120,0,0,100,115,98,0,101,120,120,0,110,111,110,101,0,0,0,0,109,105,115,115,105,110,103,32,101,110,100,32,100,105,114,101,99,116,105,118,101,32,102,111,114,32,109,97,99,114,111,32,34,37,115,34,0,0,0,0,45,112,105,99,0,0,0,0,111,114,103,0,100,115,0,0,101,120,112,0,117,110,100,101,102,105,110,101,100,32,109,97,99,114,111,32,112,97,114,97,109,101,116,101,114,32,39,92,37,100,39,0,112,97,114,115,101,46,99,0,45,109,97,120,101,114,114,111,114,115,61,0,97,98,121,116,101,0,0,0,101,120,0,0,116,114,97,105,108,105,110,103,32,103,97,114,98,97,103,101,32,97,102,116,101,114,32,111,112,116,105,111,110,32,45,37,99,0,0,0,97,110,100,0,45,119,0,0,112,99,0,0,100,101,102,119,0,0,0,0,37,48,54,108,117,0,0,0,101,105,0,0,117,110,100,101,102,105,110,101,100,32,115,121,109,98,111,108,32,60,37,115,62,0,0,0,45,110,111,119,97,114,110,61,0,0,0,0,36,32,43,32,54,0,0,0,99,112,117,115,47,122,56,48,47,99,112,117,46,99,0,0,45,122,56,48,97,115,109,0,100,102,119,0,45,114,99,109,101,109,117,0,117,110,107,110,111,119,110,32,115,101,99,116,105,111,110,32,60,37,115,62,0,0,0,0,100,119,106,110,122,0,0,0,45,115,119,97,112,105,120,105,121,0,0,0,103,98,122,56,48,0,0,0,37,108,117,0,99,104,97,114,97,99,116,101,114,32,99,111,110,115,116,97,110,116,32,116,111,111,32,108,111,110,103,0,45,103,98,122,56,48,0,0,104,100,54,52,49,56,48,0,45,110,111,115,121,109,0,0,45,104,100,54,52,49,56,48,0,0,0,0,82,97,98,98,105,116,52,48,48,48,0,0,45,114,99,109,52,48,48,48,0,0,0,0,82,97,98,98,105,116,51,48,48,48,0,0,45,114,99,109,51,48,48,48,0,0,0,0,100,119,0,0,82,97,98,98,105,116,50,48,48,48,0,0,100,106,110,122,0,0,0,0,45,114,99,109,50,48,48,48,0,0,0,0,56,48,56,48,0,0,0,0,115,101,99,116,105,111,110,32,111,102,102,115,101,116,32,105,115,32,108,111,119,101,114,32,116,104,97,110,32,99,117,114,114,101,110,116,32,112,99,0,45,56,48,56,48,0,0,0,105,111,101,0,45,110,111,101,115,99,0,0,105,111,105,0,97,108,116,100,0,0,0,0,114,99,109,120,95,37,115,0,109,111,100,117,108,101,0,0,65,83,77,80,67,0,0,0,97,100,100,114,0,0,0,0,48,0,0,0,100,105,0,0,32,9,43,45,0,0,0,0,41,32,0,0,41,32,9,43,45,0,0,0,115,121,109,98,111,108,58,32,0,0,0,0,102,97,105,108,58,32,37,115,0,0,0,0,41,32,43,45,0,0,0,0,118,0,0,0,45,110,111,99,97,115,101,0,108,116,0,0,103,116,0,0,103,116,117,0,108,111,0,0,108,122,0,0,119,111,114,100,0,0,0,0,109,0,0,0,100,101,99,0,112,0,0,0,117,110,107,110,111,119,110,32,114,101,108,111,99,40,0,0,112,111,0,0,115,121,109,98,111,108,32,60,37,115,62,32,114,101,99,117,114,115,105,118,101,108,121,32,100,101,102,105,110,101,100,0,112,101,0,0,110,99,0,0,45,105,103,110,111,114,101,45,109,117,108,116,45,105,110,99,0,0,0,0,110,122,0,0,122,0,0,0,106,107,0,0,106,107,39,0,98,99,100,101,0,0,0,0,119,111,114,0,98,99,100,101,39,0,0,0,100,97,97,0,106,107,104,108,0,0,0,0,114,37,115,40,37,100,44,37,100,44,48,120,37,108,108,120,44,48,120,37,108,108,120,44,0,0,0,0,106,107,104,108,39,0,0,0,111,117,116,32,111,102,32,109,101,109,111,114,121,0,0,0,104,116,114,0,115,117,0,0,45,117,110,110,97,109,101,100,45,115,101,99,116,105,111,110,115,0,0,0,112,122,0,0,112,121,0,0,112,120,0,0,112,119,0,0,112,122,39,0,116,101,120,116,0,0,0,0,112,121,39,0,99,112,108,0,112,120,39,0,115,101,99,111,102,102,0,0,0,0,0,0,112,119,39,0,99,111,117,108,100,32,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,111,117,116,112,117,116,32,109,111,100,117,108,101,32,60,37,115,62,0,37,112,32,0,120,112,99,0,102,0,0,0,45,73,0,0,118,97,115,109,32,118,111,98,106,32,111,117,116,112,117,116,32,109,111,100,117,108,101,32,48,46,55,98,32,40,99,41,32,50,48,48,50,45,50,48,49,51,32,86,111,108,107,101,114,32,66,97,114,116,104,101,108,109,97,110,110,0,0,0,105,105,114,0,118,97,115,109,32,98,105,110,97,114,121,32,111,117,116,112,117,116,32,109,111,100,117,108,101,32,49,46,54,32,40,99,41,32,50,48,48,50,45,50,48,48,57,32,86,111,108,107,101,114,32,66,97,114,116,104,101,108,109,97,110,110,0,0,105,0,0,0,83,121,109,98,111,108,115,58,10,0,0,0,101,105,114,0,114,0,0,0,108,0,0,0,100,101,102,109,0,0,0,0,104,0,0,0,99,112,105,114,0,0,0,0,101,0,0,0,106,109,112,115,108,111,116,0,100,0,0,0,110,111,32,105,110,112,117,116,32,102,105,108,101,32,115,112,101,99,105,102,105,101,100,0,105,110,115,116,32,37,100,40,37,115,41,32,0,0,0,0,99,0,0,0,98,0,0,0,45,68,0,0,97,0,0,0,108,39,0,0,104,39,0,0,97,99,114,119,120,0,0,0,101,39,0,0,100,39,0,0,100,97,116,97,0,0,0,0,99,39,0,0,99,112,105,0,98,39,0,0,97,39,0,0,117,110,107,110,111,119,110,32,111,112,116,105,111,110,32,60,37,115,62,0,105,112,0,0,105,121,0,0,37,105,0,0,105,120,0,0,105,121,104,0,105,121,108,0,105,120,104,0,105,108,108,101,103,97,108,32,111,112,101,114,97,110,100,32,116,121,112,101,115,0,0,0,105,120,108,0,97,115,99,0,97,102,0,0,99,112,100,114,0,0,0,0,115,112,0,0,108,111,97,100,114,101,108,0,100,101,0,0,99,111,117,108,100,32,110,111,116,32,111,112,101,110,32,60,37,115,62,32,102,111,114,32,111,117,116,112,117,116,0,0,97,115,115,101,114,116,58,32,37,115,32,40,109,101,115,115,97,103,101,58,32,37,115,41,10,0,0,0,104,108,0,0,97,100,100,0,98,99,0,0,45,76,108,0,97,102,39,0,104,108,39,0,100,101,39,0,98,99,39,0,97,98,115,0,122,56,48,0,100,101,102,98,0,0,0,0,114,98,0,0,118,97,115,109,32,56,48,56,48,47,103,98,122,56,48,47,122,56,48,47,122,49,56,48,47,114,99,109,88,48,48,48,32,99,112,117,32,98,97,99,107,101,110,100,32,48,46,50,101,32,40,99,41,32,50,48,48,55,44,50,48,48,57,32,68,111,109,105,110,105,99,32,77,111,114,114,105,115,0,0,99,112,100,0,120,111,114,0,108,111,99,97,108,112,99,0,117,109,115,0,101,114,114,111,114,46,99,0,99,111,117,108,100,32,110,111,116,32,111,112,101,110,32,60,37,115,62,32,102,111,114,32,105,110,112,117,116,0,0,0,117,109,97,0,114,111,114,103,32,101,110,100,0,0,0,0,62,37,115,10,0,0,0,0,116,115,116,105,111,0,0,0,58,32,0,0,97,98,111,114,116,105,110,103,46,46,46,10,0,0,0,0,45,76,110,115,0,0,0,0,116,115,116,0,32,102,114,111,109,32,108,105,110,101,32,37,100,32,111,102,32,34,37,115,34,10,0,0,116,101,115,116,0,0,0,0,9,105,110,99,108,117,100,101,100,0,0,0,115,121,115,114,101,116,0,0,9,99,97,108,108,101,100,0,115,121,115,99,97,108,108,0,115,119,97,112,0,0,0,0,32,105,110,32,108,105,110,101,32,37,100,32,111,102,32,34,37,115,34,0,100,102,98,0,115,117,114,101,115,0,0,0,32,37,100,0,117,110,107,110,111,119,110,32,109,110,101,109,111,110,105,99,32,60,37,115,62,0,0,0,115,117,98,0,99,112,0,0,109,101,115,115,97,103,101,0,117,97,98,115,0,0,0,0,115,116,111,112,0,0,0,0,119,97,114,110,105,110,103,0,101,120,112,114,46,99,0,0,109,117,108,116,105,112,108,101,32,105,110,112,117,116,32,102,105,108,101,115,0,0,0,0,115,114,108,0,114,111,114,103,58,32,114,101,108,111,99,97,116,101,32,116,111,32,48,120,37,108,108,120,0,0,0,0,101,114,114,111,114,0,0,0,115,114,97,0,42,42,42,109,97,120,105,109,117,109,32,110,117,109,98,101,114,32,111,102,32,101,114,114,111,114,115,32,114,101,97,99,104,101,100,33,42,42,42,10,0,0,0,0,45,76,110,102,0,0,0,0,115,108,112,0,102,97,116,97,108,32,0,0,115,108,108,0,115,108,97,0,117,110,100,101,102,105,110,101,100,32,115,121,109,98,111,108,32,60,37,115,62,32,97,116,32,37,115,43,48,120,37,108,120,44,32,114,101,108,111,99,32,116,121,112,101,32,37,100,0,0,0,0,115,101,116,117,115,114,112,0,111,117,116,112,117,116,32,109,111,100,117,108,101,32,100,111,101,115,110,39,116,32,97,108,108,111,119,32,109,117,108,116,105,112,108,101,32,115,101,99,116,105,111,110,115,32,111,102,32,116,104,101,32,115,97,109,101,32,116,121,112,101,32,40,37,115,41,0,115,101,116,117,115,114,0,0,114,101,108,111,99,32,116,121,112,101,32,37,100,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,100,98,0,0,115,101,116,115,121,115,112,0,114,101,108,111,99,32,116,121,112,101,32,37,100,44,32,115,105,122,101,32,37,100,44,32,109,97,115,107,32,48,120,37,108,120,32,40,115,121,109,98,111,108,32,37,115,32,43,32,48,120,37,108,120,41,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,0,0,0,99,111,112,121,114,0,0,0,115,101,99,116,105,111,110,32,97,116,116,114,105,98,117,116,101,115,32,60,37,115,62,32,110,111,116,32,115,117,112,112,112,111,114,116,101,100,0,0,115,100,0,0,115,99,102,0,119,114,105,116,101,32,101,114,114,111,114,0,99,111,117,108,100,32,110,111,116,32,105,110,105,116,105,97,108,105,122,101,32,37,115,32,109,111,100,117,108,101,0,0,115,98,111,120,0,0,0,0,114,111,102,102,115,58,32,111,102,102,115,101,116,32,0,0,111,117,116,112,117,116,32,109,111,100,117,108,101,32,100,111,101,115,110,39,116,32,115,117,112,112,111,114,116,32,99,112,117,32,37,115,0,0,0,0,115,98,99,0,115,101,99,116,105,111,110,115,32,109,117,115,116,32,110,111,116,32,111,118,101,114,108,97,112,0,0,0,45,76,0,0,118,97,115,109,32,49,46,54,97,32,40,99,41,32,105,110,32,50,48,48,50,45,50,48,49,51,32,86,111,108,107,101,114,32,66,97,114,116,104,101,108,109,97,110,110,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
, "i8", ALLOC_NONE, TOTAL_STACK)
function runPostSets() {
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
      }};function _close(fildes) {
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
  function _rmdir(path) {
      // int rmdir(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/rmdir.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (!path.object.write || path.isRoot) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (!path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return -1;
      } else {
        for (var i in path.object.contents) {
          ___setErrNo(ERRNO_CODES.ENOTEMPTY);
          return -1;
        }
        if (path.path == FS.currentPath) {
          ___setErrNo(ERRNO_CODES.EBUSY);
          return -1;
        } else {
          delete path.parentObject.contents[path.name];
          return 0;
        }
      }
    }function _remove(path) {
      // int remove(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/remove.html
      var ret = _unlink(path);
      if (ret == -1) ret = _rmdir(path);
      return ret;
    }
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
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
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
  function _isalpha(chr) {
      return (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
    }
  function _isalnum(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 122) ||
             (chr >= 65 && chr <= 90);
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
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
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
    }function _fread(ptr, size, nitems, stream) {
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
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      return Number(FS.streams[stream] && FS.streams[stream].eof);
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
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }
  var _vfprintf=_fprintf;
  function _isspace(chr) {
      return chr in { 32: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0 };
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
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      } else {
        FS.streams[stream].eof = false;
        return 0;
      }
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
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      if (FS.streams[stream]) {
        stream = FS.streams[stream];
        if (stream.object.isDevice) {
          ___setErrNo(ERRNO_CODES.ESPIPE);
          return -1;
        } else {
          return stream.position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
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
  function _isxdigit(chr) {
      return (chr >= 48 && chr <= 57) ||
             (chr >= 97 && chr <= 102) ||
             (chr >= 65 && chr <= 70);
    }
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
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
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
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
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  var _llvm_memset_p0i8_i64=_memset;
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
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
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_handle_ifused,0,_handle_local,0,_handle_endif,0,_handle_section,0,_handle_d8
,0,_handle_else,0,_handle_ifle,0,_handle_ifnused,0,_handle_end,0,_output_args583
,0,_write_output598,0,_handle_incdir,0,_handle_rorg,0,_write_output591,0,_handle_iflt
,0,_handle_d24,0,_handle_include,0,_handle_ifd,0,_handle_ifne,0,_handle_ifnd
,0,_handle_defc,0,_handle_endstruct,0,_handle_align,0,_handle_list,0,_write_output
,0,_handle_ifeq,0,_handle_spc16,0,_handle_endr,0,_handle_ifgt,0,_output_args592
,0,_handle_d32,0,_handle_assert,0,_output_args599,0,_handle_ifge,0,_handle_string
,0,_handle_struct,0,_handle_even,0,_handle_text,0,_handle_d16,0,_handle_d8_offset
,0,_handle_endm,0,_handle_incbin,0,_handle_global,0,_handle_weak,0,_handle_rend
,0,_handle_macro,0,_handle_spc8,0,_handle_fixedspc2,0,_handle_fixedspc1,0,_handle_rept,0,_handle_fail,0,_handle_org,0,_handle_nolist,0];
// EMSCRIPTEN_START_FUNCS
function _print_section(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=r2>>2;r4=STACKTOP;r5=HEAP32[r3+7];r6=HEAP32[r3+2];r7=HEAP32[r3+5];r8=r7&HEAP32[1310727];r9=((r7|0)<0?-1:0)&HEAP32[1310728];_fprintf(r1,5268320,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=HEAP32[r3+1],HEAP32[tempInt+4>>2]=r6,HEAP32[tempInt+8>>2]=r8,HEAP32[tempInt+12>>2]=r9,tempInt));r9=HEAP32[r3+3];if((r9|0)==0){STACKTOP=r4;return}else{r10=r5;r11=r9}while(1){r9=HEAP32[r11+8>>2];r5=r10-1+r9|0;r3=r5-(r5|0)%(r9|0)|0;r9=((r3|0)<0?-1:0)&HEAP32[1310728];_fprintf(r1,5268280,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r3&HEAP32[1310727],HEAP32[tempInt+4>>2]=r9,tempInt));_print_atom(r1,r11);_fputc(10,r1);r9=_atom_size(r11,r2,r3)+r3|0;r3=HEAP32[r11>>2];if((r3|0)==0){break}else{r10=r9;r11=r3}}STACKTOP=r4;return}function _print_symbol(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=r2>>2;r4=STACKTOP;r5=(r2|0)==0;if(r5){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=838,HEAP32[tempInt+8>>2]=5268220,tempInt))}_fprintf(r1,5268164,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r3+3],tempInt));r6=(r2+4|0)>>2;r7=HEAP32[r6];if((r7|0)==1){r8=HEAP32[r3+7];r9=((r8|0)<0?-1:0)&HEAP32[1310728];_fprintf(r1,5268080,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r8&HEAP32[1310727],HEAP32[tempInt+4>>2]=r9,tempInt));r10=HEAP32[r6]}else{r10=r7}if((r10|0)==2){_fwrite(5268008,4,1,r1);r11=HEAP32[r6]}else{r11=r10}if((r11|0)==3){_fwrite(5267952,5,1,r1);r11=HEAP32[r3+4];_simplify_expr(r11);if((HEAP32[r11>>2]|0)==21){_fprintf(r1,5269416,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r11+12>>2],tempInt))}else{_fwrite(5268752,18,1,r1)}_fwrite(5269696,2,1,r1)}r11=(r2+8|0)>>2;r10=HEAP32[r11];if((r10&128|0)==0){r12=r10}else{_fwrite(5267788,9,1,r1);r12=HEAP32[r11]}if((r12&8|0)==0){r13=r12}else{_fwrite(5267740,7,1,r1);r13=HEAP32[r11]}if((r13&32|0)==0){r14=r13}else{_fwrite(5267692,7,1,r1);r14=HEAP32[r11]}if((r14&64|0)==0){r15=r14}else{_fwrite(5267628,5,1,r1);r15=HEAP32[r11]}if((r15&7|0)!=0){if(r5){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=831,HEAP32[tempInt+8>>2]=5268220,tempInt));r16=HEAP32[r11]}else{r16=r15}_fprintf(r1,5266060,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[((r16&7)<<2)+5244088>>2],tempInt))}r16=r2+20|0;if((HEAP32[r16>>2]|0)!=0){_fwrite(5267564,5,1,r1);r2=HEAP32[r16>>2];_simplify_expr(r2);if((HEAP32[r2>>2]|0)==21){_fprintf(r1,5269416,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2+12>>2],tempInt))}else{_fwrite(5268752,18,1,r1)}_fputc(32,r1)}r2=HEAP32[r3+8];if((r2|0)!=0){_fprintf(r1,5267468,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt))}r2=HEAP32[r3+6];if((r2|0)==0){STACKTOP=r4;return}_fprintf(r1,5267408,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r2+4>>2],tempInt));STACKTOP=r4;return}function _leave(){var r1,r2,r3,r4,r5,r6,r7,r8;r1=HEAP32[1311070];do{if((r1|0)!=0){_fclose(r1);if((HEAP32[1315728]|0)==0){break}_remove(HEAP32[1311069])}}while(0);L60:do{if((HEAP32[1315960]|0)!=0){_fwrite(5267156,10,1,HEAP32[_stdout>>2]);r1=HEAP32[1315721];r2=HEAP32[_stdout>>2];L62:do{if((r1|0)==0){r3=r2}else{r4=r1;r5=r2;while(1){_print_section(r5,r4);r6=HEAP32[r4>>2];r7=HEAP32[_stdout>>2];if((r6|0)==0){r3=r7;break L62}else{r4=r6;r5=r7}}}}while(0);_fwrite(5270248,9,1,r3);r2=HEAP32[1315719];if((r2|0)==0){break}else{r8=r2}while(1){_print_symbol(HEAP32[_stdout>>2],r8);_fputc(10,HEAP32[_stdout>>2]);r2=HEAP32[r8>>2];if((r2|0)==0){break L60}else{r8=r2}}}}while(0);if((HEAP32[1315728]|0)==0){_exit(0)}else{_exit(1)}}function _main(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67;r3=r2>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+24|0;r6=r5;r7=r5+4;r8=r5+8;r9=r5+12;r10=r5+16;r11=r5+20;r12=(r1|0)>1;L73:do{if(r12){r13=1;r14=1;while(1){r15=((r14<<2)+r2|0)>>2;r16=HEAP32[r15];do{if(HEAP8[r16]<<24>>24==45){if(HEAP8[r16+1|0]<<24>>24!=70){r17=r16;break}HEAP32[1311047]=r16+2|0;HEAP8[HEAP32[r15]]=0;r17=HEAP32[r15]}else{r17=r16}}while(0);if((_strcmp(5267572,r17)|0)==0){HEAP8[r17]=0;r18=0;r19=HEAP32[r15]}else{r18=r13;r19=r17}if((_strcmp(5266992,r19)|0)==0){HEAP32[1315960]=1;HEAP8[HEAP32[r15]]=0}r16=r14+1|0;if((r16|0)==(r1|0)){r20=r18;break L73}else{r13=r18;r14=r16}}}else{r20=1}}while(0);r18=HEAP32[1311047];L87:do{if((_strcmp(r18,5270860)|0)==0){HEAP32[1311067]=5268456;HEAP32[1310721]=50;HEAP32[1311068]=20}else{do{if((_strcmp(r18,5265304)|0)!=0){if((_strcmp(r18,5265228)|0)==0){HEAP32[1311067]=5270180;HEAP32[1310721]=28;HEAP32[1311068]=60;break L87}if((_strcmp(r18,5265152)|0)!=0){break}HEAP32[1311067]=5270112;HEAP32[1310721]=22;HEAP32[1311068]=66;break L87}}while(0);_general_error(16,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r18,tempInt))}}while(0);r18=_new_hashtable(4096);HEAP32[1315443]=r18;L98:do{if((HEAP32[1315442]|0)!=0){r19=r10|0;r17=0;r14=r18;r13=HEAP32[1311086];while(1){HEAP32[r19>>2]=r17;_add_hashentry(r14,r13,r10);r16=HEAP32[1315442];r21=r17;while(1){r22=r21+1|0;if(r22>>>0>=r16>>>0){break L98}r23=HEAP32[(r22*44&-1)+5244344>>2];if((_strcmp(r13,r23)|0)==0){r21=r22}else{break}}r17=r22;r14=HEAP32[1315443];r13=r23}}}while(0);do{if((HEAP32[1315960]|0)!=0){r23=HEAP32[HEAP32[1315443]+8>>2];if((r23|0)==0){break}_printf(5265420,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r23,tempInt))}}while(0);HEAP32[1310781]=_new_hashtable(65536);_new_include_path(5265364);HEAP32[1310727]=_i64Add(_bitshift64Shl(1,0,HEAP32[1316043]<<3),tempRet0,-1,-1);HEAP32[1310728]=tempRet0;r23=(r20|0)==0;if(!r23){r20=HEAP32[1316022];r22=HEAP32[1310780];r10=HEAP32[1311067];_printf(5265632,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=HEAP32[1316024],HEAP32[tempInt+4>>2]=r20,HEAP32[tempInt+8>>2]=r22,HEAP32[tempInt+12>>2]=r10,tempInt))}L114:do{if(r12){r10=r1-1|0;r22=1;r20=1;while(1){r18=(r20<<2)+r2|0;r13=HEAP32[r18>>2];r14=HEAP8[r13];L118:do{if(r14<<24>>24==45){if((_strcmp(5264848,r13)|0)==0&(r20|0)<(r10|0)){if((HEAP32[1311069]|0)!=0){_general_error(28,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=111,tempInt))}r17=r20+1|0;HEAP32[1311069]=HEAP32[(r17<<2>>2)+r3];r24=r17;r25=r22;break}if((_strcmp(5271604,r13)|0)==0&(r20|0)<(r10|0)){if((HEAP32[1315449]|0)!=0){_general_error(28,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=76,tempInt))}r17=r20+1|0;HEAP32[1315449]=HEAP32[(r17<<2>>2)+r3];HEAP8[5244084]=1;r24=r17;r25=r22;break}if((_strcmp(5271132,r13)|0)==0){HEAP32[1315451]=0;r24=r20;r25=r22;break}if((_strcmp(5270824,r13)|0)==0){HEAP32[1315448]=1;r24=r20;r25=r22;break}if((_strncmp(5270592,r13,3)|0)==0){_sscanf(r13+3|0,5270440,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5261800,tempInt));r24=r20;r25=r22;break}L145:do{if((_strncmp(5270356,r13,2)|0)==0){r17=r13+2|0;if(HEAP8[r17]<<24>>24==0){if((r20|0)>=(r10|0)){r26=r20;break}r19=r20+1|0;r27=HEAP32[(r19<<2>>2)+r3];r28=r19}else{r27=r17;r28=r20}if((r27|0)==0){r26=r28;break}r17=HEAP8[r27];do{if(r17<<24>>24==46|r17<<24>>24==95){r29=r27}else{if((_isalpha(r17&255)|0)==0){r26=r28;break L145}else{r29=r27;break}}}while(0);while(1){r30=r29+1|0;r17=HEAP8[r30];if(r17<<24>>24==95){r29=r30;continue}if((_isalnum(r17&255)|0)==0){break}else{r29=r30}}r17=r30-r27|0;r19=r17+1|0;do{if((HEAP32[1315960]|0)==0){r21=_malloc(r19);r16=r21;if((r21|0)!=0){r31=r16;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r31=r16}else{r16=_malloc(r17+9|0);if((r16|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r16+8|0;HEAP32[r16+4>>2]=r19;_memset(r21,-35,r19);r31=r21}}while(0);r19=r31;_memcpy(r19,r27,r17);HEAP8[r19+r17|0]=0;if(HEAP8[r30]<<24>>24==61){HEAP32[1310797]=r29+2|0;HEAP8[5261784]=0;r21=_expression();_simplify_expr(r21);r32=r21;r33=HEAP32[1310797]}else{do{if((HEAP32[1315960]|0)==0){r21=_malloc(16);r16=r21;if((r21|0)!=0){r34=r16,r35=r34>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r34=r16,r35=r34>>2}else{r16=_malloc(24);if((r16|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r16+8|0,r15=r21>>2;HEAP32[r16+4>>2]=16;HEAP32[r15]=-572662307;HEAP32[r15+1]=-572662307;HEAP32[r15+2]=-572662307;HEAP32[r15+3]=-572662307;r34=r21,r35=r34>>2}}while(0);HEAP32[r35+2]=0;HEAP32[r35+1]=0;HEAP32[r35]=21;HEAP32[r35+3]=1;r32=r34;r33=r30}if(HEAP8[r33]<<24>>24!=0){_general_error(23,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=68,tempInt))}_new_abs(r19,r32);if((r31|0)==0){r24=r28;r25=r22;break L118}if((HEAP32[1315960]|0)==0){_free(r19);r24=r28;r25=r22;break L118}else{_memset(r19,-1,HEAP32[r31-4>>2]);_free(r31-8|0);r24=r28;r25=r22;break L118}}else{r26=r20}}while(0);r17=HEAP32[(r26<<2>>2)+r3];do{if((_strncmp(5270108,r17,2)|0)==0){r21=r17+2|0;if(HEAP8[r21]<<24>>24==0){if((r26|0)>=(r10|0)){r36=r26;r37=r17;break}r15=r26+1|0;r16=HEAP32[(r15<<2>>2)+r3];r38=r16;r39=r15;r40=r16}else{r38=r21;r39=r26;r40=r17}if((r38|0)==0){r36=r39;r37=r40;break}_new_include_path(r38);r24=r39;r25=r22;break L118}else{r36=r26;r37=r17}}while(0);r17=(r36<<2)+r2|0;if((_strcmp(5269980,r37)|0)==0){HEAP32[1310724]=1;r24=r36;r25=r22;break}if((_strcmp(5269852,r37)|0)==0){HEAP32[1315459]=1;r24=r36;r25=r22;break}if((_strcmp(5269744,r37)|0)==0){HEAP32[1311073]=1;r24=r36;r25=r22;break}if((_strcmp(5269628,r37)|0)==0){HEAP32[1315727]=0;r24=r36;r25=r22;break}if((_strcmp(5269464,r37)|0)==0){HEAP32[1311075]=1;r24=r36;r25=r22;break}if((_strncmp(5269308,r37,8)|0)==0){_sscanf(r37+8|0,5270440,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11,tempInt));_disable_warning(HEAP32[r11>>2]);r24=r36;r25=r22;break}if((_strcmp(5269256,r37)|0)==0){HEAP32[1311074]=1;r24=r36;r25=r22;break}if((_strncmp(5269192,r37,11)|0)==0){_sscanf(r37+11|0,5270440,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5261780,tempInt));r24=r36;r25=r22;break}if((_strcmp(5269132,r37)|0)==0){HEAP32[1311045]=1;r24=r36;r25=r22;break}if((_cpu_args(r37)|0)!=0){r24=r36;r25=r22;break}r21=HEAP32[r17>>2];if((_strcmp(r21,5264532)|0)==0){HEAP8[5263052]=1;r24=r36;r25=r22;break}if((_strcmp(r21,5264472)|0)==0){HEAP8[5264200]=1;r24=r36;r25=r22;break}if((FUNCTION_TABLE[HEAP32[1311068]](r21)|0)!=0){r24=r36;r25=r22;break}r21=HEAP32[r17>>2];if((_strncmp(5269072,r21,2)|0)==0){r24=r36;r25=0;break}_general_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r21,tempInt));r24=r36;r25=r22}else if(r14<<24>>24==0){r24=r20;r25=r22}else{if((HEAP32[1315458]|0)==0){r41=r13}else{_general_error(11,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r41=HEAP32[r18>>2]}HEAP32[1315458]=r41;r24=r20;r25=r22}}while(0);r18=r24+1|0;if((r18|0)<(r1|0)){r22=r25;r20=r18}else{r42=r25;break L114}}}else{r42=1}}while(0);r25=HEAP32[1315458];if((r25|0)==0){_general_error(15,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{HEAP32[1315726]=r25;HEAP32[1315959]=r25;_include_source(r25)}_internal_abs(5242888);HEAP32[1315447]=_new_hashtable(2048);HEAP32[1310783]=_new_hashtable(2048);r25=_new_hashtable(512);HEAP32[1315765]=r25;L236:do{if((HEAP32[1315940]|0)!=0){r1=r9|0;HEAP32[r1>>2]=0;_add_hashentry(r25,HEAP32[1315766],r9);if(HEAP32[1315940]>>>0>1){r43=1}else{break}while(1){r24=HEAP32[1315765];HEAP32[r1>>2]=r43;_add_hashentry(r24,HEAP32[(r43<<3)+5263064>>2],r9);r24=r43+1|0;if(r24>>>0<HEAP32[1315940]>>>0){r43=r24}else{break L236}}}}while(0);HEAP8[5264100]=1;HEAP32[1315460]=0;HEAP32[1316042]=0;HEAP32[1311078]=1;HEAP32[1315444]=36;HEAP8[5263848]=36;_parse();L241:do{if((HEAP32[1315728]|0)==0|HEAP8[5244084]){HEAP32[1315725]=0;if((HEAP32[1315960]|0)!=0){_puts(5243140)}r43=HEAP32[1315721];if((r43|0)==0){break}else{r44=r43}while(1){r43=(r44+24|0)>>2;r9=r44+28|0;r25=(r44+32|0)>>2;r1=r44+12|0;r24=r44+4|0;r41=0;while(1){HEAP32[1315764]=1;if((HEAP32[1315960]|0)!=0){_printf(5265716,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r24>>2],HEAP32[tempInt+4>>2]=r41,tempInt))}r36=r41+1|0;if((r36|0)>999){r4=177;break}if((r36|0)>499){do{if((HEAP32[1315960]|0)!=0){if((HEAP32[r43]&2|0)!=0){break}_puts(5243152)}}while(0);HEAP32[r43]=HEAP32[r43]|2}r37=HEAP32[r9>>2];HEAP32[r25]=r37;r11=HEAP32[r1>>2];L261:do{if((r11|0)!=0){r2=r11,r26=r2>>2;r39=r37;while(1){r38=HEAP32[r26+2];r40=r39-1+r38|0;HEAP32[r25]=r40-(r40|0)%(r38|0)|0;r38=HEAP32[r26+3];HEAP32[1315964]=r38;HEAP32[r38+332>>2]=HEAP32[r26+4];r38=HEAP32[r26+1];do{if((r38|0)==11){if((HEAP32[1310798]|0)!=0){_general_error(43,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r40=HEAP32[HEAP32[r26+6]>>2];HEAP32[1310798]=r40;HEAP32[1311071]=HEAP32[r25];HEAP32[r25]=r40}else{r40=HEAP32[1310798];if((r38|0)==12&(r40|0)!=0){HEAP32[r25]=HEAP32[1311071]-r40+HEAP32[r25]|0;HEAP32[1310798]=0;break}if((r38|0)!=1){break}r40=HEAP32[r26+6];if((HEAP32[r40+4>>2]|0)!=1){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=172,HEAP32[tempInt+8>>2]=5268220,tempInt))}r3=r40+28|0;r28=HEAP32[r3>>2];r31=HEAP32[r25];if((r28|0)==(r31|0)){break}if((HEAP32[1315960]|0)!=0){_printf(5265556,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=HEAP32[r40+12>>2],HEAP32[tempInt+4>>2]=r28,HEAP32[tempInt+8>>2]=r31,tempInt))}HEAP32[1315764]=0;HEAP32[r3>>2]=HEAP32[r25]}}while(0);r38=_atom_size(r2,r44,HEAP32[r25])+HEAP32[r25]|0;HEAP32[r25]=r38;r3=HEAP32[r26];if((r3|0)==0){break L261}else{r2=r3,r26=r2>>2;r39=r38}}}}while(0);if((HEAP32[1315764]|HEAP32[1315728]|0)==0){r41=r36}else{break}}if(r4==177){r4=0;_general_error(7,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24>>2],tempInt))}r41=HEAP32[r44>>2];if((r41|0)==0){break L241}else{r44=r41}}}}while(0);L287:do{if((HEAP32[1315728]|0)==0|HEAP8[5244084]){r44=HEAP32[1315719];L289:do{if((r44|0)!=0){r4=r44,r41=r4>>2;while(1){r25=r4+4|0;do{if((HEAP32[r25>>2]|0)==1){r1=r4+24|0;r9=HEAP32[r1>>2];if((r9|0)==0){break}if((HEAP32[r9+24>>2]&4|0)==0){break}HEAP32[r25>>2]=3;r9=HEAP32[r41+7];do{if((HEAP32[1315960]|0)==0){r43=_malloc(16);r37=r43;if((r43|0)!=0){r45=r37,r46=r45>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r45=r37,r46=r45>>2}else{r37=_malloc(24);if((r37|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r43=r37+8|0,r11=r43>>2;HEAP32[r37+4>>2]=16;HEAP32[r11]=-572662307;HEAP32[r11+1]=-572662307;HEAP32[r11+2]=-572662307;HEAP32[r11+3]=-572662307;r45=r43,r46=r45>>2}}while(0);HEAP32[r46+2]=0;HEAP32[r46+1]=0;HEAP32[r46]=21;HEAP32[r46+3]=r9;HEAP32[r41+4]=r45;HEAP32[r1>>2]=0}}while(0);r25=HEAP32[r41];if((r25|0)==0){break L289}else{r4=r25,r41=r4>>2}}}}while(0);r44=HEAP32[1315721];if((r44|0)==0){HEAP32[1315725]=1;break}else{r47=0;r48=r44}while(1){do{if((HEAP32[r48+24>>2]&4|0)==0){r49=r48;r50=r48|0}else{r44=r48|0;r4=HEAP32[r44>>2];if((r47|0)==0){HEAP32[1315721]=r4;r49=0;r50=r44;break}else{HEAP32[r47>>2]=r4;r49=r47;r50=r44;break}}}while(0);r44=HEAP32[r50>>2];if((r44|0)==0){break}else{r47=r49;r48=r44}}r44=HEAP32[1315721];HEAP32[1315725]=1;if((r44|0)==0){break}else{r51=r44,r52=r51>>2}while(1){r44=r51+28|0;r4=HEAP32[r44>>2];r41=(r51+32|0)>>2;HEAP32[r41]=r4;r24=HEAP32[r52+2];while(1){r25=HEAP8[r24];if(r25<<24>>24==0){r53=0;break}if(r25<<24>>24==117){r53=1;break}else{r24=r24+1|0}}r24=HEAP32[r52+3];L324:do{if((r24|0)!=0){r25=(r53|0)==0;r36=0;r43=0;r11=r24,r37=r11>>2;r39=r4;while(1){r2=HEAP32[r37+2];r26=r39-1+r2|0;HEAP32[r41]=r26-(r26|0)%(r2|0)|0;r2=(r11+12|0)>>2;r26=HEAP32[r2];HEAP32[1315964]=r26;r19=(r11+16|0)>>2;HEAP32[r26+332>>2]=HEAP32[r19];r26=(r11+20|0)>>2;r38=HEAP32[r26];do{if((r38|0)!=0){if((HEAP32[r38+16>>2]|0)!=(r11|0)){break}HEAP32[r38+20>>2]=r51;HEAP32[HEAP32[r26]+24>>2]=HEAP32[r41]}}while(0);r38=(r11+4|0)>>2;r1=HEAP32[r38];r9=HEAP32[1310798];r3=(r9|0)==0;do{if((r1|0)==11&r3){r31=HEAP32[HEAP32[r37+6]>>2];HEAP32[1310798]=r31;HEAP32[1311071]=HEAP32[r41];HEAP32[r41]=r31;r54=r43;r55=r36}else{if((r1|0)==12){if(r3){_general_error(44,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r54=r43;r55=r36;break}else{HEAP32[r41]=HEAP32[1311071]-r9+HEAP32[r41]|0;HEAP32[1310798]=0;r54=r43;r55=r36;break}}else if((r1|0)==3){HEAP32[1315966]=HEAP32[r26];r31=(r11+24|0)>>2;r28=_eval_instruction(HEAP32[r31],r51,HEAP32[r41]);L341:do{if((HEAP32[1311045]|0)!=0){r40=HEAP32[r28+8>>2];if((r40|0)==0){break}else{r56=r40}while(1){r40=HEAP32[r56+8>>2];if((r40|0)==11|(r40|0)==1){_general_error(34,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r40=HEAP32[r56>>2];if((r40|0)==0){break L341}else{r56=r40}}}}while(0);HEAP32[1315966]=0;do{if((HEAP32[1315960]|0)!=0){if((HEAP32[r28>>2]|0)==(_instruction_size(HEAP32[r31],0,0)|0)){break}_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=257,HEAP32[tempInt+8>>2]=5268220,tempInt))}}while(0);r40=HEAP32[r31];r32=r40;do{if((r40|0)!=0){if((HEAP32[1315960]|0)==0){_free(r32);break}else{_memset(r32,-1,HEAP32[r40-24+20>>2]);_free(r40-24+16|0);break}}}while(0);HEAP32[r31]=r28;HEAP32[r38]=2;r54=r43;r55=r36;break}else if((r1|0)==5){HEAP32[1315966]=HEAP32[r26];r40=r11+24|0;r32=r40;r33=HEAP32[r32>>2];r30=_eval_data(HEAP32[r33+4>>2],HEAP32[r33>>2],r51,HEAP32[r41]);L360:do{if((HEAP32[1311045]|0)!=0){r33=HEAP32[r30+8>>2];if((r33|0)==0){break}else{r57=r33}while(1){r33=HEAP32[r57+8>>2];if((r33|0)==11|(r33|0)==1){_general_error(34,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r33=HEAP32[r57>>2];if((r33|0)==0){break L360}else{r57=r33}}}}while(0);HEAP32[1315966]=0;r28=HEAP32[r32>>2];r31=r28;do{if((r28|0)!=0){if((HEAP32[1315960]|0)==0){_free(r31);break}else{_memset(r31,-1,HEAP32[r28-8+4>>2]);_free(r28-8|0);break}}}while(0);HEAP32[r40>>2]=r30;HEAP32[r38]=2;r54=r43;r55=r36;break}else if((r1|0)==10){r28=r11+24|0;if((_eval_expr(HEAP32[r28>>2],r6,r51,HEAP32[r41])|0)==0){_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r54=r43;r55=r36;break}r31=HEAP32[r6>>2]+HEAP32[r44>>2]-HEAP32[r41]|0;HEAP32[r6>>2]=r31;if((r31|0)<=-1){_general_error(20,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r54=r43;r55=r36;break}do{if((HEAP32[1315960]|0)==0){r32=_malloc(16);r33=r32;if((r32|0)!=0){r58=r33,r59=r58>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r58=r33,r59=r58>>2}else{r33=_malloc(24);if((r33|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r32=r33+8|0,r34=r32>>2;HEAP32[r33+4>>2]=16;HEAP32[r34]=-572662307;HEAP32[r34+1]=-572662307;HEAP32[r34+2]=-572662307;HEAP32[r34+3]=-572662307;r58=r32,r59=r58>>2}}while(0);HEAP32[r59+2]=0;HEAP32[r59+1]=0;HEAP32[r59]=21;HEAP32[r59+3]=r31;do{if((HEAP32[1315960]|0)==0){r30=_malloc(28);r40=r30;if((r30|0)!=0){r60=r40,r61=r60>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r60=r40,r61=r60>>2}else{r40=_malloc(36);if((r40|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r30=r40+8|0,r32=r30>>2;HEAP32[r40+4>>2]=28;HEAP32[r32]=-572662307;HEAP32[r32+1]=-572662307;HEAP32[r32+2]=-572662307;HEAP32[r32+3]=-572662307;HEAP32[r32+4]=-572662307;HEAP32[r32+5]=-572662307;HEAP32[r32+6]=-572662307;r60=r30,r61=r60>>2}}while(0);HEAP32[r61]=0;HEAP32[r61+1]=r58;HEAP32[r61+2]=1;_memset(r60+12|0,0,16);HEAP32[r28>>2]=r60;HEAP32[r38]=4;r54=r43;r55=r36;break}else if((r1|0)==2){if(r25){r54=r43;r55=r36;break}if((r36|0)==(HEAP32[r2]|0)){if((r43|0)==(HEAP32[r19]|0)){r54=r43;r55=r36;break}}_general_error(31,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r54=HEAP32[r19];r55=HEAP32[r2];break}else if((r1|0)==8){_puts(HEAP32[r37+6]);r54=r43;r55=r36;break}else if((r1|0)==9){_eval_expr(HEAP32[r37+6],r7,r51,HEAP32[r41]);r31=HEAP32[r7>>2];_printf(5265868,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r31,HEAP32[tempInt+4>>2]=r31,tempInt));r54=r43;r55=r36;break}else if((r1|0)==13){r31=HEAP32[r37+6]>>2;_eval_expr(HEAP32[r31],r8,r51,HEAP32[r41]);if((HEAP32[r8>>2]|0)!=0){r54=r43;r55=r36;break}r30=HEAP32[r31+2];_general_error(47,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r31+1],HEAP32[tempInt+4>>2]=(r30|0)==0?5263024:r30,tempInt));r54=r43;r55=r36;break}else{r54=r43;r55=r36;break}}}while(0);r1=_atom_size(r11,r51,HEAP32[r41])+HEAP32[r41]|0;HEAP32[r41]=r1;r2=HEAP32[r37];if((r2|0)==0){break L324}else{r36=r55;r43=r54;r11=r2,r37=r11>>2;r39=r1}}}}while(0);r41=HEAP32[r52];if((r41|0)==0){break L287}else{r51=r41,r52=r51>>2}}}}while(0);L409:do{if((r42|0)==0){r51=HEAP32[1315719];if((r51|0)==0){break}else{r62=r51,r63=r62>>2}while(1){do{if((HEAP32[r63+1]|0)==2){if((HEAP32[r63+2]&104|0)!=0){break}_general_error(22,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r63+3],tempInt))}}while(0);r51=HEAP32[r63];if((r51|0)==0){break L409}else{r62=r51,r63=r62>>2}}}}while(0);r62=HEAP32[1315449];if((r62|0)==0){HEAP32[1315449]=5268848;r64=5268848}else{r64=r62}if(HEAP8[5244084]){_write_listing(r64)}if((HEAP32[1311069]|0)==0){HEAP32[1311069]=5268796}if((HEAP32[1315728]|0)!=0){_leave();STACKTOP=r5;return 0}L430:do{if(!r23){_putchar(10);r64=HEAP32[1315721];if((r64|0)==0){break}else{r65=r64,r66=r65>>2}while(1){r64=HEAP32[r66+8];r62=HEAP32[1310727];r63=HEAP32[1310728];r42=HEAP32[r66+7];r51=_i64Subtract(r64&r62,((r64|0)<0?-1:0)&r63,r42&r62,((r42|0)<0?-1:0)&r63)&r62;r62=tempRet0&r63;r63=HEAP32[r66+2];r42=HEAP32[r66+5];_printf(5265980,(tempInt=STACKTOP,STACKTOP=STACKTOP+24|0,HEAP32[tempInt>>2]=HEAP32[r66+1],HEAP32[tempInt+4>>2]=r63,HEAP32[tempInt+8>>2]=r42,HEAP32[tempInt+12>>2]=r51,HEAP32[tempInt+16>>2]=r62,HEAP32[tempInt+20>>2]=(r51|0)==1&(r62|0)==0?32:115,tempInt));r62=HEAP32[r66];if((r62|0)==0){break L430}else{r65=r62,r66=r65>>2}}}}while(0);r65=_fopen(HEAP32[1311069],5268704);HEAP32[1311070]=r65;if((r65|0)==0){_general_error(13,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311069],tempInt));r67=HEAP32[1311070]}else{r67=r65}FUNCTION_TABLE[HEAP32[1310721]](r67,HEAP32[1315721],HEAP32[1315719]);_leave();STACKTOP=r5;return 0}function _new_abs(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r3+4;do{if((_find_name(HEAP32[1310781],r1,r5)|0)!=0){r6=HEAP32[r5>>2];if((r6|0)==0){break}r7=r6+4|0;if((HEAP32[r7>>2]-2|0)>>>0>=2){_general_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt))}HEAP32[r7>>2]=3;HEAP32[r6+24>>2]=0;HEAP32[r6+16>>2]=r2;r8=r6;STACKTOP=r3;return r8}}while(0);do{if((HEAP32[1315960]|0)==0){r5=_malloc(40);r6=r5;if((r5|0)!=0){r9=r6,r10=r9>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r6,r10=r9>>2}else{r6=_malloc(48);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r6+8|0;HEAP32[r6+4>>2]=40;_memset(r5,-35,40);r9=r5,r10=r9>>2}}while(0);r5=r9;r6=r9+12|0;HEAP32[r6>>2]=_mystrdup(r1);HEAP32[r10+1]=3;HEAP32[r10+6]=0;HEAP32[r10+4]=r2;HEAP32[r10]=HEAP32[1315719];HEAP32[1315719]=r5;HEAP32[r4>>2]=r9;_add_hashentry(HEAP32[1310781],HEAP32[r6>>2],r4);HEAP32[r10+2]=0;HEAP32[r10+5]=0;HEAP32[r10+8]=0;r8=r5;STACKTOP=r3;return r8}function _new_include_path(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;r3=STACKTOP;do{if((HEAP32[1315960]|0)==0){r4=_malloc(8);r5=r4;if((r4|0)!=0){r6=r5;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r6=r5}else{r5=_malloc(16);if((r5|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r5+8|0;HEAP32[r5+4>>2]=8;r5=r4;HEAP32[r5>>2]=-572662307;HEAP32[r5+4>>2]=-572662307;r6=r4}}while(0);r4=r6;r5=_mystrdup(r1);r1=_strlen(r5);do{if((r1|0)>0){if(HEAP8[r5+(r1-1)|0]<<24>>24==47){r2=338;break}r7=r1+2|0;do{if((HEAP32[1315960]|0)==0){r8=_malloc(r7);r9=r8;if((r8|0)!=0){r10=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9}else{r9=_malloc(r1+10|0);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r9+8|0;HEAP32[r9+4>>2]=r7;_memset(r8,-35,r7);r10=r8}}while(0);r7=r10;_strcpy(r7,r5);HEAP8[r7+r1|0]=47;HEAP8[r1+(r7+1)|0]=0;r11=r7;break}else{r2=338}}while(0);if(r2==338){r11=_mystrdup(r5)}do{if((r5|0)!=0){if((HEAP32[1315960]|0)==0){_free(r5);break}else{_memset(r5,-1,HEAP32[r5-4>>2]);_free(r5-8|0);break}}}while(0);HEAP32[r6>>2]=0;HEAP32[r6+4>>2]=r11;r11=HEAP32[1315724];if((r11|0)==0){HEAP32[1315724]=r4;STACKTOP=r3;return}else{r12=r11}while(1){r13=r12|0;r11=HEAP32[r13>>2];if((r11|0)==0){break}else{r12=r11}}HEAP32[r13>>2]=r4;STACKTOP=r3;return}function _include_source(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=STACKTOP;r4=_mystrdup(r1);r1=5262880;while(1){r5=HEAP32[r1>>2];if((r5|0)==0){r2=359;break}r6=r5+4|0;if((_strcmp(HEAP32[r6>>2],r4)|0)==0){r2=353;break}else{r1=r5|0}}do{if(r2==353){do{if((r4|0)!=0){if((HEAP32[1315960]|0)==0){_free(r4);break}else{_memset(r4,-1,HEAP32[r4-4>>2]);_free(r4-8|0);break}}}while(0);if((HEAP32[1315459]|0)==0){r7=HEAP32[r6>>2];break}else{STACKTOP=r3;return}}else if(r2==359){if((r1|0)==0){if((HEAP32[1315459]|0)==0){r7=r4;break}STACKTOP=r3;return}do{if((HEAP32[1315960]|0)==0){r5=_malloc(8);r8=r5;if((r5|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(16);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r8+8|0;HEAP32[r8+4>>2]=8;r8=r5;HEAP32[r8>>2]=-572662307;HEAP32[r8+4>>2]=-572662307;r9=r5}}while(0);HEAP32[r9>>2]=0;HEAP32[r9+4>>2]=r4;HEAP32[r1>>2]=r9;r7=r4}}while(0);r4=_locate_file(r7,5270264);if((r4|0)==0){STACKTOP=r3;return}else{r10=0;r11=0}while(1){r9=r10+65536|0;do{if((HEAP32[1315960]|0)==0){r1=_realloc(r11,r9);r2=r1;if((r1|0)!=0){r12=r2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r2}else{r2=_realloc((r11|0)==0?0:r11-8|0,r10+65544|0);if((r2|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}HEAP32[r2+4>>2]=r9;r12=r2+8|0}}while(0);r13=r12;r14=_fread(r13+r10|0,1,65536,r4);if(r14>>>0<65536){break}else{r10=r9;r11=r13}}r11=r14+r10|0;do{if((_feof(r4)|0)==0){_general_error(29,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7,tempInt))}else{if((r11|0)==0){do{if((r12|0)!=0){if((HEAP32[1315960]|0)==0){_free(r13);break}else{_memset(r13,-1,HEAP32[r12-4>>2]);_free(r12-8|0);break}}}while(0);HEAP32[1315964]=_new_source(r7,5268228,1);break}r9=r11+1|0;do{if((HEAP32[1315960]|0)==0){r10=_realloc(r13,r9);r14=r10;if((r10|0)!=0){r15=r14;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r15=r14}else{r14=_realloc((r12|0)==0?0:r12-8|0,r11+9|0);if((r14|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}HEAP32[r14+4>>2]=r9;r15=r14+8|0}}while(0);r14=_new_source(r7,r15,r9);HEAP32[1315964]=r14;HEAP8[HEAP32[r14+12>>2]+r11|0]=10}}while(0);_fclose(r4);STACKTOP=r3;return}function _internal_abs(r1){var r2,r3,r4,r5,r6,r7,r8,r9;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;do{if((_find_name(HEAP32[1310781],r1,r3)|0)!=0){r4=HEAP32[r3>>2];r5=r4;if((r4|0)==0){break}do{if((HEAP32[r4+4>>2]|0)==3){if((HEAP32[r4+8>>2]&104|0)==0){r6=r5}else{break}STACKTOP=r2;return r6}}while(0);_general_error(37,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));r6=r5;STACKTOP=r2;return r6}}while(0);do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r4=r3;if((r3|0)!=0){r7=r4,r8=r7>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r4,r8=r7>>2}else{r4=_malloc(24);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r9=r3>>2;HEAP32[r4+4>>2]=16;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;r7=r3,r8=r7>>2}}while(0);HEAP32[r8+2]=0;HEAP32[r8+1]=0;HEAP32[r8]=21;HEAP32[r8+3]=0;r8=_new_abs(r1,r7);r7=r8+8|0;HEAP32[r7>>2]=HEAP32[r7>>2]|128;r6=r8;STACKTOP=r2;return r6}function _write_listing(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=_fopen(r1,5267288);if((r4|0)==0){_general_error(13,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}r1=HEAP32[1315721];L581:do{if((r1|0)!=0){r5=1;r6=r1;while(1){HEAP32[r6+36>>2]=r5;r7=HEAP32[r6>>2];if((r7|0)==0){break L581}else{r5=r5+1|0;r6=r7}}}}while(0);r1=HEAP32[1315723];L585:do{if((r1|0)==0){r8=0}else{r6=r3|0;r5=0;r7=r1,r9=r7>>2;while(1){r10=HEAP32[r9+3];if((r10|0)==0){HEAP8[r6]=HEAP8[5267204];HEAP8[r6+1|0]=HEAP8[5267205|0];HEAP8[r6+2|0]=HEAP8[5267206|0];HEAP8[r6+3|0]=HEAP8[5267207|0];HEAP8[r6+4|0]=HEAP8[5267208|0];HEAP8[r6+5|0]=HEAP8[5267209|0]}else{_sprintf(r6,5267248,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r10,tempInt))}r10=HEAP32[r9+1];if((r10|0)==0){r11=0;r12=r5}else{r13=HEAP32[r10+324>>2];r11=r13;r12=r13>>>0>r5>>>0?r13:r5}r13=HEAP32[r9+2];_fprintf(r4,5267136,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=r11,HEAP32[tempInt+4>>2]=r13,HEAP32[tempInt+8>>2]=r6,HEAP32[tempInt+12>>2]=r7+28|0,tempInt));r13=HEAP32[r9+4];L596:do{if((r13|0)!=0){r10=r7+20|0;r14=r13,r15=r14>>2;r16=HEAP32[r9+6];while(1){do{if((HEAP32[r15+1]|0)==2){r17=(r14+24|0)>>2;r18=HEAP32[r17];r19=HEAP32[r18>>2];if((r19|0)>0){r20=-r19|0;r19=r20>>>0>4294967264?r20:-32;r20=-r19|0;r21=r16;r22=0;while(1){if((r22&15|0)==0){r23=HEAP32[r10>>2];if((r23|0)==0){r24=0}else{r24=HEAP32[r23+36>>2]}_fprintf(r4,5267060,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r24,HEAP32[tempInt+4>>2]=r21,tempInt))}_fprintf(r4,5266984,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[HEAP32[HEAP32[r17]+4>>2]+r22|0],tempInt));r23=r22+1|0;if((r23|0)==(r20|0)){break}else{r21=r21+1|0;r22=r23}}r25=r16-r19|0;r26=HEAP32[r17]}else{r25=r16;r26=r18}if((HEAP32[r26+8>>2]|0)==0){r27=r25;break}_fwrite(5266960,4,1,r4);r27=r25}else{r27=r16}}while(0);r22=HEAP32[r15],r21=r22>>2;if((r22|0)==0){break L596}if((HEAP32[r21+4]|0)!=(HEAP32[r15+4]|0)){break L596}if((HEAP32[r21+3]|0)!=(HEAP32[r15+3]|0)){break L596}r20=HEAP32[r21+2];r21=r27-1+r20|0;if((r22|0)==0){break L596}else{r14=r22,r15=r14>>2;r16=r21-(r21|0)%(r20|0)|0}}}}while(0);_fputc(10,r4);r13=HEAP32[r9];if((r13|0)==0){r8=r12;break L585}else{r5=r12;r7=r13,r9=r7>>2}}}}while(0);_fwrite(5266884,12,1,r4);r12=HEAP32[1315721];L621:do{if((r12|0)!=0){r27=r12,r25=r27>>2;while(1){r26=HEAP32[r25+1];_fprintf(r4,5266820,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r25+9],HEAP32[tempInt+4>>2]=r26,tempInt));r26=HEAP32[r25];if((r26|0)==0){break L621}else{r27=r26,r25=r27>>2}}}}while(0);_fwrite(5266764,11,1,r4);L625:do{if((r8|0)>=0){r12=r8+1|0;r27=0;while(1){r25=HEAP32[1315723];L629:do{if((r25|0)!=0){r26=r25;while(1){r28=HEAP32[r26+4>>2];if((r28|0)!=0){if((HEAP32[r28+324>>2]|0)==(r27|0)){break}}r24=HEAP32[r26>>2];if((r24|0)==0){break L629}else{r26=r24}}r26=HEAP32[r28+8>>2];_fprintf(r4,5266716,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r27,HEAP32[tempInt+4>>2]=r26,tempInt))}}while(0);r25=r27+1|0;if((r25|0)==(r12|0)){break L625}else{r27=r25}}}}while(0);_fwrite(5266640,11,1,r4);r28=HEAP32[1315719];L638:do{if((r28|0)!=0){r8=r28;while(1){_print_symbol(r4,r8);_fputc(10,r4);r27=HEAP32[r8>>2];if((r27|0)==0){break L638}else{r8=r27}}}}while(0);r28=HEAP32[1315728];if((r28|0)==0){_fwrite(5266576,28,1,r4)}else{_fprintf(r4,5266500,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r28,tempInt))}_fclose(r4);r4=HEAP32[1315723];if((r4|0)==0){STACKTOP=r2;return}else{r29=r4}while(1){r4=HEAP32[r29>>2];r28=r29;if((HEAP32[1315960]|0)==0){_free(r28)}else{_memset(r28,-1,HEAP32[r29-148+144>>2]);_free(r29-148+140|0)}if((r4|0)==0){break}else{r29=r4}}STACKTOP=r2;return}function _locate_file(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1024|0;r5=r4;r6=HEAP8[r1];L656:do{if(r6<<24>>24==46|r6<<24>>24==47|r6<<24>>24==92){r3=470}else{if((_strchr(r1,58)|0)!=0){r3=470;break}r7=HEAP32[1315724];if((r7|0)==0){break}r8=r5|0;r9=r7;while(1){r7=HEAP32[r9+4>>2];if((_strlen(r7)+_strlen(r1)+1|0)>>>0<1025){_strcpy(r8,r7);_strcat(r8,r1);r7=_fopen(r8,r2);if((r7|0)!=0){r10=r7;break}}r7=HEAP32[r9>>2];if((r7|0)==0){break L656}else{r9=r7}}STACKTOP=r4;return r10}}while(0);do{if(r3==470){r5=_fopen(r1,r2);if((r5|0)==0){break}else{r10=r5}STACKTOP=r4;return r10}}while(0);_general_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));r10=0;STACKTOP=r4;return r10}function _new_source(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;do{if((HEAP32[1315960]|0)==0){r5=_malloc(340);r6=r5;if((r5|0)!=0){r7=r6,r8=r7>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r6,r8=r7>>2}else{r6=_malloc(348);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r6+8|0;HEAP32[r6+4>>2]=340;_memset(r5,-35,340);r7=r5,r8=r7>>2}}while(0);r5=r7;HEAP32[r8]=HEAP32[1315964];r6=HEAP32[1315964];if((r6|0)==0){r9=0}else{r9=HEAP32[r6+332>>2]}HEAP32[r8+1]=r9;HEAP32[r8+2]=_mystrdup(r1);r1=r2;HEAP32[r8+3]=r1;HEAP32[r8+4]=r3;HEAP32[r8+5]=1;HEAP32[r8+7]=-1;HEAP32[r8+8]=5263024;HEAP32[r8+44]=0;r3=HEAP32[1311077];HEAP32[1311077]=r3+1|0;HEAP32[r8+81]=r3;HEAP32[r8+82]=r1;HEAP32[r8+83]=0;if((HEAP32[1315960]|0)==0){r8=_malloc(4096);r1=r8;if((r8|0)!=0){r10=r1;r11=r7+336|0,r12=r11>>2;r13=r10;HEAP32[r12]=r13;STACKTOP=r4;return r5}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r1;r11=r7+336|0,r12=r11>>2;r13=r10;HEAP32[r12]=r13;STACKTOP=r4;return r5}else{r1=_malloc(4104);if((r1|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r1+8|0;HEAP32[r1+4>>2]=4096;_memset(r8,-35,4096);r10=r8;r11=r7+336|0,r12=r11>>2;r13=r10;HEAP32[r12]=r13;STACKTOP=r4;return r5}}function _new_section(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;r5=(HEAP32[1310724]|0)==0?r1:5263024;r1=HEAP32[1315721];r6=(r1|0)==0;L695:do{if((HEAP32[1310796]|0)==0){if(r6){break}else{r7=r1}while(1){if((_strcmp(r5,HEAP32[r7+4>>2])|0)==0){r8=r7;break}r9=HEAP32[r7>>2];if((r9|0)==0){break L695}else{r7=r9}}STACKTOP=r4;return r8}else{if(r6){break}else{r10=r1,r11=r10>>2}while(1){if((_strcmp(r5,HEAP32[r11+1])|0)==0){if((_strcmp(r2,HEAP32[r11+2])|0)==0){break}}r9=HEAP32[r11];if((r9|0)==0){break L695}else{r10=r9,r11=r10>>2}}if((r10|0)==0){break}else{r8=r10}STACKTOP=r4;return r8}}while(0);do{if((HEAP32[1315960]|0)==0){r10=_malloc(40);r11=r10;if((r10|0)!=0){r12=r11,r13=r12>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r11,r13=r12>>2}else{r11=_malloc(48);if((r11|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=r11+8|0;HEAP32[r11+4>>2]=40;_memset(r10,-35,40);r12=r10,r13=r12>>2}}while(0);r10=r12;HEAP32[r13]=0;HEAP32[r13+1]=_mystrdup(r5);HEAP32[r13+2]=_mystrdup(r2);HEAP32[r13+4]=0;HEAP32[r13+3]=0;HEAP32[r13+5]=r3;HEAP32[r13+8]=0;HEAP32[r13+7]=0;HEAP32[r13+6]=0;r13=HEAP32[1315453];if((r13|0)==0){HEAP32[1315453]=r10;HEAP32[1315721]=r10;r8=r10;STACKTOP=r4;return r8}else{HEAP32[r13>>2]=r10;HEAP32[1315453]=r10;r8=r10;STACKTOP=r4;return r8}}function _switch_section(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;r5=(HEAP32[1310724]|0)==0?r1:5263024;r1=HEAP32[1315721];r6=(r1|0)==0;L724:do{if((HEAP32[1310796]|0)==0){if(r6){r3=529;break}else{r7=r1}while(1){if((_strcmp(r5,HEAP32[r7+4>>2])|0)==0){r8=r7;r3=530;break L724}r9=HEAP32[r7>>2];if((r9|0)==0){r3=529;break L724}else{r7=r9}}}else{if(r6){r3=529;break}else{r10=r1,r11=r10>>2}while(1){if((_strcmp(r5,HEAP32[r11+1])|0)==0){if((_strcmp(r2,HEAP32[r11+2])|0)==0){break}}r9=HEAP32[r11];if((r9|0)==0){r3=529;break L724}else{r10=r9,r11=r10>>2}}if((r10|0)==0){r3=529;break}else{r8=r10;r3=530;break}}}while(0);if(r3==529){_general_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r5,tempInt));STACKTOP=r4;return}else if(r3==530){HEAP32[1315961]=r8;STACKTOP=r4;return}}function _make_local_label(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r5=STACKTOP;if((r2|0)==0){r6=HEAP32[1315455];r7=r6;r8=_strlen(r6)}else{r7=r1;r8=r2}r2=r8+r4|0;r1=r2+3|0;do{if((HEAP32[1315960]|0)==0){r6=_malloc(r1);r9=r6;if((r6|0)!=0){r10=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9}else{r9=_malloc(r2+11|0);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r6=r9+8|0;HEAP32[r9+4>>2]=r1;_memset(r6,-35,r1);r10=r6}}while(0);r1=r10;r10=r1+1|0;HEAP8[r1]=32;if((r8|0)==0){r11=r10;r12=r11+1|0;HEAP8[r11]=32;_memcpy(r12,r3,r4);r13=r4+1|0;r14=r11+r13|0;HEAP8[r14]=0;STACKTOP=r5;return r1}_memcpy(r10,r7,r8);r11=r8+(r1+1)|0;r12=r11+1|0;HEAP8[r11]=32;_memcpy(r12,r3,r4);r13=r4+1|0;r14=r11+r13|0;HEAP8[r14]=0;STACKTOP=r5;return r1}function _new_import(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r2+4;do{if((_find_name(HEAP32[1310781],r1,r4)|0)!=0){r5=HEAP32[r4>>2];if((r5|0)==0){break}else{r6=r5}STACKTOP=r2;return r6}}while(0);do{if((HEAP32[1315960]|0)==0){r4=_malloc(40);r5=r4;if((r4|0)!=0){r7=r5,r8=r7>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r5,r8=r7>>2}else{r5=_malloc(48);if((r5|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r5+8|0;HEAP32[r5+4>>2]=40;_memset(r4,-35,40);r7=r4,r8=r7>>2}}while(0);r4=r7;HEAP32[r8+1]=2;HEAP32[r8+2]=0;r5=r7+12|0;HEAP32[r5>>2]=_mystrdup(r1);r1=(r7+20|0)>>2;HEAP32[r1]=0;HEAP32[r1+1]=0;HEAP32[r1+2]=0;HEAP32[r1+3]=0;HEAP32[r8]=HEAP32[1315719];HEAP32[1315719]=r4;HEAP32[r3>>2]=r7;_add_hashentry(HEAP32[1310781],HEAP32[r5>>2],r3);r6=r4;STACKTOP=r2;return r6}function _new_labsym(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r4+4;do{if((r1|0)==0){r7=HEAP32[1315961];r8=HEAP32[1315958];r9=HEAP32[1315957];if((r7|0)==0&(r8|0)!=0&(r9|0)!=0){r10=_new_section(r8,r9,1);_switch_section(HEAP32[1315958],HEAP32[1315957]);r11=r10}else{r11=r7}if((r11|0)!=0){r12=r11;break}_general_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r13=_new_import(r2);STACKTOP=r4;return r13}else{r12=r1}}while(0);r1=(r12+24|0)>>2;r11=HEAP32[r1];HEAP32[r1]=r11|1;if((r11&8|0)==0){r14=r2}else{r11=HEAP32[r12+4>>2];r14=_make_local_label(r11,_strlen(r11),r2,_strlen(r2))}do{if((_find_name(HEAP32[1310781],r14,r6)|0)==0){r3=576}else{r2=HEAP32[r6>>2];if((r2|0)==0){r3=576;break}if((HEAP32[r2+4>>2]|0)==2){r15=0;r16=r2,r17=r16>>2;break}do{if((HEAP32[1315960]|0)==0){r11=_malloc(40);r7=r11;if((r11|0)!=0){r18=r7;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r18=r7}else{r7=_malloc(48);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r11=r7+8|0;HEAP32[r7+4>>2]=40;_memset(r11,-35,40);r18=r11}}while(0);_memcpy(r18,r2,40);_general_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r14,tempInt));r15=0;r16=r18,r17=r16>>2;break}}while(0);do{if(r3==576){do{if((HEAP32[1315960]|0)==0){r18=_malloc(40);r6=r18;if((r18|0)!=0){r19=r6;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r19=r6}else{r6=_malloc(48);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r18=r6+8|0;HEAP32[r6+4>>2]=40;_memset(r18,-35,40);r19=r18}}while(0);r2=r19;if((HEAP32[r1]&8|0)==0){HEAP32[r19+12>>2]=_mystrdup(r14);r15=1;r16=r2,r17=r16>>2;break}else{HEAP32[r19+12>>2]=r14;r15=1;r16=r2,r17=r16>>2;break}}}while(0);HEAP32[r17+1]=1;HEAP32[r17+6]=r12;HEAP32[r17+7]=HEAP32[r12+32>>2];if(r15){HEAP32[r17]=HEAP32[1315719];HEAP32[1315719]=r16;HEAP32[r5>>2]=r16;_add_hashentry(HEAP32[1310781],HEAP32[r17+3],r5);HEAP32[r17+2]=0;HEAP32[r17+5]=0;HEAP32[r17+8]=0}if(HEAP8[r14]<<24>>24==32){r13=r16;STACKTOP=r4;return r13}HEAP32[1315455]=HEAP32[r17+3];r13=r16;STACKTOP=r4;return r13}function _new_inst(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r6=0;r7=STACKTOP;STACKTOP=STACKTOP+44|0;r8=r7;r9=r7+40;do{if((HEAP32[1315960]|0)==0){r10=_malloc(24);r11=r10;if((r10|0)!=0){r12=r11,r13=r12>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r11,r13=r12>>2}else{r11=_malloc(32);if((r11|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=r11+8|0,r14=r10>>2;HEAP32[r11+4>>2]=24;HEAP32[r14]=-572662307;HEAP32[r14+1]=-572662307;HEAP32[r14+2]=-572662307;HEAP32[r14+3]=-572662307;HEAP32[r14+4]=-572662307;HEAP32[r14+5]=-572662307;r12=r10,r13=r12>>2}}while(0);r10=r12;r14=r12;HEAP32[r13+3]=HEAP8[5264204]&1;HEAP32[r13+4]=HEAP8[5261824]&1;HEAP32[r13+5]=HEAP8[5261828]&1;do{if((_find_namelen_nc(HEAP32[1315443],r1,r2,r9)|0)==0){r11=r2+1|0;do{if((HEAP32[1315960]|0)==0){r15=_malloc(r11);r16=r15;if((r15|0)!=0){r17=r16;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r16}else{r16=_malloc(r2+9|0);if((r16|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r15=r16+8|0;HEAP32[r16+4>>2]=r11;_memset(r15,-35,r11);r17=r15}}while(0);r11=r17;_memcpy(r11,r1,r2);HEAP8[r11+r2|0]=0;_general_error(1,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r17,tempInt))}else{r11=(r3|0)>0;r15=(r2|0)==0;r16=r2-1|0;r18=(r16|0)==0;r19=HEAP32[r9>>2];L827:while(1){r20=0;while(1){if((r20|0)>=2){break}if((HEAP32[(r19*44&-1)+(r20<<2)+5244348>>2]|0)==0){break}else{r20=r20+1|0}}r21=(r20|0)>0;L833:do{if(r21&r11){r22=0;r23=0;r24=0;while(1){r25=_parse_operand(HEAP32[r4+(r22<<2)>>2],HEAP32[r5+(r22<<2)>>2],r8+(r24*20&-1)|0,HEAP32[(r19*44&-1)+(r24<<2)+5244348>>2]);if((r25|0)==0){break L833}else if((r25|0)==-1){r6=606;break L827}r26=r22+1|0;if((r25|0)==2){r27=r24+1|0;r28=r23+1|0}else{r27=r24;r28=r23}r25=r27+1|0;r29=(r25|0)<(r20|0);r30=(r26|0)<(r3|0);if(r29&r30){r22=r26;r23=r28;r24=r25}else{r31=r28;r32=r29;r33=r30;r6=613;break L833}}}else{r31=0;r32=r21;r33=r11;r6=613}}while(0);if(r6==613){r6=0;if(!(r32|r33)){r6=615;break}}r21=r19+1|0;if((r21|0)>=(HEAP32[1315442]|0)){r6=634;break}r24=(r21*44&-1)+5244344|0;r23=HEAP32[r24>>2];L844:do{if(!r15){r22=HEAP8[r23];L846:do{if(r18){r34=r22;r35=r1}else{r30=r23;r29=r1;r25=r16;r26=r22;while(1){r36=(_tolower(r26&255)|0)==(_tolower(HEAPU8[r29])|0);r37=HEAP8[r30];if(!r36){r34=r37;r35=r29;break L846}if(r37<<24>>24==0){break L844}r37=r30+1|0;r36=r29+1|0;r38=r25-1|0;r39=HEAP8[r37];if((r38|0)==0){r34=r39;r35=r36;break L846}else{r30=r37;r29=r36;r25=r38;r26=r39}}}}while(0);if((_tolower(r34&255)|0)!=(_tolower(HEAPU8[r35])|0)){r6=634;break L827}}}while(0);if(HEAP8[HEAP32[r24>>2]+r2|0]<<24>>24==0){r19=r21}else{r6=634;break}}if(r6==615){do{if((r20-r31|0)>0){r16=r12+4|0;r18=r20-r31|0;r15=0;while(1){do{if((HEAP32[1315960]|0)==0){r11=_malloc(20);r23=r11;if((r11|0)!=0){r40=r23;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r40=r23}else{r23=_malloc(28);if((r23|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r11=r23+8|0,r22=r11>>2;HEAP32[r23+4>>2]=20;HEAP32[r22]=-572662307;HEAP32[r22+1]=-572662307;HEAP32[r22+2]=-572662307;HEAP32[r22+3]=-572662307;HEAP32[r22+4]=-572662307;r40=r11}}while(0);r11=r40>>2;HEAP32[r16+(r15<<2)>>2]=r40;r22=(r8+(r15*20&-1)|0)>>2;HEAP32[r11]=HEAP32[r22];HEAP32[r11+1]=HEAP32[r22+1];HEAP32[r11+2]=HEAP32[r22+2];HEAP32[r11+3]=HEAP32[r22+3];HEAP32[r11+4]=HEAP32[r22+4];r22=r15+1|0;if((r22|0)==(r18|0)){break}else{r15=r22}}if((r18|0)<2){r41=r18;r6=618;break}else{break}}else{r41=0;r6=618}}while(0);if(r6==618){_memset((r41+1<<2)+r12|0,0,8-(r41<<2)|0)}HEAP32[r13]=r19;r42=r14;STACKTOP=r7;return r42}else if(r6==606){if((r12|0)==0){r42=0;STACKTOP=r7;return r42}if((HEAP32[1315960]|0)==0){_free(r10);r42=0;STACKTOP=r7;return r42}else{_memset(r10,-1,HEAP32[r12-4>>2]);_free(r12-8|0);r42=0;STACKTOP=r7;return r42}}else if(r6==634){_general_error(0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}}}while(0);if((r12|0)==0){r42=0;STACKTOP=r7;return r42}if((HEAP32[1315960]|0)==0){_free(r10);r42=0;STACKTOP=r7;return r42}else{_memset(r10,-1,HEAP32[r12-4>>2]);_free(r12-8|0);r42=0;STACKTOP=r7;return r42}}function _add_atom(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=r2>>2;r4=STACKTOP;do{if((r1|0)==0){r5=HEAP32[1315961];r6=HEAP32[1315958];r7=HEAP32[1315957];if((r5|0)==0&(r6|0)!=0&(r7|0)!=0){r8=_new_section(r6,r7,1);_switch_section(HEAP32[1315958],HEAP32[1315957]);r9=r8}else{r9=r5}if((r9|0)!=0){r10=r9;break}_general_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}else{r10=r1}}while(0);HEAP32[r3+3]=HEAP32[1315964];r1=r2+16|0;HEAP32[r1>>2]=HEAP32[HEAP32[1315964]+332>>2];r9=r10+16|0;r5=HEAP32[r9>>2],r8=r5>>2;do{if((r5|0)==0){HEAP32[r10+12>>2]=r2}else{HEAP32[r8]=r2;if((HEAP32[r8+1]|0)!=1){break}if((HEAP32[r8+4]|0)!=(HEAP32[r1>>2]|0)){break}if((HEAP32[r3+1]-3|0)>>>0>=3){break}HEAP32[r8+2]=HEAP32[r3+2]}}while(0);HEAP32[r3]=0;HEAP32[r9>>2]=r2;r9=(r10+32|0)>>2;r8=r2+8|0;r1=HEAP32[r8>>2];r5=HEAP32[r9]-1+r1|0;r7=r5-(r5|0)%(r1|0)|0;HEAP32[r9]=r7;HEAP32[r9]=_atom_size(r2,r10,r7)+HEAP32[r9]|0;r9=HEAP32[r8>>2];r8=r10+20|0;if((r9|0)>(HEAP32[r8>>2]|0)){HEAP32[r8>>2]=r9}if((HEAP32[1315452]|0)==0){HEAP32[r3+5]=0;STACKTOP=r4;return}HEAP32[r3+5]=HEAP32[1315454];r3=HEAP32[1315454];if((r3|0)==0){STACKTOP=r4;return}r9=r3+16|0;if((HEAP32[r9>>2]|0)!=0){STACKTOP=r4;return}HEAP32[r9>>2]=r2;STACKTOP=r4;return}function _atom_size(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r4=r1>>2;r1=STACKTOP;STACKTOP=STACKTOP+16|0;r5=r1;r6=r1+4,r7=r6>>2;r8=r1+8,r9=r8>>2;r10=r1+12;r11=HEAP32[r4+1];if((r11|0)==1|(r11|0)==6|(r11|0)==7|(r11|0)==8|(r11|0)==9|(r11|0)==11|(r11|0)==12|(r11|0)==13){r12=0;STACKTOP=r1;return r12}else if((r11|0)==10){_eval_expr(HEAP32[r4+6],r5,r2,r3);r13=HEAP32[r2+28>>2]-r3+HEAP32[r5>>2]|0;HEAP32[r5>>2]=r13;r12=(r13|0)>0?r13:0;STACKTOP=r1;return r12}else if((r11|0)==2){r12=HEAP32[HEAP32[r4+6]>>2];STACKTOP=r1;return r12}else if((r11|0)==4){r13=HEAP32[r4+6],r5=r13>>2;HEAP32[r7]=0;if((_eval_expr(HEAP32[r5+1],r6,r2,r3)|0)==0&(HEAP32[1315725]|0)!=0){_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{HEAP32[r5]=HEAP32[r7]}L944:do{if((HEAP32[1315725]|0)!=0){r6=(r13+20|0)>>2;if((HEAP32[r6]|0)==0){break}r14=(r13+8|0)>>2;if(HEAP32[r14]>>>0>=5){_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}HEAP32[r9]=0;do{if((_eval_expr(HEAP32[r6],r10,r2,r3)|0)==0){if((_find_base(HEAP32[r6],r8,r2,r3)|0)!=0){break}_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r6=HEAP32[r10>>2];r15=HEAP32[r14];if(r15>>>0>4){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=207,HEAP32[tempInt+8>>2]=5268944,tempInt))}L957:do{if((r15|0)>0){r16=r6;r17=0;while(1){HEAP8[r13+(r17+12)|0]=r16&255;r18=r17+1|0;if((r18|0)==(r15|0)){break L957}else{r16=r16>>8;r17=r18}}}}while(0);r15=HEAP32[r9];if((r15|0)==0){break}r17=(r13+24|0)>>2;if((HEAP32[r17]|0)!=0){break}r16=HEAP32[r7];if((r16|0)>0){r19=0;r20=r15}else{break}while(1){r15=HEAP32[r14];r18=r15<<3;r21=Math.imul(r19<<3,r15);do{if((HEAP32[1315960]|0)==0){r15=_malloc(20);r22=r15;if((r15|0)!=0){r23=r22,r24=r23>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r23=r22,r24=r23>>2}else{r22=_malloc(28);if((r22|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r15=r22+8|0,r25=r15>>2;HEAP32[r22+4>>2]=20;HEAP32[r25]=-572662307;HEAP32[r25+1]=-572662307;HEAP32[r25+2]=-572662307;HEAP32[r25+3]=-572662307;HEAP32[r25+4]=-572662307;r23=r15,r24=r23>>2}}while(0);HEAP32[r24+2]=-1;HEAP32[r24]=0;r15=r23+4|0;HEAP32[r15>>2]=0;r25=r23+12|0;HEAP32[r25>>2]=0;do{if((HEAP32[1315960]|0)==0){r22=_malloc(12);r26=r22;if((r22|0)!=0){r27=r26,r28=r27>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r27=r26,r28=r27>>2}else{r26=_malloc(20);if((r26|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r22=r26+8|0,r29=r22>>2;HEAP32[r26+4>>2]=12;HEAP32[r29]=-572662307;HEAP32[r29+1]=-572662307;HEAP32[r29+2]=-572662307;r27=r22,r28=r27>>2}}while(0);HEAP32[r15>>2]=r18;HEAP32[r24]=r21;HEAP32[r24+4]=r20;HEAP32[r25>>2]=r6;HEAP32[r28+2]=1;HEAP32[r28+1]=r23;HEAP32[r28]=HEAP32[r17];HEAP32[r17]=r27;r22=r19+1|0;if((r22|0)>=(r16|0)){break L944}r19=r22;r20=HEAP32[r9]}}}while(0);r12=Math.imul(HEAP32[r5+2],HEAP32[r7]);STACKTOP=r1;return r12}else if((r11|0)==5){r12=(HEAP32[HEAP32[r4+6]>>2]+7|0)/8&-1;STACKTOP=r1;return r12}else if((r11|0)==3){r12=_instruction_size(HEAP32[r4+6],0,0);STACKTOP=r1;return r12}else{_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=269,HEAP32[tempInt+8>>2]=5264788,tempInt));r12=0;STACKTOP=r1;return r12}}function _print_atom(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=r2>>2;r4=STACKTOP;r5=HEAP32[r3+1];if((r5|0)==2){r6=(r2+24|0)>>2;_fprintf(r1,5268868,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[HEAP32[r6]>>2],tempInt));r7=HEAP32[r6];L991:do{if((HEAP32[r7>>2]|0)==0){r8=r7}else{r9=0;r10=r7;while(1){_fprintf(r1,5268240,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAPU8[HEAP32[r10+4>>2]+r9|0],tempInt));r11=r9+1|0;r12=HEAP32[r6];if(r11>>>0<HEAP32[r12>>2]>>>0){r9=r11;r10=r12}else{r8=r12;break L991}}}}while(0);r6=HEAP32[r8+8>>2];if((r6|0)==0){STACKTOP=r4;return}else{r13=r6,r14=r13>>2}while(1){r6=HEAP32[r14+2];r8=HEAP32[r14+1]>>2;if((r6|0)<17){r7=HEAP32[r8];r10=HEAP32[r8+1];r9=HEAP32[r8+2];r12=HEAP32[1310727];r11=HEAP32[1310728];r15=HEAP32[r8+3];_fprintf(r1,5269920,(tempInt=STACKTOP,STACKTOP=STACKTOP+28|0,HEAP32[tempInt>>2]=HEAP32[(r6<<2)+5244112>>2],HEAP32[tempInt+4>>2]=r7,HEAP32[tempInt+8>>2]=r10,HEAP32[tempInt+12>>2]=r9&r12,HEAP32[tempInt+16>>2]=((r9|0)<0?-1:0)&r11,HEAP32[tempInt+20>>2]=r15&r12,HEAP32[tempInt+24>>2]=((r15|0)<0?-1:0)&r11,tempInt))}else{_fwrite(5269792,14,1,r1)}_print_symbol(r1,HEAP32[r8+4]);_fwrite(5269696,2,1,r1);r8=HEAP32[r14];if((r8|0)==0){break}else{r13=r8,r14=r13>>2}}STACKTOP=r4;return}else if((r5|0)==3){r13=HEAP32[r3+6]>>2;r14=HEAP32[r13];r8=HEAP32[(r14*44&-1)+5244344>>2];_printf(5270332,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r14,HEAP32[tempInt+4>>2]=r8,tempInt));_printf(5270096,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r13+1],tempInt));_printf(5270096,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r13+2],tempInt));STACKTOP=r4;return}else if((r5|0)==4){r13=(r2+24|0)>>2;r2=HEAP32[r13];r8=Math.imul(HEAP32[r2+8>>2],HEAP32[r2>>2]);_fprintf(r1,5267588,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r8,tempInt));r8=HEAP32[r13];r2=HEAP32[r8+8>>2];L1007:do{if((r2|0)==0){r16=r8}else{r14=0;r11=r8;r15=r2;while(1){_fprintf(r1,5267e3,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAPU8[r11+(r14+12)|0],HEAP32[tempInt+4>>2]=(r14|0)==(r15-1|0)?41:32,tempInt));r12=r14+1|0;r9=HEAP32[r13];r10=HEAP32[r9+8>>2];if(r12>>>0<r10>>>0){r14=r12;r11=r9;r15=r10}else{r16=r9;break L1007}}}}while(0);r13=HEAP32[r16+24>>2];if((r13|0)==0){STACKTOP=r4;return}else{r17=r13,r18=r17>>2}while(1){r13=HEAP32[r18+2];r16=HEAP32[r18+1]>>2;if((r13|0)<17){r2=HEAP32[r16];r8=HEAP32[r16+1];r15=HEAP32[r16+2];r11=HEAP32[1310727];r14=HEAP32[1310728];r9=HEAP32[r16+3];_fprintf(r1,5269920,(tempInt=STACKTOP,STACKTOP=STACKTOP+28|0,HEAP32[tempInt>>2]=HEAP32[(r13<<2)+5244112>>2],HEAP32[tempInt+4>>2]=r2,HEAP32[tempInt+8>>2]=r8,HEAP32[tempInt+12>>2]=r15&r11,HEAP32[tempInt+16>>2]=((r15|0)<0?-1:0)&r14,HEAP32[tempInt+20>>2]=r9&r11,HEAP32[tempInt+24>>2]=((r9|0)<0?-1:0)&r14,tempInt))}else{_fwrite(5269792,14,1,r1)}_print_symbol(r1,HEAP32[r16+4]);_fwrite(5269696,2,1,r1);r16=HEAP32[r18];if((r16|0)==0){break}else{r17=r16,r18=r17>>2}}STACKTOP=r4;return}else if((r5|0)==5){_fprintf(r1,5266376,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[HEAP32[r3+6]>>2],tempInt));STACKTOP=r4;return}else if((r5|0)==6){r17=HEAP32[1315959];_fprintf(r1,5265648,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r3+6],HEAP32[tempInt+4>>2]=r17,tempInt));STACKTOP=r4;return}else if((r5|0)==12){_fwrite(5270776,8,1,r1);STACKTOP=r4;return}else if((r5|0)==1){_fwrite(5269708,8,1,r1);_print_symbol(r1,HEAP32[r3+6]);STACKTOP=r4;return}else if((r5|0)==9){_fwrite(5264780,6,1,r1);r17=HEAP32[r3+6];_simplify_expr(r17);if((HEAP32[r17>>2]|0)==21){_fprintf(r1,5269416,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r17+12>>2],tempInt));STACKTOP=r4;return}else{_fwrite(5268752,18,1,r1);STACKTOP=r4;return}}else if((r5|0)==11){r17=HEAP32[HEAP32[r3+6]>>2];r18=((r17|0)<0?-1:0)&HEAP32[1310728];_fprintf(r1,5271048,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r17&HEAP32[1310727],HEAP32[tempInt+4>>2]=r18,tempInt));STACKTOP=r4;return}else if((r5|0)==13){r18=HEAP32[r3+6];r17=HEAP32[r18+8>>2];_fprintf(r1,5270552,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r18+4>>2],HEAP32[tempInt+4>>2]=(r17|0)==0?5263024:r17,tempInt));STACKTOP=r4;return}else if((r5|0)==10){_fwrite(5271516,14,1,r1);r17=HEAP32[r3+6];_simplify_expr(r17);if((HEAP32[r17>>2]|0)==21){_fprintf(r1,5269416,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r17+12>>2],tempInt));STACKTOP=r4;return}else{_fwrite(5268752,18,1,r1);STACKTOP=r4;return}}else if((r5|0)==8){_fprintf(r1,5264852,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r3+6],tempInt));STACKTOP=r4;return}else{_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=350,HEAP32[tempInt+8>>2]=5264788,tempInt));STACKTOP=r4;return}}function _clone_atom(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(28);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(36);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=28;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;HEAP32[r7+4]=-572662307;HEAP32[r7+5]=-572662307;HEAP32[r7+6]=-572662307;r5=r3,r6=r5>>2}}while(0);r3=r5>>2;r7=r5;r4=r1>>2;HEAP32[r3]=HEAP32[r4];HEAP32[r3+1]=HEAP32[r4+1];HEAP32[r3+2]=HEAP32[r4+2];HEAP32[r3+3]=HEAP32[r4+3];HEAP32[r3+4]=HEAP32[r4+4];HEAP32[r3+5]=HEAP32[r4+5];HEAP32[r3+6]=HEAP32[r4+6];r4=HEAP32[r1+4>>2];if((r4|0)==3){do{if((HEAP32[1315960]|0)==0){r3=_malloc(24);r8=r3;if((r3|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(32);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r8+8|0,r10=r3>>2;HEAP32[r8+4>>2]=24;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;HEAP32[r10+4]=-572662307;HEAP32[r10+5]=-572662307;r9=r3}}while(0);_memcpy(r9,HEAP32[r1+24>>2],24);HEAP32[r6+6]=r9;HEAP32[r6]=0;r9=r5+12|0,r3=r9>>2;HEAP32[r3]=0;r10=r5+16|0,r8=r10>>2;HEAP32[r8]=0;r11=r5+20|0,r12=r11>>2;HEAP32[r12]=0;STACKTOP=r2;return r7}else if((r4|0)==5){do{if((HEAP32[1315960]|0)==0){r4=_malloc(8);r13=r4;if((r4|0)!=0){r14=r13;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=r13}else{r13=_malloc(16);if((r13|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r13+8|0;HEAP32[r13+4>>2]=8;r13=r4;HEAP32[r13>>2]=-572662307;HEAP32[r13+4>>2]=-572662307;r14=r4}}while(0);r4=HEAP32[r1+24>>2];r1=r14;r13=r4|0;r15=r4+4|0;r4=HEAPU8[r15]|HEAPU8[r15+1|0]<<8|HEAPU8[r15+2|0]<<16|HEAPU8[r15+3|0]<<24|0;r15=r1|0;tempBigInt=HEAPU8[r13]|HEAPU8[r13+1|0]<<8|HEAPU8[r13+2|0]<<16|HEAPU8[r13+3|0]<<24|0;HEAP8[r15]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+3|0]=tempBigInt&255;r15=r1+4|0;tempBigInt=r4;HEAP8[r15]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+3|0]=tempBigInt&255;HEAP32[r6+6]=r14;HEAP32[r6]=0;r9=r5+12|0,r3=r9>>2;HEAP32[r3]=0;r10=r5+16|0,r8=r10>>2;HEAP32[r8]=0;r11=r5+20|0,r12=r11>>2;HEAP32[r12]=0;STACKTOP=r2;return r7}else{HEAP32[r6]=0;r9=r5+12|0,r3=r9>>2;HEAP32[r3]=0;r10=r5+16|0,r8=r10>>2;HEAP32[r8]=0;r11=r5+20|0,r12=r11>>2;HEAP32[r12]=0;STACKTOP=r2;return r7}}function _new_space_atom(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=STACKTOP;do{if((HEAP32[1315960]|0)==0){r5=_malloc(28);r6=r5;if((r5|0)!=0){r7=r6,r8=r7>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r6,r8=r7>>2}else{r6=_malloc(36);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r6+8|0,r9=r5>>2;HEAP32[r6+4>>2]=28;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;HEAP32[r9+4]=-572662307;HEAP32[r9+5]=-572662307;HEAP32[r9+6]=-572662307;r7=r5,r8=r7>>2}}while(0);r5=r7;if((r2|0)<1){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=429,HEAP32[tempInt+8>>2]=5264788,tempInt))}HEAP32[r8]=0;HEAP32[r8+1]=4;HEAP32[r8+2]=1;do{if((HEAP32[1315960]|0)==0){r8=_malloc(28);r9=r8;if((r8|0)!=0){r10=r9,r11=r10>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9,r11=r10>>2}else{r9=_malloc(36);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r9+8|0,r6=r8>>2;HEAP32[r9+4>>2]=28;HEAP32[r6]=-572662307;HEAP32[r6+1]=-572662307;HEAP32[r6+2]=-572662307;HEAP32[r6+3]=-572662307;HEAP32[r6+4]=-572662307;HEAP32[r6+5]=-572662307;HEAP32[r6+6]=-572662307;r10=r8,r11=r10>>2}}while(0);HEAP32[r11]=0;HEAP32[r11+1]=r1;HEAP32[r11+2]=r2;HEAP32[r11+5]=r3;if((r3|0)!=0){r12=r10+24|0;HEAP32[r12>>2]=0;r13=r7+24|0;r14=r10;HEAP32[r13>>2]=r14;STACKTOP=r4;return r5}r3=r10+12|0;r11=r3|0;tempBigInt=0;HEAP8[r11]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+3|0]=tempBigInt&255;r11=r3+4|0;tempBigInt=0;HEAP8[r11]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r11+3|0]=tempBigInt&255;r12=r10+24|0;HEAP32[r12>>2]=0;r13=r7+24|0;r14=r10;HEAP32[r13>>2]=r14;STACKTOP=r4;return r5}function _new_datadef_atom(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r3=STACKTOP;do{if((HEAP32[1315960]|0)==0){r4=_malloc(28);r5=r4;if((r4|0)!=0){r6=r5,r7=r6>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r6=r5,r7=r6>>2}else{r5=_malloc(36);if((r5|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r5+8|0,r8=r4>>2;HEAP32[r5+4>>2]=28;HEAP32[r8]=-572662307;HEAP32[r8+1]=-572662307;HEAP32[r8+2]=-572662307;HEAP32[r8+3]=-572662307;HEAP32[r8+4]=-572662307;HEAP32[r8+5]=-572662307;HEAP32[r8+6]=-572662307;r6=r4,r7=r6>>2}}while(0);r4=r6;HEAP32[r7]=0;HEAP32[r7+1]=5;HEAP32[r7+2]=1;do{if((HEAP32[1315960]|0)==0){r7=_malloc(8);r8=r7;if((r7|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(16);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r8+8|0;HEAP32[r8+4>>2]=8;r8=r7;HEAP32[r8>>2]=-572662307;HEAP32[r8+4>>2]=-572662307;r9=r7}}while(0);r7=r6+24|0;HEAP32[r7>>2]=r9;HEAP32[r9>>2]=r1;HEAP32[HEAP32[r7>>2]+4>>2]=r2;STACKTOP=r3;return r4}function _new_rorg_atom(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(28);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(36);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=28;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;HEAP32[r7+4]=-572662307;HEAP32[r7+5]=-572662307;HEAP32[r7+6]=-572662307;r5=r3,r6=r5>>2}}while(0);r3=r5;do{if((HEAP32[1315960]|0)==0){r5=_malloc(4);r7=r5;if((r5|0)!=0){r8=r7;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7}else{r7=_malloc(12);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r7+8|0;HEAP32[r7+4>>2]=4;HEAP32[r5>>2]=-572662307;r8=r5}}while(0);HEAP32[r8>>2]=r1;HEAP32[r6]=0;HEAP32[r6+1]=11;HEAP32[r6+2]=1;HEAP32[r6+6]=r8;STACKTOP=r2;return r3}function _new_assert_atom(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=STACKTOP;do{if((HEAP32[1315960]|0)==0){r5=_malloc(28);r6=r5;if((r5|0)!=0){r7=r6,r8=r7>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r6,r8=r7>>2}else{r6=_malloc(36);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r6+8|0,r9=r5>>2;HEAP32[r6+4>>2]=28;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;HEAP32[r9+4]=-572662307;HEAP32[r9+5]=-572662307;HEAP32[r9+6]=-572662307;r7=r5,r8=r7>>2}}while(0);r5=r7;HEAP32[r8]=0;HEAP32[r8+1]=13;HEAP32[r8+2]=1;do{if((HEAP32[1315960]|0)==0){r8=_malloc(12);r9=r8;if((r8|0)!=0){r10=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9}else{r9=_malloc(20);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r9+8|0,r6=r8>>2;HEAP32[r9+4>>2]=12;HEAP32[r6]=-572662307;HEAP32[r6+1]=-572662307;HEAP32[r6+2]=-572662307;r10=r8}}while(0);r8=r7+24|0;r7=r8;HEAP32[r8>>2]=r10;HEAP32[r10>>2]=r1;HEAP32[HEAP32[r7>>2]+4>>2]=r2;HEAP32[HEAP32[r7>>2]+8>>2]=r3;STACKTOP=r4;return r5}function _copy_tree(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=STACKTOP;if((r1|0)==0){r3=0;STACKTOP=r2;return r3}r4=HEAP32[r1>>2];r5=_copy_tree(HEAP32[r1+4>>2]);r6=_copy_tree(HEAP32[r1+8>>2]);do{if((HEAP32[1315960]|0)==0){r7=_malloc(16);r8=r7;if((r7|0)!=0){r9=r8,r10=r9>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8,r10=r9>>2}else{r8=_malloc(24);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r8+8|0,r11=r7>>2;HEAP32[r8+4>>2]=16;HEAP32[r11]=-572662307;HEAP32[r11+1]=-572662307;HEAP32[r11+2]=-572662307;HEAP32[r11+3]=-572662307;r9=r7,r10=r9>>2}}while(0);HEAP32[r10+1]=r5;HEAP32[r10+2]=r6;HEAP32[r10]=r4;HEAP32[r10+3]=HEAP32[r1+12>>2];r3=r9;STACKTOP=r2;return r3}function _curpc_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=STACKTOP;do{if((HEAP32[1315960]|0)==0){r2=_malloc(16);r3=r2;if((r2|0)!=0){r4=r3,r5=r4>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=r3,r5=r4>>2}else{r3=_malloc(24);if((r3|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r2=r3+8|0,r6=r2>>2;HEAP32[r3+4>>2]=16;HEAP32[r6]=-572662307;HEAP32[r6+1]=-572662307;HEAP32[r6+2]=-572662307;HEAP32[r6+3]=-572662307;r4=r2,r5=r4>>2}}while(0);r2=r4;HEAP32[r5+2]=0;HEAP32[r5+1]=0;if((HEAP32[1316023]|0)!=0){HEAP32[r5]=22;r7=HEAP32[1316023];r8=r4+12|0;r9=r7;HEAP32[r8>>2]=r9;STACKTOP=r1;return r2}r6=_new_import(5267012);HEAP32[1316023]=r6;HEAP32[r6+4>>2]=1;r6=HEAP32[1316023]+8|0;HEAP32[r6>>2]=HEAP32[r6>>2]|128;HEAP32[r5]=22;r7=HEAP32[1316023];r8=r4+12|0;r9=r7;HEAP32[r8>>2]=r9;STACKTOP=r1;return r2}function _simplify_expr(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;if((r1|0)==0){STACKTOP=r2;return}r3=(r1+4|0)>>2;_simplify_expr(HEAP32[r3]);r4=(r1+8|0)>>2;_simplify_expr(HEAP32[r4]);r5=HEAP32[r3],r6=r5>>2;r7=(r5|0)==0;do{if(!r7){if((HEAP32[r6]|0)==21){break}STACKTOP=r2;return}}while(0);r5=HEAP32[r4],r8=r5>>2;do{if((r5|0)!=0){if((HEAP32[r8]|0)==21){break}STACKTOP=r2;return}}while(0);r5=r1|0;r9=HEAP32[r5>>2];do{if((r9|0)==13){r10=HEAP32[r6+3]<<HEAP32[r8+3]}else if((r9|0)==19){r10=-((HEAP32[r6+3]|0)!=(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==12){r10=(HEAP32[r6+3]|0)==0&1}else if((r9|0)==5){r10=-HEAP32[r6+3]|0}else if((r9|0)==4){r11=HEAP32[r8+3];if((r11|0)==0){_general_error(41,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=0;break}else{r10=(HEAP32[r6+3]|0)%(r11|0);break}}else if((r9|0)==7){if((HEAP32[r6+3]|0)==0){r12=0}else{r12=(HEAP32[r8+3]|0)!=0}r10=-(r12&1)|0}else if((r9|0)==1){r10=HEAP32[r6+3]-HEAP32[r8+3]|0}else if((r9|0)==6){r10=HEAP32[r6+3]^-1}else if((r9|0)==20){r10=-((HEAP32[r6+3]|0)==(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==10){r10=HEAP32[r8+3]|HEAP32[r6+3]}else if((r9|0)==22){r11=HEAP32[r1+12>>2];if((HEAP32[r11+4>>2]|0)!=3){STACKTOP=r2;return}r13=HEAP32[r11+16>>2];if((HEAP32[r13>>2]|0)==21){r10=HEAP32[r13+12>>2];break}else{STACKTOP=r2;return}}else if((r9|0)==2){r10=Math.imul(HEAP32[r8+3],HEAP32[r6+3])}else if((r9|0)==3){r13=HEAP32[r8+3];if((r13|0)==0){_general_error(41,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=0;break}else{r10=(HEAP32[r6+3]|0)/(r13|0)&-1;break}}else if((r9|0)==14){r10=HEAP32[r6+3]>>HEAP32[r8+3]}else if((r9|0)==15){r10=-((HEAP32[r6+3]|0)<(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==16){r10=-((HEAP32[r6+3]|0)>(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==9){r10=HEAP32[r8+3]&HEAP32[r6+3]}else if((r9|0)==18){r10=-((HEAP32[r6+3]|0)>=(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==8){if((HEAP32[r6+3]|0)==0){r14=(HEAP32[r8+3]|0)!=0}else{r14=1}r10=-(r14&1)|0}else if((r9|0)==11){r10=HEAP32[r8+3]^HEAP32[r6+3]}else if((r9|0)==17){r10=-((HEAP32[r6+3]|0)<=(HEAP32[r8+3]|0)&1)|0}else if((r9|0)==0){r10=HEAP32[r8+3]+HEAP32[r6+3]|0}else{if(r7){STACKTOP=r2;return}r13=HEAP32[r6+3];if((r9|0)==25){r10=r13>>>8&255;break}else if((r9|0)==24){r10=r13&255;break}else{STACKTOP=r2;return}}}while(0);_free_expr(HEAP32[r3]);_free_expr(HEAP32[r4]);HEAP32[r5>>2]=21;HEAP32[r4]=0;HEAP32[r3]=0;HEAP32[r1+12>>2]=r10;STACKTOP=r2;return}function _free_expr(r1){var r2;if((r1|0)==0){return}_free_expr(HEAP32[r1+4>>2]);_free_expr(HEAP32[r1+8>>2]);r2=r1;if((HEAP32[1315960]|0)==0){_free(r2);return}else{_memset(r2,-1,HEAP32[r1-16+12>>2]);_free(r1-16+8|0);return}}function _eval_expr(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+20|0;r7=r6,r8=r7>>2;r9=r6+4,r10=r9>>2;r11=r6+8,r12=r11>>2;r13=r6+12;r14=r6+16;if((r1|0)==0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=590,HEAP32[tempInt+8>>2]=5271012,tempInt))}r15=r1+4|0;r16=HEAP32[r15>>2];if((r16|0)==0){r17=1}else{r17=(_eval_expr(r16,r9,r3,r4)|0)!=0&1}r9=r1+8|0;r16=HEAP32[r9>>2];if((r16|0)==0){r18=r17}else{r18=(_eval_expr(r16,r11,r3,r4)|0)==0?0:r17}r17=HEAP32[r1>>2];L1262:do{if((r17|0)==0){HEAP32[r8]=HEAP32[r12]+HEAP32[r10]|0;r19=r18}else if((r17|0)==1){_find_base(HEAP32[r15>>2],r13,r3,r4);_find_base(HEAP32[r9>>2],r14,r3,r4);r11=HEAP32[r13>>2],r16=r11>>2;do{if((r18|0)==0){if((r11|0)==0){r20=0;break}r21=HEAP32[r14>>2];if((r21|0)==0){r20=0;break}do{if((HEAP32[r16+1]|0)==1){if((HEAP32[r21+4>>2]|0)!=1){r22=0;break}r22=(HEAP32[r16+6]|0)==(HEAP32[r21+24>>2]|0)}else{r22=0}}while(0);r23=r22&1;r5=952;break}else{r23=r18;r5=952}}while(0);do{if(r5==952){if((r11|0)==0){r20=r23;break}r21=HEAP32[r14>>2];if((r21|0)==0){r20=r23;break}if((HEAP32[r21+4>>2]|0)!=1){r20=r23;break}if((HEAP32[r21+24>>2]|0)!=(r3|0)){r20=r23;break}r21=HEAP32[r16+6];if((r21|0)==0){r20=r23;break}r24=HEAP32[r16+1];if(!((r21|0)!=(r3|0)&(r24|0)==1|(r24|0)==2)){r20=r23;break}HEAP32[r8]=r4-HEAP32[r12]+HEAP32[r10]-HEAP32[r21+28>>2]|0;r19=r23;break L1262}}while(0);HEAP32[r8]=HEAP32[r10]-HEAP32[r12]|0;r19=r20}else if((r17|0)==2){HEAP32[r8]=Math.imul(HEAP32[r12],HEAP32[r10]);r19=r18}else if((r17|0)==3){r16=HEAP32[r12];if((r16|0)==0){_general_error(41,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[r8]=0;r19=r18;break}else{HEAP32[r8]=(HEAP32[r10]|0)/(r16|0)&-1;r19=r18;break}}else if((r17|0)==4){r16=HEAP32[r12];if((r16|0)==0){_general_error(41,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[r8]=0;r19=r18;break}else{HEAP32[r8]=(HEAP32[r10]|0)%(r16|0);r19=r18;break}}else if((r17|0)==5){HEAP32[r8]=-HEAP32[r10]|0;r19=r18}else if((r17|0)==6){HEAP32[r8]=HEAP32[r10]^-1;r19=r18}else if((r17|0)==7){if((HEAP32[r10]|0)==0){r25=0}else{r25=(HEAP32[r12]|0)!=0}HEAP32[r8]=-(r25&1)|0;r19=r18}else if((r17|0)==8){if((HEAP32[r10]|0)==0){r26=(HEAP32[r12]|0)!=0}else{r26=1}HEAP32[r8]=-(r26&1)|0;r19=r18}else if((r17|0)==9){HEAP32[r8]=HEAP32[r12]&HEAP32[r10];r19=r18}else if((r17|0)==10){HEAP32[r8]=HEAP32[r12]|HEAP32[r10];r19=r18}else if((r17|0)==11){HEAP32[r8]=HEAP32[r12]^HEAP32[r10];r19=r18}else if((r17|0)==12){HEAP32[r8]=(HEAP32[r10]|0)==0&1;r19=r18}else if((r17|0)==13){HEAP32[r8]=HEAP32[r10]<<HEAP32[r12];r19=r18}else if((r17|0)==14){HEAP32[r8]=HEAP32[r10]>>HEAP32[r12];r19=r18}else if((r17|0)==15){HEAP32[r8]=-((HEAP32[r10]|0)<(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==16){HEAP32[r8]=-((HEAP32[r10]|0)>(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==17){HEAP32[r8]=-((HEAP32[r10]|0)<=(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==18){HEAP32[r8]=-((HEAP32[r10]|0)>=(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==19){HEAP32[r8]=-((HEAP32[r10]|0)!=(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==20){HEAP32[r8]=-((HEAP32[r10]|0)==(HEAP32[r12]|0)&1)|0;r19=r18}else if((r17|0)==22){r16=(r1+12|0)>>2;r11=HEAP32[r16],r21=r11>>2;r24=HEAP32[r21+1];if((r24|0)==3){r27=HEAP32[r21+2];if((r27&16|0)==0){r28=r11;r29=r27}else{_general_error(18,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r21+3],tempInt));r27=HEAP32[r16];r28=r27;r29=HEAP32[r27+8>>2]}HEAP32[r28+8>>2]=r29|16;r27=_eval_expr(HEAP32[HEAP32[r16]+16>>2],r7,r3,r4);r30=HEAP32[r16]+8|0;HEAP32[r30>>2]=HEAP32[r30>>2]&-17;r19=r27;break}else if((r24|0)==1){r24=(r3|0)==0;if((r11|0)!=(HEAP32[1316023]|0)|r24){r31=r11}else{HEAP32[r21+6]=r3;HEAP32[HEAP32[1316023]+28>>2]=r4;r31=HEAP32[r16]}HEAP32[r8]=HEAP32[r31+28>>2];if(r24){r19=0;break}r19=HEAP32[r3+24>>2]>>>2&1;break}else{HEAP32[r8]=0;r19=0;break}}else if((r17|0)==21){HEAP32[r8]=HEAP32[r1+12>>2];r19=r18}else{r24=HEAP32[r10];if((r17|0)==25){if((r18|0)==0){r32=r24}else{r32=r24>>>8&255}HEAP32[r8]=r32;r19=r18;break}else if((r17|0)==24){HEAP32[r8]=(r18|0)!=0?r24&255:r24;r19=r18;break}else{_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=710,HEAP32[tempInt+8>>2]=5271012,tempInt));r19=r18;break}}}while(0);HEAP32[r2>>2]=HEAP32[r8];STACKTOP=r6;return r19}function _find_base(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+12|0;r7=r6;r8=r6+4;r9=r6+8;r10=(r2|0)!=0;if(r10){HEAP32[r2>>2]=0}r11=(r1|0)>>2;r12=HEAP32[r11];if((r12|0)==0){r13=r1+4|0;r14=r1+8|0;do{if((_eval_expr(HEAP32[r13>>2],r7,r3,r4)|0)!=0){if((_find_base(HEAP32[r14>>2],r2,r3,r4)|0)==1){r15=1}else{break}STACKTOP=r6;return r15}}while(0);do{if((_eval_expr(HEAP32[r14>>2],r7,r3,r4)|0)!=0){if((_find_base(HEAP32[r13>>2],r2,r3,r4)|0)==1){r15=1}else{break}STACKTOP=r6;return r15}}while(0);r16=HEAP32[r11]}else if((r12|0)==22){r13=r1+12|0;r7=HEAP32[r13>>2];if((r7|0)!=(HEAP32[1316023]|0)|(r3|0)==0){r17=r7}else{HEAP32[r7+24>>2]=r3;HEAP32[HEAP32[1316023]+28>>2]=r4;r17=HEAP32[r13>>2]}if((HEAP32[r17+4>>2]|0)==3){r15=_find_base(HEAP32[r17+16>>2],r2,r3,r4);STACKTOP=r6;return r15}if(!r10){r15=1;STACKTOP=r6;return r15}HEAP32[r2>>2]=r17;r15=1;STACKTOP=r6;return r15}else{r16=r12}do{if((r16|0)==1){r12=r1+8|0;r17=r1+4|0;do{if((_eval_expr(HEAP32[r12>>2],r8,r3,r4)|0)!=0){if((_find_base(HEAP32[r17>>2],r2,r3,r4)|0)==1){r15=1}else{break}STACKTOP=r6;return r15}}while(0);if((_find_base(HEAP32[r17>>2],r2,r3,r4)|0)!=1){break}if((_find_base(HEAP32[r12>>2],r9,r3,r4)|0)!=1){break}r10=HEAP32[r9>>2];if((HEAP32[r10+4>>2]|0)!=1){break}if((HEAP32[r10+24>>2]|0)!=(r3|0)){break}if((HEAP32[HEAP32[r2>>2]+4>>2]-1|0)>>>0<2){r15=2}else{break}STACKTOP=r6;return r15}}while(0);r9=HEAP32[r11];do{if((r9|0)==3|(r9|0)==4){r8=HEAP32[r1+8>>2];if((HEAP32[r8>>2]|0)!=21){r18=r9;r5=1033;break}if((HEAP32[r8+12>>2]|0)!=256){r18=r9;r5=1033;break}r8=(r9|0)==3?25:24;HEAP32[r11]=r8;r18=r8;r5=1033;break}else if((r9|0)==9){r8=HEAP32[r1+8>>2];if((HEAP32[r8>>2]|0)!=21){r5=1035;break}if((HEAP32[r8+12>>2]|0)!=255){r5=1035;break}HEAP32[r11]=24;r19=24;r5=1034;break}else{r18=r9;r5=1033}}while(0);do{if(r5==1033){if((r18-24|0)>>>0<2){r19=r18;r5=1034;break}else{r5=1035;break}}}while(0);if(r5==1034){HEAP32[1311085]=r19;r15=_find_base(HEAP32[r1+4>>2],r2,r3,r4);STACKTOP=r6;return r15}else if(r5==1035){HEAP32[1311085]=0;r15=0;STACKTOP=r6;return r15}}function _expression(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r1=0;r2=STACKTOP;r3=_logical_and_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;if(HEAP8[r4]<<24>>24==124){r5=r3;r6=r4}else{r7=r3;STACKTOP=r2;return r7}while(1){if(HEAP8[r6+1|0]<<24>>24!=124){r7=r5;r1=1063;break}r3=r6+2|0;HEAP32[1310797]=r3;r4=r3;while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r8=r3;if((r3|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(24);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r8+8|0,r10=r3>>2;HEAP32[r8+4>>2]=16;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;r9=r3}}while(0);r4=r9+8|0;HEAP32[r4>>2]=0;r3=r9+4|0;HEAP32[r3>>2]=0;HEAP32[r9>>2]=8;r10=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}r8=r9;HEAP32[1310797]=r10;HEAP32[r3>>2]=r5;HEAP32[r4>>2]=_logical_and_expr();r11=HEAP32[1310797];if(HEAP8[r11]<<24>>24==124){r5=r8;r6=r11}else{r7=r8;r1=1062;break}}if(r1==1062){STACKTOP=r2;return r7}else if(r1==1063){STACKTOP=r2;return r7}}function _logical_and_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r1=0;r2=STACKTOP;r3=_equality_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;if(HEAP8[r4]<<24>>24==38){r5=r3;r6=r4}else{r7=r3;STACKTOP=r2;return r7}while(1){if(HEAP8[r6+1|0]<<24>>24!=38){r7=r5;r1=1083;break}r3=r6+2|0;HEAP32[1310797]=r3;r4=r3;while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r8=r3;if((r3|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(24);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r8+8|0,r10=r3>>2;HEAP32[r8+4>>2]=16;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;r9=r3}}while(0);r4=r9+8|0;HEAP32[r4>>2]=0;r3=r9+4|0;HEAP32[r3>>2]=0;HEAP32[r9>>2]=7;r10=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}r8=r9;HEAP32[1310797]=r10;HEAP32[r3>>2]=r5;HEAP32[r4>>2]=_equality_expr();r11=HEAP32[1310797];if(HEAP8[r11]<<24>>24==38){r5=r8;r6=r11}else{r7=r8;r1=1081;break}}if(r1==1081){STACKTOP=r2;return r7}else if(r1==1083){STACKTOP=r2;return r7}}function _equality_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r1=0;r2=STACKTOP;r3=_relational_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;r5=r3;r3=r4;while(1){r4=HEAP8[r3];if(r4<<24>>24==60){r6=r3+1|0;if(HEAP8[r6]<<24>>24==62){r7=r6}else{r1=1105;break}}else if(r4<<24>>24==61){r7=r3+1|0}else if(r4<<24>>24==33){r4=r3+1|0;if(HEAP8[r4]<<24>>24==61){r7=r4}else{r1=1106;break}}else{r1=1107;break}HEAP32[1310797]=r7;r4=HEAP8[r3];r6=r4<<24>>24==61;do{if(r4<<24>>24!=HEAP8[r7]<<24>>24&r6){r8=r7}else{r9=r3+2|0;HEAP32[1310797]=r9;r8=r9;break}}while(0);while(1){if((_isspace(HEAPU8[r8])|0)==0){break}r8=r8+1|0}HEAP32[1310797]=r8;do{if((HEAP32[1315960]|0)==0){r4=_malloc(16);r9=r4;if((r4|0)!=0){r10=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9}else{r9=_malloc(24);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r9+8|0,r11=r4>>2;HEAP32[r9+4>>2]=16;HEAP32[r11]=-572662307;HEAP32[r11+1]=-572662307;HEAP32[r11+2]=-572662307;HEAP32[r11+3]=-572662307;r10=r4}}while(0);r4=r10+8|0;HEAP32[r4>>2]=0;r11=r10+4|0;HEAP32[r11>>2]=0;HEAP32[r10>>2]=r6?20:19;r9=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r9])|0)==0){break}else{r9=r9+1|0}}HEAP32[1310797]=r9;HEAP32[r11>>2]=r5;HEAP32[r4>>2]=_relational_expr();r5=r10;r3=HEAP32[1310797]}if(r1==1105){STACKTOP=r2;return r5}else if(r1==1106){STACKTOP=r2;return r5}else if(r1==1107){STACKTOP=r2;return r5}}function _relational_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=0;r2=STACKTOP;r3=_additive_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;r5=0;r6=r3;r3=r4;while(1){r4=HEAP8[r3];if(r4<<24>>24==60){r7=HEAP8[r3+1|0];if(r7<<24>>24==62){r1=1138;break}else{r8=r7}}else if(r4<<24>>24==62){r8=HEAP8[r3+1|0]}else{r1=1139;break}r7=r3+1|0;if(r8<<24>>24==r4<<24>>24){r1=1137;break}HEAP32[1310797]=r7;r4=HEAP8[r3];if(HEAP8[r7]<<24>>24==61){r9=r3+2|0;HEAP32[1310797]=r9;r10=HEAP8[r7];r11=r9}else{r10=r5;r11=r7}r7=r11;while(1){if((_isspace(HEAPU8[r7])|0)==0){break}r7=r7+1|0}HEAP32[1310797]=r7;do{if((HEAP32[1315960]|0)==0){r9=_malloc(16);r12=r9;if((r9|0)!=0){r13=r12,r14=r13>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r13=r12,r14=r13>>2}else{r12=_malloc(24);if((r12|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r12+8|0,r15=r9>>2;HEAP32[r12+4>>2]=16;HEAP32[r15]=-572662307;HEAP32[r15+1]=-572662307;HEAP32[r15+2]=-572662307;HEAP32[r15+3]=-572662307;r13=r9,r14=r13>>2}}while(0);r7=r13;r9=r13+8|0;HEAP32[r9>>2]=0;r15=r13+4|0;HEAP32[r15>>2]=0;r12=r10<<24>>24!=0;do{if(r4<<24>>24==60){if(r12){HEAP32[r14]=17;break}else{HEAP32[r14]=15;break}}else{if(r12){HEAP32[r14]=18;break}else{HEAP32[r14]=16;break}}}while(0);r12=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r12])|0)==0){break}else{r12=r12+1|0}}HEAP32[1310797]=r12;HEAP32[r15>>2]=r6;HEAP32[r9>>2]=_additive_expr();r5=r10;r6=r7;r3=HEAP32[1310797]}if(r1==1137){STACKTOP=r2;return r6}else if(r1==1138){STACKTOP=r2;return r6}else if(r1==1139){STACKTOP=r2;return r6}}function _additive_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=STACKTOP;r2=_inclusive_or_expr();r3=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r3])|0)==0){r4=r2;r5=r3;break}else{r3=r3+1|0}}while(1){HEAP32[1310797]=r5;r3=HEAP8[r5];if(!(r3<<24>>24==43|r3<<24>>24==45)){break}r3=r5+1|0;HEAP32[1310797]=r3;r2=HEAP8[r5];r6=r3;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[1310797]=r6;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r7=r3;if((r3|0)!=0){r8=r7;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7}else{r7=_malloc(24);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r7+8|0,r9=r3>>2;HEAP32[r7+4>>2]=16;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;r8=r3}}while(0);r6=r8+8|0;HEAP32[r6>>2]=0;HEAP32[r8>>2]=r2<<24>>24!=43&1;HEAP32[r8+4>>2]=r4;HEAP32[r6>>2]=_inclusive_or_expr();r6=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}r4=r8;r5=r6}STACKTOP=r1;return r4}function _inclusive_or_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=0;r2=STACKTOP;r3=_and_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;r5=r3;r3=r4;while(1){r4=HEAP8[r3];if(!(r4<<24>>24==94|r4<<24>>24==126)){r6=r3;r7=r4;break}r4=r3+1|0;HEAP32[1310797]=r4;r8=r4;while(1){if((_isspace(HEAPU8[r8])|0)==0){break}else{r8=r8+1|0}}HEAP32[1310797]=r8;do{if((HEAP32[1315960]|0)==0){r4=_malloc(16);r9=r4;if((r4|0)!=0){r10=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9}else{r9=_malloc(24);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r9+8|0,r11=r4>>2;HEAP32[r9+4>>2]=16;HEAP32[r11]=-572662307;HEAP32[r11+1]=-572662307;HEAP32[r11+2]=-572662307;HEAP32[r11+3]=-572662307;r10=r4}}while(0);r8=r10+8|0;HEAP32[r8>>2]=0;r4=r10+4|0;HEAP32[r4>>2]=0;HEAP32[r10>>2]=11;r11=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r11])|0)==0){break}else{r11=r11+1|0}}HEAP32[1310797]=r11;HEAP32[r4>>2]=r5;HEAP32[r8>>2]=_and_expr();r5=r10;r3=HEAP32[1310797]}while(1){r3=r6+1|0;if((_isspace(r7&255)|0)==0){break}r6=r3;r7=HEAP8[r3]}HEAP32[1310797]=r6;r7=r5;r5=r6;while(1){r6=HEAP8[r5];if(r6<<24>>24==124){if(HEAP8[r5+1|0]<<24>>24==124){r1=1204;break}}else if(r6<<24>>24==33){if(HEAP8[r5+1|0]<<24>>24==61){r1=1205;break}}else{r1=1203;break}r6=r5+1|0;HEAP32[1310797]=r6;r3=r6;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}HEAP32[1310797]=r3;do{if((HEAP32[1315960]|0)==0){r8=_malloc(16);r4=r8;if((r8|0)!=0){r12=r4;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r4}else{r4=_malloc(24);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r4+8|0,r11=r8>>2;HEAP32[r4+4>>2]=16;HEAP32[r11]=-572662307;HEAP32[r11+1]=-572662307;HEAP32[r11+2]=-572662307;HEAP32[r11+3]=-572662307;r12=r8}}while(0);r3=r12+8|0;HEAP32[r3>>2]=0;r8=r12+4|0;HEAP32[r8>>2]=0;HEAP32[r12>>2]=10;r11=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r11])|0)==0){break}else{r11=r11+1|0}}HEAP32[1310797]=r11;HEAP32[r8>>2]=r7;r4=_and_expr();r6=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[1310797]=r6;r8=r4;r11=r6;while(1){r10=HEAP8[r11];if(!(r10<<24>>24==94|r10<<24>>24==126)){break}r10=r11+1|0;HEAP32[1310797]=r10;r9=r10;while(1){if((_isspace(HEAPU8[r9])|0)==0){break}else{r9=r9+1|0}}HEAP32[1310797]=r9;do{if((HEAP32[1315960]|0)==0){r10=_malloc(16);r13=r10;if((r10|0)!=0){r14=r13;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=r13}else{r13=_malloc(24);if((r13|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=r13+8|0,r15=r10>>2;HEAP32[r13+4>>2]=16;HEAP32[r15]=-572662307;HEAP32[r15+1]=-572662307;HEAP32[r15+2]=-572662307;HEAP32[r15+3]=-572662307;r14=r10}}while(0);r9=r14+8|0;HEAP32[r9>>2]=0;r10=r14+4|0;HEAP32[r10>>2]=0;HEAP32[r14>>2]=11;r15=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r15])|0)==0){break}else{r15=r15+1|0}}HEAP32[1310797]=r15;HEAP32[r10>>2]=r8;HEAP32[r9>>2]=_and_expr();r8=r14;r11=HEAP32[1310797]}HEAP32[r3>>2]=r8;r7=r12;r5=HEAP32[1310797]}if(r1==1203){STACKTOP=r2;return r7}else if(r1==1204){STACKTOP=r2;return r7}else if(r1==1205){STACKTOP=r2;return r7}}function _and_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r1=0;r2=STACKTOP;r3=_multiplicative_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;if(HEAP8[r4]<<24>>24==38){r5=r3;r6=r4}else{r7=r3;STACKTOP=r2;return r7}while(1){r3=r6+1|0;if(HEAP8[r3]<<24>>24==38){r7=r5;r1=1223;break}HEAP32[1310797]=r3;r4=r3;while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[1310797]=r4;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r8=r3;if((r3|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(24);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r8+8|0,r10=r3>>2;HEAP32[r8+4>>2]=16;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;r9=r3}}while(0);r4=r9+8|0;HEAP32[r4>>2]=0;r3=r9+4|0;HEAP32[r3>>2]=0;HEAP32[r9>>2]=9;r10=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}r8=r9;HEAP32[1310797]=r10;HEAP32[r3>>2]=r5;HEAP32[r4>>2]=_multiplicative_expr();r11=HEAP32[1310797];if(HEAP8[r11]<<24>>24==38){r5=r8;r6=r11}else{r7=r8;r1=1222;break}}if(r1==1222){STACKTOP=r2;return r7}else if(r1==1223){STACKTOP=r2;return r7}}function _multiplicative_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10;r1=STACKTOP;r2=_shift_expr();r3=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r3])|0)==0){r4=r2;r5=r3;break}else{r3=r3+1|0}}L1635:while(1){HEAP32[1310797]=r5;r3=HEAP8[r5];if(!(r3<<24>>24==42|r3<<24>>24==47|r3<<24>>24==37)){break}r3=r5+1|0;HEAP32[1310797]=r3;r2=HEAP8[r5];r6=r3;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[1310797]=r6;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r7=r3;if((r3|0)!=0){r8=r7,r9=r8>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7,r9=r8>>2}else{r7=_malloc(24);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r7+8|0,r10=r3>>2;HEAP32[r7+4>>2]=16;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;r8=r3,r9=r8>>2}}while(0);r6=r8;r3=r8+8|0;HEAP32[r3>>2]=0;r10=r8+4|0;HEAP32[r10>>2]=0;do{if(r2<<24>>24==47){r7=HEAP32[1310797];if(HEAP8[r7]<<24>>24==47){HEAP32[1310797]=r7+1|0;HEAP32[r9]=4;break}else{HEAP32[r9]=3;break}}else if(r2<<24>>24==42){HEAP32[r9]=2}else{HEAP32[r9]=4}}while(0);HEAP32[r10>>2]=r4;HEAP32[r3>>2]=_shift_expr();r2=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r2])|0)==0){r4=r6;r5=r2;continue L1635}else{r2=r2+1|0}}}STACKTOP=r1;return r4}function _shift_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10;r1=0;r2=STACKTOP;r3=_unary_expr();r4=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r4])|0)==0){r5=r3;r6=r4;break}else{r4=r4+1|0}}while(1){HEAP32[1310797]=r6;r4=HEAP8[r6];if(!(r4<<24>>24==60|r4<<24>>24==62)){r1=1262;break}if(HEAP8[r6+1|0]<<24>>24!=r4<<24>>24){r1=1261;break}r3=r6+2|0;HEAP32[1310797]=r3;r7=r3;while(1){if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r7+1|0}}HEAP32[1310797]=r7;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r8=r3;if((r3|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(24);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r8+8|0,r10=r3>>2;HEAP32[r8+4>>2]=16;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;r9=r3}}while(0);r7=r9+8|0;HEAP32[r7>>2]=0;HEAP32[r9>>2]=r4<<24>>24==60?13:14;HEAP32[r9+4>>2]=r5;HEAP32[r7>>2]=_unary_expr();r7=HEAP32[1310797];while(1){if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r7+1|0}}r5=r9;r6=r7}if(r1==1261){STACKTOP=r2;return r5}else if(r1==1262){STACKTOP=r2;return r5}}function _unary_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9;r1=STACKTOP;r2=HEAP32[1310797];r3=HEAP8[r2];L1685:do{if(r3<<24>>24==43|r3<<24>>24==45|r3<<24>>24==33|r3<<24>>24==126){r4=r2+1|0;HEAP32[1310797]=r4;r5=r4;while(1){if((_isspace(HEAPU8[r5])|0)==0){r6=r5;break L1685}else{r5=r5+1|0}}}else if(r3<<24>>24==60|r3<<24>>24==62){r5=r2+1|0;HEAP32[1310797]=r5;r4=r5;while(1){if((_isspace(HEAPU8[r4])|0)==0){r6=r4;break L1685}else{r4=r4+1|0}}}else{r7=_primary_expr();STACKTOP=r1;return r7}}while(0);HEAP32[1310797]=r6;if(HEAP8[r2]<<24>>24==43){r7=_primary_expr();STACKTOP=r1;return r7}do{if((HEAP32[1315960]|0)==0){r6=_malloc(16);r3=r6;if((r6|0)!=0){r8=r3,r9=r8>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r3,r9=r8>>2}else{r3=_malloc(24);if((r3|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r6=r3+8|0,r4=r6>>2;HEAP32[r3+4>>2]=16;HEAP32[r4]=-572662307;HEAP32[r4+1]=-572662307;HEAP32[r4+2]=-572662307;HEAP32[r4+3]=-572662307;r8=r6,r9=r8>>2}}while(0);r6=r8;HEAP32[r9+2]=0;r4=r8+4|0;HEAP32[r4>>2]=0;r8=HEAP8[r2];if(r8<<24>>24==45){HEAP32[r9]=5}else if(r8<<24>>24==33){HEAP32[r9]=12}else if(r8<<24>>24==126){HEAP32[r9]=6}else if(r8<<24>>24==60|r8<<24>>24==62){HEAP32[r9]=r8<<24>>24==60?24:25}HEAP32[r4>>2]=_primary_expr();r7=r6;STACKTOP=r1;return r7}function _primary_expr(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r3=r2;r4=r2+4;r5=r2+20;r6=r2+24;r7=r2+28;r8=HEAP32[1310797];if(HEAP8[r8]<<24>>24==40){r9=r8+1|0;HEAP32[1310797]=r9;r8=r9;while(1){if((_isspace(HEAPU8[r8])|0)==0){break}else{r8=r8+1|0}}HEAP32[1310797]=r8;r8=_expression();r9=HEAP32[1310797];do{if(HEAP8[r9]<<24>>24==41){r10=r9+1|0;HEAP32[1310797]=r10;r11=r10;break}else{_general_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=41,tempInt));r11=HEAP32[1310797];break}}while(0);while(1){if((_isspace(HEAPU8[r11])|0)==0){break}else{r11=r11+1|0}}HEAP32[1310797]=r11;r12=r8;STACKTOP=r2;return r12}r8=_get_local_label(5243188);if((r8|0)!=0){do{if((_find_name(HEAP32[1310781],r8,r5)|0)==0){r1=1298}else{r11=HEAP32[r5>>2];if((r11|0)==0){r1=1298;break}else{r13=r11;break}}}while(0);if(r1==1298){r13=_new_import(r8)}if((HEAP32[r13+4>>2]|0)==3){r14=_copy_tree(HEAP32[r13+16>>2])}else{do{if((HEAP32[1315960]|0)==0){r5=_malloc(16);r11=r5;if((r5|0)!=0){r15=r11,r16=r15>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r15=r11,r16=r15>>2}else{r11=_malloc(24);if((r11|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r11+8|0,r9=r5>>2;HEAP32[r11+4>>2]=16;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;r15=r5,r16=r15>>2}}while(0);HEAP32[r16+2]=0;HEAP32[r16+1]=0;HEAP32[r16]=22;HEAP32[r16+3]=r13;r14=r15}if((HEAP32[1315960]|0)==0){_free(r8);r12=r14;STACKTOP=r2;return r12}else{_memset(r8,-1,HEAP32[r8-4>>2]);_free(r8-8|0);r12=r14;STACKTOP=r2;return r12}}r14=_const_prefix(HEAP32[1310797],r6);r8=HEAP32[r6>>2];if((r8|0)!=0){HEAP32[1310797]=r14;L1755:do{if((r8|0)<11){r6=HEAP8[r14];if(r6<<24>>24<=47){r17=0;r18=r14;break}r15=r8+48|0;r13=0;r16=r14;r5=r6;while(1){if((r5<<24>>24|0)>=(r15|0)){r17=r13;r18=r16;break L1755}r6=Math.imul(r8,r13);r9=r16+1|0;HEAP32[1310797]=r9;r11=(HEAP8[r16]<<24>>24)+(r6-48)|0;r6=HEAP8[r9];if(r6<<24>>24>47){r13=r11;r16=r9;r5=r6}else{r17=r11;r18=r9;break L1755}}}else{if((r8|0)!=16){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=106,HEAP32[tempInt+8>>2]=5271012,tempInt));r17=0;r18=HEAP32[1310797];break}r5=HEAP8[r14];if((r5-48&255)<10|(r5-97&255)<6|(r5-65&255)<6){r19=0;r20=r14;r21=r5}else{r17=0;r18=r14;break}while(1){do{if((r21-48&255)<10){r5=r20+1|0;HEAP32[1310797]=r5;r22=(HEAP8[r20]<<24>>24)+((r19<<4)-48)|0;r23=r5}else{r5=r20+1|0;HEAP32[1310797]=r5;r16=(HEAP8[r20]<<24>>24)+(r19<<4)|0;if((r21-97&255)<6){r22=r16-87|0;r23=r5;break}else{r22=r16-55|0;r23=r5;break}}}while(0);r5=HEAP8[r23];if((r5-48&255)<10|(r5-97&255)<6|(r5-65&255)<6){r19=r22;r20=r23;r21=r5}else{r17=r22;r18=r23;break L1755}}}}while(0);r23=r18;while(1){if((_isspace(HEAPU8[r23])|0)==0){break}r23=r23+1|0}HEAP32[1310797]=r23;do{if((HEAP32[1315960]|0)==0){r23=_malloc(16);r18=r23;if((r23|0)!=0){r24=r18,r25=r24>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r24=r18,r25=r24>>2}else{r18=_malloc(24);if((r18|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r23=r18+8|0,r22=r23>>2;HEAP32[r18+4>>2]=16;HEAP32[r22]=-572662307;HEAP32[r22+1]=-572662307;HEAP32[r22+2]=-572662307;HEAP32[r22+3]=-572662307;r24=r23,r25=r24>>2}}while(0);HEAP32[r25+2]=0;HEAP32[r25+1]=0;HEAP32[r25]=21;HEAP32[r25+3]=r17;r12=r24;STACKTOP=r2;return r12}r24=HEAP32[1310797];do{if(HEAP8[r24]<<24>>24==HEAP8[5263848]<<24>>24){r17=HEAP8[r24+1|0];if(r17<<24>>24==95){break}if((_isalnum(r17&255)|0)!=0){break}r17=HEAP32[1310797]+1|0;HEAP32[1310797]=r17;r25=r17;while(1){if((_isspace(HEAPU8[r25])|0)==0){break}else{r25=r25+1|0}}HEAP32[1310797]=r25;if(!HEAP8[5261784]){r12=_curpc_expr();STACKTOP=r2;return r12}do{if((HEAP32[1315960]|0)==0){r17=_malloc(16);r23=r17;if((r17|0)!=0){r26=r23,r27=r26>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r26=r23,r27=r26>>2}else{r23=_malloc(24);if((r23|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r17=r23+8|0,r22=r17>>2;HEAP32[r23+4>>2]=16;HEAP32[r22]=-572662307;HEAP32[r22+1]=-572662307;HEAP32[r22+2]=-572662307;HEAP32[r22+3]=-572662307;r26=r17,r27=r26>>2}}while(0);r25=r26;HEAP32[r27+2]=0;HEAP32[r27+1]=0;HEAP32[r27]=22;r17=r4|0;r22=HEAP32[1311076];HEAP32[1311076]=r22+1|0;_sprintf(r17,5267344,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r22,tempInt));r22=_new_labsym(0,r17);HEAP32[r27+3]=r22;do{if((HEAP32[1315960]|0)==0){r17=_malloc(28);r23=r17;if((r17|0)!=0){r28=r23,r29=r28>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r28=r23,r29=r28>>2}else{r23=_malloc(36);if((r23|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r17=r23+8|0,r18=r17>>2;HEAP32[r23+4>>2]=28;HEAP32[r18]=-572662307;HEAP32[r18+1]=-572662307;HEAP32[r18+2]=-572662307;HEAP32[r18+3]=-572662307;HEAP32[r18+4]=-572662307;HEAP32[r18+5]=-572662307;HEAP32[r18+6]=-572662307;r28=r17,r29=r28>>2}}while(0);HEAP32[r29]=0;HEAP32[r29+1]=1;HEAP32[r29+2]=1;HEAP32[r29+6]=r22;_add_atom(0,r28);r12=r25;STACKTOP=r2;return r12}}while(0);r28=_parse_identifier(5243188);r29=HEAP32[1310797];if((r28|0)!=0){r27=r29;while(1){if((_isspace(HEAPU8[r27])|0)==0){break}else{r27=r27+1|0}}HEAP32[1310797]=r27;do{if((_find_name(HEAP32[1310781],r28,r3)|0)==0){r1=1360}else{r27=HEAP32[r3>>2];if((r27|0)==0){r1=1360;break}else{r30=r27;break}}}while(0);if(r1==1360){r30=_new_import(r28)}if((HEAP32[r30+4>>2]|0)==3){r31=_copy_tree(HEAP32[r30+16>>2])}else{do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r27=r3;if((r3|0)!=0){r32=r27,r33=r32>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r32=r27,r33=r32>>2}else{r27=_malloc(24);if((r27|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r27+8|0,r4=r3>>2;HEAP32[r27+4>>2]=16;HEAP32[r4]=-572662307;HEAP32[r4+1]=-572662307;HEAP32[r4+2]=-572662307;HEAP32[r4+3]=-572662307;r32=r3,r33=r32>>2}}while(0);HEAP32[r33+2]=0;HEAP32[r33+1]=0;HEAP32[r33]=22;HEAP32[r33+3]=r30;r31=r32}if((HEAP32[1315960]|0)==0){_free(r28);r12=r31;STACKTOP=r2;return r12}else{_memset(r28,-1,HEAP32[r28-4>>2]);_free(r28-8|0);r12=r31;STACKTOP=r2;return r12}}r31=HEAP8[r29];if(!(r31<<24>>24==39|r31<<24>>24==34)){_general_error(9,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));do{if((HEAP32[1315960]|0)==0){r31=_malloc(16);r28=r31;if((r31|0)!=0){r34=r28,r35=r34>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r34=r28,r35=r34>>2}else{r28=_malloc(24);if((r28|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r31=r28+8|0,r32=r31>>2;HEAP32[r28+4>>2]=16;HEAP32[r32]=-572662307;HEAP32[r32+1]=-572662307;HEAP32[r32+2]=-572662307;HEAP32[r32+3]=-572662307;r34=r31,r35=r34>>2}}while(0);HEAP32[r35+2]=0;HEAP32[r35+1]=0;HEAP32[r35]=21;HEAP32[r35+3]=-1;r12=r34;STACKTOP=r2;return r12}r34=r29+1|0;HEAP32[1310797]=r34;r35=HEAP8[r29];r29=1;r31=0;r32=0;r28=r34;L1857:while(1){r34=HEAP8[r28];do{if(r34<<24>>24==92){r30=_escape(r28,r7);HEAP32[1310797]=r30;r36=r30}else if(r34<<24>>24==0){r37=r28;break L1857}else{r30=r28+1|0;HEAP32[1310797]=r30;r33=HEAP8[r28];HEAP8[r7]=r33;if(r33<<24>>24!=r35<<24>>24){r36=r30;break}if(HEAP8[r30]<<24>>24!=r35<<24>>24){r37=r30;break L1857}r30=r28+2|0;HEAP32[1310797]=r30;r36=r30}}while(0);if((r29|0)>(HEAP32[1316043]|0)){r1=1381;break}r34=(HEAP8[r7]<<24>>24<<r31)+r32|0;r29=r29+1|0;r31=r31+8|0;r32=r34;r28=r36}do{if(r1==1381){_general_error(21,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r37=HEAP32[1310797];break}}while(0);while(1){if((_isspace(HEAPU8[r37])|0)==0){break}r37=r37+1|0}HEAP32[1310797]=r37;do{if((HEAP32[1315960]|0)==0){r37=_malloc(16);r1=r37;if((r37|0)!=0){r38=r1,r39=r38>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r38=r1,r39=r38>>2}else{r1=_malloc(24);if((r1|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=r1+8|0,r36=r37>>2;HEAP32[r1+4>>2]=16;HEAP32[r36]=-572662307;HEAP32[r36+1]=-572662307;HEAP32[r36+2]=-572662307;HEAP32[r36+3]=-572662307;r38=r37,r39=r38>>2}}while(0);HEAP32[r39+2]=0;HEAP32[r39+1]=0;HEAP32[r39]=21;HEAP32[r39+3]=r32;r12=r38;STACKTOP=r2;return r12}function _new_hashtable(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(12);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(20);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=12;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;r5=r3,r6=r5>>2}}while(0);r3=r5;HEAP32[r6+1]=r1;HEAP32[r6+2]=0;r5=r1<<2;if((HEAP32[1315960]|0)==0){r1=_malloc(r5);r7=r1;if((r1|0)!=0){r8=r7;r9=r8;_memset(r9,0,r5);r10=r8;HEAP32[r6]=r10;STACKTOP=r2;return r3}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7;r9=r8;_memset(r9,0,r5);r10=r8;HEAP32[r6]=r10;STACKTOP=r2;return r3}else{r7=_malloc(r5+8|0);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=r7+8|0;HEAP32[r7+4>>2]=r5;_memset(r1,-35,r5);r8=r1;r9=r8;_memset(r9,0,r5);r10=r8;HEAP32[r6]=r10;STACKTOP=r2;return r3}}function _add_hashentry(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r4=STACKTOP;r5=r3;r3=STACKTOP;STACKTOP=STACKTOP+4|0;HEAP32[r3>>2]=HEAP32[r5>>2];r5=HEAP8[r2];r6=r5<<24>>24==0;if((HEAP32[1311073]|0)==0){L1909:do{if(r6){r7=5381}else{r8=5381;r9=r2;r10=r5;while(1){r11=r9+1|0;r12=(r8*33&-1)+(r10&255)|0;r13=HEAP8[r11];if(r13<<24>>24==0){r7=r12;break L1909}else{r8=r12;r9=r11;r10=r13}}}}while(0);r14=(r7>>>0)%(HEAP32[r1+4>>2]>>>0)}else{L1904:do{if(r6){r15=5381}else{r7=5381;r10=r2;r9=r5;while(1){r8=r10+1|0;r13=_tolower(r9&255)+(r7*33&-1)|0;r11=HEAP8[r8];if(r11<<24>>24==0){r15=r13;break L1904}else{r7=r13;r10=r8;r9=r11}}}}while(0);r14=(r15>>>0)%(HEAP32[r1+4>>2]>>>0)}do{if((HEAP32[1315960]|0)==0){r15=_malloc(12);r5=r15;if((r15|0)!=0){r16=r5,r17=r16>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r16=r5,r17=r16>>2}else{r5=_malloc(20);if((r5|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r15=r5+8|0,r6=r15>>2;HEAP32[r5+4>>2]=12;HEAP32[r6]=-572662307;HEAP32[r6+1]=-572662307;HEAP32[r6+2]=-572662307;r16=r15,r17=r16>>2}}while(0);r15=r16;HEAP32[r17]=r2;HEAP32[r17+1]=HEAP32[r3>>2];r3=HEAP32[r1>>2];do{if((HEAP32[1315960]|0)!=0){if((HEAP32[r3+(r14<<2)>>2]|0)==0){break}r2=r1+8|0;HEAP32[r2>>2]=HEAP32[r2>>2]+1|0}}while(0);HEAP32[r17+2]=HEAP32[r3+(r14<<2)>>2];HEAP32[HEAP32[r1>>2]+(r14<<2)>>2]=r15;STACKTOP=r4;return}function _find_name(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=HEAP8[r2];r6=r5<<24>>24==0;if((HEAP32[1311073]|0)==0){L1929:do{if(r6){r7=5381}else{r8=5381;r9=r2;r10=r5;while(1){r11=r9+1|0;r12=(r8*33&-1)+(r10&255)|0;r13=HEAP8[r11];if(r13<<24>>24==0){r7=r12;break L1929}else{r8=r12;r9=r11;r10=r13}}}}while(0);r10=HEAP32[HEAP32[r1>>2]+((r7>>>0)%(HEAP32[r1+4>>2]>>>0)<<2)>>2];if((r10|0)==0){r14=0;return r14}r7=r1+8|0;r9=r10,r10=r9>>2;while(1){if((_strcmp(r2,HEAP32[r10])|0)==0){break}HEAP32[r7>>2]=HEAP32[r7>>2]+1|0;r8=HEAP32[r10+2];if((r8|0)==0){r14=0;r4=1461;break}else{r9=r8,r10=r9>>2}}if(r4==1461){return r14}HEAP32[r3>>2]=HEAP32[r10+1];r14=1;return r14}else{L1944:do{if(r6){r15=5381}else{r10=5381;r9=r2;r7=r5;while(1){r8=r9+1|0;r13=_tolower(r7&255)+(r10*33&-1)|0;r11=HEAP8[r8];if(r11<<24>>24==0){r15=r13;break L1944}else{r10=r13;r9=r8;r7=r11}}}}while(0);r5=HEAP32[HEAP32[r1>>2]+((r15>>>0)%(HEAP32[r1+4>>2]>>>0)<<2)>>2];if((r5|0)==0){r14=0;return r14}r15=r1+8|0;r1=r5,r5=r1>>2;while(1){if((_strcasecmp(r2,HEAP32[r5])|0)==0){break}HEAP32[r15>>2]=HEAP32[r15>>2]+1|0;r6=HEAP32[r5+2];if((r6|0)==0){r14=0;r4=1463;break}else{r1=r6,r5=r1>>2}}if(r4==1463){return r14}HEAP32[r3>>2]=HEAP32[r5+1];r14=1;return r14}}function _find_namelen_nc(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r5=0;r6=(r3|0)==0;L1959:do{if(r6){r7=5381}else{r8=r2;r9=r3;r10=5381;while(1){r11=r9-1|0;r12=_tolower(HEAPU8[r8])+(r10*33&-1)|0;if((r11|0)==0){r7=r12;break L1959}else{r8=r8+1|0;r9=r11;r10=r12}}}}while(0);r10=HEAP32[HEAP32[r1>>2]+((r7>>>0)%(HEAP32[r1+4>>2]>>>0)<<2)>>2];if((r10|0)==0){r13=0;return r13}r7=(r1+8|0)>>2;r1=r3-1|0;r9=(r1|0)==0;L1966:do{if(r6){r8=r10;while(1){if(HEAP8[HEAP32[r8>>2]]<<24>>24==0){r14=r8;break L1966}HEAP32[r7]=HEAP32[r7]+1|0;r12=HEAP32[r8+8>>2];if((r12|0)==0){r13=0;break}else{r8=r12}}return r13}else{r8=r10;while(1){r12=r8|0;r11=HEAP32[r12>>2];r15=HEAP8[r2];L1973:do{if(r9){r16=r15;r17=r11;r5=1475}else{r18=r2;r19=r11;r20=r1;r21=r15;while(1){r22=(_tolower(r21&255)|0)==(_tolower(HEAPU8[r19])|0);r23=HEAP8[r18];if(!r22){r16=r23;r17=r19;r5=1475;break L1973}if(r23<<24>>24==0){r5=1476;break L1973}r23=r18+1|0;r22=r19+1|0;r24=r20-1|0;r25=HEAP8[r23];if((r24|0)==0){r16=r25;r17=r22;r5=1475;break L1973}else{r18=r23;r19=r22;r20=r24;r21=r25}}}}while(0);do{if(r5==1475){r5=0;if((_tolower(r16&255)|0)==(_tolower(HEAPU8[r17])|0)){r5=1476;break}else{break}}}while(0);if(r5==1476){r5=0;if(HEAP8[HEAP32[r12>>2]+r3|0]<<24>>24==0){r14=r8;break L1966}}HEAP32[r7]=HEAP32[r7]+1|0;r15=HEAP32[r8+8>>2];if((r15|0)==0){r13=0;break}else{r8=r15}}return r13}}while(0);HEAP32[r4>>2]=HEAP32[r14+4>>2];r13=1;return r13}function _general_error(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP32[r4>>2]=r2;_error(r1,HEAP32[r4>>2],5262252,1);STACKTOP=r3;return}function _error(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r5=0;r6=STACKTOP;r7=HEAP32[r3+(r1<<3)+4>>2];if((r7&64|0)!=0){STACKTOP=r6;return}r8=(r7&2|0)!=0;if(r8&(HEAP32[1311074]|0)!=0){STACKTOP=r6;return}r9=HEAP32[1315729];r10=HEAP32[1315964];do{if((r9|0)!=0&(r10|0)!=0&(r10|0)==(r9|0)){if((HEAP32[r9+332>>2]|0)!=(HEAP32[1315731]|0)){break}if((r4+r1|0)!=(HEAP32[1315730]|0)){break}STACKTOP=r6;return}}while(0);r9=(r7&32|0)==0;r11=(r7&51|0)==32?HEAP32[_stdout>>2]:HEAP32[_stderr>>2];if((r10|0)!=0){HEAP32[1315729]=r10;HEAP32[1315731]=HEAP32[r10+332>>2];HEAP32[1315730]=r4+r1|0}_fputc(10,r11);r10=HEAP32[1315966];if((r10|0)!=0){HEAP32[r10+12>>2]=r4+r1|0}r10=(r7&16|0)!=0;if(r10){_fwrite(5271144,6,1,r11)}do{if((r7&1|0)==0){if(r8){_fwrite(5271004,7,1,r11);break}if(r9){break}_fwrite(5270980,7,1,r11)}else{r12=HEAP32[1315728]+1|0;HEAP32[1315728]=r12;r13=HEAP32[1315445];if((r13|0)!=0&(r12|0)>(r13|0)){_fwrite(5271088,40,1,r11);_leave()}_fwrite(5271076,5,1,r11)}}while(0);_fprintf(r11,5270944,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r4+r1|0,tempInt));r4=(r7&256|0)==0;r7=HEAP32[1315964];if(r4&(r7|0)!=0){r9=HEAP32[r7+8>>2];_fprintf(r11,5270912,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r7+332>>2],HEAP32[tempInt+4>>2]=r9,tempInt))}_fwrite(5270804,2,1,r11);_fprintf(r11,HEAP32[r3+(r1<<3)>>2],r2);_fputc(10,r11);r2=HEAP32[1315964];do{if(r4&(r2|0)!=0){r1=HEAP32[r2>>2];L2024:do{if((r1|0)!=0){r3=r2;r9=r1;while(1){if((HEAP32[r3+28>>2]|0)>-1){_fwrite(5270888,7,1,r11)}else{_fwrite(5270868,9,1,r11)}r7=HEAP32[r9+8>>2];_fprintf(r11,5270836,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r3+4>>2],HEAP32[tempInt+4>>2]=r7,tempInt));r7=HEAP32[r9>>2];if((r7|0)==0){break L2024}else{r3=r9;r9=r7}}}}while(0);r1=HEAP32[1311027];if((r1|0)==0){do{if((HEAP32[1315960]|0)==0){r9=_malloc(4096);r3=r9;if((r9|0)!=0){r14=r3;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=r3}else{r3=_malloc(4104);if((r3|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r3+8|0;HEAP32[r3+4>>2]=4096;_memset(r9,-35,4096);r14=r9}}while(0);r9=r14;HEAP32[1311027]=r9;r15=r9}else{r15=r1}r9=HEAP32[1315964];r3=HEAP32[r9+12>>2];r7=r15+4095|0;r8=HEAP32[r9+332>>2];r9=r15;r13=r3;r12=HEAP8[r3];L2043:while(1){r3=r13+1|0;r16=r12<<24>>24==10;do{if(r12<<24>>24==13|r12<<24>>24==10){r17=r8-1|0;if((r17|0)==0){r5=1523;break L2043}r18=r17;r19=HEAP32[1311027];r20=(HEAP8[r3]<<24>>24|0)==((r16?13:10)|0)?r13+2|0:r3}else{if(r9>>>0>=r7>>>0){r18=r8;r19=r9;r20=r3;break}HEAP8[r9]=r12;r18=r8;r19=r9+1|0;r20=r3}}while(0);r3=HEAP8[r20];if(r3<<24>>24==0){r5=1528;break}else{r8=r18;r9=r19;r13=r20;r12=r3}}if(r5==1528){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=64,HEAP32[tempInt+8>>2]=5270732,tempInt));break}else if(r5==1523){HEAP8[r9]=0;_fprintf(r11,5270788,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1311027],tempInt));break}}}while(0);if(!r10){STACKTOP=r6;return}_fwrite(5270808,12,1,r11);_leave();STACKTOP=r6;return}function _syntax_error(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP32[r4>>2]=r2;_error(r1,HEAP32[r4>>2],5242920,1001);STACKTOP=r3;return}function _cpu_error(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP32[r4>>2]=r2;_error(r1,HEAP32[r4>>2],5263880,2001);STACKTOP=r3;return}function _output_error(r1,r2){var r3,r4;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3;HEAP32[r4>>2]=r2;_error(r1,HEAP32[r4>>2],5244196,3001);STACKTOP=r3;return}function _disable_warning(r1){var r2,r3,r4,r5;r2=STACKTOP;if((r1|0)>3e3){r3=r1-3001|0;do{if((r3|0)>-1&(r3|0)<(HEAP32[1311048]|0)){r4=(r3<<3)+5244200|0;r5=HEAP32[r4>>2];if((r5&2|0)==0){break}HEAP32[r4>>2]=r5|64;STACKTOP=r2;return}}while(0);_general_error(33,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}if((r1|0)>2e3){r3=r1-2001|0;do{if((r3|0)>-1&(r3|0)<(HEAP32[1315969]|0)){r5=(r3<<3)+5263884|0;r4=HEAP32[r5>>2];if((r4&2|0)==0){break}HEAP32[r5>>2]=r4|64;STACKTOP=r2;return}}while(0);_general_error(33,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}if((r1|0)>1e3){r3=r1-1001|0;do{if((r3|0)>-1&(r3|0)<(HEAP32[1310729]|0)){r4=(r3<<3)+5242924|0;r5=HEAP32[r4>>2];if((r5&2|0)==0){break}HEAP32[r4>>2]=r5|64;STACKTOP=r2;return}}while(0);_general_error(33,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}if((r1|0)<=0){STACKTOP=r2;return}r3=r1-1|0;do{if((r3|0)<(HEAP32[1315562]|0)){r5=(r3<<3)+5262256|0;r4=HEAP32[r5>>2];if((r4&2|0)==0){break}HEAP32[r5>>2]=r4|64;STACKTOP=r2;return}}while(0);_general_error(33,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}function _escape(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=STACKTOP;r4=r1+1|0;if(HEAP8[r1]<<24>>24!=92){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=42,HEAP32[tempInt+8>>2]=5269184,tempInt))}L2103:do{if((HEAP32[1315727]|0)==0){HEAP8[r2]=92;r5=r4}else{r6=HEAP8[r4]<<24>>24;if((r6|0)==34){HEAP8[r2]=34;r5=r1+2|0;break}else if((r6|0)==39){HEAP8[r2]=39;r5=r1+2|0;break}else if((r6|0)==101){HEAP8[r2]=27;r5=r1+2|0;break}else if((r6|0)==116){HEAP8[r2]=9;r5=r1+2|0;break}else if((r6|0)==110){HEAP8[r2]=10;r5=r1+2|0;break}else if((r6|0)==48|(r6|0)==49|(r6|0)==50|(r6|0)==51|(r6|0)==52|(r6|0)==53|(r6|0)==54|(r6|0)==55){HEAP8[r2]=0;r7=HEAP8[r4];if((r7-48&255)<8){r8=r4;r9=r7;r10=0}else{r5=r4;break}while(1){r7=(r10<<3)+(r9-48&255)&255;HEAP8[r2]=r7;r11=r8+1|0;r12=HEAP8[r11];if((r12-48&255)<8){r8=r11;r9=r12;r10=r7}else{r5=r11;break L2103}}}else if((r6|0)==120|(r6|0)==88){HEAP8[r2]=0;r11=r1+2|0;r7=HEAP8[r11];if((r7-48&255)<10|(r7-97&255)<6|(r7-65&255)<6){r13=r11;r14=r7;r15=0}else{r5=r11;break}while(1){r11=r14-48&255;do{if((r11&255)<10){r7=(r15<<4)+r11&255;HEAP8[r2]=r7;r16=r7}else{r7=(r15<<4)+r14&255;if((r14-97&255)<6){r12=r7-87&255;HEAP8[r2]=r12;r16=r12;break}else{r12=r7-55&255;HEAP8[r2]=r12;r16=r12;break}}}while(0);r11=r13+1|0;r12=HEAP8[r11];if((r12-48&255)<10|(r12-97&255)<6|(r12-65&255)<6){r13=r11;r14=r12;r15=r16}else{r5=r11;break L2103}}}else if((r6|0)==114){HEAP8[r2]=13;r5=r1+2|0;break}else if((r6|0)==92){HEAP8[r2]=92;r5=r1+2|0;break}else if((r6|0)==98){HEAP8[r2]=8;r5=r1+2|0;break}else if((r6|0)==102){HEAP8[r2]=12;r5=r1+2|0;break}else{_general_error(35,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt));r5=r4;break}}}while(0);STACKTOP=r3;return r5}function _parse_name(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=r1>>2;r1=STACKTOP;r3=HEAP32[r2];r4=HEAP8[r3];if(r4<<24>>24==34|r4<<24>>24==39){r5=r3+1|0;r6=r5;while(1){r7=HEAP8[r6];if(r7<<24>>24==0|r7<<24>>24==r4<<24>>24){break}else{r6=r6+1|0}}r7=r6-r5|0;r8=r7+1|0;do{if((HEAP32[1315960]|0)==0){r9=_malloc(r8);r10=r9;if((r9|0)!=0){r11=r10;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r11=r10}else{r10=_malloc(r7+9|0);if((r10|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r10+8|0;HEAP32[r10+4>>2]=r8;_memset(r9,-35,r8);r11=r9}}while(0);r8=r11;_memcpy(r8,r5,r7);HEAP8[r8+r7|0]=0;if(HEAP8[r6]<<24>>24==0){r12=r8;r13=r6;HEAP32[r2]=r13;STACKTOP=r1;return r12}else{r14=r6}while(1){r6=r14+1|0;if((_isspace(HEAPU8[r6])|0)==0){r12=r8;r13=r6;break}else{r14=r6}}HEAP32[r2]=r13;STACKTOP=r1;return r12}else{r15=r3;r16=r4}while(1){if(r16<<24>>24==0){break}if((_isspace(r16&255)|0)!=0){break}r4=HEAP8[r15];r14=r15+1|0;if(!(r4<<24>>24!=44&r4<<24>>24!=HEAP8[5264164]<<24>>24)){break}r15=r14;r16=HEAP8[r14]}if((r15|0)==(r3|0)){r12=0;r13=r3;HEAP32[r2]=r13;STACKTOP=r1;return r12}r16=r15-r3|0;r14=r16+1|0;do{if((HEAP32[1315960]|0)==0){r4=_malloc(r14);r8=r4;if((r4|0)!=0){r17=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r8}else{r8=_malloc(r16+9|0);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r8+8|0;HEAP32[r8+4>>2]=r14;_memset(r4,-35,r14);r17=r4}}while(0);r14=r17;_memcpy(r14,r3,r16);HEAP8[r14+r16|0]=0;r16=r15;while(1){if((_isspace(HEAPU8[r16])|0)==0){r12=r14;r13=r16;break}else{r16=r16+1|0}}HEAP32[r2]=r13;STACKTOP=r1;return r12}function _parse_identifier(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;r3=HEAP32[r1>>2];r4=HEAP8[r3];do{if(r4<<24>>24==46|r4<<24>>24==95){r5=r3}else{if((_isalpha(r4&255)|0)==0){r6=0}else{r5=r3;break}STACKTOP=r2;return r6}}while(0);while(1){r7=r5+1|0;r4=HEAP8[r7];if(r4<<24>>24==95){r5=r7;continue}if((_isalnum(r4&255)|0)==0){break}else{r5=r7}}if((r7|0)==0){r6=0;STACKTOP=r2;return r6}HEAP32[r1>>2]=r7;r1=r7-r3|0;r7=r1+1|0;do{if((HEAP32[1315960]|0)==0){r5=_malloc(r7);r4=r5;if((r5|0)!=0){r8=r4;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r4}else{r4=_malloc(r1+9|0);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r4+8|0;HEAP32[r4+4>>2]=r7;_memset(r5,-35,r7);r8=r5}}while(0);r7=r8;_memcpy(r7,r3,r1);HEAP8[r7+r1|0]=0;r6=r7;STACKTOP=r2;return r6}function _parse_string(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r4;r6=r4+4;r7=HEAP32[r1>>2];if((r3&7|0)!=0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=225,HEAP32[tempInt+8>>2]=5269184,tempInt))}r8=r3>>3;r3=r2<<24>>24;do{if(HEAP8[r7]<<24>>24==r2<<24>>24){r9=0;r10=r7+1|0;break}else{_general_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r9=0;r10=r7;break}}while(0);L2197:while(1){r11=HEAP8[r10];do{if(r11<<24>>24==0){r12=r10;break L2197}else if(r11<<24>>24==92){r13=_escape(r10,r5)}else{r14=r10+1|0;if(r11<<24>>24!=r2<<24>>24){r13=r14;break}if(HEAP8[r14]<<24>>24!=r2<<24>>24){r12=r14;break L2197}r13=r10+2|0}}while(0);r9=r9+1|0;r10=r13}if(HEAP8[r12-1|0]<<24>>24!=r2<<24>>24){_general_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt))}if((r9|0)==1){r15=0;STACKTOP=r4;return r15}do{if((HEAP32[1315960]|0)==0){r3=_malloc(12);r12=r3;if((r3|0)!=0){r16=r12;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r16=r12}else{r12=_malloc(20);if((r12|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r12+8|0,r13=r3>>2;HEAP32[r12+4>>2]=12;HEAP32[r13]=-572662307;HEAP32[r13+1]=-572662307;HEAP32[r13+2]=-572662307;r16=r3}}while(0);r3=r16;r13=r16+4|0;HEAP32[r13>>2]=0;HEAP32[r16+8>>2]=0;r12=Math.imul(r9,r8);HEAP32[r16>>2]=r12;if((r12|0)==0){r17=0}else{do{if((HEAP32[1315960]|0)==0){r16=_malloc(r12);r9=r16;if((r16|0)!=0){r18=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r18=r9}else{r9=_malloc(r12+8|0);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r16=r9+8|0;HEAP32[r9+4>>2]=r12;_memset(r16,-35,r12);r18=r16}}while(0);r17=r18}HEAP32[r13>>2]=r17;r13=r8>>>0>8;r18=(r8|0)==0;r12=HEAP8[r7]<<24>>24==r2<<24>>24?r7+1|0:r7;r7=r17;L2231:while(1){r17=HEAP8[r12];do{if(r17<<24>>24==92){r19=_escape(r12,r6);r20=HEAP8[r6]}else if(r17<<24>>24==0){r21=r12;break L2231}else{r16=r12+1|0;HEAP8[r6]=r17;if(r17<<24>>24!=r2<<24>>24){r19=r16;r20=r17;break}if(HEAP8[r16]<<24>>24!=r2<<24>>24){r21=r16;break L2231}r19=r12+2|0;r20=r2}}while(0);if(r13){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=148,HEAP32[tempInt+8>>2]=5268944,tempInt))}L2242:do{if(!r18){r17=r8;r16=0;r9=r20&255;r10=r7;while(1){r5=r17-1|0;HEAP8[r10]=r9&255;r11=r9>>>8|r16<<24;if((r5|0)==0){break L2242}else{r17=r5;r16=r16>>>8|0<<24;r9=r11;r10=r10+1|0}}}}while(0);r12=r19;r7=r7+r8|0}HEAP32[r1>>2]=r21;r15=r3;STACKTOP=r4;return r15}function _include_binary_file(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r4=STACKTOP;r5=_mystrdup(r1);r1=_locate_file(r5,5270628);if((r1|0)!=0){r6=_ftell(r1);do{if((r6|0)>-1){if((_fseek(r1,0,2)|0)<=-1){break}r7=_ftell(r1);if((r7|0)<=-1){break}if(!((_fseek(r1,r6,0)|0)>-1&(r7|0)>0)){break}if((r2|0)<0|(r7|0)<(r2|0)){_general_error(46,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}do{if((HEAP32[1315960]|0)==0){r8=_malloc(12);r9=r8;if((r8|0)!=0){r10=r9,r11=r10>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9,r11=r10>>2}else{r9=_malloc(20);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r9+8|0,r12=r8>>2;HEAP32[r9+4>>2]=12;HEAP32[r12]=-572662307;HEAP32[r12+1]=-572662307;HEAP32[r12+2]=-572662307;r10=r8,r11=r10>>2}}while(0);r8=(r10+4|0)>>2;HEAP32[r8]=0;HEAP32[r11+2]=0;r12=r7-r2|0;HEAP32[r11]=r12>>>0<r3>>>0|(r3|0)==0?r12:r3;do{if((HEAP32[1315960]|0)==0){r12=_malloc(r7);r9=r12;if((r12|0)!=0){r13=r9;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r13=r9}else{r9=_malloc(r7+8|0);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r12=r9+8|0;HEAP32[r9+4>>2]=r7;_memset(r12,-35,r7);r13=r12}}while(0);HEAP32[r8]=r13;if((r2|0)>0){_fseek(r1,r2,0);r14=HEAP32[r8]}else{r14=r13}_fread(r14,1,HEAP32[r11],r1);do{if((HEAP32[1315960]|0)==0){r7=_malloc(28);r12=r7;if((r7|0)!=0){r15=r12,r16=r15>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r15=r12,r16=r15>>2}else{r12=_malloc(36);if((r12|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r12+8|0,r9=r7>>2;HEAP32[r12+4>>2]=28;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;HEAP32[r9+4]=-572662307;HEAP32[r9+5]=-572662307;HEAP32[r9+6]=-572662307;r15=r7,r16=r15>>2}}while(0);HEAP32[r16]=0;HEAP32[r16+1]=2;HEAP32[r16+2]=1;HEAP32[r16+6]=r10;_add_atom(0,r15)}}while(0);_fclose(r1)}if((r5|0)==0){STACKTOP=r4;return}if((HEAP32[1315960]|0)==0){_free(r5);STACKTOP=r4;return}else{_memset(r5,-1,HEAP32[r5-4>>2]);_free(r5-8|0);STACKTOP=r4;return}}function _new_macro(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=0;r5=STACKTOP;if(!((HEAP32[1315965]|0)==0&(HEAP32[1315964]|0)!=0&(HEAP32[1315755]|0)==0)){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=460,HEAP32[tempInt+8>>2]=5269184,tempInt));r6=0;STACKTOP=r5;return r6}do{if((HEAP32[1315960]|0)==0){r7=_malloc(20);r8=r7;if((r7|0)!=0){r9=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r8}else{r8=_malloc(28);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r8+8|0,r10=r7>>2;HEAP32[r8+4>>2]=20;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;HEAP32[r10+4]=-572662307;r9=r7}}while(0);r7=r9;r10=_mystrdup(r1);HEAP32[r9+4>>2]=r10;L2309:do{if((HEAP32[1311072]|0)!=0){r1=HEAP8[r10];if(r1<<24>>24==0){break}else{r11=r10;r12=r1}while(1){HEAP8[r11]=_tolower(r12&255)&255;r1=r11+1|0;r8=HEAP8[r1];if(r8<<24>>24==0){break L2309}else{r11=r1;r12=r8}}}}while(0);HEAP32[r9+8>>2]=HEAP32[HEAP32[1315964]+328>>2];r12=r9+16|0;HEAP32[r12>>2]=0;HEAP32[1315965]=r7;HEAP32[1315755]=r2;if((r2|0)==0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=347,HEAP32[tempInt+8>>2]=5269184,tempInt))}r9=HEAP8[r2|0];r11=r9&255;L2317:do{if(r9<<24>>24==0){r13=r11}else{r10=r2;r8=r11;r1=r9;while(1){r14=r1&255;r15=r14>>>0<r8>>>0?r14:r8;r14=r10+8|0;r16=HEAP8[r14|0];if(r16<<24>>24==0){r13=r15;break L2317}else{r10=r14;r8=r15;r1=r16}}}}while(0);HEAP32[1315754]=r13;HEAP32[1310809]=-1;HEAP32[1310802]=0;if((r3|0)==0){r6=r7;STACKTOP=r5;return r6}else{r17=r3}while(1){if((_isspace(HEAPU8[r17])|0)==0){break}else{r17=r17+1|0}}r3=r12;r13=r17;L2326:while(1){r17=HEAP8[r13];if(r17<<24>>24==92){r9=r13+1|0;r18=r9;r19=HEAP8[r9]}else if(r17<<24>>24==0){r6=r7;break}else{r18=r13;r19=r17}do{if(r19<<24>>24==46|r19<<24>>24==95){r20=r18;r4=1741}else{if((_isalpha(r19&255)|0)==0){r4=1757;break}else{r20=r18;r4=1741;break}}}while(0);do{if(r4==1741){while(1){r4=0;r21=r20+1|0;r17=HEAP8[r21];if(r17<<24>>24==95){r20=r21;r4=1741;continue}if((_isalnum(r17&255)|0)==0){break}else{r20=r21;r4=1741}}if((r21|0)==0|(r21|0)==(r18|0)){r4=1757;break}r17=HEAP32[r3>>2];do{if((r17|0)==0){r22=0}else{r9=2;r11=r17;while(1){r2=HEAP32[r11>>2];if((r2|0)==0){break}else{r9=r9+1|0;r11=r2}}if((r9|0)<=35){r22=r11;break}_general_error(27,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=35,tempInt));r22=r11}}while(0);r17=r21-r18|0;r2=r17+8|0;do{if((HEAP32[1315960]|0)==0){r1=_malloc(r2);r8=r1;if((r1|0)!=0){r23=r8;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r23=r8}else{r8=_malloc(r17+16|0);if((r8|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=r8+8|0;HEAP32[r8+4>>2]=r2;_memset(r1,-35,r2);r23=r1}}while(0);HEAP32[r23>>2]=0;_memcpy(r23+4|0,r18,r17);HEAP8[r17+(r23+4)|0]=0;if((r22|0)==0){HEAP32[r12>>2]=r23;r24=r21;break}else{HEAP32[r22>>2]=r23;r24=r21;break}}}while(0);do{if(r4==1757){r4=0;_general_error(42,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r24=r18;break}}while(0);while(1){r25=r24+1|0;if((_isspace(HEAPU8[r24])|0)==0){break}else{r24=r25}}if(HEAP8[r24]<<24>>24==44){r26=r25}else{r13=r24;continue}while(1){if((_isspace(HEAPU8[r26])|0)==0){r13=r26;continue L2326}else{r26=r26+1|0}}}STACKTOP=r5;return r6}function _execute_macro(r1,r2,r3,r4,r5,r6,r7){var r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42;r5=0;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r4;r8=r4+4;r9=HEAP32[1315447];do{if((HEAP32[1311072]|0)==0){if((HEAP32[1311073]|0)!=0){if((_find_namelen_nc(r9,r1,r2,r3)|0)==0){r10=0}else{break}STACKTOP=r4;return r10}L2373:do{if((r2|0)==0){r11=5381}else{r12=r1;r13=r2;r14=5381;while(1){r15=r13-1|0;r16=HEAPU8[r12]+(r14*33&-1)|0;if((r15|0)==0){r11=r16;break L2373}else{r12=r12+1|0;r13=r15;r14=r16}}}}while(0);r14=HEAP32[HEAP32[r9>>2]+((r11>>>0)%(HEAP32[r9+4>>2]>>>0)<<2)>>2];if((r14|0)==0){r10=0;STACKTOP=r4;return r10}r13=r9+8|0;r12=r14,r14=r12>>2;while(1){r16=HEAP32[r14];if((_strncmp(r1,r16,r2)|0)==0){if(HEAP8[r16+r2|0]<<24>>24==0){r5=1775;break}}HEAP32[r13>>2]=HEAP32[r13>>2]+1|0;r16=HEAP32[r14+2];if((r16|0)==0){r10=0;r5=1826;break}else{r12=r16,r14=r12>>2}}if(r5==1775){HEAP32[r3>>2]=HEAP32[r14+1];break}else if(r5==1826){STACKTOP=r4;return r10}}else{if((_find_namelen_nc(r9,r1,r2,r3)|0)==0){r10=0}else{break}STACKTOP=r4;return r10}}while(0);r2=HEAP32[r3>>2]>>2;r3=_new_source(HEAP32[r2+1],HEAP32[r2+2],HEAP32[r2+3]),r1=r3>>2;r9=r6;while(1){if((_isspace(HEAPU8[r9])|0)==0){break}else{r9=r9+1|0}}r6=HEAP8[r9];r11=HEAP8[5264164];L2392:do{if(r6<<24>>24!=r11<<24>>24&r6<<24>>24!=0&(HEAP32[1315444]|0)>0){r12=r9;r13=0;r16=r6;r15=r11;while(1){r17=r13+1|0;do{if(r16<<24>>24==34|r16<<24>>24==39){r18=(r17<<2)+r3+32|0;HEAP32[r18>>2]=r12;r19=HEAP8[r12];r20=r12+1|0;L2397:while(1){r21=HEAP8[r20];do{if(r21<<24>>24==92){r22=r20+1|0;if(HEAP8[r22]<<24>>24==0){r23=r22;break}r20=_escape(r20,r8);continue L2397}else if(r21<<24>>24==0){r24=r20;break L2397}else{r23=r20+1|0}}while(0);if(r21<<24>>24!=r19<<24>>24){r20=r23;continue}if(HEAP8[r23]<<24>>24!=r19<<24>>24){r24=r23;break}r20=r20+2|0}HEAP32[((r17<<2)+176>>2)+r1]=r24-HEAP32[r18>>2]|0;r25=r24;break}else if(r16<<24>>24==60){r20=r12+1|0;r19=(r17<<2)+r3+32|0;HEAP32[r19>>2]=r20;r22=r20;while(1){r20=HEAP8[r22];if(r20<<24>>24==0){r5=1795;break}else if(r20<<24>>24!=62){r22=r22+1|0;continue}r20=r22+1|0;if(HEAP8[r20]<<24>>24==62){r26=r20;r27=62;r28=r22}else{r29=r20;break}while(1){HEAP8[r28]=r27;r30=r26+1|0;r31=HEAP8[r30];if(r31<<24>>24==0){break}else{r28=r26;r26=r30;r27=r31}}HEAP8[r26]=0;r22=r20}if(r5==1795){r5=0;r29=r22+1|0}HEAP32[((r17<<2)+176>>2)+r1]=r22-HEAP32[r19>>2]|0;r25=HEAP8[r22]<<24>>24==62?r29:r22;break}else{r18=(r17<<2)+r3+32|0;HEAP32[r18>>2]=r12;r21=r12;r31=0;r30=r15;while(1){r32=HEAP8[r21];r33=(r32<<24>>24==40&1)+r31|0;do{if(r32<<24>>24==41){if((r33|0)>0){r34=r33-1|0;r35=r30;break}else{_syntax_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r34=r33;r35=HEAP8[5264164];break}}else{r34=r33;r35=r30}}while(0);if(r32<<24>>24==0|r32<<24>>24==r35<<24>>24){break}if(r32<<24>>24==44&(r34|0)==0){break}else{r21=r21+1|0;r31=r34;r30=r35}}do{if((r34|0)==0){r36=r21}else{_syntax_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r36=r21;break}}while(0);while(1){r21=r36-1|0;if((_isspace(HEAPU8[r21])|0)==0){break}else{r36=r21}}HEAP32[((r17<<2)+176>>2)+r1]=r36-HEAP32[r18>>2]|0;r25=r36;break}}while(0);while(1){r37=r25+1|0;if((_isspace(HEAPU8[r25])|0)==0){break}else{r25=r37}}r21=HEAP8[r25];if(r21<<24>>24==44){r38=r37}else{r39=r17;r40=r25;r41=r21;break L2392}while(1){if((_isspace(HEAPU8[r38])|0)==0){break}else{r38=r38+1|0}}r21=HEAP8[r38];r30=HEAP8[5264164];if(r21<<24>>24!=r30<<24>>24&r21<<24>>24!=0&(r17|0)<(HEAP32[1315444]|0)){r12=r38;r13=r17;r16=r21;r15=r30}else{r39=r17;r40=r38;r41=r21;break L2392}}}else{r39=0;r40=r9;r41=r6}}while(0);r6=r40;r40=r41;while(1){r41=r6+1|0;if((_isspace(r40&255)|0)==0){break}r6=r41;r40=HEAP8[r41]}r40=HEAP8[r6];if(!(r40<<24>>24==0|r40<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r40=HEAP32[1315444];if((r39|0)<(r40|0)){r42=r39}else{_general_error(27,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r40-1|0,tempInt));r42=HEAP32[1315444]-1|0}HEAP32[r1+7]=r42;HEAP32[r1+80]=HEAP32[r2+4];HEAP32[r1+6]=r7;HEAP32[1315964]=r3;r10=1;STACKTOP=r4;return r10}function _find_structure(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4;r6=HEAP32[1310783];do{if((HEAP32[1311073]|0)==0){L2456:do{if((r2|0)==0){r7=5381}else{r8=r1;r9=r2;r10=5381;while(1){r11=r9-1|0;r12=HEAPU8[r8]+(r10*33&-1)|0;if((r11|0)==0){r7=r12;break L2456}else{r8=r8+1|0;r9=r11;r10=r12}}}}while(0);r10=HEAP32[HEAP32[r6>>2]+((r7>>>0)%(HEAP32[r6+4>>2]>>>0)<<2)>>2];if((r10|0)==0){r13=0;STACKTOP=r4;return r13}r9=r6+8|0;r8=r10,r10=r8>>2;while(1){r12=HEAP32[r10];if((_strncmp(r1,r12,r2)|0)==0){if(HEAP8[r12+r2|0]<<24>>24==0){r3=1835;break}}HEAP32[r9>>2]=HEAP32[r9>>2]+1|0;r12=HEAP32[r10+2];if((r12|0)==0){r13=0;r3=1843;break}else{r8=r12,r10=r8>>2}}if(r3==1843){STACKTOP=r4;return r13}else if(r3==1835){r8=HEAP32[r10+1];HEAP32[r5>>2]=r8;r14=r8;break}}else{if((_find_namelen_nc(r6,r1,r2,r5)|0)==0){r13=0;STACKTOP=r4;return r13}else{r14=HEAP32[r5>>2];break}}}while(0);r13=r14;STACKTOP=r4;return r13}function _read_next_line(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+1028|0;r3=r2;r4=r2+1024;while(1){r5=HEAP32[1315964],r6=r5>>2;r7=HEAP32[r6+3];r8=HEAP32[r6+4];r9=r7+r8|0;r10=HEAP32[r6+82];if(r10>>>0<r9>>>0){if(HEAP8[r10]<<24>>24!=0){break}}r10=r5+20|0;r6=HEAP32[r10>>2]-1|0;HEAP32[r10>>2]=r6;r10=HEAP32[1315964]>>2;if((r6|0)!=0){HEAP32[r10+82]=HEAP32[r10+3];HEAP32[HEAP32[1315964]+332>>2]=0;continue}r6=HEAP32[r10+84];do{if((r6|0)!=0){if((HEAP32[1315960]|0)==0){_free(r6);break}else{_memset(r6,-1,HEAP32[r6-4>>2]);_free(r6-8|0);break}}}while(0);HEAP32[HEAP32[1315964]+336>>2]=0;r6=HEAP32[HEAP32[1315964]>>2];if((r6|0)==0){r11=0;r1=2023;break}HEAP32[1315964]=r6}if(r1==2023){STACKTOP=r2;return r11}r6=r5+332|0;HEAP32[r6>>2]=HEAP32[r6>>2]+1|0;r6=HEAP32[1315964]>>2;r5=HEAP32[r6+82];r10=HEAP32[r6+84];r12=HEAP32[r6+7];r13=HEAP32[1315755];L2496:do{if((r13|0)==0){r14=r5;r15=0}else{r16=r9;r17=HEAP32[1315754];if((r16-r5|0)>>>0<=r17>>>0){r14=r5;r15=0;break}if((r12|0)>-1&(HEAP32[1315965]|0)!=0){_general_error(26,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r6+2],tempInt));r18=HEAP32[1315754];r19=HEAP32[1315755]}else{r18=r17;r19=r13}L2502:do{if(r5>>>0>(r7+(r8-r18)|0)>>>0){r20=r5;r21=r19;r1=1910}else{r17=r7+(r8-1)|0;r22=1;r23=r5;r24=r19;L2504:while(1){r25=r16-r23|0;r26=HEAP8[r24|0];L2506:do{if(r26<<24>>24==0){r1=1872}else{r27=r24;r28=r26;L2507:while(1){r29=r28&255;L2509:do{if(r29>>>0<=r25>>>0){r30=HEAP32[r27+4>>2];L2511:do{if(r28<<24>>24!=0){r31=r29-1|0;r32=HEAP8[r23];L2513:do{if((r31|0)==0){r33=r32;r34=r30}else{r35=r23;r36=r30;r37=r31;r38=r32;while(1){r39=(_tolower(r38&255)|0)==(_tolower(HEAPU8[r36])|0);r40=HEAP8[r35];if(!r39){r33=r40;r34=r36;break L2513}if(r40<<24>>24==0){break L2511}r40=r35+1|0;r39=r36+1|0;r41=r37-1|0;r42=HEAP8[r40];if((r41|0)==0){r33=r42;r34=r39;break L2513}else{r35=r40;r36=r39;r37=r41;r38=r42}}}}while(0);if((_tolower(r33&255)|0)!=(_tolower(HEAPU8[r34])|0)){break L2509}}}while(0);if((_isspace(HEAPU8[r23+r29|0])|0)!=0){break L2507}}}while(0);r29=r27+8|0;r30=HEAP8[r29|0];if(r30<<24>>24==0){r1=1872;break L2506}else{r27=r29;r28=r30}}r43=HEAP32[1315965];r28=(r43|0)==0;if((r27|0)==0){r44=r28;r1=1881;break}if(!r28){break L2504}r28=r22-1|0;if((r28|0)==0){r1=1880;break L2504}else{r45=r23;r46=r28;break}}}while(0);do{if(r1==1872){r1=0;r44=(HEAP32[1315965]|0)==0;r1=1881;break}}while(0);L2526:do{if(r1==1881){r1=0;r26=HEAP32[1310801];if(!(r44&(r26|0)!=0)){r45=r23;r46=r22;break}r28=HEAP8[r26|0];if(r28<<24>>24==0){r45=r23;r46=r22;break}else{r47=r26;r48=r28}L2529:while(1){r28=r48&255;L2531:do{if(r28>>>0<=r25>>>0){r26=HEAP32[r47+4>>2];L2533:do{if(r48<<24>>24!=0){r30=r28-1|0;r29=HEAP8[r23];L2535:do{if((r30|0)==0){r49=r29;r50=r26}else{r32=r23;r31=r26;r38=r30;r37=r29;while(1){r36=(_tolower(r37&255)|0)==(_tolower(HEAPU8[r31])|0);r35=HEAP8[r32];if(!r36){r49=r35;r50=r31;break L2535}if(r35<<24>>24==0){break L2533}r35=r32+1|0;r36=r31+1|0;r42=r38-1|0;r41=HEAP8[r35];if((r42|0)==0){r49=r41;r50=r36;break L2535}else{r32=r35;r31=r36;r38=r42;r37=r41}}}}while(0);if((_tolower(r49&255)|0)!=(_tolower(HEAPU8[r50])|0)){break L2531}}}while(0);if((_isspace(HEAPU8[r23+r28|0])|0)!=0){break L2529}}}while(0);r28=r47+8|0;r26=HEAP8[r28|0];if(r26<<24>>24==0){r45=r23;r46=r22;break L2526}else{r47=r28;r48=r26}}if((r47|0)==0){r45=r23;r46=r22;break}r45=r23+HEAPU8[r47|0]|0;r46=r22+1|0}}while(0);r25=HEAP8[r45];if(r25<<24>>24==34|r25<<24>>24==39){r26=r45+1|0;r28=r7+(r8-HEAP32[1315754])|0;L2548:do{if(r26>>>0>r28>>>0){r51=r26}else{r29=r45;r30=r26;while(1){r37=HEAP8[r30];if(r37<<24>>24==r25<<24>>24){r51=r30;break L2548}if(r37<<24>>24==13|r37<<24>>24==10){r51=r30;break L2548}r38=r37<<24>>24==92?r29+2|0:r30;r37=r38+1|0;if(r37>>>0>r28>>>0){r51=r37;break L2548}else{r29=r38;r30=r37}}}}while(0);r52=r51;r53=HEAP8[r51]}else{r52=r45;r53=r25}L2555:do{if(r53<<24>>24==HEAP8[5264164]<<24>>24&r52>>>0<r9>>>0){r28=r52;r26=r53;while(1){if(r26<<24>>24==0|r26<<24>>24==10|r26<<24>>24==13){r54=r28;r55=r26;break L2555}r30=r28+1|0;r29=HEAP8[r30];if(r30>>>0<r9>>>0){r28=r30;r26=r29}else{r54=r30;r55=r29;break L2555}}}else{r54=r52;r55=r53}}while(0);do{if(r55<<24>>24==10){HEAP32[HEAP32[1315964]+328>>2]=r54+1|0;r25=HEAP32[1315964]+332|0;HEAP32[r25>>2]=HEAP32[r25>>2]+1|0}else if(r55<<24>>24==13){if(HEAP8[r54-1|0]<<24>>24==10){break}r25=r54+1|0;if(r54>>>0<r17>>>0){if(HEAP8[r25]<<24>>24==10){break}}HEAP32[HEAP32[1315964]+328>>2]=r25;r25=HEAP32[1315964]+332|0;HEAP32[r25>>2]=HEAP32[r25>>2]+1|0}}while(0);r25=r54+1|0;r26=HEAP32[1315755];if(r25>>>0>(r7+(r8-HEAP32[1315754])|0)>>>0){r20=r25;r21=r26;r1=1910;break L2502}else{r22=r46;r23=r25;r24=r26}}if(r1==1880){r24=r23+HEAPU8[r27|0]|0;HEAP32[1315755]=0;r56=r23;r57=r24;break}r24=HEAP32[1315964];if((r24|0)==0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=649,HEAP32[tempInt+8>>2]=5269184,tempInt))}else{HEAP32[r43+12>>2]=HEAP32[r24+328>>2]-HEAP32[r43+8>>2]|0;HEAP32[HEAP32[1315965]>>2]=HEAP32[1315722];r24=HEAP32[1315965];HEAP32[1315722]=r24;HEAP32[r4>>2]=r24;_add_hashentry(HEAP32[1315447],HEAP32[r24+4>>2],r4);HEAP32[1315965]=0}r24=r23+HEAPU8[r27|0]|0;HEAP32[1315755]=0;r56=0;r57=r24;break}}while(0);do{if(r1==1910){if((r21|0)==0){r56=0;r57=r20;break}r16=HEAP32[1315965];if((r16|0)==0){_general_error(32,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r56=0;r57=r20;break}else{_general_error(25,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r16+4>>2],tempInt));r56=0;r57=r20;break}}}while(0);if(r57>>>0<r9>>>0){r58=r57}else{r14=r57;r15=r56;break}while(1){r16=HEAP8[r58];if(r16<<24>>24==0|r16<<24>>24==10|r16<<24>>24==13){r14=r58;r15=r56;break L2496}r16=r58+1|0;if(r16>>>0<r9>>>0){r58=r16}else{r14=r16;r15=r56;break L2496}}}}while(0);L2586:do{if(r14>>>0<r9>>>0){r56=(r12|0)>-1;r58=r7+(r8-1)|0;r57=4095;r20=r10;r21=r14;L2588:while(1){r27=HEAP32[1315964],r4=r27>>2;r43=r27+328|0;L2590:do{if(r56){r46=r21;while(1){r54=HEAP8[r46];if(r54<<24>>24==0|r54<<24>>24==10){r59=r46;r60=r20;break L2586}else if(r54<<24>>24==92){break}else if(r54<<24>>24!=13){r61=r46;r62=r20;r63=r57;r1=1996;break L2590}do{if(r46>>>0>HEAP32[r43>>2]>>>0){if(HEAP8[r46-1|0]<<24>>24!=10){r1=1924;break}r64=r46+1|0;break}else{r1=1924}}while(0);if(r1==1924){r1=0;if(r46>>>0>=r58>>>0){r65=r46;break L2588}r54=r46+1|0;if(HEAP8[r54]<<24>>24==10){r64=r54}else{r65=r46;break L2588}}if(r64>>>0<r9>>>0){r46=r64}else{r59=r64;r60=r20;break L2586}}r54=r46+1|0;r55=HEAP8[r54];do{if(r55<<24>>24==64){if((r57|0)<=6){r61=r46;r62=r20;r63=r57;r1=1996;break L2590}r53=HEAP32[r4+81];r52=r20+1|0;HEAP8[r20]=95;r45=r57-1|0;r51=r46+2|0;r47=HEAP8[r51];if(r47<<24>>24==33){r48=HEAP32[1315461];if((r48|0)>99){_general_error(39,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{HEAP32[1315461]=r48+1|0;HEAP32[(r48<<2)+5261848>>2]=r53}r66=r53;r67=r46+3|0}else if(r47<<24>>24==64){r48=HEAP32[1315461];if((r48|0)<1){_general_error(40,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r68=r53}else{r50=r48-1|0;HEAP32[1315461]=r50;r68=HEAP32[(r50<<2)+5261848>>2]}r66=r68;r67=r46+3|0}else if(r47<<24>>24==63){r47=HEAP32[1315461];do{if((r47|0)>99){_general_error(39,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((r47|0)<1){_general_error(45,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}else{r50=(r47-1<<2)+5261848|0;HEAP32[(r47<<2)+5261848>>2]=HEAP32[r50>>2];HEAP32[r50>>2]=r53;HEAP32[1315461]=r47+1|0;break}}}while(0);r66=r53;r67=r46+3|0}else{r66=r53;r67=r51}r69=r67;r70=r52;r71=r45;r72=_sprintf(r52,5269272,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r66,tempInt));r1=1986;break}else if(r55<<24>>24==35){if((r57|0)<=1){r61=r46;r62=r20;r63=r57;r1=1996;break L2590}r69=r46+2|0;r70=r20;r71=r57;r72=_sprintf(r20,5268656,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r4+7],tempInt));r1=1986;break}else if(r55<<24>>24==63){r47=HEAP8[r46+2|0];if(((r47&255)-48|0)>>>0>=10){r1=1954;break}if((r57|0)<=2){r61=r46;r62=r20;r63=r57;r1=1996;break L2590}r69=r46+3|0;r70=r20;r71=r57;r72=_sprintf(r20,5268656,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[(((r47<<24>>24)-48<<2)+176>>2)+r4],tempInt));r1=1986;break}else if(r55<<24>>24==92){r47=r20+1|0;HEAP8[r20]=92;if((HEAP32[1315727]|0)==0){r73=r47;r74=1}else{HEAP8[r47]=92;r73=r20+2|0;r74=2}r75=r74;r76=r57;r77=r73;r78=r46+2|0;break}else{r1=1954}}while(0);L2634:do{if(r1==1954){r1=0;r47=r55&255;if((r47-48|0)>>>0<10){r50=(r55<<24>>24)-48|0;L2638:do{if((HEAP32[r4+7]|0)>=(r50|0)&(HEAP32[1315444]|0)>(r50|0)){if((HEAP32[((r50<<2)+176>>2)+r4]|0)>0&(r57|0)>0){r79=r20;r80=r57;r81=0;r82=r27}else{r83=0;break}while(1){HEAP8[r79]=HEAP8[HEAP32[r82+(r50<<2)+32>>2]+r81|0];r48=r81+1|0;r49=r80-1|0;r44=HEAP32[1315964];if((r48|0)<(HEAP32[r44+(r50<<2)+176>>2]|0)&(r49|0)>0){r79=r79+1|0;r80=r49;r81=r48;r82=r44}else{r83=r48;break L2638}}}else{r83=0}}while(0);r69=r46+2|0;r70=r20;r71=r57;r72=r83;r1=1986;break}L2644:do{if((HEAP32[1311078]|0)==0){r84=-1}else{if(r55<<24>>24==46|r55<<24>>24==95){r85=r55}else{if((_isalpha(r47)|0)==0){r84=-1;break}r85=HEAP8[r54]}do{if(r85<<24>>24==46|r85<<24>>24==95){r86=r54;r1=1965}else{if((_isalpha(r85&255)|0)==0){r87=0;break}else{r86=r54;r1=1965;break}}}while(0);if(r1==1965){while(1){r1=0;r88=r86+1|0;r50=HEAP8[r88];if(r50<<24>>24==95){r86=r88;r1=1965;continue}if((_isalnum(r50&255)|0)==0){break}else{r86=r88;r1=1965}}r87=r88}r50=r87-r54|0;r52=HEAP32[1315964],r45=r52>>2;r51=HEAP32[r45+80];if((r51|0)==0){r84=-1;break}else{r89=r51;r90=1}while(1){r51=r89+4|0;if((r50|0)==(_strlen(r51)|0)){if((_strncmp(r51,r54,r50)|0)==0){break}}r51=HEAP32[r89>>2];if((r51|0)==0){r84=-1;break L2644}else{r89=r51;r90=r90+1|0}}if((r90|0)<=0){r84=r50;break}r51=r50+(r46+1)|0;if(!((HEAP32[r45+7]|0)>=(r90|0)&(HEAP32[1315444]|0)>(r90|0))){r75=0;r76=r57;r77=r20;r78=r51;break L2634}if((HEAP32[((r90<<2)+176>>2)+r45]|0)>0&(r57|0)>0){r91=r20;r92=r57;r93=0;r94=r52}else{r75=0;r76=r57;r77=r20;r78=r51;break L2634}while(1){HEAP8[r91]=HEAP8[HEAP32[r94+(r90<<2)+32>>2]+r93|0];r53=r93+1|0;r48=r92-1|0;r44=HEAP32[1315964];if((r53|0)<(HEAP32[r44+(r90<<2)+176>>2]|0)&(r48|0)>0){r91=r91+1|0;r92=r48;r93=r53;r94=r44}else{r69=r51;r70=r20;r71=r57;r72=r53;r1=1986;break L2634}}}}while(0);do{if(!((HEAP32[1315444]|0)<11|(HEAP32[1311078]|0)!=0)){if((_tolower(HEAPU8[r54])|0)<=96){break}if((_tolower(HEAPU8[r54])|0)>=(HEAP32[1315444]+87|0)){break}r47=_tolower(HEAPU8[r54])-87|0;r51=HEAP32[1315964];L2673:do{if((HEAP32[r51+28>>2]|0)>=(r47|0)&(HEAP32[1315444]|0)>(r47|0)){if((HEAP32[r51+(r47<<2)+176>>2]|0)>0&(r57|0)>0){r95=r20;r96=r57;r97=0;r98=r51}else{r99=0;break}while(1){HEAP8[r95]=HEAP8[HEAP32[r98+(r47<<2)+32>>2]+r97|0];r52=r97+1|0;r45=r96-1|0;r50=HEAP32[1315964];if((r52|0)<(HEAP32[r50+(r47<<2)+176>>2]|0)&(r45|0)>0){r95=r95+1|0;r96=r45;r97=r52;r98=r50}else{r99=r52;break L2673}}}else{r99=0}}while(0);r69=r46+2|0;r70=r20;r71=r57;r72=r99;r1=1986;break L2634}}while(0);if(HEAP8[r54]<<24>>24!=40){r69=r46;r70=r20;r71=r57;r72=r84;r1=1986;break}if(HEAP8[r46+2|0]<<24>>24!=41){r69=r46;r70=r20;r71=r57;r72=r84;r1=1986;break}r75=0;r76=r57;r77=r20;r78=r46+3|0;break}}while(0);if(r1==1986){r1=0;if((r72|0)>-1){r75=r72;r76=r71;r77=r70;r78=r69}else{r61=r69;r62=r70;r63=r71;r1=1996;break}}r100=r78;r101=r77+r75|0;r102=r76-r75|0;break}else{r46=r21;while(1){r54=HEAP8[r46];if(r54<<24>>24==0|r54<<24>>24==10){r59=r46;r60=r20;break L2586}else if(r54<<24>>24!=13){r61=r46;r62=r20;r63=r57;r1=1996;break L2590}do{if(r46>>>0>HEAP32[r43>>2]>>>0){if(HEAP8[r46-1|0]<<24>>24!=10){r1=1992;break}r103=r46+1|0;break}else{r1=1992}}while(0);if(r1==1992){r1=0;if(r46>>>0>=r58>>>0){r65=r46;break L2588}r54=r46+1|0;if(HEAP8[r54]<<24>>24==10){r103=r54}else{r65=r46;break L2588}}if(r103>>>0<r9>>>0){r46=r103}else{r59=r103;r60=r20;break L2586}}}}while(0);do{if(r1==1996){r1=0;r43=r61+1|0;if((r63|0)<=0){r100=r43;r101=r62;r102=r63;break}HEAP8[r62]=HEAP8[r61];r100=r43;r101=r62+1|0;r102=r63-1|0}}while(0);if(r100>>>0<r9>>>0){r57=r102;r20=r101;r21=r100}else{r59=r100;r60=r101;break L2586}}r59=r65+1|0;r60=r20}else{r59=r14;r60=r10}}while(0);HEAP8[r60]=0;if(r59>>>0<r9>>>0){r104=HEAP8[r59]<<24>>24==10?r59+1|0:r59}else{r104=r59}HEAP32[HEAP32[1315964]+328>>2]=r104;if((HEAP32[1315452]|0)!=0){do{if((HEAP32[1315960]|0)==0){r104=_malloc(148);r59=r104;if((r104|0)!=0){r105=r59,r106=r105>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r105=r59,r106=r105>>2}else{r59=_malloc(156);if((r59|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r104=r59+8|0;HEAP32[r59+4>>2]=148;_memset(r104,-35,148);r105=r104,r106=r105>>2}}while(0);r104=r105;HEAP32[r106]=0;HEAP32[r106+2]=HEAP32[HEAP32[1315964]+332>>2];r59=(r105+12|0)>>2;HEAP32[r59]=0;HEAP32[r59+1]=0;HEAP32[r59+2]=0;HEAP32[r59+3]=0;HEAP32[r106+1]=HEAP32[1315964];_strncpy(r105+28|0,HEAP32[HEAP32[1315964]+336>>2],120);if((HEAP32[1315723]|0)==0){HEAP32[1315454]=r104;HEAP32[1315723]=r104}else{HEAP32[HEAP32[1315454]>>2]=r104;HEAP32[1315454]=r104}HEAP32[1315966]=r104}r104=HEAP32[1315964];r105=HEAP32[r104+336>>2];if((r15|0)==0){r11=r105;STACKTOP=r2;return r11}r106=r3|0;HEAP32[1310801]=0;r3=HEAP32[1310809];do{if((r3|0)<0|(r104|0)==0){r1=2014}else{if((_strlen(HEAP32[r104+8>>2])+24|0)>>>0>1023){r1=2014;break}else{r107=r3;break}}}while(0);if(r1==2014){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=611,HEAP32[tempInt+8>>2]=5269184,tempInt));r107=HEAP32[1310809]}if((r107|0)<=0){r11=r105;STACKTOP=r2;return r11}r107=HEAP32[1315964];r1=HEAP32[r107+332>>2];_sprintf(r106,5268032,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r107+8>>2],HEAP32[tempInt+4>>2]=r1,tempInt));r1=_mystrdup(r106);r106=HEAP32[1310802];r107=_new_source(r1,r106,r15-r106|0),r106=r107>>2;HEAP32[r106+5]=HEAP32[1310809];r15=HEAP32[HEAP32[1315964]+28>>2];if((r15|0)>0){r1=r107+28|0;HEAP32[r1>>2]=r15;r15=0;r3=HEAP32[1315964];while(1){HEAP32[((r15<<2)+32>>2)+r106]=HEAP32[r3+(r15<<2)+32>>2];HEAP32[((r15<<2)+176>>2)+r106]=HEAP32[HEAP32[1315964]+(r15<<2)+176>>2];r104=r15+1|0;r108=HEAP32[1315964];if((r104|0)>(HEAP32[r1>>2]|0)){break}else{r15=r104;r3=r108}}HEAP32[r106+80]=HEAP32[r108+320>>2]}HEAP32[1315964]=r107;r11=r105;STACKTOP=r2;return r11}function _add_nreloc(r1,r2,r3,r4,r5,r6){var r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r7=STACKTOP;do{if((HEAP32[1315960]|0)==0){r8=_malloc(20);r9=r8;if((r8|0)!=0){r10=r9,r11=r10>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=r9,r11=r10>>2}else{r9=_malloc(28);if((r9|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r9+8|0,r12=r8>>2;HEAP32[r9+4>>2]=20;HEAP32[r12]=-572662307;HEAP32[r12+1]=-572662307;HEAP32[r12+2]=-572662307;HEAP32[r12+3]=-572662307;HEAP32[r12+4]=-572662307;r10=r8,r11=r10>>2}}while(0);HEAP32[r11+2]=-1;HEAP32[r11]=0;r8=r10+4|0;HEAP32[r8>>2]=0;r12=r10+12|0;HEAP32[r12>>2]=0;do{if((HEAP32[1315960]|0)==0){r9=_malloc(12);r13=r9;if((r9|0)!=0){r14=r13,r15=r14>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=r13,r15=r14>>2}else{r13=_malloc(20);if((r13|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r13+8|0,r16=r9>>2;HEAP32[r13+4>>2]=12;HEAP32[r16]=-572662307;HEAP32[r16+1]=-572662307;HEAP32[r16+2]=-572662307;r14=r9,r15=r14>>2}}while(0);r9=r14;HEAP32[r8>>2]=r5;HEAP32[r11]=r6;HEAP32[r11+4]=r2;HEAP32[r12>>2]=r3;HEAP32[r15+2]=r4;HEAP32[r15+1]=r10;HEAP32[r15]=HEAP32[r1>>2];HEAP32[r1>>2]=r9;STACKTOP=r7;return r9}function _fw32(r1,r2,r3){var r4;r4=STACKTOP;if((r3|0)==0){if((_fputc(r2&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2>>>8&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2>>>16&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2>>>24,r1)|0)!=-1){STACKTOP=r4;return}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}else{if((_fputc(r2>>>24,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2>>>16&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2>>>8&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(r2&255,r1)|0)!=-1){STACKTOP=r4;return}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}}function _mystrdup(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;r3=_strlen(r1);r4=r3+1|0;do{if((HEAP32[1315960]|0)==0){r5=_malloc(r4);r6=r5;if((r5|0)!=0){r7=r6;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=r6}else{r6=_malloc(r3+9|0);if((r6|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r5=r6+8|0;HEAP32[r6+4>>2]=r4;_memset(r5,-35,r4);r7=r5}}while(0);r4=r7;_strcpy(r4,r1);STACKTOP=r2;return r4}function _strcasecmp(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=(_tolower(HEAPU8[r1])|0)==(_tolower(HEAPU8[r2])|0);r4=HEAP8[r1];L2793:do{if(r3){r5=r1;r6=r2;r7=r4;while(1){if(r7<<24>>24==0){r8=0;break}r9=r5+1|0;r10=r6+1|0;r11=(_tolower(HEAPU8[r9])|0)==(_tolower(HEAPU8[r10])|0);r12=HEAP8[r9];if(r11){r5=r9;r6=r10;r7=r12}else{r13=r10;r14=r12;break L2793}}return r8}else{r13=r2;r14=r4}}while(0);r8=_tolower(r14&255)-_tolower(HEAPU8[r13])|0;return r8}function _parse_operand(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65;r5=0;r6=STACKTOP;r7=(r3+16|0)>>2;r8=(r3|0)>>2;r9=r3+4|0;r10=r3+8|0;r11=r3>>2;HEAP32[r11]=0;HEAP32[r11+1]=0;HEAP32[r11+2]=0;HEAP32[r11+3]=0;HEAP32[r11+4]=0;r11=r1;while(1){r12=r11+1|0;if((_isspace(HEAPU8[r11])|0)==0){break}else{r11=r12}}L2804:do{if(HEAP8[r11]<<24>>24==40){r3=r11;r13=40;while(1){r14=r3+1|0;if((_isspace(r13)|0)==0){break}r3=r14;r13=HEAPU8[r14]}r13=r1+r2|0;if(HEAP8[r3]<<24>>24==40){r15=r14;r16=1}else{r5=2123;break}L2809:while(1){r17=r15;while(1){if(r17>>>0>=r13>>>0){r18=r17;r19=r16;break L2809}r20=r17+1|0;r21=HEAP8[r17];if(r21<<24>>24==41){r5=2086;break}else if(r21<<24>>24==40){r5=2084;break}else{r17=r20}}if(r5==2086){r5=0;r22=r16-1|0}else if(r5==2084){r5=0;r22=r16+1|0}if((r22|0)>0){r15=r20;r16=r22}else{r5=2087;break}}L2818:do{if(r5==2087){if(r20>>>0<r13>>>0){r23=r20}else{r18=r20;r19=r22;break}while(1){if((_isspace(HEAPU8[r23])|0)==0){r18=r23;r19=r22;break L2818}else{r23=r23+1|0}}}}while(0);if((r19|0)==0&r18>>>0>=r13>>>0){r24=r12}else{r5=2123;break}while(1){if((_isspace(HEAPU8[r24])|0)==0){break}else{r24=r24+1|0}}r13=_strpbrk(r24,5269732);if((r13|0)==0){r25=r1+r2-r24|0}else{r25=r13-r24|0}r13=(r25|0)==0;r3=r25-1|0;r17=(r3|0)==0;r21=0;L2830:while(1){r26=HEAP32[(r21<<4)+5243248>>2];if((_strlen(r26)|0)==(r25|0)){if(r13){break}r27=HEAP8[r24];L2835:do{if(r17){r28=r27;r29=r26}else{r30=r24;r31=r26;r32=r3;r33=r27;while(1){r34=(_tolower(r33&255)|0)==(_tolower(HEAPU8[r31])|0);r35=HEAP8[r30];if(!r34){r28=r35;r29=r31;break L2835}if(r35<<24>>24==0){break L2830}r35=r30+1|0;r34=r31+1|0;r36=r32-1|0;r37=HEAP8[r35];if((r36|0)==0){r28=r37;r29=r34;break L2835}else{r30=r35;r31=r34;r32=r36;r33=r37}}}}while(0);if((_tolower(r28&255)|0)==(_tolower(HEAPU8[r29])|0)){break}}r27=r21+1|0;if(r27>>>0<52){r21=r27}else{r5=2122;break}}if(r5==2122){HEAP32[1310797]=r24;HEAP8[5261784]=0;r3=_expression();_simplify_expr(r3);HEAP32[r7]=r3;if((r3|0)==0){r38=0}else{r39=-1;r40=66;break}STACKTOP=r6;return r38}HEAP32[r8]=HEAP32[(r21<<4)+5243256>>2];r3=HEAP32[(r21<<4)+5243252>>2];r17=r24+r25|0;while(1){r41=r17+1|0;if((_isspace(HEAPU8[r17])|0)==0){break}else{r17=r41}}r21=r3|64;r13=HEAP8[r17];L2849:do{if(r13<<24>>24==43){r27=_strpbrk(r17+2|0,5269700);if((r27|0)==0){r42=r1+r2-r41|0}else{r42=r27-r41|0}r27=(r42|0)==0;r26=r42-1|0;r33=(r26|0)==0;r32=0;L2855:while(1){r31=HEAP32[(r32<<4)+5243248>>2];if((_strlen(r31)|0)==(r42|0)){if(r27){break}r30=HEAP8[r41];L2860:do{if(r33){r43=r30;r44=r31}else{r37=r41;r36=r31;r34=r26;r35=r30;while(1){r45=(_tolower(r35&255)|0)==(_tolower(HEAPU8[r36])|0);r46=HEAP8[r37];if(!r45){r43=r46;r44=r36;break L2860}if(r46<<24>>24==0){break L2855}r46=r37+1|0;r45=r36+1|0;r47=r34-1|0;r48=HEAP8[r46];if((r47|0)==0){r43=r48;r44=r45;break L2860}else{r37=r46;r36=r45;r34=r47;r35=r48}}}}while(0);if((_tolower(r43&255)|0)==(_tolower(HEAPU8[r44])|0)){break}}r30=r32+1|0;if(r30>>>0<52){r32=r30}else{break L2849}}r39=HEAP32[(r32<<4)+5243256>>2];r40=r21;break L2804}else if(r13<<24>>24==41){r39=-1;r40=r21;break L2804}}while(0);r21=r17-1|0;r13=HEAP8[r21];HEAP8[r21]=40;HEAP32[1310797]=r17;HEAP8[5261784]=0;r26=_expression();_simplify_expr(r26);HEAP32[r7]=r26;if((r26|0)!=0){HEAP8[r21]=r13;r39=-1;r40=r3|576;break}HEAP8[r21]=r13;r38=0;STACKTOP=r6;return r38}else{r5=2123}}while(0);L2873:do{if(r5==2123){L2875:do{if((r4-18|0)>>>0<2){r44=(r2|0)==0;r43=r2-1|0;r41=(r43|0)==0;r42=0;L2878:while(1){r25=HEAP32[(r42<<4)+5262652>>2];if((_strlen(r25)|0)==(r2|0)){if(r44){break}r24=HEAP8[r11];L2883:do{if(r41){r49=r24;r50=r25}else{r29=r11;r28=r25;r18=r43;r19=r24;while(1){r23=(_tolower(r19&255)|0)==(_tolower(HEAPU8[r28])|0);r22=HEAP8[r29];if(!r23){r49=r22;r50=r28;break L2883}if(r22<<24>>24==0){break L2878}r22=r29+1|0;r23=r28+1|0;r20=r18-1|0;r16=HEAP8[r22];if((r20|0)==0){r49=r16;r50=r23;break L2883}else{r29=r22;r28=r23;r18=r20;r19=r16}}}}while(0);if((_tolower(r49&255)|0)==(_tolower(HEAPU8[r50])|0)){break}}r24=r42+1|0;if(r24>>>0<14){r42=r24}else{r51=r43;break L2875}}r43=HEAP32[(r42<<4)+5262656>>2];HEAP32[r10>>2]=HEAP32[(r42<<4)+5262660>>2];r39=-1;r40=r43;break L2873}else{r51=r2-1|0}}while(0);r3=(r2|0)==0;r17=(r51|0)==0;r43=0;L2892:while(1){r41=HEAP32[(r43<<4)+5243248>>2];if((_strlen(r41)|0)==(r2|0)){if(r3){r5=2143;break}r44=HEAP8[r11];L2897:do{if(r17){r52=r44;r53=r41}else{r32=r11;r24=r41;r25=r51;r19=r44;while(1){r18=(_tolower(r19&255)|0)==(_tolower(HEAPU8[r24])|0);r28=HEAP8[r32];if(!r18){r52=r28;r53=r24;break L2897}if(r28<<24>>24==0){r5=2143;break L2892}r28=r32+1|0;r18=r24+1|0;r29=r25-1|0;r16=HEAP8[r28];if((r29|0)==0){r52=r16;r53=r18;break L2897}else{r32=r28;r24=r18;r25=r29;r19=r16}}}}while(0);if((_tolower(r52&255)|0)==(_tolower(HEAPU8[r53])|0)){r5=2143;break}}r44=r43+1|0;if(r44>>>0<52){r43=r44}else{break}}if(r5==2143){HEAP32[r8]=HEAP32[(r43<<4)+5243256>>2];r39=-1;r40=HEAP32[(r43<<4)+5243252>>2];break}r17=_strpbrk(r11,5269688);if((r17|0)==0){r54=r1+r2-r11|0}else{r54=r17-r11|0}r17=(r54|0)==0;r3=r54-1|0;r44=(r3|0)==0;r41=0;L2911:while(1){r42=HEAP32[(r41<<4)+5243248>>2];if((_strlen(r42)|0)==(r54|0)){if(r17){break}r19=HEAP8[r11];L2916:do{if(r44){r55=r19;r56=r42}else{r25=r11;r24=r42;r32=r3;r16=r19;while(1){r29=(_tolower(r16&255)|0)==(_tolower(HEAPU8[r24])|0);r18=HEAP8[r25];if(!r29){r55=r18;r56=r24;break L2916}if(r18<<24>>24==0){break L2911}r18=r25+1|0;r29=r24+1|0;r28=r32-1|0;r20=HEAP8[r18];if((r28|0)==0){r55=r20;r56=r29;break L2916}else{r25=r18;r24=r29;r32=r28;r16=r20}}}}while(0);if((_tolower(r55&255)|0)==(_tolower(HEAPU8[r56])|0)){break}}r19=r41+1|0;if(r19>>>0<52){r41=r19}else{r5=2175;break}}if(r5==2175){if(HEAP8[5242880]){r57=HEAP8[r11]<<24>>24==35?r12:r11}else{r57=r11}HEAP32[1310797]=r57;HEAP8[5261784]=0;r3=_expression();_simplify_expr(r3);HEAP32[r7]=r3;if((r3|0)==0){r38=0}else{r39=-1;r40=2;break}STACKTOP=r6;return r38}HEAP32[r8]=HEAP32[(r41<<4)+5243256>>2];r3=HEAP32[(r41<<4)+5243252>>2];r44=r11+r54|0;while(1){r58=r44+1|0;if((_isspace(HEAPU8[r44])|0)==0){break}else{r44=r58}}if(HEAP8[r44]<<24>>24!=43){r39=-1;r40=r3;break}r41=_strpbrk(r44+2|0,5269700);if((r41|0)==0){r59=r1+r2-r58|0}else{r59=r41-r58|0}r41=(r59|0)==0;r17=r59-1|0;r43=(r17|0)==0;r19=0;L2938:while(1){r42=HEAP32[(r19<<4)+5243248>>2];if((_strlen(r42)|0)==(r59|0)){if(r41){r5=2171;break}r16=HEAP8[r58];L2943:do{if(r43){r60=r16;r61=r42}else{r32=r58;r24=r42;r25=r17;r20=r16;while(1){r28=(_tolower(r20&255)|0)==(_tolower(HEAPU8[r24])|0);r29=HEAP8[r32];if(!r28){r60=r29;r61=r24;break L2943}if(r29<<24>>24==0){r5=2171;break L2938}r29=r32+1|0;r28=r24+1|0;r18=r25-1|0;r23=HEAP8[r29];if((r18|0)==0){r60=r23;r61=r28;break L2943}else{r32=r29;r24=r28;r25=r18;r20=r23}}}}while(0);if((_tolower(r60&255)|0)==(_tolower(HEAPU8[r61])|0)){r5=2171;break}}r16=r19+1|0;if(r16>>>0<52){r19=r16}else{break}}if(r5==2171){r39=HEAP32[(r19<<4)+5243256>>2];r40=r3;break}HEAP32[1310797]=r58;HEAP8[5261784]=0;r17=_expression();_simplify_expr(r17);HEAP32[r7]=r17;if((r17|0)==0){r38=0;STACKTOP=r6;return r38}else{r39=-1;r40=r3|512;break}}}while(0);L2957:do{if((r4&1024|0)==0){if((r4&2048|0)!=0){if((r40&2048|0)==0){r5=2289;break}if((r4&128|0)==0){if((r40&128|0)!=0){r5=2289;break}}r58=HEAP32[r8];do{if((HEAP32[1315968]&28|0)!=0){if((r4&8192|0)==0){break}if((r40&256|0)==0){break}if((r58&31|0)!=6){r62=r40;r5=2288;break L2957}if((r4&16384|0)==0){r5=2289;break L2957}else{r62=r40;r5=2288;break L2957}}}while(0);r58=(r4&256|0)==0;r3=r40&256;if((r3|0)==0&(r58^1)|(r3|0)!=0&r58){r5=2289;break}else{r62=r40;r5=2288;break}}if((r4&4096|0)!=0){if((r40&4096|0)==0){r5=2289;break}if((r4&128|0)==0){if((r40&128|0)!=0){r5=2289;break}}r58=HEAP32[r8];do{if((HEAP32[1315968]&28|0)!=0){if((r4&8192|0)==0){break}if((r40&256|0)==0){break}if((r58&31|0)!=6){r62=r40;r5=2288;break L2957}if((r4&16384|0)==0){r5=2289;break L2957}else{r62=r40;r5=2288;break L2957}}}while(0);r58=(r4&256|0)==0;r3=r40&256;if((r3|0)==0&(r58^1)|(r3|0)!=0&r58){r5=2289;break}else{r62=r40;r5=2288;break}}r58=r4&63;if((r58|0)==0){if((r40|0)==0){r62=0;r5=2288;break}else{r5=2289;break}}else if((r58|0)==13|(r58|0)==5|(r58|0)==9|(r58|0)==8|(r58|0)==7|(r58|0)==6|(r58|0)==12|(r58|0)==11|(r58|0)==10|(r58|0)==15|(r58|0)==14|(r58|0)==16|(r58|0)==23|(r58|0)==24|(r58|0)==37|(r58|0)==38|(r58|0)==39){if((r40&63|0)!=(r58|0)){r5=2289;break}if((r4&128|0)==0){if((r40&128|0)!=0){r5=2289;break}}r3=(r40&64|0)==0;if((r4&64|0)==0){if(!r3){r5=2289;break}}else{if(r3){r5=2289;break}}r3=HEAP32[r8];do{if((HEAP32[1315968]&28|0)==0){r5=2220}else{if((r4&8192|0)==0){r5=2220;break}if((r40&256|0)==0){r5=2220;break}if((r3&31|0)!=6){break}if((r4&16384|0)==0){r5=2289;break L2957}else{break}}}while(0);if(r5==2220){r3=(r4&256|0)==0;r19=r40&256;if((r19|0)==0&(r3^1)|(r19|0)!=0&r3){r5=2289;break}}if((r4&32768|0)!=0){if((r39|0)==7){r62=r40;r5=2288;break}else{r5=2289;break}}if((r4&65536|0)!=0){if((r39|0)==2){r62=r40;r5=2288;break}else{r5=2289;break}}if((r4&131072|0)!=0){if((r39|0)==0){r62=r40;r5=2288;break}else{r5=2289;break}}if((r4&262144|0)!=0){if((r39|0)==1){r62=r40;r5=2288;break}else{r5=2289;break}}if((r4&524288|0)!=0){if((r39|0)==34){r62=r40;r5=2288;break}else{r5=2289;break}}if((r4&1048576|0)!=0){if((r39|0)==66){r62=r40;r5=2288;break}else{r5=2289;break}}r3=(HEAP32[r7]|0)==0;if((r4&512|0)==0){if(r3&(r39|0)==-1){r62=r40;r5=2288;break}else{r5=2289;break}}if(!r3){r62=r40;r5=2288;break}HEAP32[1310797]=5269680;HEAP8[5261784]=0;r3=_expression();_simplify_expr(r3);HEAP32[r7]=r3;r62=r40|512;r5=2288;break}else if((r58|0)==4){do{if((r40&64|0)==0){r5=2243}else{r3=HEAP32[r8];if((r3&31|0)!=2){r5=2243;break}r19=r40&896;r61=r19|4;r60=r3&224;HEAP32[r8]=r60|6;if((r3&96|0)==0){r3=HEAP32[r7];if((r3|0)==0){r63=r61;r5=2244;break}else{r64=r3;break L2957}}HEAP32[r8]=r60|262;if((HEAP32[r7]|0)!=0){r63=r61;r5=2244;break}HEAP32[1310797]=5269680;HEAP8[5261784]=0;r61=_expression();_simplify_expr(r61);HEAP32[r7]=r61;r65=r19|516;break}}while(0);do{if(r5==2243){r19=HEAP32[r7];if((r19|0)==0){r63=r40;r5=2244;break}else{r64=r19;break L2957}}}while(0);if(r5==2244){r65=(r63|0)==13?4:r63}if((r4&128|0)==0){if((r65&127|0)!=4){r5=2289;break}}else{if((r65&63|0)!=4){r5=2289;break}}r19=HEAP32[r8];do{if((HEAP32[1315968]&28|0)!=0){if((r4&8192|0)==0){break}if((r65&256|0)==0){break}if((r19&31|0)==6){if((r4&16384|0)!=0&(r39|0)==-1){r62=r65;r5=2288;break L2957}else{r5=2289;break L2957}}else{if((r39|0)==-1){r62=r65;r5=2288;break L2957}else{r5=2289;break L2957}}}}while(0);r19=(r4&256|0)==0;r61=r65&256;if((r61|0)==0&(r19^1)){r5=2289;break}if((r39|0)==-1&((r61|0)!=0&r19^1)){r62=r65;r5=2288;break}else{r5=2289;break}}else if((r58|0)==22){if((r40|0)!=66){r5=2289;break}if((HEAP32[r7]|0)==0){r38=0}else{r62=1;r5=2288;break}STACKTOP=r6;return r38}else if((r58|0)==20){if((r40|0)!=66){r5=2289;break}if((HEAP32[r7]|0)==0){r38=0}else{r62=66;r5=2288;break}STACKTOP=r6;return r38}else if((r58|0)==36){if((r40&63|0)!=7){r5=2289;break}r19=(r40&64|0)==0;if((r4&64|0)==0){if(!r19){r5=2289;break}}else{if(r19){r5=2289;break}}if(!((HEAP32[r8]|0)==66&(r39|0)==-1)){r5=2289;break}if((r4&512|0)==0){r62=r4;r5=2288;break}HEAP32[r8]=70;if((HEAP32[r7]|0)!=0){r62=r4;r5=2288;break}HEAP32[1310797]=5269680;HEAP8[5261784]=0;r19=_expression();_simplify_expr(r19);HEAP32[r7]=r19;r62=r4|512;r5=2288;break}else if((r58|0)==33){if((r40|0)!=66){r5=2289;break}if((HEAP32[r7]|0)==0){r38=0}else{r62=25;r5=2288;break}STACKTOP=r6;return r38}else if((r58|0)==34){if((r40|0)!=96){r5=2289;break}if((HEAP32[r7]|0)==0){r38=0}else{r62=32;r5=2288;break}STACKTOP=r6;return r38}else if((r58|0)==21|(r58|0)==1|(r58|0)==2|(r58|0)==25|(r58|0)==32){if((r4&64|0)==0){if((r40&64|0)!=0){r5=2289;break}}if((HEAP32[r7]|0)==0){r38=0}else{r62=r4;r5=2288;break}STACKTOP=r6;return r38}else if((r58|0)==17){if((r40|0)!=68){r5=2289;break}if((HEAP32[r8]|0)==1&(r39|0)==-1){r62=68;r5=2288;break}else{r5=2289;break}}else if((r58|0)==18|(r58|0)==19){if((r40|0)==(r4|0)){r62=r4;r5=2288;break}else{r5=2289;break}}else if((r58|0)==35){if((r40&63|0)!=7){r5=2289;break}r19=(r40&64|0)==0;if((r4&64|0)==0){if(!r19){r5=2289;break}}else{if(r19){r5=2289;break}}if(!((HEAP32[r8]|0)==34&(r39|0)==-1)){r5=2289;break}if((r4&512|0)==0){r62=r4;r5=2288;break}HEAP32[r8]=38;if((HEAP32[r7]|0)!=0){r62=r4;r5=2288;break}HEAP32[1310797]=5269680;HEAP8[5261784]=0;r19=_expression();_simplify_expr(r19);HEAP32[r7]=r19;r62=r4|512;r5=2288;break}else{_cpu_error(20,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r4,HEAP32[tempInt+4>>2]=r40,tempInt));r5=2289;break}}else{if((r40&1024|0)==0){r5=2289;break}if((r4&128|0)==0){if((r40&128|0)!=0){r5=2289;break}}r19=HEAP32[r8];do{if((HEAP32[1315968]&28|0)!=0){if((r4&8192|0)==0){break}if((r40&256|0)==0){break}if((r19&31|0)!=6){r62=r40;r5=2288;break L2957}if((r4&16384|0)==0){r5=2289;break L2957}else{r62=r40;r5=2288;break L2957}}}while(0);r19=(r4&256|0)==0;r58=r40&256;if((r58|0)==0&(r19^1)|(r58|0)!=0&r19){r5=2289;break}else{r62=r40;r5=2288;break}}}while(0);do{if(r5==2288){HEAP32[r9>>2]=r62;r38=1;STACKTOP=r6;return r38}else if(r5==2289){r40=HEAP32[r7];if((r40|0)==0){r38=0}else{r64=r40;break}STACKTOP=r6;return r38}}while(0);_free_expr(r64);r38=0;STACKTOP=r6;return r38}function _instruction_size(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=r1>>2;r2=0;r4=r1|0;r1=HEAP32[r4>>2];r5=(r1*44&-1)+5244344|0;r6=HEAP32[1315968];L3110:do{if((HEAPU8[(r1*44&-1)+5244364|0]&r6|0)==0){r7=r5,r8=r7>>2;r9=r6}else{do{if((r6&4|0)==0){if((r6&16|0)!=0){r10=(r1*44&-1)+5244380|0;break}if((r6&8|0)!=0){r10=(r1*44&-1)+5244376|0;break}if((r6&128|0)==0){r7=r5,r8=r7>>2;r9=r6;break L3110}r10=(r1*44&-1)+5244384|0}else{r10=(r1*44&-1)+5244372|0}}while(0);r11=HEAP32[r10>>2];if((r11|0)==2){r12=3;return r12}else if((r11|0)!=1){r7=r5,r8=r7>>2;r9=r6;break}r11=HEAP32[r3+1];do{if((r11|0)!=0){if((HEAP32[r11+4>>2]&128|0)!=0){r7=r5,r8=r7>>2;r9=r6;break L3110}r13=HEAP32[r3+2];if((r13|0)==0){break}if((HEAP32[r13+4>>2]&128|0)!=0){r7=r5,r8=r7>>2;r9=r6;break L3110}}}while(0);do{if((HEAP32[(r1*44&-1)+5244356>>2]|0)==3){if((HEAP32[HEAP32[r3+2]>>2]-6|0)>>>0<2){r7=r5,r8=r7>>2;r9=r6;break L3110}if((HEAP32[r11>>2]-6|0)>>>0<2){r7=r5,r8=r7>>2;r9=r6;break L3110}else{r14=r1;break}}else{r14=r1}}while(0);while(1){r15=r14+1|0;HEAP32[r4>>2]=r15;r16=HEAP32[1315968];if((HEAPU8[(r15*44&-1)+5244364|0]&r16|0)==0){r14=r15}else{break}}r7=(r15*44&-1)+5244344|0,r8=r7>>2;r9=r16}}while(0);do{if((r9&28|0)!=0){if((HEAP32[r8+3]|0)!=5){break}if((HEAP32[r8+4]|0)!=196){break}r12=(HEAP32[HEAP32[r3+1]+8>>2]|0)<4?5:6;return r12}}while(0);r9=HEAP32[r8+4];do{if(r9>>>0>16777215){r17=4}else{if((r9&16711680|0)!=0){r17=3;break}r17=(r9&65280|0)==0?1:2}}while(0);r9=HEAP32[r3+1],r16=r9>>2;r15=(r9|0)==0;do{if(r15){r2=2332}else{if((HEAP32[r16+1]&128|0)==0){r2=2332;break}else{r2=2334;break}}}while(0);do{if(r2==2332){r9=HEAP32[r3+2];if((r9|0)==0){r18=r17;break}if((HEAP32[r9+4>>2]&128|0)==0){r18=r17;break}else{r2=2334;break}}}while(0);if(r2==2334){r18=((HEAP32[r8+3]|0)!=10&1)+r17|0}do{if(r15){r2=2337}else{if((HEAP32[r16+1]|0)==1){r2=2339;break}else{r2=2337;break}}}while(0);do{if(r2==2337){r17=HEAP32[r3+2];if((r17|0)==0){r19=r18;break}if((HEAP32[r17+4>>2]|0)==1){r2=2339;break}else{r19=r18;break}}}while(0);if(r2==2339){r19=r18+1|0}do{if(r15){r2=2342}else{if((HEAP32[r16+1]&512|0)==0){r2=2342;break}else{r2=2344;break}}}while(0);do{if(r2==2342){r18=HEAP32[r3+2];if((r18|0)==0){r20=r19;break}if((HEAP32[r18+4>>2]&512|0)==0){r20=r19;break}else{r2=2344;break}}}while(0);if(r2==2344){r20=r19+1|0}do{if(r15){r2=2347}else{r19=HEAP32[r16+1];if((r19|0)==66|(r19|0)==2){r2=2349;break}else{r2=2347;break}}}while(0);do{if(r2==2347){r19=HEAP32[r3+2];if((r19|0)==0){r21=r20;break}r18=HEAP32[r19+4>>2];if((r18|0)==66|(r18|0)==2){r2=2349;break}else{r21=r20;break}}}while(0);if(r2==2349){r21=r20+2|0}do{if(r15){r2=2352}else{r20=HEAP32[r16+1];if((r20|0)==89|(r20|0)==25){r2=2354;break}else{r2=2352;break}}}while(0);do{if(r2==2352){r20=HEAP32[r3+2];if((r20|0)==0){r22=r21;break}r18=HEAP32[r20+4>>2];if((r18|0)==89|(r18|0)==25){r2=2354;break}else{r22=r21;break}}}while(0);if(r2==2354){r22=r21+3|0}do{if(r15){r2=2357}else{r21=HEAP32[r16+1];if((r21|0)==96|(r21|0)==32){r2=2359;break}else{r2=2357;break}}}while(0);do{if(r2==2357){r15=HEAP32[r3+2];if((r15|0)==0){r23=r22;break}r21=HEAP32[r15+4>>2];if((r21|0)==96|(r21|0)==32){r2=2359;break}else{r23=r22;break}}}while(0);if(r2==2359){r23=r22+4|0}do{if((HEAP32[r8+1]&8192|0)==0){r2=2362}else{if((HEAP32[r16+1]&256|0)==0){r2=2362;break}else{r2=2364;break}}}while(0);do{if(r2==2362){if((HEAP32[r8+2]&8192|0)==0){break}if((HEAP32[HEAP32[r3+2]+4>>2]&256|0)==0){break}else{r2=2364;break}}}while(0);if(r2==2364){HEAP32[r3+3]=1}r12=((HEAP32[r3+3]|0)!=0&1)+r23+((HEAP32[r3+4]|0)!=0&1)+((HEAP32[r3+5]|0)!=0&1)|0;return r12}function _parse_z80asm_pseudo(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3,r5=r4>>2;HEAP32[r5]=r1;if(!HEAP8[5242880]){r6=r1;STACKTOP=r3;return r6}r7=_strstr(r1,5269664);do{if((r7|0)==0){r8=r1}else{HEAP8[r7]=36;r9=r7+1|0;tempBigInt=538976288;HEAP8[r9]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r9+3|0]=tempBigInt&255;r8=r1;break}}while(0);while(1){r7=HEAP8[r8];if(r7<<24>>24!=95){if((_isalnum(r7&255)|0)==0){break}}r7=r8+1|0;HEAP32[r5]=r7;r8=r7}L3217:do{if((r8-r1|0)==6){r7=(_tolower(HEAPU8[r1])|0)==(_tolower(109)|0);r9=HEAP8[r1];do{if(r7){if(r9<<24>>24==0){r10=r8;break}r11=r1+1|0;r12=(_tolower(HEAPU8[r11])|0)==(_tolower(111)|0);r13=HEAP8[r11];if(!r12){r14=r13;r15=5269657;r2=2380;break}if(r13<<24>>24==0){r10=r8;break}r13=r1+2|0;r12=(_tolower(HEAPU8[r13])|0)==(_tolower(100)|0);r11=HEAP8[r13];if(!r12){r14=r11;r15=5269658;r2=2380;break}if(r11<<24>>24==0){r10=r8;break}r11=r1+3|0;r12=(_tolower(HEAPU8[r11])|0)==(_tolower(117)|0);r13=HEAP8[r11];if(!r12){r14=r13;r15=5269659;r2=2380;break}if(r13<<24>>24==0){r10=r8;break}r13=r1+4|0;r12=(_tolower(HEAPU8[r13])|0)==(_tolower(108)|0);r11=HEAP8[r13];if(!r12){r14=r11;r15=5269660;r2=2380;break}if(r11<<24>>24==0){r10=r8;break}r14=HEAP8[r1+5|0];r15=5269661;r2=2380;break}else{r14=r9;r15=5269656;r2=2380}}while(0);do{if(r2==2380){if((_tolower(r14&255)|0)==(_tolower(HEAPU8[r15])|0)){r10=r8;break}else{break L3217}}}while(0);while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}HEAP32[r5]=r10;_parse_name(r4);r9=HEAP32[r5];r7=r9;while(1){if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r7+1|0}}r11=HEAP8[r7];if(r11<<24>>24==0|r11<<24>>24==HEAP8[5264164]<<24>>24){r6=r9;STACKTOP=r3;return r6}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r6=r9;STACKTOP=r3;return r6}}while(0);HEAP32[r5]=r1;r6=r1;STACKTOP=r3;return r6}function _parse_cpu_special(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11;r2=0;r3=STACKTOP;STACKTOP=STACKTOP+4|0;r4=r3,r5=r4>>2;HEAP32[r5]=r1;HEAP8[5261828]=0;HEAP8[5261824]=0;HEAP8[5264204]=0;r6=HEAP8[r1];do{if(r6<<24>>24==46|r6<<24>>24==95){r2=2402}else{if((_isalpha(r6&255)|0)==0){r7=r1;break}else{r2=2402;break}}}while(0);L3247:do{if(r2==2402){if((_parse_rcm_identifier(r4)|0)==-1){r7=_parse_z80asm_pseudo(HEAP32[r5]);break}else{r8=0;r9=r1}while(1){if((r8|0)>=2){r7=r9;break L3247}r6=HEAP32[r5];while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[r5]=r6;r10=(_parse_rcm_identifier(r4)|0)==-1;r11=HEAP32[r5];if(r10){r7=r11;break L3247}else{r8=r8+1|0;r9=r11}}}}while(0);STACKTOP=r3;return r7}function _parse_rcm_identifier(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=0;r3=HEAP32[r1>>2];r4=r3;while(1){r5=HEAP8[r4];if(r5<<24>>24!=95){if((_isalnum(r5&255)|0)==0){break}}r4=r4+1|0}r5=r4-r3|0;if((r5|0)==3){r2=2420}else if((r5|0)==4){r2=2414}else{r6=-1;return r6}L3267:do{if(r2==2414){r7=(_tolower(HEAPU8[r3])|0)==(_tolower(97)|0);r8=HEAP8[r3];do{if(r7){if(r8<<24>>24==0){break}r9=r3+1|0;r10=(_tolower(HEAPU8[r9])|0)==(_tolower(108)|0);r11=HEAP8[r9];if(!r10){r12=r11;r13=5269641;r2=2417;break}if(r11<<24>>24==0){break}r11=r3+2|0;r10=(_tolower(HEAPU8[r11])|0)==(_tolower(116)|0);r9=HEAP8[r11];if(!r10){r12=r9;r13=5269642;r2=2417;break}if(r9<<24>>24==0){break}r12=HEAP8[r3+3|0];r13=5269643;r2=2417;break}else{r12=r8;r13=5269640;r2=2417}}while(0);do{if(r2==2417){if((_tolower(r12&255)|0)==(_tolower(HEAPU8[r13])|0)){break}if((r5|0)==3){r2=2420;break L3267}else{r6=-1}return r6}}while(0);HEAP8[5264204]=1;break}}while(0);L3281:do{if(r2==2420){r5=(_tolower(HEAPU8[r3])|0)==(_tolower(105)|0);r13=HEAP8[r3];do{if(r5){if(r13<<24>>24==0){break}r12=r3+1|0;r8=(_tolower(HEAPU8[r12])|0)==(_tolower(111)|0);r7=HEAP8[r12];if(!r8){r14=r7;r15=5269637;r2=2423;break}if(r7<<24>>24==0){break}r14=HEAP8[r3+2|0];r15=5269638;r2=2423;break}else{r14=r13;r15=5269636;r2=2423}}while(0);do{if(r2==2423){if((_tolower(r14&255)|0)==(_tolower(HEAPU8[r15])|0)){break}r13=(_tolower(HEAPU8[r3])|0)==(_tolower(105)|0);r5=HEAP8[r3];do{if(r13){if(r5<<24>>24==0){break}r7=r3+1|0;r8=(_tolower(HEAPU8[r7])|0)==(_tolower(111)|0);r12=HEAP8[r7];if(!r8){r16=r12;r17=5269625;r2=2428;break}if(r12<<24>>24==0){break}r16=HEAP8[r3+2|0];r17=5269626;r2=2428;break}else{r16=r5;r17=5269624;r2=2428}}while(0);do{if(r2==2428){if((_tolower(r16&255)|0)==(_tolower(HEAPU8[r17])|0)){break}else{r6=-1}return r6}}while(0);HEAP8[5261828]=1;break L3281}}while(0);HEAP8[5261824]=1}}while(0);HEAP32[r1>>2]=r4;r6=0;return r6}function _eval_data(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5,r7=r6>>2;r8=r5+4;do{if((HEAP32[1315960]|0)==0){r9=_malloc(12);r10=r9;if((r9|0)!=0){r11=r10,r12=r11>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r11=r10,r12=r11>>2}else{r10=_malloc(20);if((r10|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r10+8|0,r13=r9>>2;HEAP32[r10+4>>2]=12;HEAP32[r13]=-572662307;HEAP32[r13+1]=-572662307;HEAP32[r13+2]=-572662307;r11=r9,r12=r11>>2}}while(0);r9=r11;HEAP32[r12]=0;r13=r11+4|0;HEAP32[r13>>2]=0;r10=r11+8|0;HEAP32[r10>>2]=0;if(!((r2|0)==32|(r2|0)==24|(r2|0)==16|(r2|0)==8)){_cpu_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r2,tempInt))}r11=r2>>3;HEAP32[r12]=r11;do{if((HEAP32[1315960]|0)==0){r14=_malloc(r11);r15=r14;if((r14|0)!=0){r16=r15;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r16=r15}else{r15=_malloc(r11+8|0);if((r15|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r14=r15+8|0;HEAP32[r15+4>>2]=r11;_memset(r14,-35,r11);r16=r14}}while(0);r11=r13;HEAP32[r13>>2]=r16;r16=r1+16|0;L3323:do{if((_eval_expr(HEAP32[r16>>2],r6,r3,r4)|0)==0){HEAP32[1311085]=0;r1=_find_base(HEAP32[r16>>2],r8,r3,r4);do{if((r1|0)!=1){if((r1|0)==2&(HEAP32[1311085]|0)==0){break}_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break L3323}}while(0);r13=HEAP32[_add_nreloc(r10,HEAP32[r8>>2],HEAP32[r7],(r1|0)==2?2:1,r2,0)+4>>2];r14=HEAP32[r7];r15=HEAP32[1311085];if((r15|0)==24){HEAP32[r13+8>>2]=255;r17=r14&255}else if((r15|0)==25){HEAP32[r13+8>>2]=65280;r17=r14>>>8&255}else{r17=r14}HEAP32[r7]=r17}}while(0);r17=HEAP32[r7];do{if((r2|0)<16){if((r17+128|0)>>>0<=383){break}_cpu_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r17,tempInt))}}while(0);r2=HEAP32[r11>>2];r11=HEAP32[r12];r12=r17;r7=(r17|0)<0?-1:0;do{if(r11>>>0>8){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=148,HEAP32[tempInt+8>>2]=5268944,tempInt));r18=r11;r19=r7;r20=r12;r21=r2;break}else{if((r11|0)!=0){r18=r11;r19=r7;r20=r12;r21=r2;break}STACKTOP=r5;return r9}}while(0);while(1){r2=r18-1|0;HEAP8[r21]=r20&255;r12=r20>>>8|r19<<24;if((r2|0)==0){break}else{r18=r2;r19=r19>>>8|0<<24;r20=r12;r21=r21+1|0}}STACKTOP=r5;return r9}function _eval_instruction(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+172|0;r7=r6,r8=r7>>2;r9=r6+4;r10=r6+8,r11=r10>>2;r12=r6+12;r13=r6+16,r14=r13>>2;r15=r6+20;r16=r6+24;r17=r6+28;r18=r6+32,r19=r18>>2;r20=r6+36;r21=r6+164;r22=r6+168;r23=HEAP32[r4];r24=((r23*44&-1)+5244344|0)>>2;HEAP32[r19]=0;r25=_instruction_size(r1,0,0);r26=HEAP32[1315968];L3346:do{if((HEAPU8[(r23*44&-1)+5244364|0]&r26|0)==0){r27=HEAP32[r24];_cpu_error(1,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1315967],HEAP32[tempInt+4>>2]=r27,tempInt));r28=1}else{if((r26&156|0)==0){r28=0;break}do{if((r26&4|0)==0){if((r26&16|0)!=0){r29=(r23*44&-1)+5244380|0;break}if((r26&8|0)!=0){r29=(r23*44&-1)+5244376|0;break}if((r26&128|0)==0){r28=0;break L3346}r29=(r23*44&-1)+5244384|0}else{r29=(r23*44&-1)+5244372|0}}while(0);if((HEAP32[r29>>2]|0)!=2){r28=0;break}r27=r20|0;if(!HEAP8[5244080]){r30=HEAP32[r24];_cpu_error(13,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1315967],HEAP32[tempInt+4>>2]=r30,tempInt));r28=1;break}_snprintf(r27,128,5269648,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));do{if((_find_name(HEAP32[1310781],r27,r17)|0)==0){r5=2491}else{if((HEAP32[r17>>2]|0)==0){r5=2491;break}else{break}}}while(0);if(r5==2491){_new_import(r27)}do{if((HEAP32[1315960]|0)==0){r30=_malloc(12);r31=r30;if((r30|0)!=0){r32=r31;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r32=r31}else{r31=_malloc(20);if((r31|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r30=r31+8|0,r33=r30>>2;HEAP32[r31+4>>2]=12;HEAP32[r33]=-572662307;HEAP32[r33+1]=-572662307;HEAP32[r33+2]=-572662307;r32=r30}}while(0);r30=r32;r33=r32+4|0;HEAP32[r33>>2]=0;r31=r32+8|0;HEAP32[r31>>2]=0;HEAP32[r32>>2]=3;do{if((HEAP32[1315960]|0)==0){r34=_malloc(3);r35=r34;if((r34|0)!=0){r36=r35;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r36=r35}else{r35=_malloc(11);if((r35|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r34=r35+8|0;HEAP32[r35+4>>2]=3;HEAP16[r34>>1]=56797;HEAP8[r34+2|0]=221;r36=r34}}while(0);r34=r36;HEAP32[r33>>2]=r36;r35=r34+1|0;HEAP8[r34]=-51;HEAP32[1310797]=r27;HEAP8[5261784]=0;r37=_expression();_simplify_expr(r37);do{if((_eval_expr(r37,r21,r2,r3)|0)==0){if((_find_base(r37,r22,r2,r3)|0)==1){_add_nreloc(r31,HEAP32[r22>>2],HEAP32[r21>>2],1,8,8);break}else{_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}}}while(0);r31=HEAP32[r21>>2];HEAP8[r35]=r31&255;HEAP8[r34+2|0]=(r31|0)/256&-1&255;_free_expr(r37);r38=r30;STACKTOP=r6;return r38}}while(0);r21=(r1+12|0)>>2;L3394:do{if((HEAP32[1315968]&28|0)==0){if((HEAP32[r21]|0)==0){r39=r28}else{_cpu_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5269640,tempInt));r39=1}if((HEAP32[r4+4]|0)==0){r40=r39}else{_cpu_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5269636,tempInt));r40=1}if((HEAP32[r4+5]|0)==0){r41=r40;break}_cpu_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=5269624,tempInt));r41=1}else{r22=r1+20|0;do{if((HEAP32[r22>>2]|0)==0){r42=r28}else{if((HEAP32[r4+4]|0)==0){r42=r28;break}_cpu_error(15,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r42=1}}while(0);do{if((HEAP32[r21]|0)==0){r43=r42}else{r30=(r23*44&-1)+5244368|0;r37=HEAP32[r30>>2];do{if((r37&4|0)==0){if((r37&2|0)!=0){r44=r42;break}r34=HEAP32[r24];_cpu_error(16,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=5269640,HEAP32[tempInt+4>>2]=r34,tempInt));r44=1}else{r34=HEAP32[r24];_cpu_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=5269640,HEAP32[tempInt+4>>2]=r34,tempInt));r44=r42}}while(0);do{if((HEAP32[r30>>2]&8|0)!=0){do{if((HEAP32[(r23*44&-1)+5244348>>2]&8192|0)==0){r5=2528}else{if((HEAP32[HEAP32[r4+1]>>2]&31|0)==6){break}else{r5=2528;break}}}while(0);if(r5==2528){if((HEAP32[(r23*44&-1)+5244352>>2]&8192|0)==0){break}if((HEAP32[HEAP32[r4+2]>>2]&31|0)!=6){break}}r37=HEAP32[r24];_cpu_error(18,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=5269640,HEAP32[tempInt+4>>2]=r37,tempInt))}}while(0);r30=HEAP32[r4+1];if((r30|0)==0){r43=r44;break}r37=HEAP32[r30>>2];if(!((r37|0)==34|(r37|0)==66)){r43=r44;break}_cpu_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r43=r44}}while(0);L3419:do{if((HEAP32[r22>>2]|0)!=0){if((HEAP32[(r23*44&-1)+5244368>>2]&1|0)!=0){break}r37=HEAP32[r4+1];do{if((r37|0)!=0){if((HEAP32[r37+4>>2]&63|0)!=4){break}if((HEAP32[r37>>2]&31|0)==6){break L3419}}}while(0);r37=HEAP32[r4+2];do{if((r37|0)!=0){if((HEAP32[r37+4>>2]&63|0)!=4){break}if((HEAP32[r37>>2]&31|0)==6){break L3419}}}while(0);r37=HEAP32[r24];_cpu_error(18,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=5269624,HEAP32[tempInt+4>>2]=r37,tempInt))}}while(0);if((HEAP32[r4+4]|0)==0){r41=r43;break}if((HEAP32[(r23*44&-1)+5244368>>2]&1|0)!=0){r41=r43;break}r22=HEAP32[r4+1];do{if((r22|0)!=0){if((HEAP32[r22+4>>2]&63|0)!=4){break}if((HEAP32[r22>>2]&31|0)==6){r41=r43;break L3394}}}while(0);r22=HEAP32[r4+2];do{if((r22|0)!=0){if((HEAP32[r22+4>>2]&63|0)!=4){break}if((HEAP32[r22>>2]&31|0)==6){r41=r43;break L3394}}}while(0);r22=HEAP32[r24];_cpu_error(18,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=5269636,HEAP32[tempInt+4>>2]=r22,tempInt));r41=r43}}while(0);r43=HEAP32[1315968];do{if((r43&60|0)==0){r45=r41;r46=r43}else{r44=HEAP32[r4+1];do{if((r44|0)==0){r5=2555}else{if((HEAP32[r44+4>>2]|0)==132){break}else{r5=2555;break}}}while(0);if(r5==2555){r44=HEAP32[r4+2];if((r44|0)==0){r45=r41;r46=r43;break}if((HEAP32[r44+4>>2]|0)!=132){r45=r41;r46=r43;break}}_cpu_error((r43&28|0)!=0?10:11,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r45=1;r46=HEAP32[1315968]}}while(0);do{if((r46&129|0)==0){r47=r45}else{r43=HEAP32[r4+1];do{if((r43|0)==0){r5=2561}else{if((HEAP32[r43+4>>2]&128|0)==0){r5=2561;break}else{break}}}while(0);if(r5==2561){r43=HEAP32[r4+2];if((r43|0)==0){r47=r45;break}if((HEAP32[r43+4>>2]&128|0)==0){r47=r45;break}}_cpu_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[1315967],tempInt));r47=1}}while(0);do{if((HEAP32[1315960]|0)==0){r45=_malloc(12);r46=r45;if((r45|0)!=0){r48=r46,r49=r48>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r48=r46,r49=r48>>2}else{r46=_malloc(20);if((r46|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r45=r46+8|0,r43=r45>>2;HEAP32[r46+4>>2]=12;HEAP32[r43]=-572662307;HEAP32[r43+1]=-572662307;HEAP32[r43+2]=-572662307;r48=r45,r49=r48>>2}}while(0);r45=r48;r43=r48+4|0,r46=r43>>2;HEAP32[r46]=0;r41=r48+8|0;HEAP32[r41>>2]=0;HEAP32[r49]=r25;do{if((HEAP32[1315960]|0)==0){r48=_malloc(r25);r44=r48;if((r48|0)!=0){r50=r44;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r50=r44}else{r44=_malloc(r25+8|0);if((r44|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r48=r44+8|0;HEAP32[r44+4>>2]=r25;_memset(r48,-35,r25);r50=r48}}while(0);r48=r43;HEAP32[r46]=r50;r43=((r23*44&-1)+5244356|0)>>2;r44=HEAP32[r43];r42=r50;do{if((r44|0)==1){r28=HEAP32[HEAP32[r4+1]>>2];r40=HEAP32[r4+2];if((r40|0)==0|(r28|0)==13){r51=r28&31;break}r51=HEAP32[r40>>2]&31}else if((r44|0)==3){r40=(r1+4|0)>>2;r28=HEAP32[HEAP32[r40]>>2];do{if((r28&96|0)==0){r52=r28}else{r39=HEAP32[HEAP32[r4+2]>>2];if((r39&96|0)==0){r52=r28;break}do{if((r28&32|0)==0){r5=2587}else{if((r39&64|0)==0){r5=2587;break}else{break}}}while(0);if(r5==2587){if((r39&32|0)==0){r52=r28;break}if((r28&64|0)==0){r52=r28;break}}_cpu_error(23,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r52=HEAP32[HEAP32[r40]>>2]}}while(0);do{if((r52&96|0)==0){r53=r52}else{r28=HEAP32[r4+2];if((HEAP32[r28>>2]&96|0)==0){r53=r52;break}if((HEAP32[r28+4>>2]&512|0)==0){r53=r52;break}_cpu_error(23,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r53=HEAP32[HEAP32[r40]>>2]}}while(0);r28=r1+8|0;do{if((r53&96|0)==0){r54=r53}else{if((HEAP32[HEAP32[r28>>2]>>2]&31|0)!=6){r54=r53;break}_cpu_error(24,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r54=HEAP32[HEAP32[r40]>>2]}}while(0);r51=(HEAP32[HEAP32[r28>>2]>>2]&31)+(r54<<3&248)|0}else if((r44|0)==9){if((_eval_expr(HEAP32[HEAP32[r4+1]+16>>2],r18,r2,r3)|0)==0){_cpu_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}r40=HEAP32[r19];if(r40>>>0<3){r51=(r40|0)==2?24:r40<<4;break}_cpu_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r24],HEAP32[tempInt+4>>2]=r40,tempInt));r38=r45;STACKTOP=r6;return r38}else if((r44|0)==15){if((_eval_expr(HEAP32[HEAP32[r4+2]+16>>2],r18,r2,r3)|0)==0){_cpu_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}if((HEAP32[r19]|0)==0){r51=0;break}_cpu_error(22,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}else if((r44|0)==4){r40=(r23*44&-1)+5244352|0;r22=HEAP32[r40>>2];do{if(!((r22|0)==0|(r22&20|0)==0)){if((HEAP32[(r23*44&-1)+5244348>>2]|0)==0){break}if((HEAP32[HEAP32[r4+1]>>2]&31|0)!=2){break}_cpu_error(25,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r22=(r1+4|0)>>2;do{if((HEAP32[HEAP32[r22]+4>>2]&63|0)==2){if((HEAP32[HEAP32[r4+2]+4>>2]&63|0)!=7){break}_cpu_error(25,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r28=HEAP32[r40>>2];if((r28|0)==0|(r28&1024|0)==0){r28=HEAP32[HEAP32[r22]>>2]&31;if((r28|0)==4){r51=48;break}r51=r28<<4;break}r28=HEAP32[HEAP32[r4+2]>>2];r37=r28&31;r30=r37<<4;r34=HEAP32[HEAP32[r22]>>2];if(!((r34&31|0)==2&(r37|0)==2)){r51=r30;break}if(((r34^r28)&96|0)==0){r51=r30;break}_cpu_error(21,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r51=r30}else if((r44|0)==5|(r44|0)==6){if((HEAP32[(r23*44&-1)+5244348>>2]-18|0)>>>0>=2){r51=0;break}r30=r1+4|0;r28=HEAP32[HEAP32[r30>>2]+8>>2];r34=r28<<3;r37=HEAP32[1315968];r35=(r28|0)>3;if((r37&128|0)!=0&r35){_cpu_error(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}do{if((HEAP32[(r23*44&-1)+5244360>>2]|0)==196){if((r37&28|0)==0){break}if(!HEAP8[5244080]){r28=HEAP32[r24];_cpu_error(13,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1315967],HEAP32[tempInt+4>>2]=r28,tempInt));r38=r45;STACKTOP=r6;return r38}do{if((r50|0)!=0){if((HEAP32[1315960]|0)==0){_free(r42);break}else{_memset(r42,-1,HEAP32[r50-4>>2]);_free(r50-8|0);break}}}while(0);do{if((HEAP32[1315960]|0)==0){r39=_malloc(6);r28=r39;if((r39|0)!=0){r55=r28;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r55=r28}else{r28=_malloc(14);if((r28|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r39=r28+8|0;HEAP32[r28+4>>2]=6;HEAP32[r39>>2]=-572662307;HEAP16[r39+4>>1]=56797;r55=r39}}while(0);r39=r55;r28=r55;HEAP32[r46]=r28;r36=HEAP32[HEAP32[r30>>2]+8>>2];do{if((r36|0)<4){if((r36|0)==1){HEAP8[r39]=32;HEAP8[r39+1|0]=3;r56=r39+2|0;break}else if((r36|0)==2){HEAP8[r39]=56;HEAP8[r39+1|0]=3;r56=r39+2|0;break}else if((r36|0)==3){HEAP8[r39]=48;HEAP8[r39+1|0]=3;r56=r39+2|0;break}else if((r36|0)==0){HEAP8[r39]=40;HEAP8[r39+1|0]=3;r56=r39+2|0;break}else{r56=r39;break}}else{if((r36|0)==4){HEAP8[r39]=-22;r57=r39+1|0}else if((r36|0)==5){HEAP8[r39]=-30;r57=r39+1|0}else if((r36|0)==7){HEAP8[r39]=-14;r57=r39+1|0}else if((r36|0)==6){HEAP8[r39]=-6;r57=r39+1|0}else{r57=r39}HEAP32[1310797]=5269320;HEAP8[5261784]=0;r32=_expression();_simplify_expr(r32);do{if((_eval_expr(r32,r13,r2,r3)|0)==0){if((_find_base(r32,r15,r2,r3)|0)==1){_add_nreloc(r41,HEAP32[r15>>2],HEAP32[r14],1,8,r57-r28<<3);break}else{_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}}}while(0);_free_expr(r32);r17=HEAP32[r14];HEAP8[r57]=r17&255;HEAP8[r57+1|0]=(r17|0)/256&-1&255;r56=r57+2|0}}while(0);r39=r56+1|0;HEAP8[r56]=-51;r36=r1+8|0;do{if((_eval_expr(HEAP32[HEAP32[r36>>2]+16>>2],r13,r2,r3)|0)==0){if((_find_base(HEAP32[HEAP32[r36>>2]+16>>2],r16,r2,r3)|0)==1){_add_nreloc(r41,HEAP32[r16>>2],HEAP32[r14],1,8,r39-r28<<3);break}else{_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}}}while(0);r36=HEAP32[r14];HEAP8[r39]=r36&255;HEAP8[r56+2|0]=(r36|0)/256&-1&255;HEAP32[r49]=r56+3-r28|0;r38=r45;STACKTOP=r6;return r38}}while(0);r30=HEAP32[r24];if((_strcmp(r30,5268140)|0)==0){if(!r35){r51=r34;break}}else{if((_strcmp(r30,5268052)|0)!=0|r35^1){r51=r34;break}}_cpu_error(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r30,tempInt));r38=r45;STACKTOP=r6;return r38}else if((r44|0)==7){if((_eval_expr(HEAP32[HEAP32[r4+1]+16>>2],r18,r2,r3)|0)==0){_cpu_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}r30=HEAP32[r19];if(r30>>>0<8){r51=(r30<<3)+(HEAP32[HEAP32[r4+2]>>2]&31)|0;break}_cpu_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r30,tempInt));r38=r45;STACKTOP=r6;return r38}else if((r44|0)==8){if((_eval_expr(HEAP32[HEAP32[r4+1]+16>>2],r18,r2,r3)|0)==0){_cpu_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}r30=HEAP32[r19];if(!(r30>>>0<57&(r30&7|0)==0)){_cpu_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r30,HEAP32[tempInt+4>>2]=r30,tempInt));r38=r45;STACKTOP=r6;return r38}if((HEAP32[1315968]|0)!=4){r51=r30;break}if(!((r30|0)==48|(r30|0)==8|(r30|0)==0)){r51=r30;break}_cpu_error(9,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r30,tempInt));r38=r45;STACKTOP=r6;return r38}else if((r44|0)==2){if((HEAP32[(r23*44&-1)+5244348>>2]&63|0)==4){r51=HEAP32[HEAP32[r4+1]>>2]<<3&248;break}if((HEAP32[(r23*44&-1)+5244352>>2]&63|0)!=4){r51=0;break}r51=HEAP32[HEAP32[r4+2]>>2]<<3&248}else if((r44|0)==11){if((_eval_expr(HEAP32[HEAP32[r4+1]+16>>2],r18,r2,r3)|0)==0){_cpu_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r24],tempInt));r38=r45;STACKTOP=r6;return r38}r30=HEAP32[r19];if(r30>>>0<4){r37=r30<<4;if((r30|0)<2){r51=r37;break}r51=r37-24|0;break}else{_cpu_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r24],HEAP32[tempInt+4>>2]=r30,tempInt));r38=r45;STACKTOP=r6;return r38}}else if((r44|0)==14){if((HEAP32[(r23*44&-1)+5244352>>2]&63|0)==37){r58=(HEAP32[HEAP32[r4+2]>>2]<<4)-256|0}else{r58=0}if((HEAP32[(r23*44&-1)+5244348>>2]&63|0)!=37){r51=r58;break}r51=(HEAP32[HEAP32[r4+1]>>2]<<6)+(r58-1024)|0}else if((r44|0)==12){if((HEAP32[(r23*44&-1)+5244352>>2]&63|0)==37){r51=(HEAP32[HEAP32[r4+2]>>2]<<4)-256|0;break}else{r51=(HEAP32[HEAP32[r4+1]>>2]<<4)-256|0;break}}else{r51=0}}while(0);if((r47|0)!=0){r38=r45;STACKTOP=r6;return r38}r47=HEAP32[r4+1],r44=r47>>2;r58=HEAP32[r4+2],r24=r58>>2;r19=HEAP32[r48>>2];if((HEAP32[r21]|0)==0){r59=r25;r60=r19}else{HEAP8[r19]=118;r59=r25-1|0;r60=r19+1|0}if((HEAP32[r4+4]|0)==0){r61=r59;r62=r60}else{HEAP8[r60]=-45;r61=r59-1|0;r62=r60+1|0}if((HEAP32[r4+5]|0)==0){r63=r61;r64=r62}else{HEAP8[r62]=-37;r63=r61-1|0;r64=r62+1|0}do{if((r47|0)==0){r65=r63;r66=0;r67=0;r68=0;r69=0}else{r62=HEAP32[r44];r61=HEAP32[r44+1];r4=(r61&512|0)==0?0:r47;do{if((r62&32|0)==0){if((r62&64|0)==0){r70=0;break}r70=HEAP8[5243128]?221:253}else{r70=HEAP8[5243128]?253:221}}while(0);r62=r61&63;if((r62|0)==1){r65=r63-1|0;r66=1;r67=HEAP32[r44+4];r68=r70;r69=r4;break}else if((r62|0)==2){r65=r63-2|0;r66=2;r67=HEAP32[r44+4];r68=r70;r69=r4;break}else if((r62|0)==25){r65=r63-3|0;r66=3;r67=HEAP32[r44+4];r68=r70;r69=r4;break}else if((r62|0)==32){r65=r63-4|0;r66=4;r67=HEAP32[r44+4];r68=r70;r69=r4;break}else{r65=r63;r66=1;r67=0;r68=r70;r69=r4;break}}}while(0);do{if((r58|0)==0){r71=r65;r72=r66;r73=r67;r74=r68;r75=r69}else{r70=HEAP32[r24];r63=HEAP32[r24+1];r44=(r63&512|0)==0?r69:r58;if((r70&32|0)==0){r76=(r70&64|0)==0?r68:253}else{r76=221}r70=r63&63;if((r70|0)==1){r71=r65-1|0;r72=1;r73=HEAP32[r24+4];r74=r76;r75=r44;break}else if((r70|0)==2){r71=r65-2|0;r72=2;r73=HEAP32[r24+4];r74=r76;r75=r44;break}else if((r70|0)==25){r71=r65-3|0;r72=3;r73=HEAP32[r24+4];r74=r76;r75=r44;break}else if((r70|0)==32){r71=r65-4|0;r72=4;r73=HEAP32[r24+4];r74=r76;r75=r44;break}else{r71=r65;r72=r66;r73=r67;r74=r76;r75=r44;break}}}while(0);r76=HEAP32[r43];do{if((r76|0)==10){r77=(r74|0)==0?237:r74;r5=2715;break}else if((r76|0)==13|(r76|0)==12){r78=r71;r79=r64}else{if((r74|0)==0){r78=r71;r79=r64;break}else{r77=r74;r5=2715;break}}}while(0);if(r5==2715){HEAP8[r64]=r77&255;r78=r71-1|0;r79=r64+1|0}r64=(r75|0)!=0;r71=(r64<<31>>31)+r78|0;do{if((r71|0)==3){r80=r79;r81=(r23*44&-1)+5244360|0;r5=2721;break}else if((r71|0)==2){r82=r79;r83=(r23*44&-1)+5244360|0;r5=2722;break}else if((r71|0)==1){r84=r79;r85=(r23*44&-1)+5244360|0;r5=2723;break}else if((r71|0)==4){r78=(r23*44&-1)+5244360|0;HEAP8[r79]=HEAP32[r78>>2]>>>24&255;r80=r79+1|0;r81=r78;r5=2721;break}else{r86=r79}}while(0);do{if(r5==2721){HEAP8[r80]=HEAP32[r81>>2]>>>16&255;r82=r80+1|0;r83=r81;r5=2722;break}}while(0);do{if(r5==2722){HEAP8[r82]=HEAP32[r83>>2]>>>8&255;r84=r82+1|0;r85=r83;r5=2723;break}}while(0);if(r5==2723){HEAP8[r84]=HEAP32[r85>>2]+r51&255;r86=r84+1|0}do{if(r64){HEAP32[r8]=0;r84=(HEAP32[(r23*44&-1)+5244360>>2]&-256|0)==51968;r51=r75+16|0;r85=HEAP32[r51>>2];do{if((r85|0)!=0){if((_eval_expr(r85,r7,r2,r3)|0)!=0){break}HEAP32[1311085]=0;if((_find_base(HEAP32[r51>>2],r9,r2,r3)|0)!=1){_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}r83=HEAP32[r8];if(r84){r87=r86-1-r19|0}else{r87=r86-r19|0}r82=HEAP32[_add_nreloc(r41,HEAP32[r9>>2],r83,1,8,r87<<3)+4>>2];r81=HEAP32[1311085];if((r81|0)==24){HEAP32[r82+8>>2]=255;r88=r83&255}else if((r81|0)==25){HEAP32[r82+8>>2]=65280;r88=r83>>>8&255}else{r88=r83}HEAP32[r8]=r88}}while(0);r51=HEAP32[r75>>2];r85=HEAP32[r8];if(!(((r51|0)==3|(r51&31|0)==2)&r85>>>0<256|(r85+128|0)>>>0<256)){_cpu_error(0,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r85,tempInt));r89=r86;break}if(r84){r51=r86-1|0;HEAP8[r86]=HEAP8[r51];HEAP8[r51]=HEAP32[r8]&255;r89=r86;break}else{HEAP8[r86]=r85&255;r89=r86+1|0;break}}else{r89=r86}}while(0);if((r73|0)==0){r38=r45;STACKTOP=r6;return r38}do{if((_eval_expr(r73,r10,r2,r3)|0)==0){HEAP32[1311085]=0;if((_find_base(r73,r12,r2,r3)|0)!=1){_general_error(38,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}r86=r41;r8=HEAP32[r12>>2];r75=HEAP32[r11];if((HEAP32[r43]|0)==6){_add_nreloc(r86,r8,r75-1|0,2,r72<<3,r89-r19<<3);HEAP32[r11]=r75-r3-HEAP32[r49]|0;if((HEAP32[1311085]|0)==0){break}_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=1524,HEAP32[tempInt+8>>2]=5269328,tempInt));break}r88=HEAP32[_add_nreloc(r86,r8,r75,1,r72<<3,r89-r19<<3)+4>>2];r8=HEAP32[1311085];if((r8|0)==24){HEAP32[r88+8>>2]=255;r90=r75&255}else if((r8|0)==25){HEAP32[r88+8>>2]=65280;r90=r75>>>8&255}else{r90=r75}HEAP32[r11]=r90}else{if((HEAP32[r43]|0)!=6){break}HEAP32[r11]=HEAP32[r11]-(HEAP32[r49]+r3)|0}}while(0);r3=HEAP32[r11];if((r72|0)==1){r5=2755}else if((r72|0)==0){r38=r45;STACKTOP=r6;return r38}L3745:do{if(r5==2755){do{if((r3+128|0)>>>0<=383){if((HEAP32[r43]|0)==6&(r3|0)>127){break}if((r72|0)==0){r38=r45}else{break L3745}STACKTOP=r6;return r38}}while(0);_cpu_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));r38=r45;STACKTOP=r6;return r38}}while(0);r43=r72;r72=(r3|0)<0?-1:0;r5=r3;r3=r89;while(1){r89=r43-1|0;HEAP8[r3]=r5&255;r84=r5>>>8|r72<<24;if((r89|0)==0){r38=r45;break}else{r43=r89;r72=r72>>>8|0<<24;r5=r84;r3=r3+1|0}}STACKTOP=r6;return r38}function _cpu_args(r1){var r2;if((_strcmp(r1,5269616)|0)==0){HEAP32[1315968]=1;HEAP32[1315967]=5269568;r2=1;return r2}if((_strcmp(r1,5269556)|0)==0){HEAP32[1315968]=4;HEAP32[1315967]=5269536;r2=1;return r2}if((_strcmp(r1,5269520)|0)==0){HEAP32[1315968]=8;HEAP32[1315967]=5269508;r2=1;return r2}if((_strcmp(r1,5269496)|0)==0){HEAP32[1315968]=16;HEAP32[1315967]=5269484;r2=1;return r2}if((_strcmp(r1,5269472)|0)==0){HEAP32[1315968]=32;HEAP32[1315967]=5269456;r2=1;return r2}if((_strcmp(r1,5269448)|0)==0){HEAP32[1315968]=128;HEAP32[1315967]=5269408;r2=1;return r2}if((_strcmp(r1,5269396)|0)==0){HEAP8[5243128]=1;r2=1;return r2}if((_strcmp(r1,5269356)|0)==0){HEAP8[5244080]=1;r2=1;return r2}if((_strcmp(r1,5269344)|0)!=0){r2=0;return r2}HEAP8[5242880]=1;r2=1;return r2}function _handle_org(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+16|0;r3=r2;do{if(HEAP8[r1]<<24>>24==HEAP8[5263848]<<24>>24){r4=r1+1|0;while(1){r5=r4+1|0;if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r5}}if(HEAP8[r4]<<24>>24==43){r6=r5}else{break}while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[1310797]=r6;HEAP8[5261784]=1;r4=_expression();_simplify_expr(r4);r7=HEAP32[1310797];while(1){r8=r7+1|0;if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r8}}if(HEAP8[r7]<<24>>24==44){r9=r8;while(1){if((_isspace(HEAPU8[r9])|0)==0){break}else{r9=r9+1|0}}HEAP32[1310797]=r9;HEAP8[5261784]=1;r10=_expression();_simplify_expr(r10);r11=r10;r12=HEAP32[1310797]}else{r11=0;r12=r7}_add_atom(0,_new_space_atom(r4,1,r11));r10=r12;while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}r4=HEAP8[r10];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}}while(0);HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r12=HEAP32[1310797];if((r1|0)==0){r13=0}else{_simplify_expr(r1);if((HEAP32[r1>>2]|0)==21){r14=HEAP32[r1+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=0}_free_expr(r1);r13=r14}r14=r3|0;r3=HEAP32[1310728]&((r13|0)<0?-1:0);_sprintf(r14,5268592,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[1310727]&r13,HEAP32[tempInt+4>>2]=r3,tempInt));r3=_new_section(r14,5270372,1);HEAP32[r3+32>>2]=r13;HEAP32[r3+28>>2]=r13;HEAP32[1315961]=r3;r3=r12;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}r12=HEAP8[r3];if(r12<<24>>24==0|r12<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_rorg(r1){var r2,r3,r4,r5;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];if((r1|0)==0){r4=0}else{_simplify_expr(r1);if((HEAP32[r1>>2]|0)==21){r5=HEAP32[r1+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}_free_expr(r1);r4=r5}_add_atom(0,_new_rorg_atom(r4));r4=r3;while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}r3=HEAP8[r4];if(r3<<24>>24==0|r3<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_rend(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(28);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(36);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=28;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;HEAP32[r7+4]=-572662307;HEAP32[r7+5]=-572662307;HEAP32[r7+6]=-572662307;r5=r3,r6=r5>>2}}while(0);HEAP32[r6]=0;HEAP32[r6+1]=12;HEAP32[r6+2]=1;_add_atom(0,r5);r5=r1;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}r1=HEAP8[r5];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_align(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];do{if((r1|0)==0){r4=0}else{_simplify_expr(r1);if((HEAP32[r1>>2]|0)!=21){_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_free_expr(r1);r4=0;break}r5=HEAP32[r1+12>>2];_free_expr(r1);if((r5|0)<=63){r4=r5;break}_syntax_error(21,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=r5}}while(0);r1=_bitshift64Shl(1,0,r4);do{if((HEAP32[1315960]|0)==0){r4=_malloc(16);r5=r4;if((r4|0)!=0){r6=r5,r7=r6>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r6=r5,r7=r6>>2}else{r5=_malloc(24);if((r5|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r4=r5+8|0,r8=r4>>2;HEAP32[r5+4>>2]=16;HEAP32[r8]=-572662307;HEAP32[r8+1]=-572662307;HEAP32[r8+2]=-572662307;HEAP32[r8+3]=-572662307;r6=r4,r7=r6>>2}}while(0);HEAP32[r7+2]=0;HEAP32[r7+1]=0;HEAP32[r7]=21;HEAP32[r7+3]=0;r7=_new_space_atom(r6,1,0);HEAP32[r7+8>>2]=r1;_add_atom(0,r7);r7=r3;while(1){if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r7+1|0}}r3=HEAP8[r7];if(r3<<24>>24==0|r3<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_even(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(24);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=16;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;r5=r3,r6=r5>>2}}while(0);HEAP32[r6+2]=0;HEAP32[r6+1]=0;HEAP32[r6]=21;HEAP32[r6+3]=0;r6=_new_space_atom(r5,1,0);HEAP32[r6+8>>2]=2;_add_atom(0,r6);r6=r1;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}r1=HEAP8[r6];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_d8(r1){_handle_data_offset(r1,8,0);return}function _handle_text(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r5=_parse_string(r3,HEAP8[r1],8);r3=(HEAP32[1315960]|0)==0;do{if((r5|0)==0){do{if(r3){r6=_malloc(20);r7=r6;if((r6|0)!=0){r8=r7;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7}else{r7=_malloc(28);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r6=r7+8|0,r9=r6>>2;HEAP32[r7+4>>2]=20;HEAP32[r9]=-572662307;HEAP32[r9+1]=-572662307;HEAP32[r9+2]=-572662307;HEAP32[r9+3]=-572662307;HEAP32[r9+4]=-572662307;r8=r6}}while(0);r6=r8;HEAP32[r8+4>>2]=-1;HEAP32[r8>>2]=0;r9=r1;r7=0;while(1){r10=HEAP8[r9];r11=(r10<<24>>24==40&1)+r7|0;do{if(r10<<24>>24==41){if((r11|0)>0){r12=r11-1|0;break}else{_syntax_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r11;break}}else{r12=r11}}while(0);if(r10<<24>>24==0|r10<<24>>24==HEAP8[5264164]<<24>>24){break}if(r10<<24>>24==44&(r12|0)==0){break}else{r9=r9+1|0;r7=r12}}if((r12|0)!=0){_syntax_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=HEAP32[r4];if((_parse_operand(r7,r9-r7|0,r6,1)|0)==0){_syntax_error(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r13=r9;break}else{r7=_new_datadef_atom(8,r6);HEAP32[r7+8>>2]=1;_add_atom(0,r7);r13=r9;break}}else{do{if(r3){r7=_malloc(28);r11=r7;if((r7|0)!=0){r14=r11,r15=r14>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r14=r11,r15=r14>>2}else{r11=_malloc(36);if((r11|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r11+8|0,r16=r7>>2;HEAP32[r11+4>>2]=28;HEAP32[r16]=-572662307;HEAP32[r16+1]=-572662307;HEAP32[r16+2]=-572662307;HEAP32[r16+3]=-572662307;HEAP32[r16+4]=-572662307;HEAP32[r16+5]=-572662307;HEAP32[r16+6]=-572662307;r14=r7,r15=r14>>2}}while(0);HEAP32[r15]=0;HEAP32[r15+1]=2;HEAP32[r15+2]=1;HEAP32[r15+6]=r5;_add_atom(0,r14);r13=HEAP32[r4];break}}while(0);while(1){if((_isspace(HEAPU8[r13])|0)==0){break}else{r13=r13+1|0}}r4=HEAP8[r13];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_d16(r1){_handle_data_offset(r1,16,0);return}function _handle_d8_offset(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];if((r1|0)==0){r4=0}else{_simplify_expr(r1);if((HEAP32[r1>>2]|0)==21){r5=HEAP32[r1+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}_free_expr(r1);r4=r5}r5=r3;while(1){r6=r5+1|0;if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r6}}if(HEAP8[r5]<<24>>24==44){r7=r6}else{_syntax_error(9,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}while(1){if((_isspace(HEAPU8[r7])|0)==0){break}else{r7=r7+1|0}}_handle_data_offset(r7,8,r4);STACKTOP=r2;return}function _handle_spc8(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];while(1){r4=r3+1|0;if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r4}}if(HEAP8[r3]<<24>>24==44){r5=r4;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}HEAP32[1310797]=r5;HEAP8[5261784]=1;r5=_expression();_simplify_expr(r5);r6=r5;r7=HEAP32[1310797]}else{r6=0;r7=r3}_add_atom(0,_new_space_atom(r1,1,r6));r6=r7;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}r7=HEAP8[r6];if(r7<<24>>24==0|r7<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_spc16(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];while(1){r4=r3+1|0;if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r4}}if(HEAP8[r3]<<24>>24==44){r5=r4;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}HEAP32[1310797]=r5;HEAP8[5261784]=1;r5=_expression();_simplify_expr(r5);r6=r5;r7=HEAP32[1310797]}else{r6=0;r7=r3}_add_atom(0,_new_space_atom(r1,2,r6));r6=r7;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}r7=HEAP8[r6];if(r7<<24>>24==0|r7<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_fixedspc1(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(24);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=16;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;r5=r3,r6=r5>>2}}while(0);HEAP32[r6+2]=0;HEAP32[r6+1]=0;HEAP32[r6]=21;HEAP32[r6+3]=1;_add_atom(0,_new_space_atom(r5,1,0));r5=r1;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}r1=HEAP8[r5];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_fixedspc2(r1){var r2,r3,r4,r5,r6,r7;r2=STACKTOP;do{if((HEAP32[1315960]|0)==0){r3=_malloc(16);r4=r3;if((r3|0)!=0){r5=r4,r6=r5>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=r4,r6=r5>>2}else{r4=_malloc(24);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=r4+8|0,r7=r3>>2;HEAP32[r4+4>>2]=16;HEAP32[r7]=-572662307;HEAP32[r7+1]=-572662307;HEAP32[r7+2]=-572662307;HEAP32[r7+3]=-572662307;r5=r3,r6=r5>>2}}while(0);HEAP32[r6+2]=0;HEAP32[r6+1]=0;HEAP32[r6]=21;HEAP32[r6+3]=2;_add_atom(0,_new_space_atom(r5,1,0));r5=r1;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}r1=HEAP8[r5];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_assert(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r5=r1;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r6=HEAP32[1310797];HEAP32[r4]=r6;r7=r5;r8=r6;while(1){r9=r8+1|0;if((_isspace(HEAPU8[r8])|0)==0){break}else{r8=r9}}r10=r6-r7|0;HEAP32[r4]=r8;if(HEAP8[r8]<<24>>24==44){r8=r9;while(1){if((_isspace(HEAPU8[r8])|0)==0){break}else{r8=r8+1|0}}HEAP32[r4]=r8;r11=_parse_name(r3)}else{r11=0}r3=r10+1|0;do{if((HEAP32[1315960]|0)==0){r8=_malloc(r3);r4=r8;if((r8|0)!=0){r12=r4;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r4}else{r4=_malloc(r10+9|0);if((r4|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r4+8|0;HEAP32[r4+4>>2]=r3;_memset(r8,-35,r3);r12=r8}}while(0);r3=r12;_memcpy(r3,r5,r10);HEAP8[r3+r10|0]=0;_add_atom(0,_new_assert_atom(r1,r3,r11));STACKTOP=r2;return}function _handle_ifd(r1){_ifdef(r1,1);return}function _handle_ifnd(r1){_ifdef(r1,0);return}function _handle_ifne(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=(HEAP32[r3>>2]|0)!=0&1}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_ifeq(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=(HEAP32[r3>>2]|0)==0&1}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_ifgt(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=(HEAP32[r3>>2]|0)>0&1}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_ifge(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=HEAP32[r3>>2]>>>31&255^1}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_iflt(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=HEAP32[r3>>2]>>>31&255}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_ifle(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[1310797]=r1;HEAP8[5261784]=1;r1=_expression();_simplify_expr(r1);r4=HEAP32[1310797];if((_eval_expr(r1,r3,0,0)|0)==0){_syntax_error(12,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}else{r5=(HEAP32[r3>>2]|0)<1&1}r3=HEAP32[1316042]+1|0;HEAP32[1316042]=r3;HEAP8[r3+5264100|0]=r5;_free_expr(r1);r1=r4;while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r4=HEAP8[r1];if(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_ifused(r1){_ifused(r1,1);return}function _handle_ifnused(r1){_ifused(r1,0);return}function _handle_else(r1){var r2,r3;r2=STACKTOP;r3=r1;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}r1=HEAP8[r3];if(!(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=HEAP32[1316042];if((r1|0)>0){HEAP8[r1+5264100|0]=0;STACKTOP=r2;return}else{_syntax_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}}function _handle_endif(r1){var r2,r3;r2=STACKTOP;r3=r1;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}r1=HEAP8[r3];if(!(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=HEAP32[1316042];if((r1|0)>0){HEAP32[1316042]=r1-1|0;STACKTOP=r2;return}else{_syntax_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}}function _handle_incbin(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r1=_parse_name(r3);if((r1|0)==0){STACKTOP=r2;return}r3=HEAP32[r4];while(1){r5=r3+1|0;if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r5}}HEAP32[r4]=r3;do{if(HEAP8[r3]<<24>>24==44){r6=r5;while(1){if((_isspace(HEAPU8[r6])|0)==0){break}else{r6=r6+1|0}}HEAP32[1310797]=r6;HEAP8[5261784]=0;r7=_expression();_simplify_expr(r7);r8=HEAP32[1310797];HEAP32[r4]=r8;if((r7|0)==0){r9=0}else{_simplify_expr(r7);if((HEAP32[r7>>2]|0)==21){r10=HEAP32[r7+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=0}_free_expr(r7);r9=r10}r7=(r9|0)<0;r11=r8;while(1){r12=r11+1|0;if((_isspace(HEAPU8[r11])|0)==0){break}else{r11=r12}}r6=r7?0:r9;HEAP32[r4]=r11;if(HEAP8[r11]<<24>>24==44){r13=r12}else{r14=0;r15=r6;r16=r11;break}while(1){if((_isspace(HEAPU8[r13])|0)==0){break}else{r13=r13+1|0}}HEAP32[1310797]=r13;HEAP8[5261784]=0;r11=_expression();_simplify_expr(r11);r7=HEAP32[1310797];HEAP32[r4]=r7;if((r11|0)==0){r14=0;r15=r6;r16=r7;break}_simplify_expr(r11);if((HEAP32[r11>>2]|0)==21){r17=HEAP32[r11+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=0}_free_expr(r11);r14=r17;r15=r6;r16=r7}else{r14=0;r15=0;r16=r3}}while(0);r3=r16;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}r3=r3+1|0}r16=HEAP8[r3];if(!(r16<<24>>24==0|r16<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}_include_binary_file(r1,r15,r14);STACKTOP=r2;return}function _handle_incdir(r1){var r2,r3;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[r3>>2]=r1;r1=_parse_name(r3);if((r1|0)!=0){_new_include_path(r1)}r1=HEAP32[r3>>2];while(1){if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r1+1|0}}r3=HEAP8[r1];if(r3<<24>>24==0|r3<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_include(r1){var r2,r3,r4;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;HEAP32[r3>>2]=r1;r1=_parse_name(r3);if((r1|0)==0){STACKTOP=r2;return}r4=HEAP32[r3>>2];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}r3=HEAP8[r4];if(!(r3<<24>>24==0|r3<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}_include_source(r1);STACKTOP=r2;return}function _handle_nolist(r1){HEAP32[1315452]=0;return}function _handle_list(r1){HEAP32[1315452]=HEAP8[5244084]&1;return}function _handle_rept(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;HEAP32[1310797]=r1;HEAP8[5261784]=0;r1=_expression();_simplify_expr(r1);r3=HEAP32[1310797];if((r1|0)==0){r4=0}else{_simplify_expr(r1);if((HEAP32[r1>>2]|0)==21){r5=HEAP32[r1+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r5=0}_free_expr(r1);r4=r5}r5=r3;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}r3=HEAP8[r5];if(!(r3<<24>>24==0|r3<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r3=HEAP8[5263052];r5=r3?5263028:5243212;r1=r3?5263764:5262940;r3=HEAP32[1315964];if(!((HEAP32[1315965]|0)==0&(r3|0)!=0&(HEAP32[1315755]|0)==0)){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=366,HEAP32[tempInt+8>>2]=5269184,tempInt));STACKTOP=r2;return}HEAP32[1315755]=r1;r6=HEAP8[r1|0];r7=r6&255;L4230:do{if(r6<<24>>24==0){r8=r7}else{r9=r1;r10=r7;r11=r6;while(1){r12=r11&255;r13=r12>>>0<r10>>>0?r12:r10;r12=r9+8|0;r14=HEAP8[r12|0];if(r14<<24>>24==0){r8=r13;break L4230}else{r9=r12;r10=r13;r11=r14}}}}while(0);HEAP32[1315754]=r8;HEAP32[1310801]=r5;HEAP32[1310809]=r4;HEAP32[1310802]=HEAP32[r3+328>>2];STACKTOP=r2;return}function _handle_endr(r1){r1=STACKTOP;_syntax_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r1;return}function _handle_macro(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r1=_parse_identifier(r3);if((r1|0)==0){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}r3=HEAP32[r4];while(1){r5=r3+1|0;if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r5}}HEAP32[r4]=r3;r6=HEAP8[r3];do{if(r6<<24>>24==44){r7=r5}else{r8=r3;r9=r6;while(1){r10=r8+1|0;if((_isspace(r9&255)|0)==0){break}r8=r10;r9=HEAP8[r10]}r9=HEAP8[r8];if(r9<<24>>24==0|r9<<24>>24==HEAP8[5264164]<<24>>24){r7=0;break}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r7=0}}while(0);HEAP32[r4]=r7;_new_macro(r1,HEAP8[5263052]?5263796:5262984,r7);if((HEAP32[1315960]|0)==0){_free(r1);STACKTOP=r2;return}else{_memset(r1,-1,HEAP32[r1-4>>2]);_free(r1-8|0);STACKTOP=r2;return}}function _handle_endm(r1){r1=STACKTOP;_syntax_error(18,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r1;return}function _handle_end(r1){var r2,r3;r2=STACKTOP;HEAP8[5244184]=1;r3=r1;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}r1=HEAP8[r3];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_fail(r1){var r2;r2=STACKTOP;_general_error(19,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));STACKTOP=r2;return}function _handle_section(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r1=_parse_name(r3);if((r1|0)==0){STACKTOP=r2;return}r3=HEAP32[r4];if(HEAP8[r3]<<24>>24==44){r5=r3+1|0;while(1){r6=r5+1|0;if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r6}}HEAP32[r4]=r5;if(HEAP8[r5]<<24>>24==34){HEAP32[r4]=r6;r7=r6}else{_syntax_error(7,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=34,tempInt));r7=r5}r5=r7;while(1){r6=HEAP8[r5];if(r6<<24>>24==0|r6<<24>>24==34){break}r6=r5+1|0;HEAP32[r4]=r6;r5=r6}r6=r5-r7|0;r8=r6+1|0;do{if((HEAP32[1315960]|0)==0){r9=_malloc(r8);r10=r9;if((r9|0)!=0){r11=r10;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r11=r10}else{r10=_malloc(r6+9|0);if((r10|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r10+8|0;HEAP32[r10+4>>2]=r8;_memset(r9,-35,r8);r11=r9}}while(0);r8=r11;_memcpy(r8,r7,r6);HEAP8[r8+r6|0]=0;r6=r5;while(1){r12=r6+1|0;if((_isspace(HEAPU8[r12])|0)==0){break}else{r6=r12}}HEAP32[r4]=r12;r13=r8;r14=r12}else{r13=(_strcmp(r1,5264176)|0)==0?5264184:HEAP32[1315957];r14=r3}_new_section(r1,r13,1);_switch_section(r1,r13);r13=r14;while(1){if((_isspace(HEAPU8[r13])|0)==0){break}else{r13=r13+1|0}}r14=HEAP8[r13];if(r14<<24>>24==0|r14<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _handle_d24(r1){_handle_data_offset(r1,24,0);return}function _handle_d32(r1){_handle_data_offset(r1,32,0);return}function _handle_defc(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2,r4=r3>>2;HEAP32[r4]=r1;r5=r1;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}HEAP32[r4]=r5;r5=_parse_identifier(r3);if((r5|0)==0){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}r3=HEAP32[r4];while(1){r6=r3+1|0;if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r6}}HEAP32[r4]=r3;if(HEAP8[r3]<<24>>24==61){r3=r6;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}HEAP32[1310797]=r3;HEAP8[5261784]=1;r3=_expression();_simplify_expr(r3);HEAP32[r4]=HEAP32[1310797];_new_abs(r5,r3)}if((HEAP32[1315960]|0)==0){_free(r5);STACKTOP=r2;return}else{_memset(r5,-1,HEAP32[r5-4>>2]);_free(r5-8|0);STACKTOP=r2;return}}function _handle_global(r1){_do_binding(r1,8);return}function _handle_local(r1){_do_binding(r1,16777216);return}function _handle_weak(r1){_do_binding(r1,64);return}function _handle_string(r1){var r2,r3,r4,r5,r6;r2=STACKTOP;_handle_data_offset(r1,8,0);do{if((HEAP32[1315960]|0)==0){r1=_malloc(16);r3=r1;if((r1|0)!=0){r4=r3,r5=r4>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=r3,r5=r4>>2}else{r3=_malloc(24);if((r3|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=r3+8|0,r6=r1>>2;HEAP32[r3+4>>2]=16;HEAP32[r6]=-572662307;HEAP32[r6+1]=-572662307;HEAP32[r6+2]=-572662307;HEAP32[r6+3]=-572662307;r4=r1,r5=r4>>2}}while(0);HEAP32[r5+2]=0;HEAP32[r5+1]=0;HEAP32[r5]=21;HEAP32[r5+3]=1;_add_atom(0,_new_space_atom(r4,1,0));STACKTOP=r2;return}function _handle_struct(r1){var r2,r3,r4,r5;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r3=r2;r4=r2+4,r5=r4>>2;HEAP32[r5]=r1;r1=_parse_identifier(r4);if((r1|0)==0){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}r4=HEAP32[r5];while(1){if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r4+1|0}}HEAP32[r5]=r4;r5=r4;while(1){if((_isspace(HEAPU8[r5])|0)==0){break}else{r5=r5+1|0}}r4=HEAP8[r5];if(!(r4<<24>>24==0|r4<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((HEAP32[1315963]|0)==0){HEAP32[1310784]=HEAP32[1315961];r4=_new_section(r1,5268408,1);r5=r4+24|0;HEAP32[r5>>2]=HEAP32[r5>>2]|4;HEAP32[1315961]=r4;HEAP32[1315963]=r4;HEAP32[r3>>2]=r4;_add_hashentry(HEAP32[1310783],HEAP32[r4+4>>2],r3);r3=HEAP32[1315961]+24|0;HEAP32[r3>>2]=HEAP32[r3>>2]|8}else{_general_error(48,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((HEAP32[1315960]|0)==0){_free(r1);STACKTOP=r2;return}else{_memset(r1,-1,HEAP32[r1-4>>2]);_free(r1-8|0);STACKTOP=r2;return}}function _handle_endstruct(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=STACKTOP;do{if((HEAP32[1315963]|0)==0){_general_error(49,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=r1;break}else{r4=HEAP32[1310784];HEAP32[1310784]=0;HEAP32[1315963]=0;r5=HEAP32[1315961]+24|0;HEAP32[r5>>2]=HEAP32[r5>>2]&-9;r5=_new_labsym(0,HEAP32[HEAP32[1315961]+4>>2]);do{if((HEAP32[1315960]|0)==0){r6=_malloc(28);r7=r6;if((r6|0)!=0){r8=r7,r9=r8>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r8=r7,r9=r8>>2}else{r7=_malloc(36);if((r7|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r6=r7+8|0,r10=r6>>2;HEAP32[r7+4>>2]=28;HEAP32[r10]=-572662307;HEAP32[r10+1]=-572662307;HEAP32[r10+2]=-572662307;HEAP32[r10+3]=-572662307;HEAP32[r10+4]=-572662307;HEAP32[r10+5]=-572662307;HEAP32[r10+6]=-572662307;r8=r6,r9=r8>>2}}while(0);HEAP32[r9]=0;HEAP32[r9+1]=1;HEAP32[r9+2]=1;HEAP32[r9+6]=r5;_add_atom(0,r8);HEAP32[1315961]=r4;r3=r1;break}}while(0);while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}r1=HEAP8[r3];if(r1<<24>>24==0|r1<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r2;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _parse(){var r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96;r1=0;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r3=r2,r4=r3>>2;r5=r2+4;r6=r2+8;r7=r2+12,r8=r7>>2;r9=r2+16;r10=r2+24;r11=_read_next_line();L4381:do{if((r11|0)!=0){r12=r9|0;r13=r10|0;r14=r6|0;r15=0;r16=r11;while(1){L4385:do{if(HEAP8[5244184]){r17=r15}else{r18=HEAP32[1316042];if((r18|0)>62){_syntax_error(16,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r18,tempInt));r19=HEAP32[1316042]}else{r19=r18}r18=HEAP8[r19+5264100|0]<<24>>24==0;HEAP32[r8]=r16;if(r18){r18=_check_directive(r7);if((r18|0)<=-1){r17=r15;break}r20=(_strncmp(HEAP32[(r18<<3)+5263064>>2],5268288,2)|0)==0;r21=HEAP32[1315460];if(r20){HEAP32[1315460]=r21+1|0;r17=r15;break}r20=(r21|0)==0;r22=HEAP32[(r18<<3)+5263068>>2];if(r20&(r22|0)==12){HEAP8[HEAP32[1316042]+5264100|0]=1;r17=r15;break}if((r22|0)!=6){r17=r15;break}if(!r20){HEAP32[1315460]=r21-1|0;r17=r15;break}r21=HEAP32[1316042];if((r21|0)>0){HEAP32[1316042]=r21-1|0;r17=r15;break}else{_syntax_error(14,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r15;break}}r21=_get_local_label(r7);r20=HEAP32[r8];L4407:do{if((r21|0)==0){r22=HEAP8[r20];do{if(!(r22<<24>>24==46|r22<<24>>24==95)){if((_isalpha(r22&255)|0)!=0){break}if(HEAP8[HEAP32[r8]]<<24>>24==HEAP8[5263848]<<24>>24){break}else{r23=r15;break L4407}}}while(0);while(1){r22=HEAP32[r8]+1|0;HEAP32[r8]=r22;r18=HEAP8[r22];if(r18<<24>>24==95){continue}if((_isalnum(r18&255)|0)==0){break}}r18=HEAP32[r8];do{if(HEAP8[r16]<<24>>24==HEAP8[5263848]<<24>>24){r22=r16;if((r18-r22|0)==1){r24=r22;break}_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r15;break L4385}else{r24=r16}}while(0);r22=r18-r24|0;r25=r22+1|0;do{if((HEAP32[1315960]|0)==0){r26=_malloc(r25);r27=r26;if((r26|0)!=0){r28=r27;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r28=r27}else{r27=_malloc(r22+9|0);if((r27|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r26=r27+8|0;HEAP32[r27+4>>2]=r25;_memset(r26,-35,r25);r28=r26}}while(0);r25=r28;_memcpy(r25,r16,r22);HEAP8[r25+r22|0]=0;r18=HEAP32[r8];while(1){if((_isspace(HEAPU8[r18])|0)==0){break}else{r18=r18+1|0}}HEAP32[r8]=r18;if((r28|0)==0){r23=r15;break}else{r29=1;r30=r25;r31=r18;r1=3310;break}}else{r29=0;r30=r21;r31=r20;r1=3310}}while(0);do{if(r1==3310){r1=0;r20=(_tolower(HEAPU8[r31])|0)==(_tolower(101)|0);r21=HEAP8[r31];do{if(r20){if(r21<<24>>24==0){r1=3314;break}r22=r31+1|0;r26=(_tolower(HEAPU8[r22])|0)==(_tolower(113)|0);r27=HEAP8[r22];if(!r26){r32=r27;r33=5264865;r1=3313;break}if(r27<<24>>24==0){r1=3314;break}r32=HEAP8[r31+2|0];r33=5264866;r1=3313;break}else{r32=r21;r33=5264864;r1=3313}}while(0);do{if(r1==3313){r1=0;if((_tolower(r32&255)|0)==(_tolower(HEAPU8[r33])|0)){r1=3314;break}else{r1=3315;break}}}while(0);do{if(r1==3314){r1=0;if((_isspace(HEAPU8[HEAP32[r8]+3|0])|0)==0){r1=3315;break}else{r34=3;r1=3321;break}}}while(0);L4443:do{if(r1==3315){r1=0;r21=HEAP32[r8];r20=(_tolower(HEAPU8[r21])|0)==(_tolower(101)|0);r18=HEAP8[r21];do{if(r20){if(r18<<24>>24==0){r1=3319;break}r35=HEAP8[r21+1|0];r36=5264797;r1=3318;break}else{r35=r18;r36=5264796;r1=3318}}while(0);do{if(r1==3318){r1=0;if((_tolower(r35&255)|0)==(_tolower(HEAPU8[r36])|0)){r1=3319;break}else{break}}}while(0);if(r1==3319){r1=0;if((_isspace(HEAPU8[HEAP32[r8]+2|0])|0)!=0){r34=2;r1=3321;break}}r18=HEAP32[r8];r21=HEAP8[r18];r20=r21<<24>>24==61;if(r20){r34=r20&1;r1=3321;break}r20=(_tolower(r21&255)|0)==(_tolower(115)|0);r21=HEAP8[r18];do{if(r20){if(r21<<24>>24==0){r1=3336;break}r25=r18+1|0;r27=(_tolower(HEAPU8[r25])|0)==(_tolower(101)|0);r26=HEAP8[r25];if(!r27){r37=r26;r38=5264693;r1=3335;break}if(r26<<24>>24==0){r1=3336;break}r37=HEAP8[r18+2|0];r38=5264694;r1=3335;break}else{r37=r21;r38=5264692;r1=3335}}while(0);do{if(r1==3335){r1=0;if((_tolower(r37&255)|0)==(_tolower(HEAPU8[r38])|0)){r1=3336;break}else{break}}}while(0);do{if(r1==3336){r1=0;if((_isspace(HEAPU8[HEAP32[r8]+3|0])|0)==0){break}if(HEAP8[r30]<<24>>24==HEAP8[5263848]<<24>>24){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r39=r15;break L4443}r21=HEAP32[r8]+3|0;while(1){if((_isspace(HEAPU8[r21])|0)==0){break}else{r21=r21+1|0}}HEAP32[r8]=r21;HEAP32[1310797]=r21;HEAP8[5261784]=1;r18=_expression();_simplify_expr(r18);HEAP32[r8]=HEAP32[1310797];r39=_new_abs(r30,r18);break L4443}}while(0);r18=HEAP32[r8];r20=(_tolower(HEAPU8[r18])|0)==(_tolower(109)|0);r26=HEAP8[r18];do{if(r20){if(r26<<24>>24==0){r1=3347;break}r27=r18+1|0;r25=(_tolower(HEAPU8[r27])|0)==(_tolower(97)|0);r22=HEAP8[r27];if(!r25){r40=r22;r41=5267009;r1=3345;break}if(r22<<24>>24==0){r1=3347;break}r40=HEAP8[r18+2|0];r41=5267010;r1=3345;break}else{r40=r26;r41=5267008;r1=3345}}while(0);do{if(r1==3345){r1=0;if((_tolower(r40&255)|0)==(_tolower(HEAPU8[r41])|0)){r1=3347;break}r42=HEAP32[r8];r1=3349;break}}while(0);do{if(r1==3347){r1=0;if((_isspace(HEAPU8[HEAP32[r8]+3|0])|0)!=0){break}r26=HEAP32[r8];if(HEAP8[r26+3|0]<<24>>24==0){break}else{r42=r26;r1=3349;break}}}while(0);do{if(r1==3349){r1=0;r26=(_tolower(HEAPU8[r42])|0)==(_tolower(109)|0);r18=HEAP8[r42];do{if(r26){if(r18<<24>>24==0){r1=3353;break}r20=r42+1|0;r22=(_tolower(HEAPU8[r20])|0)==(_tolower(97)|0);r25=HEAP8[r20];if(!r22){r43=r25;r44=5266969;r1=3352;break}if(r25<<24>>24==0){r1=3353;break}r25=r42+2|0;r22=(_tolower(HEAPU8[r25])|0)==(_tolower(99)|0);r20=HEAP8[r25];if(!r22){r43=r20;r44=5266970;r1=3352;break}if(r20<<24>>24==0){r1=3353;break}r20=r42+3|0;r22=(_tolower(HEAPU8[r20])|0)==(_tolower(114)|0);r25=HEAP8[r20];if(!r22){r43=r25;r44=5266971;r1=3352;break}if(r25<<24>>24==0){r1=3353;break}r43=HEAP8[r42+4|0];r44=5266972;r1=3352;break}else{r43=r18;r44=5266968;r1=3352}}while(0);do{if(r1==3352){r1=0;if((_tolower(r43&255)|0)==(_tolower(HEAPU8[r44])|0)){r1=3353;break}else{break}}}while(0);if(r1==3353){r1=0;if((_isspace(HEAPU8[HEAP32[r8]+5|0])|0)!=0){break}if(HEAP8[HEAP32[r8]+5|0]<<24>>24==0){break}}r18=_new_labsym(0,r30);do{if((HEAP32[1315960]|0)==0){r26=_malloc(28);r21=r26;if((r26|0)!=0){r45=r21,r46=r45>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r45=r21,r46=r45>>2}else{r21=_malloc(36);if((r21|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r26=r21+8|0,r25=r26>>2;HEAP32[r21+4>>2]=28;HEAP32[r25]=-572662307;HEAP32[r25+1]=-572662307;HEAP32[r25+2]=-572662307;HEAP32[r25+3]=-572662307;HEAP32[r25+4]=-572662307;HEAP32[r25+5]=-572662307;HEAP32[r25+6]=-572662307;r45=r26,r46=r45>>2}}while(0);HEAP32[r46]=0;HEAP32[r46+1]=1;HEAP32[r46+2]=1;HEAP32[r46+6]=r18;_add_atom(0,r45);r26=HEAP32[r8];if(HEAP8[r26]<<24>>24==58){r47=r26}else{r39=r18;break L4443}while(1){r48=r47+1|0;if((_isspace(HEAPU8[r48])|0)==0){break}else{r47=r48}}HEAP32[r8]=r48;r39=r18;break L4443}}while(0);r26=HEAP32[r8];r25=r26+(HEAP8[r26+3|0]<<24>>24==114?5:3)|0;while(1){if((_isspace(HEAPU8[r25])|0)==0){break}else{r25=r25+1|0}}HEAP32[r8]=r16;if((HEAP32[1315960]|0)==0){_free(r30)}else{_memset(r30,-1,HEAP32[r30-4>>2]);_free(r30-8|0)}r26=_parse_identifier(r7);if((r26|0)==0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=1133,HEAP32[tempInt+8>>2]=5264616,tempInt));_new_macro(0,HEAP8[5263052]?5263796:5262984,r25);r17=r15;break L4385}_new_macro(r26,HEAP8[5263052]?5263796:5262984,r25);if((HEAP32[1315960]|0)==0){_free(r26);r17=r15;break L4385}else{_memset(r26,-1,HEAP32[r26-4>>2]);_free(r26-8|0);r17=r15;break L4385}}}while(0);if(r1==3321){r1=0;if(HEAP8[r30]<<24>>24==HEAP8[5263848]<<24>>24){r26=HEAP32[r8]+r34|0;while(1){if((_isspace(HEAPU8[r26])|0)==0){break}else{r26=r26+1|0}}_handle_org(r26);r17=r15;break L4385}do{if((_find_name(HEAP32[1310781],r30,r6)|0)!=0){r21=HEAP32[r14>>2];if((r21|0)==0){break}if((HEAP32[r21+4>>2]|0)==2){break}_syntax_error(13,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r26=HEAP32[r8]+r34|0;while(1){if((_isspace(HEAPU8[r26])|0)==0){break}else{r26=r26+1|0}}HEAP32[r8]=r26;HEAP32[1310797]=r26;HEAP8[5261784]=1;r21=_expression();_simplify_expr(r21);HEAP32[r8]=HEAP32[1310797];r39=_new_abs(r30,r21)}if((HEAP32[1315960]|0)==0){_free(r30)}else{_memset(r30,-1,HEAP32[r30-4>>2]);_free(r30-8|0)}if(!((r29|0)!=0&HEAP8[5264200])){r23=r39;break}r21=r39+8|0;HEAP32[r21>>2]=HEAP32[r21>>2]|8;r23=r39}}while(0);r21=HEAP32[r8];while(1){if((_isspace(HEAPU8[r21])|0)==0){break}else{r21=r21+1|0}}HEAP32[r8]=r21;if(HEAP8[r21]<<24>>24==HEAP8[5264164]<<24>>24){r17=r23;break}r22=_parse_cpu_special(r21);HEAP32[r8]=r22;r20=HEAP8[r22];if(r20<<24>>24==0|r20<<24>>24==HEAP8[5264164]<<24>>24){r17=r23;break}do{if(r20<<24>>24==HEAP8[5263848]<<24>>24){if(HEAP8[r22+1|0]<<24>>24!=61){break}r27=r22+2|0;while(1){if((_isspace(HEAPU8[r27])|0)==0){break}else{r27=r27+1|0}}_handle_org(r27);r17=r23;break L4385}}while(0);HEAP32[r5>>2]=r22;r20=_check_directive(r5);if((r20|0)>-1){r21=HEAP32[(r20<<3)+5263068>>2];r20=HEAP32[r5>>2];while(1){if((_isspace(HEAPU8[r20])|0)==0){break}else{r20=r20+1|0}}FUNCTION_TABLE[r21](r20);r17=r23;break}r22=HEAP32[r8];while(1){if((_isspace(HEAPU8[r22])|0)==0){break}else{r22=r22+1|0}}HEAP32[r8]=r22;r20=HEAP8[r22];if(r20<<24>>24==0|r20<<24>>24==HEAP8[5264164]<<24>>24){r17=r23;break}do{if(r20<<24>>24==46|r20<<24>>24==95){r49=r20;r1=3399}else{if((_isalpha(r20&255)|0)==0){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r23;break L4385}else{r21=HEAP32[r8];r26=HEAP8[r21];if(r26<<24>>24==0){r50=r21;r51=0;break}else{r49=r26;r1=3399;break}}}}while(0);L4574:do{if(r1==3399){while(1){r1=0;r20=(_isspace(r49&255)|0)==0;r52=HEAP32[r8];if(!r20){break}r20=r52+1|0;HEAP32[r8]=r20;r26=HEAP8[r20];if(r26<<24>>24==0){r50=r20;r51=0;break L4574}else{r49=r26;r1=3399}}r50=r52;r51=HEAPU8[r52]}}while(0);r27=r50-r22|0;do{if((_isspace(r51)|0)==0){if(HEAP8[HEAP32[r8]]<<24>>24==0){break}_syntax_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r26=HEAP32[r8];while(1){if((_isspace(HEAPU8[r26])|0)==0){break}else{r26=r26+1|0}}HEAP32[r8]=r26;if((_execute_macro(r22,r27,0,0,0,r26,HEAP32[1316042])|0)!=0){r17=r23;break}r20=HEAP32[r8];r21=_find_structure(r22,r27);if((r21|0)==0){r53=HEAP32[r8];r54=HEAP8[r53];r55=HEAP8[5264164];L4590:do{if(r54<<24>>24!=r55<<24>>24&r54<<24>>24!=0){r56=0;r57=r53;r58=r55;while(1){HEAP32[r9+(r56<<2)>>2]=r57;r59=r57;r60=0;r61=r58;while(1){r62=HEAP8[r59];r63=(r62<<24>>24==40&1)+r60|0;do{if(r62<<24>>24==41){if((r63|0)>0){r64=r63-1|0;r65=r61;break}else{_syntax_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r64=r63;r65=HEAP8[5264164];break}}else{r64=r63;r65=r61}}while(0);if(r62<<24>>24==0|r62<<24>>24==r65<<24>>24){break}if(r62<<24>>24==44&(r64|0)==0){break}else{r59=r59+1|0;r60=r64;r61=r65}}if((r64|0)!=0){_syntax_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}HEAP32[r8]=r59;r61=r59;while(1){if((r61|0)==(r57|0)){r66=r57;break}r60=r61-1|0;if((_isspace(HEAPU8[r60])|0)==0){r66=r61;break}else{r61=r60}}r61=r66-r57|0;HEAP32[r10+(r56<<2)>>2]=r61;if((r61|0)<1){_syntax_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r67=r56}else{r67=r56+1|0}r61=HEAP32[r8];while(1){r68=r61+1|0;if((_isspace(HEAPU8[r61])|0)==0){break}else{r61=r68}}HEAP32[r8]=r61;r59=HEAP8[r61];if(r59<<24>>24==44){r69=r68}else{r70=r67;r71=r61;r72=r59;break L4590}while(1){if((_isspace(HEAPU8[r69])|0)==0){break}else{r69=r69+1|0}}HEAP32[r8]=r69;r61=HEAP8[r69];r59=HEAP8[5264164];if(r61<<24>>24!=r59<<24>>24&r61<<24>>24!=0&(r67|0)<2){r56=r67;r57=r69;r58=r59}else{r70=r67;r71=r69;r72=r61;break L4590}}}else{r70=0;r71=r53;r72=r54}}while(0);r54=r71;r53=r72;while(1){r55=r54+1|0;if((_isspace(r53&255)|0)==0){break}r54=r55;r53=HEAP8[r55]}HEAP32[r8]=r54;r53=HEAP8[r54];if(!(r53<<24>>24==0|r53<<24>>24==HEAP8[5264164]<<24>>24)){_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r53=_new_inst(r22,r27,r70,r12,r13);if((r53|0)==0){r17=r23;break}do{if((HEAP32[1315960]|0)==0){r55=_malloc(28);r26=r55;if((r55|0)!=0){r73=r26,r74=r73>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r73=r26,r74=r73>>2}else{r26=_malloc(36);if((r26|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r55=r26+8|0,r58=r55>>2;HEAP32[r26+4>>2]=28;HEAP32[r58]=-572662307;HEAP32[r58+1]=-572662307;HEAP32[r58+2]=-572662307;HEAP32[r58+3]=-572662307;HEAP32[r58+4]=-572662307;HEAP32[r58+5]=-572662307;HEAP32[r58+6]=-572662307;r73=r55,r74=r73>>2}}while(0);HEAP32[r74]=0;HEAP32[r74+1]=3;HEAP32[r74+2]=1;HEAP32[r74+6]=r53;_add_atom(0,r73);r17=r23;break}r27=HEAP32[r21+12>>2];L4638:do{if((r27|0)==0){r75=r20}else{r22=r20;r54=r27,r55=r54>>2;while(1){r58=r54+4|0;r26=HEAP32[r58>>2];if((r26|0)==3){_syntax_error(23,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r76=r22}else if((r26|0)==2|(r26|0)==4|(r26|0)==5){r26=r22;while(1){if((_isspace(HEAPU8[r26])|0)==0){break}else{r26=r26+1|0}}HEAP32[r4]=r26;r57=r26;r56=0;while(1){r61=HEAP8[r57];r59=(r61<<24>>24==40&1)+r56|0;do{if(r61<<24>>24==41){if((r59|0)>0){r77=r59-1|0;break}else{_syntax_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r77=r59;break}}else{r77=r59}}while(0);if(r61<<24>>24==0|r61<<24>>24==HEAP8[5264164]<<24>>24){break}if(r61<<24>>24==44&(r77|0)==0){break}else{r57=r57+1|0;r56=r77}}do{if((r77|0)==0){r78=r57}else{_syntax_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r78=r57;break}}while(0);while(1){if((r78|0)==(r26|0)){r79=r26;break}r56=r78-1|0;if((_isspace(HEAPU8[r56])|0)==0){r79=r78;break}else{r78=r56}}r56=r79-r26|0;do{if((r56|0)>0){r59=HEAP32[r58>>2];if((r59|0)==4){r62=_clone_atom(r54);r60=r54+24|0;r25=HEAP32[r60>>2];r63=HEAP32[r25+4>>2];r18=HEAP32[r25+8>>2];HEAP32[1310797]=r26;HEAP8[5261784]=1;r25=_expression();_simplify_expr(r25);HEAP32[r4]=HEAP32[1310797];do{if((HEAP32[1315960]|0)==0){r80=_malloc(28);r81=r80;if((r80|0)!=0){r82=r81,r83=r82>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r82=r81,r83=r82>>2}else{r81=_malloc(36);if((r81|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r80=r81+8|0,r84=r80>>2;HEAP32[r81+4>>2]=28;HEAP32[r84]=-572662307;HEAP32[r84+1]=-572662307;HEAP32[r84+2]=-572662307;HEAP32[r84+3]=-572662307;HEAP32[r84+4]=-572662307;HEAP32[r84+5]=-572662307;HEAP32[r84+6]=-572662307;r82=r80,r83=r82>>2}}while(0);HEAP32[r83]=0;HEAP32[r83+1]=r63;HEAP32[r83+2]=r18;HEAP32[r83+5]=r25;if((r25|0)==0){r61=r82+12|0;r80=r61|0;tempBigInt=0;HEAP8[r80]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+3|0]=tempBigInt&255;r80=r61+4|0;tempBigInt=0;HEAP8[r80]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r80+3|0]=tempBigInt&255}HEAP32[r83+6]=0;HEAP32[r62+24>>2]=r82;HEAP32[r83]=HEAP32[HEAP32[r60>>2]>>2];_add_atom(0,r62);r85=r57;break}else if((r59|0)==5){do{if((HEAP32[1315960]|0)==0){r80=_malloc(20);r61=r80;if((r80|0)!=0){r86=r61;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r86=r61}else{r61=_malloc(28);if((r61|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r80=r61+8|0,r84=r80>>2;HEAP32[r61+4>>2]=20;HEAP32[r84]=-572662307;HEAP32[r84+1]=-572662307;HEAP32[r84+2]=-572662307;HEAP32[r84+3]=-572662307;HEAP32[r84+4]=-572662307;r86=r80}}while(0);r59=r86;HEAP32[r86+4>>2]=-1;HEAP32[r86>>2]=0;if((_parse_operand(r26,r56,r59,1)|0)==0){_syntax_error(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r85=r57;break}else{r62=_new_datadef_atom(HEAP32[HEAP32[r55+6]>>2],r59);HEAP32[r62+8>>2]=HEAP32[r55+2];_add_atom(0,r62);r85=r57;break}}else{do{if((HEAP32[1315960]|0)==0){r62=_malloc(12);r59=r62;if((r62|0)!=0){r87=r59,r88=r87>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r87=r59,r88=r87>>2}else{r59=_malloc(20);if((r59|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r62=r59+8|0,r60=r62>>2;HEAP32[r59+4>>2]=12;HEAP32[r60]=-572662307;HEAP32[r60+1]=-572662307;HEAP32[r60+2]=-572662307;r87=r62,r88=r87>>2}}while(0);HEAP32[r88]=0;r62=r87+4|0,r60=r62>>2;HEAP32[r60]=0;HEAP32[r88+2]=0;r59=HEAP32[HEAP32[r55+6]>>2];HEAP32[r88]=r59;do{if((r59|0)==0){HEAP32[r60]=0}else{do{if((HEAP32[1315960]|0)==0){r25=_malloc(r59);r18=r25;if((r25|0)!=0){r89=r18;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r89=r18}else{r18=_malloc(r59+8|0);if((r18|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r25=r18+8|0;HEAP32[r18+4>>2]=r59;_memset(r25,-35,r59);r89=r25}}while(0);_memset(r89,0,r59);r25=r62;HEAP32[r60]=r89;if((r89|0)==0){break}r18=HEAP8[r26];if(!(r18<<24>>24==34|r18<<24>>24==39)){HEAP32[1310797]=r26;HEAP8[5261784]=0;r63=_expression();_simplify_expr(r63);HEAP32[r4]=HEAP32[1310797];if((r63|0)==0){r90=0}else{_simplify_expr(r63);if((HEAP32[r63>>2]|0)==21){r91=HEAP32[r63+12>>2]}else{_general_error(30,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r91=0}_free_expr(r63);r90=r91}r63=HEAP32[r25>>2];r80=r90;r84=(r90|0)<0?-1:0;HEAP8[r63]=r90&255;HEAP8[r63+1|0]=(r80>>>8|r84<<24)&255;HEAP8[r63+2|0]=(r80>>>16|r84<<16)&255;HEAP8[r63+3|0]=(r80>>>24|r84<<8)&255;break}r84=_parse_string(r3,r18,8);r18=r84|0;r80=HEAP32[r18>>2];do{if((r80|0)!=0){r63=HEAP32[r88];if((r80|0)>(r63|0)){_syntax_error(24,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r80-r63|0,tempInt));r92=HEAP32[r18>>2];r93=HEAP32[r88]}else{r92=r80;r93=r63}r63=r84+4|0;_memcpy(HEAP32[r25>>2],HEAP32[r63>>2],(r92|0)>(r93|0)?r93:r92);r61=HEAP32[r63>>2];if((r61|0)==0){break}if((HEAP32[1315960]|0)==0){_free(r61);break}else{_memset(r61,-1,HEAP32[r61-4>>2]);_free(r61-8|0);break}}}while(0);r25=r84;if((r84|0)==0){break}if((HEAP32[1315960]|0)==0){_free(r25);break}else{_memset(r25,-1,HEAP32[r84-12+8>>2]);_free(r84-12+4|0);break}}}while(0);r60=HEAP32[r55+2];do{if((HEAP32[1315960]|0)==0){r62=_malloc(28);r59=r62;if((r62|0)!=0){r94=r59,r95=r94>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r94=r59,r95=r94>>2}else{r59=_malloc(36);if((r59|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r62=r59+8|0,r25=r62>>2;HEAP32[r59+4>>2]=28;HEAP32[r25]=-572662307;HEAP32[r25+1]=-572662307;HEAP32[r25+2]=-572662307;HEAP32[r25+3]=-572662307;HEAP32[r25+4]=-572662307;HEAP32[r25+5]=-572662307;HEAP32[r25+6]=-572662307;r94=r62,r95=r94>>2}}while(0);HEAP32[r95]=0;HEAP32[r95+1]=2;HEAP32[r95+2]=r60;HEAP32[r95+6]=r87;_add_atom(0,r94);r85=r57;break}}else{_add_atom(0,_clone_atom(r54));r85=r57;break}}while(0);while(1){r96=r85+1|0;if((_isspace(HEAPU8[r85])|0)==0){break}else{r85=r96}}r76=HEAP8[r85]<<24>>24==44?r96:r85}else{r76=r22}r57=HEAP32[r55];if((r57|0)==0){r75=r76;break L4638}else{r22=r76;r54=r57,r55=r54>>2}}}}while(0);while(1){if((_isspace(HEAPU8[r75])|0)==0){break}else{r75=r75+1|0}}r27=HEAP8[r75];if(r27<<24>>24==0|r27<<24>>24==HEAP8[5264164]<<24>>24){r17=r23;break}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r23}}while(0);r27=_read_next_line();if((r27|0)==0){break L4381}else{r15=r17;r16=r27}}}}while(0);if((HEAP32[1316042]|0)<=0){STACKTOP=r2;return}_syntax_error(15,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r2;return}function _check_directive(r1){var r2,r3,r4,r5,r6,r7,r8;r2=STACKTOP;STACKTOP=STACKTOP+4|0;r3=r2;r4=HEAP32[r1>>2];while(1){r5=r4+1|0;if((_isspace(HEAPU8[r4])|0)==0){break}else{r4=r5}}r6=HEAP8[r4];do{if(r6<<24>>24==46|r6<<24>>24==95){r7=r5}else{if((_isalpha(r6&255)|0)==0){r8=-1}else{r7=r5;break}STACKTOP=r2;return r8}}while(0);while(1){r6=HEAP8[r7];if(r6<<24>>24!=95){if((_isalnum(r6&255)|0)==0){break}}r7=r7+1|0}r6=HEAP8[r4]<<24>>24==46&HEAP8[5263052]?r5:r4;if((_find_namelen_nc(HEAP32[1315765],r6,r7-r6|0,r3)|0)==0){r8=-1;STACKTOP=r2;return r8}HEAP32[r1>>2]=r7;r8=HEAP32[r3>>2];STACKTOP=r2;return r8}function _get_local_label(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12;r2=r1>>2;r1=0;r3=HEAP32[r2];r4=HEAP8[r3];do{if(r4<<24>>24==46|r4<<24>>24==95){r5=r3}else{if((_isalpha(r4&255)|0)!=0){r5=r3;break}if((HEAPU8[r3]-48|0)>>>0<10){r5=r3;break}else{r6=0}return r6}}while(0);while(1){r7=r5+1|0;r4=HEAP8[r7];if(r4<<24>>24==95){r5=r7;continue}if((_isalnum(r4&255)|0)==0){break}else{r5=r7}}if((r7|0)==0){r6=0;return r6}do{if(HEAP8[r7]<<24>>24==46){r4=r5+2|0;r8=HEAP8[r4];if(r8<<24>>24!=95){if((_isalnum(r8&255)|0)==0){break}}r8=HEAP8[r3];if(r8<<24>>24==46|r8<<24>>24==95){r9=r8}else{if((_isalpha(r8&255)|0)==0){break}r9=HEAP8[r3]}if(r9<<24>>24==46){break}if(HEAP8[r5]<<24>>24==36){break}r8=HEAP8[r7];do{if(r8<<24>>24==46|r8<<24>>24==95){r10=r7;r1=3572}else{if((_isalpha(r8&255)|0)!=0){r10=r7;r1=3572;break}if((HEAPU8[r7]-48|0)>>>0<10){r10=r7;r1=3572;break}else{r11=0;break}}}while(0);L4801:do{if(r1==3572){while(1){r1=0;r8=r10+1|0;r12=HEAP8[r8];if(r12<<24>>24==95){r10=r8;r1=3572;continue}if((_isalnum(r12&255)|0)==0){r11=r8;break L4801}else{r10=r8;r1=3572}}}}while(0);r8=HEAP32[r2];r12=_make_local_label(r8,r7-r8|0,r4,r11-r4|0);r8=r11;while(1){if((_isspace(HEAPU8[r8])|0)==0){break}else{r8=r8+1|0}}HEAP32[r2]=r8;r6=r12;return r6}}while(0);r11=r3+1|0;do{if((r5|0)>(r3|0)){if(HEAP8[r3]<<24>>24!=46){break}r1=_make_local_label(0,0,r11,r7-r11|0);r10=r7;while(1){if((_isspace(HEAPU8[r10])|0)==0){break}else{r10=r10+1|0}}HEAP32[r2]=r10;r6=r1;return r6}}while(0);if(r7>>>0<=r3>>>0){r6=0;return r6}if(HEAP8[r7]<<24>>24!=36){r6=0;return r6}r7=r5+2|0;r5=_make_local_label(0,0,r3,r7-r3|0);r3=r7;while(1){if((_isspace(HEAPU8[r3])|0)==0){break}else{r3=r3+1|0}}HEAP32[r2]=r3;r6=r5;return r6}function _const_prefix(r1,r2){var r3,r4,r5,r6,r7,r8;r3=r2>>2;r2=HEAP8[r1];r4=r2&255;L4830:do{if((r4-48|0)>>>0<10){r5=HEAP8[r1+1|0];if(r2<<24>>24!=48){if(r5<<24>>24==35&r2<<24>>24>49){HEAP32[r3]=r4&15;r6=r1+2|0;break}else{HEAP32[r3]=10;r6=r1;break}}if(r5<<24>>24==120|r5<<24>>24==88){HEAP32[r3]=16;r6=r1+2|0;break}else if(r5<<24>>24==98|r5<<24>>24==66){HEAP32[r3]=2;r6=r1+2|0;break}else{HEAP32[r3]=8;r6=r1;break}}else{do{if(r2<<24>>24==36){r5=r1+1|0;if((_isxdigit(HEAPU8[r5])|0)==0){r7=HEAP8[r1];break}else{HEAP32[r3]=16;r6=r5;break L4830}}else{r7=r2}}while(0);do{if(r7<<24>>24==38|r7<<24>>24==35){r5=r1+1|0;if((_isxdigit(HEAPU8[r5])|0)==0){r8=HEAP8[r1];break}else{HEAP32[r3]=16;r6=r5;break L4830}}else{r8=r7}}while(0);if(r8<<24>>24==64){HEAP32[r3]=2;r6=r1+1|0;break}else if(r8<<24>>24==37){HEAP32[r3]=2;r6=r1+1|0;break}else{HEAP32[r3]=0;r6=r1;break}}}while(0);return r6}function _handle_data_offset(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+4|0;r6=r5,r7=r6>>2;r8=(r2|0)==8;r9=(r3|0)==0;r10=(r2|0)>-1?r2:-r2|0;r2=r1;L4861:while(1){HEAP32[r7]=r2;do{if(r8){r1=HEAP8[r2];if(!(r1<<24>>24==34|r1<<24>>24==39)){r4=3632;break}r11=_parse_string(r6,r1,8);if((r11|0)==0){r4=3632;break}L4867:do{if(!r9){r1=r11|0;if((HEAP32[r1>>2]|0)<=0){break}r12=r11+4|0;r13=0;while(1){r14=HEAP32[r12>>2]+r13|0;HEAP8[r14]=HEAPU8[r14]+r3&255;r14=r13+1|0;if((r14|0)<(HEAP32[r1>>2]|0)){r13=r14}else{break L4867}}}}while(0);do{if((HEAP32[1315960]|0)==0){r13=_malloc(28);r1=r13;if((r13|0)!=0){r15=r1,r16=r15>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r15=r1,r16=r15>>2}else{r1=_malloc(36);if((r1|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r13=r1+8|0,r12=r13>>2;HEAP32[r1+4>>2]=28;HEAP32[r12]=-572662307;HEAP32[r12+1]=-572662307;HEAP32[r12+2]=-572662307;HEAP32[r12+3]=-572662307;HEAP32[r12+4]=-572662307;HEAP32[r12+5]=-572662307;HEAP32[r12+6]=-572662307;r15=r13,r16=r15>>2}}while(0);HEAP32[r16]=0;HEAP32[r16+1]=2;HEAP32[r16+2]=1;HEAP32[r16+6]=r11;_add_atom(0,r15);r17=HEAP32[r7];break}else{r4=3632}}while(0);do{if(r4==3632){r4=0;do{if((HEAP32[1315960]|0)==0){r13=_malloc(20);r12=r13;if((r13|0)!=0){r18=r12;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r18=r12}else{r12=_malloc(28);if((r12|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r13=r12+8|0,r1=r13>>2;HEAP32[r12+4>>2]=20;HEAP32[r1]=-572662307;HEAP32[r1+1]=-572662307;HEAP32[r1+2]=-572662307;HEAP32[r1+3]=-572662307;HEAP32[r1+4]=-572662307;r18=r13}}while(0);r11=r18;HEAP32[r18+4>>2]=-1;HEAP32[r18>>2]=0;r13=r2;r1=0;while(1){r12=HEAP8[r13];r14=(r12<<24>>24==40&1)+r1|0;do{if(r12<<24>>24==41){if((r14|0)>0){r19=r14-1|0;break}else{_syntax_error(3,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r19=r14;break}}else{r19=r14}}while(0);if(r12<<24>>24==0|r12<<24>>24==HEAP8[5264164]<<24>>24){break}if(r12<<24>>24==44&(r19|0)==0){break}else{r13=r13+1|0;r1=r19}}if((r19|0)!=0){_syntax_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=HEAP32[r7];if((_parse_operand(r1,r13-r1|0,r11,1)|0)==0){_syntax_error(8,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r17=r13;break}if(!r9){do{if((HEAP32[1315960]|0)==0){r1=_malloc(16);r14=r1;if((r1|0)!=0){r20=r14,r21=r20>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r20=r14,r21=r20>>2}else{r14=_malloc(24);if((r14|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r1=r14+8|0,r22=r1>>2;HEAP32[r14+4>>2]=16;HEAP32[r22]=-572662307;HEAP32[r22+1]=-572662307;HEAP32[r22+2]=-572662307;HEAP32[r22+3]=-572662307;r20=r1,r21=r20>>2}}while(0);HEAP32[r21+2]=0;HEAP32[r21+1]=0;HEAP32[r21]=21;HEAP32[r21+3]=r3;r1=r18+16|0;r22=HEAP32[r1>>2];do{if((HEAP32[1315960]|0)==0){r14=_malloc(16);r23=r14;if((r14|0)!=0){r24=r23,r25=r24>>2;break}_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r24=r23,r25=r24>>2}else{r23=_malloc(24);if((r23|0)==0){_general_error(17,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r14=r23+8|0,r26=r14>>2;HEAP32[r23+4>>2]=16;HEAP32[r26]=-572662307;HEAP32[r26+1]=-572662307;HEAP32[r26+2]=-572662307;HEAP32[r26+3]=-572662307;r24=r14,r25=r24>>2}}while(0);HEAP32[r25+1]=r20;HEAP32[r25+2]=r22;HEAP32[r25]=0;HEAP32[r1>>2]=r24}r14=_new_datadef_atom(r10,r11);HEAP32[r14+8>>2]=1;_add_atom(0,r14);r17=r13;break}}while(0);while(1){r27=r17+1|0;if((_isspace(HEAPU8[r17])|0)==0){break}else{r17=r27}}r28=HEAP8[r17];if(r28<<24>>24==44){r29=r27}else{break}while(1){if((_isspace(HEAPU8[r29])|0)==0){r2=r29;continue L4861}else{r29=r29+1|0}}}if(r28<<24>>24==HEAP8[5264164]<<24>>24|r28<<24>>24==0){r30=r17;r31=r28}else{_syntax_error(9,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r5;return}while(1){r28=r30+1|0;if((_isspace(r31&255)|0)==0){break}r30=r28;r31=HEAP8[r28]}r31=HEAP8[r30];if(r31<<24>>24==0|r31<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r5;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r5;return}function _do_binding(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4,r6=r5>>2;HEAP32[r6]=r1;r1=_parse_identifier(r5);if((r1|0)==0){STACKTOP=r4;return}r7=(r2|0)!=16777288&1;r8=r1;while(1){r1=_new_import(r8);if((HEAP32[1315960]|0)==0){_free(r8)}else{_memset(r8,-1,HEAP32[r8-4>>2]);_free(r8-8|0)}r9=r1+8|0;r10=HEAP32[r9>>2];do{if((r10&1|0)==0){r3=3689}else{if((r10&r7|0)==0){r3=3689;break}r11=HEAP32[r1+12>>2];do{if((r10&8|0)==0){if((r10&64|0)!=0){r12=5265664;break}r12=(r10&16777216|0)==0?5264412:5265748}else{r12=5265884}}while(0);_syntax_error(20,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r11,HEAP32[tempInt+4>>2]=r12,tempInt));break}}while(0);if(r3==3689){r3=0;HEAP32[r9>>2]=r10|r2}r1=HEAP32[r6];while(1){r13=r1+1|0;if((_isspace(HEAPU8[r1])|0)==0){break}else{r1=r13}}HEAP32[r6]=r1;r10=HEAP8[r1];if(r10<<24>>24==44){r14=r13}else{r15=r1;r16=r10;break}while(1){if((_isspace(HEAPU8[r14])|0)==0){break}else{r14=r14+1|0}}HEAP32[r6]=r14;r1=_parse_identifier(r5);if((r1|0)==0){r3=3702;break}else{r8=r1}}if(r3==3702){STACKTOP=r4;return}while(1){r3=r15+1|0;if((_isspace(r16&255)|0)==0){break}r15=r3;r16=HEAP8[r3]}r16=HEAP8[r15];if(r16<<24>>24==0|r16<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r4;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}function _ifused(r1,r2){var r3,r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r3+4;HEAP32[r5>>2]=r1;r1=_parse_identifier(r5);if((r1|0)==0){_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r3;return}do{if((_find_name(HEAP32[1310781],r1,r4)|0)==0){r6=0}else{r7=HEAP32[r4>>2];if((r7|0)==0){r6=0;break}if((HEAP32[r7+4>>2]|0)==2){r6=1;break}_syntax_error(22,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r1,tempInt));r6=0}}while(0);if((HEAP32[1315960]|0)==0){_free(r1)}else{_memset(r1,-1,HEAP32[r1-4>>2]);_free(r1-8|0)}r1=HEAP32[1316042]+1|0;HEAP32[1316042]=r1;HEAP8[r1+5264100|0]=(r6|0)==(r2|0)&1;r2=HEAP32[r5>>2];while(1){if((_isspace(HEAPU8[r2])|0)==0){break}else{r2=r2+1|0}}r5=HEAP8[r2];if(r5<<24>>24==0|r5<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r3;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r3;return}function _output_args583(r1){return 0}function _ifdef(r1,r2){var r3,r4,r5,r6,r7,r8;r3=STACKTOP;STACKTOP=STACKTOP+8|0;r4=r3;r5=r3+4;HEAP32[r5>>2]=r1;r1=_get_local_label(r5);do{if((r1|0)==0){r6=_parse_identifier(r5);if((r6|0)!=0){r7=r6;break}_syntax_error(10,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r3;return}else{r7=r1}}while(0);do{if((_find_name(HEAP32[1310781],r7,r4)|0)==0){r8=0}else{r1=HEAP32[r4>>2];if((r1|0)==0){r8=0;break}r8=(HEAP32[r1+4>>2]|0)!=2&1}}while(0);if((HEAP32[1315960]|0)==0){_free(r7)}else{_memset(r7,-1,HEAP32[r7-4>>2]);_free(r7-8|0)}r7=HEAP32[1316042]+1|0;HEAP32[1316042]=r7;HEAP8[r7+5264100|0]=(r8|0)==(r2|0)&1;r2=HEAP32[r5>>2];while(1){if((_isspace(HEAPU8[r2])|0)==0){break}else{r2=r2+1|0}}r5=HEAP8[r2];if(r5<<24>>24==0|r5<<24>>24==HEAP8[5264164]<<24>>24){STACKTOP=r3;return}_syntax_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r3;return}function _write_output(r1,r2,r3){var r4,r5,r6;_fwrite(5267156,10,1,r1);L5023:do{if((r2|0)!=0){r4=r2;while(1){_print_section(r1,r4);r5=HEAP32[r4>>2];if((r5|0)==0){break L5023}else{r4=r5}}}}while(0);_fwrite(5270248,9,1,r1);if((r3|0)==0){return}else{r6=r3}while(1){_print_symbol(r1,r6);_fputc(10,r1);r3=HEAP32[r6>>2];if((r3|0)==0){break}else{r6=r3}}return}function _write_output591(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=0;r5=STACKTOP;if((r2|0)==0){STACKTOP=r5;return}L5036:do{if((r3|0)==0){r6=r2}else{r7=r3,r8=r7>>2;while(1){if((HEAP32[r8+1]|0)==2){_output_error(6,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r8+3],tempInt))}r9=HEAP32[r8];if((r9|0)==0){r6=r2;break L5036}else{r7=r9,r8=r7>>2}}}}while(0);while(1){r3=r6+28|0;r7=r6+32|0;r8=r2,r9=r8>>2;while(1){do{if((r8|0)!=(r6|0)){r10=HEAP32[r9+7];r11=HEAP32[r3>>2];do{if((r10|0)<(r11|0)){r4=3754}else{if((r10|0)<(HEAP32[r7>>2]|0)){break}else{r4=3754;break}}}while(0);if(r4==3754){r4=0;r10=HEAP32[r9+8];if((r10|0)<=(r11|0)){break}if((r10|0)>(HEAP32[r7>>2]|0)){break}}_output_error(0,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r10=HEAP32[r9];if((r10|0)==0){break}else{r8=r10,r9=r8>>2}}r8=HEAP32[r6>>2];if((r8|0)==0){break}else{r6=r8}}do{if(HEAP8[5264196]){r6=r2+28|0;if((_fputc(HEAP32[r6>>2]&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}if((_fputc(HEAP32[r6>>2]>>>8&255,r1)|0)!=-1){r12=r2;r13=0;break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=r2;r13=0;break}else{r12=r2;r13=0}}while(0);while(1){r6=(r12+28|0)>>2;L5065:do{if((r12|0)==(r2|0)){r4=3770}else{r8=HEAP32[r6];if((r8|0)<=(r13|0)){r4=3770;break}r9=(r13|0)==0?r8:r13;if((r9|0)<(r8|0)){r14=r9}else{r15=r9;break}while(1){if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r14+1|0;if((r9|0)<(HEAP32[r6]|0)){r14=r9}else{r15=r9;break L5065}}}}while(0);if(r4==3770){r4=0;r15=HEAP32[r6]}r9=HEAP32[r12+12>>2];L5076:do{if((r9|0)==0){r16=r15}else{r8=r15;r7=r9,r3=r7>>2;while(1){r10=HEAP32[r3+2];r17=r8-1+r10|0;r18=(r17|0)%(r10|0);r19=r17-r18|0;L5079:do{if((r19-r8|0)>0){r17=r10-1-r18|0;r20=0;while(1){if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r20+1|0;if((r21|0)==(r17|0)){break L5079}else{r20=r21}}}}while(0);r18=HEAP32[r3+1];L5087:do{if((r18|0)==4){r10=HEAP32[r3+6];r11=r10+12|0;r20=r10+8|0;r17=r10|0;r10=0;while(1){if((r10|0)>=(HEAP32[r17>>2]|0)){break L5087}if((_fwrite(r11,HEAP32[r20>>2],1,r1)|0)==0){break L5087}else{r10=r10+1|0}}}else if((r18|0)==2){r10=r7+24|0;r20=HEAP32[r10>>2];if((HEAP32[r20>>2]|0)>0){r22=0;r23=r20}else{break}while(1){if((_fputc(HEAPU8[HEAP32[r23+4>>2]+r22|0],r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r20=r22+1|0;r11=HEAP32[r10>>2];if((r20|0)<(HEAP32[r11>>2]|0)){r22=r20;r23=r11}else{break L5087}}}}while(0);r18=_atom_size(r7,r12,r19)+r19|0;r10=HEAP32[r3];if((r10|0)==0){r16=r18;break L5076}else{r8=r18;r7=r10,r3=r7>>2}}}}while(0);r9=HEAP32[r12>>2];if((r9|0)==0){break}else{r12=r9;r13=r16}}STACKTOP=r5;return}function _output_args592(r1){var r2;if((_strcmp(r1,5267092)|0)==0){HEAP8[5264196]=1;r2=1}else{r2=0}return r2}function _write_output598(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+8|0;r6=r5;r7=r5+4;r8=(r2|0)==0;L5106:do{if(r8){r9=0}else{r10=1;r11=r2;while(1){HEAP32[r11+36>>2]=r10;r12=HEAP32[r11>>2];if((r12|0)==0){r9=r10;break L5106}else{r10=r10+1|0;r11=r12}}}}while(0);r11=(r3|0)==0;L5110:do{if(r11){r13=1}else{r10=1;r12=r3,r14=r12>>2;while(1){do{if((HEAP32[r14+2]&128|0)==0){r4=3798}else{if((_strcmp(HEAP32[r14+3],5267012)|0)==0){r4=3798;break}else{r15=r10;break}}}while(0);if(r4==3798){r4=0;HEAP32[r14+9]=r10;r15=r10+1|0}r16=HEAP32[r14];if((r16|0)==0){r13=r15;break L5110}else{r10=r15;r12=r16,r14=r12>>2}}}}while(0);_fw32(r1,1448034890,1);if((_fputc(2,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r15=HEAP32[1316048];L5122:do{if(r15>>>0<128){if((_fputc(r15&255,r1)|0)!=-1){r4=3811;break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r4=3811;break}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r12=HEAP32[1316043];if((r12|0)>0){r17=r15;r18=r12}else{r19=r12;break}while(1){if((_fputc(r17&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r12=r18-1|0;if((r12|0)>0){r17=r17>>8;r18=r12}else{r4=3811;break L5122}}}}while(0);if(r4==3811){r19=HEAP32[1316043]}L5137:do{if(r19>>>0<128){if((_fputc(r19&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(r19+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r18=HEAP32[1316043];if((r18|0)>0){r20=r19;r21=r18}else{break}while(1){if((_fputc(r20&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r18=r21-1|0;if((r18|0)>0){r20=r20>>8;r21=r18}else{break L5137}}}}while(0);r21=HEAP32[1315967];L5150:do{if((r21|0)!=0){r20=r21;while(1){r19=HEAP8[r20];if(r19<<24>>24==0){break L5150}if((_fputc(r19&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r19=r20+1|0;if((r19|0)==0){break L5150}else{r20=r19}}}}while(0);if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}L5161:do{if(r9>>>0<128){if((_fputc(r9&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=HEAP32[1316043];if((r21|0)>0){r22=r9;r23=r21}else{break}while(1){if((_fputc(r22&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r23-1|0;if((r21|0)>0){r22=r22>>8;r23=r21}else{break L5161}}}}while(0);r23=r13-1|0;L5174:do{if(r23>>>0<128){if((_fputc(r23&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r13=HEAP32[1316043];if((r13|0)>0){r24=r23;r25=r13}else{break}while(1){if((_fputc(r24&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r13=r25-1|0;if((r13|0)>0){r24=r24>>8;r25=r13}else{break L5174}}}}while(0);L5187:do{if(!r11){r25=r3,r24=r25>>2;while(1){r23=(r25+8|0)>>2;r13=HEAP32[r24+3];do{if((HEAP32[r23]&128|0)==0){r4=3851}else{if((_strcmp(r13,5267012)|0)==0){r4=3851;break}else{break}}}while(0);L5193:do{if(r4==3851){r4=0;L5195:do{if((r13|0)!=0){r22=r13;while(1){r9=HEAP8[r22];if(r9<<24>>24==0){break L5195}if((_fputc(r9&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r22+1|0;if((r9|0)==0){break L5195}else{r22=r9}}}}while(0);if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r22=r25+4|0;r9=HEAP32[r22>>2];L5206:do{if(r9>>>0<128){if((_fputc(r9&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=HEAP32[1316043];if((r21|0)>0){r26=r9;r27=r21}else{break}while(1){if((_fputc(r26&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r27-1|0;if((r21|0)>0){r26=r26>>8;r27=r21}else{break L5206}}}}while(0);r9=HEAP32[r23];L5219:do{if(r9>>>0<128){if((_fputc(r9&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=HEAP32[1316043];if((r21|0)>0){r28=r9;r29=r21}else{break}while(1){if((_fputc(r28&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r21=r29-1|0;if((r21|0)>0){r28=r28>>8;r29=r21}else{break L5219}}}}while(0);r9=HEAP32[r24+6];L5232:do{if((r9|0)==0){r30=0;r4=3878}else{r21=HEAP32[r9+36>>2];if(r21>>>0<128){r30=r21;r4=3878;break}if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r20=HEAP32[1316043];if((r20|0)>0){r31=r21;r32=r20}else{break}while(1){if((_fputc(r31&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r20=r32-1|0;if((r20|0)>0){r31=r31>>8;r32=r20}else{break L5232}}}}while(0);do{if(r4==3878){r4=0;if((_fputc(r30&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);do{if((HEAP32[r23]&32|0)==0){r9=HEAP32[r22>>2];if((r9|0)==1){r33=r25+28|0;r4=3893;break}else if((r9|0)!=3){r34=0;r4=3894;break}r9=HEAP32[r24+4];if((r9|0)==0){_general_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=0,HEAP32[tempInt+4>>2]=411,HEAP32[tempInt+8>>2]=5268944,tempInt));r34=0;r4=3894;break}else{_eval_expr(r9,r7,0,0);r33=r7;r4=3893;break}}else{r33=r25+32|0;r4=3893;break}}while(0);L5256:do{if(r4==3893){r4=0;r22=HEAP32[r33>>2];if(r22>>>0<128){r34=r22;r4=3894;break}if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=HEAP32[1316043];if((r9|0)>0){r35=r22;r36=r9}else{break}while(1){if((_fputc(r35&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r36-1|0;if((r9|0)>0){r35=r35>>8;r36=r9}else{break L5256}}}}while(0);do{if(r4==3894){r4=0;if((_fputc(r34&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r9=HEAP32[r24+5];do{if((r9|0)==0){r37=0}else{_eval_expr(r9,r6,0,0);r22=HEAP32[r6>>2];if(r22>>>0<128){r37=r22;break}if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r20=HEAP32[1316043];if((r20|0)>0){r38=r22;r39=r20}else{break L5193}while(1){if((_fputc(r38&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r20=r39-1|0;if((r20|0)>0){r38=r38>>8;r39=r20}else{break L5193}}}}while(0);if((_fputc(r37&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}}while(0);r23=HEAP32[r24];if((r23|0)==0){break L5187}else{r25=r23,r24=r25>>2}}}}while(0);if(r8){STACKTOP=r5;return}else{r40=r2,r41=r40>>2}while(1){r2=HEAP32[r41+1];L5290:do{if((r2|0)!=0){r8=r2;while(1){r37=HEAP8[r8];if(r37<<24>>24==0){break L5290}if((_fputc(r37&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=r8+1|0;if((r37|0)==0){break L5290}else{r8=r37}}}}while(0);if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r2=HEAP32[r41+2];L5301:do{if((r2|0)!=0){r8=r2;while(1){r37=HEAP8[r8];if(r37<<24>>24==0){break L5301}if((_fputc(r37&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=r8+1|0;if((r37|0)==0){break L5301}else{r8=r37}}}}while(0);if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r2=HEAP32[r41+6];L5312:do{if(r2>>>0<128){if((_fputc(r2&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=HEAP32[1316043];if((r8|0)>0){r42=r2;r43=r8}else{break}while(1){if((_fputc(r42&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r43-1|0;if((r8|0)>0){r42=r42>>8;r43=r8}else{break L5312}}}}while(0);r2=HEAP32[r41+5];L5325:do{if(r2>>>0<128){if((_fputc(r2&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=HEAP32[1316043];if((r8|0)>0){r44=r2;r45=r8}else{break}while(1){if((_fputc(r44&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r8=r45-1|0;if((r8|0)>0){r44=r44>>8;r45=r8}else{break L5325}}}}while(0);r2=(r40+32|0)>>2;HEAP32[r2]=0;r8=(r40+12|0)>>2;r37=HEAP32[r8];L5338:do{if((r37|0)==0){r46=0;r47=0;r48=0;r4=3968}else{r39=0;r38=0;r6=r37,r34=r6>>2;r36=-1;while(1){r35=HEAP32[r34+2];r33=r35+r36|0;r7=r33-(r33|0)%(r35|0)|0;HEAP32[r2]=r7;r35=_atom_size(r6,r40,r7)+HEAP32[r2]|0;HEAP32[r2]=r35;r7=HEAP32[r34+1];L5341:do{if((r7|0)==4){r33=HEAP32[r34+6];r30=HEAP32[r33+24>>2];if((r30|0)==0){r32=HEAP32[r33+8>>2];if((r32|0)>0){r49=r39;r50=0}else{r51=r38;r52=r39;r53=r35;break}while(1){r31=HEAP8[r33+(r50+12)|0]<<24>>24==0?r49:r35;r29=r50+1|0;if((r29|0)==(r32|0)){r51=r38;r52=r31;r53=r35;break L5341}else{r49=r31;r50=r29}}}else{r54=r30,r55=r54>>2;r56=0}while(1){r32=HEAP32[r55+2];do{if(r32>>>0<17){r57=r56+1|0}else{if((r32|0)<17){r33=HEAP32[r55+1]>>2;r29=HEAP32[r33+1];r31=HEAP32[r33+2];r28=HEAP32[HEAP32[r33+4]+12>>2];_output_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=r32,HEAP32[tempInt+4>>2]=r29,HEAP32[tempInt+8>>2]=r31,HEAP32[tempInt+12>>2]=r28,tempInt));r57=r56;break}else{_output_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r32,tempInt));r57=r56;break}}}while(0);r32=HEAP32[r55];if((r32|0)==0){break}else{r54=r32,r55=r54>>2;r56=r57}}r30=HEAP32[r2];r51=r57+r38|0;r52=r30;r53=r30}else if((r7|0)==2){r30=HEAP32[HEAP32[r34+6]+8>>2];if((r30|0)==0){r58=0;r59=r35}else{r32=r30,r30=r32>>2;r28=0;while(1){r31=HEAP32[r30+2];do{if(r31>>>0<17){r60=r28+1|0}else{if((r31|0)<17){r29=HEAP32[r30+1]>>2;r33=HEAP32[r29+1];r27=HEAP32[r29+2];r26=HEAP32[HEAP32[r29+4]+12>>2];_output_error(4,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=r31,HEAP32[tempInt+4>>2]=r33,HEAP32[tempInt+8>>2]=r27,HEAP32[tempInt+12>>2]=r26,tempInt));r60=r28;break}else{_output_error(5,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r31,tempInt));r60=r28;break}}}while(0);r31=HEAP32[r30];if((r31|0)==0){break}else{r32=r31,r30=r32>>2;r28=r60}}r58=r60;r59=HEAP32[r2]}r51=r58+r38|0;r52=r35;r53=r59}else{r51=r38;r52=r39;r53=r35}}while(0);r35=HEAP32[r34];if((r35|0)==0){break}else{r39=r52;r38=r51;r6=r35,r34=r6>>2;r36=r53-1|0}}if(r53>>>0<128){r46=r53;r47=r51;r48=r52;r4=3968;break}if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r36=HEAP32[1316043];if((r36|0)>0){r61=r53;r62=r36}else{r63=r51;r64=r52;break}while(1){if((_fputc(r61&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r36=r62-1|0;if((r36|0)>0){r61=r61>>8;r62=r36}else{r63=r51;r64=r52;break L5338}}}}while(0);do{if(r4==3968){r4=0;if((_fputc(r46&255,r1)|0)!=-1){r63=r47;r64=r48;break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r63=r47;r64=r48}}while(0);L5385:do{if(r63>>>0<128){if((_fputc(r63&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=HEAP32[1316043];if((r37|0)>0){r65=r63;r66=r37}else{break}while(1){if((_fputc(r65&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=r66-1|0;if((r37|0)>0){r65=r65>>8;r66=r37}else{break L5385}}}}while(0);L5398:do{if(r64>>>0<128){if((_fputc(r64&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=HEAP32[1316043];if((r37|0)>0){r67=r64;r68=r37}else{break}while(1){if((_fputc(r67&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r37=r68-1|0;if((r37|0)>0){r67=r67>>8;r68=r37}else{break L5398}}}}while(0);HEAP32[r2]=0;r37=HEAP32[r8];L5411:do{if((r37|0)==0){HEAP32[r2]=0}else{r36=HEAP32[r37+8>>2];r6=r36-1|0;r34=r6-(r6|0)%(r36|0)|0;HEAP32[r2]=r34;L5414:do{if((r34|0)<(r64|0)){r36=0;r6=r37,r38=r6>>2;r39=r34;while(1){L5417:do{if((r36|0)<(r39|0)){r35=r36;while(1){if((_fputc(0,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r7=r35+1|0;r28=HEAP32[r2];if((r7|0)<(r28|0)){r35=r7}else{r69=r28;break L5417}}}else{r69=r39}}while(0);HEAP32[r2]=_atom_size(r6,r40,r69)+HEAP32[r2]|0;r35=HEAP32[r38+1];L5424:do{if((r35|0)==2){r28=HEAP32[r38+6];r7=HEAP32[r28>>2];if((r7|0)==0){break}if((_fwrite(HEAP32[r28+4>>2],1,r7,r1)|0)!=0){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else if((r35|0)==4){r7=HEAP32[r38+6];r28=r7+12|0;r32=r7+8|0;r30=r7|0;r7=0;while(1){if((r7|0)>=(HEAP32[r30>>2]|0)){break L5424}if((_fwrite(r28,HEAP32[r32>>2],1,r1)|0)==0){break L5424}else{r7=r7+1|0}}}}while(0);r35=HEAP32[r38];if((r35|0)==0){break L5414}r7=HEAP32[r2];r32=HEAP32[r35+8>>2];r28=r7-1+r32|0;r30=r28-(r28|0)%(r32|0)|0;HEAP32[r2]=r30;if((r30|0)<(r64|0)){r36=r7;r6=r35,r38=r6>>2;r39=r30}else{break L5414}}}}while(0);r34=HEAP32[r8];HEAP32[r2]=0;if((r34|0)==0){break}else{r70=r34,r71=r70>>2;r72=0}while(1){r34=HEAP32[r71+2];r39=r72-1+r34|0;HEAP32[r2]=r39-(r39|0)%(r34|0)|0;r34=HEAP32[r71+1];if((r34|0)==4){_write_rlist(r1,r40,HEAP32[HEAP32[r71+6]+24>>2])}else if((r34|0)==2){_write_rlist(r1,r40,HEAP32[HEAP32[r71+6]+8>>2])}r34=_atom_size(r70,r40,HEAP32[r2])+HEAP32[r2]|0;HEAP32[r2]=r34;r39=HEAP32[r71];if((r39|0)==0){break L5411}else{r70=r39,r71=r70>>2;r72=r34}}}}while(0);r2=HEAP32[r41];if((r2|0)==0){break}else{r40=r2,r41=r40>>2}}STACKTOP=r5;return}function _output_args599(r1){return 0}function _write_rlist(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=STACKTOP;if((r3|0)==0){STACKTOP=r4;return}r5=r2+32|0;r2=r3,r3=r2>>2;while(1){r6=HEAP32[r3+2];L5450:do{if(r6>>>0<17){r7=HEAP32[r3+1],r8=r7>>2;if((_fputc(r6&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r7;r7=((HEAP32[r9>>2]|0)/(HEAP32[1316048]|0)&-1)+HEAP32[r5>>2]|0;L5455:do{if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=HEAP32[1316043];if((r10|0)>0){r11=r7;r12=r10}else{break}while(1){if((_fputc(r11&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=r12-1|0;if((r10|0)>0){r11=r11>>8;r12=r10}else{break L5455}}}}while(0);r7=(HEAP32[r9>>2]|0)%(HEAP32[1316048]|0);L5468:do{if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=HEAP32[1316043];if((r10|0)>0){r13=r7;r14=r10}else{break}while(1){if((_fputc(r13&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r10=r14-1|0;if((r10|0)>0){r13=r13>>8;r14=r10}else{break L5468}}}}while(0);r7=HEAP32[r8+1];L5481:do{if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=HEAP32[1316043];if((r9|0)>0){r15=r7;r16=r9}else{break}while(1){if((_fputc(r15&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r16-1|0;if((r9|0)>0){r15=r15>>8;r16=r9}else{break L5481}}}}while(0);r7=HEAP32[r8+2];L5494:do{if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=HEAP32[1316043];if((r9|0)>0){r17=r7;r18=r9}else{break}while(1){if((_fputc(r17&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r18-1|0;if((r9|0)>0){r17=r17>>8;r18=r9}else{break L5494}}}}while(0);r7=HEAP32[r8+3];L5507:do{if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=HEAP32[1316043];if((r9|0)>0){r19=r7;r20=r9}else{break}while(1){if((_fputc(r19&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r20-1|0;if((r9|0)>0){r19=r19>>8;r20=r9}else{break L5507}}}}while(0);r7=HEAP32[HEAP32[r8+4]+36>>2];if(r7>>>0<128){if((_fputc(r7&255,r1)|0)!=-1){break}_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}if((_fputc(HEAP32[1316043]+128&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=HEAP32[1316043];if((r9|0)>0){r21=r7;r22=r9}else{break}while(1){if((_fputc(r21&255,r1)|0)==-1){_output_error(2,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r9=r22-1|0;if((r9|0)>0){r21=r21>>8;r22=r9}else{break L5450}}}}while(0);r6=HEAP32[r3];if((r6|0)==0){break}else{r2=r6,r3=r2>>2}}STACKTOP=r4;return}function _malloc(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95;r2=0;do{if(r1>>>0<245){if(r1>>>0<11){r3=16}else{r3=r1+11&-8}r4=r3>>>3;r5=HEAP32[1317914];r6=r5>>>(r4>>>0);if((r6&3|0)!=0){r7=(r6&1^1)+r4|0;r8=r7<<1;r9=(r8<<2)+5271696|0;r10=(r8+2<<2)+5271696|0;r8=HEAP32[r10>>2];r11=r8+8|0;r12=HEAP32[r11>>2];do{if((r9|0)==(r12|0)){HEAP32[1317914]=r5&(1<<r7^-1)}else{if(r12>>>0<HEAP32[1317918]>>>0){_abort()}r13=r12+12|0;if((HEAP32[r13>>2]|0)==(r8|0)){HEAP32[r13>>2]=r9;HEAP32[r10>>2]=r12;break}else{_abort()}}}while(0);r12=r7<<3;HEAP32[r8+4>>2]=r12|3;r10=r8+(r12|4)|0;HEAP32[r10>>2]=HEAP32[r10>>2]|1;r14=r11;return r14}if(r3>>>0<=HEAP32[1317916]>>>0){r15=r3,r16=r15>>2;break}if((r6|0)!=0){r10=2<<r4;r12=r6<<r4&(r10|-r10);r10=(r12&-r12)-1|0;r12=r10>>>12&16;r9=r10>>>(r12>>>0);r10=r9>>>5&8;r13=r9>>>(r10>>>0);r9=r13>>>2&4;r17=r13>>>(r9>>>0);r13=r17>>>1&2;r18=r17>>>(r13>>>0);r17=r18>>>1&1;r19=(r10|r12|r9|r13|r17)+(r18>>>(r17>>>0))|0;r17=r19<<1;r18=(r17<<2)+5271696|0;r13=(r17+2<<2)+5271696|0;r17=HEAP32[r13>>2];r9=r17+8|0;r12=HEAP32[r9>>2];do{if((r18|0)==(r12|0)){HEAP32[1317914]=r5&(1<<r19^-1)}else{if(r12>>>0<HEAP32[1317918]>>>0){_abort()}r10=r12+12|0;if((HEAP32[r10>>2]|0)==(r17|0)){HEAP32[r10>>2]=r18;HEAP32[r13>>2]=r12;break}else{_abort()}}}while(0);r12=r19<<3;r13=r12-r3|0;HEAP32[r17+4>>2]=r3|3;r18=r17;r5=r18+r3|0;HEAP32[r18+(r3|4)>>2]=r13|1;HEAP32[r18+r12>>2]=r13;r12=HEAP32[1317916];if((r12|0)!=0){r18=HEAP32[1317919];r4=r12>>>3;r12=r4<<1;r6=(r12<<2)+5271696|0;r11=HEAP32[1317914];r8=1<<r4;do{if((r11&r8|0)==0){HEAP32[1317914]=r11|r8;r20=r6;r21=(r12+2<<2)+5271696|0}else{r4=(r12+2<<2)+5271696|0;r7=HEAP32[r4>>2];if(r7>>>0>=HEAP32[1317918]>>>0){r20=r7;r21=r4;break}_abort()}}while(0);HEAP32[r21>>2]=r18;HEAP32[r20+12>>2]=r18;HEAP32[r18+8>>2]=r20;HEAP32[r18+12>>2]=r6}HEAP32[1317916]=r13;HEAP32[1317919]=r5;r14=r9;return r14}r12=HEAP32[1317915];if((r12|0)==0){r15=r3,r16=r15>>2;break}r8=(r12&-r12)-1|0;r12=r8>>>12&16;r11=r8>>>(r12>>>0);r8=r11>>>5&8;r17=r11>>>(r8>>>0);r11=r17>>>2&4;r19=r17>>>(r11>>>0);r17=r19>>>1&2;r4=r19>>>(r17>>>0);r19=r4>>>1&1;r7=HEAP32[((r8|r12|r11|r17|r19)+(r4>>>(r19>>>0))<<2)+5271960>>2];r19=r7;r4=r7,r17=r4>>2;r11=(HEAP32[r7+4>>2]&-8)-r3|0;while(1){r7=HEAP32[r19+16>>2];if((r7|0)==0){r12=HEAP32[r19+20>>2];if((r12|0)==0){break}else{r22=r12}}else{r22=r7}r7=(HEAP32[r22+4>>2]&-8)-r3|0;r12=r7>>>0<r11>>>0;r19=r22;r4=r12?r22:r4,r17=r4>>2;r11=r12?r7:r11}r19=r4;r9=HEAP32[1317918];if(r19>>>0<r9>>>0){_abort()}r5=r19+r3|0;r13=r5;if(r19>>>0>=r5>>>0){_abort()}r5=HEAP32[r17+6];r6=HEAP32[r17+3];L56:do{if((r6|0)==(r4|0)){r18=r4+20|0;r7=HEAP32[r18>>2];do{if((r7|0)==0){r12=r4+16|0;r8=HEAP32[r12>>2];if((r8|0)==0){r23=0,r24=r23>>2;break L56}else{r25=r8;r26=r12;break}}else{r25=r7;r26=r18}}while(0);while(1){r18=r25+20|0;r7=HEAP32[r18>>2];if((r7|0)!=0){r25=r7;r26=r18;continue}r18=r25+16|0;r7=HEAP32[r18>>2];if((r7|0)==0){break}else{r25=r7;r26=r18}}if(r26>>>0<r9>>>0){_abort()}else{HEAP32[r26>>2]=0;r23=r25,r24=r23>>2;break}}else{r18=HEAP32[r17+2];if(r18>>>0<r9>>>0){_abort()}r7=r18+12|0;if((HEAP32[r7>>2]|0)!=(r4|0)){_abort()}r12=r6+8|0;if((HEAP32[r12>>2]|0)==(r4|0)){HEAP32[r7>>2]=r6;HEAP32[r12>>2]=r18;r23=r6,r24=r23>>2;break}else{_abort()}}}while(0);L78:do{if((r5|0)!=0){r6=r4+28|0;r9=(HEAP32[r6>>2]<<2)+5271960|0;do{if((r4|0)==(HEAP32[r9>>2]|0)){HEAP32[r9>>2]=r23;if((r23|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r6>>2]^-1);break L78}else{if(r5>>>0<HEAP32[1317918]>>>0){_abort()}r18=r5+16|0;if((HEAP32[r18>>2]|0)==(r4|0)){HEAP32[r18>>2]=r23}else{HEAP32[r5+20>>2]=r23}if((r23|0)==0){break L78}}}while(0);if(r23>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r24+6]=r5;r6=HEAP32[r17+4];do{if((r6|0)!=0){if(r6>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r24+4]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);r6=HEAP32[r17+5];if((r6|0)==0){break}if(r6>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r24+5]=r6;HEAP32[r6+24>>2]=r23;break}}}while(0);if(r11>>>0<16){r5=r11+r3|0;HEAP32[r17+1]=r5|3;r6=r5+(r19+4)|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}else{HEAP32[r17+1]=r3|3;HEAP32[r19+(r3|4)>>2]=r11|1;HEAP32[r19+r11+r3>>2]=r11;r6=HEAP32[1317916];if((r6|0)!=0){r5=HEAP32[1317919];r9=r6>>>3;r6=r9<<1;r18=(r6<<2)+5271696|0;r12=HEAP32[1317914];r7=1<<r9;do{if((r12&r7|0)==0){HEAP32[1317914]=r12|r7;r27=r18;r28=(r6+2<<2)+5271696|0}else{r9=(r6+2<<2)+5271696|0;r8=HEAP32[r9>>2];if(r8>>>0>=HEAP32[1317918]>>>0){r27=r8;r28=r9;break}_abort()}}while(0);HEAP32[r28>>2]=r5;HEAP32[r27+12>>2]=r5;HEAP32[r5+8>>2]=r27;HEAP32[r5+12>>2]=r18}HEAP32[1317916]=r11;HEAP32[1317919]=r13}r6=r4+8|0;if((r6|0)==0){r15=r3,r16=r15>>2;break}else{r14=r6}return r14}else{if(r1>>>0>4294967231){r15=-1,r16=r15>>2;break}r6=r1+11|0;r7=r6&-8,r12=r7>>2;r19=HEAP32[1317915];if((r19|0)==0){r15=r7,r16=r15>>2;break}r17=-r7|0;r9=r6>>>8;do{if((r9|0)==0){r29=0}else{if(r7>>>0>16777215){r29=31;break}r6=(r9+1048320|0)>>>16&8;r8=r9<<r6;r10=(r8+520192|0)>>>16&4;r30=r8<<r10;r8=(r30+245760|0)>>>16&2;r31=14-(r10|r6|r8)+(r30<<r8>>>15)|0;r29=r7>>>((r31+7|0)>>>0)&1|r31<<1}}while(0);r9=HEAP32[(r29<<2)+5271960>>2];L126:do{if((r9|0)==0){r32=0;r33=r17;r34=0}else{if((r29|0)==31){r35=0}else{r35=25-(r29>>>1)|0}r4=0;r13=r17;r11=r9,r18=r11>>2;r5=r7<<r35;r31=0;while(1){r8=HEAP32[r18+1]&-8;r30=r8-r7|0;if(r30>>>0<r13>>>0){if((r8|0)==(r7|0)){r32=r11;r33=r30;r34=r11;break L126}else{r36=r11;r37=r30}}else{r36=r4;r37=r13}r30=HEAP32[r18+5];r8=HEAP32[((r5>>>31<<2)+16>>2)+r18];r6=(r30|0)==0|(r30|0)==(r8|0)?r31:r30;if((r8|0)==0){r32=r36;r33=r37;r34=r6;break L126}else{r4=r36;r13=r37;r11=r8,r18=r11>>2;r5=r5<<1;r31=r6}}}}while(0);if((r34|0)==0&(r32|0)==0){r9=2<<r29;r17=r19&(r9|-r9);if((r17|0)==0){r15=r7,r16=r15>>2;break}r9=(r17&-r17)-1|0;r17=r9>>>12&16;r31=r9>>>(r17>>>0);r9=r31>>>5&8;r5=r31>>>(r9>>>0);r31=r5>>>2&4;r11=r5>>>(r31>>>0);r5=r11>>>1&2;r18=r11>>>(r5>>>0);r11=r18>>>1&1;r38=HEAP32[((r9|r17|r31|r5|r11)+(r18>>>(r11>>>0))<<2)+5271960>>2]}else{r38=r34}L141:do{if((r38|0)==0){r39=r33;r40=r32,r41=r40>>2}else{r11=r38,r18=r11>>2;r5=r33;r31=r32;while(1){r17=(HEAP32[r18+1]&-8)-r7|0;r9=r17>>>0<r5>>>0;r13=r9?r17:r5;r17=r9?r11:r31;r9=HEAP32[r18+4];if((r9|0)!=0){r11=r9,r18=r11>>2;r5=r13;r31=r17;continue}r9=HEAP32[r18+5];if((r9|0)==0){r39=r13;r40=r17,r41=r40>>2;break L141}else{r11=r9,r18=r11>>2;r5=r13;r31=r17}}}}while(0);if((r40|0)==0){r15=r7,r16=r15>>2;break}if(r39>>>0>=(HEAP32[1317916]-r7|0)>>>0){r15=r7,r16=r15>>2;break}r19=r40,r31=r19>>2;r5=HEAP32[1317918];if(r19>>>0<r5>>>0){_abort()}r11=r19+r7|0;r18=r11;if(r19>>>0>=r11>>>0){_abort()}r17=HEAP32[r41+6];r13=HEAP32[r41+3];L154:do{if((r13|0)==(r40|0)){r9=r40+20|0;r4=HEAP32[r9>>2];do{if((r4|0)==0){r6=r40+16|0;r8=HEAP32[r6>>2];if((r8|0)==0){r42=0,r43=r42>>2;break L154}else{r44=r8;r45=r6;break}}else{r44=r4;r45=r9}}while(0);while(1){r9=r44+20|0;r4=HEAP32[r9>>2];if((r4|0)!=0){r44=r4;r45=r9;continue}r9=r44+16|0;r4=HEAP32[r9>>2];if((r4|0)==0){break}else{r44=r4;r45=r9}}if(r45>>>0<r5>>>0){_abort()}else{HEAP32[r45>>2]=0;r42=r44,r43=r42>>2;break}}else{r9=HEAP32[r41+2];if(r9>>>0<r5>>>0){_abort()}r4=r9+12|0;if((HEAP32[r4>>2]|0)!=(r40|0)){_abort()}r6=r13+8|0;if((HEAP32[r6>>2]|0)==(r40|0)){HEAP32[r4>>2]=r13;HEAP32[r6>>2]=r9;r42=r13,r43=r42>>2;break}else{_abort()}}}while(0);L176:do{if((r17|0)!=0){r13=r40+28|0;r5=(HEAP32[r13>>2]<<2)+5271960|0;do{if((r40|0)==(HEAP32[r5>>2]|0)){HEAP32[r5>>2]=r42;if((r42|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r13>>2]^-1);break L176}else{if(r17>>>0<HEAP32[1317918]>>>0){_abort()}r9=r17+16|0;if((HEAP32[r9>>2]|0)==(r40|0)){HEAP32[r9>>2]=r42}else{HEAP32[r17+20>>2]=r42}if((r42|0)==0){break L176}}}while(0);if(r42>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r43+6]=r17;r13=HEAP32[r41+4];do{if((r13|0)!=0){if(r13>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r43+4]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);r13=HEAP32[r41+5];if((r13|0)==0){break}if(r13>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r43+5]=r13;HEAP32[r13+24>>2]=r42;break}}}while(0);do{if(r39>>>0<16){r17=r39+r7|0;HEAP32[r41+1]=r17|3;r13=r17+(r19+4)|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1}else{HEAP32[r41+1]=r7|3;HEAP32[((r7|4)>>2)+r31]=r39|1;HEAP32[(r39>>2)+r31+r12]=r39;r13=r39>>>3;if(r39>>>0<256){r17=r13<<1;r5=(r17<<2)+5271696|0;r9=HEAP32[1317914];r6=1<<r13;do{if((r9&r6|0)==0){HEAP32[1317914]=r9|r6;r46=r5;r47=(r17+2<<2)+5271696|0}else{r13=(r17+2<<2)+5271696|0;r4=HEAP32[r13>>2];if(r4>>>0>=HEAP32[1317918]>>>0){r46=r4;r47=r13;break}_abort()}}while(0);HEAP32[r47>>2]=r18;HEAP32[r46+12>>2]=r18;HEAP32[r12+(r31+2)]=r46;HEAP32[r12+(r31+3)]=r5;break}r17=r11;r6=r39>>>8;do{if((r6|0)==0){r48=0}else{if(r39>>>0>16777215){r48=31;break}r9=(r6+1048320|0)>>>16&8;r13=r6<<r9;r4=(r13+520192|0)>>>16&4;r8=r13<<r4;r13=(r8+245760|0)>>>16&2;r30=14-(r4|r9|r13)+(r8<<r13>>>15)|0;r48=r39>>>((r30+7|0)>>>0)&1|r30<<1}}while(0);r6=(r48<<2)+5271960|0;HEAP32[r12+(r31+7)]=r48;HEAP32[r12+(r31+5)]=0;HEAP32[r12+(r31+4)]=0;r5=HEAP32[1317915];r30=1<<r48;if((r5&r30|0)==0){HEAP32[1317915]=r5|r30;HEAP32[r6>>2]=r17;HEAP32[r12+(r31+6)]=r6;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}if((r48|0)==31){r49=0}else{r49=25-(r48>>>1)|0}r30=r39<<r49;r5=HEAP32[r6>>2];while(1){if((HEAP32[r5+4>>2]&-8|0)==(r39|0)){break}r50=(r30>>>31<<2)+r5+16|0;r6=HEAP32[r50>>2];if((r6|0)==0){r2=151;break}else{r30=r30<<1;r5=r6}}if(r2==151){if(r50>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r50>>2]=r17;HEAP32[r12+(r31+6)]=r5;HEAP32[r12+(r31+3)]=r17;HEAP32[r12+(r31+2)]=r17;break}}r30=r5+8|0;r6=HEAP32[r30>>2];r13=HEAP32[1317918];if(r5>>>0<r13>>>0){_abort()}if(r6>>>0<r13>>>0){_abort()}else{HEAP32[r6+12>>2]=r17;HEAP32[r30>>2]=r17;HEAP32[r12+(r31+2)]=r6;HEAP32[r12+(r31+3)]=r5;HEAP32[r12+(r31+6)]=0;break}}}while(0);r31=r40+8|0;if((r31|0)==0){r15=r7,r16=r15>>2;break}else{r14=r31}return r14}}while(0);r40=HEAP32[1317916];if(r15>>>0<=r40>>>0){r50=r40-r15|0;r39=HEAP32[1317919];if(r50>>>0>15){r49=r39;HEAP32[1317919]=r49+r15|0;HEAP32[1317916]=r50;HEAP32[(r49+4>>2)+r16]=r50|1;HEAP32[r49+r40>>2]=r50;HEAP32[r39+4>>2]=r15|3}else{HEAP32[1317916]=0;HEAP32[1317919]=0;HEAP32[r39+4>>2]=r40|3;r50=r40+(r39+4)|0;HEAP32[r50>>2]=HEAP32[r50>>2]|1}r14=r39+8|0;return r14}r39=HEAP32[1317917];if(r15>>>0<r39>>>0){r50=r39-r15|0;HEAP32[1317917]=r50;r39=HEAP32[1317920];r40=r39;HEAP32[1317920]=r40+r15|0;HEAP32[(r40+4>>2)+r16]=r50|1;HEAP32[r39+4>>2]=r15|3;r14=r39+8|0;return r14}do{if((HEAP32[1311079]|0)==0){r39=_sysconf(8);if((r39-1&r39|0)==0){HEAP32[1311081]=r39;HEAP32[1311080]=r39;HEAP32[1311082]=-1;HEAP32[1311083]=2097152;HEAP32[1311084]=0;HEAP32[1318025]=0;HEAP32[1311079]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);r39=r15+48|0;r50=HEAP32[1311081];r40=r15+47|0;r49=r50+r40|0;r48=-r50|0;r50=r49&r48;if(r50>>>0<=r15>>>0){r14=0;return r14}r46=HEAP32[1318024];do{if((r46|0)!=0){r47=HEAP32[1318022];r41=r47+r50|0;if(r41>>>0<=r47>>>0|r41>>>0>r46>>>0){r14=0}else{break}return r14}}while(0);L268:do{if((HEAP32[1318025]&4|0)==0){r46=HEAP32[1317920];L270:do{if((r46|0)==0){r2=181}else{r41=r46;r47=5272104;while(1){r51=r47|0;r42=HEAP32[r51>>2];if(r42>>>0<=r41>>>0){r52=r47+4|0;if((r42+HEAP32[r52>>2]|0)>>>0>r41>>>0){break}}r42=HEAP32[r47+8>>2];if((r42|0)==0){r2=181;break L270}else{r47=r42}}if((r47|0)==0){r2=181;break}r41=r49-HEAP32[1317917]&r48;if(r41>>>0>=2147483647){r53=0;break}r5=_sbrk(r41);r17=(r5|0)==(HEAP32[r51>>2]+HEAP32[r52>>2]|0);r54=r17?r5:-1;r55=r17?r41:0;r56=r5;r57=r41;r2=190;break}}while(0);do{if(r2==181){r46=_sbrk(0);if((r46|0)==-1){r53=0;break}r7=r46;r41=HEAP32[1311080];r5=r41-1|0;if((r5&r7|0)==0){r58=r50}else{r58=r50-r7+(r5+r7&-r41)|0}r41=HEAP32[1318022];r7=r41+r58|0;if(!(r58>>>0>r15>>>0&r58>>>0<2147483647)){r53=0;break}r5=HEAP32[1318024];if((r5|0)!=0){if(r7>>>0<=r41>>>0|r7>>>0>r5>>>0){r53=0;break}}r5=_sbrk(r58);r7=(r5|0)==(r46|0);r54=r7?r46:-1;r55=r7?r58:0;r56=r5;r57=r58;r2=190;break}}while(0);L290:do{if(r2==190){r5=-r57|0;if((r54|0)!=-1){r59=r55,r60=r59>>2;r61=r54,r62=r61>>2;r2=201;break L268}do{if((r56|0)!=-1&r57>>>0<2147483647&r57>>>0<r39>>>0){r7=HEAP32[1311081];r46=r40-r57+r7&-r7;if(r46>>>0>=2147483647){r63=r57;break}if((_sbrk(r46)|0)==-1){_sbrk(r5);r53=r55;break L290}else{r63=r46+r57|0;break}}else{r63=r57}}while(0);if((r56|0)==-1){r53=r55}else{r59=r63,r60=r59>>2;r61=r56,r62=r61>>2;r2=201;break L268}}}while(0);HEAP32[1318025]=HEAP32[1318025]|4;r64=r53;r2=198;break}else{r64=0;r2=198}}while(0);do{if(r2==198){if(r50>>>0>=2147483647){break}r53=_sbrk(r50);r56=_sbrk(0);if(!((r56|0)!=-1&(r53|0)!=-1&r53>>>0<r56>>>0)){break}r63=r56-r53|0;r56=r63>>>0>(r15+40|0)>>>0;r55=r56?r53:-1;if((r55|0)==-1){break}else{r59=r56?r63:r64,r60=r59>>2;r61=r55,r62=r61>>2;r2=201;break}}}while(0);do{if(r2==201){r64=HEAP32[1318022]+r59|0;HEAP32[1318022]=r64;if(r64>>>0>HEAP32[1318023]>>>0){HEAP32[1318023]=r64}r64=HEAP32[1317920],r50=r64>>2;L310:do{if((r64|0)==0){r55=HEAP32[1317918];if((r55|0)==0|r61>>>0<r55>>>0){HEAP32[1317918]=r61}HEAP32[1318026]=r61;HEAP32[1318027]=r59;HEAP32[1318029]=0;HEAP32[1317923]=HEAP32[1311079];HEAP32[1317922]=-1;r55=0;while(1){r63=r55<<1;r56=(r63<<2)+5271696|0;HEAP32[(r63+3<<2)+5271696>>2]=r56;HEAP32[(r63+2<<2)+5271696>>2]=r56;r56=r55+1|0;if((r56|0)==32){break}else{r55=r56}}r55=r61+8|0;if((r55&7|0)==0){r65=0}else{r65=-r55&7}r55=r59-40-r65|0;HEAP32[1317920]=r61+r65|0;HEAP32[1317917]=r55;HEAP32[(r65+4>>2)+r62]=r55|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1317921]=HEAP32[1311083]}else{r55=5272104,r56=r55>>2;while(1){r66=HEAP32[r56];r67=r55+4|0;r68=HEAP32[r67>>2];if((r61|0)==(r66+r68|0)){r2=213;break}r63=HEAP32[r56+2];if((r63|0)==0){break}else{r55=r63,r56=r55>>2}}do{if(r2==213){if((HEAP32[r56+3]&8|0)!=0){break}r55=r64;if(!(r55>>>0>=r66>>>0&r55>>>0<r61>>>0)){break}HEAP32[r67>>2]=r68+r59|0;r55=HEAP32[1317920];r63=HEAP32[1317917]+r59|0;r53=r55;r57=r55+8|0;if((r57&7|0)==0){r69=0}else{r69=-r57&7}r57=r63-r69|0;HEAP32[1317920]=r53+r69|0;HEAP32[1317917]=r57;HEAP32[r69+(r53+4)>>2]=r57|1;HEAP32[r63+(r53+4)>>2]=40;HEAP32[1317921]=HEAP32[1311083];break L310}}while(0);if(r61>>>0<HEAP32[1317918]>>>0){HEAP32[1317918]=r61}r56=r61+r59|0;r53=5272104;while(1){r70=r53|0;if((HEAP32[r70>>2]|0)==(r56|0)){r2=223;break}r63=HEAP32[r53+8>>2];if((r63|0)==0){break}else{r53=r63}}do{if(r2==223){if((HEAP32[r53+12>>2]&8|0)!=0){break}HEAP32[r70>>2]=r61;r56=r53+4|0;HEAP32[r56>>2]=HEAP32[r56>>2]+r59|0;r56=r61+8|0;if((r56&7|0)==0){r71=0}else{r71=-r56&7}r56=r59+(r61+8)|0;if((r56&7|0)==0){r72=0,r73=r72>>2}else{r72=-r56&7,r73=r72>>2}r56=r61+r72+r59|0;r63=r56;r57=r71+r15|0,r55=r57>>2;r40=r61+r57|0;r57=r40;r39=r56-(r61+r71)-r15|0;HEAP32[(r71+4>>2)+r62]=r15|3;do{if((r63|0)==(HEAP32[1317920]|0)){r54=HEAP32[1317917]+r39|0;HEAP32[1317917]=r54;HEAP32[1317920]=r57;HEAP32[r55+(r62+1)]=r54|1}else{if((r63|0)==(HEAP32[1317919]|0)){r54=HEAP32[1317916]+r39|0;HEAP32[1317916]=r54;HEAP32[1317919]=r57;HEAP32[r55+(r62+1)]=r54|1;HEAP32[(r54>>2)+r62+r55]=r54;break}r54=r59+4|0;r58=HEAP32[(r54>>2)+r62+r73];if((r58&3|0)==1){r52=r58&-8;r51=r58>>>3;L355:do{if(r58>>>0<256){r48=HEAP32[((r72|8)>>2)+r62+r60];r49=HEAP32[r73+(r62+(r60+3))];r5=(r51<<3)+5271696|0;do{if((r48|0)!=(r5|0)){if(r48>>>0<HEAP32[1317918]>>>0){_abort()}if((HEAP32[r48+12>>2]|0)==(r63|0)){break}_abort()}}while(0);if((r49|0)==(r48|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r51^-1);break}do{if((r49|0)==(r5|0)){r74=r49+8|0}else{if(r49>>>0<HEAP32[1317918]>>>0){_abort()}r47=r49+8|0;if((HEAP32[r47>>2]|0)==(r63|0)){r74=r47;break}_abort()}}while(0);HEAP32[r48+12>>2]=r49;HEAP32[r74>>2]=r48}else{r5=r56;r47=HEAP32[((r72|24)>>2)+r62+r60];r46=HEAP32[r73+(r62+(r60+3))];L376:do{if((r46|0)==(r5|0)){r7=r72|16;r41=r61+r54+r7|0;r17=HEAP32[r41>>2];do{if((r17|0)==0){r42=r61+r7+r59|0;r43=HEAP32[r42>>2];if((r43|0)==0){r75=0,r76=r75>>2;break L376}else{r77=r43;r78=r42;break}}else{r77=r17;r78=r41}}while(0);while(1){r41=r77+20|0;r17=HEAP32[r41>>2];if((r17|0)!=0){r77=r17;r78=r41;continue}r41=r77+16|0;r17=HEAP32[r41>>2];if((r17|0)==0){break}else{r77=r17;r78=r41}}if(r78>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r78>>2]=0;r75=r77,r76=r75>>2;break}}else{r41=HEAP32[((r72|8)>>2)+r62+r60];if(r41>>>0<HEAP32[1317918]>>>0){_abort()}r17=r41+12|0;if((HEAP32[r17>>2]|0)!=(r5|0)){_abort()}r7=r46+8|0;if((HEAP32[r7>>2]|0)==(r5|0)){HEAP32[r17>>2]=r46;HEAP32[r7>>2]=r41;r75=r46,r76=r75>>2;break}else{_abort()}}}while(0);if((r47|0)==0){break}r46=r72+(r61+(r59+28))|0;r48=(HEAP32[r46>>2]<<2)+5271960|0;do{if((r5|0)==(HEAP32[r48>>2]|0)){HEAP32[r48>>2]=r75;if((r75|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r46>>2]^-1);break L355}else{if(r47>>>0<HEAP32[1317918]>>>0){_abort()}r49=r47+16|0;if((HEAP32[r49>>2]|0)==(r5|0)){HEAP32[r49>>2]=r75}else{HEAP32[r47+20>>2]=r75}if((r75|0)==0){break L355}}}while(0);if(r75>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r76+6]=r47;r5=r72|16;r46=HEAP32[(r5>>2)+r62+r60];do{if((r46|0)!=0){if(r46>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r76+4]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r46=HEAP32[(r54+r5>>2)+r62];if((r46|0)==0){break}if(r46>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r76+5]=r46;HEAP32[r46+24>>2]=r75;break}}}while(0);r79=r61+(r52|r72)+r59|0;r80=r52+r39|0}else{r79=r63;r80=r39}r54=r79+4|0;HEAP32[r54>>2]=HEAP32[r54>>2]&-2;HEAP32[r55+(r62+1)]=r80|1;HEAP32[(r80>>2)+r62+r55]=r80;r54=r80>>>3;if(r80>>>0<256){r51=r54<<1;r58=(r51<<2)+5271696|0;r46=HEAP32[1317914];r47=1<<r54;do{if((r46&r47|0)==0){HEAP32[1317914]=r46|r47;r81=r58;r82=(r51+2<<2)+5271696|0}else{r54=(r51+2<<2)+5271696|0;r48=HEAP32[r54>>2];if(r48>>>0>=HEAP32[1317918]>>>0){r81=r48;r82=r54;break}_abort()}}while(0);HEAP32[r82>>2]=r57;HEAP32[r81+12>>2]=r57;HEAP32[r55+(r62+2)]=r81;HEAP32[r55+(r62+3)]=r58;break}r51=r40;r47=r80>>>8;do{if((r47|0)==0){r83=0}else{if(r80>>>0>16777215){r83=31;break}r46=(r47+1048320|0)>>>16&8;r52=r47<<r46;r54=(r52+520192|0)>>>16&4;r48=r52<<r54;r52=(r48+245760|0)>>>16&2;r49=14-(r54|r46|r52)+(r48<<r52>>>15)|0;r83=r80>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r83<<2)+5271960|0;HEAP32[r55+(r62+7)]=r83;HEAP32[r55+(r62+5)]=0;HEAP32[r55+(r62+4)]=0;r58=HEAP32[1317915];r49=1<<r83;if((r58&r49|0)==0){HEAP32[1317915]=r58|r49;HEAP32[r47>>2]=r51;HEAP32[r55+(r62+6)]=r47;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}if((r83|0)==31){r84=0}else{r84=25-(r83>>>1)|0}r49=r80<<r84;r58=HEAP32[r47>>2];while(1){if((HEAP32[r58+4>>2]&-8|0)==(r80|0)){break}r85=(r49>>>31<<2)+r58+16|0;r47=HEAP32[r85>>2];if((r47|0)==0){r2=296;break}else{r49=r49<<1;r58=r47}}if(r2==296){if(r85>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r85>>2]=r51;HEAP32[r55+(r62+6)]=r58;HEAP32[r55+(r62+3)]=r51;HEAP32[r55+(r62+2)]=r51;break}}r49=r58+8|0;r47=HEAP32[r49>>2];r52=HEAP32[1317918];if(r58>>>0<r52>>>0){_abort()}if(r47>>>0<r52>>>0){_abort()}else{HEAP32[r47+12>>2]=r51;HEAP32[r49>>2]=r51;HEAP32[r55+(r62+2)]=r47;HEAP32[r55+(r62+3)]=r58;HEAP32[r55+(r62+6)]=0;break}}}while(0);r14=r61+(r71|8)|0;return r14}}while(0);r53=r64;r55=5272104,r40=r55>>2;while(1){r86=HEAP32[r40];if(r86>>>0<=r53>>>0){r87=HEAP32[r40+1];r88=r86+r87|0;if(r88>>>0>r53>>>0){break}}r55=HEAP32[r40+2],r40=r55>>2}r55=r86+(r87-39)|0;if((r55&7|0)==0){r89=0}else{r89=-r55&7}r55=r86+(r87-47)+r89|0;r40=r55>>>0<(r64+16|0)>>>0?r53:r55;r55=r40+8|0,r57=r55>>2;r39=r61+8|0;if((r39&7|0)==0){r90=0}else{r90=-r39&7}r39=r59-40-r90|0;HEAP32[1317920]=r61+r90|0;HEAP32[1317917]=r39;HEAP32[(r90+4>>2)+r62]=r39|1;HEAP32[(r59-36>>2)+r62]=40;HEAP32[1317921]=HEAP32[1311083];HEAP32[r40+4>>2]=27;HEAP32[r57]=HEAP32[1318026];HEAP32[r57+1]=HEAP32[1318027];HEAP32[r57+2]=HEAP32[1318028];HEAP32[r57+3]=HEAP32[1318029];HEAP32[1318026]=r61;HEAP32[1318027]=r59;HEAP32[1318029]=0;HEAP32[1318028]=r55;r55=r40+28|0;HEAP32[r55>>2]=7;L474:do{if((r40+32|0)>>>0<r88>>>0){r57=r55;while(1){r39=r57+4|0;HEAP32[r39>>2]=7;if((r57+8|0)>>>0<r88>>>0){r57=r39}else{break L474}}}}while(0);if((r40|0)==(r53|0)){break}r55=r40-r64|0;r57=r55+(r53+4)|0;HEAP32[r57>>2]=HEAP32[r57>>2]&-2;HEAP32[r50+1]=r55|1;HEAP32[r53+r55>>2]=r55;r57=r55>>>3;if(r55>>>0<256){r39=r57<<1;r63=(r39<<2)+5271696|0;r56=HEAP32[1317914];r47=1<<r57;do{if((r56&r47|0)==0){HEAP32[1317914]=r56|r47;r91=r63;r92=(r39+2<<2)+5271696|0}else{r57=(r39+2<<2)+5271696|0;r49=HEAP32[r57>>2];if(r49>>>0>=HEAP32[1317918]>>>0){r91=r49;r92=r57;break}_abort()}}while(0);HEAP32[r92>>2]=r64;HEAP32[r91+12>>2]=r64;HEAP32[r50+2]=r91;HEAP32[r50+3]=r63;break}r39=r64;r47=r55>>>8;do{if((r47|0)==0){r93=0}else{if(r55>>>0>16777215){r93=31;break}r56=(r47+1048320|0)>>>16&8;r53=r47<<r56;r40=(r53+520192|0)>>>16&4;r57=r53<<r40;r53=(r57+245760|0)>>>16&2;r49=14-(r40|r56|r53)+(r57<<r53>>>15)|0;r93=r55>>>((r49+7|0)>>>0)&1|r49<<1}}while(0);r47=(r93<<2)+5271960|0;HEAP32[r50+7]=r93;HEAP32[r50+5]=0;HEAP32[r50+4]=0;r63=HEAP32[1317915];r49=1<<r93;if((r63&r49|0)==0){HEAP32[1317915]=r63|r49;HEAP32[r47>>2]=r39;HEAP32[r50+6]=r47;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}if((r93|0)==31){r94=0}else{r94=25-(r93>>>1)|0}r49=r55<<r94;r63=HEAP32[r47>>2];while(1){if((HEAP32[r63+4>>2]&-8|0)==(r55|0)){break}r95=(r49>>>31<<2)+r63+16|0;r47=HEAP32[r95>>2];if((r47|0)==0){r2=331;break}else{r49=r49<<1;r63=r47}}if(r2==331){if(r95>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r95>>2]=r39;HEAP32[r50+6]=r63;HEAP32[r50+3]=r64;HEAP32[r50+2]=r64;break}}r49=r63+8|0;r55=HEAP32[r49>>2];r47=HEAP32[1317918];if(r63>>>0<r47>>>0){_abort()}if(r55>>>0<r47>>>0){_abort()}else{HEAP32[r55+12>>2]=r39;HEAP32[r49>>2]=r39;HEAP32[r50+2]=r55;HEAP32[r50+3]=r63;HEAP32[r50+6]=0;break}}}while(0);r50=HEAP32[1317917];if(r50>>>0<=r15>>>0){break}r64=r50-r15|0;HEAP32[1317917]=r64;r50=HEAP32[1317920];r55=r50;HEAP32[1317920]=r55+r15|0;HEAP32[(r55+4>>2)+r16]=r64|1;HEAP32[r50+4>>2]=r15|3;r14=r50+8|0;return r14}}while(0);HEAP32[___errno_location()>>2]=12;r14=0;return r14}function _free(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46;r2=r1>>2;r3=0;if((r1|0)==0){return}r4=r1-8|0;r5=r4;r6=HEAP32[1317918];if(r4>>>0<r6>>>0){_abort()}r7=HEAP32[r1-4>>2];r8=r7&3;if((r8|0)==1){_abort()}r9=r7&-8,r10=r9>>2;r11=r1+(r9-8)|0;r12=r11;L527:do{if((r7&1|0)==0){r13=HEAP32[r4>>2];if((r8|0)==0){return}r14=-8-r13|0,r15=r14>>2;r16=r1+r14|0;r17=r16;r18=r13+r9|0;if(r16>>>0<r6>>>0){_abort()}if((r17|0)==(HEAP32[1317919]|0)){r19=(r1+(r9-4)|0)>>2;if((HEAP32[r19]&3|0)!=3){r20=r17,r21=r20>>2;r22=r18;break}HEAP32[1317916]=r18;HEAP32[r19]=HEAP32[r19]&-2;HEAP32[r15+(r2+1)]=r18|1;HEAP32[r11>>2]=r18;return}r19=r13>>>3;if(r13>>>0<256){r13=HEAP32[r15+(r2+2)];r23=HEAP32[r15+(r2+3)];r24=(r19<<3)+5271696|0;do{if((r13|0)!=(r24|0)){if(r13>>>0<r6>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r17|0)){break}_abort()}}while(0);if((r23|0)==(r13|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r19^-1);r20=r17,r21=r20>>2;r22=r18;break}do{if((r23|0)==(r24|0)){r25=r23+8|0}else{if(r23>>>0<r6>>>0){_abort()}r26=r23+8|0;if((HEAP32[r26>>2]|0)==(r17|0)){r25=r26;break}_abort()}}while(0);HEAP32[r13+12>>2]=r23;HEAP32[r25>>2]=r13;r20=r17,r21=r20>>2;r22=r18;break}r24=r16;r19=HEAP32[r15+(r2+6)];r26=HEAP32[r15+(r2+3)];L561:do{if((r26|0)==(r24|0)){r27=r14+(r1+20)|0;r28=HEAP32[r27>>2];do{if((r28|0)==0){r29=r14+(r1+16)|0;r30=HEAP32[r29>>2];if((r30|0)==0){r31=0,r32=r31>>2;break L561}else{r33=r30;r34=r29;break}}else{r33=r28;r34=r27}}while(0);while(1){r27=r33+20|0;r28=HEAP32[r27>>2];if((r28|0)!=0){r33=r28;r34=r27;continue}r27=r33+16|0;r28=HEAP32[r27>>2];if((r28|0)==0){break}else{r33=r28;r34=r27}}if(r34>>>0<r6>>>0){_abort()}else{HEAP32[r34>>2]=0;r31=r33,r32=r31>>2;break}}else{r27=HEAP32[r15+(r2+2)];if(r27>>>0<r6>>>0){_abort()}r28=r27+12|0;if((HEAP32[r28>>2]|0)!=(r24|0)){_abort()}r29=r26+8|0;if((HEAP32[r29>>2]|0)==(r24|0)){HEAP32[r28>>2]=r26;HEAP32[r29>>2]=r27;r31=r26,r32=r31>>2;break}else{_abort()}}}while(0);if((r19|0)==0){r20=r17,r21=r20>>2;r22=r18;break}r26=r14+(r1+28)|0;r16=(HEAP32[r26>>2]<<2)+5271960|0;do{if((r24|0)==(HEAP32[r16>>2]|0)){HEAP32[r16>>2]=r31;if((r31|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r26>>2]^-1);r20=r17,r21=r20>>2;r22=r18;break L527}else{if(r19>>>0<HEAP32[1317918]>>>0){_abort()}r13=r19+16|0;if((HEAP32[r13>>2]|0)==(r24|0)){HEAP32[r13>>2]=r31}else{HEAP32[r19+20>>2]=r31}if((r31|0)==0){r20=r17,r21=r20>>2;r22=r18;break L527}}}while(0);if(r31>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r32+6]=r19;r24=HEAP32[r15+(r2+4)];do{if((r24|0)!=0){if(r24>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r32+4]=r24;HEAP32[r24+24>>2]=r31;break}}}while(0);r24=HEAP32[r15+(r2+5)];if((r24|0)==0){r20=r17,r21=r20>>2;r22=r18;break}if(r24>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r32+5]=r24;HEAP32[r24+24>>2]=r31;r20=r17,r21=r20>>2;r22=r18;break}}else{r20=r5,r21=r20>>2;r22=r9}}while(0);r5=r20,r31=r5>>2;if(r5>>>0>=r11>>>0){_abort()}r5=r1+(r9-4)|0;r32=HEAP32[r5>>2];if((r32&1|0)==0){_abort()}do{if((r32&2|0)==0){if((r12|0)==(HEAP32[1317920]|0)){r6=HEAP32[1317917]+r22|0;HEAP32[1317917]=r6;HEAP32[1317920]=r20;HEAP32[r21+1]=r6|1;if((r20|0)==(HEAP32[1317919]|0)){HEAP32[1317919]=0;HEAP32[1317916]=0}if(r6>>>0<=HEAP32[1317921]>>>0){return}_sys_trim(0);return}if((r12|0)==(HEAP32[1317919]|0)){r6=HEAP32[1317916]+r22|0;HEAP32[1317916]=r6;HEAP32[1317919]=r20;HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;return}r6=(r32&-8)+r22|0;r33=r32>>>3;L632:do{if(r32>>>0<256){r34=HEAP32[r2+r10];r25=HEAP32[((r9|4)>>2)+r2];r8=(r33<<3)+5271696|0;do{if((r34|0)!=(r8|0)){if(r34>>>0<HEAP32[1317918]>>>0){_abort()}if((HEAP32[r34+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r25|0)==(r34|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r33^-1);break}do{if((r25|0)==(r8|0)){r35=r25+8|0}else{if(r25>>>0<HEAP32[1317918]>>>0){_abort()}r4=r25+8|0;if((HEAP32[r4>>2]|0)==(r12|0)){r35=r4;break}_abort()}}while(0);HEAP32[r34+12>>2]=r25;HEAP32[r35>>2]=r34}else{r8=r11;r4=HEAP32[r10+(r2+4)];r7=HEAP32[((r9|4)>>2)+r2];L653:do{if((r7|0)==(r8|0)){r24=r9+(r1+12)|0;r19=HEAP32[r24>>2];do{if((r19|0)==0){r26=r9+(r1+8)|0;r16=HEAP32[r26>>2];if((r16|0)==0){r36=0,r37=r36>>2;break L653}else{r38=r16;r39=r26;break}}else{r38=r19;r39=r24}}while(0);while(1){r24=r38+20|0;r19=HEAP32[r24>>2];if((r19|0)!=0){r38=r19;r39=r24;continue}r24=r38+16|0;r19=HEAP32[r24>>2];if((r19|0)==0){break}else{r38=r19;r39=r24}}if(r39>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r39>>2]=0;r36=r38,r37=r36>>2;break}}else{r24=HEAP32[r2+r10];if(r24>>>0<HEAP32[1317918]>>>0){_abort()}r19=r24+12|0;if((HEAP32[r19>>2]|0)!=(r8|0)){_abort()}r26=r7+8|0;if((HEAP32[r26>>2]|0)==(r8|0)){HEAP32[r19>>2]=r7;HEAP32[r26>>2]=r24;r36=r7,r37=r36>>2;break}else{_abort()}}}while(0);if((r4|0)==0){break}r7=r9+(r1+20)|0;r34=(HEAP32[r7>>2]<<2)+5271960|0;do{if((r8|0)==(HEAP32[r34>>2]|0)){HEAP32[r34>>2]=r36;if((r36|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r7>>2]^-1);break L632}else{if(r4>>>0<HEAP32[1317918]>>>0){_abort()}r25=r4+16|0;if((HEAP32[r25>>2]|0)==(r8|0)){HEAP32[r25>>2]=r36}else{HEAP32[r4+20>>2]=r36}if((r36|0)==0){break L632}}}while(0);if(r36>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r37+6]=r4;r8=HEAP32[r10+(r2+2)];do{if((r8|0)!=0){if(r8>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r37+4]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);r8=HEAP32[r10+(r2+3)];if((r8|0)==0){break}if(r8>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r37+5]=r8;HEAP32[r8+24>>2]=r36;break}}}while(0);HEAP32[r21+1]=r6|1;HEAP32[(r6>>2)+r31]=r6;if((r20|0)!=(HEAP32[1317919]|0)){r40=r6;break}HEAP32[1317916]=r6;return}else{HEAP32[r5>>2]=r32&-2;HEAP32[r21+1]=r22|1;HEAP32[(r22>>2)+r31]=r22;r40=r22}}while(0);r22=r40>>>3;if(r40>>>0<256){r31=r22<<1;r32=(r31<<2)+5271696|0;r5=HEAP32[1317914];r36=1<<r22;do{if((r5&r36|0)==0){HEAP32[1317914]=r5|r36;r41=r32;r42=(r31+2<<2)+5271696|0}else{r22=(r31+2<<2)+5271696|0;r37=HEAP32[r22>>2];if(r37>>>0>=HEAP32[1317918]>>>0){r41=r37;r42=r22;break}_abort()}}while(0);HEAP32[r42>>2]=r20;HEAP32[r41+12>>2]=r20;HEAP32[r21+2]=r41;HEAP32[r21+3]=r32;return}r32=r20;r41=r40>>>8;do{if((r41|0)==0){r43=0}else{if(r40>>>0>16777215){r43=31;break}r42=(r41+1048320|0)>>>16&8;r31=r41<<r42;r36=(r31+520192|0)>>>16&4;r5=r31<<r36;r31=(r5+245760|0)>>>16&2;r22=14-(r36|r42|r31)+(r5<<r31>>>15)|0;r43=r40>>>((r22+7|0)>>>0)&1|r22<<1}}while(0);r41=(r43<<2)+5271960|0;HEAP32[r21+7]=r43;HEAP32[r21+5]=0;HEAP32[r21+4]=0;r22=HEAP32[1317915];r31=1<<r43;do{if((r22&r31|0)==0){HEAP32[1317915]=r22|r31;HEAP32[r41>>2]=r32;HEAP32[r21+6]=r41;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20}else{if((r43|0)==31){r44=0}else{r44=25-(r43>>>1)|0}r5=r40<<r44;r42=HEAP32[r41>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r40|0)){break}r45=(r5>>>31<<2)+r42+16|0;r36=HEAP32[r45>>2];if((r36|0)==0){r3=510;break}else{r5=r5<<1;r42=r36}}if(r3==510){if(r45>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r45>>2]=r32;HEAP32[r21+6]=r42;HEAP32[r21+3]=r20;HEAP32[r21+2]=r20;break}}r5=r42+8|0;r6=HEAP32[r5>>2];r36=HEAP32[1317918];if(r42>>>0<r36>>>0){_abort()}if(r6>>>0<r36>>>0){_abort()}else{HEAP32[r6+12>>2]=r32;HEAP32[r5>>2]=r32;HEAP32[r21+2]=r6;HEAP32[r21+3]=r42;HEAP32[r21+6]=0;break}}}while(0);r21=HEAP32[1317922]-1|0;HEAP32[1317922]=r21;if((r21|0)==0){r46=5272112}else{return}while(1){r21=HEAP32[r46>>2];if((r21|0)==0){break}else{r46=r21+8|0}}HEAP32[1317922]=-1;return}function _realloc(r1,r2){var r3,r4,r5,r6;if((r1|0)==0){r3=_malloc(r2);return r3}if(r2>>>0>4294967231){HEAP32[___errno_location()>>2]=12;r3=0;return r3}if(r2>>>0<11){r4=16}else{r4=r2+11&-8}r5=_try_realloc_chunk(r1-8|0,r4);if((r5|0)!=0){r3=r5+8|0;return r3}r5=_malloc(r2);if((r5|0)==0){r3=0;return r3}r4=HEAP32[r1-4>>2];r6=(r4&-8)-((r4&3|0)==0?8:4)|0;_memcpy(r5,r1,r6>>>0<r2>>>0?r6:r2);_free(r1);r3=r5;return r3}function _sys_trim(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;do{if((HEAP32[1311079]|0)==0){r2=_sysconf(8);if((r2-1&r2|0)==0){HEAP32[1311081]=r2;HEAP32[1311080]=r2;HEAP32[1311082]=-1;HEAP32[1311083]=2097152;HEAP32[1311084]=0;HEAP32[1318025]=0;HEAP32[1311079]=_time(0)&-16^1431655768;break}else{_abort()}}}while(0);if(r1>>>0>=4294967232){r3=0;r4=r3&1;return r4}r2=HEAP32[1317920];if((r2|0)==0){r3=0;r4=r3&1;return r4}r5=HEAP32[1317917];do{if(r5>>>0>(r1+40|0)>>>0){r6=HEAP32[1311081];r7=Math.imul(Math.floor(((-40-r1-1+r5+r6|0)>>>0)/(r6>>>0))-1|0,r6);r8=r2;r9=5272104,r10=r9>>2;while(1){r11=HEAP32[r10];if(r11>>>0<=r8>>>0){if((r11+HEAP32[r10+1]|0)>>>0>r8>>>0){r12=r9;break}}r11=HEAP32[r10+2];if((r11|0)==0){r12=0;break}else{r9=r11,r10=r9>>2}}if((HEAP32[r12+12>>2]&8|0)!=0){break}r9=_sbrk(0);r10=(r12+4|0)>>2;if((r9|0)!=(HEAP32[r12>>2]+HEAP32[r10]|0)){break}r8=_sbrk(-(r7>>>0>2147483646?-2147483648-r6|0:r7)|0);r11=_sbrk(0);if(!((r8|0)!=-1&r11>>>0<r9>>>0)){break}r8=r9-r11|0;if((r9|0)==(r11|0)){break}HEAP32[r10]=HEAP32[r10]-r8|0;HEAP32[1318022]=HEAP32[1318022]-r8|0;r10=HEAP32[1317920];r13=HEAP32[1317917]-r8|0;r8=r10;r14=r10+8|0;if((r14&7|0)==0){r15=0}else{r15=-r14&7}r14=r13-r15|0;HEAP32[1317920]=r8+r15|0;HEAP32[1317917]=r14;HEAP32[r15+(r8+4)>>2]=r14|1;HEAP32[r13+(r8+4)>>2]=40;HEAP32[1317921]=HEAP32[1311083];r3=(r9|0)!=(r11|0);r4=r3&1;return r4}}while(0);if(HEAP32[1317917]>>>0<=HEAP32[1317921]>>>0){r3=0;r4=r3&1;return r4}HEAP32[1317921]=-1;r3=0;r4=r3&1;return r4}function _try_realloc_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=(r1+4|0)>>2;r4=HEAP32[r3];r5=r4&-8,r6=r5>>2;r7=r1,r8=r7>>2;r9=r7+r5|0;r10=r9;r11=HEAP32[1317918];if(r7>>>0<r11>>>0){_abort()}r12=r4&3;if(!((r12|0)!=1&r7>>>0<r9>>>0)){_abort()}r13=(r7+(r5|4)|0)>>2;r14=HEAP32[r13];if((r14&1|0)==0){_abort()}if((r12|0)==0){if(r2>>>0<256){r15=0;return r15}do{if(r5>>>0>=(r2+4|0)>>>0){if((r5-r2|0)>>>0>HEAP32[1311081]<<1>>>0){break}else{r15=r1}return r15}}while(0);r15=0;return r15}if(r5>>>0>=r2>>>0){r12=r5-r2|0;if(r12>>>0<=15){r15=r1;return r15}HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|3;HEAP32[r13]=HEAP32[r13]|1;_dispose_chunk(r7+r2|0,r12);r15=r1;return r15}if((r10|0)==(HEAP32[1317920]|0)){r12=HEAP32[1317917]+r5|0;if(r12>>>0<=r2>>>0){r15=0;return r15}r13=r12-r2|0;HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r13|1;HEAP32[1317920]=r7+r2|0;HEAP32[1317917]=r13;r15=r1;return r15}if((r10|0)==(HEAP32[1317919]|0)){r13=HEAP32[1317916]+r5|0;if(r13>>>0<r2>>>0){r15=0;return r15}r12=r13-r2|0;if(r12>>>0>15){HEAP32[r3]=r4&1|r2|2;HEAP32[(r2+4>>2)+r8]=r12|1;HEAP32[(r13>>2)+r8]=r12;r16=r13+(r7+4)|0;HEAP32[r16>>2]=HEAP32[r16>>2]&-2;r17=r7+r2|0;r18=r12}else{HEAP32[r3]=r4&1|r13|2;r4=r13+(r7+4)|0;HEAP32[r4>>2]=HEAP32[r4>>2]|1;r17=0;r18=0}HEAP32[1317916]=r18;HEAP32[1317919]=r17;r15=r1;return r15}if((r14&2|0)!=0){r15=0;return r15}r17=(r14&-8)+r5|0;if(r17>>>0<r2>>>0){r15=0;return r15}r18=r17-r2|0;r4=r14>>>3;L853:do{if(r14>>>0<256){r13=HEAP32[r6+(r8+2)];r12=HEAP32[r6+(r8+3)];r16=(r4<<3)+5271696|0;do{if((r13|0)!=(r16|0)){if(r13>>>0<r11>>>0){_abort()}if((HEAP32[r13+12>>2]|0)==(r10|0)){break}_abort()}}while(0);if((r12|0)==(r13|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r4^-1);break}do{if((r12|0)==(r16|0)){r19=r12+8|0}else{if(r12>>>0<r11>>>0){_abort()}r20=r12+8|0;if((HEAP32[r20>>2]|0)==(r10|0)){r19=r20;break}_abort()}}while(0);HEAP32[r13+12>>2]=r12;HEAP32[r19>>2]=r13}else{r16=r9;r20=HEAP32[r6+(r8+6)];r21=HEAP32[r6+(r8+3)];L874:do{if((r21|0)==(r16|0)){r22=r5+(r7+20)|0;r23=HEAP32[r22>>2];do{if((r23|0)==0){r24=r5+(r7+16)|0;r25=HEAP32[r24>>2];if((r25|0)==0){r26=0,r27=r26>>2;break L874}else{r28=r25;r29=r24;break}}else{r28=r23;r29=r22}}while(0);while(1){r22=r28+20|0;r23=HEAP32[r22>>2];if((r23|0)!=0){r28=r23;r29=r22;continue}r22=r28+16|0;r23=HEAP32[r22>>2];if((r23|0)==0){break}else{r28=r23;r29=r22}}if(r29>>>0<r11>>>0){_abort()}else{HEAP32[r29>>2]=0;r26=r28,r27=r26>>2;break}}else{r22=HEAP32[r6+(r8+2)];if(r22>>>0<r11>>>0){_abort()}r23=r22+12|0;if((HEAP32[r23>>2]|0)!=(r16|0)){_abort()}r24=r21+8|0;if((HEAP32[r24>>2]|0)==(r16|0)){HEAP32[r23>>2]=r21;HEAP32[r24>>2]=r22;r26=r21,r27=r26>>2;break}else{_abort()}}}while(0);if((r20|0)==0){break}r21=r5+(r7+28)|0;r13=(HEAP32[r21>>2]<<2)+5271960|0;do{if((r16|0)==(HEAP32[r13>>2]|0)){HEAP32[r13>>2]=r26;if((r26|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r21>>2]^-1);break L853}else{if(r20>>>0<HEAP32[1317918]>>>0){_abort()}r12=r20+16|0;if((HEAP32[r12>>2]|0)==(r16|0)){HEAP32[r12>>2]=r26}else{HEAP32[r20+20>>2]=r26}if((r26|0)==0){break L853}}}while(0);if(r26>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r27+6]=r20;r16=HEAP32[r6+(r8+4)];do{if((r16|0)!=0){if(r16>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r27+4]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);r16=HEAP32[r6+(r8+5)];if((r16|0)==0){break}if(r16>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r27+5]=r16;HEAP32[r16+24>>2]=r26;break}}}while(0);if(r18>>>0<16){HEAP32[r3]=r17|HEAP32[r3]&1|2;r26=r7+(r17|4)|0;HEAP32[r26>>2]=HEAP32[r26>>2]|1;r15=r1;return r15}else{HEAP32[r3]=HEAP32[r3]&1|r2|2;HEAP32[(r2+4>>2)+r8]=r18|3;r8=r7+(r17|4)|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1;_dispose_chunk(r7+r2|0,r18);r15=r1;return r15}}function _dispose_chunk(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43;r3=r2>>2;r4=0;r5=r1,r6=r5>>2;r7=r5+r2|0;r8=r7;r9=HEAP32[r1+4>>2];L929:do{if((r9&1|0)==0){r10=HEAP32[r1>>2];if((r9&3|0)==0){return}r11=r5+ -r10|0;r12=r11;r13=r10+r2|0;r14=HEAP32[1317918];if(r11>>>0<r14>>>0){_abort()}if((r12|0)==(HEAP32[1317919]|0)){r15=(r2+(r5+4)|0)>>2;if((HEAP32[r15]&3|0)!=3){r16=r12,r17=r16>>2;r18=r13;break}HEAP32[1317916]=r13;HEAP32[r15]=HEAP32[r15]&-2;HEAP32[(4-r10>>2)+r6]=r13|1;HEAP32[r7>>2]=r13;return}r15=r10>>>3;if(r10>>>0<256){r19=HEAP32[(8-r10>>2)+r6];r20=HEAP32[(12-r10>>2)+r6];r21=(r15<<3)+5271696|0;do{if((r19|0)!=(r21|0)){if(r19>>>0<r14>>>0){_abort()}if((HEAP32[r19+12>>2]|0)==(r12|0)){break}_abort()}}while(0);if((r20|0)==(r19|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r15^-1);r16=r12,r17=r16>>2;r18=r13;break}do{if((r20|0)==(r21|0)){r22=r20+8|0}else{if(r20>>>0<r14>>>0){_abort()}r23=r20+8|0;if((HEAP32[r23>>2]|0)==(r12|0)){r22=r23;break}_abort()}}while(0);HEAP32[r19+12>>2]=r20;HEAP32[r22>>2]=r19;r16=r12,r17=r16>>2;r18=r13;break}r21=r11;r15=HEAP32[(24-r10>>2)+r6];r23=HEAP32[(12-r10>>2)+r6];L963:do{if((r23|0)==(r21|0)){r24=16-r10|0;r25=r24+(r5+4)|0;r26=HEAP32[r25>>2];do{if((r26|0)==0){r27=r5+r24|0;r28=HEAP32[r27>>2];if((r28|0)==0){r29=0,r30=r29>>2;break L963}else{r31=r28;r32=r27;break}}else{r31=r26;r32=r25}}while(0);while(1){r25=r31+20|0;r26=HEAP32[r25>>2];if((r26|0)!=0){r31=r26;r32=r25;continue}r25=r31+16|0;r26=HEAP32[r25>>2];if((r26|0)==0){break}else{r31=r26;r32=r25}}if(r32>>>0<r14>>>0){_abort()}else{HEAP32[r32>>2]=0;r29=r31,r30=r29>>2;break}}else{r25=HEAP32[(8-r10>>2)+r6];if(r25>>>0<r14>>>0){_abort()}r26=r25+12|0;if((HEAP32[r26>>2]|0)!=(r21|0)){_abort()}r24=r23+8|0;if((HEAP32[r24>>2]|0)==(r21|0)){HEAP32[r26>>2]=r23;HEAP32[r24>>2]=r25;r29=r23,r30=r29>>2;break}else{_abort()}}}while(0);if((r15|0)==0){r16=r12,r17=r16>>2;r18=r13;break}r23=r5+(28-r10)|0;r14=(HEAP32[r23>>2]<<2)+5271960|0;do{if((r21|0)==(HEAP32[r14>>2]|0)){HEAP32[r14>>2]=r29;if((r29|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r23>>2]^-1);r16=r12,r17=r16>>2;r18=r13;break L929}else{if(r15>>>0<HEAP32[1317918]>>>0){_abort()}r11=r15+16|0;if((HEAP32[r11>>2]|0)==(r21|0)){HEAP32[r11>>2]=r29}else{HEAP32[r15+20>>2]=r29}if((r29|0)==0){r16=r12,r17=r16>>2;r18=r13;break L929}}}while(0);if(r29>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r30+6]=r15;r21=16-r10|0;r23=HEAP32[(r21>>2)+r6];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r30+4]=r23;HEAP32[r23+24>>2]=r29;break}}}while(0);r23=HEAP32[(r21+4>>2)+r6];if((r23|0)==0){r16=r12,r17=r16>>2;r18=r13;break}if(r23>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r30+5]=r23;HEAP32[r23+24>>2]=r29;r16=r12,r17=r16>>2;r18=r13;break}}else{r16=r1,r17=r16>>2;r18=r2}}while(0);r1=HEAP32[1317918];if(r7>>>0<r1>>>0){_abort()}r29=r2+(r5+4)|0;r30=HEAP32[r29>>2];do{if((r30&2|0)==0){if((r8|0)==(HEAP32[1317920]|0)){r31=HEAP32[1317917]+r18|0;HEAP32[1317917]=r31;HEAP32[1317920]=r16;HEAP32[r17+1]=r31|1;if((r16|0)!=(HEAP32[1317919]|0)){return}HEAP32[1317919]=0;HEAP32[1317916]=0;return}if((r8|0)==(HEAP32[1317919]|0)){r31=HEAP32[1317916]+r18|0;HEAP32[1317916]=r31;HEAP32[1317919]=r16;HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;return}r31=(r30&-8)+r18|0;r32=r30>>>3;L1028:do{if(r30>>>0<256){r22=HEAP32[r3+(r6+2)];r9=HEAP32[r3+(r6+3)];r23=(r32<<3)+5271696|0;do{if((r22|0)!=(r23|0)){if(r22>>>0<r1>>>0){_abort()}if((HEAP32[r22+12>>2]|0)==(r8|0)){break}_abort()}}while(0);if((r9|0)==(r22|0)){HEAP32[1317914]=HEAP32[1317914]&(1<<r32^-1);break}do{if((r9|0)==(r23|0)){r33=r9+8|0}else{if(r9>>>0<r1>>>0){_abort()}r10=r9+8|0;if((HEAP32[r10>>2]|0)==(r8|0)){r33=r10;break}_abort()}}while(0);HEAP32[r22+12>>2]=r9;HEAP32[r33>>2]=r22}else{r23=r7;r10=HEAP32[r3+(r6+6)];r15=HEAP32[r3+(r6+3)];L1049:do{if((r15|0)==(r23|0)){r14=r2+(r5+20)|0;r11=HEAP32[r14>>2];do{if((r11|0)==0){r19=r2+(r5+16)|0;r20=HEAP32[r19>>2];if((r20|0)==0){r34=0,r35=r34>>2;break L1049}else{r36=r20;r37=r19;break}}else{r36=r11;r37=r14}}while(0);while(1){r14=r36+20|0;r11=HEAP32[r14>>2];if((r11|0)!=0){r36=r11;r37=r14;continue}r14=r36+16|0;r11=HEAP32[r14>>2];if((r11|0)==0){break}else{r36=r11;r37=r14}}if(r37>>>0<r1>>>0){_abort()}else{HEAP32[r37>>2]=0;r34=r36,r35=r34>>2;break}}else{r14=HEAP32[r3+(r6+2)];if(r14>>>0<r1>>>0){_abort()}r11=r14+12|0;if((HEAP32[r11>>2]|0)!=(r23|0)){_abort()}r19=r15+8|0;if((HEAP32[r19>>2]|0)==(r23|0)){HEAP32[r11>>2]=r15;HEAP32[r19>>2]=r14;r34=r15,r35=r34>>2;break}else{_abort()}}}while(0);if((r10|0)==0){break}r15=r2+(r5+28)|0;r22=(HEAP32[r15>>2]<<2)+5271960|0;do{if((r23|0)==(HEAP32[r22>>2]|0)){HEAP32[r22>>2]=r34;if((r34|0)!=0){break}HEAP32[1317915]=HEAP32[1317915]&(1<<HEAP32[r15>>2]^-1);break L1028}else{if(r10>>>0<HEAP32[1317918]>>>0){_abort()}r9=r10+16|0;if((HEAP32[r9>>2]|0)==(r23|0)){HEAP32[r9>>2]=r34}else{HEAP32[r10+20>>2]=r34}if((r34|0)==0){break L1028}}}while(0);if(r34>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r35+6]=r10;r23=HEAP32[r3+(r6+4)];do{if((r23|0)!=0){if(r23>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r35+4]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);r23=HEAP32[r3+(r6+5)];if((r23|0)==0){break}if(r23>>>0<HEAP32[1317918]>>>0){_abort()}else{HEAP32[r35+5]=r23;HEAP32[r23+24>>2]=r34;break}}}while(0);HEAP32[r17+1]=r31|1;HEAP32[(r31>>2)+r17]=r31;if((r16|0)!=(HEAP32[1317919]|0)){r38=r31;break}HEAP32[1317916]=r31;return}else{HEAP32[r29>>2]=r30&-2;HEAP32[r17+1]=r18|1;HEAP32[(r18>>2)+r17]=r18;r38=r18}}while(0);r18=r38>>>3;if(r38>>>0<256){r30=r18<<1;r29=(r30<<2)+5271696|0;r34=HEAP32[1317914];r35=1<<r18;do{if((r34&r35|0)==0){HEAP32[1317914]=r34|r35;r39=r29;r40=(r30+2<<2)+5271696|0}else{r18=(r30+2<<2)+5271696|0;r6=HEAP32[r18>>2];if(r6>>>0>=HEAP32[1317918]>>>0){r39=r6;r40=r18;break}_abort()}}while(0);HEAP32[r40>>2]=r16;HEAP32[r39+12>>2]=r16;HEAP32[r17+2]=r39;HEAP32[r17+3]=r29;return}r29=r16;r39=r38>>>8;do{if((r39|0)==0){r41=0}else{if(r38>>>0>16777215){r41=31;break}r40=(r39+1048320|0)>>>16&8;r30=r39<<r40;r35=(r30+520192|0)>>>16&4;r34=r30<<r35;r30=(r34+245760|0)>>>16&2;r18=14-(r35|r40|r30)+(r34<<r30>>>15)|0;r41=r38>>>((r18+7|0)>>>0)&1|r18<<1}}while(0);r39=(r41<<2)+5271960|0;HEAP32[r17+7]=r41;HEAP32[r17+5]=0;HEAP32[r17+4]=0;r18=HEAP32[1317915];r30=1<<r41;if((r18&r30|0)==0){HEAP32[1317915]=r18|r30;HEAP32[r39>>2]=r29;HEAP32[r17+6]=r39;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}if((r41|0)==31){r42=0}else{r42=25-(r41>>>1)|0}r41=r38<<r42;r42=HEAP32[r39>>2];while(1){if((HEAP32[r42+4>>2]&-8|0)==(r38|0)){break}r43=(r41>>>31<<2)+r42+16|0;r39=HEAP32[r43>>2];if((r39|0)==0){r4=816;break}else{r41=r41<<1;r42=r39}}if(r4==816){if(r43>>>0<HEAP32[1317918]>>>0){_abort()}HEAP32[r43>>2]=r29;HEAP32[r17+6]=r42;HEAP32[r17+3]=r16;HEAP32[r17+2]=r16;return}r16=r42+8|0;r43=HEAP32[r16>>2];r4=HEAP32[1317918];if(r42>>>0<r4>>>0){_abort()}if(r43>>>0<r4>>>0){_abort()}HEAP32[r43+12>>2]=r29;HEAP32[r16>>2]=r29;HEAP32[r17+2]=r43;HEAP32[r17+3]=r42;HEAP32[r17+6]=0;return}function _i64Add(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1+r3>>>0;r6=r2+r4>>>0;if(r5>>>0<r1>>>0){r6=r6+1>>>0}return tempRet0=r6,r5|0}function _i64Subtract(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r5=r1-r3>>>0;r6=r2-r4>>>0;if(r5>>>0>r1>>>0){r6=r6-1>>>0}return tempRet0=r6,r5|0}function _bitshift64Shl(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2<<r3|(r1&r4<<32-r3)>>>32-r3;return r1<<r3}tempRet0=r1<<r3-32;return 0}function _bitshift64Lshr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=0;return r2>>>r3-32|0}function _bitshift64Ashr(r1,r2,r3){var r4;r1=r1|0;r2=r2|0;r3=r3|0;r4=0;if((r3|0)<32){r4=(1<<r3)-1|0;tempRet0=r2>>r3;return r1>>>r3|(r2&r4)<<32-r3}tempRet0=(r2|0)<0?-1:0;return r2>>r3-32|0}function _llvm_ctlz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[ctlz_i8+(r1>>>24)|0];if((r2|0)<8)return r2|0;r2=HEAP8[ctlz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[ctlz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[ctlz_i8+(r1&255)|0]+24|0}var ctlz_i8=allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"i8",ALLOC_STACK);function _llvm_cttz_i32(r1){var r2;r1=r1|0;r2=0;r2=HEAP8[cttz_i8+(r1&255)|0];if((r2|0)<8)return r2|0;r2=HEAP8[cttz_i8+(r1>>8&255)|0];if((r2|0)<8)return r2+8|0;r2=HEAP8[cttz_i8+(r1>>16&255)|0];if((r2|0)<8)return r2+16|0;return HEAP8[cttz_i8+(r1>>>24)|0]+24|0}var cttz_i8=allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0],"i8",ALLOC_STACK);function ___muldsi3(r1,r2){var r3,r4,r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=0,r4=0,r5=0,r6=0,r7=0,r8=0,r9=0;r3=r1&65535;r4=r2&65535;r5=Math.imul(r4,r3);r6=r1>>>16;r7=(r5>>>16)+Math.imul(r4,r6)|0;r8=r2>>>16;r9=Math.imul(r8,r3);return(tempRet0=(r7>>>16)+Math.imul(r8,r6)+(((r7&65535)+r9|0)>>>16)|0,0|(r7+r9<<16|r5&65535))|0}function ___divdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r5=r2>>31|((r2|0)<0?-1:0)<<1;r6=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r7=r4>>31|((r4|0)<0?-1:0)<<1;r8=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r9=_i64Subtract(r5^r1,r6^r2,r5,r6);r10=tempRet0;r11=_i64Subtract(r7^r3,r8^r4,r7,r8);r12=r7^r5;r13=r8^r6;r14=___udivmoddi4(r9,r10,r11,tempRet0,0)|0;r15=_i64Subtract(r14^r12,tempRet0^r13,r12,r13);return(tempRet0=tempRet0,r15)|0}function ___remdi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0;r15=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r15|0;r6=r2>>31|((r2|0)<0?-1:0)<<1;r7=((r2|0)<0?-1:0)>>31|((r2|0)<0?-1:0)<<1;r8=r4>>31|((r4|0)<0?-1:0)<<1;r9=((r4|0)<0?-1:0)>>31|((r4|0)<0?-1:0)<<1;r10=_i64Subtract(r6^r1,r7^r2,r6,r7);r11=tempRet0;r12=_i64Subtract(r8^r3,r9^r4,r8,r9);___udivmoddi4(r10,r11,r12,tempRet0,r5);r13=_i64Subtract(HEAP32[r5>>2]^r6,HEAP32[r5+4>>2]^r7,r6,r7);r14=tempRet0;STACKTOP=r15;return(tempRet0=r14,r13)|0}function ___muldi3(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0,r7=0,r8=0,r9=0;r5=r1;r6=r3;r7=___muldsi3(r5,r6)|0;r8=tempRet0;r9=Math.imul(r2,r6);return(tempRet0=Math.imul(r4,r5)+r9+r8|r8&0,0|r7&-1)|0}function ___udivdi3(r1,r2,r3,r4){var r5;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0;r5=___udivmoddi4(r1,r2,r3,r4,0)|0;return(tempRet0=tempRet0,r5)|0}function ___uremdi3(r1,r2,r3,r4){var r5,r6;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=0,r6=0;r6=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r6|0;___udivmoddi4(r1,r2,r3,r4,r5);STACKTOP=r6;return(tempRet0=HEAP32[r5+4>>2]|0,HEAP32[r5>>2]|0)|0}function ___udivmoddi4(r1,r2,r3,r4,r5){var r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69;r1=r1|0;r2=r2|0;r3=r3|0;r4=r4|0;r5=r5|0;r6=0,r7=0,r8=0,r9=0,r10=0,r11=0,r12=0,r13=0,r14=0,r15=0,r16=0,r17=0,r18=0,r19=0,r20=0,r21=0,r22=0,r23=0,r24=0,r25=0,r26=0,r27=0,r28=0,r29=0,r30=0,r31=0,r32=0,r33=0,r34=0,r35=0,r36=0,r37=0,r38=0,r39=0,r40=0,r41=0,r42=0,r43=0,r44=0,r45=0,r46=0,r47=0,r48=0,r49=0,r50=0,r51=0,r52=0,r53=0,r54=0,r55=0,r56=0,r57=0,r58=0,r59=0,r60=0,r61=0,r62=0,r63=0,r64=0,r65=0,r66=0,r67=0,r68=0,r69=0;r6=r1;r7=r2;r8=r7;r9=r3;r10=r4;r11=r10;if((r8|0)==0){r12=(r5|0)!=0;if((r11|0)==0){if(r12){HEAP32[r5>>2]=(r6>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r6>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}else{if(!r12){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=r1&-1;HEAP32[r5+4>>2]=r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}}r13=(r11|0)==0;do{if((r9|0)==0){if(r13){if((r5|0)!=0){HEAP32[r5>>2]=(r8>>>0)%(r9>>>0);HEAP32[r5+4>>2]=0}r69=0;r68=(r8>>>0)/(r9>>>0)>>>0;return(tempRet0=r69,r68)|0}if((r6|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0;HEAP32[r5+4>>2]=(r8>>>0)%(r11>>>0)}r69=0;r68=(r8>>>0)/(r11>>>0)>>>0;return(tempRet0=r69,r68)|0}r14=r11-1|0;if((r14&r11|0)==0){if((r5|0)!=0){HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r14&r8|r2&0}r69=0;r68=r8>>>((_llvm_cttz_i32(r11|0)|0)>>>0);return(tempRet0=r69,r68)|0}r15=_llvm_ctlz_i32(r11|0)|0;r16=r15-_llvm_ctlz_i32(r8|0)|0;if(r16>>>0<=30){r17=r16+1|0;r18=31-r16|0;r37=r17;r36=r8<<r18|r6>>>(r17>>>0);r35=r8>>>(r17>>>0);r34=0;r33=r6<<r18;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}else{if(!r13){r28=_llvm_ctlz_i32(r11|0)|0;r29=r28-_llvm_ctlz_i32(r8|0)|0;if(r29>>>0<=31){r30=r29+1|0;r31=31-r29|0;r32=r29-31>>31;r37=r30;r36=r6>>>(r30>>>0)&r32|r8<<r31;r35=r8>>>(r30>>>0)&r32;r34=0;r33=r6<<r31;break}if((r5|0)==0){r69=0;r68=0;return(tempRet0=r69,r68)|0}HEAP32[r5>>2]=0|r1&-1;HEAP32[r5+4>>2]=r7|r2&0;r69=0;r68=0;return(tempRet0=r69,r68)|0}r19=r9-1|0;if((r19&r9|0)!=0){r21=_llvm_ctlz_i32(r9|0)+33|0;r22=r21-_llvm_ctlz_i32(r8|0)|0;r23=64-r22|0;r24=32-r22|0;r25=r24>>31;r26=r22-32|0;r27=r26>>31;r37=r22;r36=r24-1>>31&r8>>>(r26>>>0)|(r8<<r24|r6>>>(r22>>>0))&r27;r35=r27&r8>>>(r22>>>0);r34=r6<<r23&r25;r33=(r8<<r23|r6>>>(r26>>>0))&r25|r6<<r24&r22-33>>31;break}if((r5|0)!=0){HEAP32[r5>>2]=r19&r6;HEAP32[r5+4>>2]=0}if((r9|0)==1){r69=r7|r2&0;r68=0|r1&-1;return(tempRet0=r69,r68)|0}else{r20=_llvm_cttz_i32(r9|0)|0;r69=0|r8>>>(r20>>>0);r68=r8<<32-r20|r6>>>(r20>>>0)|0;return(tempRet0=r69,r68)|0}}}while(0);if((r37|0)==0){r64=r33;r63=r34;r62=r35;r61=r36;r60=0;r59=0}else{r38=0|r3&-1;r39=r10|r4&0;r40=_i64Add(r38,r39,-1,-1);r41=tempRet0;r47=r33;r46=r34;r45=r35;r44=r36;r43=r37;r42=0;while(1){r48=r46>>>31|r47<<1;r49=r42|r46<<1;r50=0|(r44<<1|r47>>>31);r51=r44>>>31|r45<<1|0;_i64Subtract(r40,r41,r50,r51);r52=tempRet0;r53=r52>>31|((r52|0)<0?-1:0)<<1;r54=r53&1;r55=_i64Subtract(r50,r51,r53&r38,(((r52|0)<0?-1:0)>>31|((r52|0)<0?-1:0)<<1)&r39);r56=r55;r57=tempRet0;r58=r43-1|0;if((r58|0)==0){break}else{r47=r48;r46=r49;r45=r57;r44=r56;r43=r58;r42=r54}}r64=r48;r63=r49;r62=r57;r61=r56;r60=0;r59=r54}r65=r63;r66=0;r67=r64|r66;if((r5|0)!=0){HEAP32[r5>>2]=0|r61;HEAP32[r5+4>>2]=r62|0}r69=(0|r65)>>>31|r67<<1|(r66<<1|r65>>>31)&0|r60;r68=(r65<<1|0>>>31)&-2|r59;return(tempRet0=r69,r68)|0}
// EMSCRIPTEN_END_FUNCS
Module["_main"] = _main;
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
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
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
