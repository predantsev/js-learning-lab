// The page: drawing the tasks, the form and the card buttons. The rules come from the domain
// module, saving and loading from the storage module, the starting tasks from the data module.
import { priorityText, validateTask, addTask, updateTask, removeTask, countDueTasks } from "../domain/tasks.js";
import { loadTasks, saveTasks } from "../storage/tasks.js";
import { loadFixtures } from "../data/fixtures.js";

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

// The state of the page.
let current = []; // the list the page shows now
let editingId = null; // the task in the form, or null for a new task
let confirmingId = null; // the task whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there
let loadState = "ready"; // "loading" while the starting tasks are on their way, "failed" after an error
let loadController = null; // aborts the load of the starting tasks when a newer load or start begins
const today = "2026-03-02";

const form = document.querySelector("#task-form");
const saveButton = document.querySelector("#task-save");
const loadMessage = document.querySelector("#load-message");
const retryButton = document.querySelector("#retry-load");
const emptyText = document.querySelector("#empty-message");
const titleInput = document.querySelector("#task-title");
const dueDateInput = document.querySelector("#task-due-date");
const priorityInput = document.querySelector("#task-priority");
const doneInput = document.querySelector("#task-done");
const titleError = document.querySelector("#task-title-error");
const statusText = document.querySelector("#status");
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

// Draws the cards and the due count again from the current list. An empty list says so, but only
// once the list is ready: while it loads or after an error it is not known to be empty.
function render() {
  list.replaceChildren(...current.map(createCard));
  emptyText.hidden = !(loadState === "ready" && current.length === 0);
  if (loadState !== "ready") {
    summaryText.textContent = "";
    return;
  }
  summaryText.textContent = "%%dueSummary%% " + today + ": " + countDueTasks(current, today);
}

// Shows a state of the starting list: its message, the retry button only after an error, and the
// Save button only when the list is ready (so a new task never lands in a list that is replaced).
function showLoadState(state, message) {
  loadState = state;
  loadMessage.textContent = message;
  retryButton.hidden = state !== "failed";
  saveButton.disabled = state !== "ready";
  render();
}

// The message for a failed load: the status of an answer that is not ok, no connection (fetch
// rejects with a TypeError), or a damaged file.
function loadErrorText(error) {
  if (error.status !== undefined) {
    return "%%loadHttpError%% " + error.status;
  }
  if (error instanceof TypeError) {
    return "%%loadNetworkError%%";
  }
  return "%%loadDataError%%";
}

// Loads the starting tasks and moves the page through the states: loading, then ready or failed.
// A newer load or start aborts this one, and an aborted load changes nothing on the page.
async function loadStartingList() {
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  current = [];
  showLoadState("loading", "%%loadingMessage%%");
  try {
    current = await loadFixtures(controller.signal);
    showLoadState("ready", "");
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    showLoadState("failed", loadErrorText(error));
  }
}

// Every change goes through here: the new list is saved and drawn.
function change(next) {
  current = next;
  saveTasks(store, current);
  render();
}

// An id that no task of the current list has yet (saved tasks may already use "t-7").
function newId() {
  let number = current.length + 1;
  while (current.some((one) => one.id === "t-" + number)) {
    number += 1;
  }
  return "t-" + number;
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
    change(addTask(current, newId(), input));
  } else {
    change(updateTask(current, editingId, { title: check.value.title, dueDate: check.value.dueDate, priority: check.value.priority, done: input.done }));
    editingId = null;
  }
  form.reset();
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
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    change(removeTask(current, id));
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

// After a failed load the same request is made again.
retryButton.addEventListener("click", () => {
  loadStartingList();
});

// Loads the saved tasks and draws the page. Saved tasks win and need no request. Without them,
// and instead of damaged saved data, the page loads the starting tasks; damaged data is never
// shown, the page says so, and the storage module has kept a copy of the saved text under the
// backup key.
export function start(storage) {
  store = storage;
  loadController?.abort(); // a load of an earlier start must not change this page
  const result = loadTasks(storage);
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  if (result.ok) {
    current = result.tasks;
    showLoadState("ready", "");
  } else {
    loadStartingList();
  }
}
