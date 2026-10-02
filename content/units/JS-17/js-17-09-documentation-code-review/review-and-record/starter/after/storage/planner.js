export const STORAGE_KEY = "jsll.planner.v1";

export function saveTasks(storage, tasks) {
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records: tasks }));
}
