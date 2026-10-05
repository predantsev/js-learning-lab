import type { Habit, HabitErrors } from './models/habit.ts';
import { validateHabit } from './models/habit.ts';
import { migrate } from './migrate.ts';

export type RestoreResult =
  | { ok: true; records: Habit[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: HabitErrors };

// Mistake: quietly drops the records that fail validation and reports success.
// raw: the text from storage.getItem — or null when nothing was saved yet.
export function restoreSnapshot(raw: string | null): RestoreResult {
  if (raw === null) return { ok: true, records: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'unparsable' };
  }

  const migrated = migrate(parsed);
  if (!migrated.ok) return { ok: false, reason: migrated.reason };

  const records: Habit[] = [];
  for (const [index, item] of migrated.snapshot.records.entries()) {
    const result = validateHabit(item);
    if (result.ok) records.push(result.value);
  }
  return { ok: true, records };
}
