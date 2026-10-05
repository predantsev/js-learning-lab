// Expenses and their reducer. Read-only.
export const START_EXPENSES = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

export function expensesReducer(expenses, action) {
  switch (action.type) {
    case "removed":
      return expenses.filter((expense) => expense.id !== action.id);
    default:
      return expenses;
  }
}

export function formatAmount(amountMinor) {
  return (amountMinor / 100).toFixed(2);
}
