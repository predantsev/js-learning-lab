import type { Habit, HabitErrors } from './models/habit.ts';
import { validateHabit } from './models/habit.ts';
import { migrate } from './migrate.ts';

export type RestoreResult =
  | { ok: true; records: Habit[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: HabitErrors };

// Mistake: lets JSON.parse throw on damaged text.
// raw: the text from storage.getItem — or null when nothing was saved yet.
export function restoreSnapshot(raw: string | null): RestoreResult {
  if (raw === null) return { ok: true, records: [] };

  const parsed: unknown = JSON.parse(raw);

  const migrated = migrate(parsed);
  if (!migrated.ok) return { ok: false, reason: migrated.reason };

  const records: Habit[] = [];
  for (const [index, item] of migrated.snapshot.records.entries()) {
    const result = validateHabit(item);
    if (!result.ok) return { ok: false, reason: 'invalid-record', index, errors: result.errors };
    records.push(result.value);
  }
  return { ok: true, records };
}
