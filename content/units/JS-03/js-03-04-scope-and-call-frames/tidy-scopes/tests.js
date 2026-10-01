const expected = (name, priceText) => name + ' — ' + priceText;
const leftovers = ['name', 'price', 'priceText', 'label'];

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('builds the label from its arguments', () => {
  expect(scope.makeLabel(L.headphones, 80), 'makeLabel(name, 80)').toBe(expected(L.headphones, '80 ' + L.uah));
  expect(scope.makeLabel(L.tickets, null), 'makeLabel(name, null)').toBe(expected(L.tickets, L.noPrice));
  expect(scope.makeLabel('X', 0), 'makeLabel("X", 0)').toBe(expected('X', '0 ' + L.uah));
});

test('does not change variables outside itself', () => {
  const before = leftovers.map((key) => scope[key]);
  scope.makeLabel('X', 1);
  scope.makeLabel('Y', null);
  leftovers.forEach((key, i) => expect(scope[key], `top-level ${key} after two calls`).toBe(before[i]));
});

test('prints the same two lines', () => {
  expect(logs()).toEqual([expected(L.headphones, '80 ' + L.uah), expected(L.tickets, L.noPrice)]);
});
