// 20,000 synthetic expenses, built from the six course fixtures.
const fixtures = [
  ['%%groceries%%', 'food', 84550], ['%%pass%%', 'transport', 52000], ['%%coffee%%', 'fun', 18000],
  ['%%bulbs%%', 'home', 9990], ['%%cinema%%', 'fun', 30000], ['%%lunch%%', 'food', 21050],
];

export const categories = ['food', 'transport', 'home', 'fun'];

export function makeExpenses(count) {
  const expenses = [];
  for (let i = 1; i <= count; i++) {
    const [label, category, amountMinor] = fixtures[i % fixtures.length];
    const day = String(1 + (i % 28)).padStart(2, '0');
    expenses.push({ id: `e-${i}`, label: `${label} ${i}`, amountMinor: amountMinor + (i % 50), date: `2026-02-${day}`, category });
  }
  return expenses;
}
