import { PRIORITIES } from "./tasks.js";

export const DEFAULT_PRIORITY = PRIORITIES[1];

export function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new RangeError("unknown priority: " + priority);
  }
}
