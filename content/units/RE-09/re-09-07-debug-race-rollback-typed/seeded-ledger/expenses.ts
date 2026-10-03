// The expense types: the domain record, the screen's state and every action.
export type Expense = { readonly id: string; label: string; amountMinor: number; date: string };

export type ExpensesState =
  | { status: "loading" }
  | { status: "ready"; expenses: Expense[]; confirmed: Record<string, number> } // confirmed: the newest confirmed edit per id
  | { status: "failed"; message: string };

export type ExpensesAction =
  | { type: "loaded"; expenses: Expense[] }
  | { type: "loadFailed"; message: string }
  | { type: "retried" }
  | { type: "editStarted"; id: string; amountMinor: number; mutation: number }
  | { type: "editConfirmed"; id: string; mutation: number }
  | { type: "editFailed"; id: string; mutation: number; previousAmount: number };
