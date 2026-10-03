import type { Task } from './types.ts';

export interface RecordsSource<T> {
  list(signal?: AbortSignal): Promise<T[]>;
}

// An async method always returns a promise; the spread makes a new array each time.
export function createFixtureSource(records: Task[]): RecordsSource<Task> {
  return {
    async list() {
      return [...records];
    },
  };
}
