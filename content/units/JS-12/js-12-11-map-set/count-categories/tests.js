const records = () => [
  { id: 'e-01', amountMinor: 84550, category: 'food' },
  { id: 'e-02', amountMinor: 52000, category: 'transport' },
  { id: 'e-03', amountMinor: 18000, category: 'fun' },
  { id: 'e-04', amountMinor: 9990, category: 'home' },
  { id: 'e-05', amountMinor: 30000, category: 'fun' },
  { id: 'e-06', amountMinor: 21050, category: 'food' },
];

test('returns a Map', () => {
  expect(scope.countByCategory(records()), 'result of countByCategory').toBeInstanceOf(Map);
});

test('counts every category', () => {
  const counts = scope.countByCategory(records());
  expect(counts.get('food'), 'count for "food"').toBe(2);
  expect(counts.get('fun'), 'count for "fun"').toBe(2);
  expect(counts.get('transport'), 'count for "transport"').toBe(1);
  expect(counts.get('home'), 'count for "home"').toBe(1);
  expect(counts.size, 'number of categories').toBe(4);
});

test('keeps the order in which categories first appear', () => {
  expect([...scope.countByCategory(records()).keys()], 'categories in order').toEqual(['food', 'transport', 'fun', 'home']);
});

test('counts a category named like a built-in property', () => {
  const counts = scope.countByCategory([{ category: 'toString' }, { category: 'constructor' }, { category: 'toString' }]);
  expect(counts.get('toString'), 'count for "toString"').toBe(2);
  expect(counts.get('constructor'), 'count for "constructor"').toBe(1);
});

test('an empty list gives an empty Map', () => {
  const counts = scope.countByCategory([]);
  expect(counts, 'result for []').toBeInstanceOf(Map);
  expect(counts.size, 'size for []').toBe(0);
});

test('turns the counts into JSON text', () => {
  expect(scope.categoryCountsJson(records()), 'categoryCountsJson(expenses)').toBe('{"food":2,"transport":1,"fun":2,"home":1}');
});
