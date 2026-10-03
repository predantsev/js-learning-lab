// The list of wishes: one ItemCard per wish, keyed by the wish's id, or a message when there are none.
import type { Wish } from "../domain/wishes.ts";
import { ItemCard } from "./ItemCard.tsx";

type ItemListProps = { items: Wish[] };

export function ItemList({ items }: ItemListProps) {
  if (items.length === 0) {
    return <p>%%emptyMessage%%</p>;
  }
  return (
    <ul className="cards">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </ul>
  );
}
