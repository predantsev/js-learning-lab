// Misconception: with .pipe() an error in one stream closes the others too. Here a file that cannot
// be opened rejects the promise, but the source keeps running.
import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { Transform } from 'node:stream';

export async function exportRecords(source, destPath, { signal } = {}) {
  const tempPath = `${destPath}.tmp`;
  const toLine = new Transform({
    writableObjectMode: true,
    transform(record, encoding, done) {
      done(null, `${JSON.stringify(record)}\n`);
    },
  });
  const file = createWriteStream(tempPath);
  try {
    await new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
      source.on('error', reject);
      file.on('error', reject);
      file.on('finish', resolve);
      source.pipe(toLine).pipe(file);
    });
    await rename(tempPath, destPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}
