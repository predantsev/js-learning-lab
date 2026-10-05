// contracts.ts: the adapter contracts of the reading list. Do not edit.
// The sandbox removes the types and checks nothing; `tsc` in your project does the checking.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface ProgressFormat {
  progress(pagesRead: number, pagesTotal: number): string;
}

export interface ClockAdapter {
  today(): string; // 'YYYY-MM-DD'
}

export interface Book {
  id: string;
  title: string;
  pagesTotal: number;
  pagesRead: number;
  finishedOn: string | null;
}

export interface ReadingRepository {
  load(): Promise<Book[]>;
  add(input: { id: string; title: string; pagesTotal: number }): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }>;
  finish(id: string): Promise<void>;
}
