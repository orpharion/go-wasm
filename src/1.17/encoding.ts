import {IRequire} from './require'

/**
 * See
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L144
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L49
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L255
 *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14489
 */
export interface ITextDecoder {
    decode(input?: BufferSource): string
}

/**
 * See
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L134
 *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14506
 */
export interface ITextDecoderConstructor {
    new(label?: string): TextDecoder
}

/**
 * See
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L143
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L454
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L541
 *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14541
 */
export interface ITextEncoder {
    encode(input?: string): Uint8Array
}

/**
 * See
 *     https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L127
 *     https://github.com/microsoft/TypeScript/blob/v4.4.3/lib/lib.dom.d.ts#L14548
 */
export interface ITextEncoderConstructor {
    new(): TextEncoder
}

export function requireTextEncoderConstructor(req?: IRequire): ITextEncoderConstructor | undefined {
    return (!req) ? undefined : req("util").TextEncoder
}

export function requireTextDecoderConstructor(req?: IRequire): ITextDecoderConstructor | undefined {
    return (!req) ? undefined : req("util").TextDecoder
}
