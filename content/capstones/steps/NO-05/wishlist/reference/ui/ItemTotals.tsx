// The totals of the wishlist: #/items/summary. This module is not in dist/app.js: SummaryRoute.tsx
// loads it with React.lazy when the route opens, and esbuild (--splitting) writes it to its own file.
import { summarizeItems } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { Link } from "./router.tsx";
import { useItemsList } from "./itemsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";

export default function ItemTotals() {
  const all = useItemsList("all");
  const headingRef = useHeadingFocus("%%summaryTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const summary = summarizeItems(all.items);
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%summaryTitle%%
      </h2>
      <dl>
        <dt>%%summaryCount%%</dt>
        <dd>{summary.count}</dd>
        <dt>%%summaryWantedTotal%%</dt>
        <dd>{formatPrice(summary.wantedTotal, LOCALE)}</dd>
        <dt>%%summaryNoPrice%%</dt>
        <dd>{summary.wantedWithoutPrice}</dd>
      </dl>
      <p>
        <Link to="/items">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
