const sample = () => [
  { id: "t-01", title: L.water },
  { id: "t-02", title: L.books },
  { id: "t-03", title: L.grandma },
  { id: "t-02", title: L.booksAgain },
];

test('indexById maps each id to its record', () => {
  const list = sample();
  const index = scope.indexById(list);
  expect(index?.['t-01'] === list[0] && index?.['t-03'] === list[2], 'index["t-01"] and index["t-03"] are the records themselves').toBe(true);
});

test('indexById keeps the first record for a repeated id', () => {
  const list = sample();
  expect(scope.indexById(list)?.['t-02'] === list[1], 'index["t-02"] is the first t-02 record').toBe(true);
});

test('indexById of an empty list is an empty object', () => {
  expect(scope.indexById([]), 'indexById([])').toEqual({});
});

test('pickByIds returns the records in the order of the ids', () => {
  const list = sample();
  const picked = scope.pickByIds(list, ['t-03', 't-01']);
  expect(Array.isArray(picked) && picked.length === 2 && picked[0] === list[2] && picked[1] === list[0], 'pickByIds(list, ["t-03", "t-01"]) gives those two records in that order').toBe(true);
});

test('pickByIds gives null for an unknown id', () => {
  expect(scope.pickByIds(sample(), ['t-99']), 'pickByIds(list, ["t-99"])').toEqual([null]);
});

test('an id such as toString is not found by accident', () => {
  expect(scope.pickByIds(sample(), ['toString', 'constructor']), 'pickByIds(list, ["toString", "constructor"])').toEqual([null, null]);
});

test('pickByIds reads each id only a few times', () => {
  let reads = 0;
  const records = [];
  const ids = [];
  for (let i = 0; i < 300; i++) {
    const id = 'r-' + i;
    records.push({ title: L.water, get id() { reads += 1; return id; } });
    ids.push('r-' + (299 - i));
  }
  scope.pickByIds(records, ids);
  // Only the amount of work is checked here; the answers are checked by the other tests.
  expect(reads, 'how many times the 300 ids were read').toBeGreaterThanOrEqual(300);
  expect(reads, 'how many times the 300 ids were read').toBeLessThanOrEqual(1500);
});

test('the records list is not changed', () => {
  const list = sample();
  scope.indexById(list);
  scope.pickByIds(list, ['t-02', 't-99']);
  expect(list, 'the list after both calls').toEqual(sample());
});
