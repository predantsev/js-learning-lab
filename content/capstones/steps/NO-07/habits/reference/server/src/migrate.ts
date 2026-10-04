// The migration of the habit store from schemaVersion 1 to 2. Version 1 was lenient: older code could
// store a habit without `frequency` (it meant "daily") and completions with a day twice or out of order.
// Version 2 stores the frequency explicitly and the completions the way the model wants them: each day
// once, in ascending order (the domain's uniqueSortedDays). migrate1to2 is pure: it returns a new store
// and never changes its input. A record it cannot move (a completion that is not a real date, a missing
// name) stops the whole migration — nothing is dropped silently, and a half-migrated store cannot exist.
// dryRun proves a migration on a copy before the live file is touched: the same count, the same ids, the
// same number of completion days and the same streaks on a fixed day, and a second run changes nothing.
import { isCalendarDate, uniqueSortedDays } from "../../domain/habits.ts";
import { streakOf } from "../../ui/streak.ts";
import { isRealDate } from "./config.ts";
import { ContractError, checkStore, STORE_VERSION } from "./contract.ts";
import type { Store } from "./contract.ts";

export type AnyStore = { schemaVersion?: unknown; records?: unknown };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function migrateHabit(record: unknown): unknown {
  if (!isObject(record)) {
    return record; // the contract below reports it
  }
  const { frequency, completions, ...rest } = record;
  const days = Array.isArray(completions) && completions.every(isCalendarDate) ? uniqueSortedDays(completions) : completions;
  return { ...rest, frequency: frequency === undefined ? "daily" : frequency, completions: days };
}

// The model checks only the form of a day, so "2026-02-30" passes it; a migration must not carry a day
// that never existed into version 2. One problem per record that has such a day.
function unrealDays(records: unknown[]): string[] {
  const problems: string[] = [];
  records.forEach((record, index) => {
    const days = isObject(record) && Array.isArray(record.completions) ? record.completions : [];
    if (days.some((day) => isCalendarDate(day) && !isRealDate(day))) {
      problems.push(`records[${index}].completions: notRealDate`);
    }
  });
  return problems;
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
  // checkStore throws with every problem when a moved record still breaks the version 2 contract; the
  // days that do not exist are added to the same list, so whoever repairs the file sees all at once.
  let problems = unrealDays(store.records);
  let moved: Store | null = null;
  try {
    moved = checkStore({ schemaVersion: STORE_VERSION, records: store.records.map(migrateHabit) });
  } catch (error) {
    if (!(error instanceof ContractError)) {
      throw error;
    }
    problems = [...error.problems, ...problems];
  }
  if (problems.length > 0 || moved === null) {
    throw new ContractError(problems);
  }
  return moved;
}

// What must not change in a migration or a backup: the count, the ids, the number of completion days
// and the streak of every habit on `day` ("h-01:3,h-02:0", in the order of the ids). The streaks depend
// on the day, so the day is a parameter: the same store gives the same facts on the same day.
// It reads records of either version, so the facts of the old store can be compared with the new one:
// a day stored twice is counted once, and the days are taken in any order.
export type Facts = { count: number; ids: string; completions: number; streaks: string };

function streaksText(habits: { id: string; days: string[] }[], day: string): string {
  return habits
    .map((habit) => ({ id: habit.id, streak: streakOf(habit.days.filter((one) => one <= day), day) }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((habit) => `${habit.id}:${habit.streak}`)
    .join(",");
}

export function facts(records: unknown[], day: string): Facts {
  const habits = records.map((record) => {
    const { id, completions } = record as { id?: unknown; completions?: unknown };
    const days = Array.isArray(completions) ? completions.filter((one): one is string => typeof one === "string") : [];
    return { id: String(id), days: uniqueSortedDays(days) };
  });
  return {
    count: habits.length,
    ids: habits.map((habit) => habit.id).sort().join(","),
    completions: habits.reduce((sum, habit) => sum + habit.days.length, 0),
    streaks: streaksText(habits, day),
  };
}

// The same facts of checked habits: their completions as stored (version 2 keeps each day once) and
// the streak from ui/streak.ts — the number the summary and the web app show.
export function storeFacts(store: Store, day: string): Facts {
  const habits = store.records.map((habit) => ({ id: habit.id, days: habit.completions }));
  return {
    count: habits.length,
    ids: habits.map((habit) => habit.id).sort().join(","),
    completions: habits.reduce((sum, habit) => sum + habit.days.length, 0),
    streaks: streaksText(habits, day),
  };
}

export type DryRun = { ok: true; count: number; facts: Facts; result: Store } | { ok: false; problem: string };

// Runs `migrate` on a copy of `store` and checks the result with the facts of `day`. Never throws, never
// touches `store`.
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
  return { ok: true, count: moved.count, facts: moved, result: after };
}
