// Misconception: "'utf8' is explicit enough". The text is right for valid files, but invalid bytes
// silently become U+FFFD replacement characters instead of an error.
import { readFile } from 'node:fs/promises';

export async function readTextFile(path) {
  return readFile(path, 'utf8');
}
