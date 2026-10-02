// Saving and loading the plants. The storage is any object with getItem and setItem.
import { parsePlants } from "./plants.js";

export const STORAGE_KEY = "jsll.plants.v1";

// Writes { "schemaVersion": 1, "plants": [ … ] } as JSON text under STORAGE_KEY.
export function savePlants(storage, plants) {}

// Reads the plants back and never throws: missing data, text that is not JSON, another
// schemaVersion or a "plants" that is not an array give []; invalid plant records are left out.
export function loadPlants(storage) {}
