// Wrong: the methods return plain values, not promises.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

export function createMemoryStorage(): StorageAdapter {
  const values = new Map<string, string>();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key)! : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
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
