// adapters.ts: implementations of the contracts. Only this file knows where data really goes.
import type { FormatAdapter, StorageAdapter } from './contracts.ts';

// Web: wraps the browser's localStorage in the async contract.
export function createWebStorage(): StorageAdapter {
  return {
    async getItem(key) {
      return localStorage.getItem(key);
    },
    async setItem(key, value) {
      localStorage.setItem(key, value);
    },
  };
}

// Test double: keeps the saved text in memory and reports every call.
export class LoggingMemoryStorage implements StorageAdapter {
  #saved: Record<string, string> = {};
  async getItem(key: string) {
    console.log(`memory: get ${key}`);
    return Object.hasOwn(this.#saved, key) ? this.#saved[key] : null;
  }
  async setItem(key: string, value: string) {
    console.log(`memory: set ${key} (${value.length} characters)`);
    this.#saved[key] = value;
  }
}

// Formatting through Intl for the given locale; the project currency is UAH.
export function createMoneyFormat(locale: string): FormatAdapter {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: 'UAH' });
  return {
    money(amountMinor) {
      return formatter.format(amountMinor / 100);
    },
  };
}
