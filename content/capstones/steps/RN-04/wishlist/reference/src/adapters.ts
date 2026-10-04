// The platform adapters of this step. Neither imports React Native, so Node.js tests them
// (tests/adapters.test.js); the screens see only the types of src/contracts.ts.
import type { PriceFormat, StorageAdapter } from "./contracts.ts";

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

// Prices as money text of the locale, in whole hryvnias, for example "1 250 ₴" (uk-UA); a wish
// without a price gets the label instead. The stored price stays a number or null.
export function createPriceFormat(locale: string, noPriceLabel: string): PriceFormat {
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "UAH", maximumFractionDigits: 0 });
  return {
    price(price) {
      return price === null ? noPriceLabel : money.format(price);
    },
  };
}
