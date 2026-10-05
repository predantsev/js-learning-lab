// Alternative: turn the records into a readable stream and let stream.pipeline handle backpressure.
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export async function writeJsonLines(records, writable) {
  const lines = Readable.from(
    (function* toLines() {
      for (const record of records) yield `${JSON.stringify(record)}\n`;
    })(),
  );
  await pipeline(lines, writable);
}
