// Whole-file read versus a fixed-size chunk loop, and a size gate that refuses before reading.
import { open, readFile, stat } from 'node:fs/promises';

const MAX_BYTES = 64 * 1024 * 1024; // try 1 * 1024 * 1024
const CHUNK = 64 * 1024; // try 1024 * 1024
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} %%mb%%`;
const bufferMemory = () => process.memoryUsage().arrayBuffers; // memory held by Buffers right now

// A synthetic 24 MB history of habit completions, written 1 MB at a time.
const line = Buffer.from('2026-03-01 h-01 done\n');
const block = Buffer.alloc(1024 * 1024 - ((1024 * 1024) % line.length)).fill(line);
const writer = await open('habit-history.txt', 'w');
for (let i = 0; i < 24; i++) await writer.write(block);
await writer.close();

const { size } = await stat('habit-history.txt');
console.log(`%%file%%: ${mb(size)}, %%limit%%: ${mb(MAX_BYTES)}`);
if (size > MAX_BYTES) {
  console.log('%%refused%%');
} else {
  // 1. Chunk loop: one reusable 64 KB buffer, read again and again.
  const before = bufferMemory();
  let peak = 0;
  let newlines = 0;
  const handle = await open('habit-history.txt');
  try {
    const chunk = Buffer.alloc(CHUNK);
    let bytesRead;
    while ((bytesRead = (await handle.read(chunk, 0, CHUNK, null)).bytesRead) > 0) {
      for (let i = 0; i < bytesRead; i++) if (chunk[i] === 10) newlines += 1;
      peak = Math.max(peak, bufferMemory() - before);
    }
  } finally {
    await handle.close();
  }
  console.log(`%%chunksOf%% ${CHUNK / 1024} %%kb%%: ${newlines} %%lines%%, %%extra%% ${mb(peak)}`);

  // 2. readFile: the whole file at once.
  const start = bufferMemory();
  const whole = await readFile('habit-history.txt');
  console.log(`readFile: ${whole.length} %%bytes%%, %%extra%% ${mb(bufferMemory() - start)}`);
}
