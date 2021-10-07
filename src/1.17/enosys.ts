export interface EnoSys extends Error {
    code: string
}

export function enosys(): EnoSys {
    const err = new Error("not implemented") as EnoSys;
    err.code = "ENOSYS";
    return err;
}