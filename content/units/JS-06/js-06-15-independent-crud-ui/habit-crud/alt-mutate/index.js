// Starting data. Keep the name `habits`: the checks read it.
const habits = [
  { id: "h-1", name: "%%habit1%%", minutes: 10 },
  { id: "h-2", name: "%%habit2%%", minutes: 20 },
];
let lastId = 2;
let editing = null; // the habit object being edited, or null

const form = document.querySelector("#habit-form");
const fields = { name: document.querySelector("#name"), minutes: document.querySelector("#minutes") };
const list = document.querySelector("#habits");
const heading = document.querySelector("#habits-title");

// The summary table is built once by code; render() only updates its two cells.
const table = document.createElement("table");
table.id = "summary";
const caption = document.createElement("caption");
caption.textContent = "%%summary%%";
const headRow = document.createElement("tr");
for (const text of ["%%countHeader%%", "%%minutesHeader%%"]) {
  const th = document.createElement("th");
  th.scope = "col";
  th.textContent = text;
  headRow.append(th);
}
const countCell = document.createElement("td");
const minutesCell = document.createElement("td");
const bodyRow = document.createElement("tr");
bodyRow.append(countCell, minutesCell);
table.append(caption, headRow, bodyRow);
document.querySelector("#summary-area").append(table);

function render() {
  list.replaceChildren();
  for (const habit of habits) {
    const item = document.createElement("li");
    item.dataset.id = habit.id;
    const title = document.createElement("strong");
    title.textContent = habit.name;
    const minutes = document.createElement("span");
    minutes.textContent = ` · ${habit.minutes} %%minutesShort%% `;
    item.append(title, minutes);
    for (const [action, word] of [["edit", "%%edit%%"], ["delete", "%%delete%%"]]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = action;
      button.textContent = word;
      button.setAttribute("aria-label", `${word}: ${habit.name}`);
      item.append(button);
    }
    list.append(item);
  }
  countCell.textContent = String(habits.length);
  let total = 0;
  for (const habit of habits) total += habit.minutes;
  minutesCell.textContent = String(total);
}

// A message is created next to its field when needed and removed again.
function showMessage(field, text) {
  const id = `${field.id}-message`;
  document.getElementById(id)?.remove();
  field.removeAttribute("aria-describedby");
  if (text === "") return;
  const message = document.createElement("p");
  message.id = id;
  message.className = "message";
  message.textContent = text;
  field.after(message);
  field.setAttribute("aria-describedby", id);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = fields.name.value.trim();
  const minutes = Number(fields.minutes.value);
  const okMinutes = fields.minutes.value !== "" && Number.isInteger(minutes) && minutes >= 1 && minutes <= 240;
  showMessage(fields.name, name === "" ? "%%nameRequired%%" : "");
  showMessage(fields.minutes, okMinutes ? "" : "%%minutesRange%%");
  if (name === "" || !okMinutes) {
    (name === "" ? fields.name : fields.minutes).focus();
    return;
  }
  if (editing) {
    editing.name = name;
    editing.minutes = minutes;
    editing = null;
  } else {
    lastId += 1;
    habits.push({ id: `h-${lastId}`, name, minutes });
  }
  form.reset();
  render();
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest("li").dataset.id;
  const index = habits.findIndex((habit) => habit.id === id);
  if (button.dataset.action === "edit") {
    editing = habits[index];
    fields.name.value = editing.name;
    fields.minutes.value = String(editing.minutes);
    fields.name.focus();
    return;
  }
  const [removed] = habits.splice(index, 1);
  if (editing === removed) {
    editing = null;
    form.reset();
  }
  render();
  const neighbour = habits[index] ?? habits[index - 1];
  if (neighbour) {
    list.querySelector(`li[data-id="${neighbour.id}"] button[data-action="delete"]`).focus();
  } else {
    heading.focus();
  }
});

render();
