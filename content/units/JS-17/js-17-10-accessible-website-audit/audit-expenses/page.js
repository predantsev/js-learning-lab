// An expense page with seeded accessibility defects: find them with the keyboard and the accessibility tree.
const TRASH = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3 4h10M6 4V2h4v2M5 4l1 10h4l1-10" fill="none" stroke="currentColor"/></svg>';
let expenses = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%pass%%", amountMinor: 52000 },
];

function render() {
  const filter = document.querySelector("#filter").value.trim().toLowerCase();
  const list = document.querySelector("#expenses");
  list.replaceChildren();
  for (const expense of expenses.filter((e) => e.label.toLowerCase().includes(filter))) {
    const item = document.createElement("li");
    item.textContent = `${expense.label} · ${(expense.amountMinor / 100).toFixed(2)}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete";
    remove.innerHTML = TRASH;
    remove.addEventListener("click", () => {
      expenses = expenses.filter((e) => e.id !== expense.id);
      render();
    });
    item.append(remove);
    list.append(item);
  }
}

document.querySelector("#add").addEventListener("submit", (event) => {
  event.preventDefault();
  const label = document.querySelector("#label").value.trim();
  const amount = Number(document.querySelector("#amount").value.replace(",", "."));
  const error = document.querySelector("#amount-error");
  error.hidden = Number.isFinite(amount) && amount > 0;
  if (!error.hidden || label === "") return;
  expenses = [...expenses, { id: "e-" + Date.now(), label, amountMinor: Math.round(amount * 100) }];
  document.querySelector("#saved").textContent = "%%savedMessage%%";
  render();
});

// "Autocomplete": meant to keep the focus in the field while suggestions are shown.
document.querySelector("#filter").addEventListener("keydown", (event) => {
  if (event.key === "Tab") event.preventDefault();
});
document.querySelector("#filter").addEventListener("input", render);
document.querySelector(".clear").addEventListener("click", () => {
  document.querySelector("#filter").value = "";
  render();
});

render();
