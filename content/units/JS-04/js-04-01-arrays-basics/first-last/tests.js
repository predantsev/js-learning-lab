test('returns the first element', () => {
  expect(scope.firstOrNull([80, 45, 240]), 'firstOrNull([80, 45, 240])').toBe(80);
  expect(scope.firstOrNull(['w-01']), "firstOrNull(['w-01'])").toBe('w-01');
});

test('returns the last element', () => {
  expect(scope.lastOrNull([80, 45, 240]), 'lastOrNull([80, 45, 240])').toBe(240);
  expect(scope.lastOrNull(['w-01']), "lastOrNull(['w-01'])").toBe('w-01');
});

test('returns null for an empty list', () => {
  expect(scope.firstOrNull([]), 'firstOrNull([])').toBeNull();
  expect(scope.lastOrNull([]), 'lastOrNull([])').toBeNull();
});

test('keeps a real 0 or empty text', () => {
  expect(scope.firstOrNull([0, 45]), 'firstOrNull([0, 45])').toBe(0);
  expect(scope.lastOrNull([45, '']), "lastOrNull([45, ''])").toBe('');
});

test('does not change the list', () => {
  const list = [80, 45, 240];
  scope.firstOrNull(list);
  scope.lastOrNull(list);
  expect(list, 'the list after both calls').toEqual([80, 45, 240]);
});
