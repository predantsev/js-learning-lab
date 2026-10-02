// TODO: move each part into its module, then import it here.

// -> domain/types.ts
type Priority = "low" | "normal" | "high";

type Task = {
  readonly id: string;
  title: string;
  priority: Priority;
  done: boolean;
};

// -> domain/validate.ts
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

// -> ui/render.ts
function renderTask(task: Task): string {
  return `${task.done ? "[x]" : "[ ]"} ${task.title} (${task.priority})`;
}

// stays here
const tasks: Task[] = [
  { id: "t-02", title: "%%books%%", priority: "high", done: false },
  { id: "t-04", title: "%%internet%%", priority: "high", done: true },
];

for (const task of tasks) {
  console.log(renderTask(task));
}
console.log(isPriority("urgent"), validateTitle("   "));
