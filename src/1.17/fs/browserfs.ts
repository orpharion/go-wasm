import bFS from 'browserfs/dist/node/core/FS'
import bStats from 'browserfs/dist/node/core/node_fs_stats'
import {
    Callback,
    CallbackDir,
    CallbackDst,
    CallbackFd,
    CallbackLength,
    CallbackStat,
    ErrorPossible,
    IFS,
    Stat
} from '../fs'
import {int, int64, uint32} from "../types"
import {IProcess} from "../process";

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

    toBuffer(): Buffer {
        throw "error"
    }
}

type IGlobal = {
    process: IProcess
}

/**
 * The filesystem as exposed to GO, matching its signatures.
 * The wrapped filesystem isn't changed, and can be re-used as-is for other applications.
 */
export class FS implements IFS {
    _wrapped: bFS // the underlying browserFS
    _global: IGlobal

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

    constructor(
        originalFS: bFS,
        g: IGlobal
    ) {
        this._wrapped = originalFS
        this._global = g
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

    readFile(filename: string, cb: (e: ErrorPossible, rv?: Buffer) => any) {
        this._wrapped.readFile(filename, wcb(cb))
    }

    write(fd: number, buffer: Buffer, offset: number, length: number, position: number, cb: CallbackLength) {
        if (fd === 1 || fd === 2) {
            if (offset !== 0 || length !== buffer.length || position !== null) {
                throw new Error("not implemented");
            }
            cb(null, this.writeSync(fd, buffer))
        } else {
            // browser buffer has no copy method.
            this._wrapped.write(fd, global.Buffer.from(buffer), offset, length, position, wcb(cb));
        }
    }

    writeFile(filename: string, data: any, cb: Callback) {
        return this._wrapped.writeFile(filename, data, wcb(cb))
    }

    writeSync(fd: number, buf: Uint8Array): number {
        let nl = -1
        switch (fd) {
            case 1:
                this._global.process.stdout.write(buf)
                return buf.length
            case 2:
                this._global.process.stderr.write(buf)
                return buf.length
            default:
                return this._wrapped.writeSync(fd, buf as Buffer, 0, 0, 0)
        }
    }

    chmod(path: string, mode: uint32, cb: Callback): void {
        this._wrapped.chmod(path, mode, wcb(cb))
    }

    chown(path: string, uid: uint32, gid: uint32, cb: Callback): void {
        this._wrapped.chown(path, uid, gid, wcb(cb))
    }

    // browserFS returns undefined on no error, but go does IsNull check.
    close(fd: number, cb: Callback) {
        this._wrapped.close(fd, (e) => {
            cb(e !== undefined ? e : null)
        })
    }

    fchmod(fd: int, mode: uint32, cb: Callback): void {
        this._wrapped.fchmod(fd, mode, wcb(cb))
    }

    fchown(fd: int, uid: uint32, gid: uint32, cb: Callback): void {
        this._wrapped.fchown(fd, uid, gid, wcb(cb))
    }

    // See DIR_FD
    fstat(fd: number, cb: CallbackStat) {
        switch (fd) {
            case DIR_FD:
                cb(null, new StatDirDummy())
                break
            default:
                this._wrapped.fstat(fd, (e, s) => {
                    cb(e === undefined ? null : e, s)
                })
        }
    }

    fsync(fd: int, cb: Callback): void {
        this._wrapped.fsync(fd, wcb(cb))
    }

    ftruncate(fd: int, length: int64, cb: Callback): void {
        this._wrapped.ftruncate(fd, length, wcb(cb))
    }

    lchown(path: string, uid: int, gid: int, cb: Callback): void {
        this._wrapped.lchown(path, uid, gid, wcb(cb))
    }

    link(path: string, link: string, cb: Callback): void {
        this._wrapped.link(path, link, wcb(cb))
    }

    lstat(path: string, cb: CallbackStat): void {
        this._wrapped.lstat(path, (e, s) => {
            cb(e === undefined ? null : e, s)
        })
    }

    mkdir(path: string, perm: uint32, cb: Callback): void {
        this._wrapped.mkdir(path, perm, wcb(cb))
    }

    // browserFS uses string flags, go uses uint flags.
    // See DIR_FD.
    // syscall_js just needs fstat to work and confirm it's a directory. Obviously, race conditions can occur.
    open(path: string, flags: number, mode: number, cb: CallbackFd) {
        let flagStr = this.flagIntToString(flags)
        this._wrapped.stat(path, (e, s) => {
            if (e || s?.isFile()) {
                this._wrapped.open(path, flagStr, mode, wcb(cb))
            } else if (s?.isDirectory()) {
                cb(null, DIR_FD)
            } else {
                throw "invalid stat"
            }
        })
    }

    read(fd: number, buffer: Uint8Array, offset: number, length: number, position: number | null, cb: CallbackLength) {
        switch (fd) {
            case 0:
                const in_ = process.stdin.read() as Buffer
                buffer.set(in_)
                cb(null, in_.length)
                return
            default:
                const buf = Buffer.from(buffer)
                this._wrapped.read(fd, buf, offset, length, position, (e, n) => {
                    buffer.set(buf, 0)
                    cb(e === undefined ? null : e, n)
                })
        }
    }

    readdir(path: string, cb: CallbackDir) {
        this._wrapped.readdir(path, wcb(cb))
    }

    readlink(path: string, cb: CallbackDst): void {
        this._wrapped.readlink(path, wcb(cb))
    }

    rename(from: string, to: string, cb: Callback): void {
        this._wrapped.rename(from, to, wcb(cb))
    }

    rmdir(path: string, cb: Callback): void {
        this._wrapped.rmdir(path, wcb(cb))
    }

    stat(path: string, cb: CallbackStat) {
        this._wrapped.stat(path, (e, s) => {
            cb(e === undefined ? null : e, s)
        })
    }

    symlink(path: string, link: string, cb: Callback): void {
        this._wrapped.symlink(path, link, wcb(cb))
    }

    truncate(path: string, length: int64, cb: Callback): void {
        this._wrapped.truncate(path, length, wcb(cb))
    }

    unlink(path: string, cb: Callback): void {
        this._wrapped.unlink(path, wcb(cb))
    }

    utimes(path: string, atime: int64, mtime: int64, cb: Callback): void {
        this._wrapped.utimes(path, atime, mtime, wcb(cb))
    }
}