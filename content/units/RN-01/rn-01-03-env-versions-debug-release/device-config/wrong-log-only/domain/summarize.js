// Misconception: "the app reads .env at runtime like Node does" — the config is left as it was.
export function summarizeExpenses(expenses) {
  return expenses.reduce((total, expense) => total + expense.amountMinor, 0);
}
