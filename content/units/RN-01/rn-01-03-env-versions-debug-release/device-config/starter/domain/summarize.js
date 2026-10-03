// Shared domain code: used by the web client and by the native app.
export function summarizeExpenses(expenses) {
  console.log('summarizeExpenses input:', expenses.length);
  return expenses.reduce((total, expense) => total + expense.amountMinor, 0);
}
