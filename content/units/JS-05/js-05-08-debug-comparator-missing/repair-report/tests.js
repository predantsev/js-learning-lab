const sample = () => [
  { id: "e-05", label: L.cinema, amountMinor: 30000 },
  { id: "e-04", label: L.bulbs, amountMinor: 9990 },
  { id: "e-01", label: L.groceries, amountMinor: 84550 },
  { id: "e-04", label: L.bulbs, amountMinor: 9990 },
];

test('the program runs without an error', () => {
  expect(loadError(), 'error while running the program').toBeNull();
});

test('sortByAmount puts the smallest amount first', () => {
  const ids = scope.sortByAmount(sample()).map((expense) => expense.id);
  expect(ids, 'ids after sortByAmount').toEqual(['e-04', 'e-04', 'e-05', 'e-01']);
});

test('sortByAmount leaves the list itself unchanged', () => {
  const list = sample();
  scope.sortByAmount(list);
  expect(list.map((expense) => expense.id), 'ids of the list after sortByAmount').toEqual(['e-05', 'e-04', 'e-01', 'e-04']);
});

test('totalAmount adds up all amounts', () => {
  expect(scope.totalAmount(sample()), 'totalAmount(4 expenses)').toBe(134530);
});

test('totalAmount of an empty list is 0', () => {
  expect(scope.totalAmount([]), 'totalAmount([])').toBe(0);
});

test('labelOf returns the label of a known id', () => {
  expect(scope.labelOf(sample(), 'e-01'), 'labelOf(list, "e-01")').toBe(L.groceries);
});

test('labelOf returns the unknown text for a missing id', () => {
  expect(scope.labelOf(sample(), 'e-99'), 'labelOf(list, "e-99")').toBe(L.unknown);
});

test('uniqueTotal counts a repeated expense once', () => {
  expect(scope.uniqueTotal(sample()), 'uniqueTotal(list with e-04 twice)').toBe(124540);
});

test('uniqueTotal of an empty list is 0', () => {
  expect(scope.uniqueTotal([]), 'uniqueTotal([])').toBe(0);
});
