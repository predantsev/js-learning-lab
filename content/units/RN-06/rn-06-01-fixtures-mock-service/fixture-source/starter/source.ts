import type { Task } from './types.ts';

// TODO 1: complete the interface every data source follows: a method list that takes an
// optional AbortSignal and returns a promise of an array of T.
export interface RecordsSource<T> {
}

// TODO 2: return a RecordsSource whose list() resolves with the records — as a new array on every call.
export function createFixtureSource(records: Task[]): RecordsSource<Task> {
  return {
    list() {
      return Promise.resolve([]);
    },
  };
}
