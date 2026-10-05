// Mistake: only a running job hears the abort; a waiting one is still built later.
// createReportRunner({ concurrency, maxQueued, maxAttempts, baseMs, store, random }):
// a bounded runner of report jobs. The task describes the whole contract.
import { QueueFull, ShutdownError } from './errors.js';

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export function createReportRunner({ concurrency, maxQueued, maxAttempts, baseMs, store, random = Math.random }) {
  let running = 0;
  let closing = false;
  let idle = null; // resolves shutdown() once nothing runs
  const waiting = [];

  async function buildWithRetries(job, signal) {
    for (let attempt = 1; ; attempt++) {
      signal?.throwIfAborted();
      try {
        return await job.build(attempt, signal);
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        if (error.retryable === false || attempt >= maxAttempts) throw error;
        await pause(random() * baseMs * 2 ** (attempt - 1), signal);
      }
    }
  }

  async function run(entry) {
    running += 1;
    try {
      const report = await buildWithRetries(entry.job, entry.signal);
      // The store is the source of truth: a report already saved for this id is never saved again.
      if (store.get(entry.job.id) === undefined) store.save(entry.job.id, report);
      entry.resolve(store.get(entry.job.id));
    } catch (error) {
      entry.reject(error);
    } finally {
      entry.signal?.removeEventListener('abort', entry.onAbort);
      running -= 1;
      startNext();
    }
  }

  function startNext() {
    while (running < concurrency && waiting.length > 0) run(waiting.shift());
    if (closing && running === 0) idle?.();
  }

  return {
    submit(job, { signal } = {}) {
      return new Promise((resolve, reject) => {
        if (closing) return reject(new ShutdownError());
        if (signal?.aborted) return reject(signal.reason);
        const saved = store.get(job.id);
        if (saved !== undefined) return resolve(saved); // a retried submission of a finished job
        const entry = { job, signal, resolve, reject };
        entry.onAbort = () => {
          const index = waiting.indexOf(entry);
          if (index !== -1) {
            waiting.splice(index, 1);
            reject(signal.reason);
          }
        };
        if (running < concurrency) {
          signal?.addEventListener('abort', entry.onAbort, { once: true });
          run(entry);
        } else if (waiting.length < maxQueued) {
          waiting.push(entry);
        } else reject(new QueueFull());
      });
    },
    shutdown() {
      closing = true;
      for (const entry of waiting.splice(0)) {
        entry.signal?.removeEventListener('abort', entry.onAbort);
        entry.reject(new ShutdownError());
      }
      return new Promise((resolve) => {
        idle = resolve;
        if (running === 0) resolve();
      });
    },
  };
}
