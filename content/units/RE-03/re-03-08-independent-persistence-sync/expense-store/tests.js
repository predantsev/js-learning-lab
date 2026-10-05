import { createElement, Profiler, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { DEFAULT_EXPENSES, STORAGE_KEY } from './expenses.js';

// Every check prepares the stored value, then mounts its own copy of the tracker (under StrictMode
// unless it counts commits) and records every value written under STORAGE_KEY.
async function mount(storedText, { strict = true } = {}) {
  if (storedText === undefined) storage.removeItem(STORAGE_KEY);
  else storage.setItem(STORAGE_KEY, storedText);
  const writes = [];
  const real = window.localStorage;
  const recording = {
    getItem: (key) => real.getItem(key),
    setItem: (key, value) => {
      if (key === STORAGE_KEY) writes.push(String(value));
      real.setItem(key, value);
    },
    removeItem: (key) => real.removeItem(key),
    clear: () => real.clear(),
    key: (index) => real.key(index),
    get length() { return real.length; },
  };
  Object.defineProperty(window, 'localStorage', { value: recording, configurable: true });
  const errors = [];
  const stats = { commits: 0 };
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host, { onUncaughtError: (error) => errors.push(error.message) });
  const tree = createElement(Profiler, { id: 'tracker', onRender: () => { stats.commits += 1; } }, createElement(App));
  root.render(strict ? createElement(StrictMode, null, tree) : tree);
  await waitFor(() => host.querySelector('[data-total]') !== null || errors.length > 0);
  await settle();
  const finish = () => { root.unmount(); host.remove(); Object.defineProperty(window, 'localStorage', { value: real, configurable: true }); };
  return { host, errors, writes, stats, finish };
}
const labels = (host) => [...host.querySelectorAll('li span')].map((span) => span.textContent.trim());
const stored = () => JSON.parse(storage.getItem(STORAGE_KEY));
const envelope = (records) => JSON.stringify({ schemaVersion: 1, records });
const SAVED = [
  { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
async function add(host, label, amount) {
  const [labelInput, amountInput] = host.querySelectorAll('input');
  await user.fill(labelInput, label);
  await user.fill(amountInput, amount);
  await user.submit(host.querySelector('form'));
}

test('with nothing stored, the default expenses and their total are shown', async () => {
  const copy = await mount(undefined);
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(labels(copy.host), 'labels in the list').toEqual(DEFAULT_EXPENSES.map((e) => e.label));
    expect(copy.host.querySelector('[data-total]'), 'the total line').toHaveTextContent('1545.50');
  } finally { copy.finish(); }
});

test('valid stored records are restored without changes', async () => {
  const copy = await mount(envelope(SAVED));
  try {
    expect(labels(copy.host), 'labels after restoring two stored expenses').toEqual([L.bulbs, L.lunch]);
    expect(copy.host.querySelector('[data-total]'), 'the total line').toHaveTextContent('310.40');
    expect(stored(), 'stored value after mounting under StrictMode').toEqual({ schemaVersion: 1, records: SAVED });
  } finally { copy.finish(); }
});

test('mounting never writes anything but the restored list', async () => {
  const copy = await mount(envelope(SAVED));
  try {
    expect(copy.writes.length, 'writes while mounting').toBeGreaterThan(0);
    for (const value of copy.writes) expect(JSON.parse(value), 'a value written while mounting').toEqual({ schemaVersion: 1, records: SAVED });
  } finally { copy.finish(); }
});

test('records that fail validation are skipped', async () => {
  const broken = [SAVED[0], { ...SAVED[1], id: 'e-07', amountMinor: -500 }, { id: 'e-08', label: '   ', amountMinor: 100, date: '2026-03-01', category: 'food' }];
  const copy = await mount(envelope(broken));
  try {
    expect(copy.errors, 'errors React reported').toEqual([]);
    expect(labels(copy.host), 'labels after skipping two invalid records').toEqual([L.bulbs]);
    expect(stored(), 'stored value after mounting').toEqual({ schemaVersion: 1, records: [SAVED[0]] });
  } finally { copy.finish(); }
  const empty = await mount(envelope([broken[1], broken[2]]));
  try {
    expect(labels(empty.host), 'labels when every stored record is invalid').toEqual([]);
  } finally { empty.finish(); }
});

test('corrupted JSON or an unknown schema falls back to the defaults', async () => {
  for (const text of ['{broken', JSON.stringify({ schemaVersion: 2, records: SAVED }), JSON.stringify(SAVED), 'null']) {
    const copy = await mount(text);
    try {
      expect(copy.errors, `errors React reported for the stored text ${text.slice(0, 30)}`).toEqual([]);
      expect(labels(copy.host), `labels for the stored text ${text.slice(0, 30)}`).toEqual(DEFAULT_EXPENSES.map((e) => e.label));
    } finally { copy.finish(); }
  }
});

test('adding and removing store the whole current list', async () => {
  const copy = await mount(envelope(SAVED));
  try {
    await add(copy.host, L.cinema, '300');
    const afterAdd = stored().records;
    expect(afterAdd.map((e) => e.label), 'stored labels after adding').toEqual([L.bulbs, L.lunch, L.cinema]);
    expect(afterAdd[2], 'the stored new expense').toMatchObject({ label: L.cinema, amountMinor: 30000, date: '2026-03-02', category: 'food' });
    const removeFirst = copy.host.querySelector('li button');
    await user.click(removeFirst);
    expect(stored().records.map((e) => e.label), 'stored labels after removing the first').toEqual([L.lunch, L.cinema]);
    expect(stored().schemaVersion, 'schemaVersion').toBe(1);
  } finally { copy.finish(); }
});

test('rapid additions all reach storage without duplicates', async () => {
  const copy = await mount(undefined);
  try {
    await add(copy.host, L.cinema, '300');
    await add(copy.host, L.bulbs, '99.9');
    await add(copy.host, L.lunch, '210,5');
    const records = stored().records;
    expect(records.map((e) => e.label), 'stored labels after three quick additions').toEqual([...DEFAULT_EXPENSES.map((e) => e.label), L.cinema, L.bulbs, L.lunch]);
    expect(records.map((e) => e.amountMinor).slice(3), 'stored amounts of the additions').toEqual([30000, 9990, 21050]);
    expect(new Set(records.map((e) => e.id)).size, 'distinct ids').toBe(6);
  } finally { copy.finish(); }
});

test('every action causes exactly one commit', async () => {
  const copy = await mount(envelope(SAVED), { strict: false });
  try {
    expect(copy.stats.commits, 'commits while mounting').toBe(1);
    const [labelInput, amountInput] = copy.host.querySelectorAll('input');
    await user.fill(labelInput, L.cinema);
    await user.fill(amountInput, '300');
    copy.stats.commits = 0;
    await user.submit(copy.host.querySelector('form'));
    expect(copy.stats.commits, 'commits after submitting the form').toBe(1);
    copy.stats.commits = 0;
    await user.click(copy.host.querySelector('li button'));
    expect(copy.stats.commits, 'commits after removing').toBe(1);
    expect(copy.host.querySelector('[data-total]'), 'the total line right after removing').toHaveTextContent('510.50');
  } finally { copy.finish(); }
});
