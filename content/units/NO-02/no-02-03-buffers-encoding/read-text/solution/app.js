// readTextFile(path): the file's text, decoded as UTF-8 on purpose.
// Bytes that are not valid UTF-8 must make it reject instead of returning damaged text.
import { readFile } from 'node:fs/promises';

export async function readTextFile(path) {
  const bytes = await readFile(path); // a Buffer: no encoding given
  // fatal: true throws a TypeError on invalid bytes instead of inserting U+FFFD.
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
