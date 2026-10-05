// The whole page as a tree of components: App → Section → ItemForm and Section → ItemList → one
// ItemCard per wish. App is the lowest common parent of the form and the list, so the shared state
// lives here: the list (through useItems), the wish being edited and the filter. What only one card
// needs (a delete waiting for its confirmation) stays in that card.
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { summarizeItems, categoriesInUse, filterItems } from "../domain/wishes.ts";
import type { Wish, WishStatus } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";
import { Section } from "./Section.tsx";
import { useItems } from "./useItems.ts";
import type { WishFields } from "./itemsReducer.ts";

type Filter = "all" | WishStatus;

type AppProps = { startingItems: Wish[] };

export function App({ startingItems }: AppProps) {
  const [items, dispatch] = useItems(startingItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Where focus goes after the next commit: the id of a wish whose Delete button gets it, "heading",
  // or null for nowhere. A ref, not state: changing it must not cause a render.
  const focusAfterRemove = useRef<string | null>(null);

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = items.find((item) => item.id === editingId) ?? null;
  const shown = filter === "all" ? items : filterItems(items, filter);
  const summary = summarizeItems(items);

  // Runs after every commit; it does something only when a delete has asked for it. The card that had
  // focus is gone after the commit, so focus moves to the next card (or the previous one), and to the
  // list heading when no card is left.
  useEffect(() => {
    const target = focusAfterRemove.current;
    if (target === null) {
      return;
    }
    focusAfterRemove.current = null;
    const button = target === "heading" ? null : listRef.current?.querySelector<HTMLButtonElement>('[data-id="' + target + '"] [data-action="delete"]');
    (button ?? listHeadingRef.current)?.focus();
  });

  function handleSave(fields: WishFields) {
    if (editingId === null) {
      dispatch({ type: "added", fields: fields });
    } else {
      dispatch({ type: "updated", id: editingId, fields: fields });
      setEditingId(null);
    }
  }

  function handleRemove(id: string) {
    const index = shown.findIndex((item) => item.id === id);
    const next = shown[index + 1] ?? shown[index - 1];
    focusAfterRemove.current = next === undefined ? "heading" : next.id;
    dispatch({ type: "removed", id: id });
    if (editingId === id) {
      setEditingId(null);
    }
  }

  function handleFilter(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    if (value === "all" || value === "wanted" || value === "acquired") {
      setFilter(value);
    }
  }

  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/wish.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        {/* A new key gives a new form: picking another wish starts the form from that wish's data. */}
        <ItemForm key={editingId ?? "new"} item={editing} categories={[...categoriesInUse(items)]} onSave={handleSave} onCancel={() => setEditingId(null)} />
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
          <ItemList
            items={shown}
            emptyText={items.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"}
            onToggle={(id) => dispatch({ type: "acquiredToggled", id: id })}
            onEdit={setEditingId}
            onRemove={handleRemove}
          />
        </div>
      </Section>
    </main>
  );
}
