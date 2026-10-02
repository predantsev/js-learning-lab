// Starting data. Keep the name `habits`: the checks read it.
let habits = [
  { id: "h-1", name: "%%habit1%%", minutes: 10 },
  { id: "h-2", name: "%%habit2%%", minutes: 20 },
];
let nextId = 3;
let editingId = null;

const form = document.querySelector("#habit-form");
const nameInput = document.querySelector("#name");
const minutesInput = document.querySelector("#minutes");
const nameError = document.querySelector("#name-error");
const minutesError = document.querySelector("#minutes-error");
const list = document.querySelector("#habits");
const heading = document.querySelector("#habits-title");

function createButton(action, text, habit) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", text + " " + habit.name);
  return button;
}

function createItem(habit) {
  const item = document.createElement("li");
  item.dataset.id = habit.id;
  const name = document.createElement("p");
  name.textContent = habit.name;
  const minutes = document.createElement("p");
  minutes.textContent = habit.minutes + " %%minutesShort%%";
  item.append(name, minutes, createButton("edit", "%%edit%%", habit), createButton("delete", "%%delete%%", habit));
  return item;
}

function render() {
  list.replaceChildren(...habits.map(createItem));
  document.querySelector("#summary-count").textContent = String(habits.length);
  document.querySelector("#summary-minutes").textContent = String(habits.reduce((sum, habit) => sum + habit.minutes, 0));
}

function validate(name, minutes) {
  const errors = {};
  if (name === "") {
    errors.name = "%%nameRequired%%";
  }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 240) {
    errors.minutes = "%%minutesRange%%";
  }
  return errors;
}

form.addEventListener("submit", (event) => {
  const name = nameInput.value.trim();
  const minutes = Number(minutesInput.value);
  const errors = validate(name, minutes);
  nameError.textContent = errors.name ?? "";
  minutesError.textContent = errors.minutes ?? "";
  if (errors.name) {
    nameInput.focus();
    return;
  }
  if (errors.minutes) {
    minutesInput.focus();
    return;
  }
  if (editingId === null) {
    habits = [...habits, { id: "h-" + nextId, name, minutes }];
    nextId += 1;
  } else {
    habits = habits.map((habit) => (habit.id === editingId ? { ...habit, name, minutes } : habit));
    editingId = null;
  }
  form.reset();
  render();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button === null) {
    return;
  }
  const id = button.closest("li").dataset.id;
  if (button.dataset.action === "edit") {
    const habit = habits.find((item) => item.id === id);
    editingId = id;
    nameInput.value = habit.name;
    minutesInput.value = String(habit.minutes);
    nameInput.focus();
    return;
  }
  const index = habits.findIndex((habit) => habit.id === id);
  habits = habits.filter((habit) => habit.id !== id);
  if (editingId === id) {
    editingId = null;
    form.reset();
  }
  render();
  const buttons = list.querySelectorAll('button[data-action="delete"]');
  (buttons[index] ?? buttons[index - 1] ?? heading).focus();
});

render();
