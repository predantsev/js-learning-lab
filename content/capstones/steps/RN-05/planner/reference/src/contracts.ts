// What the screens need from the platform, as types only. The screens receive these objects from
// App.tsx and never ask which platform made them, so a test or another platform can pass its own.

// Text by key, asynchronously: the device storage has these three methods, and so does the memory
// stand-in of src/adapters.ts.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// A due date for the screen: a long date in the project's language, or the no-due-date label.
export interface DateFormat {
  day(day: string | null): string;
}

// Today as a calendar date "YYYY-MM-DD". The rules never read the clock themselves: the day is
// passed in, so a test can fix it.
export interface ClockAdapter {
  today(): string;
}
