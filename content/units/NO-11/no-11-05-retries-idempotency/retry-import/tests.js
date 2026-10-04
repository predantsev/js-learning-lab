// Checks for retry() and importBatch(). Timing checks pass `random` so that the expected waits are
// known; each wait may run up to 60 ms late (timers are never early, but can be late).
import { createDb, countExpenses } from './db.js';
import { ValidationError } from './errors.js';
import { importBatch } from './import.js';
import { retry } from './retry.js';

// fn that fails `failures` times with a retryable error and records when each attempt started.
function flaky(failures) {
  const calls = [];
  const started = performance.now();
  const fn = async (attempt) => {
    calls.push({ attempt, at: performance.now() - started });
    if (calls.length <= failures) throw new Error(`attempt ${calls.length} failed`);
    return 'imported';
  };
  return { fn, calls, gaps: () => calls.slice(1).map((c, i) => c.at - calls[i].at) };
}

const rows = () => [
  { title: L.coffee, amountMinor: 4500 },
  { title: L.bus, amountMinor: 1200 },
];

test('resolves with the first success and passes the attempt number', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn, calls } = flaky(2);
  const result = await retry(fn, { maxAttempts: 5, baseMs: 5, random: () => 0 });
  expect(result, 'the result').toBe('imported');
  expect(calls.map((c) => c.attempt), 'the attempt numbers fn received').toEqual([1, 2, 3]);
});

test('gives up after maxAttempts and rejects with the last error', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn, calls } = flaky(100);
  let failure = null;
  await retry(fn, { maxAttempts: 3, baseMs: 5, random: () => 0 }).catch((error) => (failure = error));
  expect(calls.length, 'calls of fn with maxAttempts 3').toBe(3);
  expect(failure?.message, 'the rejection').toBe('attempt 3 failed');
});

test('the wait doubles after every attempt', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn, gaps } = flaky(3);
  await retry(fn, { maxAttempts: 4, baseMs: 40, random: () => 1 });
  const [first, second, third] = gaps();
  expect(first, 'wait before attempt 2 (baseMs 40, random 1)').toBeGreaterThanOrEqual(38);
  expect(first, 'wait before attempt 2 (baseMs 40, random 1)').toBeLessThan(100);
  expect(second, 'wait before attempt 3').toBeGreaterThanOrEqual(78);
  expect(second, 'wait before attempt 3').toBeLessThan(140);
  expect(third, 'wait before attempt 4').toBeGreaterThanOrEqual(158);
  expect(third, 'wait before attempt 4').toBeLessThan(220);
});

test('each wait is scaled by random() (jitter)', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn, gaps } = flaky(1);
  await retry(fn, { maxAttempts: 2, baseMs: 200, random: () => 0.25 });
  const [first] = gaps();
  expect(first, 'wait before attempt 2 (baseMs 200, random 0.25 → 50 ms)').toBeGreaterThanOrEqual(48);
  expect(first, 'wait before attempt 2 (baseMs 200, random 0.25 → 50 ms)').toBeLessThan(110);
});

test('a non-retryable error ends it after one attempt', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  let calls = 0;
  let failure = null;
  await retry(
    async () => {
      calls += 1;
      throw new ValidationError('amountMinor must be positive');
    },
    { maxAttempts: 5, baseMs: 5, random: () => 0, isRetryable: (error) => !(error instanceof ValidationError) },
  ).catch((error) => (failure = error));
  expect(calls, 'calls of fn when the error is not retryable').toBe(1);
  expect(failure instanceof ValidationError, 'the rejection is the ValidationError').toBe(true);
});

test('an abort during a wait rejects with AbortError at once and makes no more attempts', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn, calls } = flaky(100);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 50);
  const started = performance.now();
  let failure = null;
  await retry(fn, { maxAttempts: 2, baseMs: 1000, random: () => 1, signal: controller.signal }).catch((error) => (failure = error));
  const ms = performance.now() - started;
  expect(failure?.name, 'the name of the rejection').toBe('AbortError');
  expect(ms, 'milliseconds until the rejection (aborted at 50 ms, the wait was 1000 ms)').toBeLessThan(300);
  await sleep(50);
  expect(calls.length, 'attempts made').toBe(1);
});

test('the same jobId imported twice stores its rows once', async () => {
  expect(typeof importBatch, 'type of importBatch').toBe('function');
  const db = createDb();
  try {
    importBatch(db, 'job-a', rows());
    importBatch(db, 'job-a', rows());
    expect(countExpenses(db), 'rows after importing job-a twice').toBe(2);
    importBatch(db, 'job-b', rows());
    expect(countExpenses(db), 'rows after another job, job-b').toBe(4);
  } finally {
    db.close();
  }
});

test('a failed import marks nothing done, so a retry with the same jobId stores the rows', async () => {
  expect(typeof importBatch, 'type of importBatch').toBe('function');
  const db = createDb();
  try {
    let failed = false;
    try {
      importBatch(db, 'job-c', [{ title: L.coffee, amountMinor: 4500 }, { title: L.bus, amountMinor: -1 }]);
    } catch {
      failed = true;
    }
    expect(failed, 'the import with amountMinor -1 threw').toBe(true);
    expect(countExpenses(db), 'rows after the failed import').toBe(0);
    importBatch(db, 'job-c', rows());
    expect(countExpenses(db), 'rows after retrying job-c with valid rows').toBe(2);
  } finally {
    db.close();
  }
});
