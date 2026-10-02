const ready = (name) => expect(typeof scope[name], `type of ${name}`).toBe('function');

test('formatTitle removes the spaces around a title', () => {
  ready('formatTitle');
  expect(scope.formatTitle(`  ${L.mug}  `), 'formatTitle("  …  ")').toBe(L.mug);
});

test('formatPrice gives the free label for 0 and the amount with the currency otherwise', () => {
  ready('formatPrice');
  expect(scope.formatPrice(0), 'formatPrice(0)').toBe(L.free);
  expect(scope.formatPrice(45), 'formatPrice(45)').toBe(`45 ${L.currency}`);
});

test('isEmpty is true only for text without visible characters', () => {
  ready('isEmpty');
  expect(scope.isEmpty('   '), 'isEmpty("   ")').toBe(true);
  expect(scope.isEmpty(''), 'isEmpty("")').toBe(true);
  expect(scope.isEmpty(' a '), 'isEmpty(" a ")').toBe(false);
});

test('the program prints the title, the free label for the form price, and true', () => {
  expect(logs(), 'the console of the program').toEqual([L.lamp, L.free, 'true']);
});
