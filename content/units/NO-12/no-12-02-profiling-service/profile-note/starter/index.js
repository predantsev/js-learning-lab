// A demo (read-only): the top three self-time functions of two real CPU profiles of the wishlist
// service — before and after the sort was moved out of the loop — and the profiling note.
import { readFile } from 'node:fs/promises';
import { profilingNote, topSelfTime } from './report.js';

const before = JSON.parse(await readFile('before.cpuprofile.json', 'utf8'));
const after = JSON.parse(await readFile('after.cpuprofile.json', 'utf8'));
console.log(`%%recorded%% ${before.recordedWith}`);

const topBefore = topSelfTime(before, 3);
const topAfter = topSelfTime(after, 3);
console.table(topBefore);
console.table(topAfter);

console.log(profilingNote({
  command: 'node --cpu-prof profile-lab.mjs --load',
  before: topBefore,
  after: topAfter,
  p95Before: 19.8,
  p95After: 2.6,
}));
