const form = document.querySelector("#expense-form");
const whatInput = document.querySelector("#what");
const amountInput = document.querySelector("#amount");
const list = document.querySelector("#expenses");
const heading = document.querySelector("#list-title");
const deletedCount = document.querySelector("#deleted-count");
const BUDGET = 1000; // a single expense above this gets a warning background

let expenses = [
  { id: "e-1", what: "%%coffee%%", amount: 65 },
  { id: "e-2", what: "%%gym%%", amount: 1450 },
  { id: "e-3", what: "%%books%%", amount: 420 },
];
let deleted = 0;
let nextId = 4;

function removeExpense(id) {
  expenses = expenses.filter((expense) => expense.id !== id);
  deleted += 1;
  deletedCount.textContent = String(deleted);
}

function onSubmit(event) {
  event.preventDefault();
  expenses = [...expenses, { id: "e-" + nextId, what: whatInput.value.trim(), amount: Number(amountInput.value) }];
  nextId += 1;
  form.reset();
  render();
}

function render() {
  list.replaceChildren();
  for (const expense of expenses) {
    const item = document.createElement("li");
    item.className = expense.amount > BUDGET ? "expense over-budget" : "expense";
    item.dataset.id = expense.id;
    const text = document.createElement("span");
    text.textContent = `${expense.what} — ${expense.amount} %%currency%%`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "%%delete%%";
    remove.setAttribute("aria-label", "%%delete%% " + expense.what);
    item.append(text, " ", remove);
    list.append(item);
  }
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null) {
    return;
  }
  removeExpense(button.closest("li").dataset.id);
  render();
});

form.addEventListener("submit", onSubmit);

document.querySelector("#clear").addEventListener("click", () => {
  expenses = [];
  render();
});

render();
