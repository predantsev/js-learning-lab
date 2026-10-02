// Calls double() directly: while it is missing, the test throws a TypeError (matched by feedback).
test('double doubles', () => {
  expect(scope.double(4), 'double(4)').toBe(8);
  expect(scope.double(0), 'double(0)').toBe(0);
});
