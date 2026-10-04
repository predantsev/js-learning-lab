// The stored habit list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through habitsReducer and is saved before the answer comes back.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Habit } from "../domain/habits.ts";
import { habitsReducer } from "../ui/habitsReducer.ts";
import type { HabitsAction } from "../ui/habitsReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type HabitsRepository = {
  readAll(): Promise<Habit[]>;
  apply(action: HabitsAction): Promise<Habit[]>;
};

// Without a usable saved list the starting habits are the list.
export function createRepository(storage: StorageAdapter, startingItems: Habit[]): HabitsRepository {
  async function readAll(): Promise<Habit[]> {
    return (await loadSnapshot(storage)) ?? [...startingItems];
  }
  return {
    readAll: readAll,
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = await readAll();
      const next = habitsReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
