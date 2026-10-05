// contracts.ts: the adapter contracts of the wishlist. Do not edit.
// The sandbox removes the types and checks nothing; `tsc` in your project does the checking.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface PriceFormat {
  // price: whole hryvnias (UAH), or null when the wish has no price
  price(price: number | null): string;
}
