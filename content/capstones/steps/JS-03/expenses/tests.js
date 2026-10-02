// Checks of capstone step JS-03, expense tracker variant: the pure functions formatAmount,
// formatExpenseLabel and validateExpense (domain contract: { ok: true, value } or
// { ok: false, errors: { field: key } }), and the page that only shows their results.
// Text comes from L (the project's language): L.decimalMark is "," (uk) or "." (en).
const norm = (text) => String(text ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
/** `text` contains every part, in this order (case and extra spaces do not matter). */
function inOrder(text, ...parts) {
  const t = norm(text);
  let from = 0;
  for (const part of parts.map(norm)) {
    const at = t.indexOf(part, from);
    if (at < 0) return false;
    from = at + part.length;
  }
  return true;
}
const shown = (...parts) => [...(screen.$('main')?.querySelectorAll('*') ?? [])].some((node) => inOrder(node.textContent, ...parts));
const expense = (fields) => ({ id: 'e-90', label: 'Taxi', amountMinor: 15000, date: '2026-03-02', category: 'transport', ...fields });
/** A value as it would be written in code, for check messages. */
const show = (value) => (value === undefined ? 'missing' : Number.isNaN(value) ? 'NaN' : JSON.stringify(value));
const amount = (hryvnias, kopiykas) => `${hryvnias}${L.decimalMark}${kopiykas}`;

test('the script runs without errors', () => {
  const error = loadError();
  expect(error === null ? null : `${error.name}: ${error.message}`, 'an error while the page was loading').toBeNull();
});

// The page is checked before any other check calls the functions.
test('the page shows the labels and the draft messages', () => {
  expect(shown(L.nameValue, L.firstCheck, L.currency), `a line with "${L.nameValue}", then "${L.firstCheck}" and "${L.currency}"`).toBe(true);
  expect(shown(L.secondName, L.secondCheck, L.currency), `a line with "${L.secondName}", then "${L.secondCheck}" and "${L.currency}"`).toBe(true);
  expect(shown(L.requiredMessage), `a line with "${L.requiredMessage}"`).toBe(true);
  expect(shown(L.invalidMessage), `a line with "${L.invalidMessage}"`).toBe(true);
});

test('formatAmount gives hryvnias and two digits of kopiykas', () => {
  for (const [minor, text] of [[52000, amount(520, '00')], [9990, amount(99, '90')], [84550, amount(845, '50')], [215590, amount(2155, '90')]]) {
    expect(scope.formatAmount(minor), `formatAmount(${minor})`).toBe(text);
  }
});

test('formatAmount keeps a leading zero in small amounts', () => {
  for (const [minor, text] of [[5, amount(0, '05')], [100, amount(1, '00')], [1009, amount(10, '09')], [0, amount(0, '00')]]) {
    expect(scope.formatAmount(minor), `formatAmount(${minor})`).toBe(text);
  }
});

test('formatExpenseLabel returns the label, the amount and the currency', () => {
  const label = scope.formatExpenseLabel(expense({ label: 'Taxi', amountMinor: 15005 }));
  expect(typeof label, 'the type of what formatExpenseLabel returns').toBe('string');
  expect(inOrder(label, 'Taxi', amount(150, '05'), L.currency), `formatExpenseLabel(label "Taxi", amountMinor 15005) returned ${show(label)}`).toBe(true);
});

test('validateExpense accepts a valid expense and trims its label', () => {
  const result = scope.validateExpense({ label: '  Taxi  ', amountMinor: 15000, date: '2026-03-02', category: 'transport' });
  expect(result?.ok, 'validateExpense({ label: "  Taxi  ", amountMinor: 15000, date: "2026-03-02", category: "transport" }).ok').toBe(true);
  expect(result.value?.label, 'value.label').toBe('Taxi');
  expect(result.value?.amountMinor, 'value.amountMinor').toBe(15000);
  expect(result.value?.date, 'value.date').toBe('2026-03-02');
  expect(result.value?.category, 'value.category').toBe('transport');
  expect(scope.validateExpense({ label: 'x'.repeat(80), amountMinor: 1, date: '2026-03-02', category: 'fun' })?.ok, 'a label of exactly 80 characters and an amount of 1 are valid').toBe(true);
});

test('validateExpense accepts every category of the list', () => {
  for (const category of ['food', 'transport', 'home', 'fun']) {
    expect(scope.validateExpense({ label: 'Taxi', amountMinor: 15000, date: '2026-03-02', category })?.ok, `category "${category}"`).toBe(true);
  }
});

test('validateExpense requires a label', () => {
  for (const label of ['', '   ', undefined]) {
    const result = scope.validateExpense({ label, amountMinor: 15000, date: '2026-03-02', category: 'transport' });
    expect(result?.ok, `label ${show(label)}: ok`).toBe(false);
    expect(result.errors?.label, `label ${show(label)}: errors.label`).toBe('required');
  }
});

test('validateExpense rejects a label longer than 80 characters', () => {
  const result = scope.validateExpense({ label: 'x'.repeat(81), amountMinor: 15000, date: '2026-03-02', category: 'transport' });
  expect(result?.ok, 'a label of 81 characters: ok').toBe(false);
  expect(result.errors?.label, 'a label of 81 characters: errors.label').toBe('too-long');
  expect(scope.validateExpense({ label: `  ${'x'.repeat(80)}  `, amountMinor: 15000, date: '2026-03-02', category: 'transport' })?.ok, '80 characters plus spaces at the edges is valid').toBe(true);
});

test('validateExpense rejects an amount that is not a positive whole number', () => {
  for (const amountMinor of [0, -100, 150.5, '15000', Number.NaN, undefined]) {
    const result = scope.validateExpense({ label: 'Taxi', amountMinor, date: '2026-03-02', category: 'transport' });
    expect(result?.ok, `amountMinor ${show(amountMinor)}: ok`).toBe(false);
    expect(result.errors?.amountMinor, `amountMinor ${show(amountMinor)}: errors.amountMinor`).toBe('not-positive-integer');
  }
});

test('validateExpense rejects a category outside the list', () => {
  for (const category of ['', 'travel', 'Food', undefined]) {
    const result = scope.validateExpense({ label: 'Taxi', amountMinor: 15000, date: '2026-03-02', category });
    expect(result?.ok, `category ${show(category)}: ok`).toBe(false);
    expect(result.errors?.category, `category ${show(category)}: errors.category`).toBe('unknown');
  }
});

test('validateExpense lists every field with a problem and only those', () => {
  const all = scope.validateExpense({ label: '', amountMinor: 0, date: '2026-03-02', category: '' });
  expect(all?.ok, 'empty label, amount 0 and empty category: ok').toBe(false);
  expect(all.errors, 'empty label, amount 0 and empty category: errors').toEqual({ label: 'required', amountMinor: 'not-positive-integer', category: 'unknown' });
  const one = scope.validateExpense({ label: 'Taxi', amountMinor: 150.5, date: '2026-03-02', category: 'transport' });
  expect(one.errors, 'only the amount 150.5 is wrong: errors').toEqual({ amountMinor: 'not-positive-integer' });
});

test('the functions only return values', () => {
  // Data no other check uses, so that a write to the page shows up as a change; every branch is
  // visited (a valid and an invalid draft, amounts with and without a leading zero).
  const page = screen.$('main')?.innerHTML;
  const printed = logs().length;
  const expenses = [expense({ label: 'Purity probe', amountMinor: 70007 }), expense({ label: 'Purity probe', amountMinor: 7770, category: 'fun' })];
  const drafts = [{ label: '  Purity probe ', amountMinor: 7007, date: '2026-04-07', category: 'home' }, { label: ' ', amountMinor: -7, date: '2026-04-07', category: 'pets' }];
  for (const one of expenses) {
    const label = scope.formatExpenseLabel(one);
    expect(scope.formatExpenseLabel(one), `formatExpenseLabel called twice with ${show(one)}`).toBe(label);
    expect(scope.formatAmount(one.amountMinor), `formatAmount called twice with ${one.amountMinor}`).toBe(scope.formatAmount(one.amountMinor));
  }
  for (const draft of drafts) {
    const result = scope.validateExpense(draft);
    expect(scope.validateExpense(draft), `validateExpense called twice with ${show(draft)}`).toEqual(result);
  }
  expect(expenses, 'the expenses after formatExpenseLabel').toEqual([expense({ label: 'Purity probe', amountMinor: 70007 }), expense({ label: 'Purity probe', amountMinor: 7770, category: 'fun' })]);
  expect(drafts, 'the drafts after validateExpense').toEqual([{ label: '  Purity probe ', amountMinor: 7007, date: '2026-04-07', category: 'home' }, { label: ' ', amountMinor: -7, date: '2026-04-07', category: 'pets' }]);
  expect(logs().length - printed, 'lines printed by the functions').toBe(0);
  expect(screen.$('main')?.innerHTML, 'the page after calling the functions').toBe(page);
});
