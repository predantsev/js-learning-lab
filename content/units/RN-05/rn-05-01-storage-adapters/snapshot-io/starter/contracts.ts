// contracts.ts: the storage contract from RN-03 and the planner snapshot. Do not edit.
// The sandbox removes the types and checks nothing; `tsc` in your project does the checking.
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: 'low' | 'normal' | 'high';
};

export type Snapshot = { schemaVersion: 1; records: Task[] };

export type SaveResult =
  | { ok: true; length: number }
  | { ok: false; reason: 'too-large'; length: number };
