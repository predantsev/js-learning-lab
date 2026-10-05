// The stored habit list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through habitsReducer and is saved before the answer comes back.
// A read also says whether a damaged snapshot was set aside, so the list screen can say so.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Habit } from "../domain/habits.ts";
import { habitsReducer } from "../ui/habitsReducer.ts";
import type { HabitsAction } from "../ui/habitsReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type ReadResult = { records: Habit[]; recovered: boolean };

export type HabitsRepository = {
  readAll(): Promise<ReadResult>;
  restore(records: Habit[]): Promise<Habit[]>;
  apply(action: HabitsAction): Promise<Habit[]>;
};

// Without a saved list the starting habits are the list. After a damaged snapshot was set aside the
// starting list is saved at once, so the next read is clean and the notice comes only once.
export function createRepository(storage: StorageAdapter, startingItems: Habit[]): HabitsRepository {
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
      const next = habitsReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
