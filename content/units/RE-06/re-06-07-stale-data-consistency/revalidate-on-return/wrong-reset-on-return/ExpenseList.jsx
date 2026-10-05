import { useEffect } from "react";
import { invalidateExpenses, resetExpensesQuery, useExpenses } from "./expensesQuery.js";

export default function ExpenseList({ onOpen }) {
  const { data, updatedAt } = useExpenses();

  // Revalidate on return: whenever this screen appears, the list may have changed elsewhere.
  useEffect(() => {
    resetExpensesQuery(); // start from nothing every time
    invalidateExpenses();
  }, []);

  if (data === null) return <p role="status">%%loading%%</p>;
  return (
    <section>
      <p>
        %%updatedAt%% {updatedAt}
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
