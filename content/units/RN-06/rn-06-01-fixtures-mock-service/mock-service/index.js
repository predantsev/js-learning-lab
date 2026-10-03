// A short demo of the mock service: start it on a free port, send it requests, stop it.
// Your app will send the same kind of requests from the emulator, simulator or phone.
import { createMockService } from './mock-service.mjs';

const server = createMockService();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const paths = [
  '/records/wishlist?lang=%%lang%%',
  '/records/wishlist?status=503',
];

try {
  for (const path of paths) {
    const response = await fetch(base + path, { signal: AbortSignal.timeout(3000) });
    const body = await response.json();
    const summary = Array.isArray(body) ? body.map((item) => item.name).join(', ') : JSON.stringify(body);
    console.log(`→ ${response.status}: ${summary}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
