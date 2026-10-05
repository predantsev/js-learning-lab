export type Priority = "low" | "normal" | "high";

export interface Task {
  readonly id: string;
  title: string;
  dueDate: string | null;
  done: boolean;
  priority: Priority;
}

function isRecordLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

// Checks one stored task at runtime; null when it is not a valid task.
export function validateTask(input: unknown): Task | null {
  if (!isRecordLike(input)) {
    return null;
  }
  const { id, title, dueDate, done, priority } = input;
  if (
    typeof id === "string" &&
    typeof title === "string" &&
    (dueDate === null || typeof dueDate === "string") &&
    typeof done === "boolean" &&
    isPriority(priority)
  ) {
    return { id, title, dueDate, done, priority };
  }
  return null;
}

// "2026-03" for a due date, the no-date text when there is none.
export function dueMonth(task: Task): string {
  return task.dueDate?.slice(0, 7) ?? "%%noDate%%";
}

// high → 0, normal → 1, low → 2.
export function priorityRank(priority: Priority): number {
  switch (priority) {
    case "high":
      return 0;
    case "normal":
      return 1;
    case "low":
      return 2;
    default:
      return assertNever(priority);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${value}`);
}

// "<title> (<priority>)"
export function taskLabel(task: Task): string {
  const { title, priority } = task;
  return title + " (" + priority + ")";
}

// Only valid tasks; broken JSON or a non-array gives [].
function parseUnknown(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function loadTasks(text: string): Task[] {
  const data = parseUnknown(text);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item: unknown) => validateTask(item)).filter((task): task is Task => task !== null);
}
