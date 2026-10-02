import { checkPriority, PRIORITIES } from "./rules.js";

export { PRIORITIES };

export function createTask(id, title, priority) {
  checkPriority(priority);
  return { id, title, priority, done: false };
}
