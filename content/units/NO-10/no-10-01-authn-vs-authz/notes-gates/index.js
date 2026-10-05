// Starts the lab notes service on a free loopback port, sends four requests and stops it.
// This program is not a browser: it attaches the credential header itself.
import { createApp } from './app.js';

const calls = [
  ['%%noCredential%%', '/notes/n-1', undefined],
  ['%%badCredential%%', '/notes/n-1', 'Bearer lab-token-xyz'],
  ['u-02 → n-1', '/notes/n-1', 'Bearer lab-token-u02'],
  ['u-01 → n-1', '/notes/n-1', 'Bearer lab-token-u01'],
];

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [label, path, authorization] of calls) {
    const response = await fetch(base + path, {
      headers: authorization ? { authorization } : {},
      signal: AbortSignal.timeout(2000), // never wait longer than 2 s
    });
    console.log(`${label}: ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
