import { useEffect, useState } from 'react';

export const POLL_MS = 3000;

const money = (amountMinor) => (amountMinor / 100).toFixed(2);

// The expenses of one category, kept fresh: asks the server again every POLL_MS.
export function ExpenseList({ category }) {
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/expenses?category=${category}`, { signal: controller.signal });
        setExpenses(await response.json());
      } catch (error) {
        if (error.name !== 'AbortError') console.error(error);
      }
    }
    load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      clearInterval(timer);
      controller.abort(); // an answer still on its way must not reach this list any more
    };
  }, []);

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
