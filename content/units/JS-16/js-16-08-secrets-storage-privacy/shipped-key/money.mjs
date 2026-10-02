// money.mjs: helpers for amounts kept in minor units (kopiykas or cents).
export function totalMinor(expenses) {
  let total = 0;
  for (const expense of expenses) {
    total += expense.amountMinor;
  }
  return total;
}

export function formatMinor(amountMinor) {
  return `${(amountMinor / 100).toFixed(2)} UAH`;
}
