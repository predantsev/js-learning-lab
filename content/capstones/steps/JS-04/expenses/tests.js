// Checks of capstone step JS-04, expense tracker variant: addExpense, updateExpense and
// removeExpense return new arrays, reuse untouched records, never change their inputs, and
// addExpense only adds a draft that validateExpense accepts. The page shows the list before and
// after three changes.
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
const amount = (hryvnias, kopiykas) => `${hryvnias}${L.decimalMark}${kopiykas}`;
const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
const sameObjects = (result, list, skip = -1) => Array.isArray(result) && result.every((expense, i) => i === skip || expense === list[i]);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the list before the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
  const lines = elementsWith(...names);
  expect(lines.length > 0, `an element inside <main> with the six labels in order: ${names.join(', ')}`).toBe(true);
  expect(lines.some((node) => inOrder(between(node.textContent, L.fixture4Name, L.fixture5Name), amount(99, '90'))), `"${L.fixture4Name}" with ${amount(99, '90')} in the list before the changes`).toBe(true);
});

test('the page shows the list after the changes', () => {
  const names = [L.fixture1Name, L.fixture2Name, L.fixture4Name, L.fixture5Name, L.fixture6Name, L.newName];
  const lines = elementsWith(...names).filter((node) => !inOrder(node.textContent, L.fixture3Name));
  expect(lines.length > 0, `an element inside <main> with ${names.join(', ')} in order and without "${L.fixture3Name}"`).toBe(true);
  expect(lines.some((node) => inOrder(between(node.textContent, L.fixture4Name, L.fixture5Name), amount(109, '90'))), `"${L.fixture4Name}" with ${amount(109, '90')} in the list after the changes`).toBe(true);
});

test('expenses holds the six expenses and stays unchanged', () => {
  expect(scope.expenses, 'the list expenses after the page script ran').toEqual(fixtures());
});

test('addExpense adds a checked expense to the end of a new list', () => {
  const list = fixtures();
  const result = scope.addExpense(list, 'e-10', { label: '  Taxi ', amountMinor: 15050, date: '2026-03-02', category: 'transport' });
  expect(Array.isArray(result) && result !== list, 'addExpense returns a new array').toBe(true);
  expect(result.length, 'the length of the new list').toBe(7);
  const added = result[6];
  expect([added?.id, added?.label, added?.amountMinor, added?.date, added?.category], 'the added expense: id, label, amountMinor, date, category').toEqual(['e-10', 'Taxi', 15050, '2026-03-02', 'transport']);
  expect(sameObjects(result.slice(0, 6), list), 'the six old expenses are the same objects in the new list').toBe(true);
  expect(list, 'the list addExpense received').toEqual(fixtures());
  const first = scope.addExpense([], 'e-11', { label: 'Taxi', amountMinor: 100, date: '2026-03-02', category: 'transport' });
  expect(first?.length, 'addExpense with an empty list: the length of the new list').toBe(1);
});

test('addExpense keeps the list for a draft that fails the check', () => {
  const list = fixtures();
  const result = scope.addExpense(list, 'e-12', { label: 'Taxi', amountMinor: 150.5, date: '2026-03-02', category: '' });
  expect(result, 'addExpense with the draft { label: "Taxi", amountMinor: 150.5, date: "2026-03-02", category: "" }').toEqual(fixtures());
  expect(sameObjects(result, list), 'the expenses in the result are the same objects').toBe(true);
  expect(list, 'the list addExpense received').toEqual(fixtures());
});

test('updateExpense changes only the given fields of one expense', () => {
  const list = fixtures();
  const result = scope.updateExpense(list, 'e-04', { amountMinor: 10990 });
  expect(Array.isArray(result) && result !== list, 'updateExpense returns a new array').toBe(true);
  expect(result[3], 'the expense e-04 in the new list').toEqual({ ...fixtures()[3], amountMinor: 10990 });
  expect(result[3] !== list[3], 'the changed expense is a new object').toBe(true);
  expect(sameObjects(result, list, 3), 'the other expenses are the same objects').toBe(true);
  expect(list, 'the list updateExpense received and its expenses').toEqual(fixtures());
});

test('updateExpense with a new category keeps the label and the date', () => {
  const list = fixtures();
  const result = scope.updateExpense(list, 'e-03', { category: 'food' });
  expect(result?.[2], 'the expense e-03 after updateExpense(list, "e-03", { category: "food" })').toEqual({ ...fixtures()[2], category: 'food' });
  expect(list[2].category, 'the category of e-03 in the list updateExpense received').toBe('fun');
});

test('updateExpense with an unknown id keeps every expense', () => {
  const list = fixtures();
  const result = scope.updateExpense(list, 'e-99', { amountMinor: 1 });
  expect(result, 'updateExpense with the id "e-99"').toEqual(fixtures());
  expect(sameObjects(result, list), 'the expenses in the result are the same objects').toBe(true);
  expect(scope.updateExpense([], 'e-01', { amountMinor: 1 }), 'updateExpense with an empty list').toEqual([]);
});

test('removeExpense removes only that expense', () => {
  const list = fixtures();
  const result = scope.removeExpense(list, 'e-03');
  expect(Array.isArray(result) && result !== list, 'removeExpense returns a new array').toBe(true);
  expect(result.map((expense) => expense.id), 'the ids in the new list').toEqual(['e-01', 'e-02', 'e-04', 'e-05', 'e-06']);
  expect(sameObjects(result, [list[0], list[1], list[3], list[4], list[5]]), 'the remaining expenses are the same objects').toBe(true);
  expect(list, 'the list removeExpense received').toEqual(fixtures());
});

test('removeExpense with an unknown id keeps every expense', () => {
  const list = fixtures();
  expect(scope.removeExpense(list, 'e-99'), 'removeExpense with the id "e-99"').toEqual(fixtures());
  expect(scope.removeExpense([], 'e-01'), 'removeExpense with an empty list').toEqual([]);
});
