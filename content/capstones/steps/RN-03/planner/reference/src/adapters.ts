// The platform adapters of this step. Neither imports React Native, so Node.js tests them
// (tests/adapters.test.js); the screens see only the types of src/contracts.ts.
import type { DateFormat, StorageAdapter } from "./contracts.ts";

// A storage that keeps the text in memory: everything is gone when the app stops. The device storage
// replaces it in the persistence step; the screens do not change then.
export function createMemoryStorage(): StorageAdapter {
  const data = new Map<string, string>();
  return {
    async getItem(key) {
      return data.get(key) ?? null;
    },
    async setItem(key, value) {
      data.set(key, value);
    },
    async removeItem(key) {
      data.delete(key);
    },
  };
}

// Due dates as long dates of the locale, for example "2 березня 2026 р." (uk-UA); a task without a due
// date gets the label instead. new Date("YYYY-MM-DD") is midnight in UTC, so the formatter uses UTC
// too: every device shows the same day, whatever its time zone. The stored date stays "YYYY-MM-DD".
export function createDateFormat(locale: string, noDueDateLabel: string): DateFormat {
  const long = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });
  return {
    day(day) {
      return day === null ? noDueDateLabel : long.format(new Date(day));
    },
  };
}
