// A domain function from the JavaScript stage: totals per category in minor units. It never changes here.
export function totalsByCategory(expenses) {
  const totals = new Map();
  for (const expense of expenses) totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountMinor);
  return totals;
}
