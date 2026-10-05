export const PRIORITIES = ["low", "normal", "high"];

export const DEFAULT_PRIORITY = PRIORITIES[1];

export function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new RangeError("unknown priority: " + priority);
  }
}
