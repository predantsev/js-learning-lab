const sample = () => [
  { id: "w-01", name: L.headphones, price: 80, category: L.tech },
  { id: "w-02", name: L.lamp, price: 45, category: L.home },
  { id: "w-05", name: L.tickets, price: null, category: null },
  { id: "w-06", name: L.mug, price: 18, category: L.home },
];
const expectedCounts = () => ({ [L.tech]: 1, [L.home]: 2, none: 1 });

test('totalPrice adds up the prices', () => {
  expect(scope.totalPrice(sample()), 'totalPrice(4 wishes)').toBe(143);
});

test('totalPrice skips an item with no price field at all', () => {
  const list = [...sample(), { id: "w-08", name: L.lamp, category: L.home }];
  expect(scope.totalPrice(list), 'totalPrice with a wish that has no price field').toBe(143);
});

test('totalPrice of an empty list is 0', () => {
  expect(scope.totalPrice([]), 'totalPrice([])').toBe(0);
});

test('countByCategory counts items per category', () => {
  expect(scope.countByCategory(sample()), 'countByCategory(4 wishes)').toEqual(expectedCounts());
});

test('countByCategory of an empty list is an empty object', () => {
  expect(scope.countByCategory([]), 'countByCategory([])').toEqual({});
});

test('calling countByCategory twice gives the same result', () => {
  // Only "the same as last time" is checked here; the right counts are checked above.
  const first = { ...scope.countByCategory(sample()) };
  expect(scope.countByCategory(sample()), 'the second call compared with the first').toEqual(first);
});

test('the items are not changed', () => {
  const list = sample();
  scope.totalPrice(list);
  scope.countByCategory(list);
  expect(list, 'the list after both calls').toEqual(sample());
});
