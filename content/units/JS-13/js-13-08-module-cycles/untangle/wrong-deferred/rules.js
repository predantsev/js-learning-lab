import { PRIORITIES } from "./tasks.js";

export const DEFAULT_PRIORITY = "normal";

export function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new RangeError("unknown priority: " + priority);
  }
}
