const defaults = { acquired: false, category: null };
const make = () => {
  const record = Object.create(defaults);
  record.id = 'w-01';
  record.name = L.lamp;
  record.acquired = true;
  record.note = undefined;
  return record;
};

test('the program prints the origin of every property', () => {
  expect(logs(), 'the console of the program').toEqual(['own', 'own', 'inherited', 'inherited', 'missing', 'category']);
});

test('originOf says own for a property the record has itself', () => {
  expect(typeof scope.originOf, 'type of originOf').toBe('function');
  const record = make();
  expect(scope.originOf(record, 'name'), 'originOf(record, "name")').toBe('own');
  expect(scope.originOf(record, 'acquired'), 'originOf(record, "acquired"), which shadows the default').toBe('own');
});

test('originOf says own even when the value is undefined', () => {
  expect(typeof scope.originOf, 'type of originOf').toBe('function');
  expect(scope.originOf(make(), 'note'), 'originOf(record, "note") with the own value undefined').toBe('own');
});

test('originOf says inherited for what comes from a prototype', () => {
  expect(typeof scope.originOf, 'type of originOf').toBe('function');
  const record = make();
  expect(scope.originOf(record, 'category'), 'originOf(record, "category") from the defaults object').toBe('inherited');
  expect(scope.originOf(record, 'toString'), 'originOf(record, "toString") from Object.prototype').toBe('inherited');
});

test('originOf says missing for a name nowhere in the chain', () => {
  expect(typeof scope.originOf, 'type of originOf').toBe('function');
  expect(scope.originOf(make(), 'price'), 'originOf(record, "price")').toBe('missing');
});

test('inheritedNames lists only enumerable inherited names', () => {
  expect(typeof scope.inheritedNames, 'type of inheritedNames').toBe('function');
  expect(scope.inheritedNames(make()), 'inheritedNames(record)').toEqual(['category']);
  expect(scope.inheritedNames({ id: 'w-02' }), 'inheritedNames of a plain object').toEqual([]);
});

test('the functions do not change the record', () => {
  expect(typeof scope.originOf, 'type of originOf').toBe('function');
  expect(typeof scope.inheritedNames, 'type of inheritedNames').toBe('function');
  const record = make();
  scope.originOf(record, 'category');
  scope.inheritedNames(record);
  expect(Object.keys(record), 'own names of the record after the calls').toEqual(['id', 'name', 'acquired', 'note']);
  expect(Object.keys(defaults), 'names of the defaults object after the calls').toEqual(['acquired', 'category']);
});
