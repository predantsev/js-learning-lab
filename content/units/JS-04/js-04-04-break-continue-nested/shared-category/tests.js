const item = (id, category) => ({ id, name: id, category });
const ids = (pair) => (pair === null || pair === undefined ? pair : pair.map((wish) => wish.id));

test('returns the first pair that shares a category', () => {
  const items = [item('w-01', L.tech), item('w-02', L.home), item('w-03', L.sport), item('w-06', L.home), item('w-07', L.sport)];
  expect(ids(scope.findFirstSharedCategory(items)), 'ids of the returned pair').toEqual(['w-02', 'w-06']);
});

test('finds a partner far away in the list', () => {
  const items = [item('w-03', L.sport), item('w-01', L.tech), item('w-02', L.home), item('w-08', L.sport)];
  expect(ids(scope.findFirstSharedCategory(items)), 'ids of the returned pair').toEqual(['w-03', 'w-08']);
});

test('returns null when no two items share a category', () => {
  expect(scope.findFirstSharedCategory([item('w-01', L.tech), item('w-02', L.home)]), 'two different categories').toBeNull();
});

test('returns null for an empty list and a single item', () => {
  expect(scope.findFirstSharedCategory([]), 'an empty list').toBeNull();
  expect(scope.findFirstSharedCategory([item('w-01', L.tech)]), 'a single wish').toBeNull();
});

test('ignores items without a category', () => {
  const items = [item('w-05', null), item('w-01', L.tech), item('w-09', null)];
  expect(scope.findFirstSharedCategory(items), 'two wishes with category null').toBeNull();
});
