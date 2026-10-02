test('prints the label', () => {
  expect(logs()[0] ?? '', 'first printed line').toContain(L.item);
});

test('prints the number 3', () => {
  expect(rawLogs()[0]?.args[1], 'second value of the first line').toBe(3);
});
