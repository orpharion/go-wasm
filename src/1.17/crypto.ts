/**
 * See https://github.com/golang/go/blob/go1.17/src/crypto/rand/rand_js.go#L16
 */
import {IRequire} from "./require";

export interface ICrypto {
    getRandomValues(array: Uint8Array): void
}

/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/crypto.d.ts#L1833
 */
interface INodeCrypto {
    randomFillSync<T>(b: T): T
}

/**
 * See https://github.com/golang/go/blob/go1.17/misc/wasm/wasm_exec.js#L106-L113
 * @param req
 */
export function require_(req?: IRequire): ICrypto | undefined {
    if (!req) return undefined
    let nodeCrypto_ = req('crypto')
    if (!nodeCrypto_) return undefined
    let nodeCrypto = nodeCrypto_ as INodeCrypto
    return {
        getRandomValues(b) {
            nodeCrypto.randomFillSync(b)
        }
    }
}