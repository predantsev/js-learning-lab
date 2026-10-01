test('adds up 1 to n', () => {
  expect(scope.sum, 'sum').toBe(55);
});

test('counts the halvings of the price', () => {
  expect(scope.halvings, 'halvings').toBe(5);
});
