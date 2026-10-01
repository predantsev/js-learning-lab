test('double doubles', () => {
  expect(typeof scope.double, 'type of double').toBe('function');
  expect(scope.double(4), 'double(4)').toBe(8);
  expect(scope.double(0), 'double(0)').toBe(0);
});
