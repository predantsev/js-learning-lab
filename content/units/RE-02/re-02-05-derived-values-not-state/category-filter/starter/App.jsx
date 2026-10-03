import { useState } from "react";
import { CATEGORIES, expenses as startExpenses, formatAmount } from "./expenses.js";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(startExpenses);
  // TODO: keep the selected category ("all" or a category id) in state

  function handleRemove(id) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  // TODO: compute the visible expenses, their count and their total here
  const visible = expenses;
  const count = 0;
  const total = 0;

  return (
    <section>
      <h1>%%title%%</h1>
      <div className="filter">
        <button onClick={() => {}}>%%all%%</button>
        {CATEGORIES.map((category) => (
          <button key={category.id} onClick={() => {}}>
            {category.name}
          </button>
        ))}
      </div>
      <p className="summary">
        %%shown%%: {count} · %%total%%: {formatAmount(total)} %%currency%%
      </p>
      <ul>
        {visible.map((expense) => (
          <li key={expense.id}>
            {expense.label} — {formatAmount(expense.amountMinor)} %%currency%%{" "}
            <button onClick={() => handleRemove(expense.id)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
