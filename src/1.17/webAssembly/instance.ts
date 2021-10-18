export interface IInstance extends WebAssembly.Instance {
    /**
     * See https://github.com/golang/go/blob/go1.17/src/cmd/link/internal/wasm/asm.go#L380-L388
     */
    exports: {
        resume(): void
        run(argc: number, argv: number): void
        getsp(): number
        mem: WebAssembly.Memory
    }
}