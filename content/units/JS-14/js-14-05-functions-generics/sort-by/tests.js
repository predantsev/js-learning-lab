const ready = () => expect(typeof scope.sortBy, 'type of sortBy').toBe('function');

const expenses = () => [
  { id: 'e-01', amountMinor: 84550 },
  { id: 'e-04', amountMinor: 9990 },
  { id: 'e-03', amountMinor: 18000 },
];

test('sortBy returns the items ordered by the key, smallest first', () => {
  ready();
  const sorted = scope.sortBy(expenses(), (expense) => expense.amountMinor);
  expect(sorted.map((expense) => expense.id), 'ids sorted by amountMinor').toEqual(['e-04', 'e-03', 'e-01']);
  expect(scope.sortBy([3, 1, 2], (n) => -n), 'numbers sorted by their negative').toEqual([3, 2, 1]);
});

test('sortBy returns a new array and leaves the given one unchanged', () => {
  ready();
  const original = expenses();
  const sorted = scope.sortBy(original, (expense) => expense.amountMinor);
  expect(sorted === original, 'the result is the same array object as the argument').toBe(false);
  expect(original.map((expense) => expense.id), 'ids of the given array after the call').toEqual(['e-01', 'e-04', 'e-03']);
});

test('the program prints the sorted ids and the unchanged first items', () => {
  expect(logs(), 'the console of the program').toEqual(['w-06 w-02 w-03', 't-02 t-01 t-03', 'w-03 t-03']);
});
