import { useEffect, useState } from "react";
import { invalidateExpenses, useExpenses } from "./expensesQuery.js";

export default function ExpenseList({ onOpen }) {
  const { data, updatedAt } = useExpenses();
  const [shownAt, setShownAt] = useState(null);
  // A copy of the time in this component's own state, set once.
  useEffect(() => {
    if (shownAt === null && updatedAt !== null) setShownAt(updatedAt);
  }, [shownAt, updatedAt]);

  // Revalidate on return: whenever this screen appears, the list may have changed elsewhere.
  useEffect(() => {
    invalidateExpenses();
  }, []);

  if (data === null) return <p role="status">%%loading%%</p>;
  return (
    <section>
      <p>
        %%updatedAt%% {shownAt}
      </p>
      <ul>
        {data.map((expense) => (
          <li key={expense.id}>
            <button onClick={() => onOpen(expense.id)}>{expense.label}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
