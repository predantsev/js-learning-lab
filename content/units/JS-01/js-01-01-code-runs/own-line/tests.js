test('prints something', () => {
  expect(logs().length, 'number of printed lines').toBeGreaterThan(0);
});

test('prints your own text', () => {
  const first = rawLogs()[0];
  expect(typeof first?.args[0], 'type of the first printed value').toBe('string');
  expect(String(first.args[0]).trim().length, 'length of the printed text').toBeGreaterThan(0);
});
