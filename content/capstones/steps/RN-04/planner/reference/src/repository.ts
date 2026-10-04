// The stored task list as the one source every screen reads: a screen asks for the list when it gets
// the focus, and every change goes through tasksReducer and is saved before the answer comes back.
// No React Native here, so Node.js tests it (tests/repository.test.js) with the memory storage.
import type { Task } from "../domain/tasks.ts";
import { tasksReducer } from "../ui/tasksReducer.ts";
import type { TasksAction } from "../ui/tasksReducer.ts";
import type { StorageAdapter } from "./contracts.ts";
import { loadSnapshot, saveSnapshot } from "./snapshot.ts";

export type TasksRepository = {
  readAll(): Promise<Task[]>;
  apply(action: TasksAction): Promise<Task[]>;
};

// Without a usable saved list the starting tasks are the list.
export function createRepository(storage: StorageAdapter, startingItems: Task[]): TasksRepository {
  async function readAll(): Promise<Task[]> {
    return (await loadSnapshot(storage)) ?? [...startingItems];
  }
  return {
    readAll: readAll,
    // A refused action (the reducer returns the same list) saves nothing.
    async apply(action) {
      const list = await readAll();
      const next = tasksReducer(list, action);
      if (next !== list) {
        await saveSnapshot(storage, next);
      }
      return next;
    },
  };
}
