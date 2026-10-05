import type { SaveResult, Snapshot, StorageAdapter, Task } from './contracts.ts';

export const KEY = 'jsll.planner.v1';
export const MAX_SNAPSHOT_LENGTH = 2000; // characters of JSON text (kept small for the exercise)

// Mistake: reads the store as if it were localStorage (no await).
export async function loadSnapshot(storage: StorageAdapter): Promise<Snapshot | null> {
  const text = storage.getItem(KEY) as unknown as string | null;
  if (text === null) return null;
  return JSON.parse(text);
}

export async function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<SaveResult> {
  const text = JSON.stringify({ schemaVersion: 1, records });
  if (text.length > MAX_SNAPSHOT_LENGTH) {
    return { ok: false, reason: 'too-large', length: text.length };
  }
  storage.setItem(KEY, text);
  return { ok: true, length: text.length };
}
