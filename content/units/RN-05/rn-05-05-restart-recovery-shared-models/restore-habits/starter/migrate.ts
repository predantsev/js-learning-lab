// migrate.ts (read-only): the habit migration chain. v0 snapshots had no `frequency`.
export const CURRENT_VERSION = 1;

type Snapshot = { schemaVersion: number; records: unknown[] };
export type Migration =
  | { ok: true; snapshot: Snapshot }
  | { ok: false; reason: 'newer' | 'invalid' };

const steps: Record<number, (records: unknown[]) => unknown[]> = {
  0: (records) =>
    records.map((habit) =>
      typeof habit === 'object' && habit !== null ? { frequency: 'daily', ...habit } : habit,
    ),
};

export function migrate(snapshot: unknown): Migration {
  const candidate = snapshot as Partial<Snapshot> | null;
  if (typeof candidate?.schemaVersion !== 'number' || !Array.isArray(candidate.records)) {
    return { ok: false, reason: 'invalid' };
  }
  if (candidate.schemaVersion > CURRENT_VERSION) return { ok: false, reason: 'newer' };
  let { schemaVersion, records } = candidate as Snapshot;
  while (schemaVersion < CURRENT_VERSION) {
    records = steps[schemaVersion](records);
    schemaVersion += 1;
  }
  return { ok: true, snapshot: { schemaVersion, records } };
}
