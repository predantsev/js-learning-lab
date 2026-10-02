// How many bytes the text takes in UTF-8.
function byteLength(text) {
}

// The longest beginning of the text that fits into maxBytes bytes of UTF-8,
// without cutting any character in half.
function truncateToBytes(text, maxBytes) {
}

const label = "Київ 🐈";
console.log(byteLength(label));
console.log(truncateToBytes(label, 6));
