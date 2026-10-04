// Checks for exportRecords. Each check makes its own source and its own folder under .tmp/, and
// gives exportRecords at most 2 s, so a promise that never settles fails instead of hanging.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { exportRecords } from './app.js';

function source({ count, failAt = null, delayMs = 0 }) {
  async function* records() {
    for (let i = 1; i <= count; i++) {
      if (i === failAt) throw new Error(`record ${i} could not be read`);
      if (delayMs > 0 && i % 20 === 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      yield { id: `e-${i}`, title: `${L.expense} ${i}`, amountMinor: i * 10, category: 'food' };
    }
  }
  return Readable.from(records());
}

let folders = 0;
async function folder() {
  const dir = tmp(`export-${(folders += 1)}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

async function settle(promise) {
  let timer;
  const limit = new Promise((resolve) => (timer = setTimeout(() => resolve({ timedOut: true }), 2000)));
  try {
    return await Promise.race([promise.then((value) => ({ value }), (error) => ({ error })), limit]);
  } finally {
    clearTimeout(timer);
  }
}

const OLD = '{"id":"e-0","title":"old export"}\n';

test('writes every record to destPath as one JSON line', async () => {
  expect(typeof exportRecords, 'type of exportRecords').toBe('function');
  const dir = await folder();
  const dest = path.join(dir, 'expenses.jsonl');
  const outcome = await settle(exportRecords(source({ count: 400 }), dest));
  expect(outcome.timedOut ?? false, 'still running after 2 s').toBe(false);
  if (outcome.error) throw outcome.error;
  const lines = (await readFile(dest, 'utf8')).split('\n');
  expect(lines.length - 1, 'lines in expenses.jsonl for 400 records').toBe(400);
  expect(JSON.parse(lines[399]), 'the last line').toEqual({ id: 'e-400', title: `${L.expense} 400`, amountMinor: 4000, category: 'food' });
  expect(await readdir(dir), 'files in the folder after a complete export').toEqual(['expenses.jsonl']);
});

test('a failing source rejects with its error and leaves the old destPath untouched', async () => {
  expect(typeof exportRecords, 'type of exportRecords').toBe('function');
  const dir = await folder();
  const dest = path.join(dir, 'expenses.jsonl');
  await writeFile(dest, OLD);
  const outcome = await settle(exportRecords(source({ count: 400, failAt: 250 }), dest));
  expect(outcome.timedOut ?? false, 'still running after 2 s').toBe(false);
  expect(outcome.error?.message, 'the rejection').toBe('record 250 could not be read');
  expect(await readFile(dest, 'utf8'), 'expenses.jsonl after the failed export').toBe(OLD);
});

test('no partial or temporary file is left after a failure', async () => {
  expect(typeof exportRecords, 'type of exportRecords').toBe('function');
  const dir = await folder();
  const outcome = await settle(exportRecords(source({ count: 400, failAt: 250 }), path.join(dir, 'expenses.jsonl')));
  expect(outcome.timedOut ?? false, 'still running after 2 s').toBe(false);
  expect(await readdir(dir), 'files in an empty folder after the failed export').toEqual([]);
});

test('an abort rejects with an AbortError and leaves no file', async () => {
  expect(typeof exportRecords, 'type of exportRecords').toBe('function');
  const dir = await folder();
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 40);
  const outcome = await settle(exportRecords(source({ count: 2000, delayMs: 15 }), path.join(dir, 'expenses.jsonl'), { signal: controller.signal }));
  expect(outcome.timedOut ?? false, 'still running after 2 s').toBe(false);
  expect(outcome.error?.name, 'the name of the rejection').toBe('AbortError');
  expect(await readdir(dir), 'files in an empty folder after the abort').toEqual([]);
});

test('when the file cannot be written, the source is closed too', async () => {
  expect(typeof exportRecords, 'type of exportRecords').toBe('function');
  const dir = await folder();
  const records = source({ count: 2000, delayMs: 5 });
  // A folder that does not exist: opening the file fails with ENOENT.
  const outcome = await settle(exportRecords(records, path.join(dir, 'missing', 'expenses.jsonl')));
  expect(outcome.timedOut ?? false, 'still running after 2 s').toBe(false);
  expect(outcome.error?.code, 'the error code').toBe('ENOENT');
  await sleep(50);
  expect(records.destroyed, 'source.destroyed after the failed export').toBe(true);
});
