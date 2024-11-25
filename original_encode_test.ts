
// modified version from deno/std/msgpack -- removed decode tests

import { assertEquals, assertThrows } from "https://deno.land/std@0.204.0/assert/mod.ts";
import * as path from "https://deno.land/std@0.204.0/path/mod.ts";
import { encode } from "./msgPackEncoder.ts";

const moduleDir = path.dirname(path.fromFileUrl(import.meta.url));
const testdataDir = path.resolve(moduleDir, "testdata");

Deno.test("testdata", () => {
   const one = JSON.parse(
      Deno.readTextFileSync(path.join(testdataDir, "1.json")),
   );
   assertEquals(encode(one).byteLength, 960);

   const two = JSON.parse(
      Deno.readTextFileSync(path.join(testdataDir, "2.json")),
   );
   assertEquals(encode(two).byteLength, 307);

   const three = JSON.parse(
      Deno.readTextFileSync(path.join(testdataDir, "3.json")),
   );
   assertEquals(encode(three).byteLength, 304);

   const four = JSON.parse(
      Deno.readTextFileSync(path.join(testdataDir, "4.json")),
   );
   assertEquals(encode(four).byteLength, 6255);

   const five = JSON.parse(
      Deno.readTextFileSync(path.join(testdataDir, "5.json")),
   );
   assertEquals(encode(five).byteLength, 141);
});

Deno.test("positive numbers", () => {
  assertEquals(encode(1), Uint8Array.of(1));
  
  const ec255 = encode(255)
  assertEquals(ec255, Uint8Array.of(0xcc, 255));

  assertEquals(encode(2000), Uint8Array.of(0xcd, 7, 208));

  assertEquals(encode(70000), Uint8Array.of(0xce, 0, 1, 17, 112));

  assertEquals(
    encode(20000000000),
    Uint8Array.of(0xcb, 66, 18, 160, 95, 32, 0, 0, 0),
  );

});

Deno.test("negative numbers", () => {
  assertEquals(encode(-1), Uint8Array.of(255));

  assertEquals(encode(-127), Uint8Array.of(0xd0, 129));

  assertEquals(encode(-1000), Uint8Array.of(0xd1, 252, 24));

  assertEquals(encode(-60000), Uint8Array.of(0xd2, 255, 255, 21, 160));

  assertEquals( encode(-600000000000), Uint8Array.of(0xcb, 194, 97, 118, 89, 46, 0, 0, 0) );
});


Deno.test("floats", () => {
  assertEquals(
    encode(0.3),
    Uint8Array.of(0xcb, 63, 211, 51, 51, 51, 51, 51, 51),
  );
});

Deno.test("bigints", () => {
  assertEquals(encode(0n), Uint8Array.of(0xcf, 0, 0, 0, 0, 0, 0, 0, 0));

  assertEquals( encode(-10n),
     Uint8Array.of(0xd3, 255, 255, 255, 255, 255, 255, 255, 246),
  );
  
  assertEquals(encode(10n), Uint8Array.of(0xcf, 0, 0, 0, 0, 0, 0, 0, 10));

  assertEquals( encode(9999999999999999999n),
     Uint8Array.of(0xcf, 138, 199, 35, 4, 137, 231, 255, 255),
  );

  assertThrows(() => encode(99999999999999999999999n));
  assertThrows(() => encode(-99999999999999999999999n));
});

Deno.test("strings", () => {
  assertEquals(
    encode("hello world"),
    Uint8Array.of(171, 104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100),
  );

  const mediumString = "a".repeat(255);
  assertEquals(
    encode(mediumString),
    Uint8Array.of(0xd9, 255, ...new Array(mediumString.length).fill(97)),
  );

  const longString = "a".repeat(256);
  assertEquals(
    encode(longString),
    Uint8Array.of(0xda, 1, 0, ...new Array(longString.length).fill(97)),
  );

  const reallyLongString = "a".repeat(65536);
  assertEquals(
    encode(reallyLongString),
    Uint8Array.of(
      0xdb,
      0,
      1,
      0,
      0,
      ...new Array(reallyLongString.length).fill(97),
    ),
  );
});


Deno.test("arrays", () => {
   const arr0: never[] = [];
   const encoded0 = encode(arr0);
   assertEquals(encoded0, new Uint8Array([ 144 ]));

   const arr1 = [1, 2, 3, 4, 5, 6];
   const encoded1 = encode(arr1);
   assertEquals(encoded1, new Uint8Array( [150, 1, 2, 3, 4, 5, 6] ));

   const arr2 = new Array(9).fill(0)//256).fill(0);
   const encoded2 = encode(arr2);
   assertEquals(encoded2, new Uint8Array([ 153, 0, 0, 0, 0, 0, 0, 0, 0, 0 ] ));

   const nestedArr = [[1, 2, 3], [1, 2], 5];
   const encodedN = encode(nestedArr);
   assertEquals(encodedN, new Uint8Array([ 147, 147, 1, 2, 3, 146, 1, 2, 5 ] ));
});

Deno.test("maps", () => {
   const map0 = {};
   const m0 = encode(map0)
   assertEquals(m0, new Uint8Array([ 128 ]));

   const map1 = { "a": 0, "b": 2, "c": "three", "d": null };
   const m1 = encode(map1)
   assertEquals(m1, new Uint8Array([ 132, 161,  97,   0, 161,  98, 2, 161,  99, 165, 116, 104, 114, 101, 101, 161, 100, 192 ]));

   const nestedMap = { "a": -1, "b": 2, "c": "three", "d": null, "e": map1 };
   const mN = encode(nestedMap)
   assertEquals(mN, new Uint8Array([ 133, 161, 97, 255, 161, 98, 2, 161, 99, 165, 116, 104, 114, 101, 101, 161, 100, 192, 161, 101, 132, 161, 97, 0, 161, 98, 2, 161, 99, 165, 116, 104, 114, 101, 101, 161, 100, 192 ]));
});
