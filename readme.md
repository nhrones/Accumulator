
# Acummulator buffer
An efficient zero-copy expandable buffer.
This utility is used mainly for binary codecs such as MessagePack.
I've used a modified deno-std msgpack encoder to demonsrate usage.

## Expanable
See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/ArrayBuffer#creating_a_resizable_arraybuffer

## API
  - new - accepts an initial buffer size
  - appendByte(val: number) adds a byte to the accumulator
  - appendBuffer(buf: Uint8Array) adds a buffer to the accumulator
  - extractEncoded() extracts all encoded bytes from the accumulator

## Test-demo
Basically, the demo is using a refactored copy of deno/std/msgpack/encoder.    
I've replaced (one-to-one), the use of **_byteParts_** array with an **_Accumulator_** .  
Rather than /std/bytes/concat, we simply return the accumulator.  

Changes to original encoder are simply: 
   - replacing a byteParts: Uint8Array[] with an accumulator; see: ./accumulator.ts
   - in several places, I renamed the parameter `object` to `item` for readability,
     as I found the name `object` a bit confusing.

## Note:
I think the Accumulator would be a nice addition to deno/std/byte/
