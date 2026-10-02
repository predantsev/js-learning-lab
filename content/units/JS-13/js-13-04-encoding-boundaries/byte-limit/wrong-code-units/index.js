// How many bytes the text takes in UTF-8.
function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

// The longest beginning of the text that fits into maxBytes bytes of UTF-8,
// without cutting any character in half.
function truncateToBytes(text, maxBytes) {
  let result = "";
  for (let i = 0; i < text.length; i = i + 1) {
    if (byteLength(result + text[i]) > maxBytes) {
      break;
    }
    result = result + text[i];
  }
  return result;
}

const label = "Київ 🐈";
console.log(byteLength(label));
console.log(truncateToBytes(label, 6));
