// Drives the HTTP source against the real expenses API: list, create, update, list again.
import { createApp } from './app.js';
import { createHttpSource } from './http-source.js';

const server = createApp();
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const source = createHttpSource({ baseUrl: `http://127.0.0.1:${server.address().port}`, fetch: globalThis.fetch });
const show = (expenses) => (expenses ?? []).map((expense) => `${expense.id} ${expense.amountMinor}`).join(', ');
try {
  console.log(`%%list%%: ${show(await source.listRecords())}`);
  const created = await source.createRecord({ label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' });
  console.log(`%%created%%: ${created ? `${created.id} ${created.label}` : '—'}`);
  const updated = await source.updateRecord('e-02', { amountMinor: 50000 });
  console.log(`%%updated%%: ${updated ? `${updated.id} ${updated.amountMinor}` : '—'}`);
  console.log(`%%list%%: ${show(await source.listRecords())}`);
} catch (error) {
  console.log(`%%failed%%: ${error.name}: ${error.message}`);
} finally {
  server.closeAllConnections();
  server.close();
}
