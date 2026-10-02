const fresh = () => [
  { id: 't-01', title: L.water, done: false, priority: 'normal' },
  { id: 't-02', title: L.books, done: false, priority: 'high' },
  { id: 't-03', title: L.grandma, done: false, priority: 'low' },
];
const ids = (list) => (Array.isArray(list) ? list.map((task) => task?.id) : list);

test('addRecord returns a new list with the record at the end', () => {
  const list = fresh();
  const record = { id: 't-04', title: 'x', done: true, priority: 'high' };
  const result = scope.addRecord(list, record);
  expect(ids(result), 'ids of the new list').toEqual(['t-01', 't-02', 't-03', 't-04']);
  expect(result?.[3] === record, 'the last element is the added record').toBe(true);
  expect(result === list, 'result === list').toBe(false);
  expect(ids(list), 'ids of the original list').toEqual(['t-01', 't-02', 't-03']);
});

test('updateRecord merges the changes into a copy of the matching record', () => {
  const result = scope.updateRecord(fresh(), 't-02', { done: true });
  expect(result?.[1], 'the updated record').toEqual({ id: 't-02', title: L.books, done: true, priority: 'high' });
});

test('updateRecord reuses the untouched records', () => {
  const list = fresh();
  const result = scope.updateRecord(list, 't-02', { done: true });
  expect(result?.[0] === list[0], 'result[0] === list[0]').toBe(true);
  expect(result?.[2] === list[2], 'result[2] === list[2]').toBe(true);
});

test('updateRecord leaves the original list and records unchanged', () => {
  const list = fresh();
  const second = list[1];
  const result = scope.updateRecord(list, 't-02', { done: true });
  expect(result === list, 'result === list').toBe(false);
  expect(list[1] === second, 'the original list still holds the old record').toBe(true);
  expect(second.done, 'done of the old record').toBe(false);
  expect(result?.[1] === second, 'result[1] === the old record').toBe(false);
});

test('removeRecord returns a new list without the record', () => {
  const list = fresh();
  const result = scope.removeRecord(list, 't-02');
  expect(ids(result), 'ids left').toEqual(['t-01', 't-03']);
  expect(ids(list), 'ids of the original list').toEqual(['t-01', 't-02', 't-03']);
  expect(result?.[0] === list[0], 'the remaining records are reused').toBe(true);
});

test('an unknown id changes nothing', () => {
  const list = fresh();
  const updated = scope.updateRecord(list, 't-99', { done: true });
  const removed = scope.removeRecord(list, 't-99');
  expect(updated, 'updateRecord with an unknown id').toEqual(fresh());
  expect(removed, 'removeRecord with an unknown id').toEqual(fresh());
  expect(updated === list || removed === list, 'a result is the input list itself').toBe(false);
  expect(list, 'the original list').toEqual(fresh());
});

test('works on an empty list', () => {
  expect(scope.updateRecord([], 't-01', { done: true }), 'updateRecord([], …)').toEqual([]);
  expect(scope.removeRecord([], 't-01'), 'removeRecord([], …)').toEqual([]);
  expect(ids(scope.addRecord([], { id: 't-01' })), 'addRecord([], …)').toEqual(['t-01']);
});
