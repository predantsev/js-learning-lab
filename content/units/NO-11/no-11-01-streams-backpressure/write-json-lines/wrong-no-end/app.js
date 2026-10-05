// Mistake: the function resolves when the loop is over, while the last lines still wait in the buffer
// and the writer is never told that nothing more will come.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  for (const record of records) {
    if (!writable.write(`${JSON.stringify(record)}\n`)) await once(writable, 'drain');
  }
}
