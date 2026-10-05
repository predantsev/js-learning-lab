// The wish repository on the disk: { schemaVersion: 1, records } in <dataDir>/wishlist.json. Every change
// rewrites the whole file through writeAtomic, so after a crash the file is either the old one or the
// new one, never a mix. Reads are bounded by maxBytes, and what is read passes parseItemList: a damaged
// file is an error with its cause, never "no records".
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { parseItemList } from "../../data/model.ts";
import type { Wish } from "../../domain/wishes.ts";
import { readTextBounded, removeStaleTemps, resolveInside, writeAtomic } from "./files.ts";

export const DATA_FILE_NAME = "wishlist.json";
export const MAX_DATA_BYTES = 1_000_000;

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
  recover(): Promise<string[]>;
  seed(records: Wish[]): Promise<boolean>;
};

export function createFileRepository(dataDir: string, options: RepositoryOptions = {}): WishRepository {
  const maxBytes = options.maxBytes ?? MAX_DATA_BYTES;
  const file = resolveInside(dataDir, DATA_FILE_NAME);

  // The saved wishes; [] when nothing has been saved yet (the file does not exist).
  async function list(): Promise<Wish[]> {
    const text = await readTextBounded(file, maxBytes);
    if (text === null) {
      return [];
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch (error) {
      throw new Error(`${DATA_FILE_NAME} is not JSON`, { cause: error });
    }
    if (typeof body !== "object" || body === null || !("schemaVersion" in body) || body.schemaVersion !== 1 || !("records" in body)) {
      throw new Error(`${DATA_FILE_NAME} is not { schemaVersion: 1, records }`);
    }
    const parsed = parseItemList(body.records);
    if (!parsed.ok) {
      throw new Error(`${DATA_FILE_NAME} has invalid records: ${JSON.stringify(parsed.errors)}`);
    }
    return parsed.value;
  }

  async function write(records: Wish[]): Promise<void> {
    const text = JSON.stringify({ schemaVersion: 1, records: records }, null, 2) + "\n";
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
    async save(wish) {
      const records = await list();
      const index = records.findIndex((one) => one.id === wish.id);
      if (index === -1) {
        records.push(wish);
      } else {
        records[index] = wish;
      }
      await write(records);
    },
    async remove(id) {
      const records = await list();
      const left = records.filter((wish) => wish.id !== id);
      if (left.length === records.length) {
        return false;
      }
      await write(left);
      return true;
    },
    // On start: delete the temp files a crash left behind.
    recover() {
      return removeStaleTemps(path.dirname(file));
    },
    // Writes the starting records only when there is no data file yet; returns whether it wrote.
    async seed(records) {
      if ((await readTextBounded(file, maxBytes)) !== null) {
        return false;
      }
      await write(records);
      return true;
    },
  };
}
