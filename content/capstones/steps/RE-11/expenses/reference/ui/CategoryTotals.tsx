// The totals by category: #/expenses/summary. This module is not in dist/app.js: SummaryRoute.tsx
// loads it with React.lazy when the route opens, and esbuild (--splitting) writes it to its own file.
import { totalsByCategory, totalOf, categoryText } from "../domain/expenses.ts";
import { formatMoney, LOCALE } from "./format.js";
import { Link } from "./router.tsx";
import { useExpensesList } from "./expensesCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";

export default function CategoryTotals() {
  const all = useExpensesList("all");
  const headingRef = useHeadingFocus("%%summaryTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%summaryTitle%%
      </h2>
      <dl>
        {[...totalsByCategory(all.items)].map(([category, sum]) => (
          <div key={category}>
            <dt>{categoryText(category)}</dt>
            <dd>{formatMoney(sum, LOCALE)}</dd>
          </div>
        ))}
        <div>
          <dt>%%totalLabel%%</dt>
          <dd>{formatMoney(totalOf(all.items), LOCALE)}</dd>
        </div>
      </dl>
      <p>
        <Link to="/expenses">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
