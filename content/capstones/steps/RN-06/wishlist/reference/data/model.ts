// The runtime schema of a wish at the API boundary. The API answers with `unknown` (as JSON from a
// network would be); parseItemList checks every field before the app treats the answer as Wish[].
// Types alone cannot do this: tsc checks the code, not the data that arrives while it runs.
import type { Wish } from "../domain/wishes.ts";

// Either the checked value, or an error code for every field that failed ("1.price": "notWhole").
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// name 1–80 characters, price a non-negative whole number or null, acquired a boolean, category up
// to 30 characters or null.
export function parseItem(input: unknown): ParseResult<Wish> {
  if (!isObject(input)) {
    return { ok: false, errors: { record: "notObject" } };
  }
  const { id, name, price, acquired, category } = input;
  const errors: Record<string, string> = {};
  if (typeof id !== "string" || id === "") {
    errors.id = "required";
  }
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > 80) {
    errors.name = "length1to80";
  }
  if (price !== null && (typeof price !== "number" || !Number.isInteger(price) || price < 0)) {
    errors.price = "notWholeNonNegative";
  }
  if (typeof acquired !== "boolean") {
    errors.acquired = "notBoolean";
  }
  if (category !== null && (typeof category !== "string" || category.length > 30)) {
    errors.category = "upTo30";
  }
  if (typeof id !== "string" || typeof name !== "string" || (price !== null && typeof price !== "number") || typeof acquired !== "boolean" || (category !== null && typeof category !== "string") || Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { id: id, name: name.trim(), price: price, acquired: acquired, category: category } };
}

// An array of wishes with different ids; the errors name the position: "2.price".
export function parseItemList(input: unknown): ParseResult<Wish[]> {
  if (!Array.isArray(input)) {
    return { ok: false, errors: { list: "notArray" } };
  }
  const items: Wish[] = [];
  const errors: Record<string, string> = {};
  input.forEach((record: unknown, index) => {
    const parsed = parseItem(record);
    if (parsed.ok) {
      items.push(parsed.value);
    } else {
      for (const [field, code] of Object.entries(parsed.errors)) {
        errors[index + 1 + "." + field] = code;
      }
    }
  });
  if (new Set(items.map((item) => item.id)).size !== items.length) {
    errors.id = "duplicate";
  }
  return Object.keys(errors).length === 0 ? { ok: true, value: items } : { ok: false, errors: errors };
}
