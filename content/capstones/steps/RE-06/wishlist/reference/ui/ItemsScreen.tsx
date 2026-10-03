// The list screen: #/items. The form for a new wish, the summary, the filter and the cards. Two
// queries: the wishes of the chosen filter for the cards, and all wishes for the summary. A filter
// change starts a new request and aborts the one still on its way. The filter is needed only here,
// so it is this screen's own state.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { summarizeItems, categoriesInUse } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";
import type { ListFilter } from "../data/api.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";
import { Section } from "./Section.tsx";
import { QueryState } from "./QueryState.tsx";
import { useItemsList, useItemMutations } from "./itemsCache.tsx";
import { useHeadingFocus } from "./focus.ts";
import type { WishFields } from "./itemsReducer.ts";

export function ItemsScreen() {
  const [filter, setFilter] = useState<ListFilter>("all");
  const list = useItemsList(filter);
  const all = useItemsList("all");
  const mutations = useItemMutations();
  // What the last change did or why it failed; role="status" reads it out.
  const [notice, setNotice] = useState("");
  // The list heading takes focus after a route change and after the last card is deleted.
  const listHeadingRef = useHeadingFocus("%%listTitle%%");
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a wish whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  const shown = list.items ?? [];

  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    // The removed card disappears only when the list has been read again; until then keep waiting.
    if (target !== "heading" && button === null && list.status === "refreshing") {
      return;
    }
    focusAfterRemove.current = null;
    (button ?? listHeadingRef.current)?.focus();
  });

  async function handleCreate(fields: WishFields): Promise<boolean> {
    const result = await mutations.create(fields);
    setNotice(result.ok ? "" : result.message);
    return result.ok;
  }

  async function handleToggle(item: Wish) {
    const result = await mutations.toggleAcquired(item);
    setNotice(result.ok ? "" : result.message);
  }

  async function handleRemove(id: string) {
    const index = shown.findIndex((item) => item.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    const result = await mutations.remove(id);
    if (result.ok) {
      focusAfterRemove.current = next === undefined ? "heading" : next.id;
    }
    setNotice(result.ok ? "" : result.message);
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "wanted" || value === "acquired") {
      setFilter(value);
    }
  }

  const summary = all.items === null ? null : summarizeItems(all.items);
  return (
    <>
      <Section title="%%formTitle%%">
        <ItemForm item={null} categories={[...categoriesInUse(all.items ?? [])]} onSave={handleCreate} />
      </Section>
      <p role="status">{notice}</p>
      {summary !== null && (
        <p>
          %%summaryCount%%: {summary.count} · %%summaryWantedTotal%%: {formatPrice(summary.wantedTotal, LOCALE)} · %%summaryNoPrice%%: {summary.wantedWithoutPrice}
        </p>
      )}
      <Section title="%%listTitle%%" headingRef={listHeadingRef}>
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="wanted">%%filterWanted%%</option>
            <option value="acquired">%%filterAcquired%%</option>
          </select>
        </div>
        <QueryState query={list} />
        {list.items !== null && (
          <div ref={listRef}>
            <ItemList items={shown} emptyText={filter === "all" ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={handleToggle} onRemove={handleRemove} />
          </div>
        )}
      </Section>
    </>
  );
}
