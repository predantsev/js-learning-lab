// Validation of an expense at the edge of the API, before anything reaches the file. The rules are the
// domain's own validateExpense — a label of 1–80 characters, a whole positive amountMinor, a calendar
// date and one of the four categories — so the server and the web app agree, and its error keys
// ("required", "too-long", "not-positive-integer", "bad-date", "unknown") are the ones the client already
// translates. The edge adds what a form never sends: wrong types and unknown fields. It collects every
// error, and on success hands on a new, cleaned value — never the raw body. The value is the domain's own
// copy of the four fields by name, so a key such as "__proto__" or "constructor" never travels on.
import { validateExpense } from "../../domain/expenses.ts";
import type { CategoryId } from "../../domain/expenses.ts";

export type ExpenseInput = { label: string; amountMinor: number; date: string; category: CategoryId };

export type InputResult = { ok: true; value: ExpenseInput } | { ok: false; errors: Record<string, string> };

const KNOWN_FIELDS = ["label", "amountMinor", "date", "category"];

export function validateExpenseInput(input: unknown): InputResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: "not-an-object" } };
  }
  const body = input as Record<string, unknown>;
  // No prototype: a key such as "__proto__" (JSON.parse makes it an own key) is stored as an error like any
  // other unknown field, instead of changing the object's prototype.
  const errors: Record<string, string> = Object.create(null);

  // The domain rules; a label that is not text is checked as an empty one and reported below. An amount,
  // a date or a category of another type fails the domain's own checks.
  const label = typeof body.label === "string" ? body.label : "";
  const check = validateExpense({ label: label, amountMinor: body.amountMinor as number | undefined, date: body.date as string | undefined, category: body.category as string | undefined });
  if (!check.ok) {
    Object.assign(errors, check.errors);
  }
  if (body.label !== undefined && typeof body.label !== "string") {
    errors.label = "not-a-string";
  }

  for (const key of Object.keys(body)) {
    if (!KNOWN_FIELDS.includes(key)) {
      errors[key] = "unknown-field";
    }
  }

  if (Object.keys(errors).length > 0 || !check.ok) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: check.value };
}
