// Alternative: a Transform stream turns records into lines; cleanup in finally when the rename did not happen.
import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export async function exportRecords(source, destPath, { signal } = {}) {
  const tempPath = destPath + '.partial';
  let renamed = false;
  const toLine = new Transform({
    writableObjectMode: true,
    transform(record, encoding, done) {
      done(null, JSON.stringify(record) + '\n');
    },
  });
  try {
    await pipeline(source, toLine, createWriteStream(tempPath), { signal });
    await rename(tempPath, destPath);
    renamed = true;
  } finally {
    if (!renamed) await rm(tempPath, { force: true });
  }
}
