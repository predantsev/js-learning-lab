// adapters.ts: a class with a private object, Promise.resolve instead of async, toLocaleString.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

class MemoryStorage implements StorageAdapter {
  #values: Record<string, string> = {};
  getItem(key: string) {
    return Promise.resolve(Object.hasOwn(this.#values, key) ? this.#values[key] : null);
  }
  setItem(key: string, value: string) {
    this.#values[key] = value;
    return Promise.resolve();
  }
  removeItem(key: string) {
    delete this.#values[key];
    return Promise.resolve();
  }
}

export function createMemoryStorage(): StorageAdapter {
  return new MemoryStorage();
}

export function createPriceFormat(locale: string, noPriceLabel: string): PriceFormat {
  return {
    price(price) {
      if (price === null) return noPriceLabel;
      return price.toLocaleString(locale, {
        style: 'currency',
        currency: 'UAH',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
    },
  };
}
