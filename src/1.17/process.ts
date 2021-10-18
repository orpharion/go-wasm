/**
 * See
 *     https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go
 *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go
 */
import {int} from './types'
import {enosys} from './enosys'
import {IConsole, IConsoleWriter} from './console'
import {ITextDecoder} from "./encoding";

type Ihrtime = (time?: [number, number]) => [number, number]

export interface IProcessIn {
    hrtime: Ihrtime
}

export interface IGlobalIn {
    textDecoder: ITextDecoder,
    console: IConsole,
    /**
     * We need a reference hrtime specification for performance module.
     */
    process: IProcessIn
}

export type IGlobalOut = IGlobalIn & { process: IProcess }


export interface IStreamWritable {
    write(chunk: Uint8Array, encoding?: string | null, callback?: (e?: Error | null | undefined) => void): boolean
}

export interface IStreamReadable {
    fd: number

    read(size?: number): Uint8Array | null
}

export interface IStreamDuplex extends IStreamReadable, IStreamWritable {

}

export class StreamDuplex implements IStreamDuplex {
    fd: number
    #flushTo?: (data: Uint8Array, encoding?: string | null) => void
    /**
     * Flush on newline.
     * @private
     */
    #flushOn = 0x0A
    #buf: Uint8Array = new Uint8Array()

    constructor(fd: number, flushTo?: IConsoleWriter) {
        this.fd = fd
        this.#flushTo = flushTo
    }

    /**
     * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L50-L55
     * @param chunk
     * @param encoding
     * @param callback
     */
    write(chunk: Uint8Array, encoding?: string | null, callback?: (e?: Error | null | undefined) => void): boolean {
        let lenO = this.#buf.length
        let buf = new Uint8Array(lenO + chunk.length)
        buf.set(this.#buf, 0)
        buf.set(chunk, lenO)
        this.#buf = buf
        const nl = this.#buf.lastIndexOf(this.#flushOn)
        if (nl != -1 && this.#flushTo) {
            this.#flushTo(this.#buf.slice(0, nl), encoding)
            this.#buf = this.#buf.slice(nl + 1);
        }
        return true
    }

    read(size?: number): Uint8Array | null {
        size = size ? size : this.#buf.length
        size = size > this.#buf.length ? this.#buf.length : size
        let out = this.#buf.slice(0, size)
        this.#buf = this.#buf.slice(size + 1)
        return out
    }
}

export class StreamReadable implements IStreamReadable {
    fd: number
    #buf: Uint8Array

    constructor(fd: number, data?: Uint8Array) {
        this.fd = fd
        this.#buf = data ? data : new Uint8Array()
    }

    read(size?: number): Uint8Array | null {
        size = size ? size : this.#buf.length
        size = size > this.#buf.length ? this.#buf.length : size
        let out = this.#buf.slice(0, size)
        this.#buf = this.#buf.slice(size + 1)
        return out
    }
}

export class StdIn extends StreamReadable {
    fd: 0 = 0

    constructor(data?: Uint8Array) {
        super(0, data)
    }
}


export class StdOut extends StreamDuplex {
    fd: 1 = 1
    #global: IGlobalIn

    constructor(
        g: IGlobalIn,
        toConsole: boolean = true
    ) {
        super(1,
            toConsole ? (data: Uint8Array) => {
                g.console.log(g.textDecoder.decode(data))
            } : undefined
        )
        this.#global = g
    }
}

export class StdErr extends StreamDuplex {
    fd: 2 = 2
    #global: IGlobalIn

    constructor(
        g: IGlobalIn,
        toConsole: boolean = true
    ) {
        super(2,
            toConsole ? (data: Uint8Array) => {
                g.console.error(g.textDecoder.decode(data))
            } : undefined
        )
        this.#global = g
    }
}

export interface IProcess {
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L292
     */
    getuid(): int

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L296
     */
    getgid(): int

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L300
     */
    geteuid(): int

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L304
     */
    getegid(): number

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L308
     */
    getgroups(): int[]

    pid: number
    ppid: number

    // std streams not implemented in go, but added here.
    stdin: IStreamReadable & { fd: 0 }
    stdout: IStreamDuplex & { fd: 1 }
    stderr: IStreamDuplex & { fd: 2 }

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/syscall_js.go#L326
     */
    umask(mask: int): int

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L313
     */
    cwd(): string

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L320
     */
    // covers Fchdir, Getwd as well.
    chdir(path: string): void

    /**
     * Required for global.performance.
     * See
     *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L121
     *     https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/process.d.ts#L114
     */
    hrtime(time?: [number, number]): [number, number]
}

// todo integrate with filesystem to check #cwd exists.
export class Process<G extends IGlobalIn> implements IProcess {
    #global: G
    #cwd: string
    #hrtime: Ihrtime
    stdin: IStreamReadable & { fd: 0 }
    stdout: IStreamDuplex & { fd: 1 }
    stderr: IStreamDuplex & { fd: 2 }

    constructor(g: G, pipe: boolean = true, hrtime: Ihrtime) {
        this.#cwd = "/"
        this.#global = g
        this.#hrtime = hrtime
        this.stdin = new StdIn()
        this.stdout = new StdOut(g, pipe)
        this.stderr = new StdErr(g, pipe)
    }

    getuid() {
        return -1
    }

    getgid() {
        return -1
    }

    geteuid() {
        return -1
    }

    getegid() {
        return -1
    }

    getgroups(): int[] {
        throw enosys()
    }

    pid: number = -1
    ppid: number = -1

    umask(mask: int): int {
        throw enosys()
    }

    cwd(): string {
        return this.#cwd
    }

    chdir(path: string) {
        this.#cwd = path
        // throw enosys()
    }

    hrtime() {
        return this.#hrtime()
    }
}

export default function install<G extends IGlobalIn>(global: G, pipe: boolean = true, hrtime: Ihrtime): (G & IGlobalOut) {
    const g_ = global as G & IGlobalOut
    g_.process = new Process(global, pipe, hrtime)
    return g_
}

