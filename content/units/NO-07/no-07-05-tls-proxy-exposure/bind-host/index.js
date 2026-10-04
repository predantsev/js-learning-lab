// Starts the server on the configured host, asks it twice who is calling, and stops it.
import { bindHost, createServer } from './server.js';

// Stands in for process.env, so you can change it here.
const env = { HOST: undefined };

const host = bindHost(env);
const server = createServer();
await new Promise((resolve) => server.listen(0, host, resolve));
console.log('server.address():', server.address());

// An IPv6 address goes in square brackets inside a URL: http://[::1]:4310/
const address = server.address();
const base = `http://${address.family === 'IPv6' ? `[${address.address}]` : address.address}:${address.port}`;
try {
  const plain = await fetch(`${base}/items`, { signal: AbortSignal.timeout(2000) });
  console.log('%%plain%%:', await plain.json());
  const spoofed = await fetch(`${base}/items`, { headers: { 'x-forwarded-for': '203.0.113.7' }, signal: AbortSignal.timeout(2000) });
  console.log('%%spoofed%%:', await spoofed.json());
} finally {
  server.closeAllConnections();
  server.close();
}
