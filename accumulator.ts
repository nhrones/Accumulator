
/** 
 * Accumulator -- is an expandable buffer class    
 * It's typically used for binary serialization, deserialization tasks.    
 * 
 * Both Bueno-Kv key and value codecs use Acuumulator for its     
 * high perfomance and its ease of use.
 */
export class Accumulator {

   size: number

   /** resizable ArrayBuffer */
   flexBuff: ArrayBuffer

   /** the accumulation buffer */
   accumulator: Uint8Array;

   /** head-pointer */
   head = 0

   /** next byte (tail-pointer) */
   insertionPoint = 0



   // accepts an initial buffer size (defaults to 32k)
   constructor(size = 32768) {
      this.size = size
      //@ts-ignore -- Wow!  I can grow to max 3,276,800
      this.flexBuff = new ArrayBuffer(size, { maxByteLength: size * 1000 })
      this.accumulator = new Uint8Array(this.flexBuff)
   }

   /** add a single byte to our accumulator */
   appendByte(val: number) {
      this.requires(1)
      this.accumulator[this.insertionPoint++] = val
   }

   /** add a buffer to our accumulator */
   appendBuffer(buf: Uint8Array) {
      const len = buf.byteLength
      this.requires(len)
      this.accumulator.set(buf, this.insertionPoint)
      this.insertionPoint += len
   }

   /** requires -- checks capacity and expands the accumulator as required */
   requires(bytesRequired: number) {
      if (this.accumulator.length < this.insertionPoint + bytesRequired) {
         let newSize = this.accumulator.byteLength
         while (newSize < this.insertionPoint + bytesRequired) newSize += (this.size * 2)
         //@ts-ignore - This will resize the attached accumulator
         this.flexBuff.resize(newSize)
      }
   }

   /**
    * Consumes bytes from the head of the accumulator
    * by moving the head pointer
    * @param {number} length the number of bytes to be consumed.
    */
   consume(length: number) {
      this.head += length
   }
 
   /** 
    * extract all appended bytes from the accumulator 
    */
   extract() {
      return this.accumulator.slice(this.head, this.insertionPoint)
   }

   /** 
    * reset both pointers to zero 
    * creating an effectively empty accumulator
    */
   reset() {
      this.head = 0
      this.insertionPoint = 0
   }
}