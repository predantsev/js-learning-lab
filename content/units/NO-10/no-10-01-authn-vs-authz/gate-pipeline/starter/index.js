// Starts the tasks service, sends six requests, prints each status and what the
// repository was asked to do, then stops the server.
import { createApp } from './app.js';
import { createRepo } from './repo.js';

const calls = [
  ['GET', '/tasks/t-1', undefined],
  ['GET', '/tasks/t-1', 'Bearer lab-token-xyz'],
  ['GET', '/tasks/t-1', 'Bearer lab-token-u02'],
  ['DELETE', '/tasks/t-1', 'Bearer lab-token-u02'],
  ['GET', '/tasks/t-1', 'Bearer lab-token-u01'],
  ['GET', '/tasks/t-9', 'Bearer lab-token-u01'],
];

const repo = createRepo();
const server = createApp({ repo });
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  for (const [method, path, authorization] of calls) {
    repo.calls.length = 0;
    const response = await fetch(base + path, {
      method,
      headers: authorization ? { authorization } : {},
      signal: AbortSignal.timeout(2000),
    });
    const who = authorization ?? '(%%none%%)';
    console.log(`${method} ${path} [${who}] → ${response.status}; repo: ${repo.calls.join(', ') || '—'}`);
  }
} finally {
  server.closeAllConnections();
  server.close();
}
