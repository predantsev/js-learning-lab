// Collects the evidence: what the client shows, what the server answers, and what the preflight allows.
import { createServer } from './server.js';
import { createDataSource } from './data-source.js';
import { parseWishV1 } from './contract.js';

const server = createServer();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const source = createDataSource({ baseUrl: base });
try {
  console.log('— %%clientSees%%');
  const list = await source.listRecords();
  console.log(`listRecords: ${list.map((wish) => `${wish.id} ${wish.name}`).join(', ')}`);
  try {
    await source.updateRecord('w-01', { acquired: true });
  } catch (error) {
    console.log(`updateRecord: ${error.name}: ${error.message}`);
  }

  console.log('— %%serverSends%%');
  const body = await (await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) })).json();
  console.log(JSON.stringify(body[0]));
  console.log(`parseWishV1: ${JSON.stringify(parseWishV1(body[0]))}`);

  console.log('— %%preflightAllows%%');
  const preflight = await fetch(`${base}/v1/records/w-01`, {
    method: 'OPTIONS',
    headers: { origin: 'http://127.0.0.1:5173', 'access-control-request-method': 'PATCH', 'access-control-request-headers': 'content-type' },
    signal: AbortSignal.timeout(2000),
  });
  for (const [name, value] of preflight.headers) if (name.startsWith('access-control-')) console.log(`${name}: ${value}`);
} finally {
  server.closeAllConnections();
  server.close();
}
