// The saved form of the wish list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written through any StorageAdapter.
import type { Wish } from "../domain/wishes.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.wishlist.v1";

export function saveSnapshot(storage: StorageAdapter, records: Wish[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}
