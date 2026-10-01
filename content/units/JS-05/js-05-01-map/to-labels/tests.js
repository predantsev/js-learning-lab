const sample = () => [
  { id: "w-02", name: L.lamp, price: 45 },
  { id: "w-05", name: L.tickets, price: null },
  { id: "w-07", name: L.headphones, price: 0 },
];

test('returns an array with one label per item', () => {
  const result = scope.toLabels(sample());
  expect(Array.isArray(result), 'toLabels returns an array').toBe(true);
  expect(result, 'labels').toHaveLength(3);
});

test('a label is the name, a colon and the price', () => {
  expect(scope.toLabels(sample())[0], 'first label').toBe(L.lamp + ': 45');
});

test('an item without a price gets the no-price words', () => {
  expect(scope.toLabels(sample())[1], 'label of the item without a price').toBe(L.tickets + ': ' + L.noPrice);
});

test('a price of 0 is shown as 0', () => {
  expect(scope.toLabels(sample())[2], 'label of the item priced 0').toBe(L.headphones + ': 0');
});

test('an empty list gives an empty array', () => {
  expect(scope.toLabels([]), 'toLabels([])').toEqual([]);
});

test('the items themselves are not changed', () => {
  const list = sample();
  scope.toLabels(list);
  expect(list, 'the list after toLabels').toEqual(sample());
});
