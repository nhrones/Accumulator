
# Acummulator buffer
An efficient expandable buffer. with zero-copy-expansion.  
This utility is used mainly for binary codecs such as MessagePack.   
I've used a modified deno/std/msgpack/encoder here to demonsrate its usage.   

## Expanable
Accumulators buffer is an expandable ArrayBuffer. Values are simply appended to it.    
As the buffer fills it will auto-expand in fixed size increments (default = 32k).   
This is extremely efficient for most binary codecs, most will never need an expand.   
See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/ArrayBuffer#creating_a_resizable_arraybuffer

## API
  - new - accepts an initial buffer size
  - appendByte(val: number) appends a byte to the end of accumulation 
  - appendBuffer(buf: Uint8Array) appends a buffer to the accumulation
  - extractEncoded() extracts all encoded bytes from the accumulation

## Test-demo
I've included demonstration using a refactored copy of deno/std/msgpack/encoder.    
I've replaced (one-to-one), the use of the **_byteParts_** array with an **_Accumulator_** .   
Rather than /std/bytes/concat, we simply return the accumulator.  

Changes to original encoder are simply: 
   - replacing a byteParts: Uint8Array[] with an accumulator; see: ./accumulator.ts
   - in several places, I renamed the parameter `object` to `item` for readability,
     as I found the name `object` a bit confusing.

## Run example tests:
```
deno test --allow-read
```
## Note:
This buffer is working very well in my DenoKv-KeyCodec and my DenoKv-ValueCodec.     
I think the Accumulator would be a nice addition to deno/std/byte/
