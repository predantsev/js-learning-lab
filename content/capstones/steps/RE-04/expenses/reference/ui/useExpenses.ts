// useExpenses(startingExpenses) — the data hook of the expense list.
// - Returns [expenses, dispatch]: the current list and the dispatch of expensesReducer.
// - Start: the expenses saved under jsll.expenses.v1 (checked by loadExpenses), read on the first
//   render only; without usable saved expenses, `startingExpenses`.
// - Effect: writes the whole list with saveExpenses after every change of it (dependency [expenses]).
// - Cleanup: none — a write switches nothing on.
import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { loadExpenses, saveExpenses } from "../storage/expenses.ts";
import type { Expense } from "../domain/expenses.ts";
import { expensesReducer } from "./expensesReducer.ts";
import type { ExpensesAction } from "./expensesReducer.ts";

// The third argument of useReducer works like the function given to useState: React calls it with
// the second argument on the first render only.
function readSaved(startingExpenses: Expense[]): Expense[] {
  const saved = loadExpenses(localStorage);
  return saved.ok ? saved.expenses : startingExpenses;
}

export function useExpenses(startingExpenses: Expense[]): [Expense[], Dispatch<ExpensesAction>] {
  const [expenses, dispatch] = useReducer(expensesReducer, startingExpenses, readSaved);

  useEffect(() => {
    saveExpenses(localStorage, expenses);
  }, [expenses]);

  return [expenses, dispatch];
}
