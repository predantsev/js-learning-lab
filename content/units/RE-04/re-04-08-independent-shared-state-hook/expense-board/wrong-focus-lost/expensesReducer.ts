import type { Expense, ExpensesState } from "./expenses";

export type ExpenseAction =
  | { type: "added"; expense: Expense }
  | { type: "removed"; id: string }
  | { type: "selected"; id: string };

// An expense may join the list only with a non-empty label, a positive whole number of minor
// units and an id that is not taken yet.
function canAdd(expense: Expense, expenses: Expense[]): boolean {
  return (
    expense.label.trim() !== "" &&
    Number.isInteger(expense.amountMinor) &&
    expense.amountMinor > 0 &&
    !expenses.some((item) => item.id === expense.id)
  );
}

// Every invalid transition returns the same state object, so React skips the render.
export function expensesReducer(state: ExpensesState, action: ExpenseAction): ExpensesState {
  switch (action.type) {
    case "added": {
      if (!canAdd(action.expense, state.expenses)) return state;
      return { ...state, expenses: [...state.expenses, action.expense] };
    }
    case "removed": {
      if (!state.expenses.some((expense) => expense.id === action.id)) return state;
      return {
        expenses: state.expenses.filter((expense) => expense.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    }
    case "selected": {
      if (!state.expenses.some((expense) => expense.id === action.id)) return state;
      return { ...state, selectedId: action.id };
    }
    default: {
      const unhandled: never = action;
      throw new Error(`Unknown action: ${JSON.stringify(unhandled)}`);
    }
  }
}
