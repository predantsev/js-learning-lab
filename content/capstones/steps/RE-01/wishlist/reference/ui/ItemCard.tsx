// One wish. JSX puts every value in as text, so a name with markup stays text.
import type { Wish } from "../domain/wishes.ts";
import { formatPrice, LOCALE } from "./format.js";

type ItemCardProps = { item: Wish };

export function ItemCard({ item }: ItemCardProps) {
  return (
    <li className="card">
      <h3>{item.name}</h3>
      <p>%%valueLabel%%: {item.price === null ? "%%noPrice%%" : formatPrice(item.price, LOCALE)}</p>
      {item.category !== null && <p>%%categoryFieldLabel%%: {item.category}</p>}
      {item.acquired && <p className="badge">%%acquiredMark%%</p>}
    </li>
  );
}
