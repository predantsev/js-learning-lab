import { dueMonth, loadTasks, priorityRank, taskLabel } from './tasks.ts';

const task = (fields) => ({ id: 't-05', title: L.dentist, dueDate: '2026-03-10', done: false, priority: 'normal', ...fields });

test('dueMonth gives the year and month, and the no-date text for null', () => {
  expect(dueMonth(task({})), 'dueMonth for 2026-03-10').toBe('2026-03');
  expect(dueMonth(task({ dueDate: null })), 'dueMonth for null').toBe(L.noDate);
});

test('priorityRank gives 0, 1 and 2 for high, normal and low', () => {
  expect(['high', 'normal', 'low'].map(priorityRank), 'ranks of high, normal, low').toEqual([0, 1, 2]);
});

test('taskLabel shows the title and the priority', () => {
  expect(taskLabel(task({ priority: 'high' })), 'taskLabel of a high task').toBe(`${L.dentist} (high)`);
});

test('loadTasks keeps only valid tasks', () => {
  const text = JSON.stringify([task({}), task({ id: 't-07', title: 7 }), task({ id: 't-08', priority: 'urgent' }), null, task({ id: 't-06', dueDate: null })]);
  expect(loadTasks(text).map((item) => item.id), 'ids kept from five stored records').toEqual(['t-05', 't-06']);
});

test('loadTasks gives an empty list for broken JSON or a non-array', () => {
  let result;
  expect(() => {
    result = loadTasks('[{"id": "t-05"');
  }, 'loadTasks with broken JSON').not.toThrow();
  expect(result, 'loadTasks with broken JSON').toEqual([]);
  expect(loadTasks('{"id": "t-05"}'), 'loadTasks with one object').toEqual([]);
});

test('the program prints two task lines', () => {
  expect(logs(), 'the console of the program').toEqual([`${L.water} (normal) | 2026-03 | 1`, `${L.grandma} (low) | ${L.noDate} | 2`]);
});
