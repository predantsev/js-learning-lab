const ready = (name) => expect(typeof scope[name], `type of ${name}`).toBe('function');

test('isRecordLike is true for plain objects', () => {
  ready('isRecordLike');
  expect(scope.isRecordLike({}), 'isRecordLike({})').toBe(true);
  expect(scope.isRecordLike({ id: 'h-02', name: L.read }), 'isRecordLike of a habit object').toBe(true);
});

test('isRecordLike is false for null, arrays and primitives', () => {
  ready('isRecordLike');
  expect(scope.isRecordLike(null), 'isRecordLike(null)').toBe(false);
  expect(scope.isRecordLike(['h-01']), 'isRecordLike(["h-01"])').toBe(false);
  expect(scope.isRecordLike('h-01'), 'isRecordLike("h-01")').toBe(false);
  expect(scope.isRecordLike(42), 'isRecordLike(42)').toBe(false);
  expect(scope.isRecordLike(undefined), 'isRecordLike(undefined)').toBe(false);
});

test('readHabitName returns the name only from an object with a text name', () => {
  ready('readHabitName');
  expect(scope.readHabitName(JSON.stringify({ id: 'h-02', name: L.read })), 'a stored habit').toBe(L.read);
  expect(scope.readHabitName('{"id": "h-03", "name": 5}'), 'name is a number').toBeNull();
  expect(scope.readHabitName('{"id": "h-03"}'), 'no name field').toBeNull();
});

test('readHabitName returns null for JSON that is not an object', () => {
  ready('readHabitName');
  expect(scope.readHabitName('42'), 'the text 42').toBeNull();
  expect(scope.readHabitName('null'), 'the text null').toBeNull();
  expect(scope.readHabitName('["h-01"]'), 'an array').toBeNull();
  expect(scope.readHabitName('"h-01"'), 'a JSON string').toBeNull();
});

test('the program prints the name and then null twice', () => {
  expect(logs(), 'the console of the program').toEqual([L.exercise, 'null', 'null']);
});
