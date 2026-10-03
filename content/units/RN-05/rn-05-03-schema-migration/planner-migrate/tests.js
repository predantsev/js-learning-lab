import { migrate } from './migrate.js';

const v0 = () => ({
  schemaVersion: 0,
  records: [
    { id: 't-01', title: L.plants, due: '2026-03-02', done: false, priority: 'normal' },
    { id: 't-03', title: L.grandma, due: '', done: false, priority: 'low' },
    { id: 't-04', title: L.internet, done: true, priority: 'high' },
    { id: 't-05', title: L.dentist, due: '2026-03-10', done: false, priority: 'normal' },
  ],
});
const v1 = () => ({
  schemaVersion: 1,
  records: [
    { id: 't-02', title: L.books, dueDate: '2026-03-01', done: false, priority: 'high' },
    { id: 't-06', title: L.wardrobe, dueDate: null, done: true, priority: 'low' },
  ],
});
const fn = () => expect(typeof migrate, 'type of migrate').toBe('function');

test('a v0 snapshot becomes v1 with dueDate', () => {
  fn();
  expect(migrate(v0()), 'migrate of the v0 snapshot').toEqual({
    ok: true,
    snapshot: {
      schemaVersion: 1,
      records: [
        { id: 't-01', title: L.plants, dueDate: '2026-03-02', done: false, priority: 'normal' },
        { id: 't-03', title: L.grandma, dueDate: null, done: false, priority: 'low' },
        { id: 't-04', title: L.internet, dueDate: null, done: true, priority: 'high' },
        { id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, priority: 'normal' },
      ],
    },
  });
});

test('a current snapshot comes back unchanged', () => {
  fn();
  expect(migrate(v1()), 'migrate of a v1 snapshot').toEqual({ ok: true, snapshot: v1() });
});

test('migrating the result again changes nothing', () => {
  fn();
  const once = migrate(v0());
  expect(once.ok, 'migrate(v0).ok').toBe(true);
  expect(migrate(once.snapshot), 'migrate of an already migrated snapshot').toEqual(once);
});

test('no task is dropped, added or reordered', () => {
  fn();
  const ids = migrate(v0()).snapshot?.records?.map((task) => task.id);
  expect(ids, 'ids after migrating v0').toEqual(['t-01', 't-03', 't-04', 't-05']);
});

test('the stored snapshot passed in is not changed', () => {
  fn();
  const stored = v0();
  migrate(stored);
  expect(stored, 'the v0 snapshot after migrate').toEqual(v0());
});

test('a snapshot from a newer app version is reported as newer', () => {
  fn();
  expect(migrate({ schemaVersion: 2, records: v1().records }), 'migrate of a v2 snapshot').toEqual({ ok: false, reason: 'newer' });
});

test('a snapshot without a version or a records list is invalid', () => {
  fn();
  for (const broken of [{ schemaVersion: 1 }, { records: [] }, { schemaVersion: '1', records: [] }, null, 'tasks']) {
    expect(migrate(broken), `migrate(${JSON.stringify(broken)})`).toEqual({ ok: false, reason: 'invalid' });
  }
});
