// The expense form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { formatAmount, parseAmountMinor, validateExpense } from "../domain/expenses.ts";
import type { CategoryId, Expense, ExpenseErrorKey, ValidationResult } from "../domain/expenses.ts";
import type { ExpenseFields } from "../ui/expensesReducer.ts";

// The fields as the form holds them: the amount stays text in hryvnias exactly as typed.
export type Draft = { label: string; amount: string; date: string; category: string };

export function draftOf(expense: Expense | null): Draft {
  if (expense === null) {
    return { label: "", amount: "", date: "", category: "" };
  }
  return { label: expense.label, amount: formatAmount(expense.amountMinor), date: expense.date, category: expense.category };
}

// The amount becomes whole kopiykas through parseAmountMinor; validateExpense checks the rest exactly
// as in the web form.
export function checkDraft(draft: Draft): ValidationResult {
  return validateExpense({ label: draft.label, amountMinor: parseAmountMinor(draft.amount), date: draft.date, category: draft.category });
}

// The fields expensesReducer saves, from a draft that passed checkDraft: exactly its cleaned values.
export function fieldsOf(value: { label: string; amountMinor: number; date: string; category: CategoryId }): ExpenseFields {
  return { label: value.label, amountMinor: value.amountMinor, date: value.date, category: value.category };
}

// Whether the draft differs from the saved expense: spaces at the edges do not count, and the amount is
// compared in kopiykas, so "520" and "520,00" are the same amount.
export function hasUnsavedChanges(draft: Draft, saved: Expense): boolean {
  return draft.label.trim() !== saved.label || parseAmountMinor(draft.amount) !== saved.amountMinor || draft.date.trim() !== saved.date || draft.category !== saved.category;
}

// The text the form shows for an error key; no key means no message.
export function messageFor(errorKey: ExpenseErrorKey | undefined): string {
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
