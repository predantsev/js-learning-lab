// The habit form: a controlled form whose draft lives in one typed state object. The domain's
// validateHabit decides whether the draft is saved or the messages are shown. While the draft differs
// from what it started with, leaving it asks first: inside the app through the router's guard, and on
// a reload or a tab close through the browser's beforeunload question.
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { validateHabit } from "../domain/habits.ts";
import type { Habit, HabitErrorKey, HabitErrors } from "../domain/habits.ts";
import type { HabitFields } from "./habitsReducer.ts";
import { useBlocker } from "./router.tsx";

type Draft = { name: string; frequency: string; active: boolean };

function draftOf(habit: Habit | null): Draft {
  if (habit === null) {
    return { name: "", frequency: "daily", active: true };
  }
  return { name: habit.name, frequency: habit.frequency, active: habit.active };
}

// The text the form shows for an error key; no key means no message.
function messageFor(errorKey: HabitErrorKey | undefined): string {
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

type HabitFormProps = {
  habit: Habit | null; // the habit being edited, or null for a new one
  onSave: (fields: HabitFields) => Promise<boolean>; // resolves to true once the API has saved it
  onCancel?: () => void; // shown as a button when given
};

export function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(habit));
  const [errors, setErrors] = useState<HabitErrors>({});
  // Counts failed saves: the focus effect runs after each of them, also when the errors are the same.
  const [failedSubmits, setFailedSubmits] = useState(0);
  // True while the API is saving: the Save button is disabled, so one click sends one request.
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const frequencyRef = useRef<HTMLSelectElement>(null);

  // Unsaved edits: the draft differs from the one the form started with.
  const start = draftOf(habit);
  const isDirty = draft.name !== start.name || draft.frequency !== start.frequency || draft.active !== start.active;
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
  const firstInvalid = useRef<HTMLInputElement | HTMLSelectElement | null>(null);
  useEffect(() => {
    if (failedSubmits > 0) {
      firstInvalid.current?.focus();
    }
  }, [failedSubmits]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateHabit({ name: draft.name, frequency: draft.frequency });
    if (!check.ok) {
      setErrors(check.errors);
      firstInvalid.current = check.errors.name !== undefined ? nameRef.current : frequencyRef.current;
      setFailedSubmits(failedSubmits + 1);
      return;
    }
    setSaving(true);
    const saved = await onSave({ name: check.value.name, frequency: check.value.frequency, active: draft.active });
    setSaving(false);
    // A failed save keeps the draft, so nothing typed is lost.
    if (saved) {
      setDraft(draftOf(null));
      setErrors({});
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="habit-name">%%nameLabel%%</label>
        <input
          id="habit-name"
          name="name"
          ref={nameRef}
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          aria-invalid={errors.name !== undefined}
          aria-describedby={errors.name !== undefined ? "habit-name-error" : undefined}
        />
        {errors.name !== undefined && (
          <p id="habit-name-error" className="error">
            {messageFor(errors.name)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="habit-frequency">%%valueLabel%%</label>
        <select
          id="habit-frequency"
          name="frequency"
          ref={frequencyRef}
          value={draft.frequency}
          onChange={(event) => setDraft({ ...draft, frequency: event.target.value })}
          aria-invalid={errors.frequency !== undefined}
          aria-describedby={errors.frequency !== undefined ? "habit-frequency-error" : undefined}
        >
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>
        {errors.frequency !== undefined && (
          <p id="habit-frequency-error" className="error">
            {messageFor(errors.frequency)}
          </p>
        )}
      </div>
      <div className="field field-check">
        <input id="habit-active" name="active" type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
        <label htmlFor="habit-active">%%activeFieldLabel%%</label>
      </div>
      <button type="submit" disabled={saving}>
        %%saveLabel%%
      </button>
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
