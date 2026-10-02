import type { Habit } from "../types.ts";

// visibleHabits(habits, query): the active habits whose name contains the query, compared
// without regard to letter case, in their original order. Pure: no page and no `view`.
export function visibleHabits(habits: readonly Habit[], query: string): Habit[] {
  const needle = query.toLowerCase();
  return habits.filter((habit) => habit.active && habit.name.toLowerCase().includes(needle));
}
