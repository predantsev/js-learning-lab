const totalsFn = () => {
  expect(typeof scope.totalsByCategory, 'type of totalsByCategory').toBe('function');
  return scope.totalsByCategory;
};

test('gives the right totals for the six project expenses', () => {
  const totals = totalsFn()(scope.expenses);
  expect(totals, 'totalsByCategory(expenses)').toEqual({ food: 105600, transport: 52000, home: 9990, fun: 48000 });
});

test('counts a list with a single home expense', () => {
  const totals = totalsFn()([{ id: 'e-90', label: 'x', amountMinor: 500, date: '2026-03-03', category: 'home' }]);
  expect(totals, 'totals for one home expense').toEqual({ food: 0, transport: 0, home: 500, fun: 0 });
});

test('gives all four categories with 0 for an empty list', () => {
  expect(totalsFn()([]), 'totalsByCategory([])').toEqual({ food: 0, transport: 0, home: 0, fun: 0 });
});

test('prints only the totals line', () => {
  expect(logs().length, 'number of lines printed by the program').toBe(1);
});
