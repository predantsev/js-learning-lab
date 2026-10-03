import type { SaveResult, Snapshot, StorageAdapter, Task } from './contracts.ts';

export const KEY = 'jsll.planner.v1';
export const MAX_SNAPSHOT_LENGTH = 2000; // characters of JSON text (kept small for the exercise)

export async function loadSnapshot(storage: StorageAdapter): Promise<Snapshot | null> {
  const text = await storage.getItem(KEY);
  if (text === null) return null;
  return JSON.parse(text);
}

// Mistake: hands the object itself to the store instead of JSON text.
export async function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<SaveResult> {
  const snapshot = { schemaVersion: 1, records };
  const length = JSON.stringify(snapshot).length;
  if (length > MAX_SNAPSHOT_LENGTH) {
    return { ok: false, reason: 'too-large', length };
  }
  await storage.setItem(KEY, snapshot as unknown as string);
  return { ok: true, length };
}
