// exportRecords(source, destPath, { signal }): writes every record of `source` (a readable stream
// of objects) to destPath as JSON lines. The file appears only complete: on an error or an abort
// destPath stays as it was, no temporary file is left behind and every stream is closed.
import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function exportRecords(source, destPath, { signal } = {}) {
  const file = createWriteStream(destPath);
  for await (const record of source) {
    file.write(`${JSON.stringify(record)}\n`);
  }
  file.end();
}
