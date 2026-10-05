// The task form: a controlled form whose draft lives in one typed state object. The domain's
// validateTask decides whether the draft is saved or the messages are shown. While the draft differs
// from what it started with, leaving it asks first: inside the app through the router's guard, and on
// a reload or a tab close through the browser's beforeunload question.
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { validateTask } from "../domain/tasks.ts";
import type { Task, TaskErrorKey, TaskErrors } from "../domain/tasks.ts";
import type { TaskFields } from "./tasksReducer.ts";
import { useBlocker } from "./router.tsx";

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
  onCancel?: () => void; // shown as a button when given
};

export function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(task));
  const [errors, setErrors] = useState<TaskErrors>({});
  // Counts failed saves: the focus effect runs after each of them, also when the errors are the same.
  const [failedSubmits, setFailedSubmits] = useState(0);
  const titleRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  // Unsaved edits: the draft differs from the one the form started with.
  const start = draftOf(task);
  const isDirty = draft.title !== start.title || draft.dueDate !== start.dueDate || draft.priority !== start.priority || draft.done !== start.done;
  const blocker = useBlocker(isDirty);

  // The beforeunload listener is an external system: it exists only while there are unsaved edits,
  // and the cleanup removes the same function.
  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // After a failed save focus moves to the first field with an error, which reads its message out.
  // The field to focus is computed in handleSubmit, so the effect reads only refs and the counter.
  const firstInvalid = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (failedSubmits > 0) {
      firstInvalid.current?.focus();
    }
  }, [failedSubmits]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // An empty due date field means "no due date".
    const check = validateTask({ title: draft.title, dueDate: draft.dueDate === "" ? null : draft.dueDate, priority: draft.priority });
    if (!check.ok) {
      setErrors(check.errors);
      firstInvalid.current = check.errors.title !== undefined ? titleRef.current : dueDateRef.current;
      setFailedSubmits(failedSubmits + 1);
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
        <input
          id="task-title"
          name="title"
          ref={titleRef}
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          aria-invalid={errors.title !== undefined}
          aria-describedby={errors.title !== undefined ? "task-title-error" : undefined}
        />
        {errors.title !== undefined && (
          <p id="task-title-error" className="error">
            {messageFor(errors.title)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="task-due-date">%%valueLabel%%</label>
        <input
          id="task-due-date"
          name="dueDate"
          type="date"
          ref={dueDateRef}
          value={draft.dueDate}
          onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
          aria-invalid={errors.dueDate !== undefined}
          aria-describedby={errors.dueDate !== undefined ? "task-due-date-error" : undefined}
        />
        {errors.dueDate !== undefined && (
          <p id="task-due-date-error" className="error">
            {messageFor(errors.dueDate)}
          </p>
        )}
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
      {onCancel !== undefined && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
      {blocker.blocked && <LeaveDialog onStay={blocker.stay} onLeave={blocker.proceed} />}
    </form>
  );
}

// The in-page question while a navigation waits: Stay gets focus, and after the question closes focus
// goes back to the element that had it.
function LeaveDialog({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  const stayRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const opener = document.activeElement;
    stayRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) {
        opener.focus();
      }
    };
  }, []);
  return (
    <div role="alertdialog" aria-labelledby="leave-text">
      <p id="leave-text">%%unsavedQuestion%%</p>
      <button type="button" ref={stayRef} onClick={onStay}>
        %%stayLabel%%
      </button>
      <button type="button" onClick={onLeave}>
        %%leaveLabel%%
      </button>
    </div>
  );
}
