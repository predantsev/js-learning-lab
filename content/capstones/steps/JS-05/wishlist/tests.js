// Checks of capstone step JS-05, wishlist variant: searchItems, filterItems, sortItemsByPrice and
// summarizeItems are pure transformations of the list (the received list and its wishes never
// change), and the page shows the summary, the wanted wishes cheapest first and a search result.
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
  { id: 'w-01', name: L.fixture1Name, price: 80, acquired: false, category: L.techCategory },
  { id: 'w-02', name: L.fixture2Name, price: 45, acquired: false, category: L.homeCategory },
  { id: 'w-03', name: L.fixture3Name, price: 240, acquired: false, category: L.sportCategory },
  { id: 'w-04', name: L.fixture4Name, price: 25, acquired: true, category: L.booksCategory },
  { id: 'w-05', name: L.fixture5Name, price: null, acquired: false, category: null },
  { id: 'w-06', name: L.fixture6Name, price: 18, acquired: true, category: L.homeCategory },
];
// Language-independent test data for the transformations.
const wish = (id, name, price, acquired) => ({ id, name, price, acquired, category: null });
const sample = () => [
  wish('s-1', 'Desk lamp', 45, false),
  wish('s-2', 'Bicycle', null, false),
  wish('s-3', 'Lamp oil', 12, true),
  wish('s-4', 'Gift card', 0, false),
  wish('s-5', 'Mug', 45, true),
  wish('s-6', 'Tickets', null, true),
];
const ids = (list) => (Array.isArray(list) ? list.map((item) => item?.id) : list);

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the summary of the list', () => {
  const parts = [L.summaryCount, '6', L.summaryWantedTotal, '365', L.summaryNoPrice, '1'];
  expect(elementsWith(...parts).length > 0, `an element inside <main> with ${parts.map((p) => `"${p}"`).join(', ')} in this order`).toBe(true);
});

test('the page shows the wanted wishes cheapest first', () => {
  const order = [L.fixture2Name, L.fixture1Name, L.fixture3Name, L.fixture5Name];
  const lines = elementsWith(...order).filter((node) => !inOrder(node.textContent, L.fixture4Name) && !inOrder(node.textContent, L.fixture6Name));
  expect(lines.length > 0, `an element inside <main> with ${order.join(', ')} in this order and without "${L.fixture4Name}" and "${L.fixture6Name}"`).toBe(true);
});

test('the page shows the search result', () => {
  const others = NAMES().filter((name) => name !== L.fixture2Name);
  const lines = elementsWith(L.fixture2Name).filter((node) => others.every((name) => !inOrder(node.textContent, name)));
  expect(lines.length > 0, `an element inside <main> with "${L.fixture2Name}" and no other wish (the search for "${L.searchQuery}")`).toBe(true);
});

test('searchItems finds wishes by a part of the name, ignoring case', () => {
  const list = sample();
  const result = scope.searchItems(list, 'LaMp');
  expect(ids(result), 'searchItems(list, "LaMp")').toEqual(['s-1', 's-3']);
  expect(result[0] === list[0] && result[1] === list[2], 'the found wishes are the same objects').toBe(true);
  expect(ids(scope.searchItems(list, '  lamp ')), 'searchItems(list, "  lamp ") — spaces at the edges do not count').toEqual(['s-1', 's-3']);
  expect(list, 'the list searchItems received').toEqual(sample());
});

test('searchItems with an empty query keeps every wish and finds nothing for unknown text', () => {
  const list = sample();
  expect(ids(scope.searchItems(list, '')), 'searchItems(list, "")').toEqual(ids(sample()));
  expect(ids(scope.searchItems(list, '   ')), 'searchItems(list, "   ")').toEqual(ids(sample()));
  expect(scope.searchItems(list, 'piano'), 'searchItems(list, "piano")').toEqual([]);
  expect(scope.searchItems([], 'lamp'), 'searchItems([], "lamp")').toEqual([]);
});

test('filterItems keeps the wanted or the acquired wishes', () => {
  const list = sample();
  expect(ids(scope.filterItems(list, 'wanted')), 'filterItems(list, "wanted")').toEqual(['s-1', 's-2', 's-4']);
  expect(ids(scope.filterItems(list, 'acquired')), 'filterItems(list, "acquired")').toEqual(['s-3', 's-5', 's-6']);
  expect(scope.filterItems([], 'wanted'), 'filterItems([], "wanted")').toEqual([]);
  expect(list, 'the list filterItems received').toEqual(sample());
});

test('sortItemsByPrice orders a copy cheapest first with priceless wishes last', () => {
  const list = sample();
  const result = scope.sortItemsByPrice(list);
  expect(ids(result), 'sortItemsByPrice(list)').toEqual(['s-4', 's-3', 's-1', 's-5', 's-2', 's-6']);
  expect(result !== list, 'sortItemsByPrice returns a new array').toBe(true);
  expect(ids(list), 'the order of the list sortItemsByPrice received').toEqual(ids(sample()));
  expect(scope.sortItemsByPrice([]), 'sortItemsByPrice([])').toEqual([]);
});

test('summarizeItems counts the wishes and sums the wanted prices', () => {
  expect(scope.summarizeItems(fixtures()), 'summarizeItems for the six wishes of the project').toEqual({ count: 6, wantedTotal: 365, wantedWithoutPrice: 1 });
  const list = sample();
  expect(scope.summarizeItems(list), 'summarizeItems for a list with a price of 0 and wishes without a price').toEqual({ count: 6, wantedTotal: 45, wantedWithoutPrice: 1 });
  expect(list, 'the list summarizeItems received').toEqual(sample());
});

test('summarizeItems of an empty list is all zeros', () => {
  expect(scope.summarizeItems([]), 'summarizeItems([])').toEqual({ count: 0, wantedTotal: 0, wantedWithoutPrice: 0 });
});
