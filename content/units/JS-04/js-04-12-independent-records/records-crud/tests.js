const E = (id, extra = {}) => ({ id, label: `${id} label`, amountMinor: 1000, date: '2026-03-01', category: 'food', tags: [], ...extra });
const list3 = () => [E('e-01', { tags: ['weekly'] }), E('e-02'), E('e-03')];
// A sparse list: index 1 is a hole.
const sparse = () => {
  const list = [E('e-01')];
  list[2] = E('e-03');
  return list;
};
const ids = (list) => (Array.isArray(list) ? Array.from(list, (record) => (record === undefined ? 'hole' : record.id)) : list);

test('createRecord builds a record from the known fields', () => {
  const input = { label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food', tags: ['work'] };
  expect(scope.createRecord('e-06', input), 'createRecord("e-06", input)').toEqual({ id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food', tags: ['work'] });
});

test('createRecord ignores unknown and inherited fields', () => {
  const input = Object.create({ category: 'fun' });
  input.label = L.coffee;
  input.color = 'red';
  input.id = 'e-99';
  const record = scope.createRecord('e-07', input);
  expect(record?.category, 'category that the input only inherits').toBeNull();
  expect(Object.hasOwn(record ?? {}, 'color'), 'the record got the unknown field color').toBe(false);
  expect(record?.id, 'id of the new record').toBe('e-07');
  expect(record?.label, 'label of the new record').toBe(L.coffee);
});

test('createRecord fills missing fields with null and tags with []', () => {
  expect(scope.createRecord('e-08', { label: 'x' }), 'createRecord("e-08", { label: "x" })').toEqual({ id: 'e-08', label: 'x', amountMinor: null, date: null, category: null, tags: [] });
});

test('createRecord copies tags and leaves the input unchanged', () => {
  const input = { label: 'x', amountMinor: 500, date: '2026-03-02', category: 'fun', tags: ['a'] };
  const record = scope.createRecord('e-09', input);
  expect(record?.tags === input.tags, 'record.tags === input.tags').toBe(false);
  expect(input, 'the input after the call').toEqual({ label: 'x', amountMinor: 500, date: '2026-03-02', category: 'fun', tags: ['a'] });
});

test('findIndexById finds the index or -1', () => {
  expect(scope.findIndexById(list3(), 'e-03'), 'index of e-03').toBe(2);
  expect(scope.findIndexById(list3(), 'e-99'), 'an unknown id').toBe(-1);
  expect(scope.findIndexById([], 'e-01'), 'an empty list').toBe(-1);
});

test('findIndexById skips holes', () => {
  expect(scope.findIndexById(sparse(), 'e-03'), 'index of e-03 behind a hole').toBe(2);
  expect(scope.findIndexById(sparse(), 'e-02'), 'an id that is not in the sparse list').toBe(-1);
});

test('updateRecord applies the own known fields of the change', () => {
  const result = scope.updateRecord(list3(), 'e-02', { amountMinor: 20000, color: 'red' });
  expect(result?.[1], 'the updated expense').toEqual(E('e-02', { amountMinor: 20000 }));
});

test('updateRecord ignores inherited keys and never changes the id', () => {
  const changes = Object.create({ category: 'home' });
  changes.label = 'renamed';
  changes.id = 'e-77';
  const result = scope.updateRecord(list3(), 'e-02', changes);
  expect(result?.[1], 'the updated expense').toEqual(E('e-02', { label: 'renamed' }));
});

test('updateRecord reuses untouched records and leaves the inputs unchanged', () => {
  const list = list3();
  const changes = { amountMinor: 20000 };
  const result = scope.updateRecord(list, 'e-02', changes);
  expect(result === list, 'result === list').toBe(false);
  expect(result?.[0] === list[0] && result?.[2] === list[2], 'the untouched expenses are the same objects').toBe(true);
  expect(list, 'the input list after the call').toEqual(list3());
  expect(changes, 'the changes after the call').toEqual({ amountMinor: 20000 });
});

test('updateRecord copies a changed tags array', () => {
  const list = list3();
  const newTags = ['weekly', 'shared'];
  const result = scope.updateRecord(list, 'e-01', { tags: newTags });
  expect(result?.[0]?.tags, 'tags of the updated expense').toEqual(['weekly', 'shared']);
  expect(result?.[0]?.tags === newTags, 'the record shares the array passed in changes').toBe(false);
  expect(list[0].tags, 'tags of the original expense').toEqual(['weekly']);
});

test('updateRecord handles an unknown id, an empty list and holes', () => {
  const list = list3();
  const same = scope.updateRecord(list, 'e-99', { amountMinor: 1 });
  expect(same, 'the result for an unknown id').toEqual(list3());
  expect(same === list, 'the result for an unknown id is the input list itself').toBe(false);
  expect(scope.updateRecord([], 'e-01', { amountMinor: 1 }), 'the result for an empty list').toEqual([]);
  expect(ids(scope.updateRecord(sparse(), 'e-03', { amountMinor: 1 })), 'ids after updating a sparse list').toEqual(['e-01', 'e-03']);
});

test('removeRecord returns a new list without the record', () => {
  const list = list3();
  const result = scope.removeRecord(list, 'e-02');
  expect(ids(result), 'ids left').toEqual(['e-01', 'e-03']);
  expect(result?.[0] === list[0], 'the remaining expenses are reused').toBe(true);
  expect(list, 'the input list after the call').toEqual(list3());
});

test('removeRecord handles an unknown id, an empty list and holes', () => {
  const list = list3();
  const same = scope.removeRecord(list, 'e-99');
  expect(ids(same), 'ids for an unknown id').toEqual(['e-01', 'e-02', 'e-03']);
  expect(same === list, 'the result is the input list itself').toBe(false);
  expect(scope.removeRecord([], 'e-01'), 'the result for an empty list').toEqual([]);
  expect(ids(scope.removeRecord(sparse(), 'e-01')), 'ids after removing from a sparse list').toEqual(['e-03']);
});
