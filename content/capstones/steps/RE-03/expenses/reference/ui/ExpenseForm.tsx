// The expense form: a controlled form whose draft lives in one typed state object. The amount is
// typed in hryvnias and becomes whole kopiykas through parseAmountMinor; the domain's
// validateExpense decides whether the draft is saved or the messages are shown.
import { useState } from "react";
import type { SubmitEvent } from "react";
import { validateExpense, parseAmountMinor, formatAmount } from "../domain/expenses.ts";
import type { Expense, ExpenseErrorKey, ExpenseErrors } from "../domain/expenses.ts";

// What a saved expense consists of, besides its id.
export type ExpenseFields = Omit<Expense, "id">;

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
  onCancel: () => void;
};

export function ExpenseForm({ expense, onSave, onCancel }: ExpenseFormProps) {
  const [draft, setDraft] = useState<Draft>(draftOf(expense));
  const [errors, setErrors] = useState<ExpenseErrors>({});

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const check = validateExpense({ label: draft.label, amountMinor: parseAmountMinor(draft.amount), date: draft.date, category: draft.category });
    if (!check.ok) {
      setErrors(check.errors);
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
        <input id="expense-label" name="label" value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} aria-invalid={errors.label !== undefined} aria-describedby="expense-label-error" />
        <p id="expense-label-error" className="error">
          {messageFor(errors.label)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="expense-amount">%%valueLabel%%</label>
        <input id="expense-amount" name="amount" inputMode="decimal" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} aria-invalid={errors.amountMinor !== undefined} aria-describedby="expense-amount-error" />
        <p id="expense-amount-error" className="error">
          {messageFor(errors.amountMinor)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="expense-date">%%dateFieldLabel%%</label>
        <input id="expense-date" name="date" type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} aria-invalid={errors.date !== undefined} aria-describedby="expense-date-error" />
        <p id="expense-date-error" className="error">
          {messageFor(errors.date)}
        </p>
      </div>
      <div className="field">
        <label htmlFor="expense-category">%%categoryFieldLabel%%</label>
        <select id="expense-category" name="category" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} aria-invalid={errors.category !== undefined} aria-describedby="expense-category-error">
          <option value="">%%chooseCategory%%</option>
          <option value="food">%%categoryFood%%</option>
          <option value="transport">%%categoryTransport%%</option>
          <option value="home">%%categoryHome%%</option>
          <option value="fun">%%categoryFun%%</option>
        </select>
        <p id="expense-category-error" className="error">
          {messageFor(errors.category)}
        </p>
      </div>
      <button type="submit">%%saveLabel%%</button>
      {expense !== null && (
        <button type="button" onClick={onCancel}>
          %%cancelEditLabel%%
        </button>
      )}
    </form>
  );
}
