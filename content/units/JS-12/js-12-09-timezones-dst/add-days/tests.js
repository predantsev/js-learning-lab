const check = (date, n, expected) =>
  expect(scope.addCalendarDays(date, n), `addCalendarDays(${JSON.stringify(date)}, ${n})`).toBe(expected);

test('adds days inside a month', () => {
  check('2026-03-02', 3, '2026-03-05');
  check('2026-03-10', 0, '2026-03-10');
});

test('rolls over the end of a month and a year', () => {
  check('2026-02-28', 1, '2026-03-01');
  check('2026-01-31', 1, '2026-02-01');
  check('2026-12-31', 1, '2027-01-01');
  check('2028-02-28', 1, '2028-02-29');
});

test('goes back with a negative number', () => {
  check('2026-03-01', -1, '2026-02-28');
  check('2026-01-01', -1, '2025-12-31');
});

test('is not shifted by daylight saving weekends', () => {
  check('2026-03-07', 1, '2026-03-08');
  check('2026-03-28', 2, '2026-03-30');
  check('2026-10-24', 2, '2026-10-26');
  check('2026-10-31', 2, '2026-11-02');
});

test('returns text in the "YYYY-MM-DD" form', () => {
  const result = scope.addCalendarDays('2026-03-02', 7);
  expect(typeof result, 'type of the result').toBe('string');
  expect(result, 'addCalendarDays("2026-03-02", 7)').toBe('2026-03-09');
});
