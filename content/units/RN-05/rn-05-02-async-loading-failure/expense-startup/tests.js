import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createSimulatedStore } from './native-store.js';
import { ExpensesScreen } from './ExpensesScreen.jsx';

const KEY = 'jsll.expenses.v1';
const labels = { loading: L.loading, empty: L.empty, failed: L.failed, retry: L.retry, add: L.add };
const stored = () => [
  { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' },
];
const lunch = { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' };

// A fresh "device" with its own store, and the screen mounted on it.
function launch({ records = stored(), readDelayMs = 150, failRead = false } = {}) {
  const entries = records === null ? {} : { [KEY]: JSON.stringify({ schemaVersion: 1, records }) };
  const store = createSimulatedStore({ entries, readDelayMs, log: false });
  if (failRead) store.failNextRead();
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  root.render(createElement(ExpensesScreen, { storage: store, labels, newExpense: lunch }));
  return {
    store,
    box,
    text: () => box.textContent,
    button: (name) => [...box.querySelectorAll('[role="button"]')].find((el) => el.textContent.includes(name)),
    storedRecords: () => JSON.parse(store.peek(KEY) ?? 'null')?.records,
    done: () => {
      root.unmount();
      box.remove();
    },
  };
}

test('the first frame shows loading, not the empty message', async () => {
  const app = launch();
  await sleep(30);
  const text = app.text();
  app.done();
  expect(text, 'the screen while the read is in flight').toContain(L.loading);
  expect(text, 'the screen while the read is in flight').not.toContain(L.empty);
});

test('stored expenses appear once the read finishes', async () => {
  const app = launch();
  await waitFor(() => app.text().includes(L.coffee)).catch(() => {});
  const text = app.text();
  app.done();
  expect(text, 'the screen after the read').toContain(L.bulbs);
  expect(text, 'the screen after the read').not.toContain(L.loading);
});

test('an empty store shows the empty message after loading', async () => {
  const app = launch({ records: null });
  await waitFor(() => app.text().includes(L.empty)).catch(() => {});
  const text = app.text();
  app.done();
  expect(text, 'the screen of an empty store').toContain(L.empty);
});

test('nothing is written before the read settles', async () => {
  const app = launch({ readDelayMs: 300 });
  await sleep(150);
  const writesDuringRead = app.store.writes;
  const duringRead = app.storedRecords();
  await sleep(300);
  const afterRead = app.storedRecords();
  app.done();
  expect(writesDuringRead, 'writes made while the read was in flight').toBe(0);
  expect(duringRead, 'the stored expenses while the read was in flight').toEqual(stored());
  expect(afterRead, 'the stored expenses after the read').toEqual(stored());
});

test('a failed read shows the error with a retry and writes nothing', async () => {
  const app = launch({ failRead: true });
  await waitFor(() => app.text().includes(L.failed)).catch(() => {});
  await sleep(50);
  const text = app.text();
  const hasRetry = Boolean(app.button(L.retry));
  const writes = app.store.writes;
  const kept = app.storedRecords();
  app.done();
  expect(text, 'the screen after a failed read').toContain(L.failed);
  expect(hasRetry, 'a retry button after a failed read').toBe(true);
  expect(writes, 'writes made after a failed read').toBe(0);
  expect(kept, 'the stored expenses after a failed read').toEqual(stored());
});

test('retry reads again and shows the expenses', async () => {
  const app = launch({ failRead: true });
  await waitFor(() => app.text().includes(L.failed));
  await user.click(app.button(L.retry));
  await waitFor(() => app.text().includes(L.coffee), { timeout: 1500 }).catch(() => {});
  const text = app.text();
  app.done();
  expect(text, 'the screen after pressing retry').toContain(L.coffee);
});

test('adding after the load saves the new list', async () => {
  const app = launch();
  await waitFor(() => app.text().includes(L.coffee));
  await user.click(app.button(L.add));
  await waitFor(() => app.storedRecords()?.length === 3).catch(() => {});
  const saved = app.storedRecords();
  app.done();
  expect(saved, 'the stored expenses after adding one').toEqual([...stored(), lunch]);
});
