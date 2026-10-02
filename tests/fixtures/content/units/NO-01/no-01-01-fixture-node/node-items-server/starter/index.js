// Starts the server on a free loopback port, sends two requests to it and stops it.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const route of ['/items', '/missing']) {
    // Give up after 2 s: a server that never answers must not keep the program waiting.
    const response = await fetch(base + route, { signal: AbortSignal.timeout(2000) });
    console.log(`GET ${route} → ${response.status} ${await response.text()}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
