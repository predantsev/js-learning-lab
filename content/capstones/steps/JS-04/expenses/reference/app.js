// The project script. It runs after the page has loaded.
// The rules of an expense live in pure functions: they get data and return a result.
// The list functions return new arrays and never change the list or the expenses they receive.
// The lines at the end only call them and write the results onto the page.
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

// The labels of all expenses of a list as one text.
function formatList(list) {
  let text = "";
  for (const expense of list) {
    if (text !== "") {
      text = text + "; ";
    }
    text = text + formatExpenseLabel(expense);
  }
  return text;
}

// The expenses of the list and a draft of a new one, as a form will send it later.
const expenses = [
  { id: "e-01", label: "%%fixture1Name%%", amountMinor: 84550, date: "2026-03-01", category: "food" },
  { id: "e-02", label: "%%fixture2Name%%", amountMinor: 52000, date: "2026-03-01", category: "transport" },
  { id: "e-03", label: "%%fixture3Name%%", amountMinor: 18000, date: "2026-02-28", category: "fun" },
  { id: "e-04", label: "%%fixture4Name%%", amountMinor: 9990, date: "2026-02-27", category: "home" },
  { id: "e-05", label: "%%fixture5Name%%", amountMinor: 30000, date: "2026-02-27", category: "fun" },
  { id: "e-06", label: "%%fixture6Name%%", amountMinor: 21050, date: "2026-03-02", category: "food" },
];
const draft = { label: "%%draftLabel%%", amountMinor: 150.5, date: "2026-03-02", category: "" };

// Three changes, each giving a new list; expenses itself stays as it was.
const withNewExpense = addExpense(expenses, "e-07", { label: "%%newName%%", amountMinor: 15050, date: "2026-03-02", category: "transport" });
const withNewAmount = updateExpense(withNewExpense, "e-04", { amountMinor: 10990 });
const changed = removeExpense(withNewAmount, "e-03");

// The page only calls the functions and shows what they return.
const draftCheck = validateExpense(draft);
document.querySelector("#list-before").textContent = formatList(expenses);
document.querySelector("#list-after").textContent = formatList(changed);
document.querySelector("#amount-message").textContent = messageFor(draftCheck.errors?.amountMinor);
document.querySelector("#category-message").textContent = messageFor(draftCheck.errors?.category);
