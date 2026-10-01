// Hidden fixtures: many records, including null, '', 0, NaN, text and BigInt amounts.
const validate = (input) => scope.validate(input);
const valid = (input) => ({ ok: true, value: input });
const invalid = (errors) => ({ ok: false, errors });
const base = { label: L.lunch, amountMinor: 21050, category: 'food' };
const withField = (field, value) => ({ ...base, [field]: value });

test('validate is still a function', () => {
  expect(typeof scope.validate, 'type of validate').toBe('function');
});

test('accepts a complete expense', () => {
  const lunch = { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' };
  expect(validate(lunch), 'result for a lunch').toEqual(valid(lunch));
  const bulbs = { label: L.bulbs, amountMinor: 9990, category: 'home' };
  expect(validate(bulbs), 'result for light bulbs').toEqual(valid(bulbs));
  for (const category of ['food', 'transport', 'home', 'fun']) {
    expect(validate(withField('category', category)), `result for the category "${category}"`).toEqual(valid(withField('category', category)));
  }
});

test('reports a missing or empty label as required', () => {
  expect(validate(withField('label', '')), 'label ""').toEqual(invalid({ label: 'required' }));
  expect(validate(withField('label', null)), 'label null').toEqual(invalid({ label: 'required' }));
  expect(validate({ amountMinor: 21050, category: 'food' }), 'no label field').toEqual(invalid({ label: 'required' }));
});

test('reports a label that is not text', () => {
  expect(validate(withField('label', 42)), 'label 42').toEqual(invalid({ label: 'not-text' }));
  expect(validate(withField('label', 0)), 'label 0').toEqual(invalid({ label: 'not-text' }));
  expect(validate(withField('label', false)), 'label false').toEqual(invalid({ label: 'not-text' }));
});

test('reports a missing amount as required', () => {
  expect(validate(withField('amountMinor', null)), 'amountMinor null').toEqual(invalid({ amountMinor: 'required' }));
  expect(validate({ label: L.lunch, category: 'food' }), 'no amountMinor field').toEqual(invalid({ amountMinor: 'required' }));
});

test('treats 0 and negative amounts as not positive', () => {
  expect(validate(withField('amountMinor', 0)), 'amountMinor 0').toEqual(invalid({ amountMinor: 'not-positive' }));
  expect(validate(withField('amountMinor', -500)), 'amountMinor -500').toEqual(invalid({ amountMinor: 'not-positive' }));
});

test('reports NaN, text and BigInt amounts as not a number', () => {
  expect(validate(withField('amountMinor', NaN)), 'amountMinor NaN').toEqual(invalid({ amountMinor: 'not-a-number' }));
  expect(validate(withField('amountMinor', '21050')), 'amountMinor "21050"').toEqual(invalid({ amountMinor: 'not-a-number' }));
  expect(validate(withField('amountMinor', 21050n)), 'amountMinor 21050n').toEqual(invalid({ amountMinor: 'not-a-number' }));
});

test('reports a fractional amount as not whole', () => {
  expect(validate(withField('amountMinor', 210.5)), 'amountMinor 210.5').toEqual(invalid({ amountMinor: 'not-whole' }));
});

test('checks the category against the list', () => {
  expect(validate(withField('category', 'travel')), 'category "travel"').toEqual(invalid({ category: 'unknown' }));
  expect(validate(withField('category', 'Food')), 'category "Food"').toEqual(invalid({ category: 'unknown' }));
  expect(validate(withField('category', '')), 'category ""').toEqual(invalid({ category: 'required' }));
  expect(validate(withField('category', null)), 'category null').toEqual(invalid({ category: 'required' }));
});

test('survives a missing record', () => {
  const allMissing = invalid({ label: 'required', amountMinor: 'required', category: 'required' });
  expect(validate(null), 'validate(null)').toEqual(allMissing);
  expect(validate(undefined), 'validate(undefined)').toEqual(allMissing);
});

test('reports every problem of a record at once', () => {
  expect(validate({ label: '', amountMinor: 0, category: 'travel' }), 'a record with three problems')
    .toEqual(invalid({ label: 'required', amountMinor: 'not-positive', category: 'unknown' }));
});

test('does not change the record it checks', () => {
  const record = { label: '', amountMinor: NaN, category: null, note: undefined };
  const before = { ...record };
  validate(record);
  expect(record, 'the record after validate').toEqual(before);
  expect(Object.keys(record), 'its field names').toEqual(Object.keys(before));
});
