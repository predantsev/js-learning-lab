// The rules of an expense: pure functions, no page and no storage.

// An amount in minor units as text with two decimals: 21050 → "210.50".
export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}

// The sum of all amounts, in minor units.
export function totalOf(list) {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}
