import { isPriority, validateTitle } from "./domain/validate.ts";
import { renderTask } from "./ui/render.ts";
import type { Task } from "./domain/types.ts";

const tasks: Task[] = [
  { id: "t-02", title: "%%books%%", priority: "high", done: false },
  { id: "t-04", title: "%%internet%%", priority: "high", done: true },
];

for (const task of tasks) {
  console.log(renderTask(task));
}
console.log(isPriority("urgent"), validateTitle("   "));
