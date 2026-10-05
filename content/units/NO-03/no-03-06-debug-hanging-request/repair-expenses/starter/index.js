// Driver (read-only): five requests to the expense server, each with a 1 s client timeout.
import { createApp } from './app.js';
import { createRepository } from './repository.js';

const server = createApp(createRepository());
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const requests = [
  ['GET', '/records/e-99'],
  ['POST', '/records', JSON.stringify({ label: '%%expense4%%', amountMinor: 12.5 })],
  ['DELETE', '/records'],
  ['GET', '/totals'],
  ['POST', '/records', JSON.stringify({ label: '%%expense4%%', amountMinor: 9990 })],
];
try {
  for (const [method, path, body] of requests) {
    const started = performance.now();
    try {
      const response = await fetch(base + path, { method, body, signal: AbortSignal.timeout(1000) });
      console.log(`${method} ${path} → ${response.status} ${await response.text()}`);
    } catch (error) {
      console.log(`${method} ${path} → %%noAnswer%% ${Math.round(performance.now() - started)} ms (${error.name})`);
    }
  }
} finally {
  server.closeAllConnections();
  server.close();
}
