// The task form: a controlled form whose draft lives in one typed state object. The domain's
// validateTask decides whether the draft is saved or the messages are shown.
import { useState } from "react";
import type { SubmitEvent } from "react";
import { validateTask } from "../domain/tasks.ts";
import type { Task, TaskErrorKey, TaskErrors } from "../domain/tasks.ts";
import type { TaskFields } from "./tasksReducer.ts";


// The fields as the form holds them: text exactly as typed, so an empty due date stays "".
type Draft = { title: string; dueDate: string; priority: string; done: boolean };

function draftOf(task: Task | null): Draft {
  if (task === null) {
    return { title: "", dueDate: "", priority: "normal", done: false };
  }
  return { title: task.title, dueDate: task.dueDate ?? "", priority: task.priority, done: task.done };
}

// The text the form shows for an error key; no key means no message.
function messageFor(errorKey: TaskErrorKey | undefined): string {
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

type TaskFormProps = {
  task: Task | null; // the task being edited, or null for a new one
  onSave: (fields: TaskFields) => void;
  onCancel: () => void;
};

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(task));
  const [errors, setErrors] = useState<TaskErrors>({});

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty due date field means "no due date".
    const check = validateTask({ title: draft.title, dueDate: draft.dueDate === "" ? null : draft.dueDate, priority: draft.priority });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave({ title: check.value.title, dueDate: check.value.dueDate, priority: check.value.priority, done: draft.done });
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="task-title">%%nameLabel%%</label>
        <input id="task-title" name="title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-invalid={errors.title !== undefined} aria-describedby="task-title-error" />
        <p id="task-title-error" className="error">
          {messageFor(errors.title)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="task-due-date">%%valueLabel%%</label>
        <input id="task-due-date" name="dueDate" type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} aria-invalid={errors.dueDate !== undefined} aria-describedby="task-due-date-error" />
        <p id="task-due-date-error" className="error">
          {messageFor(errors.dueDate)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="task-priority">%%priorityFieldLabel%%</label>
        <select id="task-priority" name="priority" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
          <option value="low">%%priorityLow%%</option>
          <option value="normal">%%priorityNormal%%</option>
          <option value="high">%%priorityHigh%%</option>
        </select>
      </div>
      <div className="field field-check">
        <input id="task-done" name="done" type="checkbox" checked={draft.done} onChange={(event) => setDraft({ ...draft, done: event.target.checked })} />
        <label htmlFor="task-done">%%doneFieldLabel%%</label>
      </div>
      <button type="submit">%%saveLabel%%</button>
      {task !== null && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
    </form>
  );
}
