// A readable stream of synthetic habit records. Every 50 records it waits `delayMs`, like a slow
// database; with `failAt` it fails with an error when it reaches that record.
import { Readable } from 'node:stream';

export function habitSource({ count, failAt = null, delayMs = 0 }) {
  async function* habits() {
    for (let i = 1; i <= count; i++) {
      if (i === failAt) throw new Error(`%%habit%% ${i}: %%unreadable%%`);
      if (delayMs > 0 && i % 50 === 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      yield { id: `h-${i}`, name: `%%habit%% ${i}`, frequency: 'daily', active: true, completions: [] };
    }
  }
  return Readable.from(habits());
}
