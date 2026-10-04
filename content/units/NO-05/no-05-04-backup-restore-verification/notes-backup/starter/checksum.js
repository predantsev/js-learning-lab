// sha256Of(text): the SHA-256 of a text as 64 hexadecimal characters.
import { createHash } from 'node:crypto';

export function sha256Of(text) {
  return createHash('sha256').update(text).digest('hex');
}
