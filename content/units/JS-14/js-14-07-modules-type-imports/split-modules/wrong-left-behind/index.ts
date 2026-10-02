import type { Priority, Task } from "./domain/types.ts";
import { renderTask } from "./ui/render.ts";

function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed === "") {
    return "required";
  }
  return trimmed.length > 80 ? "too-long" : null;
}

const tasks: Task[] = [
  { id: "t-02", title: "%%books%%", priority: "high", done: false },
  { id: "t-04", title: "%%internet%%", priority: "high", done: true },
];

for (const task of tasks) {
  console.log(renderTask(task));
}
console.log(isPriority("urgent"), validateTitle("   "));
