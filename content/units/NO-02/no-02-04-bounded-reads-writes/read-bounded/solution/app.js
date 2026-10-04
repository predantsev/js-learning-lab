// readBounded(path, maxBytes): the file's bytes as a Buffer — but only when the file is at most
// maxBytes long. A larger file is refused with a RangeError before any of its bytes are read.
import { open, stat } from 'node:fs/promises';

const CHUNK_SIZE = 64 * 1024;

export async function readBounded(path, maxBytes) {
  const { size } = await stat(path);
  if (size > maxBytes) throw new RangeError(`${path} is ${size} bytes; the limit is ${maxBytes}`);

  const handle = await open(path);
  try {
    const chunks = [];
    let total = 0;
    while (true) {
      const { bytesRead, buffer } = await handle.read(Buffer.alloc(CHUNK_SIZE), 0, CHUNK_SIZE, null);
      if (bytesRead === 0) break;
      total += bytesRead;
      // The file may have grown since stat: never hold more than the limit.
      if (total > maxBytes) throw new RangeError(`${path} grew past the limit of ${maxBytes} bytes`);
      chunks.push(buffer.subarray(0, bytesRead));
    }
    return Buffer.concat(chunks, total);
  } finally {
    await handle.close();
  }
}
