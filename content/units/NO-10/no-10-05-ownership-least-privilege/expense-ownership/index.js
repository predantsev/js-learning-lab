// u-02 sends five requests about u-01's expense e-1 (and the missing e-9),
// first to the unscoped service, then to the scoped one.
import { createApp } from './app.js';

const calls = [
  ['GET', '/expenses'],
  ['GET', '/expenses/e-1'],
  ['PATCH', '/expenses/e-1', { amountMinor: 1 }],
  ['DELETE', '/expenses/e-1'],
  ['GET', '/expenses/e-9'],
];

for (const scoped of [false, true]) {
  const server = createApp({ scoped });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(scoped ? '— %%scoped%% —' : '— %%unscoped%% —');
  try {
    for (const [method, path, body] of calls) {
      const response = await fetch(base + path, {
        method,
        headers: { authorization: 'Bearer lab-token-u02', ...(body ? { 'content-type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(2000),
      });
      const text = await response.text();
      console.log(`u-02 ${method} ${path} → ${response.status} ${text}`);
    }
  } finally {
    server.closeAllConnections();
    server.close();
  }
}
