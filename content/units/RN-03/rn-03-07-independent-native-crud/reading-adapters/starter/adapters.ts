// adapters.ts: adapters and a repository for the reading list. Implement every export.
import type { ClockAdapter, ProgressFormat, ReadingRepository, StorageAdapter } from './contracts.ts';
import { markFinished, validateBook } from './readingList.js';

export function createMemoryStorage(): StorageAdapter {
  return {
    async getItem(key) {
      return null;
    },
    async setItem(key, value) {},
    async removeItem(key) {},
  };
}

export function createProgressFormat(locale: string): ProgressFormat {
  return {
    progress(pagesRead, pagesTotal) {
      return '';
    },
  };
}

export function createFixedClock(date: string): ClockAdapter {
  return {
    today() {
      return '';
    },
  };
}

export function createReadingRepository({ storage, clock }: { storage: StorageAdapter; clock: ClockAdapter }): ReadingRepository {
  return {
    async load() {
      return [];
    },
    async add(input) {
      return { ok: false, errors: {} };
    },
    async finish(id) {},
  };
}
