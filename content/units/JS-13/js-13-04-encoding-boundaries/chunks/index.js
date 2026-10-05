const bytes = new TextEncoder().encode("Київ, Львів");
console.log("%%total%%", bytes.length);

// The bytes arrive in two chunks, cut after byte 5.
const first = bytes.slice(0, 5);
const second = bytes.slice(5);

// Each chunk decoded on its own.
const separate = new TextDecoder().decode(first) + new TextDecoder().decode(second);
console.log("%%separate%%", separate);

// One decoder in streaming mode keeps an unfinished letter until the next chunk.
const decoder = new TextDecoder();
const streamed = decoder.decode(first, { stream: true }) + decoder.decode(second);
console.log("%%streamed%%", streamed);
