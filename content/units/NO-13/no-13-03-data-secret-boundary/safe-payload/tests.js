import { toInitialData, serializeForHtml } from './payload.js';

// Fresh records inside the checks, with one more server-only field than expenses.js has.
const stored = () => [
  { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun', receiptPath: 'data/receipts/e-03.txt', internalNote: L.note, syncToken: 'sync-e03-not-a-real-token' },
  { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home', receiptPath: 'data/receipts/e-04.txt', internalNote: '', syncToken: 'sync-e04-not-a-real-token' },
];
const hostile = () => ({ expenses: [{ id: 'e-07', label: '</script><script>alert(1)</script> & <!-- "q" \u2028\u2029', amountMinor: 1200 }] });

function serialized(value) {
  expect(typeof serializeForHtml, 'type of serializeForHtml').toBe('function');
  const text = serializeForHtml(value);
  expect(typeof text, 'type of what serializeForHtml returns').toBe('string');
  return text;
}

test('keeps only the public fields', () => {
  expect(typeof toInitialData, 'type of toInitialData').toBe('function');
  const result = toInitialData(stored());
  expect(result, 'toInitialData of two expenses').toEqual([
    { id: 'e-03', label: L.coffee, amountMinor: 18000, date: '2026-02-28', category: 'fun' },
    { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  ]);
});

test('leaves the stored records unchanged', () => {
  expect(typeof toInitialData, 'type of toInitialData').toBe('function');
  const records = stored();
  toInitialData(records);
  expect(records, 'the records after toInitialData').toEqual(stored());
});

test('a </script> in the data cannot end the script', () => {
  const text = serialized(hostile());
  expect(text.includes('<'), `a raw < in ${text}`).toBe(false);
});

test('> and & are written as escapes too', () => {
  const text = serialized(hostile());
  expect(text.includes('>'), `a raw > in ${text}`).toBe(false);
  expect(text.includes('&'), `a raw & in ${text}`).toBe(false);
});

test('U+2028 and U+2029 are written as escapes', () => {
  const text = serialized(hostile());
  expect(text.includes('\u2028') || text.includes('\u2029'), 'a raw U+2028 or U+2029 in the text').toBe(false);
});

test('JSON.parse gives back exactly the same value', () => {
  const text = serialized(hostile());
  let parsed;
  expect(() => { parsed = JSON.parse(text); }, 'JSON.parse of the serialized text').not.toThrow();
  expect(parsed, 'the parsed value').toEqual(hostile());
});
