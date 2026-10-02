// The plant-care model: types and pure functions, no page and no storage.
// A plant: id (text), name (text), location (text), intervalDays (a whole number of days, 1 to 365),
// lastWatered ("YYYY-MM-DD"), status: "ok", "thirsty" or "resting".
import { addDays } from "./clock.js";

export type PlantStatus = "ok" | "thirsty" | "resting";

export type Plant = {
  id: string;
  name: string;
  location: string;
  intervalDays: number;
  lastWatered: string;
  status: PlantStatus;
};

const STATUSES: readonly string[] = ["ok", "thirsty", "resting"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isPlant(value: unknown): value is Plant {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    record.id.trim() !== "" &&
    typeof record.name === "string" &&
    record.name.trim() !== "" &&
    typeof record.location === "string" &&
    Number.isInteger(record.intervalDays) &&
    (record.intervalDays as number) >= 1 &&
    (record.intervalDays as number) <= 365 &&
    typeof record.lastWatered === "string" &&
    ISO_DATE.test(record.lastWatered) &&
    typeof record.status === "string" &&
    STATUSES.includes(record.status)
  );
}

// The valid plants from data of unknown shape, in their order; anything that is not an array gives [].
// A valid plant has every field above with the right type: id and name are not empty after trimming,
// intervalDays is a whole number from 1 to 365, lastWatered looks like "YYYY-MM-DD", status is one of three.
// Each kept plant is a new object with exactly these six fields.
export function parsePlants(input: unknown): Plant[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isPlant).map(({ id, name, location, intervalDays, lastWatered, status }) => ({
    id,
    name,
    location,
    intervalDays,
    lastWatered,
    status,
  }));
}

// Whether the plant needs water on `today`: a resting plant never does, a thirsty one always does,
// an "ok" one does from the day its interval has passed since lastWatered (that day included).
export function isDue(plant: Plant, today: string): boolean {
  switch (plant.status) {
    case "resting":
      return false;
    case "thirsty":
      return true;
    case "ok":
      return addDays(plant.lastWatered, plant.intervalDays) <= today;
    default: {
      const unknownStatus: never = plant.status;
      throw new Error(`unknown status ${unknownStatus}`);
    }
  }
}

// The plants that need water on `today`, in their order.
export function dueToday(plants: Plant[], today: string): Plant[] {
  return plants.filter((plant) => isDue(plant, today));
}

// A new list where every plant whose id is in `ids` is replaced by a copy with lastWatered = today
// and status "ok". The other plants stay the same objects; unknown ids are ignored; nothing passed
// in is changed. The list can hold thousands of plants and `ids` hundreds of ids.
// A Set makes each membership check one lookup instead of a scan through `ids`.
export function waterPlants(plants: Plant[], ids: string[], today: string): Plant[] {
  const watered = new Set(ids);
  return plants.map((plant) => (watered.has(plant.id) ? { ...plant, lastWatered: today, status: "ok" } : plant));
}
