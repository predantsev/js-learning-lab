import { useParams } from "./router";
import { catalog } from "./catalog";
import { ItemCard } from "./ItemCard";

// The details page of one gift idea.
export default function ItemDetails() {
  const { id } = useParams();
  const item = catalog.find((entry) => entry.id === id);
  if (item === undefined) return <p>%%notFound%%</p>;
  return (
    <section aria-label="%%details%%">
      <h2>{item.name}</h2>
      <ItemCard item={item} />
    </section>
  );
}
