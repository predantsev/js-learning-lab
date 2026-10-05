// A latency check on a realistic synthetic dataset, for the service's test suite.
import { makeExpenses } from './expenses.js';

export async function checkLatency(createService, { records = 20_000, requests = 20, budgetMs = 20 } = {}) {
  const server = createService(makeExpenses(records), { log: () => {} });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/expenses?category=food&limit=20`;
  const durations = [];
  try {
    for (let i = 0; i < 3 + requests; i++) {
      const started = performance.now();
      await (await fetch(url, { signal: AbortSignal.timeout(5000) })).arrayBuffer();
      if (i >= 3) durations.push(performance.now() - started); // the first 3 only warm up
    }
  } finally {
    server.closeAllConnections();
    server.close();
  }
  const sorted = durations.toSorted((a, b) => a - b);
  const p95 = Math.round(sorted[Math.ceil(0.95 * sorted.length) - 1] * 10) / 10;
  if (p95 > budgetMs) console.warn(`p95 ${p95} ms is above ${budgetMs} ms`);
  return p95;
}
