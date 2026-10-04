// The migration of the wish store from schemaVersion 1 to 2. Version 1 was lenient: older code could
// store a wish without `acquired` (it meant "not acquired yet") and an empty text as "no category".
// Version 2 stores both explicitly: `acquired` is always a boolean, and no category is null.
// migrate1to2 is pure: it returns a new store and never changes its input. A record it cannot move
// (a price stored as text, a missing name) stops the whole migration — nothing is dropped silently,
// and a half-migrated store cannot exist. dryRun proves a migration on a copy before the live file is
// touched: the same count, the same ids, the same wanted total, and a second run changes nothing.
import { summarizeItems } from "../../domain/wishes.ts";
import { ContractError, checkStore, STORE_VERSION } from "./contract.ts";
import type { Store } from "./contract.ts";

export type AnyStore = { schemaVersion?: unknown; records?: unknown };

function migrateWish(record: unknown): unknown {
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return record; // the contract below reports it
  }
  const { acquired, category, ...rest } = record as Record<string, unknown>;
  return { ...rest, acquired: acquired === undefined ? false : acquired, category: category === "" ? null : category };
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
  // checkStore throws with every problem when a moved record still breaks the version 2 contract.
  return checkStore({ schemaVersion: STORE_VERSION, records: store.records.map(migrateWish) });
}

// What must not change in a migration or a backup: the count, the ids and the total the app shows.
// It reads records of either version, so the facts of the old store can be compared with the new one.
export type Facts = { count: number; ids: string; wantedTotal: number };

export function facts(records: unknown[]): Facts {
  const wishes = records.map((record) => record as { id?: unknown; price?: unknown; acquired?: unknown });
  const wanted = wishes.filter((wish) => wish.acquired !== true && typeof wish.price === "number");
  return {
    count: wishes.length,
    ids: wishes.map((wish) => String(wish.id)).sort().join(","),
    wantedTotal: wanted.reduce((sum, wish) => sum + (wish.price as number), 0),
  };
}

// The same facts of checked wishes, from the domain's own summary: the number on the summary screen.
export function storeFacts(store: Store): Facts {
  return { ...facts(store.records), wantedTotal: summarizeItems(store.records).wantedTotal };
}

export type DryRun = { ok: true; count: number; result: Store } | { ok: false; problem: string };

// Runs `migrate` on a copy of `store` and checks the result. Never throws, never touches `store`.
export function dryRun(store: AnyStore, migrate: (store: AnyStore) => Store = migrate1to2): DryRun {
  const records = Array.isArray(store.records) ? store.records : [];
  const before = facts(records);
  let after: Store;
  let again: Store;
  try {
    after = migrate(structuredClone(store));
    again = migrate(structuredClone(after));
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
  const moved = storeFacts(after);
  if (JSON.stringify(moved) !== JSON.stringify(before)) {
    return { ok: false, problem: `the facts changed: ${JSON.stringify(before)} → ${JSON.stringify(moved)}` };
  }
  if (JSON.stringify(again) !== JSON.stringify(after)) {
    return { ok: false, problem: "a second run changed the store again" };
  }
  return { ok: true, count: moved.count, result: after };
}
