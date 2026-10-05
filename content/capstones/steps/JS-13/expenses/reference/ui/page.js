// The page: drawing the expenses, the form and the card buttons. The rules come from the domain
// module, loading from the storage module, the starting expenses from the data module; every
// change goes through the repository, which also saves it.
import { formatAmount, validateExpense, categoryText, parseAmountMinor, totalsByCategory, indexById, searchExpenses, paginate, filterExpenses } from "../domain/expenses.js";
import { formatMoney } from "./format.js";
import { loadExpenses } from "../storage/expenses.js";
import { ExpenseRepository } from "../storage/repository.js";
import { loadFixtures } from "../data/fixtures.js";

// The text the page shows for an error key; no key means no message.
function messageFor(errorKey) {
  switch (errorKey) {
    case "required":
      return "%%labelRequiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "not-positive-integer":
      return "%%invalidMessage%%";
    case "unknown":
      return "%%requiredMessage%%";
    case "bad-date":
      return "%%badDateMessage%%";
    default:
      return "";
  }
}

// The state of the page.
let repository = null; // holds the list once it is known, and saves every change
let current = []; // the list the page shows now (a copy taken from the repository)
let byId = new Map(); // the expenses of `current` by id
const LOCALE = "%%formatLocale%%"; // the language of numbers and dates on the page
let editingId = null; // the expense in the form, or null for a new expense
let confirmingId = null; // the expense whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there
let loadState = "ready"; // "loading" while the starting expenses are on their way, "failed" after an error
let loadController = null; // aborts the load of the starting expenses when a newer load or start begins
let listeners = null; // aborts every listener of the page in teardown(); null while the page is off
let searchTimer = null; // the pending search of the search field, or null
let query = ""; // the search the list shows
let filter = "all"; // the value of the filter: "all" or a value the domain's filter function takes
let pages = null; // the generator of the pages of the shown list
let pagesShown = 1; // how many pages the list shows
let shownTotal = 0; // how many records match the search
const PAGE_SIZE = 4;
const SEARCH_DELAY = 300; // ms of quiet typing before the search runs

const form = document.querySelector("#expense-form");
const saveButton = document.querySelector("#expense-save");
const loadMessage = document.querySelector("#load-message");
const retryButton = document.querySelector("#retry-load");
const emptyText = document.querySelector("#empty-message");
const labelInput = document.querySelector("#expense-label");
const amountInput = document.querySelector("#expense-amount");
const dateInput = document.querySelector("#expense-date");
const categoryInput = document.querySelector("#expense-category");
const labelError = document.querySelector("#expense-label-error");
const amountError = document.querySelector("#expense-amount-error");
const categoryError = document.querySelector("#expense-category-error");
const dateError = document.querySelector("#expense-date-error");
const statusText = document.querySelector("#status");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#expenses");
const moreButton = document.querySelector("#show-more");
const searchInput = document.querySelector("#search");
const filterSelect = document.querySelector("#list-filter");

// A card button; its accessible name also names the expense, so every button is told apart.
function createButton(action, text, expense) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + ": " + expense.label);
  return button;
}

// One card. Every value goes in as text, so a label with markup stays text.
function createCard(expense) {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = expense.id;

  const title = document.createElement("h3");
  title.textContent = expense.label;
  const amount = document.createElement("p");
  amount.textContent = formatMoney(expense.amountMinor, LOCALE);
  const date = document.createElement("p");
  date.textContent = "%%dateFieldLabel%%: " + expense.date;
  const category = document.createElement("p");
  category.textContent = "%%categoryFieldLabel%%: " + categoryText(expense.category);
  card.append(title, amount, date, category);

  if (expense.id === confirmingId) {
    const question = document.createElement("p");
    question.textContent = "%%confirmQuestion%%";
    card.append(question, createButton("confirm-delete", "%%confirmDeleteLabel%%", expense), createButton("cancel-delete", "%%cancelLabel%%", expense));
  } else {
    card.append(createButton("edit", "%%editLabel%%", expense), createButton("delete", "%%deleteLabel%%", expense));
  }
  return card;
}

// Draws the cards and the totals again from the current list. An empty list says so,
// but only once the list is ready: while it loads or after an error it is not known to be empty.
function render() {
  byId = indexById(current);
  showPages();
  emptyText.hidden = !(loadState === "ready" && current.length === 0);
  if (loadState !== "ready") {
    summaryText.textContent = "";
    return;
  }
  // Only the categories that have expenses, in the order they first appear, then the total.
  const parts = [];
  let total = 0;
  for (const [category, sum] of totalsByCategory(current)) {
    parts.push(categoryText(category) + ": " + formatMoney(sum, LOCALE));
    total += sum;
  }
  parts.push("%%totalLabel%%: " + formatMoney(total, LOCALE));
  summaryText.textContent = parts.join(" · ");
}

// The list the page shows: the expenses that pass the filter and match the search, in pages of
// PAGE_SIZE. Every render starts a new generator and takes as many pages as were shown before;
// the old generator is closed.
function showPages() {
  pages?.return();
  const filtered = filter === "all" ? current : filterExpenses(current, filter);
  const shown = searchExpenses(filtered, query);
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
// Save button only when the list is ready (so a new expense never lands in a list that is replaced).
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

// Loads the starting expenses and moves the page through the states: loading, then ready or failed.
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

// A new repository for a list that has just become known (saved or starting expenses).
function useList(records) {
  repository = new ExpenseRepository(store, records);
  current = repository.items;
}

// After every change of the repository (which has already saved it) the page draws the new list.
function refresh() {
  current = repository.items;
  render();
}

// An id that no expense of the current list has yet (saved expenses may already use "e-7").
function newId() {
  let number = current.length + 1;
  while (current.some((one) => one.id === "e-" + number)) {
    number += 1;
  }
  return "e-" + number;
}

// The button with this action in the card of this expense.
function cardButton(id, action) {
  return list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
}

// The draft in the form. The amount field is in hryvnias; Math.round turns it into whole kopiykas
// (19.99 * 100 gives 1998.9999999999998, and Math.round makes it 1999).
function readForm() {
  return {
    label: labelInput.value,
    amountMinor: parseAmountMinor(amountInput.value),
    date: dateInput.value,
    category: categoryInput.value,
  };
}

function showErrors(errors) {
  labelError.textContent = messageFor(errors.label);
  amountError.textContent = messageFor(errors.amountMinor);
  categoryError.textContent = messageFor(errors.category);
  dateError.textContent = messageFor(errors.date);
}

function onSubmit(event) {
  event.preventDefault();
  const input = readForm();
  const check = validateExpense(input);
  if (!check.ok) {
    showErrors(check.errors);
    if (check.errors.label !== undefined) {
      labelInput.focus();
    } else if (check.errors.amountMinor !== undefined) {
      amountInput.focus();
    } else if (check.errors.date !== undefined) {
      dateInput.focus();
    } else {
      categoryInput.focus();
    }
    return;
  }
  showErrors({});
  if (editingId === null) {
    repository.add(newId(), input);
  } else {
    repository.update(editingId, check.value);
    editingId = null;
  }
  refresh();
  form.reset();
  labelInput.focus();
}

// One handler on the list serves the buttons of every card, also of cards added later.
function onListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("[data-id]").dataset.id;
  const action = button.dataset.action;

  if (action === "edit") {
    const expense = byId.get(id);
    editingId = id;
    labelInput.value = expense.label;
    amountInput.value = formatAmount(expense.amountMinor);
    dateInput.value = expense.date;
    categoryInput.value = expense.category;
    labelInput.focus();
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
    // Called as a method of the repository, so `this` inside it is the repository.
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

// Loads the saved expenses and draws the page. Saved expenses win and need no request. Without them,
// and instead of damaged saved data, the page loads the starting expenses; damaged data is never
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
  const result = loadExpenses(storage);
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  if (result.ok) {
    useList(result.expenses);
    showLoadState("ready", "");
  } else {
    loadStartingList();
  }
}
