const answers = () => rawLogs().filter((entry) => entry.level === 'log').map((entry) => entry.args[0]);
// The answer tests compare what the console shows; the type test alone reports answers typed as text.
const shown = (index) => String(answers()[index]);

test('prints three answers', () => {
  expect(answers().length, 'number of printed lines').toBe(3);
});

test('the answers are true or false, not text', () => {
  expect(answers().length, 'number of printed answers').toBeGreaterThan(0);
  for (const value of answers()) expect(value, 'a printed answer').toBeTypeOf('boolean');
});

test('answer 1 is right', () => {
  expect(shown(0), 'answer 1').toBe('true');
});

test('answer 2 is right', () => {
  expect(shown(1), 'answer 2').toBe('false');
});

test('answer 3 is right', () => {
  expect(shown(2), 'answer 3').toBe('true');
});
