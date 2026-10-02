// Modules are loaded inside the checks, so a module that fails to load fails a check
// instead of stopping all of them.
const load = async (path) => {
  try {
    return { module: await import(path), error: null };
  } catch (error) {
    return { module: null, error };
  }
};
const problem = (error) => (error ? error.name + ': ' + error.message : null);

test('money.js loads as an ES module', async () => {
  const { error } = await load('./money.js');
  expect(problem(error), 'error while loading money.js').toBeNull();
});

test('money.js exports formatMinor by name', async () => {
  const { module } = await load('./money.js');
  expect(typeof module?.formatMinor, 'the named export formatMinor of money.js').toBe('function');
  expect(module?.formatMinor?.(84550), 'formatMinor(84550)').toBe('845.50');
});

test('records.js loads as an ES module', async () => {
  const { error } = await load('./records.js');
  expect(problem(error), 'error while loading records.js').toBeNull();
});

test('records.js exports validate and summarize by name', async () => {
  const { module } = await load('./records.js');
  expect(typeof module?.validate, 'the named export validate of records.js').toBe('function');
  expect(typeof module?.summarize, 'the named export summarize of records.js').toBe('function');
});

test('validate still checks the label, the amount and the category', async () => {
  const { module } = await load('./records.js');
  const good = { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' };
  expect(module?.validate?.(good), 'validate(a valid expense)').toEqual({ ok: true, value: good });
  expect(module?.validate?.({ id: 'e-10', label: ' ', amountMinor: 99.5, date: '2026-03-02', category: 'gifts' }), 'validate(an expense with three problems)')
    .toEqual({ ok: false, errors: { label: 'required', amountMinor: 'not-positive-whole', category: 'unknown' } });
});

test('summarize still counts and formats the total', async () => {
  const { module } = await load('./records.js');
  const expenses = [
    { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
    { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' },
  ];
  expect(module?.summarize?.(expenses), 'summarize(two expenses)').toEqual({ count: 2, totalMinor: 39050, totalText: '390.50' });
});

test('main.js runs and prints the summary', () => {
  expect(loadError(), 'error while the program loaded').toBeNull();
  expect(logs(), 'printed lines').toContain(L.countText + '2 · ' + L.totalText + '1365.50 ' + L.uah);
});
