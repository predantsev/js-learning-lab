// The saved form of the expense list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written and read through any StorageAdapter.
import { parseExpenseList } from "../data/model.ts";
import type { Expense } from "../domain/expenses.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.expenses.v1";

export function saveSnapshot(storage: StorageAdapter, records: Expense[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}

// The saved expenses, checked by the shared contract parseExpenseList; null when nothing usable is saved.
export async function loadSnapshot(storage: StorageAdapter): Promise<Expense[] | null> {
  const text = await storage.getItem(KEY);
  if (text === null) {
    return null;
  }
  try {
    const saved = JSON.parse(text);
    if (saved?.schemaVersion !== 1) {
      return null;
    }
    const parsed = parseExpenseList(saved.records);
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
