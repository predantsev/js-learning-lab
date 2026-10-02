const make = () => ({ id: 't-02', title: L.books, dueDate: '2026-03-01', done: false, priority: 'high' });

test('builds "title · priority"', () => {
  expect(scope.toLabel(make()), 'toLabel(task)').toBe(`${L.books} · high`);
});

test('uses normal when priority is missing', () => {
  expect(scope.toLabel({ title: L.grandma }), 'toLabel for a task without priority').toBe(`${L.grandma} · normal`);
});

test('withoutId returns every other field', () => {
  const result = scope.withoutId(make());
  expect(result, 'withoutId(task)').toEqual({ title: L.books, dueDate: '2026-03-01', done: false, priority: 'high' });
  expect(Object.hasOwn(result ?? {}, 'id'), 'the result still has its own id field').toBe(false);
});

test('withoutId leaves the original record alone', () => {
  const original = make();
  const result = scope.withoutId(original);
  expect(original.id, 'id of the original after the call').toBe('t-02');
  expect(result === original, 'result === original').toBe(false);
});
