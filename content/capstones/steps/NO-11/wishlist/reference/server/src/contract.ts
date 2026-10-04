// The storage contract of the wish store, version 2: { schemaVersion: 2, records } in server/data/wishlist.json.
// One module that everyone imports — the repository on every read and before every write, the
// migration, the backup check and the tests. The field rules are the web project's parseItem
// (data/model.ts); the store adds what a file must also hold: exactly the five fields of a wish (an
// unknown or a missing field is a problem), no empty category (version 2 stores null), different ids.
// Every problem is collected, so whoever repairs a file sees all of them at once.
import { parseItem } from "../../data/model.ts";
import type { Wish } from "../../domain/wishes.ts";

export const STORE_VERSION = 2;
export const WISH_FIELDS = ["id", "name", "price", "acquired", "category"];

export type Store = { schemaVersion: 2; records: Wish[] };

// A store that breaks the contract: `problems` lists every one, as "records[3].price: notWholeNonNegative".
export class ContractError extends Error {
  problems: string[];

  constructor(problems: string[], options?: ErrorOptions) {
    super(`the store breaks the contract: ${problems.join("; ")}`, options);
    this.name = "ContractError";
    this.problems = problems;
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The problems of a list of records (an empty array when there are none) and the checked wishes.
export function checkRecords(records: unknown): { problems: string[]; wishes: Wish[] } {
  if (!Array.isArray(records)) {
    return { problems: ["records: notArray"], wishes: [] };
  }
  const problems: string[] = [];
  const wishes: Wish[] = [];
  records.forEach((record: unknown, index) => {
    const at = `records[${index}]`;
    if (!isObject(record)) {
      problems.push(`${at}: notObject`);
      return;
    }
    for (const field of WISH_FIELDS) {
      if (!Object.hasOwn(record, field)) {
        problems.push(`${at}.${field}: required`);
      }
    }
    for (const field of Object.keys(record)) {
      if (!WISH_FIELDS.includes(field)) {
        problems.push(`${at}.${field}: unknown`);
      }
    }
    if (record.category === "") {
      problems.push(`${at}.category: empty`);
    }
    const parsed = parseItem(record);
    if (parsed.ok) {
      wishes.push(parsed.value);
    } else {
      for (const [field, code] of Object.entries(parsed.errors)) {
        if (Object.hasOwn(record, field) || field === "record") {
          problems.push(`${at}.${field}: ${code}`);
        }
      }
    }
  });
  const seen = new Set<unknown>();
  for (const record of records) {
    const id = isObject(record) ? record.id : undefined;
    if (typeof id === "string" && seen.has(id)) {
      problems.push(`records: duplicate id ${id}`);
    }
    seen.add(id);
  }
  return { problems: problems, wishes: wishes };
}

// The checked store of a parsed JSON value, or a ContractError with every problem.
export function checkStore(body: unknown): Store {
  if (!isObject(body)) {
    throw new ContractError(["store: notObject"]);
  }
  const problems: string[] = [];
  if (body.schemaVersion !== STORE_VERSION) {
    problems.push(`schemaVersion: expected ${STORE_VERSION}, got ${JSON.stringify(body.schemaVersion)}`);
  }
  for (const key of Object.keys(body)) {
    if (key !== "schemaVersion" && key !== "records") {
      problems.push(`${key}: unknown`);
    }
  }
  const checked = checkRecords(body.records);
  problems.push(...checked.problems);
  if (problems.length > 0) {
    throw new ContractError(problems);
  }
  return { schemaVersion: STORE_VERSION, records: checked.wishes };
}

// The store of a file's text. Text that is not JSON is damaged too: a ContractError, not a SyntaxError.
export function parseStore(text: string): Store {
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new ContractError(["store: notJson"], { cause: error });
  }
  return checkStore(body);
}

// The text the repository writes for these records — checked first, so a broken record never reaches the disk.
export function storeText(records: Wish[]): string {
  const store = checkStore({ schemaVersion: STORE_VERSION, records: records });
  return JSON.stringify(store, null, 2) + "\n";
}
