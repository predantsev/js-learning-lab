// adapters.ts: an in-memory storage and a price format for the wishlist.
import type { PriceFormat, StorageAdapter } from './contracts.ts';

export function createMemoryStorage(): StorageAdapter {
  return {
    async getItem(key) {
      return null; // TODO
    },
    async setItem(key, value) {
      // TODO
    },
    async removeItem(key) {
      // TODO
    },
  };
}

export function createPriceFormat(locale: string, noPriceLabel: string): PriceFormat {
  return {
    price(price) {
      return ''; // TODO
    },
  };
}
