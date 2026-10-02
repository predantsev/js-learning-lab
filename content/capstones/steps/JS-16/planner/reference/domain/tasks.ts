// The rules of a task: pure functions with types. No page and no storage here; the starting tasks
// are in data/tasks.json. The types exist only for tsc: the platform and Node.js remove them before
// running, so a value that comes from outside (storage, a file) is still checked at runtime.

// ---------- types ----------

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

// ---------- rules ----------

// The word for a priority value.
export function priorityText(priority: Priority): string {
  switch (priority) {
    case "low":
      return "%%priorityLow%%";
    case "normal":
      return "%%priorityNormal%%";
    case "high":
      return "%%priorityHigh%%";
    default:
      return "";
  }
}

// The label of a task: the title, the due date (or a fallback text) in brackets and the priority in words.
export function formatTaskLabel(task: Task): string {
  return task.title + " (" + (task.dueDate ?? "%%noDueDate%%") + ") · " + priorityText(task.priority);
}

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

// A new list with a new task at the end, if the draft passes the check; otherwise the same list.
// The draft may also carry the done flag.
export function addTask(list: Task[], id: string, input: TaskDraft): Task[] {
  const check = validateTask(input);
  if (!check.ok) {
    return list;
  }
  const task: Task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };
  return [...list, task];
}

// A new list in which the task with this id is replaced by a copy with the changes;
// the other tasks are the same objects. The id itself cannot be changed.
export function updateTask(list: Task[], id: string, changes: Partial<Omit<Task, "id">>): Task[] {
  const result: Task[] = [];
  for (const task of list) {
    if (task.id === id) {
      result.push({ ...task, ...changes });
    } else {
      result.push(task);
    }
  }
  return result;
}

// A new list without the task with this id.
export function removeTask(list: Task[], id: string): Task[] {
  const result: Task[] = [];
  for (const task of list) {
    if (task.id !== id) {
      result.push(task);
    }
  }
  return result;
}

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text: string): string {
  return text.normalize("NFC").trim().toLowerCase();
}

// The tasks whose title contains the query; both sides are compared by their search key. An empty
// query keeps every task.
export function searchTasks(list: Task[], query: string): Task[] {
  const wanted = searchKey(query);
  return list.filter((task) => searchKey(task.title).includes(wanted));
}

// The pending ("pending") or the done ("done") tasks.
export function filterTasks(list: Task[], status: TaskStatus): Task[] {
  const done = status === "done";
  return list.filter((task) => task.done === done);
}

// The place of a priority in the order: high first, then normal, then low.
function priorityRank(priority: Priority): number {
  switch (priority) {
    case "high":
      return 0;
    case "normal":
      return 1;
    default:
      return 2;
  }
}

// Comparator: earlier due dates first, tasks without a due date after all dated ones;
// the same due date is ordered by priority. Equal tasks return 0 and keep their order.
function byDueDateThenPriority(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) {
      return 1;
    }
    if (b.dueDate === null) {
      return -1;
    }
    return a.dueDate.localeCompare(b.dueDate);
  }
  return priorityRank(a.priority) - priorityRank(b.priority);
}

// A sorted copy; the received list keeps its order.
export function sortTasks(list: Task[]): Task[] {
  return list.toSorted(byDueDateThenPriority);
}

// How many pending tasks are due on or before the day; a task without a due date is never due.
// Dates are "YYYY-MM-DD" text, so comparing the text compares the dates. Inside the filter tsc
// narrows dueDate: after `task.dueDate !== null` it is a string, so localeCompare is allowed.
export function countDueTasks(list: Task[], day: string): number {
  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;
}

// An index by id: a Map from id to record, so a record is found without a pass over the list. It
// is generic: it works for any records with a text id, and the Map keeps their type. If two
// records share an id, the first one stays in the index.
export function indexById<T extends { readonly id: string }>(list: readonly T[]): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of list) {
    if (!index.has(item.id)) {
      index.set(item.id, item);
    }
  }
  return index;
}

// The priorities in use, each once, in the order they first appear.
export function prioritiesInUse(list: Task[]): Set<Priority> {
  const priorities = new Set<Priority>();
  for (const task of list) {
    priorities.add(task.priority);
  }
  return priorities;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate<T>(items: readonly T[], size: number): Generator<T[]> {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}
