import type { Habit, HabitErrors } from './models/habit.ts';
import { validateHabit } from './models/habit.ts';
import { migrate } from './migrate.ts';

export type RestoreResult =
  | { ok: true; records: Habit[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: HabitErrors };

// raw: the text from storage.getItem — or null when nothing was saved yet.
export function restoreSnapshot(raw: string | null): RestoreResult {
  // TODO: parse → migrate → validate every record with validateHabit
  return { ok: true, records: [] };
}
