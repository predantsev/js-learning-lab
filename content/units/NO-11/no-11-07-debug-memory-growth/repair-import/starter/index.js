// Imports 30,000 synthetic habits into a slow output, then starts one more import and aborts it.
// Prints the size of `progress`, the most bytes the output ever held and the timers left behind.
import { writeFile } from 'node:fs/promises';
import { Writable } from 'node:stream';
import { importFile, progress } from './app.js';

let text = '';
for (let i = 1; i <= 30_000; i++) {
  text += `${JSON.stringify({ id: `h-${i}`, name: `%%habit%% ${i}`, completions: ['2026-03-02', '2026-03-01'] })}\n`;
}
await writeFile('habits.jsonl', text);

function slowOutput() {
  const output = new Writable({ writev: (chunks, done) => setTimeout(done, 1) });
  output.peak = 0;
  const write = output.write.bind(output);
  output.write = (...args) => {
    const result = write(...args);
    output.peak = Math.max(output.peak, output.writableLength);
    return result;
  };
  return output;
}

const output = slowOutput();
const count = await importFile('habits.jsonl', output);
const kb = (n) => `${(n / 1024).toFixed(0)} %%kb%%`;
console.log(`%%imported%%: ${count}; %%progressSize%%: ${kb(JSON.stringify(progress).length)}`);
console.log(`%%peakQueued%%: ${kb(output.peak)} (%%limit%% ${kb(output.writableHighWaterMark)})`);

const controller = new AbortController();
const aborted = importFile('habits.jsonl', slowOutput(), { signal: controller.signal });
controller.abort();
await aborted.catch((error) => console.log(`%%secondImport%%: ${error.name}`));
await new Promise((resolve) => setTimeout(resolve, 100));
const timers = process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length;
console.log(`%%timersLeft%%: ${timers}`);
