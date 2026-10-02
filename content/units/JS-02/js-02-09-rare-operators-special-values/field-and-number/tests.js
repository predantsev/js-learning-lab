test('finds a note field even when its value is undefined', () => {
  expect(scope.coffeeHasNote, 'coffeeHasNote').toBe(true);
});

test('a draft without a note field has no note', () => {
  expect(scope.taxiHasNote, 'taxiHasNote').toBe(false);
});

test('accepts a numeric amount text', () => {
  expect(scope.coffeeAmountOk, 'coffeeAmountOk').toBe(true);
});

test('rejects an empty amount text', () => {
  expect(scope.taxiAmountOk, 'taxiAmountOk').toBe(false);
});

test('rejects an amount text that is not a number', () => {
  expect(scope.cinemaAmountOk, 'cinemaAmountOk').toBe(false);
});
