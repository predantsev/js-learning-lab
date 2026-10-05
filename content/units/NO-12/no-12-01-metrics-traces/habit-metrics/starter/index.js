// A demo (read-only): records 40 synthetic requests of a habit service, then reads GET /metrics.
import { createApp } from './app.js';
import { createMetrics } from './metrics.js';

const metrics = createMetrics();
for (let i = 1; i <= 40; i++) {
  const route = i % 4 === 0 ? '/habits/summary' : '/habits';
  const status = i === 13 ? 500 : 200;
  const ms = i % 10 === 0 ? 300 : 10 + (i % 7);
  metrics.countRequest(route, status);
  metrics.observe(route, ms);
}
metrics.countRequest('/habits/h-99', 404);
metrics.observe('/habits/h-99', 4);

console.log(`p50 /habits: ${metrics.percentile('/habits', 50)} ms`);
console.log(`p95 /habits: ${metrics.percentile('/habits', 95)} ms`);

const server = createApp(metrics);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
try {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/metrics`, { signal: AbortSignal.timeout(2000) });
  console.log(`GET /metrics → ${response.status}`);
  console.log(await response.text());
} finally {
  server.closeAllConnections();
  server.close();
}
