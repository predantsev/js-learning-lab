import { renderTable } from "./table.js";

const area = document.querySelector("#expenses");
const expenses = [
  { id: "e-01", date: "03.03", what: "%%coffee%%", amount: 65 },
  { id: "e-02", date: "03.03", what: "%%bus%%", amount: 30 },
  { id: "e-03", date: "04.03", what: "%%books%%", amount: 420 },
];

function createItem(expense) {
  const item = document.createElement("li");
  item.textContent = `${expense.date} · ${expense.what} · ${expense.amount} %%currency%%`;
  return item;
}

// Rebuilds the content of the area from the records.
function render(records) {
  if (records.length === 0) {
    const message = document.createElement("p");
    message.textContent = "%%empty%%";
    area.replaceChildren(message);
    return;
  }
  const list = document.createElement("ul");
  list.append(...records.map(createItem));
  area.replaceChildren(list);
}

render(expenses);
