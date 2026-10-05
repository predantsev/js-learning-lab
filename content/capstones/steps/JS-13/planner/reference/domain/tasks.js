// The rules of a task: pure functions. No page and no storage here; the starting tasks are in
// data/tasks.json.

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

// A calendar date is text of exactly the form "YYYY-MM-DD": the anchors ^ and $ refuse anything
// before or after it, such as a time.
export function isCalendarDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
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

  // A due date is a plain calendar date "YYYY-MM-DD" or null: no time and no time zone.
  const dueDate = input.dueDate ?? null;
  if (dueDate !== null && !isCalendarDate(dueDate)) {
    errors.dueDate = "bad-date";
  }

  if (errors.title !== undefined || errors.priority !== undefined || errors.dueDate !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { title: title, dueDate: dueDate, priority: priority } };
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

// The search key of a text: one Unicode form (NFC), no spaces at the edges, lower case. Two texts
// that look the same on screen get the same key, however they were typed.
export function searchKey(text) {
  return text.normalize("NFC").trim().toLowerCase();
}

// The tasks whose title contains the query; both sides are compared by their search key. An empty
// query keeps every task.
export function searchTasks(list, query) {
  const wanted = searchKey(query);
  return list.filter((task) => searchKey(task.title).includes(wanted));
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
// An index of the tasks by id: a Map from id to task, so a task is found without a pass over the
// list. If two tasks share an id, the first one stays in the index.
export function indexById(list) {
  const index = new Map();
  for (const task of list) {
    if (!index.has(task.id)) {
      index.set(task.id, task);
    }
  }
  return index;
}

// The priorities in use, each once, in the order they first appear.
export function prioritiesInUse(list) {
  const priorities = new Set();
  for (const task of list) {
    priorities.add(task.priority);
  }
  return priorities;
}

// The items in pages of `size`, one page at a time: the generator builds a page only when the next
// one is asked for, so a page that is never shown is never built. An empty list yields no page.
export function* paginate(items, size) {
  for (let start = 0; start < items.length; start += size) {
    yield items.slice(start, start + size);
  }
}
