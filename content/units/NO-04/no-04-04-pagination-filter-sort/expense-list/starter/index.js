// Walks through all food expenses three at a time, then asks for an impossible page size.
import { createApp } from './app.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const get = async (path) => {
  const response = await fetch(base + path, { signal: AbortSignal.timeout(2000) });
  return { status: response.status, body: await response.json() };
};
try {
  let path = '/expenses?category=food&sort=amountMinor&limit=3';
  for (let page = 1; page <= 5 && path; page++) {
    const { status, body } = await get(path);
    const shown = (body.items ?? []).map((e) => `${e.id} ${e.amountMinor}`).join(', ');
    console.log(`%%page%% ${page} → ${status} [${shown}] nextCursor: ${body.nextCursor}`);
    path = body.nextCursor ? `/expenses?category=food&sort=amountMinor&limit=3&cursor=${body.nextCursor}` : null;
  }
  const tooBig = await get('/expenses?limit=500');
  console.log(`limit=500 → ${tooBig.status} ${JSON.stringify(tooBig.body)}`);
} finally {
  server.closeAllConnections();
  server.close();
}
