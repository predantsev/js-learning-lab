import { useEffect, useState } from 'react';

export const POLL_MS = 3000;

const money = (amountMinor) => (amountMinor / 100).toFixed(2);

// The expenses of one category, kept fresh: asks the server again every POLL_MS.
export function ExpenseList({ category }) {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    async function load() {
      const response = await fetch(`/api/expenses?category=${category}`);
      setExpenses(await response.json());
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [category]);

  return (
    <ul>
      {expenses.map((expense) => (
        <li key={expense.id}>
          {expense.label} — {money(expense.amountMinor)}
        </li>
      ))}
    </ul>
  );
}
