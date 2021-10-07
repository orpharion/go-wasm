/**
 * https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/globals.d.ts#L234
 */
export interface IRequire {
    (id: string): any;
}

export function must<T>(
    id: string,
    t?: T,
    poly?: () => T,
    req?: () => T | undefined
): T {
    if (!t && req) {
        t = req()
    }
    if (!t && poly) {
        t = poly()
    }
    if (!t) {
        throw new Error(`global.${id} is not available, polyfill required`);
    }
    return t
}

export function wrap<T>(id: string, req?: IRequire): () => T | undefined {
    return () => req ? req(id) as T : undefined
}

require