// The whole page as a tree of components: App → ItemForm, ItemList → one ItemCard per wish.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { summarizeItems, categoriesInUse } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";

type AppProps = { items: Wish[] };

export function App({ items }: AppProps) {
  const summary = summarizeItems(items);
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/wish.svg" alt="%%imageAlt%%" />
      <ItemForm categories={[...categoriesInUse(items)]} />
      <p>
        %%summaryCount%%: {summary.count} · %%summaryWantedTotal%%: {formatPrice(summary.wantedTotal, LOCALE)} · %%summaryNoPrice%%: {summary.wantedWithoutPrice}
      </p>
      <h2>%%listTitle%%</h2>
      <ItemList items={items} />
    </main>
  );
}
