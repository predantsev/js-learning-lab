// Turn bytes (a Uint8Array) into a lowercase hex string:
// two characters per byte, so 0 → "00", 15 → "0f", 255 → "ff".
function toHex(bytes) {
}

const checksum = new Uint8Array([222, 173, 11, 7]);
console.log(toHex(checksum));
