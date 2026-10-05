// The runtime schema of a habit at the API boundary. The API answers with `unknown` (as JSON from a
// network would be); parseHabitList checks every field before the app treats the answer as Habit[].
// Types alone cannot do this: tsc checks the code, not the data that arrives while it runs.
import { isCalendarDate, isFrequency } from "../domain/habits.ts";
import type { Habit } from "../domain/habits.ts";

// Either the checked value, or an error code for every field that failed ("1.completions": "duplicateDate").
export type ParseResult<T> = { ok: true; value: T } | { ok: false; errors: Record<string, string> };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// completions: calendar dates, each once, in ascending order. The error says which rule broke.
function completionsError(value: unknown): string | null {
  if (!Array.isArray(value) || !value.every(isCalendarDate)) {
    return "notCalendarDates";
  }
  if (new Set(value).size !== value.length) {
    return "duplicateDate";
  }
  if (value.some((day, index) => index > 0 && day < value[index - 1])) {
    return "notSorted";
  }
  return null;
}

// name 1–80 characters, frequency daily|weekly, active a boolean, completions unique sorted dates.
export function parseHabit(input: unknown): ParseResult<Habit> {
  if (!isObject(input)) {
    return { ok: false, errors: { record: "notObject" } };
  }
  const { id, name, frequency, active, completions } = input;
  const errors: Record<string, string> = {};
  if (typeof id !== "string" || id === "") {
    errors.id = "required";
  }
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > 80) {
    errors.name = "length1to80";
  }
  if (!isFrequency(frequency)) {
    errors.frequency = "unknown";
  }
  if (typeof active !== "boolean") {
    errors.active = "notBoolean";
  }
  const completionsProblem = completionsError(completions);
  if (completionsProblem !== null) {
    errors.completions = completionsProblem;
  }
  if (typeof id !== "string" || typeof name !== "string" || !isFrequency(frequency) || typeof active !== "boolean" || !Array.isArray(completions) || !completions.every(isCalendarDate) || Object.keys(errors).length > 0) {
    return { ok: false, errors: errors };
  }
  return { ok: true, value: { id: id, name: name.trim(), frequency: frequency, active: active, completions: completions } };
}

// An array of habits with different ids; the errors name the position: "2.completions".
export function parseHabitList(input: unknown): ParseResult<Habit[]> {
  if (!Array.isArray(input)) {
    return { ok: false, errors: { list: "notArray" } };
  }
  const habits: Habit[] = [];
  const errors: Record<string, string> = {};
  input.forEach((record: unknown, index) => {
    const parsed = parseHabit(record);
    if (parsed.ok) {
      habits.push(parsed.value);
    } else {
      for (const [field, code] of Object.entries(parsed.errors)) {
        errors[index + 1 + "." + field] = code;
      }
    }
  });
  if (new Set(habits.map((habit) => habit.id)).size !== habits.length) {
    errors.id = "duplicate";
  }
  return Object.keys(errors).length === 0 ? { ok: true, value: habits } : { ok: false, errors: errors };
}
