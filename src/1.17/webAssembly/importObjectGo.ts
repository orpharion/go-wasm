import {IGo} from '../go'
import {IInstance}from './instance'
import {ITextEncoder} from '../encoding'
import {IFS} from "../fs";

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

type IGlobal = {
    textEncoder: ITextEncoder,
    fs: IFS,
}

/**
 * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L285
 */
export default function newImportObject(
    go: IGo, 
    g: IGlobal
): { go: IImportObjectGo } {
    return {
        go: {
            // func wasmExit(code int32)
            "runtime.wasmExit"(sp: SP) {
                sp >>>= 0;
                const code = go.mem.getInt32(sp + 8, true);
                go.exited = true;
                go._inst = {} as IInstance;
                go._values = [];
                go._goRefCounts = [];
                go._ids = new Map([]);
                go._idPool = [];
                go.exit(code);
            },

            // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
            "runtime.wasmWrite"(sp: SP) {
                sp >>>= 0;
                const fd = go.getInt64(sp + 8);
                const p = go.getInt64(sp + 16);
                const n = go.mem.getInt32(sp + 24, true);
                g.fs.writeSync(fd, new Uint8Array(go._inst.exports.mem.buffer, p, n));
            },

            // func resetMemoryDataView()
            "runtime.resetMemoryDataView"(sp: SP) {
                sp >>>= 0;
                go.mem = new DataView(go._inst.exports.mem.buffer);
            },

            // func nanotime1() int64
            "runtime.nanotime1"(sp: SP) {
                sp >>>= 0;
                go.setInt64(sp + 8, (go.timeOrigin + performance.now()) * 1000000);
            },

            // func walltime() (sec int64, nsec int32)
            "runtime.walltime"(sp: SP) {
                sp >>>= 0;
                const msec = (new Date).getTime();
                go.setInt64(sp + 8, msec / 1000);
                go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
            },

            // It appears that this is still necessary
            // func walltime() (sec int64, nsec int32)
            "runtime.walltime1"(sp: SP) {
                sp >>>= 0;
                const msec = (new Date).getTime();
                go.setInt64(sp + 8, msec / 1000);
                go.mem.setInt32(sp + 16, (msec % 1000) * 1000000, true);
            },

            // func scheduleTimeoutEvent(delay int64) int32
            "runtime.scheduleTimeoutEvent"(sp: SP) {
                sp >>>= 0;
                const id = go._nextCallbackTimeoutID;
                go._nextCallbackTimeoutID++;
                go._scheduledTimeouts.set(id, setTimeout(
                    () => {
                        go._resume();
                        while (go._scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            go._resume();
                        }
                    },
                    go.getInt64(sp + 8) + 1, // setTimeout has been seen to fire up to 1 millisecond early
                ));
                go.mem.setInt32(sp + 16, id, true);
            },

            // func clearTimeoutEvent(id int32)
            "runtime.clearTimeoutEvent"(sp: SP) {
                sp >>>= 0;
                const id = go.mem.getInt32(sp + 8, true);
                clearTimeout(go._scheduledTimeouts.get(id));
                go._scheduledTimeouts.delete(id);
            },

            // func getRandomData(r []byte)
            "runtime.getRandomData"(sp: SP) {
                sp >>>= 0;
                crypto.getRandomValues(go.loadSlice(sp + 8));
            },

            // func finalizeRef(v ref)
            "syscall/js.finalizeRef"(sp: SP) {
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
            "syscall/js.stringVal"(sp: SP) {
                sp >>>= 0;
                go.storeValue(sp + 24, go.loadString(sp + 8));
            },

            // func valueGet(v ref, p string) ref
            "syscall/js.valueGet"(sp: SP) {
                sp >>>= 0;
                const result = Reflect.get(go.loadValue(sp + 8), go.loadString(sp + 16));
                sp = go._inst.exports.getsp() >>> 0; // see comment above
                go.storeValue(sp + 32, result);
            },

            // func valueSet(v ref, p string, x ref)
            "syscall/js.valueSet"(sp: SP) {
                sp >>>= 0;
                Reflect.set(go.loadValue(sp + 8), go.loadString(sp + 16), go.loadValue(sp + 32));
            },

            // func valueDelete(v ref, p string)
            "syscall/js.valueDelete"(sp: SP) {
                sp >>>= 0;
                Reflect.deleteProperty(go.loadValue(sp + 8), go.loadString(sp + 16));
            },

            // func valueIndex(v ref, i int) ref
            "syscall/js.valueIndex"(sp: SP) {
                sp >>>= 0;
                go.storeValue(sp + 24, Reflect.get(go.loadValue(sp + 8), go.getInt64(sp + 16)));
            },

            // valueSetIndex(v ref, i int, x ref)
            "syscall/js.valueSetIndex"(sp: SP) {
                sp >>>= 0;
                Reflect.set(go.loadValue(sp + 8), go.getInt64(sp + 16), go.loadValue(sp + 24));
            },

            // func valueCall(v ref, m string, args []ref) (ref, bool)
            "syscall/js.valueCall"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = go.loadValue(sp + 8);
                    const m = Reflect.get(v, go.loadString(sp + 16));
                    const args = go.loadSliceOfValues(sp + 32);
                    const result = Reflect.apply(m, v, args);
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 56, result);
                    go.mem.setUint8(sp + 64, 1);
                } catch (err) {
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 56, err);
                    go.mem.setUint8(sp + 64, 0);
                }
            },

            // func valueInvoke(v ref, args []ref) (ref, bool)
            "syscall/js.valueInvoke"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = go.loadValue(sp + 8);
                    const args = go.loadSliceOfValues(sp + 16);
                    const result = Reflect.apply(v, undefined, args);
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 40, result);
                    go.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 40, err);
                    go.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueNew(v ref, args []ref) (ref, bool)
            "syscall/js.valueNew"(sp: SP) {
                sp >>>= 0;
                try {
                    const v = go.loadValue(sp + 8);
                    const args = go.loadSliceOfValues(sp + 16);
                    const result = Reflect.construct(v, args);
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 40, result);
                    go.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    sp = go._inst.exports.getsp() >>> 0; // see comment above
                    go.storeValue(sp + 40, err);
                    go.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueLength(v ref) int
            "syscall/js.valueLength"(sp: SP) {
                sp >>>= 0;
                go.setInt64(sp + 16, parseInt(go.loadValue(sp + 8).length));
            },

            // valuePrepareString(v ref) (ref, int)
            "syscall/js.valuePrepareString"(sp: SP) {
                sp >>>= 0;
                const str = g.textEncoder.encode(String(go.loadValue(sp + 8)));
                go.storeValue(sp + 16, str);
                go.setInt64(sp + 24, str.length);
            },

            // valueLoadString(v ref, b []byte)
            "syscall/js.valueLoadString"(sp: SP) {
                sp >>>= 0;
                const str = go.loadValue(sp + 8);
                go.loadSlice(sp + 16).set(str);
            },

            // func valueInstanceOf(v ref, t ref) bool
            "syscall/js.valueInstanceOf"(sp: SP) {
                sp >>>= 0;
                go.mem.setUint8(sp + 24, (go.loadValue(sp + 8) instanceof go.loadValue(sp + 16)) ? 1 : 0);
            },

            // func copyBytesToGo(dst []byte, src ref) (int, bool)
            "syscall/js.copyBytesToGo"(sp: SP) {
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
            "syscall/js.copyBytesToJS"(sp: SP) {
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

            "debug"(value: any) {
                console.log(value);
            }
        }
    }
}
