import {int, uint32} from "./types"
import {IInstance} from "./webAssembly/instance"
import {Values} from './go/values'
import {default as newImportObject, IImportObjectGo} from './webAssembly/importObjectGo'
import {ITextDecoder, ITextEncoder} from "./encoding";
import {IFileSystem} from "./fs";
import {IProcess, IStreamDuplex, IStreamReadable} from "./process";

export interface IGlobalIn {
    textDecoder: ITextDecoder
    // importObject
    textEncoder: ITextEncoder
    // importObject
    fs: IFileSystem
    Uint8Array: typeof Uint8Array
    process: IProcess
}

export interface IGlobalOut extends IGlobalIn {
    go: IGo
}

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

export interface IGo extends IProcess {
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

    _resume(): void

    setInt64(addr: number, v: number): void

    getInt64(addr: number): number

    loadValue(addr: number): any

    storeValue(addr: number, v: any): void

    loadSlice(addr: number): Uint8Array

    loadSliceOfValues(addr: number): any[]

    loadString(addr: number): string

    run(inst: IInstance): Promise<void>

    importObject: { go: IImportObjectGo }
}

/**
 * Multiple instances of this class can exist, each corresponding (roughly)
 * to an isolated process.
 * TODO: move process stuff to process?
 */
export class Go<G extends IGlobalIn> implements IGo {
    readonly #global: G
    argv: string[] = ['js']
    chdir(path: string): void { this.#global.process.chdir(path) }
    cwd(): string { return this.#global.process.cwd() }
    env: {[key: string]: string} = {}

    exit(code: int) {
        if (code !== 0) {
            console.warn("exit code:", code);
        }
    }

    geteuid(): int {return this.#global.process.geteuid()}
    getegid(): int { return this.#global.process.getegid() }
    getgroups(): int[] {return this.#global.process.getgroups()}
    getgid(): int { return this.#global.process.getgid() }
    getuid(): int { return this.#global.process.getuid() }
    hrtime(time?: [number, number]): [number, number] {return this.#global.process.hrtime(time)}
    pid: int
    readonly platform: 'js'
    ppid: int
    stdin: IStreamReadable & { fd: 0 }
    stdout: IStreamDuplex & { fd: 1 }
    stderr: IStreamDuplex & { fd: 2 }
    umask(mask: int): int {return this.#global.process.umask(mask)}

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

    constructor(g: G) {
        this.#global = g

        this.pid = g.process.pid
        this.platform = g.process.platform
        this.ppid = g.process.ppid
        this.stdin = g.process.stdin
        this.stdout = g.process.stdout
        this.stderr = g.process.stderr

        this._exitPromise = new Promise((resolve) => {
            this._resolveExitPromise = resolve;
        });
        this._pendingEvent = null;
        this._scheduledTimeouts = new Map();
        this._nextCallbackTimeoutID = 1;
        this.timeOrigin = Date.now() - performance.now()
        this.importObject = newImportObject({...g, go: this})
        this._inst = {} as IInstance
        this.mem = {} as DataView
    }

    reset(instance: IInstance) {
        this._inst = instance;
        this.mem = new DataView(this._inst.exports.mem.buffer);
        this._values = [
            NaN,
            0,
            null,
            true,
            false,
            this.#global,
            this,
        ]
        this._goRefCounts = new Array(this._values.length).fill(Infinity)
        this._ids = new Map<any, number>([
            [0, 1],
            [null, 2],
            [true, 3],
            [false, 4],
            [this.#global, 5],
            [this, 6],
        ]);
        this._idPool = []
        this.exited = false
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
        return new this.#global.Uint8Array(this._inst.exports.mem.buffer, array, len);
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
        return this.#global.textDecoder.decode(new DataView(this._inst.exports.mem.buffer, saddr, len));
    }

    async run(instance: WebAssembly.Instance) {
        if (!(instance instanceof WebAssembly.Instance)) {
            throw new Error("Go.run: WebAssembly.Instance expected");
        }
        this.reset(instance as IInstance)

        const textEncoder = this.#global.textEncoder

        // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
        let offset = 4096;

        const strPtr = (str: string) => {
            const ptr = offset;
            const bytes = textEncoder.encode(str + "\0");
            new this.#global.Uint8Array(this.mem.buffer, offset, bytes.length).set(bytes);
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
        const go = this;
        return function (this: IGo) {
            const event = {id: id, this: this, args: arguments, result: undefined};
            go._pendingEvent = event;
            go._resume();
            return event.result;
        };
    }
}

export default function install<T extends IGlobalIn>(g: T): T & IGlobalOut {
    const g_ = g as T & IGlobalOut
    g_.go = new Go(g)
    return g_
}