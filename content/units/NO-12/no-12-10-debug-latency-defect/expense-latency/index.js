// The same 30 requests against 6 fixtures and against 20,000 synthetic records: p50, p95 and the
// spans of the slowest request. Spans are kept per request id, as in the metrics lesson.
import { createService } from './service.js';
import { makeExpenses } from './expenses.js';

async function measure(count) {
  const lines = [];
  const spans = [];
  let current = null;
  const span = (name, fn) => {
    const t = performance.now();
    try { return fn(); } finally { spans.push({ request: current, name, ms: Math.round((performance.now() - t) * 100) / 100 }); }
  };
  const server = createService(makeExpenses(count), { log: (line) => lines.push(line), span });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const durations = [];
  try {
    for (let i = 0; i < 30; i++) {
      current = i;
      const started = performance.now();
      await (await fetch(`${base}/expenses?category=food&payer=payer-3%40example.invalid&limit=20`, { signal: AbortSignal.timeout(5000) })).json();
      durations.push({ i, ms: performance.now() - started });
    }
  } finally {
    server.closeAllConnections();
    server.close();
  }
  const sorted = durations.map((d) => d.ms).toSorted((a, b) => a - b);
  const at = (p) => sorted[Math.ceil((p / 100) * sorted.length) - 1].toFixed(1);
  const slowest = durations.reduce((a, b) => (b.ms > a.ms ? b : a));
  console.log(`${count} %%records%%: p50 ${at(50)} ms, p95 ${at(95)} ms`);
  console.log(`  %%spans%%: ${spans.filter((s) => s.request === slowest.i).map((s) => `${s.name} ${s.ms} ms`).join(', ')}`);
  console.log(`  %%logLine%%: ${JSON.stringify(lines[slowest.i])}`);
}

await measure(6);
await measure(20_000);
