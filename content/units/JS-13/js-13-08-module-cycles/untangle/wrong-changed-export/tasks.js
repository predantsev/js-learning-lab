import { checkPriority } from "./rules.js";

export const PRIORITIES = ["low", "normal", "high"];

export function createTask(id, title, priority) {
  checkPriority(priority);
  return { id, title, priority, done: false };
}
