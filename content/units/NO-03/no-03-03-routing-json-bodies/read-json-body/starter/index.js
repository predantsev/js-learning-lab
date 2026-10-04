// Driver (read-only): a server with a 256-byte body limit and three POST /records requests.
import { createApp } from './server.js';

const server = createApp({ maxBytes: 256 });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const bodies = [
  JSON.stringify({ name: '%%habit%%', frequency: 'daily' }),
  JSON.stringify({ name: '%%habit%%', note: 'x'.repeat(8 * 1024) }),
  '{"name": "%%habit%%',
];
try {
  for (const body of bodies) {
    const response = await fetch(`${base}/records`, { method: 'POST', body, signal: AbortSignal.timeout(1500) });
    console.log(`POST /records (${Buffer.byteLength(body)} B) → ${response.status} ${await response.text()}`);
  }
} catch (error) {
  console.log(`%%gaveUp%% ${error.name}`);
} finally {
  server.closeAllConnections();
  server.close();
}
