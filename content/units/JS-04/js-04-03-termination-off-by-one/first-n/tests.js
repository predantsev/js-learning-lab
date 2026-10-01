const habits = () => [
  { id: 'h-01', name: L.exercise },
  { id: 'h-02', name: L.reading },
  { id: 'h-03', name: L.water },
];
const ids = (list) => list.map((habit) => (habit === undefined ? 'undefined' : habit.id));

test('returns the first n habits', () => {
  expect(ids(scope.firstN(habits(), 2)), 'ids of firstN(habits, 2)').toEqual(['h-01', 'h-02']);
});

test('returns all habits when n equals the length', () => {
  expect(ids(scope.firstN(habits(), 3)), 'ids of firstN(habits, 3)').toEqual(['h-01', 'h-02', 'h-03']);
});

test('stops at the end of a shorter list', () => {
  expect(ids(scope.firstN(habits(), 5)), 'ids of firstN(habits, 5)').toEqual(['h-01', 'h-02', 'h-03']);
});

test('returns an empty array for n = 0', () => {
  expect(scope.firstN(habits(), 0), 'firstN(habits, 0)').toEqual([]);
});

test('returns an empty array for an empty list', () => {
  expect(scope.firstN([], 3), 'firstN([], 3)').toEqual([]);
});
