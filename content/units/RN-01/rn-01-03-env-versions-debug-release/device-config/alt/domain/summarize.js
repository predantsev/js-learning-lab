// Shared domain code: used by the web client and by the native app.
export function summarizeExpenses(expenses) {
  let total = 0;
  for (const expense of expenses) total += expense.amountMinor;
  return total;
}
