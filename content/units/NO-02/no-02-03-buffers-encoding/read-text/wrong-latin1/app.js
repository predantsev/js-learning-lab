// Misconception: "one character is one byte", so every byte is turned into one character (latin1).
import { isUtf8 } from 'node:buffer';
import { readFile } from 'node:fs/promises';

export async function readTextFile(path) {
  const bytes = await readFile(path);
  if (!isUtf8(bytes)) throw new TypeError(`${path} is not valid UTF-8`);
  return bytes.toString('latin1');
}
