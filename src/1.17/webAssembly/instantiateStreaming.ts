import {IImportObjectGo} from './importObjectGo'

/**
 * WebAssembly.instantiateStreaming polyfill.
 * @constructor
 */
export default async function InstantiateStreaming(resp: Response, importObject: WebAssembly.Imports & { go: IImportObjectGo }) {
    const source = await(await resp).arrayBuffer();
    return await WebAssembly.instantiate(source, importObject)
}
