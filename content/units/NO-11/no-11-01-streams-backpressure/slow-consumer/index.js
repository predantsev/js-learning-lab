// A fast file reader feeding a deliberately slow writer, with and without backpressure.
import { createReadStream } from 'node:fs';
import { open, readFile } from 'node:fs/promises';
import { Writable } from 'node:stream';

const RESPECT_BACKPRESSURE = true; // try false
const FILE = 'expenses.jsonl';
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} %%mb%%`;

// 1. A synthetic 32 MB JSON-lines file of expenses, written 1 MB at a time.
const line = Buffer.from('{"id":"e-01","title":"%%coffee%%","amountMinor":4500,"category":"food"}\n');
const block = Buffer.alloc(1024 * 1024 - ((1024 * 1024) % line.length)).fill(line);
const file = await open(FILE, 'w');
for (let i = 0; i < 32; i++) await file.write(block);
await file.close();

// 2. A stream into a slow writer: each chunk takes at least 1 ms to "store".
const slowDisk = new Writable({
  write(chunk, encoding, done) {
    setTimeout(done, 1);
  },
});
const reader = createReadStream(FILE);
console.log(`%%chunkSize%%: ${reader.readableHighWaterMark / 1024} %%kib%%, %%bufferLimit%%: ${slowDisk.writableHighWaterMark / 1024} %%kib%%`);

let peak = 0; // the most bytes ever waiting inside the writer
let falseCount = 0;
const gauge = setInterval(() => console.log(`  %%waiting%%: ${mb(slowDisk.writableLength)}`), 100);

reader.on('data', (chunk) => {
  const ok = slowDisk.write(chunk);
  peak = Math.max(peak, slowDisk.writableLength);
  if (!ok) {
    falseCount += 1;
    if (RESPECT_BACKPRESSURE) {
      reader.pause(); // stop reading until the writer has room again
      slowDisk.once('drain', () => reader.resume());
    }
  }
});
reader.on('end', () => slowDisk.end());
await new Promise((resolve, reject) => {
  slowDisk.on('finish', resolve);
  slowDisk.on('error', reject);
  reader.on('error', reject);
});
clearInterval(gauge);
console.log(`%%stream%% — %%falseCalls%%: ${falseCount}, %%peak%%: ${mb(peak)}`);

// 3. readFile: the whole file in one Buffer.
const whole = await readFile(FILE);
console.log(`readFile — %%oneBuffer%% ${mb(whole.length)}`);
