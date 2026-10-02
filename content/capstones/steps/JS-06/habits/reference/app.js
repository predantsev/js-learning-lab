// The project script. It runs after the page has loaded.
// The rules of a habit live in pure functions: they get data and return a result.
// The page is drawn from the data by render(); the form and the card buttons compute a new
// list with the pure functions, and render() draws the page again from it.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// The word for a frequency value.
function frequencyText(frequency) {
  switch (frequency) {
    case "daily":
      return "%%daily%%";
    case "weekly":
      return "%%weekly%%";
    default:
      return "";
  }
}

// The label of a habit: the name, the frequency in words, and a mark when the habit is paused.
function formatHabitLabel(habit) {
  const label = habit.name + " · " + frequencyText(habit.frequency);
  if (habit.active === false) {
    return label + " · %%pausedMark%%";
  }
  return label;
}

// Checks a draft habit. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateHabit(input) {
  const errors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // The two known frequencies share one break; a missing frequency is "daily".
  const frequency = input.frequency ?? "daily";
  switch (frequency) {
    case "daily":
    case "weekly":
      break;
    default:
      errors.frequency = "unknown";
  }

  if (errors.name !== undefined || errors.frequency !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, frequency: frequency } };
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

// A new list with a new habit at the end, if the draft passes the check; otherwise the same list.
// Every new habit gets its own, new completions array; the draft may also carry the active flag.
function addHabit(list, id, input) {
  const check = validateHabit(input);
  if (!check.ok) {
    return list;
  }
  const habit = { id: id, name: check.value.name, frequency: check.value.frequency, active: input.active ?? true, completions: [] };
  return [...list, habit];
}

// A new list in which the habit with this id is replaced by a copy with the changes;
// the other habits are the same objects.
function updateHabit(list, id, changes) {
  const result = [];
  for (const habit of list) {
    if (habit.id === id) {
      result.push({ ...habit, ...changes });
    } else {
      result.push(habit);
    }
  }
  return result;
}

// A new list without the habit with this id.
function removeHabit(list, id) {
  const result = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
    }
  }
  return result;
}

// A new list in which the habit with this id has the day in a NEW completions array.
// Assumption: the day is today, never earlier than the stored dates, so adding it
// at the end keeps the dates in ascending order. A day that is already there is not added again.
function completeHabit(list, id, day) {
  const result = [];
  for (const habit of list) {
    if (habit.id !== id) {
      result.push(habit);
      continue;
    }
    let alreadyDone = false;
    for (const date of habit.completions) {
      if (date === day) {
        alreadyDone = true;
        break;
      }
    }
    if (alreadyDone) {
      result.push(habit);
    } else {
      result.push({ ...habit, completions: [...habit.completions, day] });
    }
  }
  return result;
}

// The habits whose name contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every habit.
function searchHabits(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((habit) => habit.name.toLowerCase().includes(text));
}

// The active ("active") or the paused ("paused") habits.
function filterHabits(list, status) {
  const active = status === "active";
  return list.filter((habit) => habit.active === active);
}

// Comparator: alphabetical order of the names; equal names return 0 and keep their order.
function byName(a, b) {
  return a.name.localeCompare(b.name);
}

// A sorted copy; the received list keeps its order.
function sortHabitsByName(list) {
  return list.toSorted(byName);
}

// On how many of the given days the habit was completed, and which share of the days that is.
// No days means no share: the rate is 0, not NaN.
function summarizeHabit(habit, days) {
  const count = days.filter((day) => habit.completions.includes(day)).length;
  return { count: count, rate: days.length === 0 ? 0 : count / days.length };
}

// The names of the habits of a list, each with its completion rate over the days in percent.
function formatRates(list, days) {
  let text = "";
  for (const habit of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + habit.name + " — " + summarizeHabit(habit, days).rate * 100 + "%";
  }
  return text;
}

// The starting habits of the list. This array never changes: every change makes a new list.
const habits = [
  { id: "h-01", name: "%%fixture1Name%%", frequency: "daily", active: true, completions: ["2026-02-27", "2026-02-28", "2026-03-01"] },
  { id: "h-02", name: "%%fixture2Name%%", frequency: "daily", active: true, completions: ["2026-02-26", "2026-02-28", "2026-03-01"] },
  { id: "h-03", name: "%%fixture3Name%%", frequency: "daily", active: true, completions: ["2026-03-01"] },
  { id: "h-04", name: "%%fixture4Name%%", frequency: "weekly", active: true, completions: ["2026-02-22", "2026-03-01"] },
  { id: "h-05", name: "%%fixture5Name%%", frequency: "daily", active: false, completions: ["2026-02-20"] },
  { id: "h-06", name: "%%fixture6Name%%", frequency: "daily", active: true, completions: [] },
];

// The state of the page.
let current = habits; // the list the page shows now
let nextNumber = 7; // the number in the id of the next new habit
let editingId = null; // the habit in the form, or null for a new habit
let confirmingId = null; // the habit whose delete waits for a confirmation
const lastDays = ["2026-02-26", "2026-02-27", "2026-02-28", "2026-03-01"];

const form = document.querySelector("#habit-form");
const nameInput = document.querySelector("#habit-name");
const frequencyInput = document.querySelector("#habit-frequency");
const activeInput = document.querySelector("#habit-active");
const nameError = document.querySelector("#habit-name-error");
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
    current = addHabit(current, "h-" + nextNumber, input);
    nextNumber += 1;
  } else {
    current = updateHabit(current, editingId, { name: check.value.name, frequency: check.value.frequency, active: input.active });
    editingId = null;
  }
  form.reset();
  render();
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
    current = removeHabit(current, id);
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
