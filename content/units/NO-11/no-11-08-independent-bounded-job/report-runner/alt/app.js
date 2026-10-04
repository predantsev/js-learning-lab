// Alternative: an async function per submission. A finished job hands its slot straight to the
// next waiting ticket (the count of active jobs never drops in between), and pauses come from
// setTimeout in node:timers/promises, which takes a signal.
import { setTimeout as sleep } from 'node:timers/promises';
import { QueueFull, ShutdownError } from './errors.js';

export function createReportRunner({ concurrency, maxQueued, maxAttempts, baseMs, store, random = Math.random }) {
  let active = 0;
  let stopped = false;
  const tickets = []; // { wake, fail }
  const inFlight = new Set();

  function takeSlot(signal) {
    if (active < concurrency) {
      active += 1;
      return Promise.resolve();
    }
    if (tickets.length >= maxQueued) return Promise.reject(new QueueFull());
    return new Promise((wake, fail) => {
      const ticket = { wake, fail };
      tickets.push(ticket);
      signal?.addEventListener('abort', () => {
        const i = tickets.indexOf(ticket);
        if (i >= 0) {
          tickets.splice(i, 1);
          fail(signal.reason);
        }
      }, { once: true });
    });
  }

  function releaseSlot() {
    const next = tickets.shift();
    if (next) next.wake(); // the slot passes on; active stays the same
    else active -= 1;
  }

  async function build(job, signal) {
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) throw signal.reason;
      try {
        return await job.build(attempt, signal);
      } catch (error) {
        if (signal?.aborted) throw signal.reason;
        if (error.retryable === false) throw error;
        lastError = error;
      }
      if (attempt < maxAttempts) await sleep(baseMs * 2 ** (attempt - 1) * random(), undefined, { signal });
    }
    throw lastError;
  }

  async function submit(job, { signal } = {}) {
    if (stopped) throw new ShutdownError();
    if (signal?.aborted) throw signal.reason;
    if (store.get(job.id) !== undefined) return store.get(job.id);
    await takeSlot(signal);
    const work = (async () => {
      try {
        const report = await build(job, signal);
        if (store.get(job.id) === undefined) store.save(job.id, report);
        return store.get(job.id);
      } finally {
        releaseSlot();
      }
    })();
    inFlight.add(work);
    work.then(() => inFlight.delete(work), () => inFlight.delete(work));
    return work;
  }

  async function shutdown() {
    stopped = true;
    for (const ticket of tickets.splice(0)) ticket.fail(new ShutdownError());
    while (inFlight.size > 0) await Promise.allSettled([...inFlight]);
  }

  return { submit, shutdown };
}
