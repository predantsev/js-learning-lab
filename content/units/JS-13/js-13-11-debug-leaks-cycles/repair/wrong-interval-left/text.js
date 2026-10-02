import { checkSize } from "./limits.js";

// Join text that arrives as several chunks of UTF-8 bytes.
export function decodeChunks(chunks) {
  const decoder = new TextDecoder();
  let text = "";
  for (const chunk of chunks) {
    text = text + decoder.decode(chunk, { stream: true });
  }
  return text + decoder.decode();
}

// How many bytes the text takes in UTF-8.
export function byteLength(text) {
  return new TextEncoder().encode(text).length;
}

// { bytes, problem }: problem is null when the text fits into the limit.
export function fitPayload(text) {
  const bytes = byteLength(text);
  return { bytes, problem: checkSize(bytes) };
}
