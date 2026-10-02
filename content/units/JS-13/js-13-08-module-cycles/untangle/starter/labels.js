import { PRIORITIES } from "./tasks.js";
import { DEFAULT_PRIORITY } from "./rules.js";

export function describeTask(task) {
  const level = PRIORITIES.indexOf(task.priority) + 1;
  const mark = task.priority === DEFAULT_PRIORITY ? "" : " !";
  return `${task.title} (${level}/${PRIORITIES.length})${mark}`;
}
