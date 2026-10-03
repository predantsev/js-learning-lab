import type { Expense, ExpensesAction, ExpensesState } from "./expenses";

const setAmount = (expenses: Expense[], id: string, amountMinor: number) =>
  expenses.map((expense) => (expense.id === id ? { ...expense, amountMinor } : expense));

export function expensesReducer(state: ExpensesState, action: ExpensesAction): ExpensesState {
  switch (action.type) {
    case "loaded":
      if (state.status !== "loading") return state;
      return { status: "ready", expenses: action.expenses, confirmed: {} };
    case "loadFailed":
      // A failure means something only while loading; the new state carries only its own fields.
      if (state.status !== "loading") return state;
      return { status: "failed", message: action.message };
    case "retried":
      if (state.status !== "failed") return state;
      return { status: "loading" };
    case "editStarted":
      if (state.status !== "ready") return state;
      return { ...state, expenses: setAmount(state.expenses, action.id, action.amountMinor) };
    case "editConfirmed": {
      if (state.status !== "ready") return state;
      const newest = Math.max(state.confirmed[action.id] ?? 0, action.mutation);
      return { ...state, confirmed: { ...state.confirmed, [action.id]: newest } };
    }
    case "editFailed":
      if (state.status !== "ready") return state;
      // A newer edit of this expense is already confirmed: its value wins, nothing to roll back.
      if ((state.confirmed[action.id] ?? 0) > action.mutation) return state;
      // Roll back to the amount from before this edit.
      return { ...state, expenses: setAmount(state.expenses, action.id, action.previousAmount) };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
