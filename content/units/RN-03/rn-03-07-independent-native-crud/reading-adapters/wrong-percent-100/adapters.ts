// Wrong: the percent style gets 25 instead of 0.25.
import type { Book, ClockAdapter, ProgressFormat, ReadingRepository, StorageAdapter } from './contracts.ts';
import { markFinished, validateBook } from './readingList.js';

const KEY = 'jsll.reading.v1';

export function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    async getItem(key) {
      return values.has(key) ? values.get(key)! : null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
    async removeItem(key) {
      values.delete(key);
    },
  };
}

export function createProgressFormat(locale: string): ProgressFormat {
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  return {
    progress(pagesRead, pagesTotal) {
      return percent.format((pagesRead / pagesTotal) * 100);
    },
  };
}

export function createFixedClock(date: string): ClockAdapter {
  return {
    today() {
      return date;
    },
  };
}

export function createReadingRepository({ storage, clock }: { storage: StorageAdapter; clock: ClockAdapter }): ReadingRepository {
  async function load(): Promise<Book[]> {
    const text = await storage.getItem(KEY);
    return text === null ? [] : JSON.parse(text).records;
  }
  async function save(records: Book[]) {
    await storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records }));
  }
  return {
    load,
    async add(input) {
      const result = validateBook(input);
      if (!result.ok) return result;
      await save([...(await load()), result.value]);
      return { ok: true };
    },
    async finish(id) {
      const books = await load();
      await save(books.map((book) => (book.id === id ? markFinished(book, clock.today()) : book)));
    },
  };
}
