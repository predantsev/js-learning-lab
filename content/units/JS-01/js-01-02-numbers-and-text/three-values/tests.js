const printed = () => rawLogs().filter((entry) => entry.level === 'log').map((entry) => entry.args);

test('prints three lines', () => {
  expect(printed().length, 'number of printed lines').toBe(3);
});

test('the first value is a whole number', () => {
  const [value] = printed()[0] ?? [];
  expect(value, 'the first printed value').toBeTypeOf('number');
  expect(Number.isInteger(value), 'the first value is whole').toBe(true);
});

test('the second value is a decimal number', () => {
  const line = printed()[1] ?? [];
  expect(line.length, 'values printed on the second line').toBe(1);
  expect(line[0], 'the second printed value').toBeTypeOf('number');
  expect(Number.isInteger(line[0]), 'the second value is whole').toBe(false);
});

test('the third value is text with quotes inside', () => {
  const [value] = printed()[2] ?? [];
  expect(value, 'the third printed value').toBeTypeOf('string');
  expect(/['"’ʼ«»“”]/.test(value), 'the text contains a quote or an apostrophe').toBe(true);
});
