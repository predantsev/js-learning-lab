// Misconception: a stream is "just a faster file write" — the result of write() does not matter.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  for (const record of records) {
    writable.write(`${JSON.stringify(record)}\n`);
  }
  writable.end();
  await once(writable, 'finish');
}
