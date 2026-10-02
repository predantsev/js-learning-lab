// The page: drawing the expenses, the form and the card buttons. The rules come from the domain
// module, saving and loading from the storage module.
import { formatAmount, validateExpense, addExpense, updateExpense, removeExpense, summarizeExpenses, categoryText, expenses } from "../domain/expenses.js";
import { loadExpenses, saveExpenses } from "../storage/expenses.js";

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
    default:
      return "";
  }
}

// The state of the page.
let current = expenses; // the list the page shows now
let editingId = null; // the expense in the form, or null for a new expense
let confirmingId = null; // the expense whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there

const form = document.querySelector("#expense-form");
const labelInput = document.querySelector("#expense-label");
const amountInput = document.querySelector("#expense-amount");
const dateInput = document.querySelector("#expense-date");
const categoryInput = document.querySelector("#expense-category");
const labelError = document.querySelector("#expense-label-error");
const amountError = document.querySelector("#expense-amount-error");
const categoryError = document.querySelector("#expense-category-error");
const statusText = document.querySelector("#status");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#expenses");

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
  amount.textContent = formatAmount(expense.amountMinor) + " %%currency%%";
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

// Draws the cards and the totals again from the current list.
function render() {
  list.replaceChildren(...current.map(createCard));
  const summary = summarizeExpenses(current);
  summaryText.textContent =
    "%%categoryFood%%: " + formatAmount(summary.byCategory.food) +
    " · %%categoryTransport%%: " + formatAmount(summary.byCategory.transport) +
    " · %%categoryHome%%: " + formatAmount(summary.byCategory.home) +
    " · %%categoryFun%%: " + formatAmount(summary.byCategory.fun) +
    " · %%totalLabel%%: " + formatAmount(summary.total) + " %%currency%%";
}

// Every change goes through here: the new list is saved and drawn.
function change(next) {
  current = next;
  saveExpenses(store, current);
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
    amountMinor: Math.round(Number(amountInput.value) * 100),
    date: dateInput.value,
    category: categoryInput.value,
  };
}

function showErrors(errors) {
  labelError.textContent = messageFor(errors.label);
  amountError.textContent = messageFor(errors.amountMinor);
  categoryError.textContent = messageFor(errors.category);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  const check = validateExpense(input);
  if (!check.ok) {
    showErrors(check.errors);
    if (check.errors.label !== undefined) {
      labelInput.focus();
    } else if (check.errors.amountMinor !== undefined) {
      amountInput.focus();
    } else {
      categoryInput.focus();
    }
    return;
  }
  showErrors({});
  if (editingId === null) {
    change(addExpense(current, newId(), input));
  } else {
    change(updateExpense(current, editingId, check.value));
    editingId = null;
  }
  form.reset();
  labelInput.focus();
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
    const expense = current.find((one) => one.id === id);
    editingId = id;
    labelInput.value = expense.label;
    amountInput.value = String(expense.amountMinor / 100);
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
    const index = current.findIndex((one) => one.id === id);
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    change(removeExpense(current, id));
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

// Loads the saved expenses and draws the page. Damaged saved data is never shown: the page starts
// from the starting list and says so, and the storage module has kept a copy of the saved text
// under the backup key.
export function start(storage) {
  store = storage;
  const result = loadExpenses(storage);
  current = result.ok ? result.expenses : expenses;
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  render();
}
