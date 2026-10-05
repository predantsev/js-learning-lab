// Synthetic expenses: the six course fixtures, repeated up to `count` records.
const fixtures = [
  ['%%groceries%%', 'food', 84550], ['%%pass%%', 'transport', 52000], ['%%coffee%%', 'fun', 18000],
  ['%%bulbs%%', 'home', 9990], ['%%cinema%%', 'fun', 30000], ['%%lunch%%', 'food', 21050],
];

export function makeExpenses(count) {
  return Array.from({ length: count }, (_, i) => {
    const [label, category, amount] = fixtures[i % fixtures.length];
    return { id: `e-${i + 1}`, label, category, amountMinor: amount + ((i * 7919) % 5000), payer: `payer-${i % 7}@example.invalid` };
  });
}
