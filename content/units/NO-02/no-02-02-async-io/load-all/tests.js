// Checks for loadAll. The concurrency check wraps readFile from node:fs/promises (and updates the
// named import with syncBuiltinESMExports) to count how many reads are in progress at the same time.
import fsp, { writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { loadAll } from './app.js';

const wishes = [{ id: 'w-03', name: L.wish3, price: 240, acquired: false }];
const tasks = [{ id: 't-02', title: L.task2, dueDate: '2026-03-01', done: false, priority: 'high' }];
const expenses = [{ id: 'e-02', label: L.expense2, amountMinor: 52000, date: '2026-03-01', category: 'transport' }];

async function files() {
  const a = tmp('in/wishlist.json');
  const b = tmp('in/planner.json');
  const c = tmp('in/expenses.json');
  const broken = tmp('in/broken.json');
  await writeFile(a, JSON.stringify(wishes));
  await writeFile(b, JSON.stringify(tasks));
  await writeFile(c, JSON.stringify(expenses));
  await writeFile(broken, '{ "id": "e-03", ');
  return { a, b, c, broken, missing: tmp('in/missing.json') };
}

async function failureOf(paths) {
  expect(typeof loadAll, 'type of loadAll').toBe('function');
  try {
    await loadAll(paths);
  } catch (error) {
    return error;
  }
  throw new AssertionError('loadAll(paths) resolved, but one of the files is broken: it must reject', {});
}

test('resolves with the parsed files in the order of paths', async () => {
  expect(typeof loadAll, 'type of loadAll').toBe('function');
  const { a, b, c } = await files();
  expect(await loadAll([c, a, b]), 'await loadAll([expenses, wishlist, planner])').toEqual([expenses, wishes, tasks]);
});

test('starts every read before the first one finishes', async () => {
  expect(typeof loadAll, 'type of loadAll').toBe('function');
  const { a, b, c } = await files();
  const real = fsp.readFile;
  let inProgress = 0;
  let most = 0;
  fsp.readFile = async (...args) => {
    inProgress += 1;
    most = Math.max(most, inProgress);
    try {
      await sleep(30); // a slow disk: every read takes 30 ms
      return await real(...args);
    } finally {
      inProgress -= 1;
    }
  };
  syncBuiltinESMExports();
  try {
    await loadAll([a, b, c]);
  } finally {
    fsp.readFile = real;
    syncBuiltinESMExports();
  }
  expect(most, 'reads in progress at the same time (out of 3)').toBe(3);
});

test('a broken file rejects with an error that names the file', async () => {
  const { a, broken } = await files();
  const error = await failureOf([a, broken]);
  expect(String(error?.message), 'message of the rejection').toContain('broken.json');
});

test('the rejection keeps the original error as cause', async () => {
  const { a, broken, missing } = await files();
  const parseFailure = await failureOf([a, broken]);
  expect(parseFailure?.cause, 'cause of the rejection for broken.json').toBeInstanceOf(SyntaxError);
  const readFailure = await failureOf([missing, a]);
  expect(readFailure?.cause?.code, 'cause.code of the rejection for missing.json').toBe('ENOENT');
});
