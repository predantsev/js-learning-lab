import type { SaveResult, Snapshot, StorageAdapter, Task } from './contracts.ts';

export const KEY = 'jsll.planner.v1';
export const MAX_SNAPSHOT_LENGTH = 2000; // characters of JSON text (kept small for the exercise)

export async function loadSnapshot(storage: StorageAdapter): Promise<Snapshot | null> {
  const text = await storage.getItem(KEY);
  if (text === null) return null;
  return JSON.parse(text);
}

// Mistake: writes first and only then reports that the text was too long.
export async function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<SaveResult> {
  const text = JSON.stringify({ schemaVersion: 1, records });
  await storage.setItem(KEY, text);
  if (text.length > MAX_SNAPSHOT_LENGTH) {
    return { ok: false, reason: 'too-large', length: text.length };
  }
  return { ok: true, length: text.length };
}
