// Checks of capstone step JS-05, habit tracker variant: searchHabits, filterHabits,
// sortHabitsByName and summarizeHabit are pure transformations (the received list, its habits and
// their dates never change), and the page shows the active habits by name with their completion
// rates over four days, and a search result.
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
/** The text after the first `a` up to the next `b`, or to the end when `b` is null. */
function after(text, a, b) {
  const t = norm(text);
  const start = t.indexOf(norm(a));
  if (start < 0) return '';
  const from = start + norm(a).length;
  if (b === null) return t.slice(from);
  const end = t.indexOf(norm(b), from);
  return end < 0 ? '' : t.slice(from, end);
}
const elementsWith = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].filter((node) => inOrder(node.textContent, ...parts));
const NAMES = () => [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
const fixtures = () => [
  { id: 'h-01', name: L.fixture1Name, frequency: 'daily', active: true, completions: ['2026-02-27', '2026-02-28', '2026-03-01'] },
  { id: 'h-02', name: L.fixture2Name, frequency: 'daily', active: true, completions: ['2026-02-26', '2026-02-28', '2026-03-01'] },
  { id: 'h-03', name: L.fixture3Name, frequency: 'daily', active: true, completions: ['2026-03-01'] },
  { id: 'h-04', name: L.fixture4Name, frequency: 'weekly', active: true, completions: ['2026-02-22', '2026-03-01'] },
  { id: 'h-05', name: L.fixture5Name, frequency: 'daily', active: false, completions: ['2026-02-20'] },
  { id: 'h-06', name: L.fixture6Name, frequency: 'daily', active: true, completions: [] },
];
// The active habits sorted by name the way localeCompare orders them in this language.
const activeByName = () => [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture6Name].sort((a, b) => a.localeCompare(b));
// Language-independent test data for the transformations.
const habit = (id, name, active, completions) => ({ id, name, frequency: 'daily', active, completions });
const sample = () => [
  habit('s-1', 'yoga', true, ['2026-03-01', '2026-03-03']),
  habit('s-2', 'Stretching', false, []),
  habit('s-3', 'Morning yoga', true, ['2026-03-02']),
  habit('s-4', 'meditation', true, ['2026-03-01', '2026-03-02', '2026-03-03']),
  habit('s-5', 'Stretching', true, ['2026-02-28']),
];
const DAYS = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04'];
const ids = (list) => (Array.isArray(list) ? list.map((one) => one?.id) : list);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the active habits sorted by name', () => {
  const order = activeByName();
  const lines = elementsWith(...order).filter((node) => !inOrder(node.textContent, L.fixture5Name));
  expect(lines.length > 0, `an element inside <main> with ${order.join(', ')} in this order and without "${L.fixture5Name}"`).toBe(true);
});

test('the page shows the completion rates', () => {
  const order = activeByName();
  const next = (name) => order[order.indexOf(name) + 1] ?? null;
  const lines = elementsWith(...order).filter((node) => !inOrder(node.textContent, L.fixture5Name));
  const rated = lines.some((node) => inOrder(after(node.textContent, L.fixture1Name, next(L.fixture1Name)), '75') && inOrder(after(node.textContent, L.fixture3Name, next(L.fixture3Name)), '25'));
  expect(rated, `"${L.fixture1Name}" with 75 and "${L.fixture3Name}" with 25 (percent of the four days) in the list of active habits`).toBe(true);
});

test('the page shows the search result', () => {
  const others = NAMES().filter((name) => name !== L.fixture3Name);
  const lines = elementsWith(L.fixture3Name).filter((node) => others.every((name) => !inOrder(node.textContent, name)));
  expect(lines.length > 0, `an element inside <main> with "${L.fixture3Name}" and no other habit (the search for "${L.searchQuery}")`).toBe(true);
});

test('searchHabits finds habits by a part of the name, ignoring case', () => {
  const list = sample();
  const result = scope.searchHabits(list, 'YoGa');
  expect(ids(result), 'searchHabits(list, "YoGa")').toEqual(['s-1', 's-3']);
  expect(result[0] === list[0] && result[1] === list[2], 'the found habits are the same objects').toBe(true);
  expect(ids(scope.searchHabits(list, '  yoga ')), 'searchHabits(list, "  yoga ") — spaces at the edges do not count').toEqual(['s-1', 's-3']);
  expect(list, 'the list searchHabits received').toEqual(sample());
});

test('searchHabits with an empty query keeps every habit and finds nothing for unknown text', () => {
  const list = sample();
  expect(ids(scope.searchHabits(list, '')), 'searchHabits(list, "")').toEqual(ids(sample()));
  expect(ids(scope.searchHabits(list, '   ')), 'searchHabits(list, "   ")').toEqual(ids(sample()));
  expect(scope.searchHabits(list, 'piano'), 'searchHabits(list, "piano")').toEqual([]);
  expect(scope.searchHabits([], 'yoga'), 'searchHabits([], "yoga")').toEqual([]);
});

test('filterHabits keeps the active or the paused habits', () => {
  const list = sample();
  expect(ids(scope.filterHabits(list, 'active')), 'filterHabits(list, "active")').toEqual(['s-1', 's-3', 's-4', 's-5']);
  expect(ids(scope.filterHabits(list, 'paused')), 'filterHabits(list, "paused")').toEqual(['s-2']);
  expect(scope.filterHabits([], 'active'), 'filterHabits([], "active")').toEqual([]);
  expect(list, 'the list filterHabits received').toEqual(sample());
});

test('sortHabitsByName orders a copy alphabetically', () => {
  const list = sample();
  const result = scope.sortHabitsByName(list);
  expect(ids(result), 'sortHabitsByName(list) — names "yoga", "Stretching", "Morning yoga", "meditation", "Stretching"').toEqual(['s-4', 's-3', 's-2', 's-5', 's-1']);
  expect(result !== list, 'sortHabitsByName returns a new array').toBe(true);
  expect(ids(list), 'the order of the list sortHabitsByName received').toEqual(ids(sample()));
  expect(scope.sortHabitsByName([]), 'sortHabitsByName([])').toEqual([]);
});

test('summarizeHabit counts the completed days and the rate', () => {
  const list = sample();
  expect(scope.summarizeHabit(list[3], DAYS), 'summarizeHabit for "meditation" over four days').toEqual({ count: 3, rate: 0.75 });
  expect(scope.summarizeHabit(list[0], DAYS), 'summarizeHabit for "yoga" over four days').toEqual({ count: 2, rate: 0.5 });
  expect(scope.summarizeHabit(list[4], DAYS), 'summarizeHabit for a habit completed only outside these days').toEqual({ count: 0, rate: 0 });
  const three = scope.summarizeHabit(list[3], ['2026-03-01', '2026-03-05', '2026-03-06']);
  expect(three?.count, 'count over three days with one completion').toBe(1);
  expect(three?.rate, 'rate over three days with one completion').toBeCloseTo(1 / 3, 6);
  expect(scope.summarizeHabit(fixtures()[0], ['2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01']), `summarizeHabit for "${L.fixture1Name}" over the four days of the page`).toEqual({ count: 3, rate: 0.75 });
  expect(list, 'the habits summarizeHabit received').toEqual(sample());
});

test('summarizeHabit with no days gives zeros, not NaN', () => {
  expect(scope.summarizeHabit(sample()[3], []), 'summarizeHabit(habit, [])').toEqual({ count: 0, rate: 0 });
});
