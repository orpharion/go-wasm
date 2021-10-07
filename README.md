# go-wasm

A strongly-typed wasm-exec for Go web assemblies.

Based on go's own [wasm-exec.js](https://github.com/golang/go/blob/master/misc/wasm/wasm_exec.js).

Includes browserfs polyfill wrapper for file system operations.

Allows go binaries to be run in a desktop-like environment (which Go's current polyfills don't support).

## Example

Build the test binary, taken from the CUE project, with go 1.17,
```shell
cd ./example/scripts
export GOOS=js; export GOARCH=wasm; go build -o cue.wasm ./
```

And then open an [example with all bindings onto globalThis](./example/scripts/example-globalThis.html),
and another [example with all bindings onto a separate, global-like object](./example/scripts/example-localGlobal.html) that doesn't pollute global this.

This way, multiple go command line applications can be run simultaneously!

## Improvements

- Sufficient filesystem interface, based on browserfs, to use cli's that require it.
- Fully strongly typed.
- Exactly describes the minimum global interface required, as far as I've determined.
  (some minor interfaces outstanding)
- Links to every line of code that informs the interfaces.
- Can use without polluting globalThis.
- Can run multiple instances simultaneously.

## Note

Highly preliminary, and internals likely to change in the coming months.
However, both WASM, WASI and go's wasm_exec.js are also changing often!
