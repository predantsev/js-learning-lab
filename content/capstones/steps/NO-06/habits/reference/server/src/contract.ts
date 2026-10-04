// The storage contract of the habit store, version 2: { schemaVersion: 2, records } in server/data/habits.json.
// One module that everyone imports — the repository on every read and before every write, the
// migration, the backup check and the tests. The field rules are the web project's parseHabit
// (data/model.ts): a frequency of daily|weekly, a boolean active, completions as calendar dates, each
// once, in ascending order. The store adds what a file must also hold: exactly the five fields of a
// habit (an unknown or a missing field is a problem) and different ids. Every problem is collected, so
// whoever repairs a file sees all of them at once.
import { parseHabit } from "../../data/model.ts";
import type { Habit } from "../../domain/habits.ts";

export const STORE_VERSION = 2;
export const HABIT_FIELDS = ["id", "name", "frequency", "active", "completions"];

export type Store = { schemaVersion: 2; records: Habit[] };

// A store that breaks the contract: `problems` lists every one, as "records[3].completions: duplicateDate".
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

// The problems of a list of records (an empty array when there are none) and the checked habits.
export function checkRecords(records: unknown): { problems: string[]; habits: Habit[] } {
  if (!Array.isArray(records)) {
    return { problems: ["records: notArray"], habits: [] };
  }
  const problems: string[] = [];
  const habits: Habit[] = [];
  records.forEach((record: unknown, index) => {
    const at = `records[${index}]`;
    if (!isObject(record)) {
      problems.push(`${at}: notObject`);
      return;
    }
    for (const field of HABIT_FIELDS) {
      if (!Object.hasOwn(record, field)) {
        problems.push(`${at}.${field}: required`);
      }
    }
    for (const field of Object.keys(record)) {
      if (!HABIT_FIELDS.includes(field)) {
        problems.push(`${at}.${field}: unknown`);
      }
    }
    const parsed = parseHabit(record);
    if (parsed.ok) {
      habits.push(parsed.value);
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
  return { problems: problems, habits: habits };
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
  return { schemaVersion: STORE_VERSION, records: checked.habits };
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
export function storeText(records: Habit[]): string {
  const store = checkStore({ schemaVersion: STORE_VERSION, records: records });
  return JSON.stringify(store, null, 2) + "\n";
}
