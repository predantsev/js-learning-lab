// The saved form of the habit list on the device: { schemaVersion, records } under the same key as in the
// React project, written and read through any StorageAdapter. Reading is a chain — the text, JSON.parse,
// the migration to the current version, the shared contract parseHabitList — and a snapshot that fails any
// link is set aside under BACKUP_KEY before the starting list replaces it, so nothing is lost silently.
// No React Native here: Node.js tests every link (tests/snapshot.test.js).
import { parseHabitList } from "../data/model.ts";
import { uniqueSortedDays } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.habits.v1";
export const BACKUP_KEY = "jsll.habits.v1.backup";
export const CURRENT_VERSION = 1;

export type MigrateResult = { ok: true; records: unknown[] } | { ok: false; reason: "newer" | "invalid" };
export type RestoreResult = { ok: true; records: Habit[]; migrated: boolean } | { ok: false; reason: "unparsable" | "newer" | "invalid" | "invalid-record" };
export type LoadResult = { status: "missing" } | { status: "restored"; records: Habit[] } | { status: "recovered"; reason: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// One step per old version: steps[n] turns the records of version n into those of version n + 1.
// Version 0 is the supplied legacy snapshot (data/legacy-v0.json): the completions could repeat a day and were not sorted.
const steps: Record<number, (records: unknown[]) => unknown[]> = {
  // v0 → v1: the completions could repeat a day and were not sorted; the shared uniqueSortedDays keeps
  // every day once, in ascending order.
  0: (records) =>
    records.map((record) => {
      if (!isObject(record) || !Array.isArray(record.completions)) {
        return record;
      }
      return { ...record, completions: uniqueSortedDays(record.completions) };
    }),
};

// Brings a parsed snapshot to CURRENT_VERSION step by step, never changing what it received. A version
// above the current one is "newer" (an older app must not overwrite it); a shape it does not know is
// "invalid".
export function migrate(snapshot: unknown): MigrateResult {
  if (!isObject(snapshot) || typeof snapshot.schemaVersion !== "number" || !Number.isInteger(snapshot.schemaVersion) || !Array.isArray(snapshot.records)) {
    return { ok: false, reason: "invalid" };
  }
  let version = snapshot.schemaVersion;
  if (version > CURRENT_VERSION) {
    return { ok: false, reason: "newer" };
  }
  let records: unknown[] = snapshot.records;
  while (version < CURRENT_VERSION) {
    const step = steps[version];
    if (step === undefined) {
      return { ok: false, reason: "invalid" };
    }
    records = step(records);
    version += 1;
  }
  return { ok: true, records: records };
}

// The whole chain for one saved text.
export function restoreSnapshot(text: string): RestoreResult {
  let saved: unknown;
  try {
    saved = JSON.parse(text);
  } catch {
    return { ok: false, reason: "unparsable" };
  }
  const migrated = migrate(saved);
  if (!migrated.ok) {
    return { ok: false, reason: migrated.reason };
  }
  const parsed = parseHabitList(migrated.records);
  if (!parsed.ok) {
    return { ok: false, reason: "invalid-record" };
  }
  return { ok: true, records: parsed.value, migrated: isObject(saved) && saved.schemaVersion !== CURRENT_VERSION };
}

export function saveSnapshot(storage: StorageAdapter, records: Habit[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: CURRENT_VERSION, records: records }));
}

// Reads the saved habits. A migrated snapshot is saved again at once in the current version. A
// snapshot that cannot be restored is copied under BACKUP_KEY first, and only then does the caller save
// the starting list over it.
export async function loadSnapshot(storage: StorageAdapter): Promise<LoadResult> {
  const text = await storage.getItem(KEY);
  if (text === null) {
    return { status: "missing" };
  }
  const restored = restoreSnapshot(text);
  if (!restored.ok) {
    await storage.setItem(BACKUP_KEY, text);
    return { status: "recovered", reason: restored.reason };
  }
  if (restored.migrated) {
    await saveSnapshot(storage, restored.records);
  }
  return { status: "restored", records: restored.records };
}
