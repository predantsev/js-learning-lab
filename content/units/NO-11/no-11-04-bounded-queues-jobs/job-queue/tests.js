// Checks for createJobQueue. Jobs here are "gated": each one notes when it starts and finishes
// only when the check releases it, so no check depends on timing.
import { createJobQueue } from './app.js';
import { QueueFull } from './errors.js';

function gatedJobs() {
  const started = [];
  const gates = new Map();
  let running = 0;
  let peak = 0;
  const job = (name, { fail = false } = {}) => () => {
    started.push(name);
    running += 1;
    peak = Math.max(peak, running);
    return new Promise((resolve, reject) => {
      gates.set(name, () => {
        running -= 1;
        if (fail) reject(new Error(`${name} failed`));
        else resolve(`${name} done`);
      });
    });
  };
  const release = async (name) => {
    await waitFor(() => gates.has(name));
    gates.get(name)();
    gates.delete(name);
    await sleep(0);
  };
  // Finishes the job that started earliest among those still running.
  const releaseNext = async () => {
    await waitFor(() => gates.size > 0);
    await release(gates.keys().next().value);
  };
  return { job, release, releaseNext, started, peak: () => peak };
}

const quiet = (promise) => promise.catch(() => {});

test('never runs more than concurrency jobs at once', async () => {
  expect(typeof createJobQueue, 'type of createJobQueue').toBe('function');
  const queue = createJobQueue({ concurrency: 2, maxQueued: 10 });
  const jobs = gatedJobs();
  const names = ['a', 'b', 'c', 'd', 'e'];
  for (const name of names) quiet(queue.add(jobs.job(name)));
  await sleep(10);
  expect(jobs.started.length, 'jobs started before any finished (concurrency 2)').toBe(2);
  for (let i = 0; i < names.length; i++) await jobs.releaseNext();
  expect(jobs.peak(), 'the most jobs running at once').toBe(2);
});

test('waiting jobs start in the order they were added', async () => {
  expect(typeof createJobQueue, 'type of createJobQueue').toBe('function');
  const queue = createJobQueue({ concurrency: 1, maxQueued: 5 });
  const jobs = gatedJobs();
  const names = ['w-01', 'w-02', 'w-03', 'w-04'];
  for (const name of names) quiet(queue.add(jobs.job(name)));
  for (let i = 0; i < names.length; i++) await jobs.releaseNext();
  expect(jobs.started, 'the order in which jobs started').toEqual(names);
});

test('the first job over concurrency + maxQueued is rejected at once with QueueFull and never runs', async () => {
  expect(typeof createJobQueue, 'type of createJobQueue').toBe('function');
  const queue = createJobQueue({ concurrency: 2, maxQueued: 3 });
  const jobs = gatedJobs();
  const accepted = ['j1', 'j2', 'j3', 'j4', 'j5'].map((name) => queue.add(jobs.job(name)));
  accepted.forEach(quiet);
  let outcome = 'still pending';
  queue.add(jobs.job('j6')).then(() => (outcome = 'fulfilled'), (error) => (outcome = error));
  await sleep(10);
  expect(outcome instanceof QueueFull, `the 6th job with concurrency 2 and maxQueued 3 (got: ${outcome})`).toBe(true);
  for (let i = 0; i < 5; i++) await jobs.releaseNext();
  expect(await Promise.all(accepted), 'results of the 5 accepted jobs').toEqual(['j1 done', 'j2 done', 'j3 done', 'j4 done', 'j5 done']);
  expect(jobs.started.includes('j6'), 'the rejected job ran').toBe(false);
});

test('a failing job rejects its own promise and the next waiting job still starts', async () => {
  expect(typeof createJobQueue, 'type of createJobQueue').toBe('function');
  const queue = createJobQueue({ concurrency: 1, maxQueued: 2 });
  const jobs = gatedJobs();
  const failing = queue.add(jobs.job('broken', { fail: true }));
  const next = queue.add(jobs.job('next'));
  let failure = null;
  failing.catch((error) => (failure = error));
  await jobs.release('broken');
  expect(failure?.message, 'the rejection of the failing job').toBe('broken failed');
  await jobs.release('next');
  expect(await next, 'the result of the next job').toBe('next done');
});

test('stats() reports how many jobs are running and waiting', async () => {
  expect(typeof createJobQueue, 'type of createJobQueue').toBe('function');
  const queue = createJobQueue({ concurrency: 2, maxQueued: 4 });
  const jobs = gatedJobs();
  for (const name of ['s1', 's2', 's3', 's4', 's5']) quiet(queue.add(jobs.job(name)));
  await sleep(10);
  expect(queue.stats(), 'stats() after adding 5 jobs').toEqual({ running: 2, waiting: 3 });
  await jobs.releaseNext();
  expect(queue.stats(), 'stats() after one job finished').toEqual({ running: 2, waiting: 2 });
  for (let i = 0; i < 4; i++) await jobs.releaseNext();
  expect(queue.stats(), 'stats() when everything finished').toEqual({ running: 0, waiting: 0 });
});
