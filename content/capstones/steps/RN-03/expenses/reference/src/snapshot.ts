// The saved form of the expense list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written through any StorageAdapter.
import type { Expense } from "../domain/expenses.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.expenses.v1";

export function saveSnapshot(storage: StorageAdapter, records: Expense[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}
