// The saved form of the task list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written through any StorageAdapter.
import type { Task } from "../domain/tasks.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.planner.v1";

export function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}
