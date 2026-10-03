import type { ExpensesState } from "./expenses";

// TODO: the actions of the board as one discriminated union.
export type ExpenseAction = { type: "todo" };

// TODO: every transition of the board.
export function expensesReducer(state: ExpensesState, action: ExpenseAction): ExpensesState {
  return state;
}
