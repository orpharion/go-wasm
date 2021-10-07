/// <reference types="node" />
declare module "1.17/console" {
    export type IConsoleWriter = (...data: any[]) => void;
    export interface IConsole {
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L86
         */
        error: IConsoleWriter;
        log: IConsoleWriter;
    }
}
declare module "1.17/require" {
    /**
     * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/globals.d.ts#L234
     */
    export interface IRequire {
        (id: string): any;
    }
    export function must<T>(id: string, t?: T, poly?: () => T, req?: () => T | undefined): T;
    export function wrap<T>(id: string, req?: IRequire): () => T | undefined;
}
declare module "1.17/crypto" {
    /**
     * See https://github.com/golang/go/blob/go1.17/src/crypto/rand/rand_js.go#L16
     */
    import { IRequire } from "1.17/require";
    export interface ICrypto {
        getRandomValues(array: Uint8Array): void;
    }
    /**
     * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L106-L113
     * @param req
     */
    export function require_(req?: IRequire): ICrypto | undefined;
}
declare module "1.17/encoding" {
    import { IRequire } from "1.17/require";
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L144
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L49
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L255
     *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14489
     */
    export interface ITextDecoder {
        decode(input?: BufferSource): string;
    }
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L134
     *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14506
     */
    export interface ITextDecoderConstructor {
        new (label?: string): TextDecoder;
    }
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L143
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L454
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L541
     *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14541
     */
    export interface ITextEncoder {
        encode(input?: string): Uint8Array;
    }
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L127
     *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14548
     */
    export interface ITextEncoderConstructor {
        new (): TextEncoder;
    }
    export function requireTextEncoderConstructor(req?: IRequire): ITextEncoderConstructor | undefined;
    export function requireTextDecoderConstructor(req?: IRequire): ITextDecoderConstructor | undefined;
}
declare module "1.17/enosys" {
    export interface EnoSys extends Error {
        code: string;
    }
    export function enosys(): EnoSys;
}
declare module "1.17/types" {
    export type int = number;
    export type int32 = number;
    export type int64 = number;
    export type uint32 = number;
    export type uint64 = number;
}
declare module "1.17/fs" {
    import { int, int32, int64, uint32, uint64 } from "1.17/types";
    import { ITextDecoder } from "1.17/encoding";
    /**
     * Go expects errors to be present as Error, or null, but NOT undefined.
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L506
     */
    export type ErrorPossible = Error | null;
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L495
     */
    export type Callback = (e: ErrorPossible) => any;
    export type CallbackStat = (e: ErrorPossible, stat?: Stat) => any;
    export type CallbackLength = (e: ErrorPossible, n?: int) => any;
    export type CallbackFd = (e: ErrorPossible, fd?: int) => any;
    export type CallbackDir = (e: ErrorPossible, dir?: string[]) => any;
    export type CallbackDst = (e: ErrorPossible, dst?: string) => any;
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L166
     */
    export interface Stat {
        dev: int64;
        ino: uint64;
        mode: uint32;
        nlink: uint32;
        uid: uint32;
        gid: uint32;
        rdev: int64;
        size: int64;
        blksize: int32;
        blocks: int32;
        atimeMs: int64;
        mtimeMs: int64;
        ctimeMs: int64;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L94
         */
        isDirectory(): boolean;
    }
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go.
     * The base FS interface required by Go. See also IFS.
     */
    export interface IFS {
        /**
         * See
         *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L21
         *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L25-L32
         */
        constants: {
            O_WRONLY: int;
            O_RDWR: int;
            O_CREAT: int;
            O_TRUNC: int;
            O_APPEND: int;
            O_EXCL: int;
        };
        writeSync(fd: int, buf: Uint8Array): int;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L237
         */
        write(fd: int, buf: Uint8Array, offset: int, length: int, position: null | number, cb: CallbackLength): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L237
         */
        chmod(path: string, mode: uint32, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L250
         */
        chown(path: string, uid: uint32, gid: uint32, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L119
         */
        close(fd: int, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L245
         */
        fchmod(fd: int, mode: uint32, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L258
         */
        fchown(fd: int, uid: uint32, gid: uint32, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L212
         */
        fstat(fd: int, cb: CallbackStat): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L371
         */
        fsync(fd: int, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L308
         */
        ftruncate(fd: int, length: int64, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L263
         */
        lchown(path: string, uid: int, gid: int, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L349
         */
        link(path: string, link: string, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L200
         */
        lstat(path: string, cb: CallbackStat): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L131
         */
        mkdir(path: string, perm: uint32, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L59.
         * js flags -> go openmode, js mode -> go perm
         * @param path
         * @param flags
         * @param mode
         * @param cb
         */
        open(path: string, flags: int, mode: int, cb: CallbackFd): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L376
         */
        read(fd: int, buf: Uint8Array, offset: int, length: int, position: null | int, cb: CallbackLength): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L95
         */
        readdir(path: string, cb: CallbackDir): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L337
         */
        readlink(path: string, cb: CallbackDst): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L289
         */
        rename(from: string, to: string, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L289
         */
        rmdir(path: string, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L188
         */
        stat(path: string, cb: CallbackStat): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L360
         */
        symlink(path: string, link: string, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L300
         */
        truncate(path: string, length: int64, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L221
         */
        unlink(path: string, cb: Callback): void;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L276
         */
        utimes(path: string, atime: int64, mtime: int64, cb: Callback): void;
    }
    type IGlobal = {
        textDecoder: ITextDecoder;
    };
    /**
     * Go writes process stdin, stdout, stderr using the fs write commands.
     * Therefore, the full FS must have the process object with it.
     * Process is unused in the reference Go polyfill, as it just writes directly
     * to globalThis.console.log.
     */
    export default class FS implements IFS {
        _global: IGlobal;
        constructor(g: IGlobal);
        constants: {
            O_WRONLY: number;
            O_RDWR: number;
            O_CREAT: number;
            O_TRUNC: number;
            O_APPEND: number;
            O_EXCL: number;
        };
        outputBuf: string;
        writeSync(fd: number, buf: Uint8Array): number;
        write(fd: number, buf: Uint8Array, offset: number, length: number, position: number | null, callback: CallbackLength): void;
        chmod(path: string, mode: number, callback: Callback): void;
        chown(path: string, uid: number, gid: number, callback: Callback): void;
        close(fd: number, callback: Callback): void;
        fchmod(fd: number, mode: number, callback: Callback): void;
        fchown(fd: number, uid: number, gid: number, callback: Callback): void;
        fstat(fd: number, callback: Callback): void;
        fsync(fd: number, callback: Callback): void;
        ftruncate(fd: number, length: number, callback: Callback): void;
        lchown(path: string, uid: number, gid: number, callback: Callback): void;
        link(path: string, link: string, callback: Callback): void;
        lstat(path: string, callback: CallbackStat): void;
        mkdir(path: string, perm: number, callback: Callback): void;
        open(path: string, flags: number, mode: number, callback: Callback): void;
        read(fd: number, buffer: Uint8Array, offset: number, length: number, position: number, callback: Callback): void;
        readdir(path: string, callback: CallbackDir): void;
        readlink(path: string, callback: Callback): void;
        rename(from: string, to: string, callback: Callback): void;
        rmdir(path: string, callback: Callback): void;
        stat(path: string, callback: CallbackStat): void;
        symlink(path: string, link: string, callback: Callback): void;
        truncate(path: string, length: number, callback: Callback): void;
        unlink(path: string, callback: Callback): void;
        utimes(path: string, atime: number, mtime: number, callback: Callback): void;
    }
}
declare module "1.17/process" {
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go
     *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go
     */
    import { int } from "1.17/types";
    import { IConsole, IConsoleWriter } from "1.17/console";
    import { ITextDecoder } from "1.17/encoding";
    export interface IStreamWritable {
        write(chunk: Uint8Array, encoding?: string | null, callback?: (e?: Error | null | undefined) => void): boolean;
    }
    export interface IStreamReadable {
        fd: number;
        read(size?: number): Uint8Array | null;
    }
    export class StreamWritable implements IStreamWritable {
        #private;
        fd: number;
        buf: Uint8Array;
        constructor(fd: number, flushTo?: IConsoleWriter);
        /**
         * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L50-L55
         * @param chunk
         * @param encoding
         * @param callback
         */
        write(chunk: Uint8Array, encoding?: string | null, callback?: (e?: Error | null | undefined) => void): boolean;
    }
    export class StreamReadable implements IStreamReadable {
        #private;
        fd: number;
        constructor(fd: number, data?: Uint8Array);
        read(size?: number): Uint8Array | null;
    }
    export class StdIn extends StreamReadable {
        fd: 0;
        constructor(data?: Uint8Array);
    }
    type IGlobal = {
        textDecoder: ITextDecoder;
        console: IConsole;
    };
    export class StdOut extends StreamWritable {
        fd: 1;
        _global: IGlobal;
        constructor(g: IGlobal, toConsole?: boolean);
    }
    export class StdErr extends StreamWritable {
        fd: 2;
        _global: IGlobal;
        constructor(g: IGlobal, toConsole?: boolean);
    }
    export interface IProcess {
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L292
         */
        getuid(): int;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L296
         */
        getgid(): int;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L300
         */
        geteuid(): int;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L304
         */
        getegid(): number;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L308
         */
        getgroups(): int[];
        pid: number;
        ppid: number;
        stdin: IStreamReadable & {
            fd: 0;
        };
        stdout: IStreamWritable & {
            fd: 1;
        };
        stderr: IStreamWritable & {
            fd: 2;
        };
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L326
         */
        umask(mask: int): int;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L313
         */
        cwd(): string;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L320
         */
        chdir(path: string): void;
        /**
         * Required for global.performance.
         * See
         *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L121
         *     https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts#L114
         */
        hrtime(time?: [number, number]): [number, number];
    }
    export default class Process implements IProcess {
        _global: IGlobal;
        stdin: IStreamReadable & {
            fd: 0;
        };
        stdout: IStreamWritable & {
            fd: 1;
        };
        stderr: IStreamWritable & {
            fd: 2;
        };
        constructor(g: IGlobal, pipe?: boolean);
        getuid(): number;
        getgid(): number;
        geteuid(): number;
        getegid(): number;
        getgroups(): int[];
        pid: number;
        ppid: number;
        umask(mask: int): int;
        cwd(): string;
        chdir(): void;
        hrtime(): [number, number];
    }
}
declare module "1.17/performance" {
    import { IProcess } from "1.17/process";
    export interface IPerformance {
        now(): number;
    }
    type IGlobal = {
        process: IProcess;
    };
    export default class Performance implements IPerformance {
        _global: IGlobal;
        constructor(g: IGlobal);
        now(): number;
    }
}
declare module "1.17/global" {
    import { IRequire } from "1.17/require";
    import { IFS } from "1.17/fs";
    import { IProcess } from "1.17/process";
    import { ICrypto } from "1.17/crypto";
    import { IConsole } from "1.17/console";
    import { IPerformance } from "1.17/performance";
    import { ITextDecoder, ITextDecoderConstructor, ITextEncoder, ITextEncoderConstructor } from "1.17/encoding";
    export interface IGlobal {
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L19
         */
        process: IProcess;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L20
         */
        fs: IFS;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/js.go#L99
         */
        Object: typeof Object;
        Array: typeof Array;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/js.go#L99
         */
        Uint8Array: typeof Uint8Array;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/crypto/rand/rand_js.go#L16
         */
        crypto: ICrypto;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L44
         */
        fetch?: typeof fetch;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L52
         */
        AbortController?: typeof AbortController;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L80
         */
        Headers: typeof Headers;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/time/zoneinfo_js.go#L26
         */
        Date: typeof Date;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L86
         */
        console: IConsole;
        /**
         * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L30
         * Doesn't seem to be used by go internally, or beyond providing polyfills.
         */
        require?: IRequire;
        TextEncoder: ITextEncoderConstructor;
        TextDecoder: ITextDecoderConstructor;
        textDecoder: ITextDecoder;
        textEncoder: ITextEncoder;
        performance: IPerformance;
    }
    export interface IGlobalPartial {
        Object: typeof Object;
        Array: typeof Array;
        Uint8Array: typeof Uint8Array;
        Headers: typeof Headers;
        Date: typeof Date;
        console: IConsole;
        crypto: ICrypto;
        process?: IProcess;
        fs?: IFS;
        fetch?: typeof fetch;
        AbortController?: typeof AbortController;
        require?: IRequire;
        TextEncoder?: ITextEncoderConstructor;
        TextDecoder?: ITextDecoderConstructor;
        textEncoder?: ITextEncoder;
        textDecoder?: ITextDecoder;
        performance?: IPerformance;
    }
    export default class Global implements IGlobal {
        Object: typeof Object;
        Array: typeof Array;
        Uint8Array: typeof Uint8Array;
        Headers: typeof Headers;
        Date: typeof Date;
        console: IConsole;
        require?: IRequire;
        TextEncoder: ITextEncoderConstructor;
        TextDecoder: ITextDecoderConstructor;
        process: IProcess;
        fs: IFS;
        crypto: ICrypto;
        performance: IPerformance;
        textEncoder: ITextEncoder;
        textDecoder: ITextDecoder;
        /**
         * Returns a new Global-like taking required properties from the reference Global-like
         * @param from: reference Global-like
         */
        constructor(from: IGlobalPartial);
    }
    /**
     * Fill an existing partial Global-like with the required properties, mutating in place.
     * @param partial: partial Global-like
     */
    export function fill(partial: IGlobalPartial): IGlobal;
    /**
     * Transfer properties from the partial Global-like onto the target, mutating it
     * and poly-filling as required.
     * @param partial: partial Global-like
     * @param onto:
     * @private
     */
    export function transfer(partial: IGlobalPartial, onto: IGlobal): IGlobal;
}
declare module "1.17/webAssembly/instance" {
    export interface IInstance extends WebAssembly.Instance {
        /**
         * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L380-L386
         */
        exports: {
            resume(): void;
            run(argc: number, argv: number): void;
            getsp(): number;
            /**
             * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L388
             */
            mem: WebAssembly.Memory;
        };
    }
}
declare module "1.17/values" {
    import { IGlobal } from "1.17/global";
    import { IGo } from "1.17/go";
    export type Values = [
        typeof NaN,
        0,
        null,
        true,
        false,
        IGlobal,
        IGo
    ] | [];
}
declare module "1.17/webAssembly/importObjectGo" {
    import { IGo } from "1.17/go";
    import { ITextEncoder } from "1.17/encoding";
    import { IFS } from "1.17/fs";
    type StackPointer = number;
    type SP = StackPointer;
    export interface IImportObjectGo {
        "runtime.wasmExit"(sp: SP): void;
        "runtime.wasmWrite"(sp: SP): void;
        "runtime.resetMemoryDataView"(sp: SP): void;
        "runtime.nanotime1"(sp: SP): void;
        "runtime.walltime"(sp: SP): void;
        "runtime.walltime1"(sp: SP): void;
        "runtime.scheduleTimeoutEvent"(sp: SP): void;
        "runtime.clearTimeoutEvent"(sp: SP): void;
        "runtime.getRandomData"(sp: SP): void;
        "syscall/js.finalizeRef"(sp: SP): void;
        "syscall/js.stringVal"(sp: SP): void;
        "syscall/js.stringVal"(sp: SP): void;
        "syscall/js.valueGet"(sp: SP): void;
        "syscall/js.valueSet"(sp: SP): void;
        "syscall/js.valueDelete"(sp: SP): void;
        "syscall/js.valueIndex"(sp: SP): void;
        "syscall/js.valueSetIndex"(sp: SP): void;
        "syscall/js.valueCall"(sp: SP): void;
        "syscall/js.valueInvoke"(sp: SP): void;
        "syscall/js.valueNew"(sp: SP): void;
        "syscall/js.valueLength"(sp: SP): void;
        "syscall/js.valuePrepareString"(sp: SP): void;
        "syscall/js.valueLoadString"(sp: SP): void;
        "syscall/js.valueInstanceOf"(sp: SP): void;
        "syscall/js.copyBytesToGo"(sp: SP): void;
        "syscall/js.copyBytesToJS"(sp: SP): void;
        "debug"(value: any): void;
    }
    type IGlobal = {
        textEncoder: ITextEncoder;
        fs: IFS;
    };
    /**
     * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L285
     */
    export default function newImportObject(go: IGo, g: IGlobal): {
        go: IImportObjectGo;
    };
}
declare module "1.17/go" {
    import { uint32 } from "1.17/types";
    import { IInstance } from "1.17/webAssembly/instance";
    import { Values } from "1.17/values";
    import { IImportObjectGo } from "1.17/webAssembly/importObjectGo";
    import { IGlobal } from "1.17/global";
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L71
     * See also builtin Reflect.apply - id specifies value
     */
    export interface IEvent {
        id: uint32;
        this: any;
        args: IArguments;
        result?: any;
    }
    export interface IGo {
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L51
         */
        _makeFuncWrapper(id: number): () => any;
        /**
         * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L72
         */
        _pendingEvent: null | IEvent;
        _scheduledTimeouts: Map<number, any>;
        _nextCallbackTimeoutID: number;
        _inst: IInstance;
        mem: DataView;
        _values: Values;
        _goRefCounts: number[];
        _ids: Map<any, number>;
        _idPool: number[];
        exited: boolean;
        timeOrigin: number;
        exit(code: number): void;
        _resume(): void;
        setInt64(addr: number, v: number): void;
        getInt64(addr: number): number;
        loadValue(addr: number): any;
        storeValue(addr: number, v: any): void;
        loadSlice(addr: number): Uint8Array;
        loadSliceOfValues(addr: number): any[];
        loadString(addr: number): string;
        env: {
            [key: string]: string;
        };
        argv: string[];
        run(inst: IInstance): Promise<void>;
    }
    /**
     * Multiple instances of this class can exist, each corresponding (roughly)
     * to an isolated process.
     * TODO: move process stuff to process?
     */
    export default class Go implements IGo {
        _global: IGlobal;
        argv: string[];
        env: {
            [key: string]: string;
        };
        _resolveExitPromise: any;
        _exitPromise: Promise<unknown>;
        _pendingEvent: null | IEvent;
        _scheduledTimeouts: Map<any, any>;
        _nextCallbackTimeoutID: number;
        _inst: IInstance;
        mem: DataView;
        _values: Values;
        _goRefCounts: number[];
        _ids: Map<any, number>;
        _idPool: number[];
        exited: boolean;
        timeOrigin: number;
        importObject: {
            go: IImportObjectGo;
        };
        constructor(g: IGlobal);
        reset(): void;
        exit(code: number): void;
        setInt64(addr: number, v: number): void;
        getInt64(addr: number): number;
        loadValue(addr: number): number | boolean | IGlobal | IGo | null | undefined;
        storeValue(addr: number, v: any): void;
        loadSlice(addr: number): Uint8Array;
        loadSliceOfValues(addr: number): any[];
        loadString(addr: number): string;
        run(instance: WebAssembly.Instance): Promise<void>;
        _resume(): void;
        /**
         * See
         *     https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L51
         *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L588-L595
         *     https://www.typescriptlang.org/docs/handbook/functions.html#this
         */
        _makeFuncWrapper(id: number): () => any;
    }
}
declare module "1.17/new" {
    import { IGo } from "1.17/go";
    import { IGlobal, IGlobalPartial } from "1.17/global";
    /**
     * Create a new Go process runner, and return the (possibly new) global context for it.
     * @param glb: Global onto which to apply, otherwise taken as globalThis
     * @constructor
     */
    export default function New(glb?: IGlobalPartial): [IGlobal, IGo];
}
declare module "1.17/fs/browserfs" {
    import bFS from 'browserfs/dist/node/core/FS';
    import { Callback, CallbackDir, CallbackDst, CallbackFd, CallbackLength, CallbackStat, ErrorPossible, IFS } from "1.17/fs";
    import { int, int64, uint32 } from "1.17/types";
    import { IProcess } from "1.17/process";
    type IGlobal = {
        process: IProcess;
    };
    /**
     * The filesystem as exposed to GO, matching its signatures.
     * The wrapped filesystem isn't changed, and can be re-used as-is for other applications.
     */
    export class FS implements IFS {
        _wrapped: bFS;
        _global: IGlobal;
        constants: {
            O_RDONLY: number;
            O_WRONLY: number;
            O_RDWR: number;
            O_CREAT: number;
            O_EXCL: number;
            O_NOCTTY: number;
            O_TRUNC: number;
            O_APPEND: number;
            O_DIRECTORY: number;
            O_NOATIME: number;
            O_NOFOLLOW: number;
            O_SYNC: number;
            O_DIRECT: number;
            O_NONBLOCK: number;
        };
        constructor(originalFS: bFS, g: IGlobal);
        flagIntToString(flags: number): string;
        readFile(filename: string, cb: (e: ErrorPossible, rv?: Buffer) => any): void;
        write(fd: number, buffer: Buffer, offset: number, length: number, position: number, cb: CallbackLength): void;
        writeFile(filename: string, data: any, cb: Callback): void;
        writeSync(fd: number, buf: Uint8Array): number;
        chmod(path: string, mode: uint32, cb: Callback): void;
        chown(path: string, uid: uint32, gid: uint32, cb: Callback): void;
        close(fd: number, cb: Callback): void;
        fchmod(fd: int, mode: uint32, cb: Callback): void;
        fchown(fd: int, uid: uint32, gid: uint32, cb: Callback): void;
        fstat(fd: number, cb: CallbackStat): void;
        fsync(fd: int, cb: Callback): void;
        ftruncate(fd: int, length: int64, cb: Callback): void;
        lchown(path: string, uid: int, gid: int, cb: Callback): void;
        link(path: string, link: string, cb: Callback): void;
        lstat(path: string, cb: CallbackStat): void;
        mkdir(path: string, perm: uint32, cb: Callback): void;
        open(path: string, flags: number, mode: number, cb: CallbackFd): void;
        read(fd: number, buffer: Uint8Array, offset: number, length: number, position: number | null, cb: CallbackLength): void;
        readdir(path: string, cb: CallbackDir): void;
        readlink(path: string, cb: CallbackDst): void;
        rename(from: string, to: string, cb: Callback): void;
        rmdir(path: string, cb: Callback): void;
        stat(path: string, cb: CallbackStat): void;
        symlink(path: string, link: string, cb: Callback): void;
        truncate(path: string, length: int64, cb: Callback): void;
        unlink(path: string, cb: Callback): void;
        utimes(path: string, atime: int64, mtime: int64, cb: Callback): void;
    }
}
declare module "1.17/webAssembly/instantiateStreaming" {
    import { IImportObjectGo } from "1.17/webAssembly/importObjectGo";
    /**
     * WebAssembly.instantiateStreaming polyfill.
     * @constructor
     */
    export default function InstantiateStreaming(resp: Response, importObject: WebAssembly.Imports & {
        go: IImportObjectGo;
    }): Promise<WebAssembly.WebAssemblyInstantiatedSource>;
}
