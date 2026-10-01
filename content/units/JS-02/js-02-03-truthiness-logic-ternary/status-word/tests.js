test('an active habit gets the active word', () => {
  expect(scope.morningStatus, 'morningStatus').toBe(L.active);
});

test('a paused habit gets the paused word', () => {
  expect(scope.englishStatus, 'englishStatus').toBe(L.paused);
});
