import type { Habit, HabitSummary } from "../types.ts";

export function summarizeHabits(habits: readonly Habit[], today: string): HabitSummary {
  return {
    count: habits.length,
    doneToday: habits.filter((habit) => habit.completions.includes(today)).length,
    completions: habits.reduce((sum, habit) => sum + habit.completions.length, 0),
  };
}
