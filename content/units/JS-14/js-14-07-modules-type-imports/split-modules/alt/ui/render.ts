// What the page shows for a task: renderTask.
import { type Task } from "../domain/types.ts";

export function renderTask({ done, title, priority }: Task): string {
  const box = done ? "[x]" : "[ ]";
  return `${box} ${title} (${priority})`;
}
