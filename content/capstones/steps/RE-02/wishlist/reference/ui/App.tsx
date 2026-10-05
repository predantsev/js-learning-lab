// The whole page as a tree of components: App → Section → ItemForm and Section → ItemList → one
// ItemCard per wish. App owns the list, the wish being edited and the filter; every change is a new
// list computed by the pure domain functions, which stay exactly as they were.
import { useState } from "react";
import type { ChangeEvent } from "react";
import { summarizeItems, categoriesInUse, filterItems, addItem, updateItem, removeItem } from "../domain/wishes.ts";
import type { Wish, WishStatus } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import type { WishFields } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";
import { Section } from "./Section.tsx";

type Filter = "all" | WishStatus;

// An id that no wish of the list has yet (saved wishes may already use "w-7").
function newId(list: Wish[]): string {
  let number = list.length + 1;
  while (list.some((item) => item.id === "w-" + number)) {
    number += 1;
  }
  return "w-" + number;
}

type AppProps = { initialItems: Wish[] };

export function App({ initialItems }: AppProps) {
  const [items, setItems] = useState<Wish[]>(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  // Computed during render from the same state, never stored: they cannot fall out of step.
  const editing = items.find((item) => item.id === editingId) ?? null;
  const shown = filter === "all" ? items : filterItems(items, filter);
  const summary = summarizeItems(items);

  function handleSave(fields: WishFields) {
    if (editingId === null) {
      setItems((previous) => addItem(previous, newId(previous), fields));
    } else {
      const id = editingId;
      setItems((previous) => updateItem(previous, id, fields));
      setEditingId(null);
    }
  }

  function handleToggle(id: string) {
    setItems((previous) => {
      const item = previous.find((one) => one.id === id);
      return item === undefined ? previous : updateItem(previous, id, { acquired: !item.acquired });
    });
  }

  function handleRemove(id: string) {
    setItems((previous) => removeItem(previous, id));
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
      <Section title="%%listTitle%%">
        <div className="field">
          <label htmlFor="list-filter">%%filterLabel%%</label>
          <select id="list-filter" value={filter} onChange={handleFilter}>
            <option value="all">%%filterAll%%</option>
            <option value="wanted">%%filterWanted%%</option>
            <option value="acquired">%%filterAcquired%%</option>
          </select>
        </div>
        <ItemList items={shown} emptyText={items.length === 0 ? "%%emptyMessage%%" : "%%filterEmptyMessage%%"} onToggle={handleToggle} onEdit={setEditingId} onRemove={handleRemove} />
      </Section>
    </main>
  );
}
