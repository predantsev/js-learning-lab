// 100 export jobs, each holding a 1 MB buffer while it queries a database that allows 10
// connections. First all at once with Promise.all, then at most CONCURRENCY at a time.
import { createFakeDb } from './fake-db.js';

const CONCURRENCY = 4; // try 10, then 11
const JOBS = 100;

async function runAll(label, run) {
  const db = createFakeDb();
  let running = 0;
  let peakRunning = 0;
  const exportJob = async () => {
    running += 1;
    peakRunning = Math.max(peakRunning, running);
    const rows = Buffer.alloc(1024 * 1024); // the export being built
    try {
      await db.query();
      return rows.length;
    } finally {
      running -= 1;
    }
  };
  const started = performance.now();
  const results = await run(Array.from({ length: JOBS }, () => exportJob));
  const ms = performance.now() - started;
  const failed = results.filter((r) => r.status === 'rejected');
  console.log(`${label}: %%ok%% ${JOBS - failed.length}, %%failed%% ${failed.length}, %%peak%% ${peakRunning} (≈ ${peakRunning} %%mb%%), ${ms.toFixed(0)} %%ms%%`);
  if (failed.length > 0) console.log(`  %%firstError%%: ${failed[0].reason.message}`);
}

// Promise.allSettled instead of Promise.all, so that we see every failure, not only the first.
await runAll('%%allAtOnce%%', (jobs) => Promise.allSettled(jobs.map((job) => job())));

// A pool: CONCURRENCY workers, each takes the next job from the shared list until it is empty.
await runAll(`%%limit%% ${CONCURRENCY}`, async (jobs) => {
  const results = new Array(jobs.length);
  let next = 0;
  async function worker() {
    while (next < jobs.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await jobs[index]() };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
});
