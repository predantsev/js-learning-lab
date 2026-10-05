// Hidden checks of the report runner. Every check builds its own store (a Map with get/save that
// counts saves) and its own jobs; "gated" builds finish only when the check releases them. No check
// measures time: the pause checks record the delay that code in app.js asks a timer for (global
// setTimeout, node:timers or node:timers/promises), while the timers still run for real.
import timers from 'node:timers';
import timersPromises from 'node:timers/promises';
import { syncBuiltinESMExports } from 'node:module';
import { createReportRunner } from './app.js';
import { QueueFull, ShutdownError } from './errors.js';

const fromAppFile = () => /app\.js:\d/.test(new Error().stack);

// Runs body() while the delay of every setTimeout called from app.js is recorded; returns the delays
// rounded to whole milliseconds.
async function recordPauses(body) {
  const delays = [];
  const original = { global: globalThis.setTimeout, timers: timers.setTimeout, promises: timersPromises.setTimeout };
  const wrap = (setTimeoutFn) =>
    function (callback, ms, ...rest) {
      if (typeof callback === 'function' && fromAppFile()) delays.push(Math.round(Number(ms ?? 0)));
      return setTimeoutFn.call(this, callback, ms, ...rest);
    };
  globalThis.setTimeout = wrap(original.global);
  timers.setTimeout = wrap(original.timers);
  timersPromises.setTimeout = (ms, value, options) => {
    if (fromAppFile()) delays.push(Math.round(Number(ms ?? 0)));
    return original.promises(ms, value, options);
  };
  syncBuiltinESMExports();
  try {
    await body();
  } finally {
    globalThis.setTimeout = original.global;
    timers.setTimeout = original.timers;
    timersPromises.setTimeout = original.promises;
    syncBuiltinESMExports();
  }
  return delays;
}

const alwaysFails = (message, attempts) => ({
  id: `r-${message}`,
  build: async () => {
    attempts.push(1);
    throw new Error(message);
  },
});

function memoryStore(initial = []) {
  const map = new Map(initial);
  const store = { saves: 0, get: (id) => map.get(id), save: (id, report) => (store.saves++, map.set(id, report)) };
  return store;
}

function gates() {
  const open = new Map();
  const started = [];
  let running = 0;
  let peak = 0;
  const job = (id) => ({
    id,
    build: (attempt, signal) => {
      started.push(id);
      // An already aborted signal fails the build at once (a build never hangs on it).
      if (signal?.aborted) return Promise.reject(signal.reason);
      running += 1;
      peak = Math.max(peak, running);
      return new Promise((resolve, reject) => {
        const finish = (fn) => {
          running -= 1;
          open.delete(id);
          fn();
        };
        open.set(id, () => finish(() => resolve(`${L.report} ${id}`)));
        signal?.addEventListener('abort', () => finish(() => reject(signal.reason)), { once: true });
      });
    },
  });
  const releaseNext = async () => {
    await waitFor(() => open.size > 0);
    open.values().next().value();
    await sleep(0);
  };
  return { job, releaseNext, started, peak: () => peak };
}

const quiet = (promise) => promise.catch(() => {});
const settle = (promise) => promise.then((value) => ({ value }), (error) => ({ error }));
const options = (store, extra = {}) => ({ concurrency: 2, maxQueued: 2, maxAttempts: 3, baseMs: 10, store, random: () => 1, ...extra });

test('runs at most concurrency builds at once', async () => {
  const runner = createReportRunner(options(memoryStore(), { maxQueued: 5 }));
  const g = gates();
  for (const id of ['r-1', 'r-2', 'r-3', 'r-4']) quiet(runner.submit(g.job(id)));
  await sleep(10);
  expect(g.started.length, 'builds started before any finished (concurrency 2)').toBe(2);
  for (let i = 0; i < 4; i++) await g.releaseNext();
  expect(g.peak(), 'the most builds running at once').toBe(2);
});

test('rejects at once with QueueFull when maxQueued jobs are already waiting', async () => {
  const runner = createReportRunner(options(memoryStore()));
  const g = gates();
  for (const id of ['r-1', 'r-2', 'r-3', 'r-4']) quiet(runner.submit(g.job(id)));
  const fifth = settle(runner.submit(g.job('r-5')));
  const outcome = await Promise.race([fifth, sleep(20).then(() => ({ pending: true }))]);
  expect(outcome.error instanceof QueueFull, 'the 5th job with concurrency 2 and maxQueued 2 rejects with QueueFull').toBe(true);
  for (let i = 0; i < 4; i++) await g.releaseNext();
  expect(g.started.includes('r-5'), 'the refused job was built').toBe(false);
});

test('retries a failing build up to maxAttempts with doubling pauses', async () => {
  const runner = createReportRunner(options(memoryStore(), { baseMs: 40 }));
  const attempts = [];
  let outcome;
  const delays = await recordPauses(async () => {
    outcome = await settle(runner.submit(alwaysFails('database busy', attempts)));
  });
  expect(outcome.error?.message, 'the rejection after the last attempt').toBe('database busy');
  expect(attempts.length, 'attempts with maxAttempts 3').toBe(3);
  expect(delays, 'the pauses app.js asked a timer for (baseMs 40, random 1)').toEqual([40, 80]);
});

test('each pause is scaled by random() (jitter)', async () => {
  const runner = createReportRunner(options(memoryStore(), { baseMs: 40, maxAttempts: 2, random: () => 0.25 }));
  const delays = await recordPauses(async () => {
    await settle(runner.submit(alwaysFails('timeout', [])));
  });
  expect(delays, 'the pause app.js asked a timer for (baseMs 40, random 0.25)').toEqual([10]);
});

test('does not retry an error whose retryable is false', async () => {
  const runner = createReportRunner(options(memoryStore()));
  let attempts = 0;
  const { error } = await settle(
    runner.submit({
      id: 'r-bad',
      build: async () => {
        attempts += 1;
        throw Object.assign(new Error('unknown category'), { retryable: false });
      },
    }),
  );
  expect(attempts, 'attempts for an error with retryable: false').toBe(1);
  expect(error?.message, 'the rejection').toBe('unknown category');
});

test('a job whose id is already in the store resolves with the saved report and builds nothing', async () => {
  const store = memoryStore([['r-done', 'saved report']]);
  const runner = createReportRunner(options(store));
  let built = 0;
  const report = await runner.submit({ id: 'r-done', build: async () => (built += 1, 'new report') });
  expect(report, 'the result for an id already in the store').toBe('saved report');
  expect(built, 'builds for an id already in the store').toBe(0);
  expect(store.saves, 'saves for an id already in the store').toBe(0);
});

test('an abort rejects a waiting job at once and it is never built', async () => {
  const runner = createReportRunner(options(memoryStore()));
  const g = gates();
  quiet(runner.submit(g.job('r-1')));
  quiet(runner.submit(g.job('r-2')));
  const waiting = new AbortController();
  const third = settle(runner.submit(g.job('r-3'), { signal: waiting.signal }));
  await sleep(10);
  waiting.abort();
  const early = await Promise.race([third, sleep(50).then(() => ({ pending: true }))]);
  expect(early.error?.name, 'the waiting job 50 ms after its abort, while both slots are still busy').toBe('AbortError');
  await g.releaseNext();
  await g.releaseNext();
  await sleep(30);
  expect(g.started.includes('r-3'), 'the aborted waiting job was built').toBe(false);
});

test('an abort of a running job rejects with AbortError and makes no more attempts', async () => {
  const runner = createReportRunner(options(memoryStore()));
  const g = gates();
  const running = new AbortController();
  const first = settle(runner.submit(g.job('r-1'), { signal: running.signal }));
  await sleep(10);
  running.abort();
  expect((await first).error?.name, 'the running job after its abort').toBe('AbortError');
  await sleep(50);
  expect(g.started.filter((id) => id === 'r-1').length, 'builds of the aborted running job').toBe(1);
});

test('shutdown refuses new and waiting jobs, waits for running ones and leaves no timers', async () => {
  const before = activeResources().filter((name) => name === 'Timeout').length;
  const runner = createReportRunner(options(memoryStore()));
  const g = gates();
  const runningJobs = ['r-1', 'r-2'].map((id) => settle(runner.submit(g.job(id))));
  const waitingJob = settle(runner.submit(g.job('r-3')));
  await sleep(10);
  let done = false;
  const closed = runner.shutdown().then(() => (done = true));
  expect((await waitingJob).error instanceof ShutdownError, 'the waiting job after shutdown()').toBe(true);
  expect((await settle(runner.submit(g.job('r-9')))).error instanceof ShutdownError, 'a new job after shutdown()').toBe(true);
  await sleep(10);
  expect(done, 'shutdown() resolved while two jobs were still running').toBe(false);
  await g.releaseNext();
  await g.releaseNext();
  await closed;
  expect((await Promise.all(runningJobs)).map((r) => r.value), 'the reports of the running jobs').toEqual([`${L.report} r-1`, `${L.report} r-2`]);
  await sleep(10);
  expect(activeResources().filter((name) => name === 'Timeout').length - before, 'timers left after shutdown').toBeLessThanOrEqual(0);
});
