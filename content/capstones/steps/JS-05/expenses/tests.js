// Checks of capstone step JS-05, expense tracker variant: searchExpenses, filterExpenses,
// sortExpenses and summarizeExpenses are pure transformations of the list (the received list and
// its expenses never change), and the page shows the totals, the food expenses by amount and a
// search result.
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
const amount = (hryvnias, kopiykas) => `${hryvnias}${L.decimalMark}${kopiykas}`;
const NAMES = () => [L.fixture1Name, L.fixture2Name, L.fixture3Name, L.fixture4Name, L.fixture5Name, L.fixture6Name];
const fixtures = () => [
  { id: 'e-01', label: L.fixture1Name, amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: L.fixture2Name, amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: L.fixture3Name, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: L.fixture4Name, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: L.fixture5Name, amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: L.fixture6Name, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];
// Language-independent test data for the transformations.
const expense = (id, label, amountMinor, date, category) => ({ id, label, amountMinor, date, category });
const sample = () => [
  expense('s-1', 'Bus ticket', 800, '2026-03-02', 'transport'),
  expense('s-2', 'Pizza', 2500, '2026-03-01', 'food'),
  expense('s-3', 'Night bus', 800, '2026-02-28', 'transport'),
  expense('s-4', 'Cinema', 3000, '2026-03-01', 'fun'),
  expense('s-5', 'Soup', 1200, '2026-03-02', 'food'),
];
const ids = (list) => (Array.isArray(list) ? list.map((one) => one?.id) : list);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the totals by category and the overall total', () => {
  const parts = [L.categoryFood, amount(1056, '00'), L.categoryTransport, amount(520, '00'), L.categoryHome, amount(99, '90'), L.categoryFun, amount(480, '00'), L.totalLabel, amount(2155, '90')];
  expect(elementsWith(...parts).length > 0, `an element inside <main> with ${parts.map((p) => `"${p}"`).join(', ')} in this order`).toBe(true);
});

test('the page shows the food expenses by amount', () => {
  const order = [L.fixture6Name, L.fixture1Name];
  const others = NAMES().filter((name) => !order.includes(name));
  const lines = elementsWith(...order).filter((node) => others.every((name) => !inOrder(node.textContent, name)));
  expect(lines.length > 0, `an element inside <main> with "${L.fixture6Name}" and then "${L.fixture1Name}", without the other expenses`).toBe(true);
});

test('the page shows the search result', () => {
  const others = NAMES().filter((name) => name !== L.fixture5Name);
  const lines = elementsWith(L.fixture5Name).filter((node) => others.every((name) => !inOrder(node.textContent, name)));
  expect(lines.length > 0, `an element inside <main> with "${L.fixture5Name}" and no other expense (the search for "${L.searchQuery}")`).toBe(true);
});

test('searchExpenses finds expenses by a part of the label, ignoring case', () => {
  const list = sample();
  const result = scope.searchExpenses(list, 'BuS');
  expect(ids(result), 'searchExpenses(list, "BuS")').toEqual(['s-1', 's-3']);
  expect(result[0] === list[0] && result[1] === list[2], 'the found expenses are the same objects').toBe(true);
  expect(ids(scope.searchExpenses(list, '  bus ')), 'searchExpenses(list, "  bus ") — spaces at the edges do not count').toEqual(['s-1', 's-3']);
  expect(list, 'the list searchExpenses received').toEqual(sample());
});

test('searchExpenses with an empty query keeps every expense and finds nothing for unknown text', () => {
  const list = sample();
  expect(ids(scope.searchExpenses(list, '')), 'searchExpenses(list, "")').toEqual(ids(sample()));
  expect(ids(scope.searchExpenses(list, '   ')), 'searchExpenses(list, "   ")').toEqual(ids(sample()));
  expect(scope.searchExpenses(list, 'piano'), 'searchExpenses(list, "piano")').toEqual([]);
  expect(scope.searchExpenses([], 'bus'), 'searchExpenses([], "bus")').toEqual([]);
});

test('filterExpenses keeps the expenses of one category', () => {
  const list = sample();
  expect(ids(scope.filterExpenses(list, 'transport')), 'filterExpenses(list, "transport")').toEqual(['s-1', 's-3']);
  expect(ids(scope.filterExpenses(list, 'food')), 'filterExpenses(list, "food")').toEqual(['s-2', 's-5']);
  expect(scope.filterExpenses(list, 'home'), 'filterExpenses(list, "home") — no such expenses').toEqual([]);
  expect(list, 'the list filterExpenses received').toEqual(sample());
});

test('sortExpenses orders a copy by amount or by date', () => {
  const list = sample();
  const byAmount = scope.sortExpenses(list, 'amountMinor');
  expect(ids(byAmount), 'sortExpenses(list, "amountMinor")').toEqual(['s-1', 's-3', 's-5', 's-2', 's-4']);
  expect(ids(scope.sortExpenses(list, 'date')), 'sortExpenses(list, "date")').toEqual(['s-3', 's-2', 's-4', 's-1', 's-5']);
  expect(byAmount !== list, 'sortExpenses returns a new array').toBe(true);
  expect(ids(list), 'the order of the list sortExpenses received').toEqual(ids(sample()));
  expect(scope.sortExpenses([], 'date'), 'sortExpenses([], "date")').toEqual([]);
});

test('summarizeExpenses gives the total of every category and the overall total', () => {
  expect(scope.summarizeExpenses(fixtures()), 'summarizeExpenses for the six expenses of the project').toEqual({ total: 215590, byCategory: { food: 105600, transport: 52000, home: 9990, fun: 48000 } });
  const list = sample();
  expect(scope.summarizeExpenses(list), 'summarizeExpenses for a list without home expenses').toEqual({ total: 8300, byCategory: { food: 3700, transport: 1600, home: 0, fun: 3000 } });
  expect(list, 'the list summarizeExpenses received').toEqual(sample());
});

test('summarizeExpenses of an empty list is all zeros', () => {
  expect(scope.summarizeExpenses([]), 'summarizeExpenses([])').toEqual({ total: 0, byCategory: { food: 0, transport: 0, home: 0, fun: 0 } });
});
