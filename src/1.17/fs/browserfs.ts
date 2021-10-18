import {File, FileFlag as IFileFlag, FileSystem as bFS} from './browserfs/interfaces'
import bStats from 'browserfs/dist/node/core/node_fs_stats'
import {
    Callback,
    CallbackDir,
    CallbackDst,
    CallbackFd,
    CallbackLength,
    CallbackStat,
    ErrorPossible,
    IFileSystem,
    Stat
} from '../fs'
import {int, int64, uint32} from "../types"
import {IProcess} from "../process";
import {FileFlag} from 'browserfs/dist/node/core/file_flag'
import {IBufferConstructor} from './browserfs/buffer'

import {Path} from "./browserfs/path";
// todo latent errors:

// - must check everywhere, as go doesn't mind.

/**
 * Go requires Open operations on directories to succeed to read them. I assume for locking during read.
 * Go requires fd >= 0 (as is typical, <= 0 typically denotes error)
 *     see https://github.com/golang/go/blob/master/src/os/file_unix.go#L125
 * BrowserFS starts assigning non-std fd at 100
 *     see https://github.com/jvilk/BrowserFS/blob/master/src/core/FS.ts#L177
 */
const DIR_FD = 99

function wrapCallback(cb: (e: ErrorPossible, ...returns: any) => void) {
    return (e: ErrorPossible | undefined, ...r: any) => {
        e === undefined ? e = null : e
        cb(e, ...r)
    }
}

let wcb = wrapCallback

// this only exists because go calls open on directories, where
// this isn't possible with browserFS.
class StatDirDummy implements bStats, Stat {
    size = 512 // assumed
    atime = new Date(0)
    mtime = new Date(0)
    ctime = new Date(0)
    atimeMs: number
    mtimeMs: number
    ctimeMs: number
    mode = 0o664
    blocks = 1 // see size and blksize
    // unsupported by bFS, defaults see https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/core/node_fs_stats.ts
    dev = 0
    ino = 0
    nlink = 1
    uid = 0
    gid = 0
    rdev = 0
    blksize = 4096
    birthtime = new Date(0)
    // required for bStat
    fileData = null
    birthtimeMs: number

    constructor() {
        this.atimeMs = this.atime.getTime()
        this.mtimeMs = this.mtime.getTime()
        this.ctimeMs = this.ctime.getTime()
        this.birthtimeMs = this.ctime.getTime()
    }


    isFile() {
        return false
    }

    isDirectory() {
        return true
    }

    isBlockDevice() {
        return true
    }

    isCharacterDevice() {
        return false
    }

    isSymbolicLink() {
        return false
    }

    isFIFO() {
        return false
    }

    isSocket() {
        return false
    }

    chmod(mode: number) {
    }

    // @ts-ignore
    toBuffer(): unknown {
        throw "error"
    }
}

/**
 * See https://github.com/jvilk/BrowserFS/blob/v1.4.3/src/core/browserfs.ts.
 * We don't include require.
 */
export interface IGlobalIn {
    process: IProcess
    Buffer: IBufferConstructor
}

/**
 * The filesystem as exposed to GO, matching its signatures.
 * The wrapped filesystem isn't changed, and can be re-used as-is for other applications.
 * See https://github.com/jvilk/BrowserFS/blob/master/src/core/file_system.ts: "Every path is an absolute path"
 */
export class FileSystem implements IFileSystem {
    #wrapped: bFS // the underlying browserFS
    #global: IGlobalIn
    #path: Path
    /**
     * Since browserfs uses files instead of fd, and uses fd methods,
     * We need to track access state ourselves.
     */
    _fds: Map<int, File> = new Map()
    /**
     * Previously in browser script, fids would start at 100. Keeping that behaviour.
     */
    _fdNext: int = 100

    constants = {
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
    }

    // todo path module?
    constructor(
        originalFS: bFS,
        g: IGlobalIn
    ) {
        this.#wrapped = originalFS
        this.#global = g
        this.#path = new Path(g)
    }

    getFileForFd(fd: number): { e: ErrorPossible, f: File | null } {
        const file = this._fds.get(fd)
        if (file) {
            return {e: null, f: file}
        }
        return {
            e: {
                name: "EINVAL",
                message: "internal file device not found"
            }, f: null
        }
    }

    flagIntToString(flags: number): string {
        var flagStr = 'r';
        let O = this.constants;
        // Convert numeric flags to string flags
        // FIXME: maybe wrong...
        if (flags & O.O_WRONLY) { // 'w'
            flagStr = 'w';
            if (flags & O.O_EXCL) {
                flagStr = 'wx';
            }
        } else if (flags & O.O_RDWR) { // 'r+' or 'w+'
            if (flags & O.O_CREAT && flags & O.O_TRUNC) { // w+
                if (flags & O.O_EXCL) {
                    flagStr = 'wx+';
                } else {
                    flagStr = 'w+';
                }
            } else { // r+
                flagStr = 'r+';
            }
        } else if (flags & O.O_APPEND) { // 'a'
            throw "Not implemented"
        }
        return flagStr
    }


    // readFile(filename: string, cb: (e: ErrorPossible, rv?: Buffer) => any) {
    //     this.#wrapped.readFile(filename, null, wcb(cb))
    // }

    write(fd: number, buf: Uint8Array, offset: number, length: number, position: number, cb: CallbackLength) {
        if (fd === 1 || fd === 2) {
            if (offset !== 0 || length !== buf.length || position !== null) {
                throw new Error("not implemented");
            }
            cb(null, this.writeSync(fd, buf))
        } else {
            const {e, f} = this.getFileForFd(fd)
            if (!f) {
                throw e
            } else {
                // browser buffer has no copy method.
                // todo see if this works!!!!!
                return f.write(this.#global.Buffer.from(buf), offset, length, position, wcb(cb))
            }
        }
    }

    // writeFile(filename: string, data: any, cb: Callback) {
    //     return this.#wrapped.writeFile(filename, data, null, wcb(cb))
    // }

    writeSync(fd: number, buf: Uint8Array): number {
        switch (fd) {
            case 1:
                this.#global.process.stdout.write(buf)
                return buf.length
            case 2:
                this.#global.process.stderr.write(buf)
                return buf.length
            default:
                const {e, f} = this.getFileForFd(fd)
                if (!f) {
                    throw e
                } else {
                    return f.writeSync(this.#global.Buffer.from(buf), 0, 0, 0)
                }
        }
    }

    chmod(path: string, mode: uint32, cb: Callback): void {
        this.#wrapped.chmod(this.#path.resolve(path), false, mode, wcb(cb))
    }

    chown(path: string, uid: uint32, gid: uint32, cb: Callback): void {
        this.#wrapped.chown(this.#path.resolve(path), false, uid, gid, wcb(cb))
    }

    close(fd: number, cb: Callback) {
        if (fd === DIR_FD) {
            cb(null)
        } else {
            const {e, f} = this.getFileForFd(fd)
            if (!f) {
                cb(e)
            } else {
                f.close(wcb(cb))
            }
        }

    }

    fchmod(fd: int, mode: uint32, cb: Callback): void {
        const {e, f} = this.getFileForFd(fd)
        if (!f) {
            cb(e)
        } else {
            f.chmod(mode, wcb(cb))
        }

    }

    fchown(fd: int, uid: uint32, gid: uint32, cb: Callback): void {
        const {e, f} = this.getFileForFd(fd)
        if (!f) {
            cb(e)
        } else {
            f.chown(uid, gid, wcb(cb))
        }
    }

    // See DIR_FD
    fstat(fd: number, cb: CallbackStat) {
        switch (fd) {
            case DIR_FD:
                cb(null, new StatDirDummy())
                break
            default:
                const {e, f} = this.getFileForFd(fd)
                if (!f) {
                    cb(e)
                } else {
                    f.stat((e, s) => {
                        cb(e === undefined ? null : e, s)
                    })
                }
        }
    }

    fsync(fd: int, cb: Callback): void {
        const {e, f} = this.getFileForFd(fd)
        if (!f) {
            cb(e)
        } else {
            f.sync(wcb(cb))
        }
    }

    ftruncate(fd: int, length: int64, cb: Callback): void {
        const {e, f} = this.getFileForFd(fd)
        if (!f) {
            cb(e)
        } else {
            f.truncate(length, wcb(cb))
        }

    }

    lchown(path: string, uid: int, gid: int, cb: Callback): void {
        this.#wrapped.chown(this.#path.resolve(path), true, uid, gid, wcb(cb))
    }

    link(path: string, link: string, cb: Callback): void {
        this.#wrapped.link(this.#path.resolve(path), link, wcb(cb))
    }

    lstat(path: string, cb: CallbackStat): void {
        this.#wrapped.stat(this.#path.resolve(path), true, wcb(cb))
    }

    mkdir(path: string, perm: uint32, cb: Callback): void {
        this.#wrapped.mkdir(this.#path.resolve(path), perm, wcb(cb))
    }

    // browserFS uses string flags, go uses uint flags.
    // See DIR_FD.
    // syscall_js just needs fstat to work and confirm it's a directory. Obviously, race conditions can occur.
    // go uses open(O_WRONLY | O_CREATE | O_TRUNC ) to create files.
    open(path: string, flags: number, mode: number, cb: CallbackFd) {
        path = this.#path.resolve(path)
        const flagStr = this.flagIntToString(flags)
        const fileFlag = FileFlag.getFileFlag(flagStr)
        try {

            this.#wrapped.stat(path, false, (e, s) => {
                if (e || s?.isFile()) {
                    // try send open a fileFlag instead, expecting it to be?

                    this.#wrapped.open(path, fileFlag as unknown as IFileFlag, mode,
                        (e, f?) => {
                            if (f && !e) {
                                const fd = this._fdNext += 1
                                this._fds.set(fd, f)
                                cb(e ? e : null, fd)
                            } else {
                                cb(e ? e : null)
                            }
                        })
                } else if (s?.isDirectory()) {
                    cb(null, DIR_FD)
                } else {
                    throw "invalid stat"
                }
            })
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    read(fd: number, buf: Uint8Array, offset: number, length: number, position: number | null, cb: CallbackLength) {
        switch (fd) {
            case 0:
                const in_ = this.#global.process.stdin.read()
                if (in_) {
                    buf.set(in_)
                    cb(null, in_.length)
                } else {
                    cb(null, 0)
                }
                return
            default:
                const {e, f} = this.getFileForFd(fd)
                if (!f) {
                    cb(e)
                } else {
                    f.read(this.#global.Buffer.from(buf), offset, length, position, (e, n, b) => {
                        // this is extremely odd. The data isn't transferred to the provided buffer.
                        if (b) {
                            buf.set(b, 0)
                        }
                        cb(e ? e : null, n)
                    })
                }
        }
    }

    readdir(path: string, cb: CallbackDir) {
        this.#wrapped.readdir(this.#path.resolve(path), wcb(cb))
    }

    readlink(path: string, cb: CallbackDst): void {
        this.#wrapped.readlink(this.#path.resolve(path), wcb(cb))
    }

    rename(from: string, to: string, cb: Callback): void {
        this.#wrapped.rename(this.#path.resolve(from), this.#path.resolve(to), wcb(cb))
    }

    rmdir(path: string, cb: Callback): void {
        this.#wrapped.rmdir(this.#path.resolve(path), wcb(cb))
    }

    stat(path: string, cb: CallbackStat) {
        this.#wrapped.stat(this.#path.resolve(path), false, wcb(cb))
    }

    // todo symlink type
    symlink(path: string, link: string, cb: Callback): void {
        this.#wrapped.symlink(this.#path.resolve(path), link, "file", wcb(cb))
    }

    truncate(path: string, length: int64, cb: Callback): void {
        this.#wrapped.truncate(this.#path.resolve(path), length, wcb(cb))
    }

    unlink(path: string, cb: Callback): void {
        this.#wrapped.unlink(this.#path.resolve(path), wcb(cb))
    }

    utimes(path: string, atime: int64, mtime: int64, cb: Callback): void {
        this.#wrapped.utimes(this.#path.resolve(path), new Date(atime), new Date(mtime), wcb(cb))
    }
}