test('1. typed amounts with a comma add up exactly', () => {
  expect(scope.sumAmountsMinor(['1,5', '2,25']), 'sumAmountsMinor(["1,5", "2,25"])').toBe(375);
  expect(scope.sumAmountsMinor(['845,50', '0,29']), 'sumAmountsMinor(["845,50", "0,29"])').toBe(84579);
  expect(scope.sumAmountsMinor([]), 'sumAmountsMinor([])').toBe(0);
});

test('2. an empty quantity is "required", not zero', () => {
  expect(scope.readQuantity(''), 'readQuantity("")').toEqual({ ok: false, error: 'required' });
  expect(scope.readQuantity('   '), 'readQuantity("   ")').toEqual({ ok: false, error: 'required' });
  expect(scope.readQuantity('0'), 'readQuantity("0")').toEqual({ ok: false, error: 'invalid' });
  expect(scope.readQuantity('12'), 'readQuantity("12")').toEqual({ ok: true, value: 12 });
});

test('3. NaN and Infinity are not valid amounts', () => {
  expect(scope.isValidAmount(Number('12,50')), 'isValidAmount(Number("12,50"))').toBe(false);
  expect(scope.isValidAmount(1 / 0), 'isValidAmount(1 / 0)').toBe(false);
  expect(scope.isValidAmount(1250), 'isValidAmount(1250)').toBe(true);
});

test('4. digits-only refuses input longer than 20 characters', () => {
  expect(scope.isDigitsOnly('2026'), 'isDigitsOnly("2026")').toBe(true);
  expect(scope.isDigitsOnly('12a4'), 'isDigitsOnly("12a4")').toBe(false);
  expect(scope.isDigitsOnly('1'.repeat(20)), 'isDigitsOnly(20 digits)').toBe(true);
  expect(scope.isDigitsOnly('1'.repeat(21)), 'isDigitsOnly(21 digits)').toBe(false);
  expect(scope.isDigitsOnly('1'.repeat(20) + 'x'), 'isDigitsOnly(20 digits + "x")').toBe(false);
});

test('5. the query is searched as plain text', () => {
  expect(scope.countMatches('1.5 or 125', '1.5'), 'countMatches("1.5 or 125", "1.5")').toBe(1);
  expect(scope.countMatches('C++ and c++', 'c++'), 'countMatches("C++ and c++", "c++")').toBe(2);
});

test('6. a calendar date shows the same day in New York', () => {
  const expected = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date('2026-03-01'));
  expect(scope.formatDueDay('2026-03-01', 'America/New_York'), 'formatDueDay in New York').toBe(expected);
  expect(scope.formatDueDay('2026-03-01', 'Asia/Tokyo'), 'formatDueDay in Tokyo').toBe(expected);
});

test('7. calendar dates use months 1–12 and refuse days that do not exist', () => {
  expect(scope.toCalendarDate(2026, 3, 1), 'toCalendarDate(2026, 3, 1)').toBe('2026-03-01');
  expect(scope.toCalendarDate(2026, 12, 31), 'toCalendarDate(2026, 12, 31)').toBe('2026-12-31');
  expect(scope.toCalendarDate(2028, 2, 29), 'toCalendarDate(2028, 2, 29)').toBe('2028-02-29');
  expect(scope.toCalendarDate(2026, 4, 31), 'toCalendarDate(2026, 4, 31)').toBeNull();
  expect(scope.toCalendarDate(2026, 2, 29), 'toCalendarDate(2026, 2, 29)').toBeNull();
});
