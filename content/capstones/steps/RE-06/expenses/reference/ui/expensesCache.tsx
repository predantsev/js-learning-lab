// The async data layer of the expense list: one cache of query results for every screen, the list query
// and the mutations. The fixture API (data/api.ts) is the only source of the expenses; the cache keeps
// what it last answered under a key with the filter ("expenses:all", "expenses:wanted", "expenses:acquired").
//
// useExpensesList(filter) — a query.
// - Returns { items, status, message, retriesLeft, retry }: the cached expenses of this filter (null
//   before the first answer), "loading" (nothing yet), "refreshing" (cached expenses stay on screen
//   while a newer answer is on its way), "ready" or "failed" (only when there is nothing to show).
// - Effect: asks the API on mount, when the filter changes, after an invalidation and after retry().
//   Its cleanup aborts the request, so a slower answer for an old filter never replaces the new one.
// - Retry: only from a button, never while a request is on its way, at most MAX_RETRIES times in a row.
//
// useExpenseMutations() — create, save and the optimistic remove. Each starts from a
// handler, resolves to { ok: true } or { ok: false, message } and, after a successful write,
// invalidates every "expenses:" key: the lists and the summary read again.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Expense } from "../domain/expenses.ts";
import { listExpenses, createExpense, saveExpense, deleteExpense, ApiError } from "../data/api.ts";
import type { ListFilter } from "../data/api.ts";
import type { ExpenseFields } from "./expensesReducer.ts";

const MAX_RETRIES = 3;

type CacheValue = {
  entries: Record<string, Expense[]>;
  version: number; // grows with every invalidation; every "expenses:" query depends on it
  put: (key: string, items: Expense[]) => void;
  patch: (change: (items: Expense[], key: string) => Expense[]) => void; // changes every cached list at once
  invalidate: () => void;
};

const CacheContext = createContext<CacheValue | null>(null);

export function ExpensesCacheProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, Expense[]>>({});
  const [version, setVersion] = useState(0);
  const value: CacheValue = {
    entries: entries,
    version: version,
    put: (key, items) => setEntries((previous) => ({ ...previous, [key]: items })),
    patch: (change) => setEntries((previous) => Object.fromEntries(Object.entries(previous).map(([key, items]) => [key, change(items, key)]))),
    invalidate: () => setVersion((previous) => previous + 1),
  };
  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

function useCache(): CacheValue {
  const cache = useContext(CacheContext);
  if (cache === null) {
    throw new Error("The expense queries work only inside <ExpensesCacheProvider>.");
  }
  return cache;
}

// What went wrong with a request: the status of an answer that is not ok, no connection, or data
// that could not be read.
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    return "%%responseStatusLabel%% " + error.status;
  }
  if (typeof error === "object" && error !== null && "status" in error) {
    return "%%responseStatusLabel%% " + String(error.status);
  }
  if (error instanceof TypeError) {
    return "%%noConnectionLabel%%";
  }
  return "%%badDataLabel%%";
}

export type ListQuery = {
  items: Expense[] | null;
  status: "loading" | "refreshing" | "ready" | "failed";
  message: string;
  retriesLeft: number;
  retry: () => void;
};

export function useExpensesList(filter: ListFilter): ListQuery {
  const cache = useCache();
  const key = "expenses:" + filter;
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ pending: true, error: "", failures: 0 });

  useEffect(() => {
    const controller = new AbortController();
    setRequest((previous) => ({ ...previous, pending: true }));
    listExpenses(filter, controller.signal).then(
      (items) => {
        cache.put(key, items);
        setRequest({ pending: false, error: "", failures: 0 });
      },
      (error: unknown) => {
        // An abort is not an error: a newer request (or leaving the screen) replaced this one.
        if (!controller.signal.aborted) {
          setRequest((previous) => ({ pending: false, error: "%%listLoadFailedMessage%% (" + errorText(error) + ")", failures: previous.failures + 1 }));
        }
      },
    );
    return () => controller.abort();
    // `filter` is part of `key`, and cache.put only calls a state setter, so these are all it reads.
  }, [key, cache.version, attempt]);

  const items = cache.entries[key] ?? null;
  // The first failure is not a retry: after it the button may be pressed MAX_RETRIES times.
  const retriesLeft = MAX_RETRIES + 1 - request.failures;
  let status: ListQuery["status"] = "ready";
  if (request.pending) {
    status = items === null ? "loading" : "refreshing";
  } else if (request.error !== "" && items === null) {
    status = "failed";
  }
  return {
    items: items,
    status: status,
    // After a failed refresh the cached expenses stay, and the message says what happened.
    message: request.pending ? "" : request.error,
    retriesLeft: retriesLeft,
    retry: () => {
      if (!request.pending && retriesLeft > 0) {
        setAttempt((previous) => previous + 1);
      }
    },
  };
}

export type Result = { ok: true } | { ok: false; message: string };

export function useExpenseMutations() {
  const cache = useCache();

  async function run(write: () => Promise<void>, failure: string): Promise<Result> {
    try {
      await write();
      cache.invalidate();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: failure + " (" + errorText(error) + ")" };
    }
  }

  return {
    create: (fields: ExpenseFields) => run(() => createExpense(fields), "%%saveFailedMessage%%"),
    save: (id: string, fields: ExpenseFields) => run(() => saveExpense(id, fields), "%%saveFailedMessage%%"),
    // Optimistic: the expense leaves every cached list at once, so the cards and the category totals
    // change before the API answers. If the API refuses, the expense goes back to the place it had in
    // each list (and with it the totals in amountMinor), and the message names it.
    async removeOptimistic(expense: Expense): Promise<Result> {
      const before = cache.entries;
      cache.patch((items) => items.filter((one) => one.id !== expense.id));
      const result = await run(() => deleteExpense(expense.id), "%%removeFailedMessage%%".replace("{name}", expense.label));
      if (!result.ok) {
        cache.patch((items, key) => {
          const index = before[key]?.findIndex((one) => one.id === expense.id) ?? -1;
          if (index < 0 || items.some((one) => one.id === expense.id)) {
            return items;
          }
          return [...items.slice(0, index), expense, ...items.slice(index)];
        });
      }
      return result;
    },
  };
}
