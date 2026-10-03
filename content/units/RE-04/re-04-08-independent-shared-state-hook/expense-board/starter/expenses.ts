// The expense model and helpers. Read-only.
export type Expense = { readonly id: string; label: string; amountMinor: number };

// The whole state of the board: the list and the id of the selected expense (or null).
export type ExpensesState = { expenses: Expense[]; selectedId: string | null };

export const STORAGE_KEY = "jsll.lab.expenses";

export const START_EXPENSES: Expense[] = [
  { id: "e-01", label: "%%groceries%%", amountMinor: 84550 },
  { id: "e-02", label: "%%transit%%", amountMinor: 52000 },
  { id: "e-03", label: "%%coffee%%", amountMinor: 18000 },
];

// "12,5" or "12.5" → 1250; anything that is not a positive amount → null.
export function toMinor(text: string): number | null {
  const amount = Number(text.trim().replace(",", "."));
  return text.trim() !== "" && Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : null;
}

export function formatAmount(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}

let nextNumber = 10;

// A fresh id for a new expense: "e-10", "e-11", …
export function nextExpenseId(): string {
  const id = "e-" + String(nextNumber);
  nextNumber += 1;
  return id;
}
