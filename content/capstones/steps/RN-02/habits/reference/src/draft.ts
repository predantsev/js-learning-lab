// The habit form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { validateHabit } from "../domain/habits.ts";
import type { Habit, HabitErrorKey, ValidationResult } from "../domain/habits.ts";

// The fields as the form holds them: the frequency stays text until validateHabit checks it.
export type Draft = { name: string; frequency: string };

export function draftOf(habit: Habit | null): Draft {
  if (habit === null) {
    return { name: "", frequency: "daily" };
  }
  return { name: habit.name, frequency: habit.frequency };
}

// validateHabit checks the draft exactly as in the web form.
export function checkDraft(draft: Draft): ValidationResult {
  return validateHabit({ name: draft.name, frequency: draft.frequency });
}

// The text the form shows for an error key; no key means no message.
export function messageFor(errorKey: HabitErrorKey | undefined): string {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "unknown":
      return "%%invalidMessage%%";
    default:
      return "";
  }
}
