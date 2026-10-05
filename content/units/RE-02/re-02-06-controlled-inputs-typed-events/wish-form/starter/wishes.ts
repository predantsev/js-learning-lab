// The rules of a wish, as in the project: types and the validator. Read-only.

export type Wish = {
  readonly id: string;
  name: string;
  price: number | null; // whole hryvnias, or null when the wish has no price
  acquired: boolean;
  category: string | null;
};

// A draft from the form: every field may be missing.
export type WishDraft = {
  name?: string;
  price?: number | null;
  category?: string | null;
  acquired?: boolean;
};

export type WishErrorKey = "required" | "too-long" | "not-a-number" | "negative" | "not-whole";

export type WishErrors = {
  name?: WishErrorKey;
  price?: WishErrorKey;
};

// The result of validateItem: exactly one of the two shapes. `ok` tells them apart, so after
// `if (check.ok)` tsc knows that `check.value` exists, and otherwise `check.errors`.
export type ValidationResult =
  | { ok: true; value: { name: string; price: number | null } }
  | { ok: false; errors: WishErrors };

// Checks a draft wish. Returns { ok: true, value } with the cleaned data,
// or { ok: false, errors } with an error key for every field that has a problem.
export function validateItem(input: WishDraft): ValidationResult {
  const errors: WishErrors = {};

  const name = (input.name ?? "").trim();
  if (name === "") {
    errors.name = "required";
  } else if (name.length > 80) {
    errors.name = "too-long";
  }

  // A price is a whole number of hryvnias or null: never a fraction such as 12.5.
  const price = input.price ?? null;
  if (price !== null && (typeof price !== "number" || Number.isNaN(price))) {
    errors.price = "not-a-number";
  } else if (price !== null && price < 0) {
    errors.price = "negative";
  } else if (price !== null && !Number.isInteger(price)) {
    errors.price = "not-whole";
  }

  if (errors.name !== undefined || errors.price !== undefined) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { name: name, price: price } };
}

// The text shown for every error key.
export const MESSAGES: Record<WishErrorKey, string> = {
  required: "%%required%%",
  "too-long": "%%tooLong%%",
  "not-a-number": "%%notNumber%%",
  negative: "%%negative%%",
  "not-whole": "%%notWhole%%",
};

let nextNumber = 7;

// A fresh id for a new wish: "w-07", "w-08", …
export function nextWishId(): string {
  const id = "w-" + String(nextNumber).padStart(2, "0");
  nextNumber += 1;
  return id;
}
