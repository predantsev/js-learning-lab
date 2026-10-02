const sample = () => [
  { id: "h-01", name: L.exercise },
  { id: "h-02", name: L.read },
  { id: "h-03", name: L.water },
  { id: "h-04", name: L.tidy },
  { id: "h-06", name: L.walk },
  { id: "h-02", name: L.read },
];
const allDifferent = () => sample().slice(0, 5);

test('nested version finds a repeated id', () => {
  expect(scope.hasDuplicateIdsNested(sample()), 'hasDuplicateIdsNested(list with h-02 twice)').toBe(true);
});

test('nested version says false when all ids differ', () => {
  expect(scope.hasDuplicateIdsNested(allDifferent()), 'hasDuplicateIdsNested(five different ids)').toBe(false);
});

test('nested version: an empty list has no duplicates', () => {
  expect(scope.hasDuplicateIdsNested([]), 'hasDuplicateIdsNested([])').toBe(false);
});

test('lookup version finds a repeated id', () => {
  expect(scope.hasDuplicateIdsLookup(sample()), 'hasDuplicateIdsLookup(list with h-02 twice)').toBe(true);
});

test('lookup version says false when all ids differ', () => {
  expect(scope.hasDuplicateIdsLookup(allDifferent()), 'hasDuplicateIdsLookup(five different ids)').toBe(false);
});

test('lookup version: an empty list has no duplicates', () => {
  expect(scope.hasDuplicateIdsLookup([]), 'hasDuplicateIdsLookup([])').toBe(false);
});

test('an id such as toString is not taken for a duplicate', () => {
  const list = [{ id: 'toString', name: L.walk }, { id: 'h-01', name: L.exercise }];
  expect(scope.hasDuplicateIdsLookup(list), 'hasDuplicateIdsLookup([toString, h-01])').toBe(false);
});

test('lookup version reads each id only a few times', () => {
  let reads = 0;
  const list = [];
  for (let i = 0; i < 300; i++) {
    const id = 'h-' + i;
    list.push({ name: L.walk, get id() { reads += 1; return id; } });
  }
  scope.hasDuplicateIdsLookup(list);
  // Only the amount of work is checked here; the answers are checked by the tests above.
  expect(reads, 'how many times the 300 ids were read').toBeGreaterThanOrEqual(300);
  expect(reads, 'how many times the 300 ids were read').toBeLessThanOrEqual(1500);
});
