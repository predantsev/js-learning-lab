// The habit repository on the disk: { schemaVersion: 2, records } in <dataDir>/habits.json. A JSON file,
// not SQLite: the store is small and written by one server process, and the course minimum Node.js
// 22.13 has no sqlite.backup() (it arrived in 22.16). Every change rewrites the whole file through
// writeAtomic, so after a crash the file is either the old one or the new one, never a mix. Every read
// and every write passes the storage contract (contract.ts): a damaged file is an error with its
// problems, never "no records". Every change — read, change, write — runs in the write queue (lock.ts),
// so two requests at the same moment cannot both build on the same old file.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { uniqueSortedDays } from "../../domain/habits.ts";
import type { Habit } from "../../domain/habits.ts";
import { ApiError } from "./api-errors.ts";
import { parseStore, storeText } from "./contract.ts";
import { readTextBounded, removeStaleTemps, resolveInside, writeAtomic } from "./files.ts";
import { createWriteLock } from "./lock.ts";
import { MAX_COMPLETIONS } from "./validate.ts";

export const DATA_FILE_NAME = "habits.json";
export const MAX_DATA_BYTES = 16_000_000; // room for an import of 20,000 habits with a month of completions each

export type RepositoryOptions = {
  maxBytes?: number;
  beforeRename?: () => void; // passed on to writeAtomic: the crash rehearsal
};

export type HabitRepository = {
  readonly file: string;
  list(): Promise<Habit[]>;
  get(id: string): Promise<Habit | null>;
  save(record: Habit): Promise<void>;
  remove(id: string): Promise<boolean>;
  // A new habit built from the current records (so its id is the next free one), saved in the same turn of the queue.
  create(build: (records: Habit[]) => Habit): Promise<Habit>;
  // The habit with this id changed by `change`, saved in the same turn of the queue; null when there is none.
  update(id: string, change: (current: Habit) => Habit): Promise<Habit | null>;
  // Every habit is added at the end, or merged into the stored one with its id — in one change of the file.
  upsertMany(habits: Habit[]): Promise<{ created: number; updated: number }>;
  recover(): Promise<string[]>;
  seed(records: Habit[]): Promise<boolean>;
};

export function createFileRepository(dataDir: string, options: RepositoryOptions = {}): HabitRepository {
  const maxBytes = options.maxBytes ?? MAX_DATA_BYTES;
  const file = resolveInside(dataDir, DATA_FILE_NAME);
  const locked = createWriteLock();

  // The saved habits; [] when nothing has been saved yet (the file does not exist).
  async function list(): Promise<Habit[]> {
    const text = await readTextBounded(file, maxBytes);
    if (text === null) {
      return [];
    }
    return parseStore(text).records;
  }

  async function write(records: Habit[]): Promise<void> {
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
    // A known id takes the name, frequency and active flag of the new habit, and the completions become the
    // sorted unique days of both lists: a day completed since the export is kept, and a day sent again is
    // counted once. A merge that would take a habit past MAX_COMPLETIONS refuses the whole change.
    upsertMany(habits) {
      return locked(async () => {
        const records = await list();
        const index = new Map(records.map((habit, position) => [habit.id, position]));
        let created = 0;
        const tooMany: string[] = [];
        for (const habit of habits) {
          const position = index.get(habit.id);
          if (position === undefined) {
            index.set(habit.id, records.length);
            records.push(habit);
            created += 1;
          } else {
            const merged = { ...habit, completions: uniqueSortedDays([...records[position].completions, ...habit.completions]) };
            if (merged.completions.length > MAX_COMPLETIONS) {
              tooMany.push(habit.id);
            }
            records[position] = merged;
          }
        }
        if (tooMany.length > 0) {
          throw new ApiError(400, "VALIDATION_FAILED", { completions: "too-many", ids: tooMany.slice(0, 20) }); // nothing is written
        }
        await write(records);
        return { created: created, updated: habits.length - created };
      });
    },
    // On start: delete the temp files a crash left behind.
    recover() {
      return removeStaleTemps(path.dirname(file));
    },
    // Writes the starting records when the store is missing or holds no records; returns whether it wrote.
    // A store with records is never touched: a person may have deleted a starting habit on purpose.
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
