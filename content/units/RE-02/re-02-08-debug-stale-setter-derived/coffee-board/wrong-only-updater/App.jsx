import { useState } from "react";
import { CATEGORIES, expenses as startExpenses, createCoffee, formatAmount } from "./expenses.js";

export default function CoffeeBoard() {
  const [expenses, setExpenses] = useState(startExpenses);
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(startExpenses);
  const [total, setTotal] = useState(123600);

  function handleCategory(id) {
    setCategory(id);
    setVisible(id === "all" ? expenses : expenses.filter((expense) => expense.category === id));
  }

  // "Saving" takes 300 ms, then the coffee is added.
  function handleAddCoffee() {
    const coffee = createCoffee();
    setTimeout(() => {
      setExpenses((previous) => [...previous, coffee]);
      setTotal((previous) => previous + coffee.amountMinor);
    }, 300);
  }

  function handleRemove(id) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
    setVisible(visible.filter((expense) => expense.id !== id));
  }

  return (
    <section>
      <h1>%%title%%</h1>
      <div className="filter">
        <button aria-pressed={category === "all"} onClick={() => handleCategory("all")}>%%all%%</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} aria-pressed={category === c.id} onClick={() => handleCategory(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <button className="add" onClick={handleAddCoffee}>%%addCoffee%%</button>
      <p className="total">%%total%%: {formatAmount(total)} %%currency%%</p>
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
