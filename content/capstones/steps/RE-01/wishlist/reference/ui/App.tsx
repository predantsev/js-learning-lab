// The whole page as a tree of components: App → Section → ItemForm and Section → ItemList → one ItemCard per wish.
// The numbers come from the pure domain functions, which stay exactly as they were.
import { summarizeItems, categoriesInUse } from "../domain/wishes.ts";
import type { Wish } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";
import { ItemForm } from "./ItemForm.tsx";
import { ItemList } from "./ItemList.tsx";
import { Section } from "./Section.tsx";

type AppProps = { items: Wish[] };

export function App({ items }: AppProps) {
  const summary = summarizeItems(items);
  return (
    <main>
      <h1>%%projectTitle%%</h1>
      <p className="pitch">%%pitch%%</p>
      <img src="images/wish.svg" alt="%%imageAlt%%" />
      <Section title="%%formTitle%%">
        <ItemForm categories={[...categoriesInUse(items)]} />
      </Section>
      <p>
        %%summaryCount%%: {summary.count} · %%summaryWantedTotal%%: {formatPrice(summary.wantedTotal, LOCALE)} · %%summaryNoPrice%%: {summary.wantedWithoutPrice}
      </p>
      <Section title="%%listTitle%%">
        <ItemList items={items} />
      </Section>
    </main>
  );
}
