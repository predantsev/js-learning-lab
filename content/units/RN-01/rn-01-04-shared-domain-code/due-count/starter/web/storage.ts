import type { Task } from '../domain/types.ts';

const STORAGE_KEY = 'jsll.planner.v1';

// The web client's storage adapter: the only place that knows about localStorage.
export function loadTasks(): Task[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw === null ? [] : JSON.parse(raw).records;
}

// Fills the store with the sample tasks the first time the program runs.
export function seedTasks(tasks: Task[]): void {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, records: tasks }));
  }
}
