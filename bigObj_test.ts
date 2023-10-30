
import { encode } from "./encode.ts";

const bigObject = {};

for (let i = 0; i < 50000; i++) {
   Object.defineProperty(bigObject, `prop_${i}`, {
      value: i,
      enumerable: true
   });
}

// Testing Accumulator-based encoder
Deno.test("Testing big-object", () => {
   const _m = encode(bigObject);
})