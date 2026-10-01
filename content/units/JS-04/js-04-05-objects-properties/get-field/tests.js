const task = () => ({ id: 't-03', title: L.grandma, dueDate: null, priority: 'low', note: undefined });

test('returns the value of an own field', () => {
  expect(scope.getField(task(), 'priority', 'normal'), "getField(task, 'priority', 'normal')").toBe('low');
  expect(scope.getField(task(), 'id', 'none'), "getField(task, 'id', 'none')").toBe('t-03');
  expect(scope.getField(task(), 'title', 'none'), "getField(task, 'title', 'none')").toBe(L.grandma);
});

test('keeps an own field whose value is null or undefined', () => {
  expect(scope.getField(task(), 'dueDate', 'x'), "getField(task, 'dueDate', 'x') where dueDate is null").toBeNull();
  expect(scope.getField(task(), 'note', 'x'), "getField(task, 'note', 'x') where note is undefined").toBeUndefined();
});

test('keeps falsy own values', () => {
  const record = { done: false, count: 0, label: '' };
  expect(scope.getField(record, 'done', true), "getField(record, 'done', true) where done is false").toBe(false);
  expect(scope.getField(record, 'count', 5), "getField(record, 'count', 5) where count is 0").toBe(0);
  expect(scope.getField(record, 'label', 'x'), "getField(record, 'label', 'x') where label is ''").toBe('');
});

test('returns the fallback for a missing field', () => {
  expect(scope.getField(task(), 'done', false), "getField(task, 'done', false)").toBe(false);
  expect(scope.getField({}, 'title', 'untitled'), "getField({}, 'title', 'untitled')").toBe('untitled');
});

test('ignores inherited names like toString', () => {
  expect(scope.getField(task(), 'toString', 'none'), "getField(task, 'toString', 'none')").toBe('none');
});
