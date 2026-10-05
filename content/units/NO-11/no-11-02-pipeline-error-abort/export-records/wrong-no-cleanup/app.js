// Misconception: pipeline cleans up everything by itself. It closes the streams, but the partial
// temporary file stays on disk.
import { createWriteStream } from 'node:fs';
import { rename } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function exportRecords(source, destPath, { signal } = {}) {
  const tempPath = `${destPath}.tmp`;
  await pipeline(
    source,
    async function* toJsonLines(records) {
      for await (const record of records) yield `${JSON.stringify(record)}\n`;
    },
    createWriteStream(tempPath),
    { signal },
  );
  await rename(tempPath, destPath);
}
