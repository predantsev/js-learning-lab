import { memo } from "react";
import { expenses } from "./expenses";

const SHOWN = 200;

// Imitates a heavy row: each row deliberately keeps the main thread busy for 1 ms.
function SlowRow({ expense }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{expense.label}</li>;
}

// memo (RE-07): the list renders again only when its `query` prop changes.
export const ExpenseList = memo(function ExpenseList({ query }) {
  const needle = query.toLowerCase();
  const matches = expenses.filter((expense) => expense.label.toLowerCase().includes(needle));
  return (
    <section aria-label="%%results%%">
      <p>%%found%%: {matches.length}</p>
      <ul>
        {matches.slice(0, SHOWN).map((expense) => (
          <SlowRow key={expense.id} expense={expense} />
        ))}
      </ul>
    </section>
  );
});
