// The API model and its runtime schema (as in the lesson on API models).
import type { Expense } from "./expenses";

export type ApiExpense = { id: string; label: string; amount_minor: number; spent_on: string };
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

export function toExpense(api: ApiExpense): Expense {
  return { id: api.id, label: api.label, amountMinor: api.amount_minor, date: api.spent_on };
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function parseExpense(input: unknown): ParseResult<Expense> {
  if (!isObject(input)) return { ok: false, errors: { record: "notObject" } };
  const errors: Record<string, string> = {};
  if (typeof input.id !== "string" || input.id === "") errors.id = "required";
  if (typeof input.label !== "string" || input.label.trim() === "") errors.label = "required";
  if (!Number.isInteger(input.amount_minor) || (input.amount_minor as number) <= 0) errors.amount_minor = "positiveInteger";
  if (typeof input.spent_on !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input.spent_on)) errors.spent_on = "date";
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: toExpense(input as ApiExpense) };
}

export function parseExpenseList(input: unknown): ParseResult<Expense[]> {
  if (!Array.isArray(input)) return { ok: false, errors: { list: "notArray" } };
  const value: Expense[] = [];
  const errors: Record<string, string> = {};
  input.forEach((item, index) => {
    const result = parseExpense(item);
    if (result.ok) value.push(result.value);
    else for (const [field, message] of Object.entries(result.errors)) errors[`${index}.${field}`] = message;
  });
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, value };
}
