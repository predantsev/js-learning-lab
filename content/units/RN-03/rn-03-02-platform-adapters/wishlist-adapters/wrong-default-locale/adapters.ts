// Wrong: the locale parameter is ignored, so the format follows the browser language.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

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

export function createPriceFormat(locale: string, noPriceLabel: string): PriceFormat {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'UAH', maximumFractionDigits: 0 });
  return {
    price(price) {
      return price === null ? noPriceLabel : formatter.format(price);
    },
  };
}
