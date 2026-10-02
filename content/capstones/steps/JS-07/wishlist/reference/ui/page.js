// The page: drawing the wishes, the form and the card buttons. The rules come from the domain
// module, saving and loading from the storage module.
import { items, validateItem, addItem, updateItem, removeItem, summarizeItems } from "../domain/wishes.js";
import { loadItems, saveItems } from "../storage/wishes.js";

// The text the page shows for an error key; no key means no message.
function messageFor(errorKey) {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "not-a-number":
      return "%%notNumberMessage%%";
    case "negative":
      return "%%invalidMessage%%";
    default:
      return "";
  }
}

// The state of the page.
let current = items; // the list the page shows now
let editingId = null; // the wish in the form, or null for a new wish
let confirmingId = null; // the wish whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there

const form = document.querySelector("#item-form");
const nameInput = document.querySelector("#item-name");
const priceInput = document.querySelector("#item-price");
const categoryInput = document.querySelector("#item-category");
const acquiredInput = document.querySelector("#item-acquired");
const nameError = document.querySelector("#item-name-error");
const priceError = document.querySelector("#item-price-error");
const statusText = document.querySelector("#status");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#items");

// A card button; its accessible name also names the wish, so every button is told apart.
function createButton(action, text, item) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + ": " + item.name);
  return button;
}

// One card. Every value goes in as text, so a name with markup stays text.
function createCard(item) {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = item.id;

  const title = document.createElement("h3");
  title.textContent = item.name;
  const price = document.createElement("p");
  price.textContent = "%%valueLabel%%: " + (item.price ?? "%%noPrice%%");
  card.append(title, price);

  if (item.category !== null) {
    const category = document.createElement("p");
    category.textContent = "%%categoryFieldLabel%%: " + item.category;
    card.append(category);
  }
  if (item.acquired) {
    const badge = document.createElement("p");
    badge.className = "badge";
    badge.textContent = "%%acquiredMark%%";
    card.append(badge);
  }

  if (item.id === confirmingId) {
    const question = document.createElement("p");
    question.textContent = "%%confirmQuestion%%";
    card.append(question, createButton("confirm-delete", "%%confirmDeleteLabel%%", item), createButton("cancel-delete", "%%cancelLabel%%", item));
  } else {
    card.append(createButton("edit", "%%editLabel%%", item), createButton("delete", "%%deleteLabel%%", item));
  }
  return card;
}

// Draws the cards and the summary again from the current list.
function render() {
  list.replaceChildren(...current.map(createCard));
  const summary = summarizeItems(current);
  summaryText.textContent = "%%summaryCount%%: " + summary.count + " · %%summaryWantedTotal%%: " + summary.wantedTotal + " · %%summaryNoPrice%%: " + summary.wantedWithoutPrice;
}

// Every change goes through here: the new list is saved and drawn.
function change(next) {
  current = next;
  saveItems(store, current);
  render();
}

// An id that no wish of the current list has yet (saved wishes may already use "w-7").
function newId() {
  let number = current.length + 1;
  while (current.some((one) => one.id === "w-" + number)) {
    number += 1;
  }
  return "w-" + number;
}

// The button with this action in the card of this wish.
function cardButton(id, action) {
  return list.querySelector('[data-id="' + id + '"] [data-action="' + action + '"]');
}

// The draft in the form. An empty price field means "no price", not 0.
function readForm() {
  const category = categoryInput.value.trim();
  return {
    name: nameInput.value,
    price: priceInput.value === "" ? null : Number(priceInput.value),
    category: category === "" ? null : category,
    acquired: acquiredInput.checked,
  };
}

function showErrors(errors) {
  nameError.textContent = messageFor(errors.name);
  priceError.textContent = messageFor(errors.price);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = readForm();
  const check = validateItem(input);
  if (!check.ok) {
    showErrors(check.errors);
    if (check.errors.name !== undefined) {
      nameInput.focus();
    } else {
      priceInput.focus();
    }
    return;
  }
  showErrors({});
  if (editingId === null) {
    change(addItem(current, newId(), input));
  } else {
    change(updateItem(current, editingId, { name: check.value.name, price: check.value.price, category: input.category, acquired: input.acquired }));
    editingId = null;
  }
  form.reset();
  nameInput.focus();
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
    const item = current.find((one) => one.id === id);
    editingId = id;
    nameInput.value = item.name;
    priceInput.value = item.price === null ? "" : String(item.price);
    categoryInput.value = item.category ?? "";
    acquiredInput.checked = item.acquired;
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
    const index = current.findIndex((one) => one.id === id);
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    change(removeItem(current, id));
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

// Loads the saved wishes and draws the page. Damaged saved data is never shown: the page starts
// from the starting list and says so, and the storage module has kept a copy of the saved text
// under the backup key.
export function start(storage) {
  store = storage;
  const result = loadItems(storage);
  current = result.ok ? result.items : items;
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  render();
}
