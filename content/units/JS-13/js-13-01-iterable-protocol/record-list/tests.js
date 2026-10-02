const ready = () => expect(typeof scope.RecordList, 'type of RecordList').toBe('function');
const sample = () => [{ id: 'x-1' }, { id: 'x-2' }, { id: 'x-3' }];

test('the program prints the three labels and 3', () => {
  expect(logs(), 'the console of the program').toEqual([L.groceries, L.transit, L.coffee, '3']);
});

test('for...of gives the records in order', () => {
  ready();
  const records = sample();
  const list = new scope.RecordList(records);
  const seen = [];
  for (const record of list) {
    seen.push(record);
  }
  expect(seen.length, 'how many records for...of gave').toBe(3);
  for (let i = 0; i < 3; i += 1) {
    expect(seen[i], `record ${i + 1} from for...of`).toBe(records[i]);
  }
});

test('spread and Array.from give the records in a new array', () => {
  ready();
  const records = sample();
  const list = new scope.RecordList(records);
  const spread = [...list];
  expect(spread.map((r) => r.id), 'ids from [...list]').toEqual(['x-1', 'x-2', 'x-3']);
  expect(Array.from(list).map((r) => r.id), 'ids from Array.from(list)').toEqual(['x-1', 'x-2', 'x-3']);
  spread.pop();
  expect([...list].length, 'records in the list after changing the spread copy').toBe(3);
});

test('every loop starts from the beginning', () => {
  ready();
  const list = new scope.RecordList(sample());
  expect([...list].length, 'records in the first spread').toBe(3);
  expect([...list].length, 'records in the second spread').toBe(3);
  const first = list[Symbol.iterator]();
  const second = list[Symbol.iterator]();
  first.next();
  first.next();
  expect(second.next().value.id, 'the first value of a second iterator').toBe('x-1');
});

test('next() gives { value, done } and finishes with done: true', () => {
  ready();
  const records = sample();
  const list = new scope.RecordList(records);
  const iterator = list[Symbol.iterator]();
  expect(typeof iterator.next, 'type of iterator.next').toBe('function');
  for (let i = 0; i < 3; i += 1) {
    const result = iterator.next();
    expect(result.done, `done after next() number ${i + 1}`).toBe(false);
    expect(result.value, `value after next() number ${i + 1}`).toBe(records[i]);
  }
  expect(iterator.next().done, 'done after the fourth next()').toBe(true);
  expect(iterator.next().done, 'done after the fifth next()').toBe(true);
});

test('records added later are included', () => {
  ready();
  const list = new scope.RecordList([{ id: 'x-1' }]);
  list.add({ id: 'x-2' });
  expect([...list].map((r) => r.id), 'ids after add').toEqual(['x-1', 'x-2']);
});

test('the records stay private', () => {
  ready();
  const list = new scope.RecordList(sample());
  expect(Object.getOwnPropertyNames(list), 'own property names of the list').toEqual([]);
});
