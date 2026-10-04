// The server stops in the middle of the run and comes back 200 ms later on the same port.
import { createApp, createStore } from './app.js';
import { createExpenseClient } from './client.js';

const store = createStore();
let server = createApp(store);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const stop = () => new Promise((resolve) => { server.closeAllConnections(); server.close(resolve); });
const show = (label, { records, stale, failure }) =>
  console.log(`${label}: ${stale ? `%%staleBanner%% (${failure})` : '%%fresh%%'}, %%count%% ${records.length}`);

const client = createExpenseClient({ baseUrl: `http://127.0.0.1:${port}`, retries: 0 });
try {
  show('1', await client.listRecords());

  await stop(); // the server goes away…
  setTimeout(() => { server = createApp(store); server.listen(port, '127.0.0.1'); }, 200); // …and is back in 200 ms
  show('2', await client.listRecords());

  await new Promise((resolve) => setTimeout(resolve, 400));
  show('3', await client.listRecords());

  try {
    const created = await client.createRecord({ label: '%%lunch%%', amountMinor: 21050, category: 'food' });
    console.log(`POST: 201 ${created.id}`);
  } catch (error) {
    console.log(`POST: ${error.name} — %%noAnswer%%`);
  }
  show('4', await client.listRecords());
} finally {
  await stop();
}
