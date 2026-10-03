import { useEffect, useRef } from "react";
import { useLocation } from "./router";
import { categories, expenses, formatMinor } from "./expensesData";

export default function ExpensesPage() {
  const heading = useRef<HTMLHeadingElement>(null);
  const { action } = useLocation();

  useEffect(() => {
    document.title = "%%allExpenses%% — %%appName%%";
    if (action !== "initial") heading.current?.focus();
  }, [action]);

  return (
    <section>
      <h1 ref={heading} tabIndex={-1}>
        %%allExpenses%%
      </h1>
      <ul>
        {expenses.map((expense) => (
          <li key={expense.id}>
            {expense.label} — {formatMinor(expense.amountMinor)} %%currency%% ·{" "}
            {categories.find((category) => category.id === expense.category)?.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
