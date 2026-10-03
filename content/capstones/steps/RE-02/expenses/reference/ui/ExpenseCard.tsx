// One expense. JSX puts every value in as text, so a label with markup stays text. The amount stays
// whole kopiykas in the record; formatMoney turns it into hryvnias only for the display. Every
// button's accessible name also names the expense, so the buttons of different cards are told apart.
import { useState } from "react";
import { categoryText } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";

type ExpenseCardProps = {
  expense: Expense;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
};

export function ExpenseCard({ expense, onEdit, onRemove }: ExpenseCardProps) {
  // Only this card needs to know that its delete waits for a confirmation, so the state lives here.
  const [confirming, setConfirming] = useState(false);
  return (
    <li className="card">
      <h3>{expense.label}</h3>
      <p>{formatMoney(expense.amountMinor, LOCALE)}</p>
      <p>%%dateFieldLabel%%: {expense.date}</p>
      <p>%%categoryFieldLabel%%: {categoryText(expense.category)}</p>
      {confirming ? (
        <>
          <p>%%confirmQuestion%%</p>
          <button type="button" aria-label={"%%confirmDeleteLabel%%: " + expense.label} onClick={() => onRemove(expense.id)}>
            %%confirmDeleteLabel%%
          </button>
          <button type="button" aria-label={"%%cancelLabel%%: " + expense.label} onClick={() => setConfirming(false)}>
            %%cancelLabel%%
          </button>
        </>
      ) : (
        <>
          <button type="button" aria-label={"%%editLabel%%: " + expense.label} onClick={() => onEdit(expense.id)}>
            %%editLabel%%
          </button>
          <button type="button" aria-label={"%%deleteLabel%%: " + expense.label} onClick={() => setConfirming(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
