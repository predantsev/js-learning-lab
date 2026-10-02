const check = (dueDate, today, expected) =>
  expect(scope.isDueOnOrBefore(dueDate, today), `isDueOnOrBefore(${JSON.stringify(dueDate)}, ${JSON.stringify(today)})`).toBe(expected);

test('a task due today is due', () => {
  check('2026-03-02', '2026-03-02', true);
});

test('an earlier due date is due, a later one is not', () => {
  check('2026-03-01', '2026-03-02', true);
  check('2026-03-10', '2026-03-02', false);
});

test('works across a month and a year boundary', () => {
  check('2026-02-28', '2026-03-01', true);
  check('2026-03-01', '2026-02-28', false);
  check('2025-12-31', '2026-01-01', true);
  check('2026-01-01', '2025-12-31', false);
});

test('uses the day it is given, not the clock', () => {
  check('2030-06-15', '2030-06-20', true);
  check('2001-01-02', '2001-01-01', false);
});

test('a task without a due date is never due', () => {
  check(null, '2026-03-02', false);
});
