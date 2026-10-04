// The expense form as text, and what the shared rules say about it. Nothing here imports React Native,
// so Node.js runs its tests (tests/draft.test.js) just as it runs the domain tests.
import { formatAmount, parseAmountMinor, validateExpense } from "../domain/expenses.ts";
import type { Expense, ExpenseErrorKey, ValidationResult } from "../domain/expenses.ts";

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
