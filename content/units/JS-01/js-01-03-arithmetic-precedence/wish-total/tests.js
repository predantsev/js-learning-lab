const TOTAL = 179;
const printed = () => rawLogs().filter((entry) => entry.level === 'log');
// The total must appear as a whole number of its own, not as part of glued digits like 804554.
const hasTotal = (line) => new RegExp(`(^|[^\\d.])${TOTAL}($|[^\\d.])`).test(line);

test('prints the total as a number', () => {
  const first = printed()[0];
  expect(first?.args[0], 'the first printed value').toBe(TOTAL);
});

test('prints the total with a label', () => {
  const line = logs()[1] ?? '';
  expect(/\p{L}/u.test(line), 'the second line contains a word').toBe(true);
  expect(hasTotal(line), `the second line contains the total ${TOTAL}`).toBe(true);
});
