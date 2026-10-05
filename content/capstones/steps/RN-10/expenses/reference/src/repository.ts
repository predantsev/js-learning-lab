// The stored expense list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through expensesReducer and is saved before the answer comes back.
// A read also says whether a damaged snapshot was set aside, so the list screen can say so.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Expense } from "../domain/expenses.ts";
import { expensesReducer } from "../ui/expensesReducer.ts";
import type { ExpensesAction } from "../ui/expensesReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type ReadResult = { records: Expense[]; recovered: boolean };

export type ExpensesRepository = {
  readAll(): Promise<ReadResult>;
  restore(records: Expense[]): Promise<Expense[]>;
  apply(action: ExpensesAction): Promise<Expense[]>;
};

// Without a saved list the starting expenses are the list. After a damaged snapshot was set aside the
// starting list is saved at once, so the next read is clean and the notice comes only once.
export function createRepository(storage: StorageAdapter, startingItems: Expense[]): ExpensesRepository {
  async function readAll(): Promise<ReadResult> {
    const loaded = await loadSnapshot(storage);
    if (loaded.status === "restored") {
      return { records: loaded.records, recovered: false };
    }
    if (loaded.status === "recovered") {
      await saveSnapshot(storage, startingItems);
      return { records: [...startingItems], recovered: true };
    }
    return { records: [...startingItems], recovered: false };
  }
  return {
    readAll: readAll,
    // Undo: the list as it was before the last swipe is saved again.
    async restore(records) {
      await saveSnapshot(storage, records);
      return records;
    },
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = (await readAll()).records;
      const next = expensesReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
