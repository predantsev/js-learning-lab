// Misconception: "guarding with __DEV__ makes the log safe in shared code".
// __DEV__ exists only in React Native; the web client has no such global.
export function summarizeExpenses(expenses) {
  if (__DEV__) console.log('summarizeExpenses input:', expenses.length);
  return expenses.reduce((total, expense) => total + expense.amountMinor, 0);
}
