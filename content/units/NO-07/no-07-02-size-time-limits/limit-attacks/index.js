// Runs four synthetic clients against the expenses API: a normal one and three abusive ones.
import { createServer, LIMITS } from './server.js';
import { chunkedUpload, rawRequest, slowHeaders } from './clients.js';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
console.log(`%%limitsLabel%%: ${JSON.stringify(LIMITS)}`);

try {
  const normal = await fetch(`${base}/expenses/import`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{ label: '%%lunch%%', amountMinor: 21050 }]),
    signal: AbortSignal.timeout(2000),
  });
  console.log(`%%normal%%: ${normal.status}`);

  const upload = await rawRequest(port, (socket) => chunkedUpload(socket, 2 * 1024 * 1024));
  console.log(`%%upload%%: ${upload.status}`);

  const slow = await rawRequest(port, slowHeaders);
  console.log(`%%slow%%: ${slow.status} (${(slow.ms / 1000).toFixed(1)} s)`);

  await new Promise((resolve) => setTimeout(resolve, LIMITS.windowMs)); // start a fresh window
  const statuses = [];
  for (let i = 0; i < 5; i += 1) {
    const response = await fetch(`${base}/expenses`, { signal: AbortSignal.timeout(2000) });
    statuses.push(response.status === 429 ? `429 (Retry-After: ${response.headers.get('retry-after')})` : String(response.status));
  }
  console.log(`%%burst%%: ${statuses.join(', ')}`);
} finally {
  server.closeAllConnections();
  server.close();
}
