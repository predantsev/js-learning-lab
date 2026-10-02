// The plant-care model: types and pure functions, no page and no storage.
// A plant: id (text), name (text), location (text), intervalDays (a whole number of days, 1 to 365),
// lastWatered ("YYYY-MM-DD"), status: "ok", "thirsty" or "resting".
import { addDays } from "./clock.js";

// Write the types here: the status union and the plant.

// The valid plants from data of unknown shape, in their order; anything that is not an array gives [].
// A valid plant has every field above with the right type: id and name are not empty after trimming,
// intervalDays is a whole number from 1 to 365, lastWatered looks like "YYYY-MM-DD", status is one of three.
// Each kept plant is a new object with exactly these six fields.
export function parsePlants(input: unknown) {}

// Whether the plant needs water on `today`: a resting plant never does, a thirsty one always does,
// an "ok" one does from the day its interval has passed since lastWatered (that day included).
export function isDue(plant, today) {}

// The plants that need water on `today`, in their order.
export function dueToday(plants, today) {}

// A new list where every plant whose id is in `ids` is replaced by a copy with lastWatered = today
// and status "ok". The other plants stay the same objects; unknown ids are ignored; nothing passed
// in is changed. The list can hold thousands of plants and `ids` hundreds of ids.
export function waterPlants(plants, ids, today) {}
