// The versioned contract of the records API, shared by the server (server/), the web client (data/) and,
// as an unchanged copy, the native companion. It keeps the promise twice: types for tsc, and schemas for
// the data that arrives while the code runs — tsc never sees an answer on the wire. A breaking change
// never edits v1: it adds ExpenseV2, parseListPageV2 and /v2/records next to these, and v1 stays as it is.
import type { Expense } from "../domain/expenses.ts";
import { parseExpense, parseExpenseList } from "../data/model.ts";
import type { ParseResult } from "../data/model.ts";

export const RECORDS_PATH_V1 = "/v1/records";

// The biggest page GET /v1/records gives (?limit=1…50).
export const PAGE_LIMIT_V1 = 50;

export type ExpenseV1 = Expense;

// GET /v1/records answers one page; nextCursor is the id to continue after, null on the last page.
export type ListPageV1 = { items: ExpenseV1[]; nextCursor: string | null };

// Every refusal of /v1: a code for programs, a message key for people, the fields and the request id.
export type ErrorBodyV1 = { error: { code: string; messageKey: string; details: Record<string, string>; requestId: string } };

export function parseExpenseV1(value: unknown): ParseResult<ExpenseV1> {
  return parseExpense(value);
}

// A page: an object with an `items` list that passes the expense schema and a `nextCursor` that is an id of
// that list or null. Extra fields are allowed: adding a field is a compatible change.
export function parseListPageV1(value: unknown): ParseResult<ListPageV1> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ok: false, errors: { page: "notObject" } };
  }
  const { items, nextCursor } = value as Record<string, unknown>;
  const list = parseExpenseList(items);
  if (!list.ok) {
    return { ok: false, errors: Object.fromEntries(Object.entries(list.errors).map(([field, code]) => ["items." + field, code])) };
  }
  if (nextCursor !== null && (typeof nextCursor !== "string" || !list.value.some((expense) => expense.id === nextCursor))) {
    return { ok: false, errors: { nextCursor: "notAnIdOfThePage" } };
  }
  return { ok: true, value: { items: list.value, nextCursor: nextCursor } };
}

export function parseErrorBodyV1(value: unknown): ParseResult<ErrorBodyV1> {
  const error = typeof value === "object" && value !== null ? (value as Record<string, unknown>).error : undefined;
  if (typeof error !== "object" || error === null) {
    return { ok: false, errors: { error: "notObject" } };
  }
  const { code, messageKey, details, requestId } = error as Record<string, unknown>;
  const errors: Record<string, string> = {};
  for (const [field, text] of Object.entries({ code, messageKey, requestId })) {
    if (typeof text !== "string" || text === "") {
      errors["error." + field] = "required";
    }
  }
  if (typeof details !== "object" || details === null || Array.isArray(details) || Object.values(details).some((one) => typeof one !== "string")) {
    errors["error.details"] = "notStringMap";
  }
  if (Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: value as ErrorBodyV1 };
}
