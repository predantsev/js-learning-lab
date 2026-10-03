import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { START_EXPENSES } from "./expenses";
import type { ExpensesState } from "./expenses";
import { expensesReducer } from "./expensesReducer";
import type { ExpenseAction } from "./expensesReducer";

// Contract of useExpenses(key)
// - Arguments: key — the localStorage key of this board; read on the first render only.
// - Returns: [state, dispatch] of expensesReducer; nothing is selected at the start.
// - Start: the array stored under `key`; when nothing usable is stored, START_EXPENSES.
// - Effect: stores state.expenses under `key` after every change (dependencies [key, state.expenses]).
// - Cleanup: none — writing a value switches nothing on.
// - Every call owns its own state and its own key.
function readStored(key: string): ExpensesState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (Array.isArray(value)) return { expenses: value, selectedId: null };
  } catch {
    // Damaged text: fall through to the starting list.
  }
  return { expenses: START_EXPENSES, selectedId: null };
}

export function useExpenses(key: string): [ExpensesState, Dispatch<ExpenseAction>] {
  // The stored list is read on every render, but useReducer uses it only the first time.
  const [state, dispatch] = useReducer(expensesReducer, readStored(key));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state.expenses));
  }, [key, state.expenses]);

  return [state, dispatch];
}
