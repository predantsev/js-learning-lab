const make = (id) => ({ id, name: L.headphones, price: 80 });

test('isSameRecord is true for two names of one object', () => {
  const wish = make('w-01');
  const alias = wish;
  expect(scope.isSameRecord(wish, alias), 'isSameRecord(wish, alias)').toBe(true);
  expect(scope.isSameRecord(wish, wish), 'isSameRecord(wish, wish)').toBe(true);
});

test('isSameRecord is false for a lookalike copy', () => {
  expect(scope.isSameRecord(make('w-01'), make('w-01')), 'two separate objects with the same fields').toBe(false);
});

test('hasSameId compares ids', () => {
  const wish = make('w-01');
  expect(scope.hasSameId(wish, make('w-01')), 'a lookalike with the same id').toBe(true);
  expect(scope.hasSameId(wish, wish), 'the same object').toBe(true);
  expect(scope.hasSameId(wish, make('w-02')), 'a record with another id').toBe(false);
});

test('countLookalikes counts separate records with the same id', () => {
  const wish = make('w-01');
  expect(scope.countLookalikes([make('w-01'), make('w-02'), make('w-01')], wish), 'two lookalikes and one other wish').toBe(2);
  expect(scope.countLookalikes([], wish), 'an empty list').toBe(0);
});

test('countLookalikes skips the record itself under any name', () => {
  const wish = make('w-01');
  const alias = wish;
  expect(scope.countLookalikes([wish, alias, make('w-01')], wish), 'the record, its alias and one lookalike').toBe(1);
});

test('the functions do not change the records', () => {
  const a = make('w-01');
  const b = make('w-02');
  scope.isSameRecord(a, b);
  scope.hasSameId(a, b);
  scope.countLookalikes([a, b], a);
  expect(a, 'the first record after the calls').toEqual(make('w-01'));
  expect(b, 'the second record after the calls').toEqual(make('w-02'));
});
