test('adds two numbers', () => {
  expect(typeof scope.sum, 'type of sum').toBe('function');
  expect(scope.sum(2, 3), 'sum(2, 3)').toBe(5);
});
