const ready = () => expect(typeof scope.describeResult, 'type of describeResult').toBe('function');

test('a successful result gives the saved line with the name', () => {
  ready();
  const line = scope.describeResult({ ok: true, value: { name: L.mug, price: 18 } });
  expect(line, 'describeResult for a successful result').toBe(`${L.saved}: ${L.mug}`);
});

test('a failed result gives the fix line with every field name', () => {
  ready();
  expect(scope.describeResult({ ok: false, errors: { category: 'too-long' } }), 'one failed field').toBe(`${L.fix}: category`);
  expect(scope.describeResult({ ok: false, errors: { name: 'required', price: 'negative' } }), 'two failed fields').toBe(`${L.fix}: name, price`);
});

test('the program prints one line per result', () => {
  expect(logs(), 'the console of the program').toEqual([`${L.saved}: ${L.lamp}`, `${L.fix}: name, price`]);
});
