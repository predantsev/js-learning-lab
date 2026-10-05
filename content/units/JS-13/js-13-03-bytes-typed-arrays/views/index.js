const buffer = new ArrayBuffer(4);
const bytes = new Uint8Array(buffer);
const sameBytes = new Uint8Array(buffer);

bytes[0] = 300;
bytes[1] = -1;
console.log("%%bytes%%", bytes);
console.log("%%same%%", sameBytes);

const copy = bytes.slice();
copy[2] = 99;
console.log("%%copy%%", copy);
console.log("%%original%%", bytes);

// A DataView reads and writes several bytes at once, in a chosen byte order.
const view = new DataView(buffer);
view.setUint16(2, 258);
console.log("%%dataview%%", bytes[2], bytes[3]);
