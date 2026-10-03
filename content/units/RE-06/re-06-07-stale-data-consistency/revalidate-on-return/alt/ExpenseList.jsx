import { useEffect } from "react";
import { invalidateExpenses, useExpenses } from "./expensesQuery.js";

// The label lives in its own small component that reads the cache entry.
function UpdatedAt() {
  const entry = useExpenses();
  return <p>{`%%updatedAt%% ${entry.updatedAt}`}</p>;
}

export default function ExpenseList({ onOpen }) {
  const expenses = useExpenses();
  useEffect(invalidateExpenses, []);

  if (expenses.data === null) return <p role="status">%%loading%%</p>;
  return (
    <section>
      <UpdatedAt />
      <ul>
        {expenses.data.map((expense) => (
          <li key={expense.id}>
            <button onClick={() => onOpen(expense.id)}>{expense.label}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
