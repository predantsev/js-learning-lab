// Expenses, their actions and their reducer. Read-only.
export type Expense = { readonly id: string; label: string; amountMinor: number };

export type ExpenseAction =
  | { type: "added"; expense: Expense }
  | { type: "removed"; id: string };

export const START_EXPENSES: Expense[] = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

export function expensesReducer(expenses: Expense[], action: ExpenseAction): Expense[] {
  switch (action.type) {
    case "added":
      return [...expenses, action.expense];
    case "removed":
      return expenses.filter((expense) => expense.id !== action.id);
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}

// "12.5" → 1250; anything that is not a positive amount → null.
export function toMinor(text: string): number | null {
  const amount = Number(text.replace(",", "."));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

export function formatAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

let nextNumber = 4;

// A fresh id for a new expense: "e-04", "e-05", …
export function nextExpenseId(): string {
  const id = "e-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return id;
}
