// Writes 200,000 synthetic wishes into a slow disk and reports how much ever waited in its buffer.
import { createSlowDisk } from './slow-disk.js';
import { writeJsonLines } from './app.js';

function* syntheticWishes(count) {
  for (let i = 1; i <= count; i++) {
    yield { id: `w-${i}`, name: `%%wish%% ${i}`, price: i % 300, acquired: i % 7 === 0, category: null };
  }
}

const disk = createSlowDisk();
let peak = 0;
const gauge = setInterval(() => (peak = Math.max(peak, disk.writableLength)), 1);
const timer = setTimeout(() => {
  console.log('%%stillRunning%%');
  process.exit(1);
}, 8000);

await writeJsonLines(syntheticWishes(200_000), disk);
clearInterval(gauge);
clearTimeout(timer);
peak = Math.max(peak, disk.writableLength);
console.log(`%%stored%%: ${disk.storedLines}, %%finished%%: ${disk.writableFinished}`);
console.log(`%%peakWaiting%%: ${(peak / 1024).toFixed(0)} %%kib%% (%%limit%% ${disk.writableHighWaterMark / 1024} %%kib%%)`);
