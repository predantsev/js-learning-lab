// Checks for runJob. `watchOpen` wraps open() from node:fs/promises (updating named imports with
// syncBuiltinESMExports) to see every FileHandle the job opened; activeResources() shows the timers
// that still hold the process.
import fsp, { writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { runJob } from './app.js';

const retained = []; // keeps handles referenced, so the garbage collector never closes one for us

async function watchOpen(run) {
  const opened = [];
  const realOpen = fsp.open;
  fsp.open = async (...args) => {
    const handle = await realOpen(...args);
    opened.push(handle);
    retained.push(handle);
    return handle;
  };
  syncBuiltinESMExports();
  let outcome;
  try {
    outcome = { value: await run() };
  } catch (error) {
    outcome = { error };
  } finally {
    fsp.open = realOpen;
    syncBuiltinESMExports();
  }
  return { ...outcome, opened };
}

async function inputFile(name, count) {
  const file = tmp(name);
  let text = '';
  for (let i = 1; i <= count; i++) text += `${JSON.stringify({ id: `e-${i}`, title: `${L.expense} ${i}`, amountMinor: 7 })}\n`;
  await writeFile(file, text);
  return file;
}

// abortAt: { controller, batch } aborts the controller while that batch is being saved.
function job(inputPath, saveMs = 0, abortAt = null) {
  const job = { inputPath, batches: 0, progress: 0 };
  job.saveBatch = () => {
    job.batches += 1;
    if (abortAt && job.batches === abortAt.batch) abortAt.controller.abort();
    return new Promise((resolve) => setTimeout(resolve, saveMs));
  };
  job.onProgress = () => (job.progress += 1);
  return job;
}

const timers = () => activeResources().filter((name) => name === 'Timeout').length;

async function scenarios() {
  const ok = job(await inputFile('ok.jsonl', 300));
  const big = job(await inputFile('big.jsonl', 2000));
  const controller = new AbortController();
  const slow = job(await inputFile('slow.jsonl', 2000), 5, { controller, batch: 3 });
  return [
    ['success', () => runJob(ok, { maxRecords: 5000 })],
    ['RangeError', () => runJob(big, { maxRecords: 250 })],
    ['abort', () => runJob(slow, { maxRecords: 5000, signal: controller.signal })],
  ];
}

test('resolves with the record count and the sum of amountMinor', async () => {
  expect(typeof runJob, 'type of runJob').toBe('function');
  const outcome = await watchOpen(async () => runJob(job(await inputFile('sum.jsonl', 1000)), { maxRecords: 5000 }));
  if (outcome.error) throw outcome.error;
  expect(outcome.value, 'the result for 1000 records of amountMinor 7').toEqual({ count: 1000, total: 7000 });
});

test('a job over maxRecords rejects with a RangeError and stops reading', async () => {
  expect(typeof runJob, 'type of runJob').toBe('function');
  const big = job(await inputFile('over.jsonl', 2000));
  const { error } = await watchOpen(() => runJob(big, { maxRecords: 250 }));
  expect(error instanceof RangeError, `the rejection for 2000 records with maxRecords 250 (got: ${error})`).toBe(true);
  expect(big.batches, 'batches saved before stopping (maxRecords 250, batches of 100)').toBeLessThanOrEqual(3);
});

test('an abort rejects with AbortError and saves no more batches', async () => {
  expect(typeof runJob, 'type of runJob').toBe('function');
  const controller = new AbortController();
  // The signal is aborted while the 3rd of 20 batches is being saved.
  const slow = job(await inputFile('abort.jsonl', 2000), 5, { controller, batch: 3 });
  const { error } = await watchOpen(() => runJob(slow, { maxRecords: 5000, signal: controller.signal }));
  expect(error?.name, 'the name of the rejection').toBe('AbortError');
  const savedAtAbort = slow.batches;
  await sleep(60);
  expect(slow.batches, 'batches saved after the rejection').toBe(savedAtAbort);
  expect(savedAtAbort, 'batches saved of 20 (aborted while the 3rd was being saved)').toBeLessThanOrEqual(4);
});

test('every FileHandle it opened is closed — after success, RangeError and abort', async () => {
  expect(typeof runJob, 'type of runJob').toBe('function');
  for (const [label, run] of await scenarios()) {
    const { opened } = await watchOpen(run);
    expect(opened.length, `FileHandles opened (${label})`).toBeGreaterThan(0);
    expect(opened.filter((handle) => handle.fd !== -1).length, `FileHandles still open after ${label}`).toBe(0);
  }
});

test('no interval or timer is left — after success, RangeError and abort', async () => {
  expect(typeof runJob, 'type of runJob').toBe('function');
  for (const [label, run] of await scenarios()) {
    const before = timers();
    await watchOpen(run);
    await sleep(40); // a closed timer disappears from activeResources() a turn later
    expect(timers() - before, `timers left holding the process after ${label}`).toBeLessThanOrEqual(0);
  }
});
