// The stored expense list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through expensesReducer and is saved before the answer comes back.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Expense } from "../domain/expenses.ts";
import { expensesReducer } from "../ui/expensesReducer.ts";
import type { ExpensesAction } from "../ui/expensesReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type ExpensesRepository = {
  readAll(): Promise<Expense[]>;
  apply(action: ExpensesAction): Promise<Expense[]>;
};

// Without a usable saved list the starting expenses are the list.
export function createRepository(storage: StorageAdapter, startingItems: Expense[]): ExpensesRepository {
  async function readAll(): Promise<Expense[]> {
    return (await loadSnapshot(storage)) ?? [...startingItems];
  }
  return {
    readAll: readAll,
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = await readAll();
      const next = expensesReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
