test('the program runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('formatAmount returns hryvnias with two digits after the point', () => {
  expect(scope.formatAmount(21050), 'formatAmount(21050)').toBe('210.50 ' + L.uah);
  expect(scope.formatAmount(9990), 'formatAmount(9990)').toBe('99.90 ' + L.uah);
  expect(scope.formatAmount(18000), 'formatAmount(18000)').toBe('180.00 ' + L.uah);
});

test('formatRow joins the label and the amount', () => {
  const coffee = { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' };
  expect(scope.formatRow(coffee), 'formatRow(coffee)').toBe(L.coffee + ': 180.00 ' + L.uah);
});

test('printExpense prints the row', () => {
  expect(logs(), 'printed lines').toContain(L.lunch + ': 210.50 ' + L.uah);
});

test('formatAmount prints the stack trace of the chain', () => {
  // Only the program's own call goes through printExpense; calls made by these checks do not.
  const trace = logs().find((line) => line.includes('at printExpense'));
  expect(trace, 'a printed stack trace that names printExpense').toBeDefined();
  const amountAt = trace.indexOf('at formatAmount');
  const rowAt = trace.indexOf('at formatRow');
  const printAt = trace.indexOf('at printExpense');
  expect(amountAt, 'position of formatAmount in the stack trace').toBeGreaterThanOrEqual(0);
  expect(rowAt, 'formatRow comes after formatAmount').toBeGreaterThan(amountAt);
  expect(printAt, 'printExpense comes after formatRow').toBeGreaterThan(rowAt);
});
