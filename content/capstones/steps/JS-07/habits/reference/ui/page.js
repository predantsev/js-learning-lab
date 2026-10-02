// The page: drawing the habits, the form and the card buttons. The rules come from the domain
// module, saving and loading from the storage module.
import { frequencyText, validateHabit, addHabit, updateHabit, removeHabit, filterHabits, sortHabitsByName, formatRates, habits } from "../domain/habits.js";
import { loadHabits, saveHabits } from "../storage/habits.js";

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
let current = habits; // the list the page shows now
let editingId = null; // the habit in the form, or null for a new habit
let confirmingId = null; // the habit whose delete waits for a confirmation
let store = null; // the storage start() received; every change is saved there
const lastDays = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

const form = document.querySelector("#habit-form");
const nameInput = document.querySelector("#habit-name");
const frequencyInput = document.querySelector("#habit-frequency");
const activeInput = document.querySelector("#habit-active");
const nameError = document.querySelector("#habit-name-error");
const statusText = document.querySelector("#status");
const summaryText = document.querySelector("#summary");
const listTitle = document.querySelector("#list-title");
const list = document.querySelector("#habits");

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
    card.append(createButton("edit", "%%editLabel%%", habit), createButton("delete", "%%deleteLabel%%", habit));
  }
  return card;
}

// Draws the cards and the completion rates again from the current list.
function render() {
  list.replaceChildren(...current.map(createCard));
  summaryText.textContent = formatRates(sortHabitsByName(filterHabits(current, "active")), lastDays);
}

// Every change goes through here: the new list is saved and drawn.
function change(next) {
  current = next;
  saveHabits(store, current);
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

form.addEventListener("submit", (event) => {
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
    change(addHabit(current, newId(), input));
  } else {
    change(updateHabit(current, editingId, { name: check.value.name, frequency: check.value.frequency, active: input.active }));
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
    const habit = current.find((one) => one.id === id);
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
    const index = current.findIndex((one) => one.id === id);
    confirmingId = null;
    if (editingId === id) {
      editingId = null;
      form.reset();
    }
    change(removeHabit(current, id));
    // Focus goes to the Delete button of the next card, of the previous one, or to the list title.
    const deleteButtons = list.querySelectorAll('[data-action="delete"]');
    (deleteButtons[index] ?? deleteButtons[index - 1] ?? listTitle).focus();
  }
});

// Loads the saved habits and draws the page. Damaged saved data is never shown: the page starts
// from the starting list and says so, and the storage module has kept a copy of the saved text
// under the backup key.
export function start(storage) {
  store = storage;
  const result = loadHabits(storage);
  current = result.ok ? result.habits : habits;
  editingId = null;
  confirmingId = null;
  statusText.textContent = result.ok || result.reason === "missing" ? "" : "%%loadErrorMessage%%";
  render();
}
