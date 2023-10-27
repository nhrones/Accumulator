
import { encode } from "./encode.ts";

const bigObject = {};

for (let i = 0; i < 50000; i++) {
   Object.defineProperty(bigObject, `prop_${i}`, {
      value: i,
      enumerable: true
   });
}

// Testing Accumulator-based encoder
const started = performance.now()
const _m = encode(bigObject);
const t = performance.now() - started
console.log(`Encoding large object with 100k propertiess took: ${t.toFixed()} ms
`)
