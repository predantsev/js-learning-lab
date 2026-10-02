// How many bytes the text takes in UTF-8.
function byteLength(text) {
  return new TextEncoder().encode(text).byteLength;
}

// The longest beginning of the text that fits into maxBytes bytes of UTF-8,
// without cutting any character in half.
function truncateToBytes(text, maxBytes) {
  // encodeInto writes only whole characters and reports how much of the text it read.
  const { read } = new TextEncoder().encodeInto(text, new Uint8Array(maxBytes));
  return text.slice(0, read);
}

const label = "Київ 🐈";
console.log(byteLength(label));
console.log(truncateToBytes(label, 6));
