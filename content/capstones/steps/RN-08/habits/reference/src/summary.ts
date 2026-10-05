// The CP-RN enhancement of the habit tracker: a seven-day grid per habit built from its completions,
// ending on the given day, and the weekly rate from the shared summarizeHabit. Pure: Node.js and Jest
// test it; the screen only shows it. The day is passed in (from the clock adapter), never read here.
import { summarizeHabit } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import { previousDay } from "../ui/streak.ts";

export type WeekRow = { cells: { day: string; done: boolean }[]; rate: number };

// The `count` calendar days that end on `today`, the oldest first.
export function lastDays(today: string, count: number): string[] {
  const days = [today];
  while (days.length < count) {
    days.unshift(previousDay(days[0]));
  }
  return days;
}

export function weekRow(habit: Habit, today: string): WeekRow {
  const days = lastDays(today, 7);
  const done = new Set(habit.completions);
  return { cells: days.map((day) => ({ day: day, done: done.has(day) })), rate: summarizeHabit(habit, days).rate };
}
