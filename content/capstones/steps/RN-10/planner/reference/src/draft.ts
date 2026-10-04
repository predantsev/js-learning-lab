// The task form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { validateTask } from "../domain/tasks.ts";
import type { Priority, Task, TaskErrorKey, ValidationResult } from "../domain/tasks.ts";
import type { TaskFields } from "../ui/tasksReducer.ts";

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

// The fields tasksReducer saves, from a draft that passed checkDraft: its cleaned title, due date and
// priority, and the done flag of the task being edited (false for a new one).
export function fieldsOf(value: { title: string; dueDate: string | null; priority: Priority }, done: boolean): TaskFields {
  return { title: value.title, dueDate: value.dueDate, priority: value.priority, done: done };
}

// Whether the draft differs from the saved task: spaces at the edges do not count, so a form that was
// only opened and closed is not "changed".
export function hasUnsavedChanges(draft: Draft, saved: Task): boolean {
  const before = draftOf(saved);
  return draft.title.trim() !== before.title || draft.dueDate.trim() !== before.dueDate || draft.priority !== before.priority;
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
