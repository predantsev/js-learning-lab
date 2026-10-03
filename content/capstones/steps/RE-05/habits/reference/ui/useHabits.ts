// useHabits() — the data hook of the habit list.
// - Returns { habits, load, dispatch, retry }: the current list, the state of the starting load, the
//   dispatch of habitsReducer and a function that tries the load again after an error.
// - Start: the habits saved under jsll.habits.v1 (checked by loadHabits), read on the first render
//   only; then `load` is "ready" at once. Without usable saved habits `load` starts as "loading" and an
//   effect fetches the starting habits of data/habits.json.
// - Effects: the fetch, aborted by its cleanup (a newer attempt or an unmount); and the write of the
//   whole list with saveHabits after every change — only once the list is known, so the empty list of
//   a load in progress is never written.
// HabitsContext hands the same object to every screen under the router.
import { createContext, useContext, useEffect, useReducer, useState } from "react";
import type { Dispatch } from "react";
import { loadHabits, saveHabits } from "../storage/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { loadFixtures } from "../data/fixtures.js";
import { habitsReducer } from "./habitsReducer.ts";
import type { HabitsAction } from "./habitsReducer.ts";

export type LoadState = { kind: "loading" } | { kind: "ready" } | { kind: "failed"; message: string };

export type HabitsData = { habits: Habit[]; load: LoadState; dispatch: Dispatch<HabitsAction>; retry: () => void };

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

export function useHabits(): HabitsData {
  // A function given to useState runs on the first render only.
  const [saved] = useState(() => loadHabits(localStorage));
  const [habits, dispatch] = useReducer(habitsReducer, saved, (first) => (first.ok ? first.habits : []));
  const [load, setLoad] = useState<LoadState>(saved.ok ? { kind: "ready" } : { kind: "loading" });

  useEffect(() => {
    if (load.kind !== "loading") {
      return;
    }
    const controller = new AbortController();
    loadFixtures(controller.signal).then(
      (records: Habit[]) => {
        dispatch({ type: "loaded", habits: records });
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
      saveHabits(localStorage, habits);
    }
  }, [load.kind, habits]);

  return { habits: habits, load: load, dispatch: dispatch, retry: () => setLoad({ kind: "loading" }) };
}

export const HabitsContext = createContext<HabitsData | null>(null);

// The data of the list for a component under <HabitsContext.Provider>.
export function useHabitsData(): HabitsData {
  const data = useContext(HabitsContext);
  if (data === null) {
    throw new Error("useHabitsData works only inside <HabitsContext.Provider>.");
  }
  return data;
}
