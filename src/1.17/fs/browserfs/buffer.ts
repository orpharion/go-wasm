/**
 * See /home/orpharion/Documents/github.com/orpharion/go-wasm/node_modules/@types/node/buffer.d.ts
 */

type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

type WithImplicitCoercion<T> =
    | T
    | {
    valueOf(): T;
}

export interface IBufferConstructor {
    new(str: string, encoding?: BufferEncoding): IBuffer;

    new(size: number): IBuffer;

    new(array: Uint8Array): IBuffer;

    new(arrayBuffer: ArrayBuffer | SharedArrayBuffer): IBuffer;

    new(array: ReadonlyArray<any>): IBuffer;

    new(buffer: IBuffer): IBuffer;

    from(arrayBuffer: WithImplicitCoercion<ArrayBuffer | SharedArrayBuffer>, byteOffset?: number, length?: number): IBuffer;

    from(data: Uint8Array | ReadonlyArray<number>): IBuffer;

    from(data: WithImplicitCoercion<Uint8Array | ReadonlyArray<number> | string>): IBuffer;

    from(
        str:
            | WithImplicitCoercion<string>
            | {
            [Symbol.toPrimitive](hint: 'string'): string;
        },
        encoding?: BufferEncoding
    ): IBuffer;

    of(...items: number[]): IBuffer;

    isBuffer(obj: any): obj is IBuffer;

    isEncoding(encoding: string): encoding is BufferEncoding;

    byteLength(string: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer, encoding?: BufferEncoding): number;

    concat(list: ReadonlyArray<Uint8Array>, totalLength?: number): IBuffer;

    compare(buf1: Uint8Array, buf2: Uint8Array): number;

    alloc(size: number, fill?: string | IBuffer | number, encoding?: BufferEncoding): IBuffer;

    allocUnsafe(size: number): IBuffer;

    allocUnsafeSlow(size: number): IBuffer;

    poolSize: number;
}

export default interface IBuffer extends Uint8Array {
    write(string: string, encoding?: BufferEncoding): number;

    write(string: string, offset: number, encoding?: BufferEncoding): number;

    write(string: string, offset: number, length: number, encoding?: BufferEncoding): number;

    toString(encoding?: BufferEncoding, start?: number, end?: number): string;

    toJSON(): {
        type: 'Buffer';
        data: number[];
    };

    equals(otherBuffer: Uint8Array): boolean;

    compare(target: Uint8Array, targetStart?: number, targetEnd?: number, sourceStart?: number, sourceEnd?: number): number;

    copy(target: Uint8Array, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;

    slice(start?: number, end?: number): IBuffer;

    subarray(start?: number, end?: number): IBuffer;

    writeBigInt64BE(value: bigint, offset?: number): number;

    writeBigInt64LE(value: bigint, offset?: number): number;

    writeBigUInt64BE(value: bigint, offset?: number): number;

    writeBigUInt64LE(value: bigint, offset?: number): number;

    writeUIntLE(value: number, offset: number, byteLength: number): number;

    writeUIntBE(value: number, offset: number, byteLength: number): number;

    writeIntLE(value: number, offset: number, byteLength: number): number;

    writeIntBE(value: number, offset: number, byteLength: number): number;

    readBigUInt64BE(offset?: number): bigint;

    readBigUInt64LE(offset?: number): bigint;

    readBigInt64BE(offset?: number): bigint;

    readBigInt64LE(offset?: number): bigint;

    readUIntLE(offset: number, byteLength: number): number;

    readUIntBE(offset: number, byteLength: number): number;

    readIntLE(offset: number, byteLength: number): number;

    readIntBE(offset: number, byteLength: number): number;

    readUInt8(offset?: number): number;

    readUInt16LE(offset?: number): number;

    readUInt16BE(offset?: number): number;

    readUInt32LE(offset?: number): number;

    readUInt32BE(offset?: number): number;

    readInt8(offset?: number): number;

    readInt16LE(offset?: number): number;

    readInt16BE(offset?: number): number;

    readInt32LE(offset?: number): number;

    readInt32BE(offset?: number): number;

    readFloatLE(offset?: number): number;

    readFloatBE(offset?: number): number;

    readDoubleLE(offset?: number): number;

    readDoubleBE(offset?: number): number;

    reverse(): this;

    swap16(): IBuffer;

    swap32(): IBuffer;

    swap64(): IBuffer;

    writeUInt8(value: number, offset?: number): number;

    writeUInt16LE(value: number, offset?: number): number;

    writeUInt16BE(value: number, offset?: number): number;

    writeUInt32LE(value: number, offset?: number): number;

    writeUInt32BE(value: number, offset?: number): number;

    writeInt8(value: number, offset?: number): number;

    writeInt16LE(value: number, offset?: number): number;

    writeInt16BE(value: number, offset?: number): number;

    writeInt32LE(value: number, offset?: number): number;

    writeInt32BE(value: number, offset?: number): number;

    writeFloatLE(value: number, offset?: number): number;

    writeFloatBE(value: number, offset?: number): number;

    writeDoubleLE(value: number, offset?: number): number;

    writeDoubleBE(value: number, offset?: number): number;

    fill(value: string | Uint8Array | number, offset?: number, end?: number, encoding?: BufferEncoding): this;

    indexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: BufferEncoding): number;

    lastIndexOf(value: string | number | Uint8Array, byteOffset?: number, encoding?: BufferEncoding): number;

    entries(): IterableIterator<[number, number]>;

    includes(value: string | number | IBuffer, byteOffset?: number, encoding?: BufferEncoding): boolean;

    keys(): IterableIterator<number>;

    values(): IterableIterator<number>;
}