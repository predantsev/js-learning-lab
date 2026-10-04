// The stored wish list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through itemsReducer and is saved before the answer comes back.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Wish } from "../domain/wishes.ts";
import { itemsReducer } from "../ui/itemsReducer.ts";
import type { ItemsAction } from "../ui/itemsReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type ItemsRepository = {
  readAll(): Promise<Wish[]>;
  apply(action: ItemsAction): Promise<Wish[]>;
};

// Without a usable saved list the starting wishes are the list.
export function createRepository(storage: StorageAdapter, startingItems: Wish[]): ItemsRepository {
  async function readAll(): Promise<Wish[]> {
    return (await loadSnapshot(storage)) ?? [...startingItems];
  }
  return {
    readAll: readAll,
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = await readAll();
      const next = itemsReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
