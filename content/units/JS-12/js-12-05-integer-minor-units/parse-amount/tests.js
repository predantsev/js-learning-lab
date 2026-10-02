const show = (text) => JSON.stringify(text);
const ok = (value) => ({ ok: true, value });
const fail = (error) => ({ ok: false, error });

test('reads a comma or a dot as the decimal separator', () => {
  expect(scope.parseAmountMinor('12,50'), 'parseAmountMinor("12,50")').toEqual(ok(1250));
  expect(scope.parseAmountMinor('12.50'), 'parseAmountMinor("12.50")').toEqual(ok(1250));
  expect(scope.parseAmountMinor(' 845,50 '), 'parseAmountMinor(" 845,50 ")').toEqual(ok(84550));
});

test('one decimal digit means tens of kopiykas', () => {
  expect(scope.parseAmountMinor('12,5'), 'parseAmountMinor("12,5")').toEqual(ok(1250));
  expect(scope.parseAmountMinor('0,1'), 'parseAmountMinor("0,1")').toEqual(ok(10));
});

test('whole hryvnias and small amounts are exact', () => {
  expect(scope.parseAmountMinor('12'), 'parseAmountMinor("12")').toEqual(ok(1200));
  expect(scope.parseAmountMinor('0,05'), 'parseAmountMinor("0,05")').toEqual(ok(5));
  expect(scope.parseAmountMinor('0,29'), 'parseAmountMinor("0,29")').toEqual(ok(29));
  expect(scope.parseAmountMinor('1,15'), 'parseAmountMinor("1,15")').toEqual(ok(115));
  expect(scope.parseAmountMinor('4,35'), 'parseAmountMinor("4,35")').toEqual(ok(435));
});

test('more than two decimal digits is "too-many-decimals"', () => {
  expect(scope.parseAmountMinor('1,005'), 'parseAmountMinor("1,005")').toEqual(fail('too-many-decimals'));
});

test('zero is "not-positive"', () => {
  expect(scope.parseAmountMinor('0'), 'parseAmountMinor("0")').toEqual(fail('not-positive'));
  expect(scope.parseAmountMinor('0,00'), 'parseAmountMinor("0,00")').toEqual(fail('not-positive'));
});

test('an empty field is "required"', () => {
  expect(scope.parseAmountMinor(''), 'parseAmountMinor("")').toEqual(fail('required'));
  expect(scope.parseAmountMinor('  '), 'parseAmountMinor("  ")').toEqual(fail('required'));
});

test('anything else is "not-a-number"', () => {
  for (const text of ['abc', '12,50 грн', '1,2,3', '-5', '12px', ',5']) {
    expect(scope.parseAmountMinor(text), `parseAmountMinor(${show(text)})`).toEqual(fail('not-a-number'));
  }
});
