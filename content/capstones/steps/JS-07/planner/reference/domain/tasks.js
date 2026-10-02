// The rules of a task: pure functions and the starting data. No page and no storage here.

// The word for a priority value.
export function priorityText(priority) {
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
export function formatTaskLabel(task) {
  return task.title + " (" + (task.dueDate ?? "%%noDueDate%%") + ") · " + priorityText(task.priority);
}

// Checks a draft task. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateTask(input) {
  const errors = {};

  const title = (input.title ?? "").trim();
  if (title === "") {
    errors.title = "required";
  } else if (title.length > 80) {
    errors.title = "too-long";
  }

  // The three known priorities share one break; a missing priority is "normal".
  const priority = input.priority ?? "normal";
  switch (priority) {
    case "low":
    case "normal":
    case "high":
      break;
    default:
      errors.priority = "unknown";
  }

  if (errors.title !== undefined || errors.priority !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { title: title, dueDate: input.dueDate ?? null, priority: priority } };
}

// A new list with a new task at the end, if the draft passes the check; otherwise the same list.
// The draft may also carry the done flag.
export function addTask(list, id, input) {
  const check = validateTask(input);
  if (!check.ok) {
    return list;
  }
  const task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };
  return [...list, task];
}

// A new list in which the task with this id is replaced by a copy with the changes;
// the other tasks are the same objects.
export function updateTask(list, id, changes) {
  const result = [];
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
export function removeTask(list, id) {
  const result = [];
  for (const task of list) {
    if (task.id !== id) {
      result.push(task);
    }
  }
  return result;
}

// The tasks whose title contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every task.
export function searchTasks(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((task) => task.title.toLowerCase().includes(text));
}

// The pending ("pending") or the done ("done") tasks.
export function filterTasks(list, status) {
  const done = status === "done";
  return list.filter((task) => task.done === done);
}

// The place of a priority in the order: high first, then normal, then low.
function priorityRank(priority) {
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
function byDueDateThenPriority(a, b) {
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
export function sortTasks(list) {
  return list.toSorted(byDueDateThenPriority);
}

// How many pending tasks are due on or before the day; a task without a due date is never due.
// Dates are "YYYY-MM-DD" text, so comparing the text compares the dates.
export function countDueTasks(list, day) {
  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;
}

// The starting tasks of the list. This array never changes: every change makes a new list.
export const tasks = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
  { id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" },
  { id: "t-05", title: "%%fixture5Name%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  { id: "t-06", title: "%%fixture6Name%%", dueDate: "2026-03-05", done: true, priority: "low" },
];
