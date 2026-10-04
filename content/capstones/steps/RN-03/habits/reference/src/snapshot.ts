// The saved form of the habit list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written through any StorageAdapter.
import type { Habit } from "../domain/habits.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.habits.v1";

export function saveSnapshot(storage: StorageAdapter, records: Habit[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}
