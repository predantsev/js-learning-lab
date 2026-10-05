// How many units of a tool are still free on a day. Counting goes through every booking,
// so the answer is cached: the same question must be computed only once.
import { TOOLS } from "./catalog.js";
import { BOOKINGS } from "./bookings.js";

export const stats = { computed: 0 };
const cache = new Map();

export function freeUnits(toolId, day) {
  const key = { toolId, day };
  if (cache.has(key)) return cache.get(key);
  stats.computed++;
  const tool = TOOLS.find((item) => item.id === toolId);
  const booked = BOOKINGS.filter((booking) => booking.toolId === toolId && booking.day === day).length;
  const result = tool.units - booked;
  cache.set(key, result);
  return result;
}
