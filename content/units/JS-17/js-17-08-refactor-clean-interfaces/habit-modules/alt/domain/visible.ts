import type { Habit } from "../types.ts";

const matches = (habit: Habit, needle: string): boolean => habit.active && habit.name.toLowerCase().includes(needle);

export function visibleHabits(habits: readonly Habit[], query: string): Habit[] {
  const shown: Habit[] = [];
  for (const habit of habits) {
    if (matches(habit, query.toLowerCase())) shown.push(habit);
  }
  return shown;
}
