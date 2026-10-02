// Checks of the planner domain: isPriority and validateTitle.
import { type Priority } from "./types.ts";

const PRIORITIES: readonly string[] = ["low", "normal", "high"];

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && PRIORITIES.includes(value);
}

export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed === "") {
    return "required";
  }
  if (trimmed.length > 80) {
    return "too-long";
  }
  return null;
}
