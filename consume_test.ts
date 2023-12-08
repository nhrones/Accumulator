
import { Accumulator } from "./accumulator.ts";
import { assertEquals } from "https://deno.land/std@0.204.0/assert/mod.ts";

Deno.test("consume", () => {
   const acc = new Accumulator()
   acc.appendBuffer( Uint8Array.from([1,2,3,4]) )
   console.log('insertionPoint ', acc.insertionPoint)
   acc.consume(2)
   console.log('insertionPoint ', acc.insertionPoint)
   assertEquals( acc.insertionPoint, 2)
   console.log('value ', acc.extract())
})
