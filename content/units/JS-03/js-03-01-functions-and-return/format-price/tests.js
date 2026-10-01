test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('returns the price label', () => {
  expect(scope.formatPrice(80), 'formatPrice(80)').toBe(L.pricePrefix + '80');
  expect(scope.formatPrice(45), 'formatPrice(45)').toBe(L.pricePrefix + '45');
});

test('returns No price for null', () => {
  expect(scope.formatPrice(null), 'formatPrice(null)').toBe(L.noPrice);
});

test('keeps a price of 0', () => {
  expect(scope.formatPrice(0), 'formatPrice(0)').toBe(L.pricePrefix + '0');
});

test('returns the label instead of printing it', () => {
  const before = logs().length;
  const result = scope.formatPrice(10);
  expect(logs().length - before, 'lines printed by formatPrice(10)').toBe(0);
  expect(result, 'formatPrice(10)').toBe(L.pricePrefix + '10');
});

test('the page script prints both labels', () => {
  expect(logs()).toEqual([L.pricePrefix + '80', L.tickets + ' — ' + L.noPrice]);
});
