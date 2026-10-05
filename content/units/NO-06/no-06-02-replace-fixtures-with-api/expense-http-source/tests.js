// The HTTP source against the real expenses API and against servers that answer badly.
import http from 'node:http';
import { createApp } from './app.js';
import { createHttpSource } from './http-source.js';

// A fetch that records every call and then really sends it.
function countingFetch() {
  const calls = [];
  const fn = (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET' });
    return fetch(url, init);
  };
  return { fn, calls };
}
async function sourceFor(server) {
  expect(typeof createHttpSource, 'type of createHttpSource').toBe('function');
  const baseUrl = await listen(server);
  const counting = countingFetch();
  return { source: createHttpSource({ baseUrl, fetch: counting.fn }), calls: counting.calls, baseUrl };
}
// The error a promise rejects with, or null when it resolves.
async function failureOf(promise) {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}
// A server that answers every request with one fixed status and body.
const answering = (status, body) => http.createServer((request, response) => {
  request.resume();
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
});
const valid = { id: 'e-07', label: 'x', amountMinor: 100, date: '2026-03-03', category: 'fun' };

test('listRecords reads GET /v1/records through the given fetch', async () => {
  const { source, calls, baseUrl } = await sourceFor(createApp());
  const expenses = await source.listRecords();
  expect(calls.map((call) => `${call.method} ${call.url}`), 'requests made through the given fetch').toEqual([`GET ${baseUrl}/v1/records`]);
  expect((expenses ?? []).map((expense) => `${expense.id} ${expense.label}`), 'expenses').toEqual([`e-01 ${L.groceries}`, `e-02 ${L.pass}`, `e-03 ${L.coffee}`]);
});

test('createRecord sends POST /v1/records as JSON and returns the new expense', async () => {
  const { source, baseUrl } = await sourceFor(createApp());
  const created = await source.createRecord({ label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' });
  expect(created, 'the returned expense').toEqual({ id: 'e-04', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' });
  expect(((await request(`${baseUrl}/v1/records`)).json ?? []).length, 'expenses on the server after the POST').toBe(4);
});

test('updateRecord sends PATCH /v1/records/:id and returns the changed expense', async () => {
  const { source, baseUrl } = await sourceFor(createApp());
  const updated = await source.updateRecord('e-02', { amountMinor: 50000 });
  expect(updated?.amountMinor, 'amountMinor of the returned expense').toBe(50000);
  expect(updated?.label, 'label of the returned expense (unchanged)').toBe(L.pass);
  const stored = ((await request(`${baseUrl}/v1/records`)).json ?? []).find((expense) => expense.id === 'e-02');
  expect(stored?.amountMinor, 'amountMinor of e-02 on the server').toBe(50000);
});

test('an answer that is not ok rejects with its status', async () => {
  const missing = (await sourceFor(answering(404, { error: { code: 'NOT_FOUND' } }))).source;
  const notFound = await failureOf(missing.listRecords());
  expect(notFound?.status, 'status of the error for a 404 list').toBe(404);
  expect(notFound, 'what a 404 list rejects with').toBeInstanceOf(Error);
  const broken = (await sourceFor(answering(500, { error: { code: 'INTERNAL' } }))).source;
  const serverError = await failureOf(broken.listRecords());
  expect(serverError?.status, 'status of the error for a 500 list').toBe(500);
  expect(serverError, 'what a 500 list rejects with').toBeInstanceOf(Error);
});

test('a list with an expense that breaks the contract is rejected', async () => {
  const { source } = await sourceFor(answering(200, [valid, { ...valid, id: 'e-08', amountMinor: '18000' }]));
  expect(await failureOf(source.listRecords()), 'what listRecords rejects with').toBeInstanceOf(Error);
});

test('a list answer that is not an array is rejected', async () => {
  const { source } = await sourceFor(answering(200, { records: [valid] }));
  expect(await failureOf(source.listRecords()), 'what listRecords rejects with for { records: [...] }').toBeInstanceOf(Error);
});

test('a created expense that breaks the contract is rejected', async () => {
  const { source } = await sourceFor(answering(201, { ...valid, category: 'travel' }));
  expect(await failureOf(source.createRecord({ label: 'x', amountMinor: 100, date: '2026-03-03', category: 'fun' })), 'what createRecord rejects with').toBeInstanceOf(Error);
});
