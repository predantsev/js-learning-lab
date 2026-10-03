import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App, { HOME_KEY, WORK_KEY } from './App';
import { useStoredRecords } from './useStoredRecords';

const KEY_A = 'jsll.check.a';
const KEY_B = 'jsll.check.b';
const TASK = (id, title) => ({ id, title });

// A probe component: it calls the hook and hands the result out through `seen`.
function probeFor(key, seen) {
  return function Probe() {
    const [records, setRecords] = useStoredRecords(key);
    seen[key] = { records, setRecords };
    return createElement('p', null, records.map((r) => r.title).join(','));
  };
}
async function mount(element) {
  const errors = [];
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  root.render(element);
  await settle();
  return { host, errors, root, finish: () => { root.unmount(); host.remove(); } };
}
async function act(fn) { fn(); await settle(); }

test('the hook starts from the records stored under its key', async () => {
  storage.setItem(KEY_A, JSON.stringify([TASK('t-01', L.plants)]));
  const seen = {};
  const copy = await mount(createElement(probeFor(KEY_A, seen)));
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(seen[KEY_A]?.records, 'records returned on the first render').toEqual([TASK('t-01', L.plants)]);
  } finally { copy.finish(); storage.removeItem(KEY_A); }
});

test('setting records stores them under the key', async () => {
  storage.removeItem(KEY_A);
  const seen = {};
  const copy = await mount(createElement(probeFor(KEY_A, seen)));
  try {
    expect(seen[KEY_A]?.records, 'records when nothing is stored').toEqual([]);
    await act(() => seen[KEY_A].setRecords([TASK('t-02', L.library)]));
    expect(seen[KEY_A].records, 'records after the setter').toEqual([TASK('t-02', L.library)]);
    expect(JSON.parse(storage.getItem(KEY_A)), 'value stored under the key').toEqual([TASK('t-02', L.library)]);
  } finally { copy.finish(); storage.removeItem(KEY_A); }
});

test('a storage event for its key reloads the records, another key is ignored', async () => {
  storage.setItem(KEY_A, JSON.stringify([TASK('t-01', L.plants)]));
  const seen = {};
  const copy = await mount(createElement(probeFor(KEY_A, seen)));
  try {
    // Another tab changes the key: the stored value changes, then the event arrives.
    storage.setItem(KEY_A, JSON.stringify([TASK('t-03', L.grandma)]));
    await act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'jsll.other' })));
    expect(seen[KEY_A].records, 'records after an event for another key').toEqual([TASK('t-01', L.plants)]);
    await act(() => window.dispatchEvent(new StorageEvent('storage', { key: KEY_A })));
    expect(seen[KEY_A].records, 'records after an event for its own key').toEqual([TASK('t-03', L.grandma)]);
  } finally { copy.finish(); storage.removeItem(KEY_A); }
});

test('two calls keep separate records', async () => {
  storage.removeItem(KEY_A);
  storage.removeItem(KEY_B);
  const seen = {};
  const copy = await mount(createElement('div', null, createElement(probeFor(KEY_A, seen)), createElement(probeFor(KEY_B, seen))));
  try {
    await act(() => seen[KEY_A].setRecords([TASK('t-04', L.bill)]));
    expect(seen[KEY_B].records, 'records of the second call').toEqual([]);
    expect(storage.getItem(KEY_B), 'value stored under the second key').not.toContain(L.bill);
  } finally { copy.finish(); storage.removeItem(KEY_A); storage.removeItem(KEY_B); }
  const again = {};
  const next = await mount(createElement(probeFor(KEY_B, again)));
  try {
    expect(again[KEY_B].records, 'records of a new call for the second key').toEqual([]);
  } finally { next.finish(); storage.removeItem(KEY_B); }
});

test('unmounting removes the storage listener', async () => {
  const nativeAdd = window.addEventListener;
  const nativeRemove = window.removeEventListener;
  const live = new Set();
  window.addEventListener = function (type, fn, options) { if (type === 'storage') live.add(fn); return nativeAdd.call(this, type, fn, options); };
  window.removeEventListener = function (type, fn, options) { if (type === 'storage') live.delete(fn); return nativeRemove.call(this, type, fn, options); };
  const seen = {};
  let copy = null;
  try {
    copy = await mount(createElement(probeFor(KEY_A, seen)));
    expect(live.size, 'storage listeners while mounted').toBeGreaterThan(0);
    copy.finish();
    copy = null;
    expect(live.size, 'storage listeners after unmounting').toBe(0);
  } finally {
    copy?.finish();
    for (const fn of live) nativeRemove.call(window, 'storage', fn);
    window.addEventListener = nativeAdd;
    window.removeEventListener = nativeRemove;
    storage.removeItem(KEY_A);
  }
});

test('both lists on the page remember their own tasks', async () => {
  storage.removeItem(WORK_KEY);
  storage.removeItem(HOME_KEY);
  const first = await mount(createElement(App));
  try {
    const work = first.host.querySelector('[data-list="work"]');
    await user.fill(work.querySelector('input'), L.library);
    await user.submit(work.querySelector('form'));
    const home = first.host.querySelector('[data-list="home"]');
    await user.fill(home.querySelector('input'), L.grandma);
    await user.submit(home.querySelector('form'));
  } finally { first.finish(); }
  const second = await mount(createElement(App));
  try {
    const titles = (list) => [...second.host.querySelectorAll(`[data-list="${list}"] li`)].map((li) => li.textContent.trim());
    expect(titles('work'), 'work tasks after mounting again').toEqual([L.library]);
    expect(titles('home'), 'home tasks after mounting again').toEqual([L.grandma]);
  } finally { second.finish(); storage.removeItem(WORK_KEY); storage.removeItem(HOME_KEY); }
});
