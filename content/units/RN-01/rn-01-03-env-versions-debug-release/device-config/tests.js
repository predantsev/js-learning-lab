import { summarizeExpenses } from './domain/summarize.js';

const sample = [
  { id: 'e-04', label: L.bulbs, amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-06', label: L.lunch, amountMinor: 21050, date: '2026-03-02', category: 'food' },
];

test('the screen shows the server address from the build', async () => {
  await waitFor(() => screen.byRole('heading'));
  expect(screen.text(), 'the settings screen').toContain(`${L.server}: http://192.168.1.20:4000`);
});

test('summarizeExpenses returns the total in minor units', () => {
  expect(summarizeExpenses(sample), 'summarizeExpenses of two expenses').toBe(31040);
});

test('summarizeExpenses prints nothing', () => {
  const before = logs().length;
  summarizeExpenses(sample);
  expect(logs().slice(before), 'lines printed by summarizeExpenses').toEqual([]);
});

test('summarizeExpenses works without __DEV__, as in the web client', () => {
  const saved = globalThis.__DEV__;
  delete globalThis.__DEV__;
  try {
    expect(() => summarizeExpenses(sample), 'summarizeExpenses with no __DEV__ global').not.toThrow();
  } finally {
    globalThis.__DEV__ = saved;
  }
});
