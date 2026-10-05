// The same three stages joined with .pipe() and with pipeline(), first with a broken line 501,
// then with an AbortSignal. After each run it prints which stages are still open.
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, writeFile } from 'node:fs/promises';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { parseJsonLines } from './parse-lines.js';

const ABORT_AFTER_MS = 100; // try 5 or 2000
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const state = (stream) => (stream.destroyed ? '%%closed%%' : '%%open%%');
const report = (label, source, parse, file) =>
  console.log(`${label}: %%source%% ${state(source)}, %%parser%% ${state(parse)}, %%file%% ${state(file)}`);

// 1000 planner tasks as JSON lines; line 501 is broken.
let text = '';
for (let i = 1; i <= 1000; i++) text += i === 501 ? '%%broken%%\n' : `{"id":"t-${i}","title":"%%task%% ${i}","done":false}\n`;
await writeFile('tasks.jsonl', text);

// 1. .pipe(): each link only moves data on.
{
  const source = createReadStream('tasks.jsonl', { highWaterMark: 1024 });
  const parse = parseJsonLines();
  const file = createWriteStream('tasks-pipe.jsonl');
  parse.on('error', (error) => console.log(`.pipe() — %%error%%: ${error.message}`));
  source.pipe(parse).pipe(file);
  await sleep(100);
  report('.pipe()', source, parse, file);
  source.destroy(); // tidy up by hand, or the file stays open
  file.destroy();
}

// 2. pipeline(): one promise for the whole chain.
{
  const source = createReadStream('tasks.jsonl', { highWaterMark: 1024 });
  const parse = parseJsonLines();
  const file = createWriteStream('tasks-pipeline.jsonl');
  try {
    await pipeline(source, parse, file);
  } catch (error) {
    console.log(`pipeline() — %%error%%: ${error.message}`);
  }
  report('pipeline()', source, parse, file);
  console.log(`  %%leftOnDisk%%: ${(await stat('tasks-pipeline.jsonl')).size} %%bytes%%`);
}

// 3. pipeline() with an AbortSignal and a slow stage (5 ms per chunk); only the first 300 lines.
{
  await writeFile('tasks.jsonl', text.split('\n').slice(0, 300).join('\n') + '\n');
  const source = createReadStream('tasks.jsonl', { highWaterMark: 256 });
  const slow = new Transform({ transform: (chunk, encoding, done) => setTimeout(() => done(null, chunk), 5) });
  const file = createWriteStream('tasks-abort.jsonl');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ABORT_AFTER_MS);
  try {
    await pipeline(source, slow, file, { signal: controller.signal });
    console.log('%%finishedAll%%');
  } catch (error) {
    console.log(`%%aborted%%: ${error.name}`);
  } finally {
    clearTimeout(timer);
  }
  report('abort', source, slow, file);
  console.log(`  %%leftOnDisk%%: ${(await stat('tasks-abort.jsonl')).size} %%bytes%%`);
}
