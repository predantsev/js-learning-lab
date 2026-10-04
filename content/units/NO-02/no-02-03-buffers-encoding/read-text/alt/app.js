// Another valid solution: check the bytes with buffer.isUtf8, then decode them with an explicit encoding.
import { isUtf8 } from 'node:buffer';
import { readFile } from 'node:fs/promises';

export async function readTextFile(path) {
  const bytes = await readFile(path);
  if (!isUtf8(bytes)) throw new TypeError(`${path} is not valid UTF-8`);
  return bytes.toString('utf8');
}
