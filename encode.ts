/*===================================================================
This is a modified version of the Deno std/msgpack encoder
See: https://github.com/denoland/deno_std/blob/main/msgpack/encode.ts

We're using it here to demonstrate the Accumulator class
See: lines 54, 56, and the function `encodeSlice` at line 125
=====================================================================*/
import { Accumulator } from "./accumulator.ts";

export type ValueType =
   | number
   | bigint
   | string
   | boolean
   | null
   | Uint8Array
   | ValueType[]
   | ValueMap;

interface ValueMap {
   [index: string | number]: ValueType;
}

const FOUR_BITS = 16;
const FIVE_BITS = 32;
const SEVEN_BITS = 128;
const EIGHT_BITS = 256;
const FIFTEEN_BITS = 32768;
const SIXTEEN_BITS = 65536;
const THIRTY_ONE_BITS = 2147483648;
const THIRTY_TWO_BITS = 4294967296;
const SIXTY_THREE_BITS = 9223372036854775808n;
const SIXTY_FOUR_BITS = 18446744073709551616n;

/**
 * Encode a value to MessagePack binary format.
 *
 * @example
 * ```ts
 * import { encode } from "https://deno.land/std@$STD_VERSION/msgpack/encode.ts";
 *
 * const obj = {
 *   str: "deno",
 *   arr: [1, 2, 3],
 *   map: {
 *     foo: "bar"
 *   }
 * }
 *
 * console.log(encode(obj))
 * ```
 */
export function encode(item: ValueType) {
   const accumulator = new Accumulator();
   encodeSlice(item, accumulator);
   return accumulator.extractEncoded();
}

function encodeFloat64(num: number) {
   const dataView = new DataView(new ArrayBuffer(9));
   dataView.setFloat64(1, num);
   dataView.setUint8(0, 0xcb);
   return new Uint8Array(dataView.buffer);
}

function encodeNumber(num: number) {
   if (!Number.isInteger(num)) { // float 64
      return encodeFloat64(num);
   }

   if (num < 0) {
      if (num >= -FIVE_BITS) { // negative fixint
         return new Uint8Array([num]);
      }

      if (num >= -SEVEN_BITS) { // int 8
         return new Uint8Array([0xd0, num]);
      }

      if (num >= -FIFTEEN_BITS) { // int 16
         const dataView = new DataView(new ArrayBuffer(3));
         dataView.setInt16(1, num);
         dataView.setUint8(0, 0xd1);
         return new Uint8Array(dataView.buffer);
      }

      if (num >= -THIRTY_ONE_BITS) { // int 32
         const dataView = new DataView(new ArrayBuffer(5));
         dataView.setInt32(1, num);
         dataView.setUint8(0, 0xd2);
         return new Uint8Array(dataView.buffer);
      }

      // float 64
      return encodeFloat64(num);
   }

   // if the number fits within a positive fixint, use it
   if (num <= 0x7f) {
      return new Uint8Array([num]);
   }

   if (num < EIGHT_BITS) { // uint8
      return new Uint8Array([0xcc, num]);
   }

   if (num < SIXTEEN_BITS) { // uint16
      const dataView = new DataView(new ArrayBuffer(3));
      dataView.setUint16(1, num);
      dataView.setUint8(0, 0xcd);
      return new Uint8Array(dataView.buffer);
   }

   if (num < THIRTY_TWO_BITS) { // uint32
      const dataView = new DataView(new ArrayBuffer(5));
      dataView.setUint32(1, num);
      dataView.setUint8(0, 0xce);
      return new Uint8Array(dataView.buffer);
   }

   // float 64
   return encodeFloat64(num);
}

function encodeSlice(item: ValueType, accumulator: Accumulator) {
   if (item === null) {
      accumulator.appendByte(0xc0)
      return;
   }

   if (item === false) {
      accumulator.appendByte(0xc2)
      return;
   }

   if (item === true) {
      accumulator.appendByte(0xc3)
      return;
   }

   if (typeof item === "number") {
      accumulator.appendBuffer(encodeNumber(item))
      return;
   }

   if (typeof item === "bigint") {
      if (item < 0) {
         if (item < -SIXTY_THREE_BITS) {
            throw new Error("Cannot safely encode bigint larger than 64 bits");
         }

         const dataView = new DataView(new ArrayBuffer(9));
         dataView.setBigInt64(1, item);
         dataView.setUint8(0, 0xd3);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
         return;
      }

      if (item >= SIXTY_FOUR_BITS) {
         throw new Error("Cannot safely encode bigint larger than 64 bits");
      }

      const dataView = new DataView(new ArrayBuffer(9));
      dataView.setBigUint64(1, item);
      dataView.setUint8(0, 0xcf);
      accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      return;
   }

   if (typeof item === "string") {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(item);
      const len = encoded.length;
      
      if (len < FIVE_BITS) { // fixstr
         accumulator.appendBuffer(new Uint8Array([0xa0 | len]))
      } else if (len < EIGHT_BITS) { // str 8
         accumulator.appendBuffer(new Uint8Array([0xd9, len]))
      } else if (len < SIXTEEN_BITS) { // str 16
         const dataView = new DataView(new ArrayBuffer(3));
         dataView.setUint16(1, len);
         dataView.setUint8(0, 0xda);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else if (len < THIRTY_TWO_BITS) { // str 32
         const dataView = new DataView(new ArrayBuffer(5));
         dataView.setUint32(1, len);
         dataView.setUint8(0, 0xdb);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else {
         throw new Error(
            "Cannot safely encode string with size larger than 32 bits",
         );
      }
      accumulator.appendBuffer(encoded)
      return;
   }

   if (item instanceof Uint8Array) {
      if (item.length < EIGHT_BITS) { // bin 8
         accumulator.appendBuffer(new Uint8Array([0xc4, item.length]))
      } else if (item.length < SIXTEEN_BITS) { // bin 16
         const dataView = new DataView(new ArrayBuffer(3));
         dataView.setUint16(1, item.length);
         dataView.setUint8(0, 0xc5);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else if (item.length < THIRTY_TWO_BITS) { // bin 32
         const dataView = new DataView(new ArrayBuffer(5));
         dataView.setUint32(1, item.length);
         dataView.setUint8(0, 0xc6);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else {
         throw new Error(
            "Cannot safely encode Uint8Array with size larger than 32 bits",
         );
      }
      //byteParts.push(item);
      accumulator.appendBuffer(item)
      return;
   }

   if (Array.isArray(item)) {
      if (item.length < FOUR_BITS) { // fixarray
         accumulator.appendBuffer(new Uint8Array([0x90 | item.length]))
      } else if (item.length < SIXTEEN_BITS) { // array 16
         const dataView = new DataView(new ArrayBuffer(3));
         dataView.setUint16(1, item.length);
         dataView.setUint8(0, 0xdc);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else if (item.length < THIRTY_TWO_BITS) { // array 32
         const dataView = new DataView(new ArrayBuffer(5));
         dataView.setUint32(1, item.length);
         dataView.setUint8(0, 0xdd);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else {
         throw new Error(
            "Cannot safely encode array with size larger than 32 bits",
         );
      }

      for (const obj of item) {
         encodeSlice(obj, accumulator);
      }
      return;
   }

   // If object is a plain object
   if (Object.getPrototypeOf(item) === Object.prototype) {
      const numKeys = Object.keys(item).length;

      if (numKeys < FOUR_BITS) { // fixarray
         accumulator.appendBuffer(new Uint8Array([0x80 | numKeys]))
      } else if (numKeys < SIXTEEN_BITS) { // map 16
         const dataView = new DataView(new ArrayBuffer(3));
         dataView.setUint16(1, numKeys);
         dataView.setUint8(0, 0xde);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else if (numKeys < THIRTY_TWO_BITS) { // map 32
         const dataView = new DataView(new ArrayBuffer(5));
         dataView.setUint32(1, numKeys);
         dataView.setUint8(0, 0xdf);
         accumulator.appendBuffer(new Uint8Array(dataView.buffer))
      } else {
         throw new Error("Cannot safely encode map with size larger than 32 bits");
      }

      for (const [key, value] of Object.entries(item)) {
         encodeSlice(key, accumulator);
         encodeSlice(value, accumulator);      
      }
      return;
   }

   throw new Error("Cannot safely encode value into messagepack");
}
