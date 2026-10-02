import { formatMinor } from "./money.js";

const CATEGORIES = ["food", "transport", "home", "fun"];

// validate(expense): { ok: true, value } or { ok: false, errors }.
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

// summarize(expenses): how many expenses and their total, as minor units and as text.
export function summarize(expenses) {
  let totalMinor = 0;
  for (const expense of expenses) {
    totalMinor = totalMinor + expense.amountMinor;
  }
  return { count: expenses.length, totalMinor: totalMinor, totalText: formatMinor(totalMinor) };
}
