// writeJsonLines(records, writable): writes every record as one line of JSON ('\n' after each),
// never lets the writer's buffer grow past its limit, and resolves once the writer has finished.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  // Mistake: an index loop needs records.length, which a generator does not have, so nothing is written.
  for (let i = 0; i < records.length; i++) {
    if (!writable.write(`${JSON.stringify(records[i])}\n`)) await once(writable, 'drain');
  }
  writable.end();
  await once(writable, 'finish');
}
