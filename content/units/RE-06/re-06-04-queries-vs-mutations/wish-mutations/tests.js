import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createRecord, updateRecord } from './mutations.ts';
import { settings, requests, resetServer } from './fakeServer.js';

function prepare() {
  resetServer();
  settings.delayMs = 60;
  settings.failNext = 0;
  settings.offlineNext = 0;
}
const since = (before) => requests.slice(before).map(({ method, path, body }) => ({ method, path, body }));

// UI checks mount their own copy and remove it afterwards.
async function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('li').length === 3, { timeout: 1500 });
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const rowOf = (host, name) => [...host.querySelectorAll('li')].find((li) => li.textContent.includes(name));

test('createRecord sends one POST and resolves to the created wish', async () => {
  prepare();
  const before = requests.length;
  const result = await createRecord({ name: L.mug, price: 18 });
  expect(since(before), 'requests sent by createRecord').toEqual([{ method: 'POST', path: '/api/wishes', body: { name: L.mug, price: 18 } }]);
  expect(result, 'what createRecord resolves to').toEqual({ ok: true, value: { id: 'w-04', name: L.mug, price: 18, acquired: false } });
});

test('createRecord resolves to an error result when the server answers 503', async () => {
  prepare();
  settings.failNext = 1;
  let outcome;
  try { outcome = await createRecord({ name: L.mug, price: 18 }); } catch (error) { outcome = `rejected with ${error}`; }
  expect(outcome?.ok, 'result.ok after a 503 answer').toBe(false);
  expect(typeof outcome?.error, 'type of result.error after a 503 answer').toBe('string');
});

test('createRecord resolves to an error result when the network fails', async () => {
  prepare();
  settings.offlineNext = 1;
  let outcome;
  try { outcome = await createRecord({ name: L.mug, price: 18 }); } catch (error) { outcome = `rejected with ${error}`; }
  expect(outcome?.ok, 'result.ok after a network error').toBe(false);
  expect(typeof outcome?.error, 'type of result.error after a network error').toBe('string');
});

test('updateRecord sends only the patch with PATCH and resolves to the whole wish', async () => {
  prepare();
  const before = requests.length;
  const result = await updateRecord('w-02', { acquired: true });
  expect(since(before), 'requests sent by updateRecord').toEqual([{ method: 'PATCH', path: '/api/wishes/w-02', body: { acquired: true } }]);
  expect(result, 'what updateRecord resolves to').toEqual({ ok: true, value: { id: 'w-02', name: L.lamp, price: 45, acquired: true } });
});

test('a failed mutation is not repeated silently', async () => {
  prepare();
  settings.failNext = 1;
  const before = requests.length;
  let outcome;
  try { outcome = await updateRecord('w-01', { acquired: true }); } catch (error) { outcome = `rejected with ${error}`; }
  expect(requests.length - before, 'requests sent by one failed updateRecord').toBe(1);
  expect(outcome?.ok, 'result.ok after a 503 answer').toBe(false);
});

test('Mark acquired marks the wish on screen', async () => {
  prepare();
  const copy = await mount();
  try {
    const before = requests.length;
    await user.click(rowOf(copy.host, L.lamp).querySelector('button'));
    await waitFor(() => rowOf(copy.host, L.lamp).textContent.includes('✓'), { timeout: 1000 }).catch(() => {});
    expect(since(before).map((r) => `${r.method} ${r.path}`), 'requests sent by one click').toEqual(['PATCH /api/wishes/w-02']);
    expect(rowOf(copy.host, L.lamp).textContent.includes('✓'), 'the lamp row shows ✓').toBe(true);
  } finally { copy.finish(); }
});

test('a failed Mark acquired shows the error and keeps the wish wanted', async () => {
  prepare();
  const copy = await mount();
  try {
    settings.failNext = 1;
    await user.click(rowOf(copy.host, L.lamp).querySelector('button'));
    await sleep(200);
    expect(copy.host.querySelector('[role="alert"]').textContent.trim(), 'the role="alert" text after a failed click').toBe(L.saveFailed);
    expect(rowOf(copy.host, L.lamp).textContent.includes('✓'), 'the lamp row shows ✓').toBe(false);
  } finally { settings.failNext = 0; copy.finish(); }
});
