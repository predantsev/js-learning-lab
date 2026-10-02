import { LIMIT_TEXT, MAX_BYTES } from "./describe.js";

export { MAX_BYTES };

// null when the size fits, otherwise the text that describes the limit.
export function checkSize(bytes) {
  return bytes <= MAX_BYTES ? null : LIMIT_TEXT;
}
