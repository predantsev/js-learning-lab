// Saving and loading the plants. The storage is any object with getItem and setItem.
import { parsePlants, type Plant } from "./plants.js";

export const STORAGE_KEY = "jsll.plants.v1";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

// Writes { "schemaVersion": 1, "plants": [ … ] } as JSON text under STORAGE_KEY.
export function savePlants(storage: Storage, plants: Plant[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, plants }));
}

// Reads the plants back and never throws: missing data, text that is not JSON, another
// schemaVersion or a "plants" that is not an array give []; invalid plant records are left out.
export function loadPlants(storage: Storage): Plant[] {
  const text = storage.getItem(STORAGE_KEY);
  if (text === null) return [];
  const data: unknown = JSON.parse(text);
  if (typeof data !== "object" || data === null) return [];
  const record = data as { schemaVersion?: unknown; plants?: unknown };
  if (record.schemaVersion !== 1) return [];
  return parsePlants(record.plants);
}
