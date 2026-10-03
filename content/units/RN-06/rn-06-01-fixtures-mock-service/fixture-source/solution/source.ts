import type { Task } from './types.ts';

// Every data source follows this shape: fixtures today, the mock service soon, a real API later.
export interface RecordsSource<T> {
  list(signal?: AbortSignal): Promise<T[]>;
}

// Resolves with a new array on every call, so a caller that sorts or changes it cannot touch the bundle.
export function createFixtureSource(records: Task[]): RecordsSource<Task> {
  return {
    list() {
      return Promise.resolve(records.slice());
    },
  };
}
