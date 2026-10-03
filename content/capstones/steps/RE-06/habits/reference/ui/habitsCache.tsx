// The async data layer of the habit list: one cache of query results for every screen, the list query
// and the mutations. The fixture API (data/api.ts) is the only source of the habits; the cache keeps
// what it last answered under a key with the filter ("habits:all", "habits:wanted", "habits:acquired").
//
// useHabitsList(filter) — a query.
// - Returns { items, status, message, retriesLeft, retry }: the cached habits of this filter (null
//   before the first answer), "loading" (nothing yet), "refreshing" (cached habits stay on screen
//   while a newer answer is on its way), "ready" or "failed" (only when there is nothing to show).
// - Effect: asks the API on mount, when the filter changes, after an invalidation and after retry().
//   Its cleanup aborts the request, so a slower answer for an old filter never replaces the new one.
// - Retry: only from a button, never while a request is on its way, at most MAX_RETRIES times in a row.
//
// useHabitMutations() — create, save, remove and the optimistic mark of a day. Each starts from a
// handler, resolves to { ok: true } or { ok: false, message } and, after a successful write,
// invalidates every "habits:" key: the lists and the summary read again.
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { uniqueSortedDays } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { listHabits, createHabit, saveHabit, deleteHabit, addCompletion, ApiError } from "../data/api.ts";
import type { ListFilter } from "../data/api.ts";
import type { HabitFields } from "./habitsReducer.ts";

const MAX_RETRIES = 3;

type CacheValue = {
  entries: Record<string, Habit[]>;
  version: number; // grows with every invalidation; every "habits:" query depends on it
  put: (key: string, items: Habit[]) => void;
  patch: (change: (items: Habit[]) => Habit[]) => void; // changes every cached list at once
  invalidate: () => void;
};

const CacheContext = createContext<CacheValue | null>(null);

export function HabitsCacheProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, Habit[]>>({});
  const [version, setVersion] = useState(0);
  const value: CacheValue = {
    entries: entries,
    version: version,
    put: (key, items) => setEntries((previous) => ({ ...previous, [key]: items })),
    patch: (change) => setEntries((previous) => Object.fromEntries(Object.entries(previous).map(([key, items]) => [key, change(items)]))),
    invalidate: () => setVersion((previous) => previous + 1),
  };
  return <CacheContext.Provider value={value}>{children}</CacheContext.Provider>;
}

function useCache(): CacheValue {
  const cache = useContext(CacheContext);
  if (cache === null) {
    throw new Error("The habit queries work only inside <HabitsCacheProvider>.");
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
  items: Habit[] | null;
  status: "loading" | "refreshing" | "ready" | "failed";
  message: string;
  retriesLeft: number;
  retry: () => void;
};

export function useHabitsList(filter: ListFilter): ListQuery {
  const cache = useCache();
  const key = "habits:" + filter;
  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState({ pending: true, error: "", failures: 0 });

  useEffect(() => {
    const controller = new AbortController();
    setRequest((previous) => ({ ...previous, pending: true }));
    listHabits(filter, controller.signal).then(
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
  const retriesLeft = MAX_RETRIES - request.failures;
  let status: ListQuery["status"] = "ready";
  if (request.pending) {
    status = items === null ? "loading" : "refreshing";
  } else if (request.error !== "" && items === null) {
    status = "failed";
  }
  return {
    items: items,
    status: status,
    // After a failed refresh the cached habits stay, and the message says what happened.
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

export function useHabitMutations() {
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
    create: (fields: HabitFields) => run(() => createHabit(fields), "%%saveFailedMessage%%"),
    save: (id: string, fields: HabitFields) => run(() => saveHabit(id, fields), "%%saveFailedMessage%%"),
    remove: (id: string) => run(() => deleteHabit(id), "%%deleteFailedMessage%%"),
    // Optimistic: every cached list shows the day at once. If the API refuses, only this habit goes
    // back to the record it was — with every other day it had — and the message names it. A day that
    // is already there sends nothing.
    async markDay(habit: Habit, day: string): Promise<Result> {
      if (habit.completions.includes(day)) {
        return { ok: true };
      }
      const replaceWith = (next: Habit) => cache.patch((items) => items.map((one) => (one.id === habit.id ? next : one)));
      replaceWith({ ...habit, completions: uniqueSortedDays([...habit.completions, day]) });
      const result = await run(() => addCompletion(habit.id, day), "%%markFailedMessage%%".replace("{name}", habit.name));
      if (!result.ok) {
        replaceWith(habit);
      }
      return result;
    },
  };
}
