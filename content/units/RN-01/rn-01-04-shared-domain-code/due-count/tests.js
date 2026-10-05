import { countDueTasks } from './domain/tasks.ts';

const today = '2026-03-02';
const tasks = [
  { id: 't-01', title: L.t01, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.t02, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.t03, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.t04, dueDate: '2026-02-27', done: true, priority: 'high' },
];

test('countDueTasks counts the tasks it is given', () => {
  expect(typeof countDueTasks, 'type of countDueTasks').toBe('function');
  expect(countDueTasks(tasks, today), 'countDueTasks(tasks, "2026-03-02")').toBe(2);
  expect(countDueTasks([], today), 'countDueTasks([], "2026-03-02")').toBe(0);
});

test('countDueTasks ignores what localStorage holds', () => {
  expect(typeof countDueTasks, 'type of countDueTasks').toBe('function');
  const saved = storage.getItem('jsll.planner.v1');
  storage.setItem('jsll.planner.v1', JSON.stringify({ schemaVersion: 1, records: [] }));
  try {
    expect(countDueTasks(tasks, today), 'countDueTasks(tasks, today) with an empty store').toBe(2);
  } finally {
    if (saved === null) storage.removeItem('jsll.planner.v1');
    else storage.setItem('jsll.planner.v1', saved);
  }
});

test('the web entry prints the due count of the stored tasks', async () => {
  storage.setItem('jsll.planner.v1', JSON.stringify({ schemaVersion: 1, records: tasks.slice(1) }));
  const run = await rerun();
  expect(run.error, 'error while the entry ran').toBeNull();
  expect(run.logs, 'what the entry printed').toEqual([`${L.dueLabel}: 1`]);
});
