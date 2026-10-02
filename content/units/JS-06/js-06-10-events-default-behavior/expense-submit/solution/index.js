// Ready-made: checks one expense and returns { ok: true, value } or { ok: false, errors }.
function validate(input) {
  const errors = {};
  const label = input.label.trim();
  if (label === "") {
    errors.label = "required";
  }
  const amount = Number(input.amount);
  if (input.amount.trim() === "") {
    errors.amount = "required";
  } else if (Number.isNaN(amount)) {
    errors.amount = "not-a-number";
  } else if (amount <= 0) {
    errors.amount = "not-positive";
  }
  if (errors.label !== undefined || errors.amount !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { label: label, amountMinor: Math.round(amount * 100), category: input.category } };
}

// Ready-made: the text for every error key.
const MESSAGES = {
  required: "%%required%%",
  "not-a-number": "%%notNumber%%",
  "not-positive": "%%notPositive%%",
};

// Ready-made: adds one expense to the list on the page.
function addExpense(expense) {
  const item = document.createElement("li");
  item.textContent = expense.label + " — " + (expense.amountMinor / 100).toFixed(2) + " %%currency%%";
  list.append(item);
}

const form = document.querySelector("#expense-form");
const list = document.querySelector("#expenses");

// Your part: handle the form's submission.
// 1. Stop the browser from sending the form and reloading the page.
// 2. Read the label, the amount and the category and pass them to validate.
// 3. Put the message of every error into its paragraph (#label-error, #amount-error) and empty the others.
// 4. If the expense is valid, add it with addExpense and clear the form with form.reset().

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const result = validate({
    label: form.elements.label.value,
    amount: form.elements.amount.value,
    category: form.elements.category.value,
  });
  const errors = result.ok ? {} : result.errors;
  for (const field of ["label", "amount"]) {
    const key = errors[field];
    document.querySelector("#" + field + "-error").textContent = key === undefined ? "" : MESSAGES[key];
  }
  if (result.ok) {
    addExpense(result.value);
    form.reset();
  }
});
