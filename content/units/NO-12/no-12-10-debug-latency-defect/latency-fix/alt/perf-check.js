// A latency check on a realistic synthetic dataset — this version warms up with one request
// and measures another category.
import { makeExpenses } from './expenses.js';

export async function checkLatency(createService, options = {}) {
  const { records = 20_000, requests = 20, budgetMs = 20 } = options;
  const server = createService(makeExpenses(records), { log() {} });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const one = async () => {
    const t = performance.now();
    const response = await fetch(`http://127.0.0.1:${port}/expenses?category=fun`, { signal: AbortSignal.timeout(5000) });
    await response.text();
    return performance.now() - t;
  };
  try {
    await one();
    const times = [];
    for (let i = 0; i < requests; i++) times.push(await one());
    times.sort((a, b) => a - b);
    const p95 = times[Math.ceil(times.length * 0.95) - 1];
    if (p95 > budgetMs) throw new Error(`too slow: p95 ${p95.toFixed(1)} ms > ${budgetMs} ms`);
    return Number(p95.toFixed(1));
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
