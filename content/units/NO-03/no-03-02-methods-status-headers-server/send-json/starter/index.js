// Driver (read-only): serves handle() on a free port, sends four requests and prints what came back.
import http from 'node:http';
import { handle } from './app.js';
import { repository } from './repository.js';

const server = http.createServer(handle);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  for (const [method, path, broken] of [
    ['GET', '/records', false],
    ['POST', '/records', false],
    ['GET', '/tasks', false],
    ['GET', '/records', true],
  ]) {
    repository.broken = broken;
    const response = await fetch(base + path, { method, signal: AbortSignal.timeout(1500) });
    const headers = ['content-type', 'content-length', 'allow']
      .filter((name) => response.headers.has(name))
      .map((name) => `${name}: ${response.headers.get(name)}`)
      .join(', ');
    console.log(`${method} ${path}${broken ? ' %%brokenNote%%' : ''} → ${response.status} (${headers})`);
    console.log(`  ${await response.text()}`);
  }
} catch (error) {
  console.log(`%%gaveUp%% ${error.name}`);
} finally {
  repository.broken = false;
  server.closeAllConnections();
  server.close();
}
