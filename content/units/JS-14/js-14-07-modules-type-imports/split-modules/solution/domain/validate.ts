// Checks of the planner domain: isPriority and validateTitle.
import type { Priority } from "./types.ts";

export function isPriority(value: unknown): value is Priority {
  return value === "low" || value === "normal" || value === "high";
}

export function validateTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed === "") {
    return "required";
  }
  return trimmed.length > 80 ? "too-long" : null;
}
