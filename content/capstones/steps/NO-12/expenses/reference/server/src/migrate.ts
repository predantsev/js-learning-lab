// The migration of the expense store from schemaVersion 1 to 2. Version 1 was lenient: older code could
// store an amount that is not a positive whole number of kopiykas (12.5, 0, "65") or a category the
// project does not have. Version 2 refuses both, and such a record is QUARANTINED, not dropped: it goes,
// as it was stored and with its problems, to data/expenses.quarantine.json, where a person can repair
// it and add it again. Every other bad record (a missing label, a bad date, an unknown field) stops the
// whole migration — nothing disappears silently, and a half-migrated store cannot exist.
// migrate1to2 is pure: it returns a new store and the quarantined records and never changes its input.
// dryRun proves a migration on a copy before the live file is touched: kept + quarantined = the count
// before, the same ids, the same per-category totals of the valid records, and a second run changes nothing.
import { isCategoryId, summarizeExpenses } from "../../domain/expenses.ts";
import type { Expense } from "../../domain/expenses.ts";
import { checkRecords, checkStore, ContractError, STORE_VERSION } from "./contract.ts";
import type { Store } from "./contract.ts";

export type AnyStore = { schemaVersion?: unknown; records?: unknown };

export const QUARANTINE_FILE_NAME = "expenses.quarantine.json";

// A record that version 2 refuses, as it was stored, with its problems: "amountMinor: notPositiveWhole".
export type Quarantined = { record: unknown; problems: string[] };
export type Migrated = { store: Store; quarantined: Quarantined[] };

// The only problems that send a record to the quarantine; any other problem stops the migration.
const QUARANTINABLE = ["amountMinor: notPositiveWhole", "category: unknown"];

export function migrate1to2(store: AnyStore): Migrated {
  if (store.schemaVersion === STORE_VERSION) {
    return { store: checkStore(store), quarantined: [] }; // already version 2: nothing to move
  }
  if (store.schemaVersion !== 1) {
    throw new Error(`cannot migrate schemaVersion ${JSON.stringify(store.schemaVersion)}`);
  }
  if (!Array.isArray(store.records)) {
    throw new ContractError(["records: notArray"]);
  }
  const kept: unknown[] = [];
  const quarantined: Quarantined[] = [];
  const stopping: string[] = [];
  store.records.forEach((record: unknown, index) => {
    // The version 2 contract of this one record; its problems read "records[0].amountMinor: notPositiveWhole".
    const problems = checkRecords([record]).problems;
    const fields = problems.map((problem) => problem.replace(/^records\[0\]\./, ""));
    if (problems.length > 0 && fields.every((problem) => QUARANTINABLE.includes(problem))) {
      quarantined.push({ record: structuredClone(record), problems: fields });
    } else if (problems.length > 0) {
      stopping.push(...problems.map((problem) => problem.replace(/^records\[0\]/, `records[${index}]`)));
    } else {
      kept.push(record);
    }
  });
  if (stopping.length > 0) {
    throw new ContractError(stopping);
  }
  // checkStore throws when the kept records still break the version 2 contract (two records with one id).
  return { store: checkStore({ schemaVersion: STORE_VERSION, records: kept }), quarantined: quarantined };
}

// The text of data/expenses.quarantine.json for the quarantined records of one migration.
export function quarantineText(quarantined: Quarantined[]): string {
  return JSON.stringify({ fromSchemaVersion: 1, records: quarantined }, null, 2) + "\n";
}

// What must not change in a migration or a backup: the count, the ids and the per-category totals the
// app shows, as text "food:105600,transport:52000,home:9990,fun:48000". It reads records of either
// version, so the facts of the old store can be compared with the new one: the totals count only the
// records version 2 accepts (a positive whole amount and a known category).
export type Facts = { count: number; ids: string; byCategory: string };

const totalsText = (byCategory: Record<string, number>) =>
  Object.entries(byCategory)
    .map(([category, total]) => `${category}:${total}`)
    .join(",");

export function facts(records: unknown[]): Facts {
  const expenses = records.map((record) => record as { id?: unknown; amountMinor?: unknown; category?: unknown });
  const valid = expenses.filter((expense) => Number.isInteger(expense.amountMinor) && (expense.amountMinor as number) > 0 && isCategoryId(expense.category));
  return {
    count: expenses.length,
    ids: expenses.map((expense) => String(expense.id)).sort().join(","),
    byCategory: totalsText(summarizeExpenses(valid as Expense[]).byCategory),
  };
}

// The same facts of checked expenses, from the domain's own summary: the numbers on the summary screen.
export function storeFacts(store: Store): Facts {
  return { ...facts(store.records), byCategory: totalsText(summarizeExpenses(store.records).byCategory) };
}

export type DryRun = { ok: true; count: number; quarantined: Quarantined[]; result: Store } | { ok: false; problem: string };

// Runs `migrate` on a copy of `store` and checks the result. Never throws, never touches `store`.
export function dryRun(store: AnyStore, migrate: (store: AnyStore) => Migrated = migrate1to2): DryRun {
  const records = Array.isArray(store.records) ? store.records : [];
  const before = facts(records);
  let after: Migrated;
  let again: Migrated;
  try {
    after = migrate(structuredClone(store));
    again = migrate(structuredClone(after.store));
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
  // Kept and quarantined together must be every record of before; the totals come from the kept ones.
  const everyRecord = [...after.store.records, ...after.quarantined.map((one) => one.record)];
  const moved = { ...facts(everyRecord), byCategory: storeFacts(after.store).byCategory };
  if (JSON.stringify(moved) !== JSON.stringify(before)) {
    return { ok: false, problem: `the facts changed: ${JSON.stringify(before)} → ${JSON.stringify(moved)}` };
  }
  if (JSON.stringify(again.store) !== JSON.stringify(after.store) || again.quarantined.length > 0) {
    return { ok: false, problem: "a second run changed the store again" };
  }
  return { ok: true, count: after.store.records.length, quarantined: after.quarantined, result: after.store };
}
