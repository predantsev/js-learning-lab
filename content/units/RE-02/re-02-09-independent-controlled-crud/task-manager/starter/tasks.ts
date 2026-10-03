// The rules of a task, as in the project: types and the validator. Read-only.

export type Priority = "low" | "normal" | "high";

export type Task = {
  readonly id: string;
  title: string;
  dueDate: string | null; // a calendar date "YYYY-MM-DD", or null when the task has no due date
  done: boolean;
  priority: Priority;
};

// A draft from the form: every field may be missing, and a priority is any text until it is checked.
export type TaskDraft = {
  title?: string;
  dueDate?: string | null;
  priority?: string;
  done?: boolean;
};

export type TaskErrorKey = "required" | "too-long" | "unknown" | "bad-date";

export type TaskErrors = {
  title?: TaskErrorKey;
  priority?: TaskErrorKey;
  dueDate?: TaskErrorKey;
};

// The result of validateTask: exactly one of the two shapes; `ok` tells them apart.
export type ValidationResult =
  | { ok: true; value: { title: string; dueDate: string | null; priority: Priority } }
  | { ok: false; errors: TaskErrors };

export type TaskStatus = "pending" | "done";

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

// A type predicate: true only for the three known priorities, and then tsc treats the text as a
// Priority.
export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

// Checks a draft task. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateTask(input: TaskDraft): ValidationResult {
  const errors: TaskErrors = {};

  const title = (input.title ?? "").trim();
  if (title === "") {
    errors.title = "required";
  } else if (title.length > 80) {
    errors.title = "too-long";
  }

  // A missing priority is "normal"; any other text than the three priorities is unknown.
  const priority = input.priority ?? "normal";
  if (!isPriority(priority)) {
    errors.priority = "unknown";
  }

  // A due date is a plain calendar date "YYYY-MM-DD" or null: no time and no time zone.
  const dueDate = input.dueDate ?? null;
  if (dueDate !== null && !isCalendarDate(dueDate)) {
    errors.dueDate = "bad-date";
  }

  // !isPriority(priority) is checked here again so that tsc knows the priority below is a Priority.
  if (errors.title !== undefined || errors.dueDate !== undefined || !isPriority(priority)) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { title: title, dueDate: dueDate, priority: priority } };
}

// The text shown for every error key.
export const MESSAGES: Record<TaskErrorKey, string> = {
  required: "%%required%%",
  "too-long": "%%tooLong%%",
  unknown: "%%unknownPriority%%",
  "bad-date": "%%badDate%%",
};

// The starting tasks of the planner.
export const startTasks: Task[] = [
  { id: "t-01", title: "%%waterPlants%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%libraryBooks%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-03", title: "%%grandma%%", dueDate: null, done: false, priority: "low" },
  { id: "t-04", title: "%%payBill%%", dueDate: "2026-02-27", done: true, priority: "high" },
];

let nextNumber = 5;

// A fresh id for a new task: "t-05", "t-06", …
export function nextTaskId(): string {
  const id = "t-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return id;
}
