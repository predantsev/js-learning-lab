import type { Habit, HabitErrors } from './models/habit.ts';
import { validateHabit } from './models/habit.ts';
import { migrate } from './migrate.ts';

export type RestoreResult =
  | { ok: true; records: Habit[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: HabitErrors };

function parse(raw: string): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

// Another approach: validate all records first, then look for the first failure.
export function restoreSnapshot(raw: string | null): RestoreResult {
  if (raw === null) return { ok: true, records: [] };
  const parsed = parse(raw);
  if (!parsed.ok) return { ok: false, reason: 'unparsable' };
  const migrated = migrate(parsed.value);
  if (!migrated.ok) return migrated;
  const results = migrated.snapshot.records.map(validateHabit);
  const index = results.findIndex((result) => !result.ok);
  if (index !== -1) {
    const failed = results[index];
    return { ok: false, reason: 'invalid-record', index, errors: failed.ok ? {} : failed.errors };
  }
  return { ok: true, records: results.map((result) => (result.ok ? result.value : null)) as Habit[] };
}
