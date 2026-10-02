/* The list and its check live together, so this module imports nothing.
import { checkPriority } from "./rules.js"; (the old import) */
export const PRIORITIES = ["low", "normal", "high"]

export function checkPriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new RangeError("unknown priority: " + priority)
  }
}

export function createTask(id, title, priority) {
  checkPriority(priority)
  return { id, title, priority, done: false }
}
