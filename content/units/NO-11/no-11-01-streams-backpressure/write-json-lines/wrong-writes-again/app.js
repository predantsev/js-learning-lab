// Misconception: write() returning false means the line was lost, so it is written again after 'drain'.
import { once } from 'node:events';

export async function writeJsonLines(records, writable) {
  for (const record of records) {
    const line = `${JSON.stringify(record)}\n`;
    if (!writable.write(line)) {
      await once(writable, 'drain');
      writable.write(line);
    }
  }
  writable.end();
  await once(writable, 'finish');
}
