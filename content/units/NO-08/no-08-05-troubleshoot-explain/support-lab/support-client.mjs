// The two support tickets, as real requests: node support-client.mjs list | one | save | metrics
//   list    — what the person on ticket 1 did: open the list (request id t1-list);
//   one     — open one expense, e-01, for comparison (t1-one);
//   save    — what the person on ticket 2 did: save "12.50" through the page's adapter (t2-save);
//   metrics — GET /metrics.
import { pathToFileURL } from 'node:url';
import { createAdapter } from './client-adapter.js';

export async function list(base) {
  const started = performance.now();
  const response = await fetch(`${base}/expenses`, { headers: { 'x-request-id': 't1-list' }, signal: AbortSignal.timeout(10000) });
  const body = await response.json();
  return `GET /expenses → ${response.status}, x-request-id ${response.headers.get('x-request-id')}, ${body.length} %%items%%, ${Math.round(performance.now() - started)} ms`;
}

export async function one(base) {
  const started = performance.now();
  const response = await fetch(`${base}/expenses/e-01`, { headers: { 'x-request-id': 't1-one' }, signal: AbortSignal.timeout(2000) });
  await response.json();
  return `GET /expenses/e-01 → ${response.status}, x-request-id ${response.headers.get('x-request-id')}, ${Math.round(performance.now() - started)} ms`;
}

export async function save(base) {
  const adapter = createAdapter(base, 't2-save');
  const { status, body } = await adapter.addExpense({ label: '%%parking%%', amount: '12.50', date: '2026-03-03', category: 'transport' });
  return `POST /expenses → ${status} ${JSON.stringify(body)}`;
}

export async function metrics(base) {
  const response = await fetch(`${base}/metrics`, { signal: AbortSignal.timeout(2000) });
  return JSON.stringify(await response.json(), null, 2);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = `http://127.0.0.1:${process.env.PORT ?? 7341}`;
  const commands = { list, one, save, metrics };
  const command = commands[process.argv[2]];
  console.log(command ? await command(base) : 'usage: node support-client.mjs list | one | save | metrics');
}
