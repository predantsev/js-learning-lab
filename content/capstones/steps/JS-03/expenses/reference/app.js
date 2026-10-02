// The project script. It runs after the page has loaded.
// The rules of an expense live in pure functions: they get data and return a result.
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

// Two expenses of the list and a draft of a new one, as a form will send it later.
const firstExpense = { id: "e-02", label: "%%nameValue%%", amountMinor: 52000, date: "2026-03-01", category: "transport" };
const secondExpense = { id: "e-04", label: "%%secondName%%", amountMinor: 9990, date: "2026-02-27", category: "home" };
const draft = { label: "%%draftLabel%%", amountMinor: 150.5, date: "2026-03-02", category: "" };

// The page only calls the functions and shows what they return.
const draftCheck = validateExpense(draft);
document.querySelector("#first-label").textContent = formatExpenseLabel(firstExpense);
document.querySelector("#second-label").textContent = formatExpenseLabel(secondExpense);
document.querySelector("#amount-message").textContent = messageFor(draftCheck.errors?.amountMinor);
document.querySelector("#category-message").textContent = messageFor(draftCheck.errors?.category);
