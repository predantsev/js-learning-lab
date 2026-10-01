test('declares name, price and category', () => {
  expect(scope.name, 'name').toBe(L.lamp);
  expect(scope.category, 'category').toBe(L.home);
  expect(typeof scope.price, 'type of price').toBe('number');
});

test('lowers the price by 5', () => {
  expect(scope.price, 'price after the discount').toBe(40);
});

test('prints the name, the category and the new price', () => {
  const line = logs().find((text) => text.includes(L.lamp));
  expect(line, 'a printed line with the name').toBeDefined();
  expect(line, 'that line').toContain(L.home);
  expect(line, 'that line').toContain('40');
});
