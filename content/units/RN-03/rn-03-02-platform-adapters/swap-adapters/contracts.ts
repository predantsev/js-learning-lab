// contracts.ts: the seams. Domain code and hooks depend only on these shapes.
// The sandbox removes the types and checks nothing; `tsc` in your project does the checking.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface FormatAdapter {
  money(amountMinor: number): string;
}

export interface ClockAdapter {
  today(): string; // 'YYYY-MM-DD'
}
