import type { Task } from './types.ts';

export interface RecordsSource<T> {
  list(signal?: AbortSignal): Promise<T[]>;
}

// Wrong on purpose: the records come back at once, not as a promise. `await` hides it here,
// but a source that talks to the network can only answer later.
export function createFixtureSource(records: Task[]): RecordsSource<Task> {
  return {
    list() {
      return records.slice() as unknown as Promise<Task[]>;
    },
  };
}
