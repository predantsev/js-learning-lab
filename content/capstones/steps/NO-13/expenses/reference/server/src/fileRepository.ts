// The expense repository on the disk: { schemaVersion: 2, records } in <dataDir>/expenses.json. A JSON file,
// not SQLite: the store is small and written by one server process, and the course minimum Node.js
// 22.13 has no sqlite.backup() (it arrived in 22.16). Every change rewrites the whole file through
// writeAtomic, so after a crash the file is either the old one or the new one, never a mix. Every read
// and every write passes the storage contract (contract.ts): a damaged file is an error with its
// problems, never "no records". Every change — read, change, write — runs in the write queue (lock.ts),
// so two requests at the same moment cannot both build on the same old file.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Expense } from "../../domain/expenses.ts";
import { parseStore, storeText } from "./contract.ts";
import { readTextBounded, removeStaleTemps, resolveInside, writeAtomic } from "./files.ts";
import { createWriteLock } from "./lock.ts";

export const DATA_FILE_NAME = "expenses.json";
export const MAX_DATA_BYTES = 10_000_000; // room for an import of 20,000 expenses

export type RepositoryOptions = {
  maxBytes?: number;
  beforeRename?: () => void; // passed on to writeAtomic: the crash rehearsal
};

export type ExpenseRepository = {
  readonly file: string;
  list(): Promise<Expense[]>;
  get(id: string): Promise<Expense | null>;
  save(record: Expense): Promise<void>;
  remove(id: string): Promise<boolean>;
  // A new expense built from the current records (so its id is the next free one), saved in the same turn of the queue.
  create(build: (records: Expense[]) => Expense): Promise<Expense>;
  // The expense with this id changed by `change`, saved in the same turn of the queue; null when there is none.
  update(id: string, change: (current: Expense) => Expense): Promise<Expense | null>;
  // Every expense replaces the stored one with its id, or is added at the end — in one change of the file.
  upsertMany(expenses: Expense[]): Promise<{ created: number; updated: number }>;
  recover(): Promise<string[]>;
  seed(records: Expense[]): Promise<boolean>;
};

export function createFileRepository(dataDir: string, options: RepositoryOptions = {}): ExpenseRepository {
  const maxBytes = options.maxBytes ?? MAX_DATA_BYTES;
  const file = resolveInside(dataDir, DATA_FILE_NAME);
  const locked = createWriteLock();

  // The saved expenses; [] when nothing has been saved yet (the file does not exist).
  async function list(): Promise<Expense[]> {
    const text = await readTextBounded(file, maxBytes);
    if (text === null) {
      return [];
    }
    return parseStore(text).records;
  }

  async function write(records: Expense[]): Promise<void> {
    const text = storeText(records); // checked by the contract before a byte is written
    if (Buffer.byteLength(text) > maxBytes) {
      throw new RangeError(`the records would take more than ${maxBytes} bytes`);
    }
    await mkdir(path.dirname(file), { recursive: true });
    await writeAtomic(file, text, options.beforeRename);
  }

  return {
    file: file,
    list: list,
    async get(id) {
      return (await list()).find((record) => record.id === id) ?? null;
    },
    // Replaces the record with the same id in its place, or adds a new one at the end.
    save(record) {
      return locked(async () => {
        const records = await list();
        const index = records.findIndex((one) => one.id === record.id);
        if (index === -1) {
          records.push(record);
        } else {
          records[index] = record;
        }
        await write(records);
      });
    },
    remove(id) {
      return locked(async () => {
        const records = await list();
        const left = records.filter((record) => record.id !== id);
        if (left.length === records.length) {
          return false;
        }
        await write(left);
        return true;
      });
    },
    create(build) {
      return locked(async () => {
        const records = await list();
        const record = build(records);
        await write([...records, record]);
        return record;
      });
    },
    update(id, change) {
      return locked(async () => {
        const records = await list();
        const index = records.findIndex((one) => one.id === id);
        if (index === -1) {
          return null;
        }
        const record = change(records[index]);
        records[index] = record;
        await write(records);
        return record;
      });
    },
    upsertMany(expenses) {
      return locked(async () => {
        const records = await list();
        const index = new Map(records.map((expense, position) => [expense.id, position]));
        let created = 0;
        for (const expense of expenses) {
          const position = index.get(expense.id);
          if (position === undefined) {
            index.set(expense.id, records.length);
            records.push(expense);
            created += 1;
          } else {
            records[position] = expense;
          }
        }
        await write(records);
        return { created: created, updated: expenses.length - created };
      });
    },
    // On start: delete the temp files a crash left behind.
    recover() {
      return removeStaleTemps(path.dirname(file));
    },
    // Writes the starting records when the store is missing or holds no records; returns whether it wrote.
    // A store with records is never touched: a person may have deleted a starting expense on purpose.
    seed(records) {
      return locked(async () => {
        if ((await list()).length > 0) {
          return false;
        }
        await write(records);
        return true;
      });
    },
  };
}
