// Arrow functions have no own `prototype` property; function declarations do.
const isArrow = (fn) => typeof fn === 'function' && !('prototype' in fn);

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('formatPrice is an arrow function', () => {
  expect(isArrow(scope.formatPrice), 'formatPrice is an arrow function').toBe(true);
});

test('makeLabel is an arrow function', () => {
  expect(isArrow(scope.makeLabel), 'makeLabel is an arrow function').toBe(true);
});

test('formatPrice returns the same labels', () => {
  expect(scope.formatPrice(80), 'formatPrice(80)').toBe(L.pricePrefix + '80');
  expect(scope.formatPrice(null), 'formatPrice(null)').toBe(L.noPrice);
  expect(scope.formatPrice(0), 'formatPrice(0)').toBe(L.pricePrefix + '0');
});

test('makeLabel keeps its default unit', () => {
  expect(scope.makeLabel(L.bulbs), 'makeLabel(name)').toBe(L.bulbs + ' (' + L.pcs + ')');
  expect(scope.makeLabel(L.bulbs, 'x'), 'makeLabel(name, "x")').toBe(L.bulbs + ' (x)');
});

test('prints the same three lines', () => {
  expect(logs()).toEqual([L.pricePrefix + '80', L.noPrice, L.bulbs + ' (' + L.pcs + ')']);
});
