import type { Habit, HabitSummary } from "../types.ts";

// summarizeHabits(habits, today): a HabitSummary of the habits it receives — how many there are,
// how many have `today` among their completions, and how many completions they have in total.
// Pure: no page and no `view`.
export function summarizeHabits(habits: readonly Habit[], today: string): HabitSummary {
  let doneToday = 0;
  let completions = 0;
  for (const habit of habits) {
    if (habit.completions.includes(today)) doneToday = doneToday + 1;
    completions = completions + habit.completions.length;
  }
  return { count: habits.length, doneToday, completions };
}
