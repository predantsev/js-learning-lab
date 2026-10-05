import type { SaveResult, Snapshot, StorageAdapter, Task } from './contracts.ts';

export const KEY = 'jsll.planner.v1';
export const MAX_SNAPSHOT_LENGTH = 2000; // characters of JSON text (kept small for the exercise)

// Reads the planner snapshot: the parsed object, or null when nothing is stored yet.
export async function loadSnapshot(storage: StorageAdapter): Promise<Snapshot | null> {
  // TODO
  return null;
}

// Saves { schemaVersion: 1, records } as JSON text under KEY.
// Text longer than MAX_SNAPSHOT_LENGTH is refused, and then nothing is written.
export async function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<SaveResult> {
  // TODO
  return { ok: false, reason: 'too-large', length: 0 };
}
