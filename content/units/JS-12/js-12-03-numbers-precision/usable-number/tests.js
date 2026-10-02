test('accepts ordinary numbers', () => {
  for (const x of [45, 0, -3.5, 0.1 + 0.2, Number.MAX_SAFE_INTEGER]) {
    expect(scope.isUsableNumber(x), `isUsableNumber(${x})`).toBe(true);
  }
});

test('rejects NaN', () => {
  expect(scope.isUsableNumber(NaN), 'isUsableNumber(NaN)').toBe(false);
  expect(scope.isUsableNumber(0 / 0), 'isUsableNumber(0 / 0)').toBe(false);
});

test('rejects Infinity and -Infinity', () => {
  expect(scope.isUsableNumber(1 / 0), 'isUsableNumber(1 / 0)').toBe(false);
  expect(scope.isUsableNumber(-1 / 0), 'isUsableNumber(-1 / 0)').toBe(false);
});

test('rejects values that are not numbers', () => {
  for (const [x, shown] of [['45', '"45"'], ['', '""'], [null, 'null'], [undefined, 'undefined'], [true, 'true'], [45n, '45n']]) {
    expect(scope.isUsableNumber(x), `isUsableNumber(${shown})`).toBe(false);
  }
});
