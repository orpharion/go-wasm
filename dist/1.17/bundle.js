var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
define("1.17/console", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("1.17/require", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.wrap = exports.must = void 0;
    function must(id, t, poly, req) {
        if (!t && req) {
            t = req();
        }
        if (!t && poly) {
            t = poly();
        }
        if (!t) {
            throw new Error(`global.${id} is not available, polyfill required`);
        }
        return t;
    }
    exports.must = must;
    function wrap(id, req) {
        return () => req ? req(id) : undefined;
    }
    exports.wrap = wrap;
    require;
});
define("1.17/crypto", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.require_ = void 0;
    /**
     * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L106-L113
     * @param req
     */
    function require_(req) {
        if (!req)
            return undefined;
        let nodeCrypto_ = req('crypto');
        if (!nodeCrypto_)
            return undefined;
        let nodeCrypto = nodeCrypto_;
        return {
            getRandomValues(b) {
                nodeCrypto.randomFillSync(b);
            }
        };
    }
    exports.require_ = require_;
});
define("1.17/encoding", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.requireTextDecoderConstructor = exports.requireTextEncoderConstructor = void 0;
    function requireTextEncoderConstructor(req) {
        return (!req) ? undefined : req("util").TextEncoder;
    }
    exports.requireTextEncoderConstructor = requireTextEncoderConstructor;
    function requireTextDecoderConstructor(req) {
        return (!req) ? undefined : req("util").TextDecoder;
    }
    exports.requireTextDecoderConstructor = requireTextDecoderConstructor;
});
define("1.17/enosys", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.enosys = void 0;
    function enosys() {
        const err = new Error("not implemented");
        err.code = "ENOSYS";
        return err;
    }
    exports.enosys = enosys;
});
define("1.17/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("1.17/fs", ["require", "exports", "1.17/enosys"], function (require, exports, enosys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Go writes process stdin, stdout, stderr using the fs write commands.
     * Therefore, the full FS must have the process object with it.
     * Process is unused in the reference Go polyfill, as it just writes directly
     * to globalThis.console.log.
     */
    class FS {
        constructor(g) {
            // unused
            this.constants = { O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1 };
            // combined stdout / stderr
            this.outputBuf = "";
            this._global = g;
        }
        writeSync(fd, buf) {
            this.outputBuf += this._global.textDecoder.decode(buf);
            const nl = this.outputBuf.lastIndexOf("\n");
            if (nl != -1) {
                console.log(this.outputBuf.substr(0, nl));
                this.outputBuf = this.outputBuf.substr(nl + 1);
            }
            return buf.length;
        }
        write(fd, buf, offset, length, position, callback) {
            if (offset !== 0 || length !== buf.length || position !== null) {
                callback((0, enosys_1.enosys)());
                return;
            }
            const n = this.writeSync(fd, buf);
            callback(null, n);
        }
        chmod(path, mode, callback) {
            callback((0, enosys_1.enosys)());
        }
        chown(path, uid, gid, callback) {
            callback((0, enosys_1.enosys)());
        }
        close(fd, callback) {
            callback((0, enosys_1.enosys)());
        }
        fchmod(fd, mode, callback) {
            callback((0, enosys_1.enosys)());
        }
        fchown(fd, uid, gid, callback) {
            callback((0, enosys_1.enosys)());
        }
        fstat(fd, callback) {
            callback((0, enosys_1.enosys)());
        }
        fsync(fd, callback) {
            callback(null);
        }
        ftruncate(fd, length, callback) {
            callback((0, enosys_1.enosys)());
        }
        lchown(path, uid, gid, callback) {
            callback((0, enosys_1.enosys)());
        }
        link(path, link, callback) {
            callback((0, enosys_1.enosys)());
        }
        lstat(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        mkdir(path, perm, callback) {
            callback((0, enosys_1.enosys)());
        }
        open(path, flags, mode, callback) {
            callback((0, enosys_1.enosys)());
        }
        read(fd, buffer, offset, length, position, callback) {
            callback((0, enosys_1.enosys)());
        }
        readdir(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        readlink(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        rename(from, to, callback) {
            callback((0, enosys_1.enosys)());
        }
        rmdir(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        stat(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        symlink(path, link, callback) {
            callback((0, enosys_1.enosys)());
        }
        truncate(path, length, callback) {
            callback((0, enosys_1.enosys)());
        }
        unlink(path, callback) {
            callback((0, enosys_1.enosys)());
        }
        utimes(path, atime, mtime, callback) {
            callback((0, enosys_1.enosys)());
        }
    }
    exports.default = FS;
});
define("1.17/process", ["require", "exports", "1.17/enosys"], function (require, exports, enosys_2) {
    "use strict";
    var _StreamWritable_flushTo, _StreamWritable_flushOn, _StreamReadable_buf;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.StdErr = exports.StdOut = exports.StdIn = exports.StreamReadable = exports.StreamWritable = void 0;
    class StreamWritable {
        constructor(fd, flushTo) {
            _StreamWritable_flushTo.set(this, void 0);
            /**
             * Flush on newline.
             * @private
             */
            _StreamWritable_flushOn.set(this, 0x0A);
            this.buf = new Uint8Array();
            this.fd = fd;
            __classPrivateFieldSet(this, _StreamWritable_flushTo, flushTo, "f");
        }
        /**
         * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L50-L55
         * @param chunk
         * @param encoding
         * @param callback
         */
        write(chunk, encoding, callback) {
            let lenO = this.buf.length;
            let buf = new Uint8Array(lenO + chunk.length);
            buf.set(this.buf, 0);
            buf.set(chunk, lenO);
            this.buf = buf;
            const nl = this.buf.lastIndexOf(__classPrivateFieldGet(this, _StreamWritable_flushOn, "f"));
            if (nl != -1 && __classPrivateFieldGet(this, _StreamWritable_flushTo, "f")) {
                __classPrivateFieldGet(this, _StreamWritable_flushTo, "f").call(this, this.buf.slice(0, nl), encoding);
                this.buf = this.buf.slice(nl + 1);
            }
            return true;
        }
    }
    exports.StreamWritable = StreamWritable;
    _StreamWritable_flushTo = new WeakMap(), _StreamWritable_flushOn = new WeakMap();
    class StreamReadable {
        constructor(fd, data) {
            _StreamReadable_buf.set(this, void 0);
            this.fd = fd;
            __classPrivateFieldSet(this, _StreamReadable_buf, data ? data : new Uint8Array(), "f");
        }
        read(size) {
            size = size ? size : __classPrivateFieldGet(this, _StreamReadable_buf, "f").length;
            size = size > __classPrivateFieldGet(this, _StreamReadable_buf, "f").length ? __classPrivateFieldGet(this, _StreamReadable_buf, "f").length : size;
            let out = __classPrivateFieldGet(this, _StreamReadable_buf, "f").slice(0, size);
            __classPrivateFieldSet(this, _StreamReadable_buf, __classPrivateFieldGet(this, _StreamReadable_buf, "f").slice(size + 1), "f");
            return out;
        }
    }
    exports.StreamReadable = StreamReadable;
    _StreamReadable_buf = new WeakMap();
    class StdIn extends StreamReadable {
        constructor(data) {
            super(0, data);
            this.fd = 0;
        }
    }
    exports.StdIn = StdIn;
    class StdOut extends StreamWritable {
        constructor(g, toConsole = true) {
            super(1, toConsole ? (data) => {
                g.console.log(g.textDecoder.decode(data));
            } : undefined);
            this.fd = 1;
            this._global = g;
        }
    }
    exports.StdOut = StdOut;
    class StdErr extends StreamWritable {
        constructor(g, toConsole = true) {
            super(2, toConsole ? (data) => {
                g.console.error(g.textDecoder.decode(data));
            } : undefined);
            this.fd = 2;
            this._global = g;
        }
    }
    exports.StdErr = StdErr;
    class Process {
        constructor(g, pipe = true) {
            this.pid = -1;
            this.ppid = -1;
            this._global = g;
            this.stdin = new StdIn();
            this.stdout = new StdOut(g, pipe);
            this.stderr = new StdErr(g, pipe);
        }
        getuid() {
            return -1;
        }
        getgid() {
            return -1;
        }
        geteuid() {
            return -1;
        }
        getegid() {
            return -1;
        }
        getgroups() {
            throw (0, enosys_2.enosys)();
        }
        umask(mask) {
            throw (0, enosys_2.enosys)();
        }
        cwd() {
            throw (0, enosys_2.enosys)();
        }
        chdir() {
            throw (0, enosys_2.enosys)();
        }
        hrtime() {
            return process.hrtime(); // todo!
        }
    }
    exports.default = Process;
});
define("1.17/performance", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    class Performance {
        constructor(g) {
            this._global = g;
        }
        now() {
            const [sec, nsec] = this._global.process.hrtime();
            return sec * 1000 + nsec / 1000000;
        }
    }
    exports.default = Performance;
});
define("1.17/global", ["require", "exports", "1.17/require", "1.17/fs", "1.17/process", "1.17/crypto", "1.17/performance", "1.17/encoding"], function (require, exports, require_1, fs_1, process_1, crypto_1, performance_1, encoding_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.transfer = exports.fill = void 0;
    // TODO INTEGRATE FS AND PROCESS
    class Global {
        /**
         * Returns a new Global-like taking required properties from the reference Global-like
         * @param from: reference Global-like
         */
        constructor(from) {
            // Required, no polyfill
            this.Object = Object;
            this.Array = Array;
            this.Uint8Array = Uint8Array;
            this.Headers = Headers;
            this.Date = Date;
            this.console = console;
            const fill = transfer(from, this);
            // this below is mostly to make typescript happy.
            this.TextDecoder = fill.TextDecoder;
            this.TextEncoder = fill.TextEncoder;
            this.textDecoder = new this.TextDecoder('utf-8');
            this.textEncoder = new this.TextEncoder();
            this.fs = fill.fs;
            this.process = fill.process;
            this.crypto = fill.crypto;
            this.performance = fill.performance;
        }
    }
    exports.default = Global;
    /**
     * Fill an existing partial Global-like with the required properties, mutating in place.
     * @param partial: partial Global-like
     */
    function fill(partial) {
        return transfer(partial, partial);
    }
    exports.fill = fill;
    /**
     * Transfer properties from the partial Global-like onto the target, mutating it
     * and poly-filling as required.
     * @param partial: partial Global-like
     * @param onto:
     * @private
     */
    function transfer(partial, onto) {
        if (!onto.Object)
            onto.Object = partial.Object;
        if (!onto.Array)
            onto.Array = partial.Array;
        if (!onto.Uint8Array)
            onto.Uint8Array = partial.Uint8Array;
        if (!onto.Headers)
            onto.Headers = partial.Headers;
        if (!onto.Date)
            onto.Date = partial.Date;
        if (!onto.console)
            onto.console = partial.console;
        // only required and Requireable.
        if (!onto.TextEncoder) {
            onto.TextEncoder = (0, require_1.must)("TextEncoder", partial.TextEncoder, undefined, () => (0, encoding_1.requireTextEncoderConstructor)(partial.require));
        }
        if (!onto.TextDecoder) {
            onto.TextDecoder = (0, require_1.must)("TextDecoder", partial.TextDecoder, undefined, () => (0, encoding_1.requireTextDecoderConstructor)(partial.require));
        }
        if (!onto.textDecoder)
            onto.textDecoder = (0, require_1.must)("textDecoder", partial.textDecoder, () => new onto.TextDecoder('utf-8'));
        if (!onto.textEncoder)
            onto.textEncoder = (0, require_1.must)("textEncoder", partial.textEncoder, () => new onto.TextEncoder());
        if (!onto.fs)
            onto.fs = (0, require_1.must)("fs", partial.fs, () => new fs_1.default(onto), (0, require_1.wrap)("fs", partial.require));
        if (!onto.process)
            onto.process = (0, require_1.must)("process", partial.process, () => new process_1.default(onto, true));
        if (!onto.crypto)
            onto.crypto = (0, require_1.must)("crypto", partial.crypto, undefined, () => (0, crypto_1.require_)(partial.require));
        if (!onto.performance)
            onto.performance = (0, require_1.must)("performance", partial.performance, () => new performance_1.default(onto));
        return onto;
    }
    exports.transfer = transfer;
});
define("1.17/webAssembly/instance", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("1.17/values", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("1.17/webAssembly/importObjectGo", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L285
     */
    function newImportObject(go, g) {
        return {
            go: {
                // func wasmExit(code int32)
                "runtime.wasmExit"(sp) {
                    sp >>>= 0;
                    const code = go.mem.getInt32(sp + 8, true);
                    go.exited = true;
                    go._inst = {};
                    go._values = [];
                    go._goRefCounts = [];
                    go._ids = new Map([]);
                    go._idPool = [];
                    go.exit(code);
                },
                // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
                "runtime.wasmWrite"(sp) {
                    sp >>>= 0;
                    const fd = go.getInt64(sp + 8);
                    const p = go.getInt64(sp + 16);
                    const n = go.mem.getInt32(sp + 24, true);
                    g.fs.writeSync(fd, new Uint8Array(go._inst.exports.mem.buffer, p, n));
                },
                // func resetMemoryDataView()
                "runtime.resetMemoryDataView"(sp) {
                    sp >>>= 0;
                    go.mem = new DataView(go._inst.exports.mem.buffer);
                },
                // func nanotime1() int64
                "runtime.nanotime1"(sp) {
                    sp >>>= 0;
                    go.setInt64(sp + 8, (go.timeOrigin + performance.now()) * 1000000);
                },
                // func walltime() (sec int64, nsec int32)
                "runtime.walltime"(sp) {
                    sp >>>= 0;
                    const msec = (new Date).getTime();
                    go.setInt64(sp + 8, msec / 1000);
                    go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
                },
                // It appears that this is still necessary
                // func walltime() (sec int64, nsec int32)
                "runtime.walltime1"(sp) {
                    sp >>>= 0;
                    const msec = (new Date).getTime();
                    go.setInt64(sp + 8, msec / 1000);
                    go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
                },
                // func scheduleTimeoutEvent(delay int64) int32
                "runtime.scheduleTimeoutEvent"(sp) {
                    sp >>>= 0;
                    const id = go._nextCallbackTimeoutID;
                    go._nextCallbackTimeoutID++;
                    go._scheduledTimeouts.set(id, setTimeout(() => {
                        go._resume();
                        while (go._scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            go._resume();
                        }
                    }, go.getInt64(sp + 8) + 1));
                    go.mem.setInt32(sp + 16, id, true);
                },
                // func clearTimeoutEvent(id int32)
                "runtime.clearTimeoutEvent"(sp) {
                    sp >>>= 0;
                    const id = go.mem.getInt32(sp + 8, true);
                    clearTimeout(go._scheduledTimeouts.get(id));
                    go._scheduledTimeouts.delete(id);
                },
                // func getRandomData(r []byte)
                "runtime.getRandomData"(sp) {
                    sp >>>= 0;
                    crypto.getRandomValues(go.loadSlice(sp + 8));
                },
                // func finalizeRef(v ref)
                "syscall/js.finalizeRef"(sp) {
                    sp >>>= 0;
                    const id = go.mem.getUint32(sp + 8, true);
                    go._goRefCounts[id]--;
                    if (go._goRefCounts[id] === 0) {
                        const v = go._values[id];
                        go._values[id] = null;
                        go._ids.delete(v);
                        go._idPool.push(id);
                    }
                },
                // func stringVal(value string) ref
                "syscall/js.stringVal"(sp) {
                    sp >>>= 0;
                    go.storeValue(sp + 24, go.loadString(sp + 8));
                },
                // func valueGet(v ref, p string) ref
                "syscall/js.valueGet"(sp) {
                    sp >>>= 0;
                    const result = Reflect.get(go.loadValue(sp + 8), go.loadString(sp + 16));
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 32, result);
                },
                // func valueSet(v ref, p string, x ref)
                "syscall/js.valueSet"(sp) {
                    sp >>>= 0;
                    Reflect.set(go.loadValue(sp + 8), go.loadString(sp + 16), go.loadValue(sp + 32));
                },
                // func valueDelete(v ref, p string)
                "syscall/js.valueDelete"(sp) {
                    sp >>>= 0;
                    Reflect.deleteProperty(go.loadValue(sp + 8), go.loadString(sp + 16));
                },
                // func valueIndex(v ref, i int) ref
                "syscall/js.valueIndex"(sp) {
                    sp >>>= 0;
                    go.storeValue(sp + 24, Reflect.get(go.loadValue(sp + 8), go.getInt64(sp + 16)));
                },
                // valueSetIndex(v ref, i int, x ref)
                "syscall/js.valueSetIndex"(sp) {
                    sp >>>= 0;
                    Reflect.set(go.loadValue(sp + 8), go.getInt64(sp + 16), go.loadValue(sp + 24));
                },
                // func valueCall(v ref, m string, args []ref) (ref, bool)
                "syscall/js.valueCall"(sp) {
                    sp >>>= 0;
                    try {
                        const v = go.loadValue(sp + 8);
                        const m = Reflect.get(v, go.loadString(sp + 16));
                        const args = go.loadSliceOfValues(sp + 32);
                        const result = Reflect.apply(m, v, args);
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 56, result);
                        go.mem.setUint8(sp + 64, 1);
                    }
                    catch (err) {
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 56, err);
                        go.mem.setUint8(sp + 64, 0);
                    }
                },
                // func valueInvoke(v ref, args []ref) (ref, bool)
                "syscall/js.valueInvoke"(sp) {
                    sp >>>= 0;
                    try {
                        const v = go.loadValue(sp + 8);
                        const args = go.loadSliceOfValues(sp + 16);
                        const result = Reflect.apply(v, undefined, args);
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 40, result);
                        go.mem.setUint8(sp + 48, 1);
                    }
                    catch (err) {
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 40, err);
                        go.mem.setUint8(sp + 48, 0);
                    }
                },
                // func valueNew(v ref, args []ref) (ref, bool)
                "syscall/js.valueNew"(sp) {
                    sp >>>= 0;
                    try {
                        const v = go.loadValue(sp + 8);
                        const args = go.loadSliceOfValues(sp + 16);
                        const result = Reflect.construct(v, args);
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 40, result);
                        go.mem.setUint8(sp + 48, 1);
                    }
                    catch (err) {
                        sp = go._inst.exports.getsp() >>> 0; // see comment above
                        go.storeValue(sp + 40, err);
                        go.mem.setUint8(sp + 48, 0);
                    }
                },
                // func valueLength(v ref) int
                "syscall/js.valueLength"(sp) {
                    sp >>>= 0;
                    go.setInt64(sp + 16, parseInt(go.loadValue(sp + 8).length));
                },
                // valuePrepareString(v ref) (ref, int)
                "syscall/js.valuePrepareString"(sp) {
                    sp >>>= 0;
                    const str = g.textEncoder.encode(String(go.loadValue(sp + 8)));
                    go.storeValue(sp + 16, str);
                    go.setInt64(sp + 24, str.length);
                },
                // valueLoadString(v ref, b []byte)
                "syscall/js.valueLoadString"(sp) {
                    sp >>>= 0;
                    const str = go.loadValue(sp + 8);
                    go.loadSlice(sp + 16).set(str);
                },
                // func valueInstanceOf(v ref, t ref) bool
                "syscall/js.valueInstanceOf"(sp) {
                    sp >>>= 0;
                    go.mem.setUint8(sp + 24, (go.loadValue(sp + 8) instanceof go.loadValue(sp + 16)) ? 1 : 0);
                },
                // func copyBytesToGo(dst []byte, src ref) (int, bool)
                "syscall/js.copyBytesToGo"(sp) {
                    sp >>>= 0;
                    const dst = go.loadSlice(sp + 8);
                    const src = go.loadValue(sp + 32);
                    if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                        go.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    const toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    go.setInt64(sp + 40, toCopy.length);
                    go.mem.setUint8(sp + 48, 1);
                },
                // func copyBytesToJS(dst ref, src []byte) (int, bool)
                "syscall/js.copyBytesToJS"(sp) {
                    sp >>>= 0;
                    const dst = go.loadValue(sp + 8);
                    const src = go.loadSlice(sp + 16);
                    if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                        go.mem.setUint8(sp + 48, 0);
                        return;
                    }
                    const toCopy = src.subarray(0, dst.length);
                    dst.set(toCopy);
                    go.setInt64(sp + 40, toCopy.length);
                    go.mem.setUint8(sp + 48, 1);
                },
                "debug"(value) {
                    console.log(value);
                }
            }
        };
    }
    exports.default = newImportObject;
});
define("1.17/go", ["require", "exports", "1.17/webAssembly/importObjectGo"], function (require, exports, importObjectGo_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Multiple instances of this class can exist, each corresponding (roughly)
     * to an isolated process.
     * TODO: move process stuff to process?
     */
    class Go {
        constructor(g) {
            this.env = {};
            this._resolveExitPromise = undefined;
            this._exitPromise = new Promise((resolve) => {
                this._resolveExitPromise = resolve;
            });
            this._pendingEvent = null;
            this._scheduledTimeouts = new Map();
            this._nextCallbackTimeoutID = 1;
            this._values = [];
            this._goRefCounts = [];
            // mapping from JS values to reference ids
            this._ids = new Map([]);
            // unused ids that have been garbage collected
            this._idPool = [];
            // whether the Go program has exited
            this.exited = false;
            this._global = g;
            this.argv = ["js"];
            this.env = {};
            this._exitPromise = new Promise((resolve) => {
                this._resolveExitPromise = resolve;
            });
            this._pendingEvent = null;
            this._scheduledTimeouts = new Map();
            this._nextCallbackTimeoutID = 1;
            this.timeOrigin = Date.now() - performance.now();
            this.importObject = (0, importObjectGo_1.default)(this, g);
            this._inst = {};
            this.mem = {};
        }
        reset() {
            this._values = [
                NaN,
                0,
                null,
                true,
                false,
                this._global,
                this,
            ];
            this._goRefCounts = new Array(this._values.length).fill(Infinity);
            this._ids = new Map([
                [0, 1],
                [null, 2],
                [true, 3],
                [false, 4],
                [this._global, 5],
                [this, 6],
            ]);
            this._idPool = [];
            this.exited = false;
        }
        exit(code) {
            if (code !== 0) {
                console.warn("exit code:", code);
            }
        }
        setInt64(addr, v) {
            this.mem.setUint32(addr + 0, v, true);
            this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
        }
        getInt64(addr) {
            const low = this.mem.getUint32(addr + 0, true);
            const high = this.mem.getInt32(addr + 4, true);
            return low + high * 4294967296;
        }
        loadValue(addr) {
            const f = this.mem.getFloat64(addr, true);
            if (f === 0) {
                return undefined;
            }
            if (!isNaN(f)) {
                return f;
            }
            const id = this.mem.getUint32(addr, true);
            return this._values[id];
        }
        storeValue(addr, v) {
            const nanHead = 0x7FF80000;
            if (typeof v === "number" && v !== 0) {
                if (isNaN(v)) {
                    this.mem.setUint32(addr + 4, nanHead, true);
                    this.mem.setUint32(addr, 0, true);
                    return;
                }
                this.mem.setFloat64(addr, v, true);
                return;
            }
            if (v === undefined) {
                this.mem.setFloat64(addr, 0, true);
                return;
            }
            let id = this._ids.get(v);
            if (id === undefined) {
                id = this._idPool.pop();
                if (id === undefined) {
                    id = this._values.length;
                }
                this._values[id] = v;
                this._goRefCounts[id] = 0;
                this._ids.set(v, id);
            }
            this._goRefCounts[id]++;
            let typeFlag = 0;
            switch (typeof v) {
                case "object":
                    if (v !== null) {
                        typeFlag = 1;
                    }
                    break;
                case "string":
                    typeFlag = 2;
                    break;
                case "symbol":
                    typeFlag = 3;
                    break;
                case "function":
                    typeFlag = 4;
                    break;
            }
            this.mem.setUint32(addr + 4, nanHead | typeFlag, true);
            this.mem.setUint32(addr, id, true);
        }
        loadSlice(addr) {
            const array = this.getInt64(addr + 0);
            const len = this.getInt64(addr + 8);
            return new this._global.Uint8Array(this._inst.exports.mem.buffer, array, len);
        }
        loadSliceOfValues(addr) {
            const array = this.getInt64(addr + 0);
            const len = this.getInt64(addr + 8);
            const a = new Array(len);
            for (let i = 0; i < len; i++) {
                a[i] = this.loadValue(array + i * 8);
            }
            return a;
        }
        loadString(addr) {
            const saddr = this.getInt64(addr + 0);
            const len = this.getInt64(addr + 8);
            return this._global.textDecoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
        }
        async run(instance) {
            if (!(instance instanceof WebAssembly.Instance)) {
                throw new Error("Go.run: WebAssembly.Instance expected");
            }
            this._inst = instance;
            this.mem = new DataView(this._inst.exports.mem.buffer);
            const textEncoder = this._global.textEncoder;
            this.reset();
            // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
            let offset = 4096;
            const strPtr = (str) => {
                const ptr = offset;
                const bytes = textEncoder.encode(str + "\0");
                new this._global.Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);
                offset += bytes.length;
                if (offset % 8 !== 0) {
                    offset += 8 - (offset % 8);
                }
                return ptr;
            };
            const argc = this.argv.length;
            const argvPtrs = [];
            this.argv.forEach((arg) => {
                argvPtrs.push(strPtr(arg));
            });
            argvPtrs.push(0);
            const keys = Object.keys(this.env).sort();
            keys.forEach((key) => {
                argvPtrs.push(strPtr(`${key}=${this.env[key]}`));
            });
            argvPtrs.push(0);
            const argv = offset;
            argvPtrs.forEach((ptr) => {
                this.mem.setUint32(offset, ptr, true);
                this.mem.setUint32(offset + 4, 0, true);
                offset += 8;
            });
            this._inst.exports.run(argc, argv);
            if (this.exited) {
                this._resolveExitPromise();
            }
            await this._exitPromise;
        }
        _resume() {
            if (this.exited) {
                throw new Error("Go program has already exited");
            }
            this._inst.exports.resume();
            if (this.exited) {
                this._resolveExitPromise();
            }
        }
        /**
         * See
         *     https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L51
         *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L588-L595
         *     https://www.typescriptlang.org/docs/handbook/functions.html#this
         */
        _makeFuncWrapper(id) {
            const g = this;
            return function () {
                const event = { id: id, this: this, args: arguments, result: undefined };
                g._pendingEvent = event;
                g._resume();
                return event.result;
            };
        }
    }
    exports.default = Go;
});
define("1.17/new", ["require", "exports", "1.17/go", "1.17/global"], function (require, exports, go_1, global_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    // todo consider add go to global-like.
    /**
     * Create a new Go process runner, and return the (possibly new) global context for it.
     * @param glb: Global onto which to apply, otherwise taken as globalThis
     * @constructor
     */
    function New(glb) {
        const fromGlobal = !glb;
        const glb_ = fromGlobal ? (0, global_1.fill)(globalThis) : new global_1.default(glb);
        return [glb_, new go_1.default(glb_)];
    }
    exports.default = New;
});
define("1.17/fs/browserfs", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FS = void 0;
    /**
     * Go requires Open operations on directories to succeed to read them. I assume for locking during read.
     * Go requires fd >= 0 (as is typical, <= 0 typically denotes error)
     *     see https://github.com/golang/go/blob/master/src/os/file_unix.go#L125
     * BrowserFS starts assigning non-std fd at 100
     *     see https://github.com/jvilk/BrowserFS/blob/master/src/core/FS.ts#L177
     */
    const DIR_FD = 99;
    function wrapCallback(cb) {
        return (e, ...r) => {
            e === undefined ? e = null : e;
            cb(e, ...r);
        };
    }
    let wcb = wrapCallback;
    // this only exists because go calls open on directories, where
    // this isn't possible with browserFS.
    class StatDirDummy {
        constructor() {
            this.size = 512; // assumed
            this.atime = new Date(0);
            this.mtime = new Date(0);
            this.ctime = new Date(0);
            this.mode = 0o664;
            this.blocks = 1; // see size and blksize
            // unsupported by bFS, defaults see https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/core/node_fs_stats.ts
            this.dev = 0;
            this.ino = 0;
            this.nlink = 1;
            this.uid = 0;
            this.gid = 0;
            this.rdev = 0;
            this.blksize = 4096;
            this.birthtime = new Date(0);
            // required for bStat
            this.fileData = null;
            this.atimeMs = this.atime.getTime();
            this.mtimeMs = this.mtime.getTime();
            this.ctimeMs = this.ctime.getTime();
            this.birthtimeMs = this.ctime.getTime();
        }
        isFile() {
            return false;
        }
        isDirectory() {
            return true;
        }
        isBlockDevice() {
            return true;
        }
        isCharacterDevice() {
            return false;
        }
        isSymbolicLink() {
            return false;
        }
        isFIFO() {
            return false;
        }
        isSocket() {
            return false;
        }
        chmod(mode) {
        }
        toBuffer() {
            throw "error";
        }
    }
    /**
     * The filesystem as exposed to GO, matching its signatures.
     * The wrapped filesystem isn't changed, and can be re-used as-is for other applications.
     */
    class FS {
        constructor(originalFS, g) {
            this.constants = {
                O_RDONLY: 0,
                O_WRONLY: 1,
                O_RDWR: 2,
                O_CREAT: 64,
                O_EXCL: 128,
                O_NOCTTY: 256,
                O_TRUNC: 512,
                O_APPEND: 1024,
                O_DIRECTORY: 65536,
                O_NOATIME: 262144,
                O_NOFOLLOW: 131072,
                O_SYNC: 1052672,
                O_DIRECT: 16384,
                O_NONBLOCK: 2048,
            };
            this._wrapped = originalFS;
            this._global = g;
        }
        flagIntToString(flags) {
            var flagStr = 'r';
            let O = this.constants;
            // Convert numeric flags to string flags
            // FIXME: maybe wrong...
            if (flags & O.O_WRONLY) { // 'w'
                flagStr = 'w';
                if (flags & O.O_EXCL) {
                    flagStr = 'wx';
                }
            }
            else if (flags & O.O_RDWR) { // 'r+' or 'w+'
                if (flags & O.O_CREAT && flags & O.O_TRUNC) { // w+
                    if (flags & O.O_EXCL) {
                        flagStr = 'wx+';
                    }
                    else {
                        flagStr = 'w+';
                    }
                }
                else { // r+
                    flagStr = 'r+';
                }
            }
            else if (flags & O.O_APPEND) { // 'a'
                throw "Not implemented";
            }
            return flagStr;
        }
        readFile(filename, cb) {
            this._wrapped.readFile(filename, wcb(cb));
        }
        write(fd, buffer, offset, length, position, cb) {
            if (fd === 1 || fd === 2) {
                if (offset !== 0 || length !== buffer.length || position !== null) {
                    throw new Error("not implemented");
                }
                cb(null, this.writeSync(fd, buffer));
            }
            else {
                // browser buffer has no copy method.
                this._wrapped.write(fd, global.Buffer.from(buffer), offset, length, position, wcb(cb));
            }
        }
        writeFile(filename, data, cb) {
            return this._wrapped.writeFile(filename, data, wcb(cb));
        }
        writeSync(fd, buf) {
            let nl = -1;
            switch (fd) {
                case 1:
                    this._global.process.stdout.write(buf);
                    return buf.length;
                case 2:
                    this._global.process.stderr.write(buf);
                    return buf.length;
                default:
                    return this._wrapped.writeSync(fd, buf, 0, 0, 0);
            }
        }
        chmod(path, mode, cb) {
            this._wrapped.chmod(path, mode, wcb(cb));
        }
        chown(path, uid, gid, cb) {
            this._wrapped.chown(path, uid, gid, wcb(cb));
        }
        // browserFS returns undefined on no error, but go does IsNull check.
        close(fd, cb) {
            this._wrapped.close(fd, (e) => {
                cb(e !== undefined ? e : null);
            });
        }
        fchmod(fd, mode, cb) {
            this._wrapped.fchmod(fd, mode, wcb(cb));
        }
        fchown(fd, uid, gid, cb) {
            this._wrapped.fchown(fd, uid, gid, wcb(cb));
        }
        // See DIR_FD
        fstat(fd, cb) {
            switch (fd) {
                case DIR_FD:
                    cb(null, new StatDirDummy());
                    break;
                default:
                    this._wrapped.fstat(fd, (e, s) => {
                        cb(e === undefined ? null : e, s);
                    });
            }
        }
        fsync(fd, cb) {
            this._wrapped.fsync(fd, wcb(cb));
        }
        ftruncate(fd, length, cb) {
            this._wrapped.ftruncate(fd, length, wcb(cb));
        }
        lchown(path, uid, gid, cb) {
            this._wrapped.lchown(path, uid, gid, wcb(cb));
        }
        link(path, link, cb) {
            this._wrapped.link(path, link, wcb(cb));
        }
        lstat(path, cb) {
            this._wrapped.lstat(path, (e, s) => {
                cb(e === undefined ? null : e, s);
            });
        }
        mkdir(path, perm, cb) {
            this._wrapped.mkdir(path, perm, wcb(cb));
        }
        // browserFS uses string flags, go uses uint flags.
        // See DIR_FD.
        // syscall_js just needs fstat to work and confirm it's a directory. Obviously, race conditions can occur.
        open(path, flags, mode, cb) {
            let flagStr = this.flagIntToString(flags);
            this._wrapped.stat(path, (e, s) => {
                if (e || s?.isFile()) {
                    this._wrapped.open(path, flagStr, mode, wcb(cb));
                }
                else if (s?.isDirectory()) {
                    cb(null, DIR_FD);
                }
                else {
                    throw "invalid stat";
                }
            });
        }
        read(fd, buffer, offset, length, position, cb) {
            switch (fd) {
                case 0:
                    const in_ = process.stdin.read();
                    buffer.set(in_);
                    cb(null, in_.length);
                    return;
                default:
                    const buf = Buffer.from(buffer);
                    this._wrapped.read(fd, buf, offset, length, position, (e, n) => {
                        buffer.set(buf, 0);
                        cb(e === undefined ? null : e, n);
                    });
            }
        }
        readdir(path, cb) {
            this._wrapped.readdir(path, wcb(cb));
        }
        readlink(path, cb) {
            this._wrapped.readlink(path, wcb(cb));
        }
        rename(from, to, cb) {
            this._wrapped.rename(from, to, wcb(cb));
        }
        rmdir(path, cb) {
            this._wrapped.rmdir(path, wcb(cb));
        }
        stat(path, cb) {
            this._wrapped.stat(path, (e, s) => {
                cb(e === undefined ? null : e, s);
            });
        }
        symlink(path, link, cb) {
            this._wrapped.symlink(path, link, wcb(cb));
        }
        truncate(path, length, cb) {
            this._wrapped.truncate(path, length, wcb(cb));
        }
        unlink(path, cb) {
            this._wrapped.unlink(path, wcb(cb));
        }
        utimes(path, atime, mtime, cb) {
            this._wrapped.utimes(path, atime, mtime, wcb(cb));
        }
    }
    exports.FS = FS;
});
define("1.17/webAssembly/instantiateStreaming", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * WebAssembly.instantiateStreaming polyfill.
     * @constructor
     */
    async function InstantiateStreaming(resp, importObject) {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    }
    exports.default = InstantiateStreaming;
});
