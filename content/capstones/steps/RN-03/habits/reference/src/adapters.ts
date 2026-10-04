// The platform adapters of this step. None imports React Native, so Node.js tests them
// (tests/adapters.test.js); the screens see only the types of src/contracts.ts.
import type { ClockAdapter, StorageAdapter } from "./contracts.ts";

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

// The device's clock: today's date in the device's own time zone, as "YYYY-MM-DD".
export function createSystemClock(): ClockAdapter {
  return {
    today() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      return now.getFullYear() + "-" + month + "-" + day;
    },
  };
}

// A clock that always says the same day: for tests, and to try the screen on a chosen day.
export function createFixedClock(day: string): ClockAdapter {
  return {
    today() {
      return day;
    },
  };
}
