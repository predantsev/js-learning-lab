import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createSimulatedStore } from './native-store.js';
import { TasksScreen } from './TasksScreen.jsx';

const KEY = 'jsll.planner.v1';
const BACKUP_KEY = 'jsll.planner.v1.backup';
const labels = { loading: L.loading, failed: L.failed, empty: L.empty, recovered: L.recovered };
const seeds = {
  valid: JSON.stringify({
    schemaVersion: 1,
    records: [
      { id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, priority: 'normal' },
      { id: 't-06', title: L.wardrobe, dueDate: null, done: true, priority: 'low' },
    ],
  }),
  outdated: JSON.stringify({
    schemaVersion: 0,
    records: [
      { id: 't-01', title: L.plants, dueDate: '2026-03-02', status: 'open', priority: 'normal' },
      { id: 't-04', title: L.internet, dueDate: '2026-02-27', status: 'done', priority: 'high' },
    ],
  }),
  truncated: `{"schemaVersion":1,"records":[{"id":"t-02","title":"${L.books}","prior`,
  wrongShape: JSON.stringify({ schemaVersion: 1, records: { 't-03': { title: L.grandma, done: false } } }),
};

function launch(seed, readDelayMs = 100) {
  const store = createSimulatedStore({ entries: { [KEY]: seeds[seed] }, readDelayMs, log: false });
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box, { onUncaughtError: () => {} });
  root.render(createElement(TasksScreen, { storage: store, labels }));
  return {
    store,
    text: () => box.textContent,
    settled: () => waitFor(() => box.textContent !== '' && !box.textContent.includes(L.loading)).catch(() => {}),
    done: () => {
      root.unmount();
      box.remove();
    },
  };
}

test('a valid snapshot shows its tasks without a notice', async () => {
  const app = launch('valid');
  await app.settled();
  const text = app.text();
  app.done();
  expect(text, 'the screen').toContain(`○ ${L.dentist}`);
  expect(text, 'the screen').toContain(`✓ ${L.wardrobe}`);
  expect(text, 'the screen').not.toContain(L.recovered);
});

test('an outdated v0 snapshot shows the right done marks', async () => {
  const app = launch('outdated');
  await app.settled();
  const text = app.text();
  app.done();
  expect(text, 'the screen after loading the v0 snapshot').toContain(`○ ${L.plants}`);
  expect(text, 'the screen after loading the v0 snapshot').toContain(`✓ ${L.internet}`);
});

test('a truncated snapshot is set aside with a notice', async () => {
  const app = launch('truncated');
  await app.settled();
  await sleep(50);
  const text = app.text();
  const backup = app.store.peek(BACKUP_KEY);
  app.done();
  expect(text, 'the screen after loading damaged text').toContain(L.recovered);
  expect(backup, `the text under ${BACKUP_KEY}`).toBe(seeds.truncated);
});

test('a snapshot of the wrong shape is set aside with a notice', async () => {
  const app = launch('wrongShape');
  await app.settled();
  await sleep(50);
  const text = app.text();
  const backup = app.store.peek(BACKUP_KEY);
  app.done();
  expect(text, 'the screen after loading records that are not a list').toContain(L.recovered);
  expect(backup, `the text under ${BACKUP_KEY}`).toBe(seeds.wrongShape);
});

test('nothing is written to the planner key before the load settles', async () => {
  const app = launch('truncated', 300);
  await sleep(150);
  const writes = app.store.writes;
  const stored = app.store.peek(KEY);
  app.done();
  expect(writes, 'writes while the read was in flight').toBe(0);
  expect(stored, `the text under ${KEY} while the read was in flight`).toBe(seeds.truncated);
});
