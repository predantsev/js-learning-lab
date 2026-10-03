// useHabits(startingHabits) — the data hook of the habit list.
// - Returns [habits, dispatch]: the current list and the dispatch of habitsReducer.
// - Start: the habits saved under jsll.habits.v1 (checked by loadHabits), read on the first render
//   only; without usable saved habits, `startingHabits`.
// - Effect: writes the whole list with saveHabits after every change of it (dependency [habits]).
// - Cleanup: none — a write switches nothing on.
import { useEffect, useReducer } from "react";
import type { Dispatch } from "react";
import { loadHabits, saveHabits } from "../storage/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { habitsReducer } from "./habitsReducer.ts";
import type { HabitsAction } from "./habitsReducer.ts";

// The third argument of useReducer works like the function given to useState: React calls it with
// the second argument on the first render only.
function readSaved(startingHabits: Habit[]): Habit[] {
  const saved = loadHabits(localStorage);
  return saved.ok ? saved.habits : startingHabits;
}

export function useHabits(startingHabits: Habit[]): [Habit[], Dispatch<HabitsAction>] {
  const [habits, dispatch] = useReducer(habitsReducer, startingHabits, readSaved);

  useEffect(() => {
    saveHabits(localStorage, habits);
  }, [habits]);

  return [habits, dispatch];
}
