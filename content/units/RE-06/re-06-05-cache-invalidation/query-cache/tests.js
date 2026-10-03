import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { createQueryCache } from './queryCache.js';
import { settings, requests, resetServer } from './fakeServer.js';

const DELAY = 60;
const entryOf = (cache, key) => { const entry = cache.get(key); return entry === undefined ? undefined : { data: entry.data, stale: entry.stale }; };
const wait = () => sleep(DELAY + 140);

// --- the cache on its own ---

test('get returns what set stored under an equal key', () => {
  const cache = createQueryCache();
  const data = [{ id: 't-01' }];
  cache.set(['tasks', 'pending'], data);
  expect(entryOf(cache, ['tasks', 'pending']), 'get(["tasks", "pending"]) with a new, equal array').toEqual({ data, stale: false });
  expect(cache.get(['tasks', 'done']), 'get(["tasks", "done"]) that was never set').toBeUndefined();
});

test('invalidate marks every entry under the prefix as stale and keeps its data', () => {
  const cache = createQueryCache();
  cache.set(['tasks', 'all'], ['a']);
  cache.set(['tasks', 'due-count'], { count: 2 });
  cache.invalidate(['tasks']);
  expect(cache.get(['tasks', 'all'])?.stale, 'stale of ["tasks", "all"] after invalidate(["tasks"])').toBe(true);
  expect(cache.get(['tasks', 'due-count'])?.stale, 'stale of ["tasks", "due-count"] after invalidate(["tasks"])').toBe(true);
  expect(cache.get(['tasks', 'all'])?.data, 'data of ["tasks", "all"] after invalidate(["tasks"])').toEqual(['a']);
});

test('invalidate leaves entries outside the prefix fresh', () => {
  const cache = createQueryCache();
  cache.set(['settings'], { listName: 'x' });
  cache.set(['tasksArchive'], []);
  cache.set(['tasks', 'done'], []);
  cache.set(['tasks', 'pending'], []);
  cache.invalidate(['tasks']);
  expect(cache.get(['settings'])?.stale, 'stale of ["settings"] after invalidate(["tasks"])').toBe(false);
  expect(cache.get(['tasksArchive'])?.stale, 'stale of ["tasksArchive"] after invalidate(["tasks"])').toBe(false);
  cache.set(['tasks', 'done'], []);
  cache.set(['tasks', 'pending'], []);
  cache.invalidate(['tasks', 'pending']);
  expect(cache.get(['tasks', 'done'])?.stale, 'stale of ["tasks", "done"] after invalidate(["tasks", "pending"])').toBe(false);
  expect(cache.get(['tasks', 'pending'])?.stale, 'stale of ["tasks", "pending"] after invalidate(["tasks", "pending"])').toBe(true);
});

test('set after invalidate makes the entry fresh again', () => {
  const cache = createQueryCache();
  cache.set(['tasks', 'all'], ['old']);
  cache.invalidate(['tasks']);
  cache.set(['tasks', 'all'], ['new']);
  expect(entryOf(cache, ['tasks', 'all']), 'the entry after set → invalidate → set').toEqual({ data: ['new'], stale: false });
});

test('set and invalidate notify the subscribers', () => {
  const cache = createQueryCache();
  let calls = 0;
  cache.subscribe(() => { calls += 1; });
  cache.set(['tasks', 'all'], []);
  expect(calls, 'notifications after one set').toBe(1);
  cache.invalidate(['tasks']);
  expect(calls, 'notifications after set and invalidate').toBe(2);
});

// --- the planner ---

async function mount() {
  resetServer();
  settings.delayMs = DELAY;
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  await waitFor(() => host.querySelectorAll('li').length > 0, { timeout: 1500 }).catch(() => {});
  await wait();
  return { host, finish: () => { root.unmount(); host.remove(); } };
}
const titles = (host) => [...host.querySelectorAll('li span')].map((span) => span.textContent.trim());
const rowOf = (host, title) => [...host.querySelectorAll('li')].find((li) => li.querySelector('span')?.textContent.trim() === title);
const buttonIn = (row, text) => [...(row?.querySelectorAll('button') ?? [])].find((button) => button.textContent.trim() === text);
const dueCount = (host) => host.querySelector('output')?.textContent.trim();

test('adding a task shows it in the list', async () => {
  const copy = await mount();
  try {
    await user.fill(copy.host.querySelector('input'), L.dentist);
    await user.submit(copy.host.querySelector('form'));
    await wait();
    await wait();
    expect(titles(copy.host), 'tasks listed after adding one').toEqual([L.plants, L.library, L.grandma, L.internet, L.dentist]);
  } finally { copy.finish(); }
});

test('marking a task done updates the due-today count', async () => {
  const copy = await mount();
  try {
    expect(dueCount(copy.host), 'due-today count before').toBe('2');
    await user.click(buttonIn(rowOf(copy.host, L.library), L.markDone));
    await wait();
    await wait();
    expect(dueCount(copy.host), 'due-today count after marking a due task done').toBe('1');
  } finally { copy.finish(); }
});

test('removing a task removes it from the list', async () => {
  const copy = await mount();
  try {
    await user.click(buttonIn(rowOf(copy.host, L.grandma), L.remove));
    await wait();
    await wait();
    expect(titles(copy.host), 'tasks listed after removing one').toEqual([L.plants, L.library, L.internet]);
  } finally { copy.finish(); }
});

test('a write does not fetch the settings again', async () => {
  const copy = await mount();
  try {
    const before = requests.length;
    await user.click(buttonIn(rowOf(copy.host, L.plants), L.markDone));
    await wait();
    await wait();
    const settingsReads = requests.slice(before).filter((request) => request.path === '/api/settings');
    expect(settingsReads.length, 'GET /api/settings sent after marking a task done').toBe(0);
    expect(requests.slice(before).some((request) => request.path.startsWith('/api/tasks?')), 'the task list was fetched again').toBe(true);
  } finally { copy.finish(); }
});
