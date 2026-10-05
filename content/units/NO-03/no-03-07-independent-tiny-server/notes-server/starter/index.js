// Driver (read-only): starts createNotesServer() on a free port, sends a few requests, stops it.
// In your terminal you start the server with `node notes.js` instead (see the local task).
import { createNotesServer } from './notes.js';

const server = createNotesServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  for (const [method, path, body] of [
    ['GET', '/notes'],
    ['GET', '/notes/n-02'],
    ['POST', '/notes', JSON.stringify({ text: '%%newNote%%' })],
    ['DELETE', '/notes'],
  ]) {
    const response = await fetch(base + path, { method, body, signal: AbortSignal.timeout(1500) });
    const allow = response.headers.get('allow');
    console.log(`${method} ${path} → ${response.status}${allow ? ` (Allow: ${allow})` : ''} ${await response.text()}`);
  }
} catch (error) {
  console.log(`%%gaveUp%% ${error.name}`);
} finally {
  server.closeAllConnections();
  server.close();
}
