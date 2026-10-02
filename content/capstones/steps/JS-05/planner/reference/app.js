// The project script. It runs after the page has loaded.
// The rules of a task live in pure functions: they get data and return a result.
// The list functions return new arrays and never change the list or the tasks they receive;
// search, filter, sort and the due count are transformations of the list.
// The lines at the end only call them and write the results onto the page.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// The word for a priority value.
function priorityText(priority) {
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
function formatTaskLabel(task) {
  return task.title + " (" + (task.dueDate ?? "%%noDueDate%%") + ") · " + priorityText(task.priority);
}

// Checks a draft task. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateTask(input) {
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

// The text the page shows for an error key; no key means no message.
function messageFor(errorKey) {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "unknown":
      return "%%invalidMessage%%";
    default:
      return "";
  }
}

// A new list with a new task at the end, if the draft passes the check; otherwise the same list.
function addTask(list, id, input) {
  const check = validateTask(input);
  if (!check.ok) {
    return list;
  }
  const task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: false, priority: check.value.priority };
  return [...list, task];
}

// A new list in which the task with this id is replaced by a copy with the changes;
// the other tasks are the same objects.
function updateTask(list, id, changes) {
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
function removeTask(list, id) {
  const result = [];
  for (const task of list) {
    if (task.id !== id) {
      result.push(task);
    }
  }
  return result;
}

// The labels of all tasks of a list as one text.
function formatList(list) {
  let text = "";
  for (const task of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + formatTaskLabel(task);
  }
  return text;
}

// The tasks whose title contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every task.
function searchTasks(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((task) => task.title.toLowerCase().includes(text));
}

// The pending ("pending") or the done ("done") tasks.
function filterTasks(list, status) {
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
function sortTasks(list) {
  return list.toSorted(byDueDateThenPriority);
}

// How many pending tasks are due on or before the day; a task without a due date is never due.
// Dates are "YYYY-MM-DD" text, so comparing the text compares the dates.
function countDueTasks(list, day) {
  return list.filter((task) => !task.done && task.dueDate !== null && task.dueDate.localeCompare(day) <= 0).length;
}

// The tasks of the list and a draft of a new one, as a form will send it later.
const tasks = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
  { id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" },
  { id: "t-05", title: "%%fixture5Name%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  { id: "t-06", title: "%%fixture6Name%%", dueDate: "2026-03-05", done: true, priority: "low" },
];
const draft = { title: "", dueDate: null, priority: "urgent" };

// The page only calls the functions and shows what they return; tasks itself never changes.
const today = "2026-03-02";
const draftCheck = validateTask(draft);
document.querySelector("#summary").textContent = "%%dueSummary%% " + today + ": " + countDueTasks(tasks, today);
document.querySelector("#pending").textContent = formatList(sortTasks(filterTasks(tasks, "pending")));
document.querySelector("#search").textContent = formatList(searchTasks(tasks, "%%searchQuery%%"));
document.querySelector("#title-message").textContent = messageFor(draftCheck.errors?.title);
document.querySelector("#priority-message").textContent = messageFor(draftCheck.errors?.priority);
