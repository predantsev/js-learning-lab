// Mistake: pipeline writes straight into destPath, so a failed export destroys the previous file.
import { createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

export async function exportRecords(source, destPath, { signal } = {}) {
  try {
    await pipeline(
      source,
      async function* toJsonLines(records) {
        for await (const record of records) yield `${JSON.stringify(record)}\n`;
      },
      createWriteStream(destPath),
      { signal },
    );
  } catch (error) {
    await rm(destPath, { force: true });
    throw error;
  }
}
