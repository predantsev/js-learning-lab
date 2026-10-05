const ready = (name) => expect(typeof scope[name], `type of ${name}`).toBe('function');

test('priceText formats a price, also 0, and names a missing price', () => {
  ready('priceText');
  expect(scope.priceText({ name: L.lamp, price: 45, category: null }), 'price 45').toBe(`45.00 ${L.currency}`);
  expect(scope.priceText({ name: L.lamp, price: 0, category: null }), 'price 0').toBe(`0.00 ${L.currency}`);
  expect(scope.priceText({ name: L.lamp, price: null, category: null }), 'price null').toBe(L.noPrice);
});

test('dueMonth gives the year and month, or the no-date text for null', () => {
  ready('dueMonth');
  expect(scope.dueMonth({ title: L.dentist, dueDate: '2026-03-10' }), 'dueDate "2026-03-10"').toBe('2026-03');
  expect(scope.dueMonth({ title: L.dentist, dueDate: null }), 'dueDate null').toBe(L.noDate);
});

test('categoryLabel gives the category in capitals, or the no-category text for null', () => {
  ready('categoryLabel');
  expect(scope.categoryLabel({ name: L.lamp, price: 45, category: L.home }), 'a category').toBe(L.home.toUpperCase());
  expect(scope.categoryLabel({ name: L.lamp, price: 45, category: null }), 'category null').toBe(L.noCategory);
});

test('the program prints the three fallback texts', () => {
  expect(logs(), 'the console of the program').toEqual([L.noPrice, L.noDate, L.noCategory]);
});
