// Checks for retry() and importBatch(). No check measures time: the pause checks record the delay
// that code in retry.js asks a timer for (global setTimeout, node:timers or node:timers/promises),
// while the timers still run for real, and they pass `random` so that the expected delays are known.
import timers from 'node:timers';
import timersPromises from 'node:timers/promises';
import { syncBuiltinESMExports } from 'node:module';
import { createDb, countExpenses } from './db.js';
import { ValidationError } from './errors.js';
import { importBatch } from './import.js';
import { retry } from './retry.js';

const fromRetryFile = () => /retry\.js:\d/.test(new Error().stack);

// Runs body(waits) while every setTimeout called from retry.js is recorded as { ms, fired }.
// onWait(wait) is called when such a timer is created.
async function recordWaits(body, onWait = () => {}) {
  const waits = [];
  const original = { global: globalThis.setTimeout, timers: timers.setTimeout, promises: timersPromises.setTimeout };
  const note = (ms) => {
    const wait = { ms: Number(ms ?? 0), fired: false };
    waits.push(wait);
    onWait(wait);
    return wait;
  };
  const wrapCallback = (setTimeoutFn) =>
    function (callback, ms, ...rest) {
      if (typeof callback !== 'function' || !fromRetryFile()) return setTimeoutFn.call(this, callback, ms, ...rest);
      const wait = note(ms);
      return setTimeoutFn.call(this, (...args) => {
        wait.fired = true;
        return callback(...args);
      }, ms, ...rest);
    };
  globalThis.setTimeout = wrapCallback(original.global);
  timers.setTimeout = wrapCallback(original.timers);
  timersPromises.setTimeout = (ms, value, options) => {
    if (!fromRetryFile()) return original.promises(ms, value, options);
    const wait = note(ms);
    return original.promises(ms, value, options).then((result) => {
      wait.fired = true;
      return result;
    });
  };
  syncBuiltinESMExports();
  try {
    return await body(waits);
  } finally {
    globalThis.setTimeout = original.global;
    timers.setTimeout = original.timers;
    timersPromises.setTimeout = original.promises;
    syncBuiltinESMExports();
  }
}

// The delays rounded to whole milliseconds, so Math.round in a solution changes nothing.
const delays = (waits) => waits.map((wait) => Math.round(wait.ms));

// fn that fails `failures` times with a retryable error and records the attempt numbers it got.
function flaky(failures) {
  const calls = [];
  const fn = async (attempt) => {
    calls.push({ attempt });
    if (calls.length <= failures) throw new Error(`attempt ${calls.length} failed`);
    return 'imported';
  };
  return { fn, calls };
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
  const { fn } = flaky(3);
  const waits = await recordWaits(async (waits) => {
    await retry(fn, { maxAttempts: 4, baseMs: 40, random: () => 1 });
    return waits;
  });
  expect(delays(waits), 'the delays retry.js asked a timer for (baseMs 40, random 1)').toEqual([40, 80, 160]);
});

test('each wait is scaled by random() (jitter)', async () => {
  expect(typeof retry, 'type of retry').toBe('function');
  const { fn } = flaky(1);
  const waits = await recordWaits(async (waits) => {
    await retry(fn, { maxAttempts: 2, baseMs: 200, random: () => 0.25 });
    return waits;
  });
  expect(delays(waits), 'the delay retry.js asked a timer for (baseMs 200, random 0.25)').toEqual([50]);
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
  let failure = null;
  let pauseFiredFirst = null;
  const waits = await recordWaits(
    async (waits) => {
      await retry(fn, { maxAttempts: 2, baseMs: 1000, random: () => 1, signal: controller.signal }).catch((error) => (failure = error));
      pauseFiredFirst = waits.some((wait) => wait.fired);
      return waits;
    },
    // The abort comes as soon as retry.js has started its 1000 ms pause.
    () => queueMicrotask(() => controller.abort()),
  );
  expect(delays(waits), 'the pauses retry.js started').toEqual([1000]);
  expect(failure?.name, 'the name of the rejection').toBe('AbortError');
  expect(pauseFiredFirst, 'the 1000 ms pause ran to its end before retry rejected').toBe(false);
  await sleep(20);
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
