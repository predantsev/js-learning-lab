// Mistake: the signal is accepted but never handed to pipeline, so an abort changes nothing.
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
    );
    await rename(tempPath, destPath);
  } catch (error) {
    await rm(tempPath, { force: true });
    throw error;
  }
}
