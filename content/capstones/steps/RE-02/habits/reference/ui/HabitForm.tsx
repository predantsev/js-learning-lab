// The habit form: a controlled form whose draft lives in one typed state object. The domain's
// validateHabit decides whether the draft is saved or the messages are shown.
import { useState } from "react";
import type { SubmitEvent } from "react";
import { validateHabit } from "../domain/habits.ts";
import type { Habit, HabitErrorKey, HabitErrors } from "../domain/habits.ts";

// What the form saves: the completions are never typed, they stay as they are.
export type HabitFields = Pick<Habit, "name" | "frequency" | "active">;

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
  onSave: (fields: HabitFields) => void;
  onCancel: () => void;
};

export function HabitForm({ habit, onSave, onCancel }: HabitFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(habit));
  const [errors, setErrors] = useState<HabitErrors>({});

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateHabit({ name: draft.name, frequency: draft.frequency });
    if (!check.ok) {
      setErrors(check.errors);
      return;
    }
    onSave({ name: check.value.name, frequency: check.value.frequency, active: draft.active });
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="habit-name">%%nameLabel%%</label>
        <input id="habit-name" name="name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} aria-invalid={errors.name !== undefined} aria-describedby="habit-name-error" />
        <p id="habit-name-error" className="error">
          {messageFor(errors.name)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="habit-frequency">%%valueLabel%%</label>
        <select id="habit-frequency" name="frequency" value={draft.frequency} onChange={(event) => setDraft({ ...draft, frequency: event.target.value })} aria-describedby="habit-frequency-error">
          <option value="daily">%%daily%%</option>
          <option value="weekly">%%weekly%%</option>
        </select>
        <p id="habit-frequency-error" className="error">
          {messageFor(errors.frequency)}
        </p>
      </div>
      <div className="field field-check">
        <input id="habit-active" name="active" type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
        <label htmlFor="habit-active">%%activeFieldLabel%%</label>
      </div>
      <button type="submit">%%saveLabel%%</button>
      {habit !== null && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
    </form>
  );
}
