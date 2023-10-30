# Acummulator buffer
An efficient expandable buffer, featuring zero-copy expansion.\
This utility is used mainly for binary codecs such as MessagePack, KvKeyCodec, KvValueCodec.\
I've included a refactored deno/std/msgpack/encoder here to demonsrate usage.

## Expanable
The internal buffer is a resizable ArrayBuffer. Values are simply appended to
it.\
As the buffer fills it will auto-expand in fixed size increments (default =
32k).\
This is extremely efficient for most binary codecs; most will never need to
expand.\
See:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/ArrayBuffer#creating_a_resizable_arraybuffer

## API
- new Accumulator(size: number = 32768) - accepts an initial buffer size (default=32k)
- appendByte(val: number) - appends a byte at the current insertionPoint
- appendBuffer(buf: ArrayBuffer) - appends the buffer at the current insertionPoint
- extract() - returns all appended bytes as Uint8Array (0 -> insertionPoint)

## Simple example
```ts
export function encode(item: ValueType) {
   const accumulator = new Accumulator();
   encodeSlice(item, accumulator);
   return accumulator.extractEncoded();
}

function encodeSlice(item: ValueType, accumulator: Accumulator) {

   if (item === null) {
      accumulator.appendByte(0xc0);
      return;
   }

   if (typeof item === "number") {
      accumulator.appendBuffer(encodeNumber(item));
      return;
   }

   if (typeof item === "string") {
      const encoder = new TextEncoder();
      accumulator.appendBuffer(encoder.encode(item););
      return;
   }
   ...
   ... 
   // handle objects
   for (const part of item) {
      encodeSlice(part, accumulator);
   }
   return;
}
```

## Test-demo

I've included a test demonstration using a refactored copy of
deno/std/msgpack/encoder.\
I've replaced (one-to-one), the use of the **_byteParts_** array with an
**_Accumulator_** .\
Rather than /std/bytes/concat, we simply return the accumulator.

Changes to original encoder are simply:

- Replacing the byteParts: Uint8Array[], with an accumulator instance; see:
  ./accumulator.ts
- in several places, I renamed the parameter `object` to the name `item` for
  readability.\
  _I found the name `object` a bit confusing in a few places_

## Run example tests:

```
deno test --allow-read
```

## Note:

This buffer is working very well in DenoKvKeyCodec and my DenoKvValueCodec.\
I think this Accumulator would be a nice addition to deno/std/byte/.
