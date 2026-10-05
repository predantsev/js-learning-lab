// Wrong: one Map for the whole module, so every storage shares the same values.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

const values = new Map<string, string>();

export function createMemoryStorage(): StorageAdapter {
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

export function createPriceFormat(locale: string, noPriceLabel: string): PriceFormat {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 });
  return {
    price(price) {
      return price === null ? noPriceLabel : formatter.format(price);
    },
  };
}
