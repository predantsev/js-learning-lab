import type { Habit, HabitErrors } from './models/habit.ts';
import { validateHabit } from './models/habit.ts';
import { migrate } from './migrate.ts';

export type RestoreResult =
  | { ok: true; records: Habit[] }
  | { ok: false; reason: 'unparsable' | 'newer' | 'invalid' }
  | { ok: false; reason: 'invalid-record'; index: number; errors: HabitErrors };

// Mistake: validates the parsed snapshot without migrating, so only version 1 is accepted.
// raw: the text from storage.getItem — or null when nothing was saved yet.
export function restoreSnapshot(raw: string | null): RestoreResult {
  if (raw === null) return { ok: true, records: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'unparsable' };
  }

  const snapshot = parsed as { schemaVersion: number; records: unknown[] };
  if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.records)) return { ok: false, reason: 'invalid' };
  const migrated = { snapshot };

  const records: Habit[] = [];
  for (const [index, item] of migrated.snapshot.records.entries()) {
    const result = validateHabit(item);
    if (!result.ok) return { ok: false, reason: 'invalid-record', index, errors: result.errors };
    records.push(result.value);
  }
  return { ok: true, records };
}
