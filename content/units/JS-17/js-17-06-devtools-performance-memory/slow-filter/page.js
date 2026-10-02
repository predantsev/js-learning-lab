// SIZE synthetic expenses, generated from the lab fixtures that arrive over HTTP.
const SIZE = 20000;

const response = await fetch("/lab/expenses/items?lang=%%lang%%");
const { items: fixtures } = await response.json();

function makeExpenses(count) {
  const expenses = [];
  for (let i = 0; i < count; i++) {
    const fixture = fixtures[i % fixtures.length];
    const day = String(1 + (i % 28)).padStart(2, "0");
    expenses.push({ ...fixture, id: "e-" + i, date: "2026-02-" + day });
  }
  return expenses;
}
const expenses = makeExpenses(SIZE);

function matches(expense, category) {
  return expense.category === category && expense.amountMinor > 0;
}

// Formats a "YYYY-MM-DD" date for the person reading the list.
function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("%%locale%%", { day: "numeric", month: "long" });
}

function renderRows(list) {
  const rows = document.querySelector("#rows");
  const items = list.map((expense) => {
    const item = document.createElement("li");
    item.textContent = `${formatDate(expense.date)} · ${expense.label} · ${(expense.amountMinor / 100).toFixed(2)}`;
    return item;
  });
  rows.replaceChildren(...items);
}

function filterAndRender(category) {
  const start = performance.now();
  const kept = expenses.filter((expense) => matches(expense, category));
  renderRows(kept);
  const ms = performance.now() - start;
  document.querySelector("#status").textContent = `${kept.length} %%of%% ${expenses.length} · ${ms.toFixed(0)} ms`;
  console.log(`%%click%% ${category}: ${kept.length} %%rows%%, ${ms.toFixed(0)} ms`);
}

document.querySelector("#filters").addEventListener("submit", (event) => {
  event.preventDefault();
  filterAndRender(document.querySelector("#category").value);
});

console.log(`%%loaded%% ${fixtures.length} %%fixtures%% → ${expenses.length} %%expenses%%`);
