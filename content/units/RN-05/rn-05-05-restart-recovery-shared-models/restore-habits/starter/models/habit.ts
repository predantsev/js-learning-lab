// models/habit.ts: the ONE shared habit model (read-only). The web client, the native app and
// the test fixtures all import this file, so a renamed field breaks `tsc` in all of them at once.
export type Frequency = 'daily' | 'weekly';

export type Habit = {
  id: string;
  name: string;
  frequency: Frequency;
  active: boolean;
  completions: string[]; // 'YYYY-MM-DD'
};

export type HabitErrors = Partial<Record<keyof Habit, string>>;

export type Validation = { ok: true; value: Habit } | { ok: false; errors: HabitErrors };

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Turns unknown data into a Habit, or says which fields are wrong (message keys, not UI text).
export function validateHabit(input: unknown): Validation {
  if (typeof input !== 'object' || input === null) return { ok: false, errors: { id: 'required' } };
  const raw = input as Record<string, unknown>;
  const errors: HabitErrors = {};
  if (typeof raw.id !== 'string' || raw.id === '') errors.id = 'required';
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (name === '') errors.name = 'required';
  else if (name.length > 80) errors.name = 'tooLong';
  if (raw.frequency !== 'daily' && raw.frequency !== 'weekly') errors.frequency = 'invalid';
  if (typeof raw.active !== 'boolean') errors.active = 'invalid';
  const completions = raw.completions;
  if (!Array.isArray(completions) || !completions.every((day) => typeof day === 'string' && DATE.test(day))) {
    errors.completions = 'invalid';
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      id: raw.id as string,
      name,
      frequency: raw.frequency as Frequency,
      active: raw.active as boolean,
      completions: [...(completions as string[])],
    },
  };
}
