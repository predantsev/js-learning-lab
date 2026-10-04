// A writable stream that pretends to be a slow disk: every batch of chunks takes 1 ms to "store".
// It keeps only how many lines and bytes it stored, not the data itself.
import { Writable } from 'node:stream';

export function createSlowDisk() {
  const disk = new Writable({
    writev(chunks, done) {
      for (const { chunk } of chunks) {
        disk.storedBytes += chunk.length;
        disk.storedLines += String(chunk).split('\n').length - 1;
      }
      setTimeout(done, 1);
    },
  });
  disk.storedBytes = 0;
  disk.storedLines = 0;
  return disk;
}
