test('a price of 0 is not missing', () => {
  expect(scope.mugPriceMissing, 'mugPriceMissing').toBe(false);
});

test('a null price is missing', () => {
  expect(scope.ticketsPriceMissing, 'ticketsPriceMissing').toBe(true);
});

test('a price field that is not there is missing', () => {
  expect(scope.bookPriceMissing, 'bookPriceMissing').toBe(true);
});
