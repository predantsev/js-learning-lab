// One expense. JSX puts every value in as text, so a label with markup stays text. The amount stays
// whole kopiykas in the record; formatMoney turns it into hryvnias only for the display. Every
// button's accessible name also names the expense, so the buttons of different cards are told apart.
import { useEffect, useRef, useState } from "react";
import { categoryText } from "../domain/expenses.ts";
import { Link } from "./router.tsx";
import type { Expense } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";

type ExpenseCardProps = {
  expense: Expense;
  onRemove: (id: string) => void;
};

export function ExpenseCard({ expense, onRemove }: ExpenseCardProps) {
  // Only this card needs to know that its delete waits for a confirmation, so the state lives here.
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deleteRef = useRef<HTMLButtonElement>(null);
  // The button that had focus disappears when the card switches between its two sets of buttons, so
  // focus moves to the matching button of the new set. The first commit moves nothing.
  const switched = useRef(false);
  useEffect(() => {
    if (!switched.current) {
      return;
    }
    switched.current = false;
    (confirming ? cancelRef : deleteRef).current?.focus();
  }, [confirming]);

  function showConfirmation(value: boolean) {
    switched.current = true;
    setConfirming(value);
  }
  return (
    <li className="card" data-id={expense.id}>
      <h3>
        <Link to={"/expenses/" + expense.id}>{expense.label}</Link>
      </h3>
      <p>{formatMoney(expense.amountMinor, LOCALE)}</p>
      <p>%%dateFieldLabel%%: {expense.date}</p>
      <p>%%categoryFieldLabel%%: {categoryText(expense.category)}</p>
      {confirming ? (
        <>
          <p>%%confirmQuestion%%</p>
          <button type="button" aria-label={"%%confirmDeleteLabel%%: " + expense.label} onClick={() => onRemove(expense.id)}>
            %%confirmDeleteLabel%%
          </button>
          <button type="button" ref={cancelRef} aria-label={"%%cancelLabel%%: " + expense.label} onClick={() => showConfirmation(false)}>
            %%cancelLabel%%
          </button>
        </>
      ) : (
        <>
          <Link to={"/expenses/" + expense.id + "/edit"} aria-label={"%%editLabel%%: " + expense.label}>
            %%editLabel%%
          </Link>
          <button type="button" ref={deleteRef} data-action="delete" aria-label={"%%deleteLabel%%: " + expense.label} onClick={() => showConfirmation(true)}>
            %%deleteLabel%%
          </button>
        </>
      )}
    </li>
  );
}
