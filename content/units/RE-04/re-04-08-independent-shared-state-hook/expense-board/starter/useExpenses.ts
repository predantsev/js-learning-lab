import type { Dispatch } from "react";
import type { ExpensesState } from "./expenses";
import type { ExpenseAction } from "./expensesReducer";

// TODO: the contract, then the hook.
export function useExpenses(key: string): [ExpensesState, Dispatch<ExpenseAction>] {
  throw new Error("TODO: useExpenses is not written yet");
}
