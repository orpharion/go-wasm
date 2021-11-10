import {IGo} from '../go'
import {IInstance} from './instance'
import {ITextEncoder} from '../encoding'
import {IFileSystem} from "../fs";

type StackPointer = number
type SP = StackPointer

export interface IImportObjectGo {
    "runtime.wasmExit"(sp: SP): void

    "runtime.wasmWrite"(sp: SP): void

    "runtime.resetMemoryDataView"(sp: SP): void

    "runtime.nanotime1"(sp: SP): void

    "runtime.walltime"(sp: SP): void

    "runtime.walltime1"(sp: SP): void

    "runtime.scheduleTimeoutEvent"(sp: SP): void

    "runtime.clearTimeoutEvent"(sp: SP): void

    "runtime.getRandomData"(sp: SP): void

    "syscall/js.finalizeRef"(sp: SP): void

    "syscall/js.stringVal"(sp: SP): void

    "syscall/js.stringVal"(sp: SP): void

    "syscall/js.valueGet"(sp: SP): void

    "syscall/js.valueSet"(sp: SP): void

    "syscall/js.valueDelete"(sp: SP): void

    "syscall/js.valueIndex"(sp: SP): void

    "syscall/js.valueSetIndex"(sp: SP): void

    "syscall/js.valueCall"(sp: SP): void

    "syscall/js.valueInvoke"(sp: SP): void

    "syscall/js.valueNew"(sp: SP): void

    "syscall/js.valueLength"(sp: SP): void

    "syscall/js.valuePrepareString"(sp: SP): void

    "syscall/js.valueLoadString"(sp: SP): void

    "syscall/js.valueInstanceOf"(sp: SP): void

    "syscall/js.copyBytesToGo"(sp: SP): void

    "syscall/js.copyBytesToJS"(sp: SP): void

    "debug"(value: any): void
}

type IGlobalIn = {
    textEncoder: ITextEncoder,
    fs: IFileSystem,
    go: IGo,
}

/**
 * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L285
 */
export default function newImportObject<G extends IGlobalIn>(
    global: G
): { go: IImportObjectGo } {
    return {
        go: {
            // func wasmExit(code int32)
            "runtime.wasmExit"(sp: SP) {
                sp >>>= 0;
                const code = global.go.mem.getInt32(sp + 8, true);
                console.log("exiting with code", code)
                global.go.exited = true;
                global.go._inst = {} as IInstance;
                global.go._values = [];
                global.go._goRefCounts = [];
                global.go._ids = new Map([]);
                global.go._idPool = [];
                // clear remaining timeouts. One always lingers, it seems.
                console.log("scheduledTimeouts remaining", (global.go as any)._scheduledTimeouts.length);
                (global.go as any)._scheduledTimeouts.forEach((v: number, k: any) => {
                    clearTimeout(v as number);
                    (global.go as any)._scheduledTimeouts.delete(k)
                })
                global.go.exit(code);
            },

            // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
            "runtime.wasmWrite"(sp: SP) {
                sp >>>= 0;
                const fd = global.go.getInt64(sp + 8);
                const p = global.go.getInt64(sp + 16);
                const n = global.go.mem.getInt32(sp + 24, true);
                global.fs.writeSync(fd, new Uint8Array(global.go._inst.exports.mem.buffer, p, n));
            },

            // func resetMemoryDataView()
            "runtime.resetMemoryDataView"(sp: SP) {
                sp >>>= 0;
                global.go.mem = new DataView(global.go._inst.exports.mem.buffer);
            },

            // func nanotime1() int64
            "runtime.nanotime1"(sp: SP) {
                sp >>>= 0;
                global.go.setInt64(sp + 8, (global.go.timeOrigin + performance.now()) * 1000000);
            },

            // func walltime() (sec int64, nsec int32)
            "runtime.walltime"(sp: SP) {
                sp >>>= 0;
                const msec = (new Date).getTime();
                global.go.setInt64(sp + 8, msec / 1000);
                global.go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
            },

            // It appears that this is still necessary
            // func walltime() (sec int64, nsec int32)
            "runtime.walltime1"(sp: SP) {
                sp >>>= 0;
                const msec = (new Date).getTime();
                global.go.setInt64(sp + 8, msec / 1000);
                global.go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
            },

            // func scheduleTimeoutEvent(delay int64) int32
            "runtime.scheduleTimeoutEvent"(sp: SP) {
                sp >>>= 0;
                const id = global.go._nextCallbackTimeoutID;
                global.go._nextCallbackTimeoutID++;
                global.go._scheduledTimeouts.set(id, setTimeout(
                    () => {
                        global.go._resume();
                        while (global.go._scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            global.go._resume();
                        }
                    },
                    global.go.getInt64(sp + 8) + 1, // setTimeout has been seen to fire up to 1 millisecond early
                ));
                global.go.mem.setInt32(sp + 16, id, true);
            },

            // func clearTimeoutEvent(id int32)
            "runtime.clearTimeoutEvent"(sp: SP) {
                sp >>>= 0;
                const id = global.go.mem.getInt32(sp + 8, true);
                clearTimeout(global.go._scheduledTimeouts.get(id));
                global.go._scheduledTimeouts.delete(id);
            },

            // func getRandomData(r []byte)
            "runtime.getRandomData"(sp: SP) {
                sp >>>= 0;
                crypto.getRandomValues(global.go.loadSlice(sp + 8));
            },

            // func finalizeRef(v ref)
            "syscall/js.finalizeRef"(sp: SP) {
                sp >>>= 0;
                const id = global.go.mem.getUint32(sp + 8, true);
                global.go._goRefCounts[id]--;
                if (global.go._goRefCounts[id] === 0) {
                    const v = global.go._values[id];
                    global.go._values[id] = null;
                    global.go._ids.delete(v);
                    global.go._idPool.push(id);
                }
            },

            // func stringVal(value string) ref
            "syscall/js.stringVal"(sp: SP) {
                sp >>>= 0;
                global.go.storeValue(sp + 24, global.go.loadString(sp + 8));
            },

            // func valueGet(v ref, p string) ref
            "syscall/js.valueGet"(sp: SP) {
                sp >>>= 0;
                const result = Reflect.get(global.go.loadValue(sp + 8), global.go.loadString(sp + 16));
                sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                global.go.storeValue(sp + 32, result);
            },

            // func valueSet(v ref, p string, x ref)
            "syscall/js.valueSet"(sp: SP) {
                sp >>>= 0;
                Reflect.set(global.go.loadValue(sp + 8), global.go.loadString(sp + 16), global.go.loadValue(sp + 32));
            },

            // func valueDelete(v ref, p string)
            "syscall/js.valueDelete"(sp: SP) {
                sp >>>= 0;
                Reflect.deleteProperty(global.go.loadValue(sp + 8), global.go.loadString(sp + 16));
            },

            // func valueIndex(v ref, i int) ref
            "syscall/js.valueIndex"(sp: SP) {
                sp >>>= 0;
                global.go.storeValue(sp + 24, Reflect.get(global.go.loadValue(sp + 8), global.go.getInt64(sp + 16)));
            },

            // valueSetIndex(v ref, i int, x ref)
            "syscall/js.valueSetIndex"(sp: SP) {
                sp >>>= 0;
                Reflect.set(global.go.loadValue(sp + 8), global.go.getInt64(sp + 16), global.go.loadValue(sp + 24));
            },

            // func valueCall(v ref, m string, args []ref) (ref, bool)
            "syscall/js.valueCall"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = global.go.loadValue(sp + 8);
                    const m = Reflect.get(v, global.go.loadString(sp + 16));
                    const args = global.go.loadSliceOfValues(sp + 32);
                    const result = Reflect.apply(m, v, args);
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 56, result);
                    global.go.mem.setUint8(sp + 64, 1);
                } catch (err) {
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 56, err);
                    global.go.mem.setUint8(sp + 64, 0);
                }
            },

            // func valueInvoke(v ref, args []ref) (ref, bool)
            "syscall/js.valueInvoke"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = global.go.loadValue(sp + 8);
                    const args = global.go.loadSliceOfValues(sp + 16);
                    const result = Reflect.apply(v, undefined, args);
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 40, result);
                    global.go.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 40, err);
                    global.go.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueNew(v ref, args []ref) (ref, bool)
            "syscall/js.valueNew"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = global.go.loadValue(sp + 8);
                    const args = global.go.loadSliceOfValues(sp + 16);
                    const result = Reflect.construct(v, args);
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 40, result);
                    global.go.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = global.go._inst.exports.getsp() >>> 0; // see comment above
                    global.go.storeValue(sp + 40, err);
                    global.go.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueLength(v ref) int
            "syscall/js.valueLength"(sp: SP) {
                sp >>>= 0;
                global.go.setInt64(sp + 16, parseInt(global.go.loadValue(sp + 8).length));
            },

            // valuePrepareString(v ref) (ref, int)
            "syscall/js.valuePrepareString"(sp: SP) {
                sp >>>= 0;
                const str = global.textEncoder.encode(String(global.go.loadValue(sp + 8)));
                global.go.storeValue(sp + 16, str);
                global.go.setInt64(sp + 24, str.length);
            },

            // valueLoadString(v ref, b []byte)
            "syscall/js.valueLoadString"(sp: SP) {
                sp >>>= 0;
                const str = global.go.loadValue(sp + 8);
                global.go.loadSlice(sp + 16).set(str);
            },

            // func valueInstanceOf(v ref, t ref) bool
            "syscall/js.valueInstanceOf"(sp: SP) {
                sp >>>= 0;
                global.go.mem.setUint8(sp + 24, (global.go.loadValue(sp + 8) instanceof global.go.loadValue(sp + 16)) ? 1 : 0);
            },

            // func copyBytesToGo(dst []byte, src ref) (int, bool)
            "syscall/js.copyBytesToGo"(sp: SP) {
                sp >>>= 0;
                const dst = global.go.loadSlice(sp + 8);
                const src = global.go.loadValue(sp + 32);
                if (!(src instanceof Uint8Array || src instanceof Uint8ClampedArray)) {
                    global.go.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                global.go.setInt64(sp + 40, toCopy.length);
                global.go.mem.setUint8(sp + 48, 1);
            },

            // func copyBytesToJS(dst ref, src []byte) (int, bool)
            "syscall/js.copyBytesToJS"(sp: SP) {
                sp >>>= 0;
                const dst = global.go.loadValue(sp + 8);
                const src = global.go.loadSlice(sp + 16);
                if (!(dst instanceof Uint8Array || dst instanceof Uint8ClampedArray)) {
                    global.go.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                global.go.setInt64(sp + 40, toCopy.length);
                global.go.mem.setUint8(sp + 48, 1);
            },

            "debug"(value: any) {
                console.log(value);
            }
        }
    }
}
