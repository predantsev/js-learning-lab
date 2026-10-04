// Records one expense through a flaky connection, then counts what the server stored.
import { createApp } from './app.js';
import { postWithRetry } from './client.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const headers = {}; // no Idempotency-Key yet
  await postWithRetry(`${base}/expenses`, { label: '%%lunch%%', amountMinor: 21050 }, headers);
  const stored = await (await fetch(`${base}/expenses`, { signal: AbortSignal.timeout(2000) })).json();
  console.log(`%%count%% ${stored.length}: ${stored.map((expense) => expense.id).join(', ')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
