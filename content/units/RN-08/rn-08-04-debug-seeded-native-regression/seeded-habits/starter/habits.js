// habits.js (read-only): pure domain functions of the habit tracker.
export const TODAY = '2026-03-02';
export const WEEK = ['2026-02-24', '2026-02-25', '2026-02-26', '2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02'];

// Share of (habit, day) pairs in `days` that are completed, as a whole percent. No habits → 0.
export function weeklyRate(habits, days) {
  if (habits.length === 0) return 0;
  const done = habits.reduce((sum, habit) => sum + habit.completions.filter((day) => days.includes(day)).length, 0);
  return Math.round((done / (habits.length * days.length)) * 100);
}

// Marks or unmarks `day`; completions stay unique and sorted.
export function toggleDay(habit, day) {
  const completions = habit.completions.includes(day)
    ? habit.completions.filter((d) => d !== day)
    : [...habit.completions, day].sort();
  return { ...habit, completions };
}
