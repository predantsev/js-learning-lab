import { useEffect, useRef } from "react";
import { Link, useLocation, useParams } from "./router";
import { categories, expenses, formatMinor, type Expense } from "./expensesData";

// The page of the route /categories/:id.
export default function CategoryPage() {
  const { id } = useParams() as { id: string };
  const { action } = useLocation();
  const heading = useRef<HTMLHeadingElement>(null);

  // Derived during render from the route parameter: nothing here is copied into state.
  const category = categories.find((item) => item.id === id);
  const items: Expense[] = expenses.filter((expense) => expense.category === id);
  const totalMinor = items.reduce((sum, expense) => sum + expense.amountMinor, 0);
  const title = category ? category.name : "%%notFound%%";

  useEffect(() => {
    document.title = `${title} — %%appName%%`;
    if (action !== "initial") heading.current?.focus();
  }, [title, action]);

  if (!category) {
    return (
      <section>
        <h1 ref={heading} tabIndex={-1}>
          %%notFound%%
        </h1>
        <Link to="/expenses">%%backToList%%</Link>
      </section>
    );
  }

  return (
    <section>
      <h1 ref={heading} tabIndex={-1}>
        {category.name}
      </h1>
      <p>
        %%total%%: {formatMinor(totalMinor)} %%currency%%
      </p>
      <ul>
        {items.map((expense) => (
          <li key={expense.id}>
            {expense.label} — {formatMinor(expense.amountMinor)} %%currency%%
          </li>
        ))}
      </ul>
    </section>
  );
}
