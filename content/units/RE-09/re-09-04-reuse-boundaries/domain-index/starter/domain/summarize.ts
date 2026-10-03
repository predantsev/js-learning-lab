// Pure transforms. Read-only.
import type { Habit, HabitSummary } from "./types";

export function summarizeHabit(habit: Habit): HabitSummary {
  const count = habit.completions.length;
  return { id: habit.id, completions: count, lastDone: count === 0 ? null : habit.completions[count - 1] };
}

export function addCompletion(habit: Habit, date: string): Habit {
  if (habit.completions.includes(date)) return habit;
  return { ...habit, completions: [...habit.completions, date].sort() };
}
