// The wishes grouped by category: #/items/categories. Every category in the alphabetical order of its
// name (the wishes without a category last), its wishes as links, and the price total of the wishes
// still wanted in it — acquired wishes and wishes without a price add nothing.
import type { Wish } from "../domain/wishes.ts";
import { Link } from "./router.tsx";
import { useItemsList } from "./itemsCache.tsx";
import { QueryState } from "./QueryState.tsx";
import { useHeadingFocus } from "./focus.ts";
import { formatPrice, LOCALE } from "./format.js";

type Group = { category: string | null; items: Wish[]; wantedTotal: number };

// Pure: the same list gives the same groups, so the screen only renders them.
export function groupByCategory(list: readonly Wish[]): Group[] {
  const groups = new Map<string | null, Wish[]>();
  for (const item of list) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
  }
  const named = [...groups.keys()].filter((key) => key !== null).sort((a, b) => a.localeCompare(b, LOCALE));
  const order = groups.has(null) ? [...named, null] : named;
  return order.map((category) => {
    const items = groups.get(category) ?? [];
    const wantedTotal = items.reduce((sum, item) => (item.acquired || item.price === null ? sum : sum + item.price), 0);
    return { category: category, items: items, wantedTotal: wantedTotal };
  });
}

export function ItemCategories() {
  const all = useItemsList("all");
  const headingRef = useHeadingFocus("%%categoriesTitle%%");
  if (all.items === null) {
    return <QueryState query={all} />;
  }
  const groups = groupByCategory(all.items);
  return (
    <section>
      <h2 ref={headingRef} tabIndex={-1}>
        %%categoriesTitle%%
      </h2>
      {groups.length === 0 && <p>%%emptyMessage%%</p>}
      {groups.map((group) => (
        <section key={group.category ?? ""} aria-labelledby={"category-" + (group.category ?? "none")}>
          <h3 id={"category-" + (group.category ?? "none")}>{group.category ?? "%%noCategoryLabel%%"}</h3>
          <p>
            %%summaryWantedTotal%%: {formatPrice(group.wantedTotal, LOCALE)}
          </p>
          <ul>
            {group.items.map((item) => (
              <li key={item.id}>
                <Link to={"/items/" + item.id}>{item.name}</Link>
                {item.acquired && " · %%acquiredMark%%"}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p>
        <Link to="/items">%%backToListLabel%%</Link>
      </p>
    </section>
  );
}
