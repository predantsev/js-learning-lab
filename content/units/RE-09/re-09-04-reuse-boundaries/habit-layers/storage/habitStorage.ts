// The web storage adapter: the only module that knows about localStorage.
import type { Habit } from "../domain/types";

const KEY = "jsll.habits.v1";

export function loadHabits(fallback: Habit[]): Habit[] {
  const text = localStorage.getItem(KEY);
  return text === null ? fallback : (JSON.parse(text) as Habit[]);
}

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(KEY, JSON.stringify(habits));
}
