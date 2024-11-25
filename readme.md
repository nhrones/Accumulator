# Acummulator buffer
An efficient auto-expanding buffer, featuring zero-copy expansion.\
This utility is used mainly for binary codecs such as MessagePack, my KvKeyCodec, and my KvValueCodec.\
I've included a **_refactored_** deno/std/msgpack/encoder here to demonsrate its usage.

## Expandable
The internal buffer is a native resizable-ArrayBuffer; values are simply appended to
it.\
As the buffer fills, it will auto-expand in fixed size increments (default =
32k).\
This is extremely efficient for most binary codecs; many will never need to
expand.\
See:
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/ArrayBuffer#creating_a_resizable_arraybuffer

## API
- new Accumulator(size: number = 32768) - accepts an initial buffer size (default=32k)
- appendByte(val: number) - appends a byte at the current insertionPoint
- appendBuffer(buf: ArrayBuffer) - appends a buffer at the current insertionPoint
- consume(length: number) - consumes a number of bytes from the head of the accumulator. 
- extract() - returns all accumulated bytes as Uint8Array (head -> insertionPoint - 1)
- reset() - resets head and insertionPoint to zero (starts a new accumulation)

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

This buffer is working very well in my Deno-KvKeyCodec and in my Deno-KvValueCodec.\
I thought this Accumulator would have been a nice addition to deno/std/byte/ as the existing _concat_ function can be very inefficient.\

When nodes-buffer and deno/std/byte/ were implemented, the very effective native Resizable-ArrayBuffer did not exist in V8. That made the use of arrays of buffers and the then contatenation of the buffer-array neccessary. Every buffer placed in the array is an object and must be instanciated and destroyed. This creates a lot of unneed memory-churn as well as GC.
