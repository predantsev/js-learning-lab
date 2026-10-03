import type { Expense, ExpensesState } from "./expenses";

type Added = { type: "added"; expense: Expense };
type Removed = { type: "removed"; id: string };
type Selected = { type: "selected"; id: string };
export type ExpenseAction = Added | Removed | Selected;

export function expensesReducer(state: ExpensesState, action: ExpenseAction): ExpensesState {
  if (action.type === "added") {
    const { expense } = action;
    const taken = state.expenses.some((item) => item.id === expense.id);
    const valid = expense.label.trim().length > 0 && Number.isInteger(expense.amountMinor) && expense.amountMinor >= 1;
    return valid && !taken ? { expenses: state.expenses.concat(expense), selectedId: state.selectedId } : state;
  }
  const exists = state.expenses.some((item) => item.id === action.id);
  if (!exists) return state;
  if (action.type === "selected") return { expenses: state.expenses, selectedId: action.id };
  return {
    expenses: state.expenses.filter((item) => item.id !== action.id),
    selectedId: state.selectedId === action.id ? null : state.selectedId,
  };
}
