// The saved form of the wish list: the same key and the same snapshot shape as in the React project
// ({ schemaVersion: 1, records }), written and read through any StorageAdapter.
import { parseItemList } from "../data/model.ts";
import type { Wish } from "../domain/wishes.ts";
import type { StorageAdapter } from "./contracts.ts";

export const KEY = "jsll.wishlist.v1";

export function saveSnapshot(storage: StorageAdapter, records: Wish[]): Promise<void> {
  return storage.setItem(KEY, JSON.stringify({ schemaVersion: 1, records: records }));
}

// The saved wishes, checked by the shared contract parseItemList; null when nothing usable is saved.
export async function loadSnapshot(storage: StorageAdapter): Promise<Wish[] | null> {
  const text = await storage.getItem(KEY);
  if (text === null) {
    return null;
  }
  try {
    const saved = JSON.parse(text);
    if (saved?.schemaVersion !== 1) {
      return null;
    }
    const parsed = parseItemList(saved.records);
    return parsed.ok ? parsed.value : null;
  } catch {
    return null;
  }
}
