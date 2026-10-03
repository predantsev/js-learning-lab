import { createDeviceStore } from './device-store.js';
import { KEY, MAX_SNAPSHOT_LENGTH, loadSnapshot, saveSnapshot } from './snapshot.ts';

const task = (id, title) => ({ id, title, dueDate: null, done: false, priority: 'normal' });
const two = () => [task('t-01', L.plants), task('t-02', L.books)];

// One task whose title is padded so that the saved JSON text has exactly `length` characters.
function recordsOfLength(length) {
  const base = JSON.stringify({ schemaVersion: 1, records: [task('t-09', '')] }).length;
  return [task('t-09', 'x'.repeat(length - base))];
}

test('both functions return promises', () => {
  expect(typeof loadSnapshot, 'type of loadSnapshot').toBe('function');
  expect(typeof saveSnapshot, 'type of saveSnapshot').toBe('function');
  const store = createDeviceStore();
  const loading = loadSnapshot(store);
  const saving = saveSnapshot(store, []);
  loading?.catch?.(() => {});
  saving?.catch?.(() => {});
  expect(typeof loading?.then, 'loadSnapshot(store).then').toBe('function');
  expect(typeof saving?.then, 'saveSnapshot(store, []).then').toBe('function');
});

test('an empty store gives null', async () => {
  expect(typeof loadSnapshot, 'type of loadSnapshot').toBe('function');
  expect(await loadSnapshot(createDeviceStore()), 'loadSnapshot of an empty store').toBeNull();
});

test('saving writes the snapshot as JSON text under the planner key', async () => {
  expect(typeof saveSnapshot, 'type of saveSnapshot').toBe('function');
  const store = createDeviceStore();
  const result = await saveSnapshot(store, two());
  const text = store.peek(KEY);
  expect(typeof text, `type of the value stored under ${KEY}`).toBe('string');
  expect(JSON.parse(text), 'the stored snapshot').toEqual({ schemaVersion: 1, records: two() });
  expect(result, 'what saveSnapshot returned').toEqual({ ok: true, length: text.length });
});

test('loading gives back what was saved', async () => {
  expect(typeof saveSnapshot, 'type of saveSnapshot').toBe('function');
  const store = createDeviceStore({ delayMs: 20 });
  await saveSnapshot(store, two());
  expect(await loadSnapshot(store), 'loadSnapshot after saveSnapshot').toEqual({ schemaVersion: 1, records: two() });
});

test('a snapshot over the limit is refused and nothing is written', async () => {
  expect(typeof saveSnapshot, 'type of saveSnapshot').toBe('function');
  const store = createDeviceStore();
  await saveSnapshot(store, two());
  const before = store.peek(KEY);
  const writes = store.writes;
  const result = await saveSnapshot(store, recordsOfLength(MAX_SNAPSHOT_LENGTH + 1));
  expect(result, 'what saveSnapshot returned for a too long snapshot').toEqual({ ok: false, reason: 'too-large', length: MAX_SNAPSHOT_LENGTH + 1 });
  expect(store.writes - writes, 'writes made for the too long snapshot').toBe(0);
  expect(store.peek(KEY), 'the snapshot saved earlier').toBe(before);
});

test('a snapshot of exactly the limit is saved', async () => {
  expect(typeof saveSnapshot, 'type of saveSnapshot').toBe('function');
  const store = createDeviceStore();
  const result = await saveSnapshot(store, recordsOfLength(MAX_SNAPSHOT_LENGTH));
  expect(result, 'what saveSnapshot returned at exactly the limit').toEqual({ ok: true, length: MAX_SNAPSHOT_LENGTH });
  expect(store.peek(KEY)?.length, 'length of the stored text').toBe(MAX_SNAPSHOT_LENGTH);
});
