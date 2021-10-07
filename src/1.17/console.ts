export type IConsoleWriter = (...data: any[]) => void

export interface IConsole {
    /**
     * See https://github.com/golang/go/blob/go1.17/src/syscall/js/func.go#L86
     */
    error: IConsoleWriter
    log: IConsoleWriter
}
