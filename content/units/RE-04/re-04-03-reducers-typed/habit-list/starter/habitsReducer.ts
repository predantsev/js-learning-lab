import type { Habit } from "./habits";

// TODO: describe the four actions that App.tsx dispatches as one discriminated union.
export type HabitAction = { type: "todo" };

// TODO: return the next list for every action, without changing the list it receives.
export function habitsReducer(habits: Habit[], action: HabitAction): Habit[] {
  return habits;
}
