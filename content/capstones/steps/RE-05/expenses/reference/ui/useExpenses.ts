// useExpenses() — the data hook of the expense list.
// - Returns { expenses, load, dispatch, retry }: the current list, the state of the starting load, the
//   dispatch of expensesReducer and a function that tries the load again after an error.
// - Start: the expenses saved under jsll.expenses.v1 (checked by loadExpenses), read on the first render
//   only; then `load` is "ready" at once. Without usable saved expenses `load` starts as "loading" and an
//   effect fetches the starting expenses of data/expenses.json.
// - Effects: the fetch, aborted by its cleanup (a newer attempt or an unmount); and the write of the
//   whole list with saveExpenses after every change — only once the list is known, so the empty list of
//   a load in progress is never written.
// ExpensesContext hands the same object to every screen under the router.
import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Dispatch } from "react";
import { loadExpenses, saveExpenses } from "../storage/expenses.ts";
import type { Expense } from "../domain/expenses.ts";
import { loadFixtures } from "../data/fixtures.js";
import { expensesReducer } from "./expensesReducer.ts";
import type { ExpensesAction } from "./expensesReducer.ts";

export type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "failed"; message: string };

export type ExpensesData = { expenses: Expense[]; load: LoadState; dispatch: Dispatch<ExpensesAction>; retry: () => void };

// The message for a failed load: the status of an answer that is not ok, no connection (fetch rejects
// with a TypeError), or a damaged file.
function loadErrorText(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    return "%%loadHttpError%% " + String(error.status);
  }
  if (error instanceof TypeError) {
    return "%%loadNetworkError%%";
  }
  return "%%loadDataError%%";
}

export function useExpenses(): ExpensesData {
  // A function given to useState runs on the first render only.
  const [saved] = useState(() => loadExpenses(localStorage));
  const [expenses, dispatch] = useReducer(expensesReducer, saved, (first) => (first.ok ? first.expenses : []));
  const [load, setLoad] = useState<LoadState>(saved.ok ? { kind: "ready" } : { kind: "loading" });

  useEffect(() => {
    if (load.kind !== "loading") {
      return;
    }
    const controller = new AbortController();
    loadFixtures(controller.signal).then(
      (records: Expense[]) => {
        dispatch({ type: "loaded", expenses: records });
        setLoad({ kind: "ready" });
      },
      (error: unknown) => {
        // An abort is not an error: this attempt was replaced or the page went away.
        if (!controller.signal.aborted) {
          setLoad({ kind: "failed", message: loadErrorText(error) });
        }
      },
    );
    return () => controller.abort();
  }, [load.kind]);

  useEffect(() => {
    if (load.kind === "ready") {
      saveExpenses(localStorage, expenses);
    }
  }, [load.kind, expenses]);

  return { expenses: expenses, load: load, dispatch: dispatch, retry: () => setLoad({ kind: "loading" }) };
}

export const ExpensesContext = createContext<ExpensesData | null>(null);

// The data of the list for a component under <ExpensesContext.Provider>.
export function useExpensesData(): ExpensesData {
  const data = useContext(ExpensesContext);
  if (data === null) {
    throw new Error("useExpensesData works only inside <ExpensesContext.Provider>.");
  }
  return data;
}
