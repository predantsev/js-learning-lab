import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { useRecords } from './useRecords.js';
import { settings, requests } from './fixtureApi.js';

const DELAY = 150;

// Every check mounts its own copy of a component and removes it afterwards.
async function mount(component) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(component));
  await waitFor(() => host.childNodes.length > 0);
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const items = (host) => [...host.querySelectorAll('li')].map((li) => li.textContent.trim());
const ALL = () => [L.plants, L.library, L.grandma, L.internet];

function prepare(failNext = 0) {
  settings.delayMs = DELAY;
  settings.failNext = failNext;
}

test('the first display shows the loading message', async () => {
  prepare();
  const copy = await mount(App);
  try {
    const status = copy.host.querySelector('[role="status"]');
    expect(status?.textContent.trim() ?? null, 'the role="status" paragraph right after the first display').toBe(L.loading);
    expect(items(copy.host), 'list items before the answer').toEqual([]);
  } finally { copy.finish(); }
});

test('after the answer every task title is listed', async () => {
  prepare();
  const copy = await mount(App);
  try {
    await waitFor(() => items(copy.host).length > 0, { timeout: 1500 }).catch(() => {});
    expect(items(copy.host), 'list items after the answer').toEqual(ALL());
    expect(copy.host.querySelector('[role="status"]'), 'the loading message after the answer').toBeNull();
  } finally { copy.finish(); }
});

test('a failed request shows the error message', async () => {
  prepare(1);
  const copy = await mount(App);
  try {
    await waitFor(() => copy.host.querySelector('[role="alert"]') !== null, { timeout: 1500 }).catch(() => {});
    const alert = copy.host.querySelector('[role="alert"]');
    expect(alert?.textContent.trim() ?? null, 'the role="alert" paragraph after a failed request').toBe(L.loadError);
    expect(copy.host.querySelector('[role="status"]'), 'the loading message after a failed request').toBeNull();
  } finally { settings.failNext = 0; copy.finish(); }
});

test('one display sends exactly one request', async () => {
  prepare();
  const before = requests.length;
  const copy = await mount(App);
  try {
    await sleep(DELAY * 4);
    expect(requests.length - before, 'requests sent while one copy was on screen for 0.6 s').toBe(1);
  } finally { copy.finish(); }
});

test('useRecords describes the request with status, records and error', async () => {
  prepare(1);
  const seen = [];
  function Probe() { seen.push(useRecords()); return null; }
  const failing = createRoot(document.createElement('div'));
  failing.render(createElement(Probe));
  try {
    await waitFor(() => seen.length > 0);
    expect(seen[0], 'what useRecords returns on the first render').toEqual({ status: 'loading', records: [], error: null });
    await waitFor(() => seen.at(-1).status === 'error', { timeout: 1500 }).catch(() => {});
    const last = seen.at(-1);
    expect(last.status, 'status after a failed request').toBe('error');
    expect(last.error instanceof Error, 'error after a failed request is an Error').toBe(true);
  } finally { settings.failNext = 0; failing.unmount(); }
  seen.length = 0;
  const loading = createRoot(document.createElement('div'));
  loading.render(createElement(Probe));
  try {
    await waitFor(() => seen.length > 0 && seen.at(-1).status === 'success', { timeout: 1500 }).catch(() => {});
    const last = seen.at(-1);
    expect(last.status, 'status after the answer').toBe('success');
    expect(last.records.map((task) => task.title), 'records after the answer').toEqual(ALL());
    expect(last.error, 'error after a successful answer').toBeNull();
  } finally { loading.unmount(); }
});
