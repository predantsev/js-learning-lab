import { LIMIT_TEXT } from "./describe.js";

export const MAX_BYTES = 16;

// null when the size fits, otherwise the text that describes the limit.
export function checkSize(bytes) {
  return bytes <= MAX_BYTES ? null : LIMIT_TEXT;
}
