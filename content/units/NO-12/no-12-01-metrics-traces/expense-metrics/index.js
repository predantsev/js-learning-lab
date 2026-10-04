// Sends 100 synthetic requests to the expense service on loopback, one after another,
// then reads GET /metrics and prints every log line of the slowest request.
import { categories, makeExpenses } from './expenses.js';
import { createMetrics } from './metrics.js';
import { createRepository } from './repository.js';
import { createService } from './service.js';

const lines = [];
const log = (entry) => lines.push(entry); // kept in memory: 400 lines would flood the console
const repository = await createRepository('expenses.json', makeExpenses(20_000));
const server = createService({ repository, metrics: createMetrics(), log });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  for (let i = 0; i < 100; i++) {
    const category = categories[i % categories.length];
    const response = await fetch(`${base}/expenses?category=${category}`, { signal: AbortSignal.timeout(2000) });
    await response.text();
  }
  const metrics = await (await fetch(`${base}/metrics`, { signal: AbortSignal.timeout(2000) })).text();
  console.log('GET /metrics');
  console.log(metrics);

  const requests = lines.filter((line) => line.route === '/expenses');
  const slowest = requests.reduce((a, b) => (b.ms > a.ms ? b : a));
  console.log(`%%slowest%% ${slowest.requestId}:`);
  for (const line of lines.filter((entry) => entry.requestId === slowest.requestId)) console.log(JSON.stringify(line));
} finally {
  server.closeAllConnections();
  server.close();
}
