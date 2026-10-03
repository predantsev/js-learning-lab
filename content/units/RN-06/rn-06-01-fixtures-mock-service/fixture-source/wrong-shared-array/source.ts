import type { Task } from './types.ts';

export interface RecordsSource<T> {
  list(signal?: AbortSignal): Promise<T[]>;
}

// Wrong on purpose: every caller gets the bundle itself, so sorting the result reorders the bundle.
export function createFixtureSource(records: Task[]): RecordsSource<Task> {
  return {
    list() {
      return Promise.resolve(records);
    },
  };
}
