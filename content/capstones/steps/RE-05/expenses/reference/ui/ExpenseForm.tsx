// The expense form: a controlled form whose draft lives in one typed state object. The amount is
// typed in hryvnias and becomes whole kopiykas through parseAmountMinor; the domain's
// validateExpense decides whether the draft is saved or the messages are shown. While the draft
// differs from what it started with, leaving it asks first: inside the app through the router's
// guard, and on a reload or a tab close through the browser's beforeunload question.
import { useEffect, useRef, useState } from "react";
import type { SubmitEvent } from "react";
import { validateExpense, parseAmountMinor, formatAmount } from "../domain/expenses.ts";
import type { Expense, ExpenseErrorKey, ExpenseErrors } from "../domain/expenses.ts";
import type { ExpenseFields } from "./expensesReducer.ts";
import { useBlocker } from "./router.tsx";

// The fields as the form holds them: the amount stays text exactly as typed.
type Draft = { label: string; amount: string; date: string; category: string };

function draftOf(expense: Expense | null): Draft {
  if (expense === null) {
    return { label: "", amount: "", date: "", category: "" };
  }
  return { label: expense.label, amount: formatAmount(expense.amountMinor), date: expense.date, category: expense.category };
}

// The text the form shows for an error key; no key means no message.
function messageFor(errorKey: ExpenseErrorKey | undefined): string {
  switch (errorKey) {
    case "required":
      return "%%labelRequiredMessage%%";
    case "too-long":
      return "%%tooLongMessage%%";
    case "not-positive-integer":
      return "%%invalidMessage%%";
    case "unknown":
      return "%%requiredMessage%%";
    case "bad-date":
      return "%%badDateMessage%%";
    default:
      return "";
  }
}

type ExpenseFormProps = {
  expense: Expense | null; // the expense being edited, or null for a new one
  onSave: (fields: ExpenseFields) => void;
  onCancel?: () => void; // shown as a button when given
};

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(expense));
  const [errors, setErrors] = useState<ExpenseErrors>({});
  // Counts failed saves: the focus effect runs after each of them, also when the errors are the same.
  const [failedSubmits, setFailedSubmits] = useState(0);
  const labelRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLSelectElement>(null);

  // Unsaved edits: the draft differs from the one the form started with.
  const start = draftOf(expense);
  const isDirty = draft.label !== start.label || draft.amount !== start.amount || draft.date !== start.date || draft.category !== start.category;
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

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateExpense({ label: draft.label, amountMinor: parseAmountMinor(draft.amount), date: draft.date, category: draft.category });
    if (!check.ok) {
      const e = check.errors;
      setErrors(e);
      firstInvalid.current = e.label !== undefined ? labelRef.current : e.amountMinor !== undefined ? amountRef.current : e.date !== undefined ? dateRef.current : categoryRef.current;
      setFailedSubmits(failedSubmits + 1);
      return;
    }
    onSave(check.value);
    setDraft(draftOf(null));
    setErrors({});
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="expense-label">%%nameLabel%%</label>
        <input
          id="expense-label"
          name="label"
          ref={labelRef}
          value={draft.label}
          onChange={(event) => setDraft({ ...draft, label: event.target.value })}
          aria-invalid={errors.label !== undefined}
          aria-describedby={errors.label !== undefined ? "expense-label-error" : undefined}
        />
        {errors.label !== undefined && (
          <p id="expense-label-error" className="error">
            {messageFor(errors.label)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="expense-amount">%%valueLabel%%</label>
        <input
          id="expense-amount"
          name="amount"
          inputMode="decimal"
          ref={amountRef}
          value={draft.amount}
          onChange={(event) => setDraft({ ...draft, amount: event.target.value })}
          aria-invalid={errors.amountMinor !== undefined}
          aria-describedby={errors.amountMinor !== undefined ? "expense-amount-error" : undefined}
        />
        {errors.amountMinor !== undefined && (
          <p id="expense-amount-error" className="error">
            {messageFor(errors.amountMinor)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="expense-date">%%dateFieldLabel%%</label>
        <input
          id="expense-date"
          name="date"
          type="date"
          ref={dateRef}
          value={draft.date}
          onChange={(event) => setDraft({ ...draft, date: event.target.value })}
          aria-invalid={errors.date !== undefined}
          aria-describedby={errors.date !== undefined ? "expense-date-error" : undefined}
        />
        {errors.date !== undefined && (
          <p id="expense-date-error" className="error">
            {messageFor(errors.date)}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="expense-category">%%categoryFieldLabel%%</label>
        <select
          id="expense-category"
          name="category"
          ref={categoryRef}
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          aria-invalid={errors.category !== undefined}
          aria-describedby={errors.category !== undefined ? "expense-category-error" : undefined}
        >
          <option value="">%%chooseCategory%%</option>
          <option value="food">%%categoryFood%%</option>
          <option value="transport">%%categoryTransport%%</option>
          <option value="home">%%categoryHome%%</option>
          <option value="fun">%%categoryFun%%</option>
        </select>
        {errors.category !== undefined && (
          <p id="expense-category-error" className="error">
            {messageFor(errors.category)}
          </p>
        )}
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
