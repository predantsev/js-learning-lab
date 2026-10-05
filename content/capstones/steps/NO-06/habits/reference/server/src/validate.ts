// Validation of a habit at the edge of the API, before anything reaches the file. The rules for the name
// and the frequency are the domain's own validateHabit, so the server and the web app agree, and its
// error keys ("required", "too-long", "unknown") are the ones the client already translates. The edge
// adds what a form never sends: wrong types, unknown fields and the completions, which must be at most
// MAX_COMPLETIONS days that exist in the calendar (2026-02-30 has the right form but is refused), each
// once, in ascending order. It collects every error, and on success hands on a new, cleaned value — never
// the raw body. Fields are copied by name from the allowlist, so a key such as "__proto__" or
// "constructor" never travels on.
import { uniqueSortedDays, validateHabit } from "../../domain/habits.ts";
import type { Frequency } from "../../domain/habits.ts";
import { isRealDate } from "./config.ts";

export type HabitInput = { name: string; frequency: Frequency; active: boolean; completions: string[] };

export type InputResult = { ok: true; value: HabitInput } | { ok: false; errors: Record<string, string> };

const KNOWN_FIELDS = ["name", "frequency", "active", "completions"];

// The most days one habit keeps: almost three years of a daily habit. The limit holds for a create, a
// replace, a patch and "done today", so no habit grows without bound.
export const MAX_COMPLETIONS = 1000;

// A day the API accepts: text of the form YYYY-MM-DD that names a day that exists.
export function isRealDay(value: unknown): value is string {
  return typeof value === "string" && isRealDate(value);
}

export function validateHabitInput(input: unknown): InputResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, errors: { body: "not-an-object" } };
  }
  const body = input as Record<string, unknown>;
  // No prototype: a key such as "__proto__" (JSON.parse makes it an own key) is stored as an error like any
  // other unknown field, instead of changing the object's prototype.
  const errors: Record<string, string> = Object.create(null);

  const name = typeof body.name === "string" ? body.name : "";
  const check = validateHabit({ name: name, frequency: body.frequency as string | undefined });
  if (!check.ok) {
    Object.assign(errors, check.errors);
  }
  if (body.name !== undefined && typeof body.name !== "string") {
    errors.name = "not-a-string";
  }

  if (body.active !== undefined && typeof body.active !== "boolean") {
    errors.active = "not-a-boolean";
  }

  let completions: string[] = [];
  if (body.completions !== undefined) {
    if (Array.isArray(body.completions) && body.completions.length > MAX_COMPLETIONS) {
      errors.completions = "too-many";
    } else if (!Array.isArray(body.completions) || !body.completions.every((day) => isRealDay(day))) {
      errors.completions = "bad-date";
    } else if (uniqueSortedDays(body.completions).join() !== body.completions.join()) {
      errors.completions = "not-unique-ascending";
    } else {
      completions = [...body.completions];
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
  return { ok: true, value: { name: check.value.name, frequency: check.value.frequency, active: body.active !== false, completions: completions } };
}
