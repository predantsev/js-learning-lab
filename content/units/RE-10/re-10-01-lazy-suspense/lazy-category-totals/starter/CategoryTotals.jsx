import { markLoaded } from "./loadLog";
import { categories, expenses } from "./expenses";

markLoaded("CategoryTotals.jsx");

// Totals per category, in minor units (kopiykas), shown with two decimals.
export default function CategoryTotals() {
  return (
    <section aria-label="%%totalsTitle%%">
      <h2>%%totalsTitle%%</h2>
      <ul>
        {categories.map((category) => {
          const total = expenses
            .filter((expense) => expense.category === category.id)
            .reduce((sum, expense) => sum + expense.amountMinor, 0);
          return (
            <li key={category.id}>
              {category.name}: {(total / 100).toFixed(2)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
