import type { Expense, ExpensesAction, ExpensesState } from "./expenses";

const setAmount = (expenses: Expense[], id: string, amountMinor: number) =>
  expenses.map((expense) => (expense.id === id ? { ...expense, amountMinor } : expense));

// True when a newer edit of `id` than `mutation` has already been confirmed.
function isOutdated(confirmed: Record<string, number>, id: string, mutation: number): boolean {
  const newest = confirmed[id];
  return newest !== undefined && newest > mutation;
}

export function expensesReducer(state: ExpensesState, action: ExpensesAction): ExpensesState {
  switch (action.type) {
    case "loaded":
      if (state.status !== "loading") return state;
      return { status: "ready", expenses: action.expenses, confirmed: {} };
    case "loadFailed":
      return state.status === "loading" ? { status: "failed", message: action.message } : state;
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
      if (state.status !== "ready" || isOutdated(state.confirmed, action.id, action.mutation)) return state;
      return { ...state, expenses: setAmount(state.expenses, action.id, action.previousAmount) };
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
