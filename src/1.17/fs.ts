import {enosys} from "./enosys";
import {int, int32, int64, uint32, uint64} from './types'
import {ITextDecoder} from "./encoding";

/**
 * Go expects errors to be present as Error, or null, but NOT undefined.
 * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L506
 */
export type ErrorPossible = Error | null
/**
 * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L495
 */
export type Callback = (e: ErrorPossible) => any
export type CallbackStat = (e: ErrorPossible, stat?: Stat) => any
export type CallbackLength = (e: ErrorPossible, n?: int) => any
export type CallbackFd = (e: ErrorPossible, fd?: int) => any
export type CallbackDir = (e: ErrorPossible, dir?: string[]) => any
export type CallbackDst = (e: ErrorPossible, dst?: string) => any

/**
 * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L166
 */
export interface Stat {
    dev: int64
    ino: uint64
    mode: uint32
    nlink: uint32
    uid: uint32
    gid: uint32
    rdev: int64
    size: int64
    blksize: int32
    blocks: int32
    atimeMs: int64
    mtimeMs: int64
    ctimeMs: int64

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L94
     */
    isDirectory(): boolean
}

/**
 * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go.
 * The base FS interface required by Go. See also IFS.
 */
export interface IFileSystem {
    /**
     * See
     *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L21
     *     https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L25-L32
     */
    constants: {
        O_WRONLY: int
        O_RDWR: int
        O_CREAT: int
        O_TRUNC: int
        O_APPEND: int
        O_EXCL: int
    }

    writeSync(fd: int, buf: Uint8Array): int

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L237
     */
    write(fd: int, buf: Uint8Array, offset: int, length: int, position: null | number, cb: CallbackLength): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L237
     */
    chmod(path: string, mode: uint32, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L250
     */
    chown(path: string, uid: uint32, gid: uint32, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L119
     */
    close(fd: int, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L245
     */
    fchmod(fd: int, mode: uint32, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L258
     */
    fchown(fd: int, uid: uint32, gid: uint32, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L212
     */
    fstat(fd: int, cb: CallbackStat): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L371
     */
    fsync(fd: int, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L308
     */
    ftruncate(fd: int, length: int64, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L263
     */
    lchown(path: string, uid: int, gid: int, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L349
     */
    link(path: string, link: string, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L200
     */
    lstat(path: string, cb: CallbackStat): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L131
     */
    mkdir(path: string, perm: uint32, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L59.
     * js flags -> go openmode, js mode -> go perm
     * @param path
     * @param flags
     * @param mode
     * @param cb
     */
    open(path: string, flags: int, mode: int, cb: CallbackFd): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L376
     */
    read(fd: int, buf: Uint8Array, offset: int, length: int, position: null | int, cb: CallbackLength): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L95
     */
    readdir(path: string, cb: CallbackDir): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L337
     */
    readlink(path: string, cb: CallbackDst): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L289
     */
    rename(from: string, to: string, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L289
     */
    rmdir(path: string, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L188
     */
    stat(path: string, cb: CallbackStat): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L360
     */
    symlink(path: string, link: string, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L300
     */
    truncate(path: string, length: int64, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L221
     */
    unlink(path: string, cb: Callback): void

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L276
     */
    utimes(path: string, atime: int64, mtime: int64, cb: Callback): void
}

export type IGlobalIn = {
    textDecoder: ITextDecoder
}

/**
 * Go writes process stdin, stdout, stderr using the fs write commands.
 * Therefore, the full FS must have the process object with it.
 * Process is unused in the reference Go polyfill, as it just writes directly
 * to globalThis.console.log.
 */
export class FileSystem implements IFileSystem {
    _global: IGlobalIn

    constructor(g: IGlobalIn) {
        this._global = g
    }

    // unused
    constants = {O_WRONLY: -1, O_RDWR: -1, O_CREAT: -1, O_TRUNC: -1, O_APPEND: -1, O_EXCL: -1}
    // combined stdout / stderr
    outputBuf = ""

    writeSync(fd: number, buf: Uint8Array) {
        this.outputBuf += this._global.textDecoder.decode(buf);
        const nl = this.outputBuf.lastIndexOf("\n");
        if (nl != -1) {
            console.log(this.outputBuf.substr(0, nl));
            this.outputBuf = this.outputBuf.substr(nl + 1);
        }
        return buf.length;
    }

    write(fd: number, buf: Uint8Array, offset: number, length: number, position: number | null, callback: CallbackLength) {
        if (offset !== 0 || length !== buf.length || position !== null) {
            callback(enosys());
            return;
        }
        const n = this.writeSync(fd, buf);
        callback(null, n);
    }

    chmod(path: string, mode: number, callback: Callback) {
        callback(enosys())
    }

    chown(path: string, uid: number, gid: number, callback: Callback) {
        callback(enosys())
    }

    close(fd: number, callback: Callback) {
        callback(enosys())
    }

    fchmod(fd: number, mode: number, callback: Callback) {
        callback(enosys())
    }

    fchown(fd: number, uid: number, gid: number, callback: Callback) {
        callback(enosys())
    }

    fstat(fd: number, callback: Callback) {
        callback(enosys())
    }

    fsync(fd: number, callback: Callback) {
        callback(null)
    }

    ftruncate(fd: number, length: number, callback: Callback) {
        callback(enosys())
    }

    lchown(path: string, uid: number, gid: number, callback: Callback) {
        callback(enosys())
    }

    link(path: string, link: string, callback: Callback) {
        callback(enosys())
    }

    lstat(path: string, callback: CallbackStat) {
        callback(enosys())
    }

    mkdir(path: string, perm: number, callback: Callback) {
        callback(enosys())
    }

    open(path: string, flags: number, mode: number, callback: Callback) {
        callback(enosys())
    }

    read(fd: number, buffer: Uint8Array, offset: number, length: number, position: number, callback: Callback) {
        callback(enosys())
    }

    readdir(path: string, callback: CallbackDir) {
        callback(enosys())
    }

    readlink(path: string, callback: Callback) {
        callback(enosys())
    }

    rename(from: string, to: string, callback: Callback) {
        callback(enosys())
    }

    rmdir(path: string, callback: Callback) {
        callback(enosys())
    }

    stat(path: string, callback: CallbackStat) {
        callback(enosys())
    }

    symlink(path: string, link: string, callback: Callback) {
        callback(enosys())
    }

    truncate(path: string, length: number, callback: Callback) {
        callback(enosys())
    }

    unlink(path: string, callback: Callback) {
        callback(enosys())
    }

    utimes(path: string, atime: number, mtime: number, callback: Callback) {
        callback(enosys())
    }
}

export interface IGlobalOut extends IGlobalIn {
    fs: IFileSystem
}


export default function install<T extends IGlobalIn>(g: IGlobalIn): (T & IGlobalOut) {
    const g_ = g as T & IGlobalOut
    g_.fs = new FileSystem(g)
    return g_
}