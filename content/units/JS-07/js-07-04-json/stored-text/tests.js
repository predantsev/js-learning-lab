// The checks see the functions only when the file ran to its end.
const fns = () => {
  const toStoredText = scope.toStoredText;
  const fromStoredText = scope.fromStoredText;
  expect(typeof toStoredText, 'toStoredText as the checks see it (the file must run to its end)').toBe('function');
  expect(typeof fromStoredText, 'fromStoredText as the checks see it (the file must run to its end)').toBe('function');
  return { toStoredText, fromStoredText };
};

const sample = () => [
  { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: new Date('2026-02-27'), category: 'home' },
  { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];

test('the file runs to its end', () => {
  expect(loadError(), 'uncaught error while the file ran').toBeNull();
});

test('toStoredText returns JSON text', () => {
  const { toStoredText } = fns();
  const text = toStoredText(sample());
  expect(typeof text, 'type of the result').toBe('string');
  expect(() => JSON.parse(text), 'JSON.parse of the result').not.toThrow();
});

test('every date is stored as YYYY-MM-DD text', () => {
  const { toStoredText } = fns();
  const stored = JSON.parse(toStoredText(sample()));
  expect(stored.map((record) => record.date), 'the stored dates').toEqual(['2026-02-27', '2026-03-02']);
});

test('the other fields are stored unchanged', () => {
  const { toStoredText } = fns();
  const stored = JSON.parse(toStoredText(sample()));
  expect(stored[0], 'the first stored record').toEqual({ id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' });
  expect(stored[1], 'the second stored record').toEqual({ id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' });
});

test('toStoredText leaves the records unchanged', () => {
  const { toStoredText } = fns();
  const records = sample();
  const firstDate = records[0].date;
  toStoredText(records);
  expect(records[0].date, 'the first record’s date after the call').toBe(firstDate);
  expect(records[0].date instanceof Date, 'the first record’s date is still a Date object').toBe(true);
});

test('fromStoredText reads valid text back', () => {
  const { fromStoredText } = fns();
  const text = '[{"id":"e-02","label":"' + L.transit + '","amountMinor":52000,"date":"2026-03-01","category":"transport"}]';
  expect(fromStoredText(text), 'fromStoredText(valid text)').toEqual({
    ok: true,
    records: [{ id: 'e-02', label: L.transit, amountMinor: 52000, date: '2026-03-01', category: 'transport' }],
  });
});

test('fromStoredText returns a failure for malformed text instead of throwing', () => {
  const { fromStoredText } = fns();
  for (const text of ['[{"id":"e-02"', 'not json', '']) {
    const shown = JSON.stringify(text);
    let result;
    expect(() => {
      result = fromStoredText(text);
    }, 'fromStoredText(' + shown + ')').not.toThrow();
    expect(result?.ok, 'ok for ' + shown).toBe(false);
    expect(typeof result?.reason === 'string' && result.reason.length > 0, 'a reason text for ' + shown).toBe(true);
  }
});

test('a round trip gives the records back with day dates', () => {
  const { toStoredText, fromStoredText } = fns();
  const result = fromStoredText(toStoredText(sample()));
  expect(result?.ok, 'ok after the round trip').toBe(true);
  expect(result.records.map((record) => record.date), 'the dates after the round trip').toEqual(['2026-02-27', '2026-03-02']);
});
