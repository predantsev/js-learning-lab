test('a label that fits is returned unchanged', () => {
  expect(scope.truncateLabel('Велосипед', 20), 'truncateLabel("Велосипед", 20)').toBe('Велосипед');
  expect(scope.truncateLabel('abc', 3), 'truncateLabel("abc", 3)').toBe('abc');
});

test('a long label keeps max characters and gets "…"', () => {
  expect(scope.truncateLabel('Велосипед', 4), 'truncateLabel("Велосипед", 4)').toBe('Вело…');
  expect(scope.truncateLabel('abcdefgh', 3), 'truncateLabel("abcdefgh", 3)').toBe('abc…');
});

test('an emoji is never cut in half', () => {
  expect(scope.truncateLabel('🎧🎧🎧', 2), 'truncateLabel("🎧🎧🎧", 2)').toBe('🎧🎧…');
  expect(scope.truncateLabel('🐈🐕🐈', 1), 'truncateLabel("🐈🐕🐈", 1)').toBe('🐈…');
});

test('max counts code points, not code units', () => {
  expect(scope.truncateLabel('🎧🎧', 2), 'truncateLabel("🎧🎧", 2)').toBe('🎧🎧');
  expect(scope.truncateLabel('🚲 ok', 4), 'truncateLabel("🚲 ok", 4)').toBe('🚲 ok');
});
