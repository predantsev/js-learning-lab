// Wrong: a missing key gives undefined instead of null.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

export function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    async getItem(key) {
      return values.get(key);
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
