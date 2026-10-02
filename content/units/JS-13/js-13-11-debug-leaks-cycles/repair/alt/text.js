import { checkSize } from "./limits.js";

// Join text that arrives as several chunks of UTF-8 bytes.
export function decodeChunks(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const all = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset = offset + chunk.length;
  }
  return new TextDecoder().decode(all);
}

// How many bytes the text takes in UTF-8.
export function byteLength(text) {
  return new TextEncoder().encode(text).byteLength;
}

// { bytes, problem }: problem is null when the text fits into the limit.
export function fitPayload(text) {
  const bytes = byteLength(text);
  return { bytes, problem: checkSize(bytes) };
}
