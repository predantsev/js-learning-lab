// One expense. JSX puts every value in as text, so a label with markup stays text. The amount stays
// whole kopiykas in the record; formatMoney turns it into hryvnias only for the display.
import { categoryText } from "../domain/expenses.ts";
import type { Expense } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";

type ExpenseCardProps = { expense: Expense };

export function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <li className="card">
      <h3>{expense.label}</h3>
      <p>{formatMoney(expense.amountMinor, LOCALE)}</p>
      <p>%%dateFieldLabel%%: {expense.date}</p>
      <p>%%categoryFieldLabel%%: {categoryText(expense.category)}</p>
    </li>
  );
}
