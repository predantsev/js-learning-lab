// The task repository on the disk: { schemaVersion: 2, records } in <dataDir>/planner.json. A JSON file,
// not SQLite: the store is small and written by one server process, and the course minimum Node.js
// 22.13 has no sqlite.backup() (it arrived in 22.16). Every change rewrites the whole file through
// writeAtomic, so after a crash the file is either the old one or the new one, never a mix. Every read
// and every write passes the storage contract (contract.ts): a damaged file is an error with its
// problems, never "no records". Every change — read, change, write — runs in the write queue (lock.ts),
// so two requests at the same moment cannot both build on the same old file.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Task } from "../../domain/tasks.ts";
import { parseStore, storeText } from "./contract.ts";
import { readTextBounded, removeStaleTemps, resolveInside, writeAtomic } from "./files.ts";
import { createWriteLock } from "./lock.ts";

export const DATA_FILE_NAME = "planner.json";
export const MAX_DATA_BYTES = 10_000_000; // room for an import of 20,000 tasks

export type RepositoryOptions = {
  maxBytes?: number;
  beforeRename?: () => void; // passed on to writeAtomic: the crash rehearsal
};

export type TaskRepository = {
  readonly file: string;
  list(): Promise<Task[]>;
  get(id: string): Promise<Task | null>;
  save(record: Task): Promise<void>;
  remove(id: string): Promise<boolean>;
  // A new task built from the current records (so its id is the next free one), saved in the same turn of the queue.
  create(build: (records: Task[]) => Task): Promise<Task>;
  // The task with this id changed by `change`, saved in the same turn of the queue; null when there is none.
  update(id: string, change: (current: Task) => Task): Promise<Task | null>;
  // Every task replaces the stored one with its id, or is added at the end — in one change of the file. A
  // stored task that is done stays done: an import never reopens a task completed since the file was made.
  upsertMany(tasks: Task[]): Promise<{ created: number; updated: number }>;
  recover(): Promise<string[]>;
  seed(records: Task[]): Promise<boolean>;
};

export function createFileRepository(dataDir: string, options: RepositoryOptions = {}): TaskRepository {
  const maxBytes = options.maxBytes ?? MAX_DATA_BYTES;
  const file = resolveInside(dataDir, DATA_FILE_NAME);
  const locked = createWriteLock();

  // The saved tasks; [] when nothing has been saved yet (the file does not exist).
  async function list(): Promise<Task[]> {
    const text = await readTextBounded(file, maxBytes);
    if (text === null) {
      return [];
    }
    return parseStore(text).records;
  }

  async function write(records: Task[]): Promise<void> {
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
        const task = build(records);
        await write([...records, task]);
        return task;
      });
    },
    update(id, change) {
      return locked(async () => {
        const records = await list();
        const index = records.findIndex((one) => one.id === id);
        if (index === -1) {
          return null;
        }
        const task = change(records[index]);
        records[index] = task;
        await write(records);
        return task;
      });
    },
    upsertMany(tasks) {
      return locked(async () => {
        const records = await list();
        const index = new Map(records.map((task, position) => [task.id, position]));
        let created = 0;
        for (const task of tasks) {
          const position = index.get(task.id);
          if (position === undefined) {
            index.set(task.id, records.length);
            records.push(task);
            created += 1;
          } else {
            records[position] = { ...task, done: records[position].done || task.done };
          }
        }
        await write(records);
        return { created: created, updated: tasks.length - created };
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
