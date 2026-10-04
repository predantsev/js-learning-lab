// The saved form of the habit list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written and read through any StorageAdapter.
import { parseHabitList } from "../data/model.ts";
import type { Habit } from "../domain/habits.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.habits.v1";

export function saveSnapshot(storage: StorageAdapter, records: Habit[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}

// The saved habits, checked by the shared contract parseHabitList; null when nothing usable is saved.
export async function loadSnapshot(storage: StorageAdapter): Promise<Habit[] | null> {
  const text = await storage.getItem(KEY);
  if (text === null) {
    return null;
  }
  try {
    const saved = JSON.parse(text);
    if (saved?.schemaVersion !== 1) {
      return null;
    }
    const parsed = parseHabitList(saved.records);
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
