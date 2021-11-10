import {ApiError} from "browserfs/dist/node/core/api_error"
import Stats from "browserfs/dist/node/core/node_fs_stats";
import IBuffer from './buffer'
import {FileFlag} from "browserfs/dist/node/core/file_flag";
/**
 * Interfaces copied from BrowserFS, because dist and src differ and src doesn't compile against the ts config.
 */

export type BFSOneArgCallback = (e?: ApiError | null) => any;
export type BFSCallback<T> = (e: ApiError | null | undefined, rv?: T) => any;
export type BFSThreeArgCallback<T, U> =
    (e: ApiError | null | undefined, arg1?: T, arg2?: U) => any;

/**
 * https://github.com/jvilk/BrowserFS/blob/master/src/core/file.ts
 */
export interface FileBase {
    getPos(): number | undefined;

    stat(cb: BFSCallback<Stats>): void;

    statSync(): Stats;

    close(cb: BFSOneArgCallback): void;

    closeSync(): void;

    truncate(len: number, cb: BFSOneArgCallback): void;

    truncateSync(len: number): void;

    sync(cb: BFSOneArgCallback): void;

    syncSync(): void;

    write(buffer: IBuffer, offset: number, length: number, position: number | null, cb: BFSThreeArgCallback<number, IBuffer>): void;

    writeSync(buffer: IBuffer, offset: number, length: number, position: number | null): number;

    read(buffer: IBuffer, offset: number, length: number, position: number | null, cb: BFSThreeArgCallback<number, IBuffer>): void;

    readSync(buffer: IBuffer, offset: number, length: number, position: number): number;

    datasync?(cb: BFSOneArgCallback): void;

    datasyncSync?(): void;

    chown?(uid: number, gid: number, cb: BFSOneArgCallback): void;

    chownSync?(uid: number, gid: number): void;

    chmod?(mode: number, cb: BFSOneArgCallback): void;

    chmodSync?(mode: number): void;

    utimes?(atime: Date, mtime: Date, cb: BFSOneArgCallback): void;

    utimesSync?(atime: Date, mtime: Date): void;
}


export interface File extends FileBase {
    chown(uid: number, gid: number, cb: BFSOneArgCallback): void;

    chmod(mode: number, cb: BFSOneArgCallback): void;
}

/**
 * https://github.com/jvilk/BrowserFS/blob/master/src/core/file_system.ts
 */
export interface FileSystemBase {
    getName?(): string;

    diskSpace?(p: string, cb: (total: number, free: number) => any): void;

    isReadOnly(): boolean;

    supportsLinks(): boolean;

    supportsProps(): boolean;

    supportsSynch(): boolean;

    // **CORE API METHODS**
    rename(oldPath: string, newPath: string, cb: BFSOneArgCallback): void;

    renameSync(oldPath: string, newPath: string): void;

    stat(p: string, isLstat: boolean | null, cb: BFSCallback<Stats>): void;

    statSync(p: string, isLstat: boolean | null): Stats;

    open(p: string, flag: FileFlag, mode: number, cb: BFSCallback<File>): void;

    openSync(p: string, flag: FileFlag, mode: number): File;

    unlink(p: string, cb: BFSOneArgCallback): void;

    unlinkSync(p: string): void;

    rmdir(p: string, cb: BFSOneArgCallback): void;

    rmdirSync(p: string): void;

    mkdir(p: string, mode: number, cb: BFSOneArgCallback): void;

    mkdirSync(p: string, mode: number): void;

    readdir(p: string, cb: BFSCallback<string[]>): void;

    readdirSync(p: string): string[];

    // **SUPPLEMENTAL INTERFACE METHODS**
    // File or directory operations
    exists?(p: string, cb: (exists: boolean) => void): void;

    existsSync?(p: string): boolean;

    realpath?(p: string, cache: { [path: string]: string }, cb: BFSCallback<string>): void;

    realpathSync?(p: string, cache: { [path: string]: string }): string;

    truncate?(p: string, len: number, cb: BFSOneArgCallback): void;

    truncateSync?(p: string, len: number): void;

    readFile?(fname: string, encoding: string | null, flag: FileFlag, cb: BFSCallback<string | IBuffer>): void;

    readFileSync?(fname: string, encoding: string | null, flag: FileFlag): any;

    writeFile?(fname: string, data: any, encoding: string | null, flag: FileFlag, mode: number, cb: BFSOneArgCallback): void;

    writeFileSync?(fname: string, data: string | IBuffer, encoding: string | null, flag: FileFlag, mode: number): void;

    appendFile?(fname: string, data: string | IBuffer, encoding: string | null, flag: FileFlag, mode: number, cb: BFSOneArgCallback): void;

    appendFileSync?(fname: string, data: string | IBuffer, encoding: string | null, flag: FileFlag, mode: number): void;

    // **OPTIONAL INTERFACE METHODS**
    // todo make optional typing!
    chmod?(p: string, isLchmod: boolean, mode: number, cb: BFSOneArgCallback): void;

    chmodSync?(p: string, isLchmod: boolean, mode: number): void;

    chown?(p: string, isLchown: boolean, uid: number, gid: number, cb: BFSOneArgCallback): void;

    chownSync?(p: string, isLchown: boolean, uid: number, gid: number): void;

    utimes?(p: string, atime: Date, mtime: Date, cb: BFSOneArgCallback): void;

    utimesSync?(p: string, atime: Date, mtime: Date): void;

    link?(srcpath: string, dstpath: string, cb: BFSOneArgCallback): void;

    linkSync?(srcpath: string, dstpath: string): void;

    symlink?(srcpath: string, dstpath: string, type: string, cb: BFSOneArgCallback): void;

    symlinkSync?(srcpath: string, dstpath: string, type: string): void;

    readlink?(p: string, cb: BFSCallback<string>): void;

    readlinkSync?(p: string): string;
}

/**
 * These are the optional functions that are required for go wasm.
 */
export interface FileSystem extends FileSystemBase {
    truncate(p: string, len: number, cb: BFSOneArgCallback): void;

    chmod(p: string, isLchmod: boolean, mode: number, cb: BFSOneArgCallback): void;

    chown(p: string, isLchown: boolean, uid: number, gid: number, cb: BFSOneArgCallback): void;

    utimes(p: string, atime: Date, mtime: Date, cb: BFSOneArgCallback): void;

    link(srcpath: string, dstpath: string, cb: BFSOneArgCallback): void;

    symlink(srcpath: string, dstpath: string, type: string, cb: BFSOneArgCallback): void;

    realpath(p: string, cache: { [path: string]: string }, cb: BFSCallback<string>): void

    readlink(p: string, cb: BFSCallback<string>): void;
}

/**
 * https://github.com/jvilk/BrowserFS/blob/master/src/core/file_flag.ts
 * See also browserfs/dist/node/core/file_flag.d.ts once built.
 */
// export interface FileFlag {
//     getFileFlag(flagStr: string): FileFlag
//
//     getFlagString(): string
//
//     isReadable(): boolean
//
//     isWriteable(): boolean
//
//     isTruncating(): boolean
//
//     isAppendable(): boolean
//
//     isSynchronous(): boolean
//
//     isExclusive(): boolean
//
//     pathExistsAction(): ActionType
//
//     pathNotExistsAction(): ActionType
// }
