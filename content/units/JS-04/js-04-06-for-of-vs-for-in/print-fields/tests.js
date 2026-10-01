// Lines printed while fn runs (earlier output of the program is ignored).
const linesOf = (fn) => {
  const before = logs().length;
  fn();
  return logs().slice(before);
};

test('prints every own field as "key: value"', () => {
  const expense = { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' };
  expect(linesOf(() => scope.printFields(expense)), 'printed lines').toEqual([
    'id: e-03',
    `label: ${L.coffee}`,
    'amountMinor: 18000',
    'date: 2026-02-28',
    'category: fun',
  ]);
});

test('skips inherited fields', () => {
  const defaults = { category: 'food', currency: 'UAH' };
  const expense = Object.create(defaults);
  expense.id = 'e-06';
  expense.amountMinor = 21050;
  expect(linesOf(() => scope.printFields(expense)), 'printed lines for a record that inherits category and currency').toEqual(['id: e-06', 'amountMinor: 21050']);
});

test('prints nothing for an empty record', () => {
  expect(linesOf(() => scope.printFields({})), 'printed lines for {}').toEqual([]);
});
