import {uint32} from "./types"
import {IInstance} from "./webAssembly/instance"
import {Values} from './values'
import {default as newImportObject, IImportObjectGo} from './webAssembly/importObjectGo'
import {IGlobal} from "./global";

/**
 * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L71
 * See also builtin Reflect.apply - id specifies value
 */
export interface IEvent {
    id: uint32
    this: any
    args: IArguments
    result?: any
}

export interface IGo {
    // Required by Go

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L51
     */
    _makeFuncWrapper(id: number): () => any

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L72
     */
    _pendingEvent: null | IEvent

    // Required by importObject

    _scheduledTimeouts: Map<number, any> // todo timer
    _nextCallbackTimeoutID: number

    _inst: IInstance
    mem: DataView
    /// JS values that Go currently has references to, indexed by reference id
    _values: Values
    /// number of references that Go has to a JS value, indexed by reference id
    _goRefCounts: number[]
    /// mapping from JS values to reference ids
    _ids: Map<any, number>
    /// unused ids that have been garbage collected
    _idPool: number[]
    // whether the Go program has exited
    exited: boolean
    timeOrigin: number

    exit(code: number): void

    _resume(): void


    setInt64(addr: number, v: number): void

    getInt64(addr: number): number

    loadValue(addr: number): any

    storeValue(addr: number, v: any): void

    loadSlice(addr: number): Uint8Array

    loadSliceOfValues(addr: number): any[]

    loadString(addr: number): string

    /// Process-like
    /// move to process?
    env: { [key: string]: string }
    argv: string[]

    run(inst: IInstance): Promise<void>

    importObject: { go: IImportObjectGo }
}

/**
 * Multiple instances of this class can exist, each corresponding (roughly)
 * to an isolated process.
 * TODO: move process stuff to process?
 */
export default class Go implements IGo {
    _global: IGlobal
    argv: string[]
    env: { [key: string]: string } = {}


    _resolveExitPromise: any = undefined
    _exitPromise = new Promise((resolve) => {
        this._resolveExitPromise = resolve;
    })
    _pendingEvent: null | IEvent = null;
    _scheduledTimeouts = new Map();
    _nextCallbackTimeoutID = 1;

    _inst: IInstance
    mem: DataView
    _values: Values = []
    _goRefCounts: number[] = []
    // mapping from JS values to reference ids
    _ids: Map<any, number> = new Map([])
    // unused ids that have been garbage collected
    _idPool: number[] = []
    // whether the Go program has exited
    exited: boolean = false

    timeOrigin: number

    importObject: { go: IImportObjectGo }

    constructor(
        g: IGlobal,
    ) {
        this._global = g

        this.argv = ["js"];
        this.env = {};
        this._exitPromise = new Promise((resolve) => {
            this._resolveExitPromise = resolve;
        });
        this._pendingEvent = null;
        this._scheduledTimeouts = new Map();
        this._nextCallbackTimeoutID = 1;
        this.timeOrigin = Date.now() - performance.now()
        this.importObject = newImportObject(this, g)
        this._inst = {} as IInstance
        this.mem = {} as DataView
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
        ]
        this._goRefCounts = new Array(this._values.length).fill(Infinity)
        this._ids = new Map<any, number>([
            [0, 1],
            [null, 2],
            [true, 3],
            [false, 4],
            [this._global, 5],
            [this, 6],
        ]);
        this._idPool = []
        this.exited = false

    }

    exit(code: number) {
        if (code !== 0) {
            console.warn("exit code:", code);
        }
    }

    setInt64(addr: number, v: number) {
        this.mem.setUint32(addr + 0, v, true);
        this.mem.setUint32(addr + 4, Math.floor(v / 4294967296), true);
    }

    getInt64(addr: number): number {
        const low = this.mem.getUint32(addr + 0, true);
        const high = this.mem.getInt32(addr + 4, true);
        return low + high * 4294967296;
    }

    loadValue(addr: number) {
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

    storeValue(addr: number, v: any) {
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

    loadSlice(addr: number): Uint8Array {
        const array = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        return new this._global.Uint8Array(this._inst.exports.mem.buffer, array, len);
    }

    loadSliceOfValues(addr: number): any[] {
        const array = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        const a = new Array(len);
        for (let i = 0; i < len; i++) {
            a[i] = this.loadValue(array + i * 8);
        }
        return a;
    }

    loadString(addr: number): string {
        const saddr = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        return this._global.textDecoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
    }

    async run(instance: WebAssembly.Instance) {

        if (!(instance instanceof WebAssembly.Instance)) {
            throw new Error("Go.run: WebAssembly.Instance expected");
        }
        this._inst = instance as IInstance;
        this.mem = new DataView(this._inst.exports.mem.buffer);
        const textEncoder = this._global.textEncoder
        this.reset()

        // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
        let offset = 4096;

        const strPtr = (str: string) => {
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
    _makeFuncWrapper(id: number): () => any {
        const g = this;
        return function (this: IGo) {
            const event = {id: id, this: this, args: arguments, result: undefined};
            g._pendingEvent = event;
            g._resume();
            return event.result;
        };
    }
}

