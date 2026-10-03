// totals.js: category totals in minor units, counting how often they are computed. Do not edit.
export const totalsStats = { calls: 0 };

export function categoryTotals(expenses) {
  totalsStats.calls += 1;
  const totals = {};
  // Sorted by date like the report screen does — the expensive part on a long list.
  for (const expense of [...expenses].sort((a, b) => a.date.localeCompare(b.date))) {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amountMinor;
  }
  return totals;
}
