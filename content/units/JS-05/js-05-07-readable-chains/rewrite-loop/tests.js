const sample = () => [
  { id: "w-01", name: L.headphones, price: 80, acquired: false },
  { id: "w-02", name: L.lamp, price: 45, acquired: false },
  { id: "w-03", name: L.bicycle, price: 240, acquired: false },
  { id: "w-04", name: L.book, price: 25, acquired: true },
  { id: "w-05", name: L.tickets, price: null, acquired: false },
];
const label = (name, price) => name + ': ' + price;

test('isWanted is true only for items not acquired yet', () => {
  const list = sample();
  expect(scope.isWanted(list[0]), 'isWanted(a wish not acquired)').toBe(true);
  expect(scope.isWanted(list[3]), 'isWanted(an acquired wish)').toBe(false);
});

test('matchesQuery finds the query anywhere in the name, in any case', () => {
  const lamp = sample()[1];
  expect(scope.matchesQuery(lamp, L.queryUpper), `matchesQuery(lamp, "${L.queryUpper}")`).toBe(true);
  expect(scope.matchesQuery(lamp, L.queryMiddle), `matchesQuery(lamp, "${L.queryMiddle}")`).toBe(true);
  expect(scope.matchesQuery(lamp, 'xyz'), 'matchesQuery(lamp, "xyz")').toBe(false);
});

test('byPriceAsc puts cheaper items first and items without a price last', () => {
  const ids = sample().toSorted(scope.byPriceAsc).map((item) => item.id);
  expect(ids, 'ids sorted with byPriceAsc').toEqual(['w-04', 'w-02', 'w-01', 'w-03', 'w-05']);
});

test('toLabel makes the name: price label', () => {
  const list = sample();
  expect(scope.toLabel(list[1]), 'toLabel(lamp)').toBe(label(L.lamp, 45));
  expect(scope.toLabel(list[4]), 'toLabel(tickets without a price)').toBe(label(L.tickets, L.noPrice));
});

test('wantedLabels gives the same labels as the loop', () => {
  expect(scope.wantedLabels(sample(), ''), 'wantedLabels(list, "")').toEqual([
    label(L.lamp, 45), label(L.headphones, 80), label(L.bicycle, 240), label(L.tickets, L.noPrice),
  ]);
  expect(scope.wantedLabels(sample(), L.queryMulti), `wantedLabels(list, "${L.queryMulti}")`).toEqual([
    label(L.lamp, 45), label(L.headphones, 80), label(L.tickets, L.noPrice),
  ]);
  expect(scope.wantedLabels(sample(), L.queryUpper), `wantedLabels(list, "${L.queryUpper}")`).toEqual([label(L.lamp, 45)]);
  expect(scope.wantedLabels(sample(), 'xyz'), 'wantedLabels(list, "xyz")').toEqual([]);
});

test('wantedLabels does not change the list', () => {
  const list = sample();
  scope.wantedLabels(list, '');
  expect(list, 'the list after wantedLabels').toEqual(sample());
});
