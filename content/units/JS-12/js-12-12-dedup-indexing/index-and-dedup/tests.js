const habits = () => {
  const water = { id: 'h-01', name: 'Пити воду' };
  return [
    water,
    { id: 'h-02', name: 'Читати 20 хвилин' },
    { id: 'h-01', name: 'Пити воду' },
    { id: 'h-07', name: '  ПИТИ ВОДУ ' },
    { id: 'h-03', name: 'Прогулянка' },
  ];
};

test('indexById returns a Map from id to the record itself', () => {
  const list = habits();
  const index = scope.indexById(list);
  expect(index, 'result of indexById').toBeInstanceOf(Map);
  expect(index.get('h-02'), 'index.get("h-02")').toBe(list[1]);
  expect(index.get('h-03'), 'index.get("h-03")').toBe(list[4]);
  expect(index.get('h-99'), 'index.get("h-99")').toBeUndefined();
});

test('indexById keeps the first record of a repeated id', () => {
  const list = habits();
  const index = scope.indexById(list);
  expect(index.get('h-01'), 'index.get("h-01")').toBe(list[0]);
  expect(index.size, 'index.size').toBe(4);
});

test('a new index follows the records after an update', () => {
  const before = habits();
  scope.indexById(before);
  const changed = { id: 'h-02', name: 'Читати 30 хвилин' };
  const after = [before[0], changed, { id: 'h-04', name: 'Прибирання' }];
  const index = scope.indexById(after);
  expect(index.get('h-02'), 'index.get("h-02") after the update').toBe(changed);
  expect(index.get('h-04'), 'index.get("h-04"), a new record').toBe(after[2]);
  expect(index.has('h-03'), 'index.has("h-03"), a removed record').toBe(false);
});

test('dedupBy by id keeps the first of each id, in order', () => {
  const list = habits();
  const result = scope.dedupBy(list, (habit) => habit.id);
  expect(result.map((habit) => habit.id), 'ids after dedupBy by id').toEqual(['h-01', 'h-02', 'h-07', 'h-03']);
  expect(result[0], 'the kept h-01').toBe(list[0]);
});

test('dedupBy by a normalized name drops a case variant', () => {
  const result = scope.dedupBy(habits(), (habit) => habit.name.trim().toLowerCase());
  expect(result.map((habit) => habit.id), 'ids after dedupBy by name').toEqual(['h-01', 'h-02', 'h-03']);
});

test('dedupBy returns a new array and leaves the input alone', () => {
  const list = habits();
  const copy = [...list];
  const result = scope.dedupBy(list, (habit) => habit.id);
  expect(result === list, 'the result is the same array as the input').toBe(false);
  expect(list, 'the input after dedupBy').toEqual(copy);
  expect(scope.dedupBy([], (habit) => habit.id), 'dedupBy([])').toEqual([]);
});
