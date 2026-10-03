import type { Habit } from "./types";
import { saveHabits } from "../storage/habitStorage";

// Marks `date` as done for one habit and returns the new list.
export function completeHabit(habits: Habit[], id: string, date: string): Habit[] {
  const next = habits.map((habit) => {
    if (habit.id !== id || habit.completions.includes(date)) return habit;
    return { ...habit, completions: [...habit.completions, date].sort() };
  });
  saveHabits(next); // a side effect inside the domain
  return next;
}
