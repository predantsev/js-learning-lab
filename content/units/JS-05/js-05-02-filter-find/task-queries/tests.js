const sample = () => [
  { id: "t-01", title: L.water, done: false },
  { id: "t-02", title: L.books, done: false },
  { id: "t-04", title: L.internet, done: true },
  { id: "t-06", title: L.wardrobe, done: true },
];

test('byStatus(list, false) keeps every pending task', () => {
  const list = sample();
  expect(scope.byStatus(list, false), 'byStatus(list, false)').toEqual([list[0], list[1]]);
});

test('byStatus(list, true) keeps every done task', () => {
  const list = sample();
  expect(scope.byStatus(list, true), 'byStatus(list, true)').toEqual([list[2], list[3]]);
});

test('byStatus returns the same task objects, not copies', () => {
  const list = sample();
  const result = scope.byStatus(list, true);
  expect(Array.isArray(result) && result[0] === list[2], 'result[0] === list[2]').toBe(true);
});

test('byStatus gives an empty array when no task matches', () => {
  const allDone = sample().slice(2);
  expect(scope.byStatus(allDone, false), 'byStatus(only done tasks, false)').toEqual([]);
});

test('findById returns the task itself', () => {
  const list = sample();
  expect(scope.findById(list, 't-04'), 'findById(list, "t-04")').toBe(list[2]);
});

test('findById returns null for a missing id', () => {
  expect(scope.findById(sample(), 't-99'), 'findById(list, "t-99")').toBeNull();
});

test('searchByTitle ignores upper and lower case', () => {
  const list = sample();
  expect(scope.searchByTitle(list, L.queryUpper), `searchByTitle(list, "${L.queryUpper}")`).toEqual([list[1]]);
  expect(scope.searchByTitle(list, L.queryLower), `searchByTitle(list, "${L.queryLower}")`).toEqual([list[0]]);
});

test('searchByTitle gives an empty array when nothing matches', () => {
  expect(scope.searchByTitle(sample(), 'xyz'), 'searchByTitle(list, "xyz")').toEqual([]);
});

test('the list itself is not changed', () => {
  const list = sample();
  scope.byStatus(list, true);
  scope.findById(list, 't-02');
  scope.searchByTitle(list, L.queryLower);
  expect(list, 'the list after all three calls').toEqual(sample());
});
