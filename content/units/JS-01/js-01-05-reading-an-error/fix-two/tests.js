test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('prints all three lines in order', () => {
  expect(logs()).toEqual([L.line1, L.line2, L.line3]);
});
