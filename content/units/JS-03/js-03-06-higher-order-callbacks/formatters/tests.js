const lamp = { name: 'Lamp', price: 45 };

test('runs without an error', () => {
  expect(loadError(), 'error while running').toBeNull();
});

test('formatWith returns what the formatter returns', () => {
  const formatter = spy(() => 'X');
  expect(scope.formatWith(lamp, formatter), 'formatWith(record, formatter)').toBe('X');
});

test('formatWith calls the formatter once with the record', () => {
  const formatter = spy(() => 'X');
  scope.formatWith(lamp, formatter);
  expect(formatter, 'the formatter').toHaveBeenCalledTimes(1);
  expect(formatter.calls[0][0], 'the argument the formatter received').toBe(lamp);
});

test('shortLabel and longLabel build the two labels', () => {
  expect(scope.shortLabel(lamp), 'shortLabel(record)').toBe('Lamp');
  expect(scope.longLabel(lamp), 'longLabel(record)').toBe('Lamp — 45 ' + L.uah);
});

test('withSuffix returns a new function', () => {
  expect(typeof scope.withSuffix((record) => record.name, '!'), 'type of withSuffix(...)').toBe('function');
});

test('withSuffix does not call the formatter right away', () => {
  const formatter = spy((record) => record.name);
  scope.withSuffix(formatter, '!');
  expect(formatter, 'the formatter right after withSuffix(formatter, "!")').toHaveBeenCalledTimes(0);
});

test('the new formatter adds the suffix', () => {
  const formatter = spy((record) => record.name);
  const loud = scope.withSuffix(formatter, '!');
  expect(loud(lamp), 'withSuffix(formatter, "!")(record)').toBe('Lamp!');
  expect(formatter.calls[0][0], 'the record passed on to the formatter').toBe(lamp);
});

test('prints the three labels', () => {
  expect(logs()).toEqual([L.headphones, L.headphones + ' — 80 ' + L.uah, L.headphones + ' ★']);
});
