// The source of budget.js without comments and text in quotes, for the two announced form checks.
function code() {
  return files['budget.js']
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/(["'`])(?:\\.|(?!\1)[^\\])*\1/g, '""');
}
const load = () => import('./budget.js');

test('the program prints the sum, the formatted total and one amount', () => {
  expect(logs(), 'the console of the program').toEqual(['154550', '1545.50 UAH', '99.90 UAH']);
});

test('budget.js exports sum, format and formatTotal by name', async () => {
  const budget = await load();
  for (const name of ['sum', 'format', 'formatTotal']) {
    expect(typeof budget[name], `type of the named export ${name}`).toBe('function');
  }
});

test('sum adds any number of amounts', async () => {
  const { sum } = await load();
  expect(sum(1, 2, 3), 'sum(1, 2, 3)').toBe(6);
  expect(sum(500), 'sum(500)').toBe(500);
  expect(sum(), 'sum()').toBe(0);
  expect(sum(...[10, 20, 30, 40]), 'sum(...[10, 20, 30, 40])').toBe(100);
});

test('format and formatTotal show hryvnias with two decimals', async () => {
  const { format, formatTotal } = await load();
  expect(format(12345), 'format(12345)').toBe('123.45 UAH');
  expect(formatTotal(100, 250), 'formatTotal(100, 250)').toBe('3.50 UAH');
  expect(formatTotal(), 'formatTotal()').toBe('0.00 UAH');
});

test('currency stays private to the module', async () => {
  const budget = await load();
  expect(budget.currency, 'budget.currency').toBeUndefined();
});

test('budget.js no longer uses var or arguments', () => {
  const source = code();
  expect(/\bvar\b/.test(source), 'the word var in budget.js').toBe(false);
  expect(/\barguments\b/.test(source), 'the word arguments in budget.js').toBe(false);
});
