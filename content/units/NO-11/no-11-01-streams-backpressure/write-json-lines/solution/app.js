// writeJsonLines(records, writable): writes every record as one line of JSON ('\n' after each),
// never lets the writer's buffer grow past its limit, and resolves once the writer has finished.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  for (const record of records) {
    const hasRoom = writable.write(`${JSON.stringify(record)}\n`);
    // false: the line is queued, but the buffer is full — wait until the writer drains it.
    if (!hasRoom) await once(writable, 'drain');
  }
  writable.end();
  await once(writable, 'finish');
}
