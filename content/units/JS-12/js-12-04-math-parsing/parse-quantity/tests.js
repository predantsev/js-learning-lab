const show = (text) => JSON.stringify(text);

test('accepts a whole number with spaces around it', () => {
  expect(scope.parseQuantity(' 12 '), 'parseQuantity(" 12 ")').toEqual({ ok: true, value: 12 });
  expect(scope.parseQuantity('3'), 'parseQuantity("3")').toEqual({ ok: true, value: 3 });
});

test('accepts the boundaries 1 and 99', () => {
  expect(scope.parseQuantity('1'), 'parseQuantity("1")').toEqual({ ok: true, value: 1 });
  expect(scope.parseQuantity('99'), 'parseQuantity("99")').toEqual({ ok: true, value: 99 });
});

test('an empty field is "required"', () => {
  for (const text of ['', '   ']) {
    expect(scope.parseQuantity(text), `parseQuantity(${show(text)})`).toEqual({ ok: false, error: 'required' });
  }
});

test('text that is not only digits is "not-a-number"', () => {
  for (const text of ['12px', '1,5', '2.5', '0x10', '1e1', '-3', 'abc']) {
    expect(scope.parseQuantity(text), `parseQuantity(${show(text)})`).toEqual({ ok: false, error: 'not-a-number' });
  }
});

test('0 and 100 are "out-of-range"', () => {
  expect(scope.parseQuantity('0'), 'parseQuantity("0")').toEqual({ ok: false, error: 'out-of-range' });
  expect(scope.parseQuantity('100'), 'parseQuantity("100")').toEqual({ ok: false, error: 'out-of-range' });
});
