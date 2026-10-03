import { useEffect } from "react";
import { invalidateExpenses, useExpenses } from "./expensesQuery.js";

export default function ExpenseList({ onOpen }) {
  const { data, updatedAt } = useExpenses();

  // Revalidate on a timer: every 250 ms, while the screen is open.
  useEffect(() => {
    const timer = setInterval(invalidateExpenses, 250);
    return () => clearInterval(timer);
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
