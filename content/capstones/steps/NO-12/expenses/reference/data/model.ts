// The runtime schema of an expense at the API boundary. The API answers with `unknown` (as JSON from a
// network would be); parseExpenseList checks every field before the app treats the answer as
// Expense[]. Types alone cannot do this: tsc checks the code, not the data that arrives while it runs.
import { isCalendarDate, isCategoryId } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";

// Either the checked value, or an error code for every field that failed ("1.amountMinor": "notPositiveWhole").
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// label 1–80 characters, amountMinor a positive whole number of kopiykas (12.5 is refused), date
// "YYYY-MM-DD", category one of the project's categories.
export function parseExpense(input: unknown): ParseResult<Expense> {
  if (!isObject(input)) {
    return { ok: false, errors: { record: "notObject" } };
  }
  const { id, label, amountMinor, date, category } = input;
  const errors: Record<string, string> = {};
  if (typeof id !== "string" || id === "") {
    errors.id = "required";
  }
  if (typeof label !== "string" || label.trim() === "" || label.trim().length > 80) {
    errors.label = "length1to80";
  }
  if (typeof amountMinor !== "number" || !Number.isInteger(amountMinor) || amountMinor <= 0) {
    errors.amountMinor = "notPositiveWhole";
  }
  if (!isCalendarDate(date)) {
    errors.date = "notCalendarDate";
  }
  if (!isCategoryId(category)) {
    errors.category = "unknown";
  }
  if (typeof id !== "string" || typeof label !== "string" || typeof amountMinor !== "number" || !isCalendarDate(date) || !isCategoryId(category) || Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { id: id, label: label.trim(), amountMinor: amountMinor, date: date, category: category } };
}

// An array of expenses with different ids; the errors name the position: "2.amountMinor".
export function parseExpenseList(input: unknown): ParseResult<Expense[]> {
  if (!Array.isArray(input)) {
    return { ok: false, errors: { list: "notArray" } };
  }
  const expenses: Expense[] = [];
  const errors: Record<string, string> = {};
  input.forEach((record: unknown, index) => {
    const parsed = parseExpense(record);
    if (parsed.ok) {
      expenses.push(parsed.value);
    } else {
      for (const [field, code] of Object.entries(parsed.errors)) {
        errors[index + 1 + "." + field] = code;
      }
    }
  });
  if (new Set(expenses.map((expense) => expense.id)).size !== expenses.length) {
    errors.id = "duplicate";
  }
  return Object.keys(errors).length === 0 ? { ok: true, value: expenses } : { ok: false, errors: errors };
}
