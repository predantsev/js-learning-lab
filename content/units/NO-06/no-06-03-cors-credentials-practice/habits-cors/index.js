// Sends, from Node.js, what a browser would send for a PATCH with JSON: first the preflight, then the request.
import { createHabitsApi, PAGE_ORIGIN } from './api.mjs';

const api = createHabitsApi({ allowedMethods: 'GET, POST, PATCH' });
await new Promise((resolve) => api.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${api.address().port}`;
const corsHeaders = (response) =>
  [...response.headers].filter(([name]) => name.startsWith('access-control-')).map(([name, value]) => `  ${name}: ${value}`);

try {
  const preflight = await fetch(`${base}/v1/records/h-03`, {
    method: 'OPTIONS',
    headers: { origin: PAGE_ORIGIN, 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' },
    signal: AbortSignal.timeout(2000),
  });
  console.log(`OPTIONS → ${preflight.status}`);
  console.log(corsHeaders(preflight).join('\n'));

  const patch = await fetch(`${base}/v1/records/h-03`, {
    method: 'PATCH',
    headers: { origin: PAGE_ORIGIN, 'content-type': 'application/json' },
    body: JSON.stringify({ active: false }),
    signal: AbortSignal.timeout(2000),
  });
  console.log(`PATCH → ${patch.status} ${await patch.text()}`);
} finally {
  api.closeAllConnections();
  api.close();
}
