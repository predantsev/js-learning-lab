// Checks of capstone step JS-05, planner variant: searchTasks, filterTasks, sortTasks and
// countDueTasks are pure transformations of the list (the received list and its tasks never
// change), and the page shows the due count, the pending tasks in order and a search result.
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
const elementsWith = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].filter((node) => inOrder(node.textContent, ...parts));
const NAMES = () => [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
const fixtures = () => [
  { id: 't-01', title: L.fixture1Name, dueDate: '2026-03-02', done: false, priority: 'normal' },
  { id: 't-02', title: L.fixture2Name, dueDate: '2026-03-01', done: false, priority: 'high' },
  { id: 't-03', title: L.fixture3Name, dueDate: null, done: false, priority: 'low' },
  { id: 't-04', title: L.fixture4Name, dueDate: '2026-02-27', done: true, priority: 'high' },
  { id: 't-05', title: L.fixture5Name, dueDate: '2026-03-10', done: false, priority: 'normal' },
  { id: 't-06', title: L.fixture6Name, dueDate: '2026-03-05', done: true, priority: 'low' },
];
// Language-independent test data for the transformations.
const task = (id, title, dueDate, done, priority) => ({ id, title, dueDate, done, priority });
const sample = () => [
  task('s-1', 'Buy bread', '2026-03-05', false, 'normal'),
  task('s-2', 'Call the bank', null, false, 'low'),
  task('s-3', 'Bake Bread', '2026-03-01', true, 'low'),
  task('s-4', 'Pay rent', '2026-03-05', false, 'high'),
  task('s-5', 'Water plants', '2026-03-05', false, 'normal'),
  task('s-6', 'Read a book', null, false, 'high'),
];
const ids = (list) => (Array.isArray(list) ? list.map((one) => one?.id) : list);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows how many tasks are due', () => {
  const parts = [L.dueSummary, '2026-03-02', '2'];
  expect(elementsWith(...parts).length > 0, `an element inside <main> with "${L.dueSummary}", then "2026-03-02" and then the count 2`).toBe(true);
});

test('the page shows the pending tasks in order', () => {
  const order = [L.fixture2Name, L.fixture1Name, L.fixture5Name, L.fixture3Name];
  const lines = elementsWith(...order).filter((node) => !inOrder(node.textContent, L.fixture4Name) && !inOrder(node.textContent, L.fixture6Name));
  expect(lines.length > 0, `an element inside <main> with ${order.join(', ')} in this order and without "${L.fixture4Name}" and "${L.fixture6Name}"`).toBe(true);
});

test('the page shows the search result', () => {
  const others = NAMES().filter((name) => name !== L.fixture2Name);
  const lines = elementsWith(L.fixture2Name).filter((node) => others.every((name) => !inOrder(node.textContent, name)));
  expect(lines.length > 0, `an element inside <main> with "${L.fixture2Name}" and no other task (the search for "${L.searchQuery}")`).toBe(true);
});

test('searchTasks finds tasks by a part of the title, ignoring case', () => {
  const list = sample();
  const result = scope.searchTasks(list, 'BrEaD');
  expect(ids(result), 'searchTasks(list, "BrEaD")').toEqual(['s-1', 's-3']);
  expect(result[0] === list[0] && result[1] === list[2], 'the found tasks are the same objects').toBe(true);
  expect(ids(scope.searchTasks(list, '  bread ')), 'searchTasks(list, "  bread ") — spaces at the edges do not count').toEqual(['s-1', 's-3']);
  expect(list, 'the list searchTasks received').toEqual(sample());
});

test('searchTasks with an empty query keeps every task and finds nothing for unknown text', () => {
  const list = sample();
  expect(ids(scope.searchTasks(list, '')), 'searchTasks(list, "")').toEqual(ids(sample()));
  expect(ids(scope.searchTasks(list, '   ')), 'searchTasks(list, "   ")').toEqual(ids(sample()));
  expect(scope.searchTasks(list, 'piano'), 'searchTasks(list, "piano")').toEqual([]);
  expect(scope.searchTasks([], 'bread'), 'searchTasks([], "bread")').toEqual([]);
});

test('filterTasks keeps the pending or the done tasks', () => {
  const list = sample();
  expect(ids(scope.filterTasks(list, 'pending')), 'filterTasks(list, "pending")').toEqual(['s-1', 's-2', 's-4', 's-5', 's-6']);
  expect(ids(scope.filterTasks(list, 'done')), 'filterTasks(list, "done")').toEqual(['s-3']);
  expect(scope.filterTasks([], 'pending'), 'filterTasks([], "pending")').toEqual([]);
  expect(list, 'the list filterTasks received').toEqual(sample());
});

test('sortTasks orders a copy by due date and then by priority', () => {
  const list = sample();
  const result = scope.sortTasks(list);
  expect(ids(result), 'sortTasks(list)').toEqual(['s-3', 's-4', 's-1', 's-5', 's-6', 's-2']);
  expect(result !== list, 'sortTasks returns a new array').toBe(true);
  expect(ids(list), 'the order of the list sortTasks received').toEqual(ids(sample()));
  expect(scope.sortTasks([]), 'sortTasks([])').toEqual([]);
});

test('countDueTasks counts the pending tasks due on or before the day', () => {
  expect(scope.countDueTasks(fixtures(), '2026-03-02'), 'countDueTasks for the six tasks of the project and the day "2026-03-02"').toBe(2);
  expect(scope.countDueTasks(fixtures(), '2026-03-10'), 'countDueTasks for the six tasks of the project and the day "2026-03-10"').toBe(3);
  const list = sample();
  expect(scope.countDueTasks(list, '2026-03-05'), 'countDueTasks(list, "2026-03-05") — the day itself counts').toBe(3);
  expect(scope.countDueTasks(list, '2026-03-04'), 'countDueTasks(list, "2026-03-04") — done tasks and tasks without a due date never count').toBe(0);
  expect(list, 'the list countDueTasks received').toEqual(sample());
});

test('countDueTasks of an empty list is zero', () => {
  expect(scope.countDueTasks([], '2026-03-02'), 'countDueTasks([], "2026-03-02")').toBe(0);
});
