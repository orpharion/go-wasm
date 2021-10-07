import {IRequire, must, wrap} from './require'
import FFS, {IFS} from './fs'
import FProcess, {IProcess} from './process';
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

export interface IGlobal {
    // Required by Go -------------------------------------------------------------------------------------------------

    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L19
     */
    process: IProcess
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/fs_js.go#L20
     */
    fs: IFS
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/js.go#L99
     */
    Object: typeof Object
    Array: typeof Array
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/js.go#L99
     */
    Uint8Array: typeof Uint8Array
    /**
     * See https://github.com/golang/go/blob/go1.17/src/crypto/rand/rand_js.go#L16
     */
    crypto: ICrypto
    /**
     * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L44
     */
    fetch?: typeof fetch
    /**
     * See https://github.com/golang/go/blob/go1.17/src/net/http/roundtrip_js.go#L52
     */
    AbortController?: typeof AbortController
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

    // Required by js -------------------------------------------------------------------------------------------------

    /**
     * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L30
     * Doesn't seem to be used by go internally, or beyond providing polyfills.
     */
    require?: IRequire
    TextEncoder: ITextEncoderConstructor
    TextDecoder: ITextDecoderConstructor
    textDecoder: ITextDecoder
    textEncoder: ITextEncoder
    performance: IPerformance
}

export interface IGlobalPartial {
    // Required - no polyfill
    Object: typeof Object
    Array: typeof Array
    Uint8Array: typeof Uint8Array
    Headers: typeof Headers
    Date: typeof Date
    console: IConsole
    crypto: ICrypto
    // Polyfillable
    process?: IProcess
    fs?: IFS

    // Optional
    fetch?: typeof fetch
    AbortController?: typeof AbortController
    require?: IRequire
    TextEncoder?: ITextEncoderConstructor
    TextDecoder?: ITextDecoderConstructor
    textEncoder?: ITextEncoder
    textDecoder?: ITextDecoder
    performance?: IPerformance
}


// TODO INTEGRATE FS AND PROCESS

export default class Global implements IGlobal {
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
    fs: IFS
    crypto: ICrypto
    performance: IPerformance

    textEncoder: ITextEncoder
    textDecoder: ITextDecoder

    /**
     * Returns a new Global-like taking required properties from the reference Global-like
     * @param from: reference Global-like
     */
    constructor(from: IGlobalPartial) {
        const fill = transfer(from, this)
        // this below is mostly to make typescript happy.
        this.TextDecoder = fill.TextDecoder
        this.TextEncoder = fill.TextEncoder
        this.textDecoder = new this.TextDecoder('utf-8')
        this.textEncoder = new this.TextEncoder()
        this.fs = fill.fs
        this.process = fill.process
        this.crypto = fill.crypto
        this.performance = fill.performance
    }
}

/**
 * Fill an existing partial Global-like with the required properties, mutating in place.
 * @param partial: partial Global-like
 */
export function fill(partial: IGlobalPartial): IGlobal {
    return transfer(partial, partial as IGlobal)
}

/**
 * Transfer properties from the partial Global-like onto the target, mutating it
 * and poly-filling as required.
 * @param partial: partial Global-like
 * @param onto:
 * @private
 */
export function transfer(partial: IGlobalPartial, onto: IGlobal): IGlobal {
    if (!onto.Object) onto.Object = partial.Object
    if (!onto.Array) onto.Array = partial.Array
    if (!onto.Uint8Array) onto.Uint8Array = partial.Uint8Array
    if (!onto.Headers) onto.Headers = partial.Headers
    if (!onto.Date) onto.Date = partial.Date
    if (!onto.console) onto.console = partial.console
    // only required and Requireable.
    if (!onto.TextEncoder) {
        onto.TextEncoder = must<ITextEncoderConstructor>(
            "TextEncoder",
            partial.TextEncoder,
            undefined,
            () => requireTextEncoderConstructor(partial.require))
    }
    if (!onto.TextDecoder) {
        onto.TextDecoder = must<ITextDecoderConstructor>(
            "TextDecoder",
            partial.TextDecoder,
            undefined,
            () => requireTextDecoderConstructor(partial.require))
    }
    if (!onto.textDecoder) onto.textDecoder = must<ITextDecoder>("textDecoder", partial.textDecoder, () => new onto.TextDecoder('utf-8'))
    if (!onto.textEncoder) onto.textEncoder = must<ITextEncoder>("textEncoder", partial.textEncoder, () => new onto.TextEncoder())
    if (!onto.fs) onto.fs = must<IFS>("fs", partial.fs, () => new FFS(onto), wrap("fs", partial.require))
    if (!onto.process) onto.process = must<IProcess>("process", partial.process, () => new FProcess(onto, true))
    if (!onto.crypto) onto.crypto = must<ICrypto>("crypto", partial.crypto, undefined, () => requireCrypto(partial.require))
    if (!onto.performance) onto.performance = must<IPerformance>("performance", partial.performance, () => new FPerformance(onto))
    return onto
}
