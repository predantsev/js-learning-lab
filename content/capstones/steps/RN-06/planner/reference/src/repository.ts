// The stored task list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through tasksReducer and is saved before the answer comes back.
// A read also says whether a damaged snapshot was set aside, so the list screen can say so.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Task } from "../domain/tasks.ts";
import { tasksReducer } from "../ui/tasksReducer.ts";
import type { TasksAction } from "../ui/tasksReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type ReadResult = { records: Task[]; recovered: boolean };

export type TasksRepository = {
  readAll(): Promise<ReadResult>;
  apply(action: TasksAction): Promise<Task[]>;
};

// Without a saved list the starting tasks are the list. After a damaged snapshot was set aside the
// starting list is saved at once, so the next read is clean and the notice comes only once.
export function createRepository(storage: StorageAdapter, startingItems: Task[]): TasksRepository {
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
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = (await readAll()).records;
      const next = tasksReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
