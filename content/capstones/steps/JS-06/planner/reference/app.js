// The project script. It runs after the page has loaded.
// The rules of a task live in pure functions: they get data and return a result.
// The page is drawn from the data by render(); the form and the card buttons compute a new
// list with the pure functions, and render() draws the page again from it.
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
// The draft may also carry the done flag.
function addTask(list, id, input) {
  const check = validateTask(input);
  if (!check.ok) {
    return list;
  }
  const task = { id: id, title: check.value.title, dueDate: check.value.dueDate, done: input.done === true, priority: check.value.priority };
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

// The starting tasks of the list. This array never changes: every change makes a new list.
const tasks = [
  { id: "t-01", title: "%%fixture1Name%%", dueDate: "2026-03-02", done: false, priority: "normal" },
  { id: "t-02", title: "%%fixture2Name%%", dueDate: "2026-03-01", done: false, priority: "high" },
  { id: "t-03", title: "%%fixture3Name%%", dueDate: null, done: false, priority: "low" },
  { id: "t-04", title: "%%fixture4Name%%", dueDate: "2026-02-27", done: true, priority: "high" },
  { id: "t-05", title: "%%fixture5Name%%", dueDate: "2026-03-10", done: false, priority: "normal" },
  { id: "t-06", title: "%%fixture6Name%%", dueDate: "2026-03-05", done: true, priority: "low" },
];

// The state of the page.
let current = tasks; // the list the page shows now
let nextNumber = 7; // the number in the id of the next new task
let editingId = null; // the task in the form, or null for a new task
let confirmingId = null; // the task whose delete waits for a confirmation
const today = "2026-03-02";

const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const dueDateInput = document.querySelector("#task-due-date");
const priorityInput = document.querySelector("#task-priority");
const doneInput = document.querySelector("#task-done");
const titleError = document.querySelector("#task-title-error");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#tasks");

// A card button; its accessible name also names the task, so every button is told apart.
function createButton(action, text, task) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + ": " + task.title);
  return button;
}

// One card. Every value goes in as text, so a title with markup stays text.
function createCard(task) {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = task.id;

  const title = document.createElement("h3");
  title.textContent = task.title;
  const due = document.createElement("p");
  due.textContent = "%%valueLabel%%: " + (task.dueDate ?? "%%noDueDate%%");
  const priority = document.createElement("p");
  priority.textContent = "%%priorityFieldLabel%%: " + priorityText(task.priority);
  card.append(title, due, priority);

  if (task.done) {
    const badge = document.createElement("p");
    badge.className = "badge";
    badge.textContent = "%%doneMark%%";
    card.append(badge);
  }

  if (task.id === confirmingId) {
    const question = document.createElement("p");
    question.textContent = "%%confirmQuestion%%";
    card.append(question, createButton("confirm-delete", "%%confirmDeleteLabel%%", task), createButton("cancel-delete", "%%cancelLabel%%", task));
  } else {
    card.append(createButton("edit", "%%editLabel%%", task), createButton("delete", "%%deleteLabel%%", task));
  }
  return card;
}

// Draws the cards and the due count again from the current list.
function render() {
  list.replaceChildren(...current.map(createCard));
  summaryText.textContent = "%%dueSummary%% " + today + ": " + countDueTasks(current, today);
}

// The button with this action in the card of this task.
function cardButton(id, action) {
  return list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
}

// The draft in the form. An empty date field means "no due date".
function readForm() {
  return {
    title: titleInput.value,
    dueDate: dueDateInput.value === "" ? null : dueDateInput.value,
    priority: priorityInput.value,
    done: doneInput.checked,
  };
}

function showErrors(errors) {
  titleError.textContent = messageFor(errors.title);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  const check = validateTask(input);
  if (!check.ok) {
    showErrors(check.errors);
    titleInput.focus();
    return;
  }
  showErrors({});
  if (editingId === null) {
    current = addTask(current, "t-" + nextNumber, input);
    nextNumber += 1;
  } else {
    current = updateTask(current, editingId, { title: check.value.title, dueDate: check.value.dueDate, priority: check.value.priority, done: input.done });
    editingId = null;
  }
  form.reset();
  render();
  titleInput.focus();
});

// One handler on the list serves the buttons of every card, also of cards added later.
list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("[data-id]").dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    const task = current.find((one) => one.id === id);
    editingId = id;
    titleInput.value = task.title;
    dueDateInput.value = task.dueDate ?? "";
    priorityInput.value = task.priority;
    doneInput.checked = task.done;
    titleInput.focus();
  } else if (action === "delete") {
    confirmingId = id;
    render();
    cardButton(id, "cancel-delete").focus();
  } else if (action === "cancel-delete") {
    confirmingId = null;
    render();
    cardButton(id, "delete").focus();
  } else if (action === "confirm-delete") {
    const index = current.findIndex((one) => one.id === id);
    current = removeTask(current, id);
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    render();
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

render();
