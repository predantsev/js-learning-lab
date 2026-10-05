// What the screens need from the platform, as types only. The screens receive these objects from
// App.tsx and never ask which platform made them, so a test or another platform can pass its own.

// Text by key, asynchronously: the device storage has these three methods, and so does the memory
// stand-in of src/adapters.ts.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

// An amount for the screen: whole kopiykas as money text in hryvnias, in the project's language.
export interface MoneyFormat {
  money(amountMinor: number): string;
}
