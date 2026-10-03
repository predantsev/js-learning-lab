// The list screen: #/items. The form for a new wish, the summary, the filter and the cards. The filter
// is needed only here, so it is this screen's own state; the list comes from the data hook.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { summarizeItems, categoriesInUse, filterItems } from "../domain/wishes.ts";
import type { WishStatus } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";
import { Section } from "./Section.tsx";
import { useItemsData } from "./useItems.ts";
import { useHeadingFocus } from "./focus.ts";
import type { WishFields } from "./itemsReducer.ts";

type Filter = "all" | WishStatus;

export function ItemsScreen() {
  const { items, dispatch } = useItemsData();
  const [filter, setFilter] = useState<Filter>("all");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a wish whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = filter === "all" ? items : filterItems(items, filter);
  const summary = summarizeItems(items);

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleRemove(id: string) {
    const index = shown.findIndex((item) => item.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "wanted" || value === "acquired") {
      setFilter(value);
    }
  }

  return (
    <>
      <Section title="%%formTitle%%">
        <ItemForm item={null} categories={[...categoriesInUse(items)]} onSave={(fields: WishFields) => dispatch({ type: "added", fields: fields })} />
      </Section>
      <p>
        %%summaryCount%%: {summary.count} · %%summaryWantedTotal%%: {formatPrice(summary.wantedTotal, LOCALE)} · %%summaryNoPrice%%: {summary.wantedWithoutPrice}
      </p>
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="wanted">%%filterWanted%%</option>
            <option value="acquired">%%filterAcquired%%</option>
          </select>
        </div>
        <div ref={listRef}>
          <ItemList items={shown} emptyText={items.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={(id) => dispatch({ type: "acquiredToggled", id: id })} onRemove={handleRemove} />
        </div>
      </Section>
    </>
  );
}
