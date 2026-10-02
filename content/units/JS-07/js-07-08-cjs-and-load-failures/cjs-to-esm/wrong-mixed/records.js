// export was added, but the old module.exports line stayed: `module` does not exist in an ES module.
import { formatMinor } from "./money.js";

const CATEGORIES = ["food", "transport", "home", "fun"];

export function validate(expense) {
  const errors = {};
  if (typeof expense.label !== "string" || expense.label.trim() === "") {
    errors.label = "required";
  }
  if (typeof expense.amountMinor !== "number" || expense.amountMinor <= 0 || expense.amountMinor % 1 !== 0) {
    errors.amountMinor = "not-positive-whole";
  }
  if (!CATEGORIES.includes(expense.category)) {
    errors.category = "unknown";
  }
  const hasErrors = Object.keys(errors).length > 0;
  return hasErrors ? { ok: false, errors: errors } : { ok: true, value: expense };
}

export function summarize(expenses) {
  let totalMinor = 0;
  for (const expense of expenses) {
    totalMinor = totalMinor + expense.amountMinor;
  }
  return { count: expenses.length, totalMinor: totalMinor, totalText: formatMinor(totalMinor) };
}

module.exports = { validate, summarize };
