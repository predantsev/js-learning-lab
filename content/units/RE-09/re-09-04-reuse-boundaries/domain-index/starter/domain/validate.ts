// A pure validator. Read-only.
import { FREQUENCIES } from "./types";
import type { Frequency } from "./types";

export type HabitDraft = { name: string; frequency: string };
export type ValidationResult =
  | { ok: true; value: { name: string; frequency: Frequency } }
  | { ok: false; errors: Record<string, string> };

export function validateHabit(draft: HabitDraft): ValidationResult {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  if (name === "") errors.name = "required";
  else if (name.length > 80) errors.name = "tooLong";
  const frequency = FREQUENCIES.find((item) => item === draft.frequency);
  if (frequency === undefined) errors.frequency = "unknown";
  if (frequency === undefined || Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { name, frequency } };
}
