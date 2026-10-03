import { useExpenses } from "./expensesQuery.js";

export default function ExpenseList({ onOpen }) {
  const { data } = useExpenses();

  // TODO: fetch the list again every time this screen appears (returning from an expense),
  // and show when the data on screen was fetched: %%updatedAt%% <time>.

  if (data === null) return <p role="status">%%loading%%</p>;
  return (
    <section>
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
