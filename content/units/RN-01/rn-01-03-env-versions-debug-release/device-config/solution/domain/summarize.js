// Shared domain code: used by the web client and by the native app.
// No logging here: debug output belongs to the platform code that calls it.
export function summarizeExpenses(expenses) {
  return expenses.reduce((total, expense) => total + expense.amountMinor, 0);
}
