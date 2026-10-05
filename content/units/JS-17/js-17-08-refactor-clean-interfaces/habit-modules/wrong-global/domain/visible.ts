import type { Habit } from "../types.ts";
import { view } from "../page.ts";

// Still reads the hidden view instead of its query parameter.
export function visibleHabits(habits: readonly Habit[], query: string): Habit[] {
  const needle = view.query.toLowerCase();
  return habits.filter((habit) => habit.active && habit.name.toLowerCase().includes(needle));
}
