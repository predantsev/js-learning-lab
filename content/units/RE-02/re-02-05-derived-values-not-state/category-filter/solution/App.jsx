import { useState } from "react";
import { CATEGORIES, expenses as startExpenses, formatAmount } from "./expenses.js";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(startExpenses);
  const [category, setCategory] = useState("all");

  function handleRemove(id) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  const visible = category === "all" ? expenses : expenses.filter((expense) => expense.category === category);
  const count = visible.length;
  const total = visible.reduce((sum, expense) => sum + expense.amountMinor, 0);

  return (
    <section>
      <h1>%%title%%</h1>
      <div className="filter">
        <button onClick={() => setCategory("all")}>%%all%%</button>
        {CATEGORIES.map((category) => (
          <button key={category.id} onClick={() => setCategory(category.id)}>
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
