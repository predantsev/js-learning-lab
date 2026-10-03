// adapters.ts: a variant with classes, a private object and toLocaleString.
import type { Book, ClockAdapter, ProgressFormat, ReadingRepository, StorageAdapter } from './contracts.ts';
import { markFinished, validateBook } from './readingList.js';

class MemoryStorage implements StorageAdapter {
  #values: Record<string, string> = {};
  async getItem(key: string) {
    return Object.hasOwn(this.#values, key) ? this.#values[key] : null;
  }
  async setItem(key: string, value: string) {
    this.#values[key] = value;
  }
  async removeItem(key: string) {
    delete this.#values[key];
  }
}

export const createMemoryStorage = (): StorageAdapter => new MemoryStorage();

export const createProgressFormat = (locale: string): ProgressFormat => ({
  progress: (pagesRead, pagesTotal) => (pagesRead / pagesTotal).toLocaleString(locale, { style: 'percent' }),
});

export const createFixedClock = (date: string): ClockAdapter => ({ today: () => date });

class StoredReadingList implements ReadingRepository {
  static KEY = 'jsll.reading.v1';
  #storage: StorageAdapter;
  #clock: ClockAdapter;
  constructor(storage: StorageAdapter, clock: ClockAdapter) {
    this.#storage = storage;
    this.#clock = clock;
  }
  async load(): Promise<Book[]> {
    const text = await this.#storage.getItem(StoredReadingList.KEY);
    if (text === null) return [];
    const envelope = JSON.parse(text);
    return envelope.records;
  }
  async #save(records: Book[]) {
    await this.#storage.setItem(StoredReadingList.KEY, JSON.stringify({ schemaVersion: 1, records }));
  }
  async add(input: { id: string; title: string; pagesTotal: number }) {
    const result = validateBook(input);
    if (!result.ok) return { ok: false as const, errors: result.errors };
    const books = await this.load();
    books.push(result.value);
    await this.#save(books);
    return { ok: true as const };
  }
  async finish(id: string) {
    const books = await this.load();
    const today = this.#clock.today();
    await this.#save(books.map((book) => (book.id === id ? markFinished(book, today) : book)));
  }
}

export function createReadingRepository({ storage, clock }: { storage: StorageAdapter; clock: ClockAdapter }): ReadingRepository {
  return new StoredReadingList(storage, clock);
}
