// The wish repository on the disk: { schemaVersion: 2, records } in <dataDir>/wishlist.json. A JSON file,
// not SQLite: the store is small and written by one server process, and the course minimum Node.js
// 22.13 has no sqlite.backup() (it arrived in 22.16). Every change rewrites the whole file through
// writeAtomic, so after a crash the file is either the old one or the new one, never a mix. Every read
// and every write passes the storage contract (contract.ts): a damaged file is an error with its
// problems, never "no records". Every change — read, change, write — runs in the write queue (lock.ts),
// so two requests at the same moment cannot both build on the same old file.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Wish } from "../../domain/wishes.ts";
import { parseStore, storeText } from "./contract.ts";
import { readTextBounded, removeStaleTemps, resolveInside, writeAtomic } from "./files.ts";
import { createWriteLock } from "./lock.ts";

export const DATA_FILE_NAME = "wishlist.json";
export const MAX_DATA_BYTES = 10_000_000; // room for an import of 20,000 wishes

export type RepositoryOptions = {
  maxBytes?: number;
  beforeRename?: () => void; // passed on to writeAtomic: the crash rehearsal
};

export type WishRepository = {
  readonly file: string;
  list(): Promise<Wish[]>;
  get(id: string): Promise<Wish | null>;
  save(wish: Wish): Promise<void>;
  remove(id: string): Promise<boolean>;
  // A new wish built from the current records (so its id is the next free one), saved in the same turn of the queue.
  create(build: (records: Wish[]) => Wish): Promise<Wish>;
  // The wish with this id changed by `change`, saved in the same turn of the queue; null when there is none.
  update(id: string, change: (current: Wish) => Wish): Promise<Wish | null>;
  // Every wish replaces the stored one with its id, or is added at the end — in one change of the file.
  upsertMany(wishes: Wish[]): Promise<{ created: number; updated: number }>;
  recover(): Promise<string[]>;
  seed(records: Wish[]): Promise<boolean>;
};

export function createFileRepository(dataDir: string, options: RepositoryOptions = {}): WishRepository {
  const maxBytes = options.maxBytes ?? MAX_DATA_BYTES;
  const file = resolveInside(dataDir, DATA_FILE_NAME);
  const locked = createWriteLock();

  // The saved wishes; [] when nothing has been saved yet (the file does not exist).
  async function list(): Promise<Wish[]> {
    const text = await readTextBounded(file, maxBytes);
    if (text === null) {
      return [];
    }
    return parseStore(text).records;
  }

  async function write(records: Wish[]): Promise<void> {
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
      return (await list()).find((wish) => wish.id === id) ?? null;
    },
    // Replaces the wish with the same id in its place, or adds a new one at the end.
    save(wish) {
      return locked(async () => {
        const records = await list();
        const index = records.findIndex((one) => one.id === wish.id);
        if (index === -1) {
          records.push(wish);
        } else {
          records[index] = wish;
        }
        await write(records);
      });
    },
    remove(id) {
      return locked(async () => {
        const records = await list();
        const left = records.filter((wish) => wish.id !== id);
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
        const wish = build(records);
        await write([...records, wish]);
        return wish;
      });
    },
    update(id, change) {
      return locked(async () => {
        const records = await list();
        const index = records.findIndex((one) => one.id === id);
        if (index === -1) {
          return null;
        }
        const wish = change(records[index]);
        records[index] = wish;
        await write(records);
        return wish;
      });
    },
    upsertMany(wishes) {
      return locked(async () => {
        const records = await list();
        const index = new Map(records.map((wish, position) => [wish.id, position]));
        let created = 0;
        for (const wish of wishes) {
          const position = index.get(wish.id);
          if (position === undefined) {
            index.set(wish.id, records.length);
            records.push(wish);
            created += 1;
          } else {
            records[position] = wish;
          }
        }
        await write(records);
        return { created: created, updated: wishes.length - created };
      });
    },
    // On start: delete the temp files a crash left behind.
    recover() {
      return removeStaleTemps(path.dirname(file));
    },
    // Writes the starting records when the store is missing or holds no records; returns whether it wrote.
    // A store with records is never touched: a person may have deleted a fixture on purpose.
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
