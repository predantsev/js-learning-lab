// The project script. It runs after the page has loaded.
// The rules of an expense live in pure functions: they get data and return a result.
// The page is drawn from the data by render(); the form and the card buttons compute a new
// list with the pure functions, and render() draws the page again from it.
console.log("%%consoleReady%%");
console.log("%%samplesLabel%%", "%%sample1%%", "%%sample2%%", "%%sample3%%");

// An amount in whole kopiykas (minor units) as display text: hryvnias and two digits of kopiykas.
function formatAmount(amountMinor) {
  const kopiykas = amountMinor % 100;
  const hryvnias = (amountMinor - kopiykas) / 100;
  const kopiykasText = kopiykas < 10 ? "0" + kopiykas : "" + kopiykas;
  return hryvnias + "%%decimalMark%%" + kopiykasText;
}

// The label of an expense: its label, the amount and the currency.
function formatExpenseLabel(expense) {
  return expense.label + " — " + formatAmount(expense.amountMinor) + " %%currency%%";
}

// Checks a draft expense. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
function validateExpense(input) {
  const errors = {};

  const label = (input.label ?? "").trim();
  if (label === "") {
    errors.label = "required";
  } else if (label.length > 80) {
    errors.label = "too-long";
  }

  // A whole number leaves a remainder of 0 when divided by 1.
  const amount = input.amountMinor;
  if (typeof amount !== "number" || Number.isNaN(amount) || amount <= 0 || amount % 1 !== 0) {
    errors.amountMinor = "not-positive-integer";
  }

  // The four categories of the project share one break; anything else is unknown.
  switch (input.category) {
    case "food":
    case "transport":
    case "home":
    case "fun":
      break;
    default:
      errors.category = "unknown";
  }

  if (errors.label !== undefined || errors.amountMinor !== undefined || errors.category !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { label: label, amountMinor: amount, date: input.date, category: input.category } };
}

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

// A new list with a new expense at the end, if the draft passes the check; otherwise the same list.
function addExpense(list, id, input) {
  const check = validateExpense(input);
  if (!check.ok) {
    return list;
  }
  const value = check.value;
  const expense = { id: id, label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category };
  return [...list, expense];
}

// A new list in which the expense with this id is replaced by a copy with the changes;
// the other expenses are the same objects.
function updateExpense(list, id, changes) {
  const result = [];
  for (const expense of list) {
    if (expense.id === id) {
      result.push({ ...expense, ...changes });
    } else {
      result.push(expense);
    }
  }
  return result;
}

// A new list without the expense with this id.
function removeExpense(list, id) {
  const result = [];
  for (const expense of list) {
    if (expense.id !== id) {
      result.push(expense);
    }
  }
  return result;
}

// The expenses whose label contains the query, ignoring upper and lower case and the spaces
// at the edges of the query. An empty query keeps every expense.
function searchExpenses(list, query) {
  const text = query.trim().toLowerCase();
  return list.filter((expense) => expense.label.toLowerCase().includes(text));
}

// The expenses of one category.
function filterExpenses(list, category) {
  return list.filter((expense) => expense.category === category);
}

// A comparator for one field: amounts by size, dates ("YYYY-MM-DD" text) as text.
// Equal values return 0, so those expenses keep their order.
function byField(field) {
  return (a, b) => (field === "amountMinor" ? a.amountMinor - b.amountMinor : a.date.localeCompare(b.date));
}

// A copy sorted by "amountMinor" or by "date"; the received list keeps its order.
function sortExpenses(list, field) {
  return list.toSorted(byField(field));
}

// The sum of the amounts of a list, in minor units.
function totalOf(list) {
  return list.reduce((sum, expense) => sum + expense.amountMinor, 0);
}

// The total of every category of the project and the overall total, in minor units.
function summarizeExpenses(list) {
  return {
    total: totalOf(list),
    byCategory: {
      food: totalOf(filterExpenses(list, "food")),
      transport: totalOf(filterExpenses(list, "transport")),
      home: totalOf(filterExpenses(list, "home")),
      fun: totalOf(filterExpenses(list, "fun")),
    },
  };
}

// The word for a category of the project.
function categoryText(category) {
  switch (category) {
    case "food":
      return "%%categoryFood%%";
    case "transport":
      return "%%categoryTransport%%";
    case "home":
      return "%%categoryHome%%";
    case "fun":
      return "%%categoryFun%%";
    default:
      return "";
  }
}

// The starting expenses of the list. This array never changes: every change makes a new list.
const expenses = [
  { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%fixture5Name%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
  { id: "e-06", label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];

// The state of the page.
let current = expenses; // the list the page shows now
let nextNumber = 7; // the number in the id of the next new expense
let editingId = null; // the expense in the form, or null for a new expense
let confirmingId = null; // the expense whose delete waits for a confirmation

const form = document.querySelector("#expense-form");
const labelInput = document.querySelector("#expense-label");
const amountInput = document.querySelector("#expense-amount");
const dateInput = document.querySelector("#expense-date");
const categoryInput = document.querySelector("#expense-category");
const labelError = document.querySelector("#expense-label-error");
const amountError = document.querySelector("#expense-amount-error");
const categoryError = document.querySelector("#expense-category-error");
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
    current = addExpense(current, "e-" + nextNumber, input);
    nextNumber += 1;
  } else {
    current = updateExpense(current, editingId, check.value);
    editingId = null;
  }
  form.reset();
  render();
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
    current = removeExpense(current, id);
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
