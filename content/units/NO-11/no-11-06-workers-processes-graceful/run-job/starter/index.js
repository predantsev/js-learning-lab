// Three runs of runJob over 2000 synthetic expenses: complete, over a 500-record budget, and
// aborted after 30 ms. After each it prints the outcome, how many timers still hold the process and
// how many FileHandles are still open. open() is wrapped (syncBuiltinESMExports updates the named
// import in app.js) so that every FileHandle stays referenced: a leaked one is counted here instead
// of being closed later by the garbage collector, which Node.js 25 turns into a crash.
import fsp, { writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { runJob } from './app.js';

const opened = [];
const realOpen = fsp.open;
fsp.open = async (...args) => {
  const handle = await realOpen(...args);
  opened.push(handle);
  return handle;
};
syncBuiltinESMExports();

let lines = '';
for (let i = 1; i <= 2000; i++) lines += `${JSON.stringify({ id: `e-${i}`, title: `%%expense%% ${i}`, amountMinor: 100 })}\n`;
await writeFile('expenses.jsonl', lines);

const job = {
  inputPath: 'expenses.jsonl',
  saveBatch: () => new Promise((resolve) => setTimeout(resolve, 2)), // a slow store
  onProgress: () => {},
};

async function show(label, options) {
  try {
    const { count, total } = await runJob(job, options);
    console.log(`${label}: %%records%% ${count}, %%total%% ${total}`);
  } catch (error) {
    console.log(`${label}: ${error.name}`);
  }
  await new Promise((resolve) => setTimeout(resolve, 50));
  const timers = process.getActiveResourcesInfo().filter((name) => name === 'Timeout').length;
  const handles = opened.filter((handle) => handle.fd !== -1).length;
  console.log(`  %%timersLeft%%: ${timers}, %%handlesLeft%%: ${handles}`);
}

await show('%%complete%%', { maxRecords: 5000 });
await show('%%overBudget%%', { maxRecords: 500 });
const controller = new AbortController();
setTimeout(() => controller.abort(), 30);
await show('%%aborted%%', { maxRecords: 5000, signal: controller.signal });
