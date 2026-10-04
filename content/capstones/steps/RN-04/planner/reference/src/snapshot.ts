// The saved form of the task list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written and read through any StorageAdapter.
import { parseTaskList } from "../data/model.ts";
import type { Task } from "../domain/tasks.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.planner.v1";

export function saveSnapshot(storage: StorageAdapter, records: Task[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}

// The saved tasks, checked by the shared contract parseTaskList; null when nothing usable is saved.
export async function loadSnapshot(storage: StorageAdapter): Promise<Task[] | null> {
  const text = await storage.getItem(KEY);
  if (text === null) {
    return null;
  }
  try {
    const saved = JSON.parse(text);
    if (saved?.schemaVersion !== 1) {
      return null;
    }
    const parsed = parseTaskList(saved.records);
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
