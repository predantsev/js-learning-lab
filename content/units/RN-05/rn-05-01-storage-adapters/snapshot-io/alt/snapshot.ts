import type { SaveResult, Snapshot, StorageAdapter, Task } from './contracts.ts';

export const KEY = 'jsll.planner.v1';
export const MAX_SNAPSHOT_LENGTH = 2000; // characters of JSON text (kept small for the exercise)

// The same contract written with .then instead of await.
export function loadSnapshot(storage: StorageAdapter): Promise<Snapshot | null> {
  return storage.getItem(KEY).then((text) => (text === null ? null : JSON.parse(text)));
}

export function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<SaveResult> {
  const snapshot: Snapshot = { schemaVersion: 1, records };
  const text = JSON.stringify(snapshot);
  if (text.length <= MAX_SNAPSHOT_LENGTH) {
    return storage.setItem(KEY, text).then(() => ({ ok: true, length: text.length }) as const);
  }
  return Promise.resolve({ ok: false, reason: 'too-large', length: text.length } as const);
}
