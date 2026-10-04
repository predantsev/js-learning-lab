// exportRecords(source, destPath, { signal }): writes every record of `source` (a readable stream
// of objects) to destPath as JSON lines. The file appears only complete: on an error or an abort
// destPath stays as it was, no temporary file is left behind and every stream is closed.
import { createWriteStream } from 'node:fs';
import { rename, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function exportRecords(source, destPath, { signal } = {}) {
  const tempPath = `${destPath}.tmp`;
  try {
    await pipeline(
      source,
      async function* toJsonLines(records) {
        for await (const record of records) yield `${JSON.stringify(record)}\n`;
      },
      createWriteStream(tempPath),
      { signal },
    );
    await rename(tempPath, destPath); // the complete file replaces the old one in one step
  } catch (error) {
    await rm(tempPath, { force: true }); // pipeline closed the streams; the partial file is ours to remove
    throw error;
  }
}
