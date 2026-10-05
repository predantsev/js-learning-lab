// The expense lab's data (synthetic): the six fixtures of the expense tracker, then 1200 generated
// expenses so that the list is as long as a year of real use. Amounts are whole minor units.
export const CATEGORIES = ['food', 'transport', 'home', 'fun'];

const FIXTURES = [
  { id: 'e-01', label: '%%groceries%%', amountMinor: 84550, date: '2026-03-01', category: 'food' },
  { id: 'e-02', label: '%%transit%%', amountMinor: 52000, date: '2026-03-01', category: 'transport' },
  { id: 'e-03', label: '%%coffee%%', amountMinor: 18000, date: '2026-02-28', category: 'fun' },
  { id: 'e-04', label: '%%bulbs%%', amountMinor: 9990, date: '2026-02-27', category: 'home' },
  { id: 'e-05', label: '%%cinema%%', amountMinor: 30000, date: '2026-02-27', category: 'fun' },
  { id: 'e-06', label: '%%lunch%%', amountMinor: 21050, date: '2026-03-02', category: 'food' },
];

export function seedExpenses() {
  const generated = Array.from({ length: 1200 }, (_, i) => ({
    id: `g-${String(i + 1).padStart(4, '0')}`,
    label: `${FIXTURES[i % 6].label} ${Math.floor(i / 6) + 1}`,
    amountMinor: 1000 + ((i * 7919) % 90000),
    date: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
    category: CATEGORIES[i % 4],
  }));
  return [...FIXTURES, ...generated];
}
