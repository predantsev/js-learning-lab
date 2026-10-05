// Two clients (A and B) of one wishlist server. A changes records; B only reads.
import { createApp } from './app.js';
import { createClient } from './client.js';

// One line per view: the state of w-01 and w-02 and the total price of wanted items.
function describe(label, records) {
  const wanted = records.filter((record) => !record.acquired);
  const total = wanted.reduce((sum, record) => sum + record.price, 0);
  const w01 = records.find((record) => record.id === 'w-01');
  const w02 = records.find((record) => record.id === 'w-02');
  const state = w01.acquired ? '%%acquired%%' : '%%wanted%%';
  console.log(`${label}: w-01 ${state}, w-02 %%price%% ${w02.price}, %%total%% ${total}`);
}

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const a = createClient('A', base);
  const b = createClient('B', base);
  describe('A', await a.list());
  describe('B', await b.list());

  console.log(`A PATCH w-01 { acquired: true } → ${await a.update('w-01', { acquired: true })}`);
  describe('A', await a.list());
  describe('B', await b.list());

  console.log(`A PATCH w-02 { price: -45 } → ${await a.update('w-02', { price: -45 })}`);
  describe('A', await a.list());

  const truth = await (await fetch(`${base}/v1/records`, { signal: AbortSignal.timeout(2000) })).json();
  describe('%%server%%', truth);
} finally {
  server.closeAllConnections();
  server.close();
}
