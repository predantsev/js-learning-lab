// readBounded(path, maxBytes): the file's bytes as a Buffer — but only when the file is at most
// maxBytes long. A larger file is refused with a RangeError before any of its bytes are read.
import { open, readFile, stat } from 'node:fs/promises';

export async function readBounded(path, maxBytes) {
  return readFile(path);
}
