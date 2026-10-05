// The public entry of domain/: what a web, native or server app may import.
export type { Frequency, Habit, HabitSummary } from "./types";
export { FREQUENCIES } from "./types";
export type { HabitDraft, ValidationResult } from "./validate";
export { validateHabit } from "./validate";
export { addCompletion, summarizeHabit } from "./summarize";
