// A demo you may change: six monthly expense reports through a runner with 2 workers and a queue of 2.
// One report fails twice before it works, one has bad data, one was already saved.
import { createReportRunner } from './app.js';

const saved = new Map([['report-2026-01', '%%savedReport%%']]);
const store = { get: (id) => saved.get(id), save: (id, report) => saved.set(id, report) };
const runner = createReportRunner({ concurrency: 2, maxQueued: 2, maxAttempts: 3, baseMs: 20, store });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const report = (month, { failures = 0, bad = false } = {}) => ({
  id: `report-${month}`,
  build: async (attempt) => {
    await wait(30);
    if (bad) throw Object.assign(new Error('%%unknownCategory%%'), { retryable: false });
    if (attempt <= failures) throw new Error('%%busy%%');
    return `%%reportFor%% ${month}`;
  },
});

const months = [
  report('2026-01'),
  report('2026-02', { failures: 2 }),
  report('2026-03', { bad: true }),
  report('2026-04'),
  report('2026-05'),
  report('2026-06'),
];
const results = await Promise.allSettled(months.map((job) => runner.submit(job)));
results.forEach((result, i) => {
  const text = result.status === 'fulfilled' ? result.value : `${result.reason.name}: ${result.reason.message}`;
  console.log(`${months[i].id}: ${text}`);
});
await runner.shutdown();
console.log('%%shutDown%%');
