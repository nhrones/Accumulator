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

I've included a test demonstration using a slightly modified 
version of the Deno std/msgpack encoder.
See: https://jsr.io/@std/msgpack

We're using it here to demonstrate the use of this byte-accumulator. 
I've replaced (one-to-one), the use of the 'byteParts[]' with an
'accumulator'.

After decoding all parts, rather than use jsr:@std/bytes@^1.0.2/concat,  
which loops through each element in the byteParts-array to concatenate them,  
we simply return our accumulation -> See: accumulator.extract().


## Run example tests:

```
deno test --allow-read
```

## Note:

This buffer is working very well in my Deno-KvKeyCodec and in my Deno-KvValueCodec.   
I thought this Accumulator would have been a nice addition to deno/std/byte/ as the existing _concat_ function can be very inefficient.

When nodes-buffer and deno/std/byte/ were implemented, the very effective native Resizable-ArrayBuffer did not exist in V8. That made the use of an array of Uint8Arrays and then the contatenation of the Uint8Array neccessary.    
Every buffer(Uint8Array) placed in byteParts[] is an object and must be created and destroyed. This creates a lot of memory-churn as well as GC.
