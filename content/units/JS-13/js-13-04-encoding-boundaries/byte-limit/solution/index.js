// How many bytes the text takes in UTF-8.
function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

// The longest beginning of the text that fits into maxBytes bytes of UTF-8,
// without cutting any character in half.
function truncateToBytes(text, maxBytes) {
  let result = "";
  let used = 0;
  for (const character of text) {
    const size = byteLength(character);
    if (used + size > maxBytes) {
      break;
    }
    result = result + character;
    used = used + size;
  }
  return result;
}

const label = "Київ 🐈";
console.log(byteLength(label));
console.log(truncateToBytes(label, 6));
