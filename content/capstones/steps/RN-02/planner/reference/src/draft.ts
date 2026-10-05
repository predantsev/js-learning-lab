// The task form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { validateTask } from "../domain/tasks.ts";
import type { Task, TaskErrorKey, ValidationResult } from "../domain/tasks.ts";

// The fields as the form holds them: text exactly as typed, so an empty due date stays "".
export type Draft = { title: string; dueDate: string; priority: string };

export function draftOf(task: Task | null): Draft {
  if (task === null) {
    return { title: "", dueDate: "", priority: "normal" };
  }
  return { title: task.title, dueDate: task.dueDate ?? "", priority: task.priority };
}

// An empty due date means "no due date"; validateTask checks the rest exactly as in the web form.
export function checkDraft(draft: Draft): ValidationResult {
  return validateTask({ title: draft.title, dueDate: draft.dueDate === "" ? null : draft.dueDate, priority: draft.priority });
}

// The text the form shows for an error key; no key means no message.
export function messageFor(errorKey: TaskErrorKey | undefined): string {
  switch (errorKey) {
    case "required":
      return "%%requiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "unknown":
      return "%%invalidMessage%%";
    case "bad-date":
      return "%%badDateMessage%%";
    default:
      return "";
  }
}
