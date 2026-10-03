// The page: drawing the habits, the form and the card buttons. The rules come from the domain
// module, saving and loading from the storage module, the starting habits from the data module.
import { frequencyText, validateHabit, filterHabits, sortHabitsByName, formatRates, indexById, searchHabits, paginate } from "../domain/habits.js";
import { formatDay } from "./format.js";
import { loadHabits } from "../storage/habits.js";
import { HabitRepository } from "../storage/repository.js";
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
let repository = null; // holds the list once it is known, and saves every change
let current = []; // the list the page shows now (a copy taken from the repository)
let editingId = null; // the habit in the form, or null for a new habit
let confirmingId = null; // the habit whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there
let loadState = "ready"; // "loading" while the starting habits are on their way, "failed" after an error
let loadController = null; // aborts the load of the starting habits when a newer load or start begins
let listeners = null; // aborts every listener of the page in teardown(); null while the page is off
let searchTimer = null; // the pending search of the search field, or null
let query = ""; // the search the list shows
let filter = "all"; // the value of the filter: "all" or a value the domain's filter function takes
let pages = null; // the generator of the pages of the shown list
let pagesShown = 1; // how many pages the list shows
let shownTotal = 0; // how many records match the search
const PAGE_SIZE = 4;
const SEARCH_DELAY = 300; // ms of quiet typing before the search runs
const lastDays = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];
const today = "2026-03-02"; // the day the "mark today" button records
let byId = new Map(); // the habits of `current` by id
const LOCALE = "%%formatLocale%%"; // the language of numbers and dates on the page

const form = document.querySelector("#habit-form");
const saveButton = document.querySelector("#habit-save");
const loadMessage = document.querySelector("#load-message");
const retryButton = document.querySelector("#retry-load");
const emptyText = document.querySelector("#empty-message");
const nameInput = document.querySelector("#habit-name");
const frequencyInput = document.querySelector("#habit-frequency");
const activeInput = document.querySelector("#habit-active");
const nameError = document.querySelector("#habit-name-error");
const statusText = document.querySelector("#status");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#habits");
const moreButton = document.querySelector("#show-more");
const searchInput = document.querySelector("#search");
const filterSelect = document.querySelector("#list-filter");

// A card button; its accessible name also names the habit, so every button is told apart.
function createButton(action, text, habit) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + ": " + habit.name);
  return button;
}

// One card. Every value goes in as text, so a name with markup stays text.
function createCard(habit) {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = habit.id;

  const title = document.createElement("h3");
  title.textContent = habit.name;
  const frequency = document.createElement("p");
  frequency.textContent = "%%valueLabel%%: " + frequencyText(habit.frequency);
  const completions = document.createElement("p");
  completions.textContent = "%%completionsLabel%%: " + habit.completions.length;
  card.append(title, frequency, completions);
  // The completions are sorted, so the last one is the latest day.
  if (habit.completions.length > 0) {
    const lastDone = document.createElement("p");
    lastDone.textContent = "%%lastDoneLabel%%: " + formatDay(habit.completions.at(-1), LOCALE);
    card.append(lastDone);
  }
  if (habit.completions.includes(today)) {
    const doneToday = document.createElement("p");
    doneToday.textContent = "%%doneTodayMark%%";
    card.append(doneToday);
  }

  if (habit.active === false) {
    const badge = document.createElement("p");
    badge.className = "badge";
    badge.textContent = "%%pausedMark%%";
    card.append(badge);
  }

  if (habit.id === confirmingId) {
    const question = document.createElement("p");
    question.textContent = "%%confirmQuestion%%";
    card.append(question, createButton("confirm-delete", "%%confirmDeleteLabel%%", habit), createButton("cancel-delete", "%%cancelLabel%%", habit));
  } else {
    card.append(createButton("mark-today", "%%markTodayLabel%%", habit), createButton("edit", "%%editLabel%%", habit), createButton("delete", "%%deleteLabel%%", habit));
  }
  return card;
}

// Draws the cards and the completion rates again from the current list. An empty list says so,
// but only once the list is ready: while it loads or after an error it is not known to be empty.
function render() {
  byId = indexById(current);
  showPages();
  emptyText.hidden = !(loadState === "ready" && current.length === 0);
  if (loadState !== "ready") {
    summaryText.textContent = "";
    return;
  }
  summaryText.textContent = formatRates(sortHabitsByName(filterHabits(current, "active")), lastDays);
}

// The list the page shows: the habits that pass the filter and match the search, in pages of
// PAGE_SIZE. Every render starts a new generator and takes as many pages as were shown before;
// the old generator is closed.
function showPages() {
  pages?.return();
  const filtered = filter === "all" ? current : filterHabits(current, filter);
  const shown = searchHabits(filtered, query);
  shownTotal = shown.length;
  pages = paginate(shown, PAGE_SIZE);
  const cards = [];
  for (let page = 0; page < pagesShown; page += 1) {
    const next = pages.next();
    if (next.done) {
      break;
    }
    cards.push(...next.value.map(createCard));
  }
  list.replaceChildren(...cards);
  moreButton.hidden = cards.length >= shownTotal;
}

// "Show more": the next page of the same generator goes under the cards already shown.
function showMore() {
  const next = pages.next();
  if (!next.done) {
    pagesShown += 1;
    list.append(...next.value.map(createCard));
  }
  moreButton.hidden = list.children.length >= shownTotal;
}

// The search runs when typing has been quiet for SEARCH_DELAY ms: every input cancels the timer
// of the previous one and sets a new one (debounce). A new search starts again from the first page.
function onSearchInput() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchTimer = null;
    query = searchInput.value;
    pagesShown = 1;
    render();
  }, SEARCH_DELAY);
}

// A new filter shows its records from the first page; it needs no pause, a choice is one event.
function onFilterChange() {
  filter = filterSelect.value;
  pagesShown = 1;
  render();
}

// Shows a state of the starting list: its message, the retry button only after an error, and the
// Save button only when the list is ready (so a new habit never lands in a list that is replaced).
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

// Loads the starting habits and moves the page through the states: loading, then ready or failed.
// A newer load or start aborts this one, and an aborted load changes nothing on the page.
async function loadStartingList() {
  loadController?.abort();
  const controller = new AbortController();
  loadController = controller;
  current = [];
  showLoadState("loading", "%%loadingMessage%%");
  try {
    useList(await loadFixtures(controller.signal));
    showLoadState("ready", "");
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }
    showLoadState("failed", loadErrorText(error));
  }
}

// A new repository for a list that has just become known (saved or starting habits).
function useList(records) {
  repository = new HabitRepository(store, records);
  current = repository.items;
}

// After every change of the repository (which has already saved it) the page draws the new list.
function refresh() {
  current = repository.items;
  render();
}

// An id that no habit of the current list has yet (saved habits may already use "h-7").
function newId() {
  let number = current.length + 1;
  while (current.some((one) => one.id === "h-" + number)) {
    number += 1;
  }
  return "h-" + number;
}

// The button with this action in the card of this habit.
function cardButton(id, action) {
  return list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
}

// The draft in the form.
function readForm() {
  return {
    name: nameInput.value,
    frequency: frequencyInput.value,
    active: activeInput.checked,
  };
}

function showErrors(errors) {
  nameError.textContent = messageFor(errors.name);
}

function onSubmit(event) {
  event.preventDefault();
  const input = readForm();
  const check = validateHabit(input);
  if (!check.ok) {
    showErrors(check.errors);
    nameInput.focus();
    return;
  }
  showErrors({});
  if (editingId === null) {
    repository.add(newId(), input);
  } else {
    repository.update(editingId, { name: check.value.name, frequency: check.value.frequency, active: input.active });
    editingId = null;
  }
  refresh();
  form.reset();
  nameInput.focus();
}

// One handler on the list serves the buttons of every card, also of cards added later.
function onListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("[data-id]").dataset.id;
  const action = button.dataset.action;

  if (action === "mark-today") {
    // Called as a method of the repository, so `this` inside it is the repository.
    repository.markCompleted(id, today);
    refresh();
    cardButton(id, "mark-today").focus();
  } else if (action === "edit") {
    const habit = byId.get(id);
    editingId = id;
    nameInput.value = habit.name;
    frequencyInput.value = habit.frequency;
    activeInput.checked = habit.active;
    nameInput.focus();
  } else if (action === "delete") {
    confirmingId = id;
    render();
    cardButton(id, "cancel-delete").focus();
  } else if (action === "cancel-delete") {
    confirmingId = null;
    render();
    cardButton(id, "delete").focus();
  } else if (action === "confirm-delete") {
    // The place of the card among the cards shown (a search or the pages may hide some).
    const index = [...list.children].indexOf(button.closest("[data-id]"));
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    repository.remove(id);
    refresh();
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
}

// After a failed load the same request is made again.
function retryLoad() {
  loadStartingList();
}

// Switches on every listener of the page with one signal, so teardown() can switch them all off
// with one call.
function listen() {
  listeners = new AbortController();
  const signal = listeners.signal;
  form.addEventListener("submit", onSubmit, { signal });
  list.addEventListener("click", onListClick, { signal });
  retryButton.addEventListener("click", retryLoad, { signal });
  moreButton.addEventListener("click", showMore, { signal });
  searchInput.addEventListener("input", onSearchInput, { signal });
  filterSelect.addEventListener("change", onFilterChange, { signal });
}

// Switches the page off: every listener, the search timer, the page generator and a load that is
// still running. A second call finds nothing to do (listeners is null), so it is safe to repeat.
export function teardown() {
  if (listeners === null) {
    return;
  }
  listeners.abort();
  listeners = null;
  clearTimeout(searchTimer);
  searchTimer = null;
  pages?.return();
  pages = null;
  loadController?.abort();
  loadController = null;
}

// Loads the saved habits and draws the page. Saved habits win and need no request. Without them,
// and instead of damaged saved data, the page loads the starting habits; damaged data is never
// shown, the page says so, and the storage module has kept a copy of the saved text under the
// backup key.
export function start(storage) {
  teardown(); // a restart never doubles the listeners
  listen();
  store = storage;
  query = "";
  searchInput.value = "";
  filter = "all";
  filterSelect.value = "all";
  pagesShown = 1;
  loadController?.abort(); // a load of an earlier start must not change this page
  const result = loadHabits(storage);
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  if (result.ok) {
    useList(result.habits);
    showLoadState("ready", "");
  } else {
    loadStartingList();
  }
}
