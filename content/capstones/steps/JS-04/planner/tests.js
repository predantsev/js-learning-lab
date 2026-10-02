// Checks of capstone step JS-04, planner variant: addTask, updateTask and removeTask return new
// arrays, reuse untouched records, never change their inputs, and addTask only adds a draft that
// validateTask accepts. The page shows the list before and after three changes.
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
/** The text between the first `a` and the next `b` (empty when either is missing). */
function between(text, a, b) {
  const t = norm(text);
  const start = t.indexOf(norm(a));
  if (start < 0) return '';
  const end = t.indexOf(norm(b), start + norm(a).length);
  return end < 0 ? '' : t.slice(start + norm(a).length, end);
}
const elementsWith = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].filter((node) => inOrder(node.textContent, ...parts));
const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];
const sameObjects = (result, list, skip = -1) => Array.isArray(result) && result.every((task, i) => i === skip || task === list[i]);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the list before the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
  const lines = elementsWith(...names);
  expect(lines.length > 0, `an element inside <main> with the six titles in order: ${names.join(', ')}`).toBe(true);
  expect(lines.some((node) => !inOrder(between(node.textContent, L.fixture5Name, L.fixture6Name), L.priorityHigh)), `"${L.fixture5Name}" without "${L.priorityHigh}" in the list before the changes`).toBe(true);
});

test('the page shows the list after the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.newName];
  const lines = elementsWith(...names).filter((node) => !inOrder(node.textContent, L.fixture6Name));
  expect(lines.length > 0, `an element inside <main> with ${names.join(', ')} in order and without "${L.fixture6Name}"`).toBe(true);
  expect(lines.some((node) => inOrder(between(node.textContent, L.fixture5Name, L.newName), L.priorityHigh)), `"${L.fixture5Name}" with "${L.priorityHigh}" in the list after the changes`).toBe(true);
});

test('tasks holds the six tasks and stays unchanged', () => {
  expect(scope.tasks, 'the list tasks after the page script ran').toEqual(fixtures());
});

test('addTask adds a checked task to the end of a new list', () => {
  const list = fixtures();
  const result = scope.addTask(list, 't-10', { title: '  Buy bread ', dueDate: '2026-03-03' });
  expect(Array.isArray(result) && result !== list, 'addTask returns a new array').toBe(true);
  expect(result.length, 'the length of the new list').toBe(7);
  const added = result[6];
  expect([added?.id, added?.title, added?.dueDate, added?.done, added?.priority], 'the added task: id, title, dueDate, done, priority').toEqual(['t-10', 'Buy bread', '2026-03-03', false, 'normal']);
  expect(sameObjects(result.slice(0, 6), list), 'the six old tasks are the same objects in the new list').toBe(true);
  expect(list, 'the list addTask received').toEqual(fixtures());
  const first = scope.addTask([], 't-11', { title: 'Buy bread', priority: 'low' });
  expect(first?.length, 'addTask with an empty list: the length of the new list').toBe(1);
});

test('addTask keeps the list for a draft that fails the check', () => {
  const list = fixtures();
  const result = scope.addTask(list, 't-12', { title: '', priority: 'urgent' });
  expect(result, 'addTask with the draft { title: "", priority: "urgent" }').toEqual(fixtures());
  expect(sameObjects(result, list), 'the tasks in the result are the same objects').toBe(true);
  expect(list, 'the list addTask received').toEqual(fixtures());
});

test('updateTask changes only the given fields of one task', () => {
  const list = fixtures();
  const result = scope.updateTask(list, 't-01', { done: true });
  expect(Array.isArray(result) && result !== list, 'updateTask returns a new array').toBe(true);
  expect(result[0], 'the task t-01 in the new list').toEqual({ ...fixtures()[0], done: true });
  expect(result[0] !== list[0], 'the changed task is a new object').toBe(true);
  expect(sameObjects(result, list, 0), 'the other tasks are the same objects').toBe(true);
  expect(list, 'the list updateTask received and its tasks').toEqual(fixtures());
});

test('updateTask with a new priority keeps the title and the due date', () => {
  const list = fixtures();
  const result = scope.updateTask(list, 't-05', { priority: 'high' });
  expect(result?.[4], 'the task t-05 after updateTask(list, "t-05", { priority: "high" })').toEqual({ ...fixtures()[4], priority: 'high' });
  expect(list[4].priority, 'the priority of t-05 in the list updateTask received').toBe('normal');
});

test('updateTask with an unknown id keeps every task', () => {
  const list = fixtures();
  const result = scope.updateTask(list, 't-99', { done: true });
  expect(result, 'updateTask with the id "t-99"').toEqual(fixtures());
  expect(sameObjects(result, list), 'the tasks in the result are the same objects').toBe(true);
  expect(scope.updateTask([], 't-01', { done: true }), 'updateTask with an empty list').toEqual([]);
});

test('removeTask removes only that task', () => {
  const list = fixtures();
  const result = scope.removeTask(list, 't-03');
  expect(Array.isArray(result) && result !== list, 'removeTask returns a new array').toBe(true);
  expect(result.map((task) => task.id), 'the ids in the new list').toEqual(['t-01', 't-02', 't-04', 't-05', 't-06']);
  expect(sameObjects(result, [list[0], list[1], list[3], list[4], list[5]]), 'the remaining tasks are the same objects').toBe(true);
  expect(list, 'the list removeTask received').toEqual(fixtures());
});

test('removeTask with an unknown id keeps every task', () => {
  const list = fixtures();
  expect(scope.removeTask(list, 't-99'), 'removeTask with the id "t-99"').toEqual(fixtures());
  expect(scope.removeTask([], 't-01'), 'removeTask with an empty list').toEqual([]);
});
