// The migration of the task store from schemaVersion 1 to 2. Version 1 was lenient: older code could
// store a task without `priority` (it meant "normal") and an empty text as "no due date". Version 2
// stores both explicitly: `priority` is always low, normal or high, and no due date is null.
// migrate1to2 is pure: it returns a new store and never changes its input. A record it cannot move (a
// due date that is not a real YYYY-MM-DD, a missing title) stops the whole migration — nothing is
// dropped silently, and a half-migrated store cannot exist. dryRun proves a migration on a copy before
// the live file is touched: the same count, the same ids, the same pending-due count for the day, and a
// second run changes nothing.
import { countDueTasks } from "../../domain/tasks.ts";
import { ContractError, checkStore, STORE_VERSION } from "./contract.ts";
import type { Store } from "./contract.ts";

export type AnyStore = { schemaVersion?: unknown; records?: unknown };

// True for "YYYY-MM-DD" text that names a day that exists: 2026-02-31 has the right form but is no day.
function isRealDate(text: string): boolean {
  const date = new Date(text + "T00:00:00Z");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

function migrateTask(record: unknown): unknown {
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return record; // the contract below reports it
  }
  const { dueDate, priority, ...rest } = record as Record<string, unknown>;
  return { ...rest, dueDate: dueDate === "" ? null : dueDate, priority: priority === undefined ? "normal" : priority };
}

export function migrate1to2(store: AnyStore): Store {
  if (store.schemaVersion === STORE_VERSION) {
    return checkStore(store); // already version 2: nothing to move
  }
  if (store.schemaVersion !== 1) {
    throw new Error(`cannot migrate schemaVersion ${JSON.stringify(store.schemaVersion)}`);
  }
  if (!Array.isArray(store.records)) {
    throw new ContractError(["records: notArray"]);
  }
  const moved = store.records.map(migrateTask);
  // The form "YYYY-MM-DD" is the contract's; a day that does not exist is refused here, before anything moves.
  const unreal = moved.flatMap((record, index) => {
    const dueDate = (record as { dueDate?: unknown } | null)?.dueDate;
    return typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate) && !isRealDate(dueDate) ? [`records[${index}].dueDate: notRealDate`] : [];
  });
  if (unreal.length > 0) {
    throw new ContractError(unreal);
  }
  // checkStore throws with every problem when a moved record still breaks the version 2 contract.
  return checkStore({ schemaVersion: STORE_VERSION, records: moved });
}

// What must not change in a migration or a backup: the count, the ids and the number the app shows —
// the pending tasks due on or before a fixed day. It reads records of either version, so the facts of
// the old store can be compared with the new one; a version 1 "" is no due date, never due.
export type Facts = { count: number; ids: string; pendingDue: number };

export function facts(records: unknown[], day: string): Facts {
  const tasks = records.map((record) => record as { id?: unknown; dueDate?: unknown; done?: unknown });
  const due = tasks.filter((task) => task.done !== true && typeof task.dueDate === "string" && task.dueDate !== "" && task.dueDate <= day);
  return {
    count: tasks.length,
    ids: tasks.map((task) => String(task.id)).sort().join(","),
    pendingDue: due.length,
  };
}

// The same facts of checked tasks, from the domain's own count: the number on the "due today" screen.
export function storeFacts(store: Store, day: string): Facts {
  return { ...facts(store.records, day), pendingDue: countDueTasks(store.records, day) };
}

export type DryRun = { ok: true; count: number; result: Store } | { ok: false; problem: string };

// Runs `migrate` on a copy of `store` and checks the result for `day`. Never throws, never touches `store`.
export function dryRun(store: AnyStore, day: string, migrate: (store: AnyStore) => Store = migrate1to2): DryRun {
  const records = Array.isArray(store.records) ? store.records : [];
  const before = facts(records, day);
  let after: Store;
  let again: Store;
  try {
    after = migrate(structuredClone(store));
    again = migrate(structuredClone(after));
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
  const moved = storeFacts(after, day);
  if (JSON.stringify(moved) !== JSON.stringify(before)) {
    return { ok: false, problem: `the facts changed: ${JSON.stringify(before)} → ${JSON.stringify(moved)}` };
  }
  if (JSON.stringify(again) !== JSON.stringify(after)) {
    return { ok: false, problem: "a second run changed the store again" };
  }
  return { ok: true, count: moved.count, result: after };
}
