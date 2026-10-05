// Runs the seeded import (seeded-import.js, the same code as the exercise) on 40,000 habits into a
// slow output and gathers evidence: memory samples, two heap snapshots, and the timers left after
// an aborted second import.
import { writeFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { takeSnapshot } from './heap-summary.js';
import { importFile } from './seeded-import.js';

const HABITS = 40_000; // try 10000
let text = '';
for (let i = 1; i <= HABITS; i++) {
  text += `${JSON.stringify({ id: `h-${i}`, name: `%%habit%% ${i}`, completions: ['2026-03-02', '2026-03-01'] })}\n`;
}
await writeFile('habits.jsonl', text);
const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} %%mb%%`;

// Evidence 1: snapshot before.
const before = await takeSnapshot();

// Evidence 2: memory samples while the import runs into a slow output: 4 ms per 64 KiB it stores.
const output = new Writable({
  writev(chunks, done) {
    const bytes = chunks.reduce((sum, { chunk }) => sum + chunk.length, 0);
    setTimeout(done, 4 * Math.ceil(bytes / 65536));
  },
});
const sampler = setInterval(() => {
  console.log(`  heapUsed ${mb(process.memoryUsage().heapUsed)}, %%outputQueue%% ${mb(output.writableLength)}`);
}, 100);
await importFile('habits.jsonl', output);
clearInterval(sampler);

// Evidence 3: snapshot after, compared with the first one.
const after = await takeSnapshot();
console.log(`%%strings%%: ${before.stringCount} → ${after.stringCount}`);
for (const { property, edges } of after.bigArrays) {
  const old = before.bigArrays.find((a) => a.property === property);
  if (!old || old.edges < edges / 2) console.log(`%%bigArray%% «${property}»: ${edges} %%elements%%`);
}

// Evidence 4: a second import, aborted at once; then the timers still holding the process.
const controller = new AbortController();
controller.abort();
await importFile('habits.jsonl', new Writable({ write: (c, e, done) => done() }), { signal: controller.signal }).catch(
  (error) => console.log(`%%secondImport%%: ${error.name}`),
);
await new Promise((resolve) => setTimeout(resolve, 100));
console.log(`%%timersLeft%%: ${process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length}`);
process.exit(0); // with a timer left behind the program would never end by itself
