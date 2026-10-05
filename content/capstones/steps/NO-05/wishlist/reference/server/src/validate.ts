// Validation of a wish at the edge of the API, before anything reaches the file. The rules for the name
// and the price are the domain's own validateItem, so the server and the web app agree, and its error
// keys ("required", "too-long", "not-a-number", "negative", "not-whole") are the ones the client
// already translates. The edge adds what a form never sends: wrong types, unknown fields, the category.
// It collects every error, and on success hands on a new, cleaned value — never the raw body.
import { validateItem } from "../../domain/wishes.ts";

export type WishInput = { name: string; price: number | null; acquired: boolean; category: string | null };

export type InputResult = { ok: true; value: WishInput } | { ok: false; errors: Record<string, string> };

const KNOWN_FIELDS = ["name", "price", "acquired", "category"];
const CATEGORY_MAX = 30;

export function validateWishInput(input: unknown): InputResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: "not-an-object" } };
  }
  const body = input as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // The domain rules; a name that is not text is checked as an empty one and reported below.
  const name = typeof body.name === "string" ? body.name : "";
  const check = validateItem({ name: name, price: body.price as number | null | undefined });
  if (!check.ok) {
    Object.assign(errors, check.errors);
  }
  if (body.name !== undefined && typeof body.name !== "string") {
    errors.name = "not-a-string";
  }

  if (body.acquired !== undefined && typeof body.acquired !== "boolean") {
    errors.acquired = "not-a-boolean";
  }

  let category: string | null = null;
  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== "string") {
      errors.category = "not-a-string";
    } else if (body.category.trim().length > CATEGORY_MAX) {
      errors.category = "too-long";
    } else {
      category = body.category.trim() === "" ? null : body.category.trim();
    }
  }

  for (const key of Object.keys(body)) {
    if (!KNOWN_FIELDS.includes(key)) {
      errors[key] = "unknown-field";
    }
  }

  if (Object.keys(errors).length > 0 || !check.ok) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: check.value.name, price: check.value.price, acquired: body.acquired === true, category: category } };
}
