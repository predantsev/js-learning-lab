import { useState } from "react";
import { CATEGORIES, expenses as startExpenses, formatAmount } from "./expenses.js";

export default function ExpenseList() {
  const [expenses, setExpenses] = useState(startExpenses);
  const [selected, setSelected] = useState("all");

  function handleRemove(id) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  function matches(expense) {
    return selected === "all" || expense.category === selected;
  }
  const visible = expenses.filter(matches);
  const count = visible.length;
  let total = 0;
  for (const expense of visible) {
    total += expense.amountMinor;
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <div className="filter">
        <button onClick={() => setSelected("all")}>%%all%%</button>
        {CATEGORIES.map((category) => (
          <button key={category.id} onClick={() => setSelected(category.id)}>
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
