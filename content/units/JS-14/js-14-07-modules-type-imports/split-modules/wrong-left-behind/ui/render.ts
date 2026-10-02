// What the page shows for a task: renderTask.
import type { Task } from "../domain/types.ts";

export function renderTask(task: Task): string {
  return `${task.done ? "[x]" : "[ ]"} ${task.title} (${task.priority})`;
}
