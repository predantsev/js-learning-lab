// The platform adapters of this step. Neither imports React Native, so Node.js tests them
// (tests/adapters.test.js); the screens see only the types of src/contracts.ts.
import type { MoneyFormat, StorageAdapter } from "./contracts.ts";

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

// Amounts as money text of the locale, for example "845,50 ₴" (uk-UA). The division by 100 happens
// only here, for the display: amounts are stored and summed as whole kopiykas.
export function createMoneyFormat(locale: string): MoneyFormat {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH" });
  return {
    money(amountMinor) {
      return money.format(amountMinor / 100);
    },
  };
}
