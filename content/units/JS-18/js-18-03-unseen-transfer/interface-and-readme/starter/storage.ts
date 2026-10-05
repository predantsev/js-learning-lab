// Saving and loading the plants: only the signatures are kept here. Read-only.
import type { Plant } from "./plants.js";

export const STORAGE_KEY = "jsll.plants.v1";

const NOT_HERE = "the body of this function is not part of this task";

export function savePlants(storage: Pick<Storage, "getItem" | "setItem">, plants: Plant[]): void {
  throw new Error(NOT_HERE);
}

export function loadPlants(storage: Pick<Storage, "getItem" | "setItem">): Plant[] {
  throw new Error(NOT_HERE);
}
