// The list of expenses: one ExpenseCard per expense, keyed by the expense's id, or a message when
// there are none.
import type { Expense } from "../domain/expenses.ts";
import { ExpenseCard } from "./ExpenseCard.tsx";

type ExpenseListProps = { expenses: Expense[] };

export function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <p>%%emptyMessage%%</p>;
  }
  return (
    <ul className="cards">
      {expenses.map((expense) => (
        <ExpenseCard key={expense.id} expense={expense} />
      ))}
    </ul>
  );
}
