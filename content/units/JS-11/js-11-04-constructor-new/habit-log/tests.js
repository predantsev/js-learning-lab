const isFunction = (value, what) => expect(typeof value, what).toBe('function');

test('the program prints two dates for water and none for walk', () => {
  expect(logs(), 'the console of the program').toEqual(['2', '0']);
});

test('a new log starts with its name and no dates', () => {
  isFunction(scope.HabitLog, 'type of HabitLog');
  const log = new scope.HabitLog(L.water);
  expect(log.name, 'the name of the new log').toBe(L.water);
  expect(log.count(), 'count() of a new log').toBe(0);
});

test('markDone remembers each date once', () => {
  isFunction(scope.HabitLog, 'type of HabitLog');
  const log = new scope.HabitLog(L.water);
  log.markDone('2026-03-01');
  log.markDone('2026-03-01');
  expect(log.count(), 'count() after the same date twice').toBe(1);
  log.markDone('2026-03-02');
  expect(log.count(), 'count() after a second, different date').toBe(2);
});

test('two logs count independently', () => {
  isFunction(scope.HabitLog, 'type of HabitLog');
  const first = new scope.HabitLog(L.water);
  const second = new scope.HabitLog(L.walk);
  first.markDone('2026-03-01');
  expect(first.count(), 'count() of the log that got a date').toBe(1);
  expect(second.count(), 'count() of the other log').toBe(0);
});

test('markDone and count are shared through the prototype', () => {
  isFunction(scope.HabitLog, 'type of HabitLog');
  const first = new scope.HabitLog(L.water);
  const second = new scope.HabitLog(L.walk);
  expect(Object.getPrototypeOf(first) === scope.HabitLog.prototype, 'the prototype of a new log is HabitLog.prototype').toBe(true);
  expect(first.markDone === second.markDone, 'markDone of two logs is one function').toBe(true);
  expect(first.count === second.count, 'count of two logs is one function').toBe(true);
  expect(Object.hasOwn(first, 'markDone'), 'markDone is an own property of the log').toBe(false);
});
