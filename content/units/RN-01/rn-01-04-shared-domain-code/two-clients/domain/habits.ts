import type { Habit, HabitSummary, Validation } from './types.ts';

// Pure: the same habit and day always give the same summary, on any platform.
export function summarizeHabit(habit: Habit, day: string): HabitSummary {
  return {
    name: habit.name,
    completionCount: habit.completions.length,
    doneOnDay: habit.completions.includes(day),
  };
}

// Returns a message key per field; each client turns the key into its own localized text.
export function validateHabit(input: { name: string; frequency: string }): Validation {
  const name = input.name.trim();
  const errors: Record<string, string> = {};
  if (name.length === 0 || name.length > 80) errors.name = 'name.length';
  if (input.frequency !== 'daily' && input.frequency !== 'weekly') errors.frequency = 'frequency.unknown';
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, frequency: input.frequency as Habit['frequency'] } };
}
