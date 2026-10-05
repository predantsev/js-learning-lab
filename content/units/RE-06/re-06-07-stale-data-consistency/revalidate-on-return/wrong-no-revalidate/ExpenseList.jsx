import { useExpenses } from "./expensesQuery.js";

export default function ExpenseList({ onOpen }) {
  const { data, updatedAt } = useExpenses();

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
