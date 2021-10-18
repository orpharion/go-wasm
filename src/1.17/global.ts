import {IRequire, must, wrap} from './require'
import {FileSystem, IFileSystem} from './fs'
import {IProcess, IProcessIn, Process} from './process';
import {ICrypto, require_ as requireCrypto} from './crypto';
import {IConsole} from './console'
import FPerformance, {IPerformance} from './performance'
import {
    ITextDecoder,
    ITextDecoderConstructor,
    ITextEncoder,
    ITextEncoderConstructor,
    requireTextDecoderConstructor,
    requireTextEncoderConstructor
} from "./encoding";
import installGo, {Go, IGo} from "./go";
import {xhrIsAvailable} from "browserfs/dist/node/generic/xhr";

/**
 * Required, but no polyfill provided.
 */
export interface IGlobalCore {
    // Required by Go --------------------------------------------------------------------------------------------------
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/js.go#L99
     */
    Object: typeof Object
    Array: typeof Array
    /**
     * See https://github.com/golang/go/blob/ec5170397c724a8ae440b2bc529f857c86f0e6b1/src/syscall/js/js.go#L580
     */
    Uint8Array: typeof Uint8Array // todo also Uint8ClampedArray
    /**
     * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L80
     */
    Headers: typeof Headers
    /**
     * See https://github.com/golang/go/blob/go1.17/src/time/zoneinfo_js.go#L26
     */
    Date: typeof Date
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L86
     */
    console: IConsole
    // Required by wasm_exec.js ----------------------------------------------------------------------------------------
    TextEncoder: ITextEncoderConstructor
    TextDecoder: ITextDecoderConstructor
}

/**
 * Required and polyfillable.
 */
interface IGlobalPoly {
    // Required by Go --------------------------------------------------------------------------------------------------
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L19
     */
    process: IProcessIn | IProcess
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L20
     */
    fs: IFileSystem
    /**
     * Only polyfillable in node environments, but browsers supply their own.
     * See https://github.com/golang/go/blob/go1.17/src/crypto/rand/rand_js.go#L16
     */
    crypto: ICrypto
    // Required by wasm_exec.js ----------------------------------------------------------------------------------------
    performance: IPerformance
    /** Can be instantiated from TextEncoder, TextDecoder */
    textDecoder: ITextDecoder
    textEncoder: ITextEncoder
}

interface IGlobalOptional {
    // Optional for Go --------------------------------------------------------------------------------------------------
    /**
     * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L44
     */
    fetch: typeof fetch
    /**
     * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L52
     */
    AbortController: typeof AbortController
    // Optional for wasm_exec.js ----------------------------------------------------------------------------------------
    /**
     * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L30
     * Doesn't seem to be used by go internally, or beyond providing polyfills.
     */
    require: IRequire

}

export interface IGlobalIn extends IGlobalCore, IGlobalPoly, Partial<IGlobalOptional> {
    process: IProcessIn
}

export interface IGlobalRequired extends IGlobalCore, IGlobalPoly, Partial<IGlobalOptional> {
    process: IProcess
}

export interface IGlobalInPartial extends IGlobalCore, Partial<IGlobalPoly>, Partial<IGlobalOptional> {
    process: IProcessIn
}

export interface IGlobalOut extends IGlobalRequired {
    go: IGo
}

export class Global<G extends IGlobalInPartial> implements IGlobalOut {
    // Required, no polyfill
    Object: typeof Object = Object
    Array: typeof Array = Array
    Uint8Array: typeof Uint8Array = Uint8Array
    Headers: typeof Headers = Headers
    Date: typeof Date = Date
    console: IConsole = console
    // Optional, no polyfill
    require?: IRequire
    TextEncoder: ITextEncoderConstructor
    TextDecoder: ITextDecoderConstructor

    // Required, Polyfillable / Requireable
    process: IProcess
    fs: IFileSystem
    crypto: ICrypto
    performance: IPerformance

    textEncoder: ITextEncoder
    textDecoder: ITextDecoder

    go: IGo

    /**
     * Returns a new Global-like taking required properties from the reference Global-like
     * @param from: reference Global-like
     */
    constructor(from: G) {
        const fill = transfer(from as IGlobalInPartial, this)
        // this below is mostly to make typescript happy.
        this.TextDecoder = fill.TextDecoder
        this.TextEncoder = fill.TextEncoder
        this.textDecoder = new this.TextDecoder('utf-8')
        this.textEncoder = new this.TextEncoder()
        this.fs = fill.fs
        this.process = fill.process
        this.crypto = fill.crypto
        this.performance = fill.performance
        this.go = new Go(this)
    }
}

/**
 * Fill an existing partial Global-like with the required properties, mutating in place.
 * @param partial: partial Global-like
 */
export function fill<G extends IGlobalInPartial>(partial: G): G & IGlobalOut {
    return prepare(partial, partial as G & IGlobalOut)
}

/**
 * Transfer properties from the partial Global-like onto the target, mutating it
 * and poly-filling as required.
 * @param partial: partial Global-like
 * @param onto:
 * @private
 */
export function prepare<G extends IGlobalInPartial, N>(partial: G, onto: N ): N & IGlobalRequired {
    const from = onto as N & IGlobalInPartial
    const onto_ = onto as N & IGlobalOut
    if (!from.Object) onto_.Object = partial.Object
    if (!from.Array) onto_.Array = partial.Array
    if (!from.Uint8Array) onto_.Uint8Array = partial.Uint8Array
    if (!from.Headers) onto_.Headers = partial.Headers
    if (!from.Date) onto_.Date = partial.Date
    if (!from.console) onto_.console = partial.console
    // only required and Requireable.
    if (!from.TextEncoder) {
        onto_.TextEncoder = must<ITextEncoderConstructor>(
            "TextEncoder",
            partial.TextEncoder,
            undefined,
            () => requireTextEncoderConstructor(partial.require))
    }
    if (!from.TextDecoder) {
        onto_.TextDecoder = must<ITextDecoderConstructor>(
            "TextDecoder",
            partial.TextDecoder,
            undefined,
            () => requireTextDecoderConstructor(partial.require))
    }
    if (!from.textDecoder) onto_.textDecoder = must<ITextDecoder>("textDecoder", partial.textDecoder, () => new onto_.TextDecoder('utf-8'))
    if (!from.textEncoder) onto_.textEncoder = must<ITextEncoder>("textEncoder", partial.textEncoder, () => new onto_.TextEncoder())
    if (!from.fs) onto_.fs = must<IFileSystem>("fs", partial.fs, () => new FileSystem(onto_), wrap("fs", partial.require))
    // todo - process overrides
    onto_.process = must<IProcess>("process", undefined, () => new Process(onto_, true, from.process.hrtime))
    if (!from.crypto) onto_.crypto = must<ICrypto>("crypto", partial.crypto, undefined, () => requireCrypto(partial.require))
    if (!from.performance) onto_.performance = must<IPerformance>("performance", partial.performance, () => new FPerformance(onto_))
    return onto_
}

export function transfer<G extends IGlobalInPartial, N>(from: G, onto: N): N & IGlobalOut {
    const g = prepare(from, onto) as N & IGlobalOut
    installGo(g)
    return g
}


export default function install<G extends IGlobalInPartial>(global: G): G & IGlobalOut {
    const g = fill(global) as G & IGlobalOut
    installGo(g)
    return g
}
