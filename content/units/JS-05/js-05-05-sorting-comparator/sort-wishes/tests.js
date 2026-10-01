const sample = () => [
  { id: "w-01", name: L.headphones, price: 80 },
  { id: "w-05", name: L.tickets, price: null },
  { id: "w-02", name: L.lamp, price: 45 },
  { id: "w-03", name: L.bicycle, price: 240 },
  { id: "w-06", name: L.mug, price: 18 },
];
const ids = (list) => list.map((item) => item.id);

test('byPriceAsc returns a number', () => {
  const list = sample();
  expect(typeof scope.byPriceAsc(list[0], list[2]), 'type of byPriceAsc(80-item, 45-item)').toBe('number');
});

test('byPriceAsc puts cheaper items first', () => {
  const priced = sample().filter((item) => item.price !== null);
  expect(ids(priced.toSorted(scope.byPriceAsc)), 'ids sorted by price').toEqual(['w-06', 'w-02', 'w-01', 'w-03']);
});

test('byPriceAsc puts items without a price last', () => {
  expect(ids(sample().toSorted(scope.byPriceAsc)), 'ids sorted by price').toEqual(['w-06', 'w-02', 'w-01', 'w-03', 'w-05']);
});

test('items with equal prices keep their order', () => {
  const list = [
    { id: 'a', name: L.lamp, price: 45 },
    { id: 'b', name: L.mug, price: 18 },
    { id: 'c', name: L.headphones, price: 45 },
  ];
  expect(ids(list.toSorted(scope.byPriceAsc)), 'ids sorted by price').toEqual(['b', 'a', 'c']);
});

test('two items without a price keep their order', () => {
  const list = [
    { id: 'x', name: L.tickets, price: null },
    { id: 'y', name: L.bicycle, price: 240 },
    { id: 'z', name: L.lamp, price: null },
  ];
  expect(ids(list.toSorted(scope.byPriceAsc)), 'ids sorted by price').toEqual(['y', 'x', 'z']);
});

test('byNameAsc sorts names alphabetically', () => {
  expect(ids(sample().toSorted(scope.byNameAsc)), 'ids sorted by name').toEqual(L.nameOrder.split(','));
});

test('a name starting with a small letter is not put last', () => {
  const list = [
    { id: 'p', name: L.mug, price: 18 },
    { id: 'q', name: L.aidKit, price: 30 },
    { id: 'r', name: L.bicycle, price: 240 },
  ];
  expect(ids(list.toSorted(scope.byNameAsc)), 'ids sorted by name').toEqual(['q', 'r', 'p']);
});
