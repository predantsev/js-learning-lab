// writeJsonLines(records, writable): writes every record as one line of JSON ('\n' after each),
// never lets the writer's buffer grow past its limit, and resolves once the writer has finished.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  // Your code here.
}
