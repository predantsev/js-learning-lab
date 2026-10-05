import { memo } from "react";
import { Link } from "./router";
import { catalog } from "./catalog";

// Imitates a heavy row: each row deliberately keeps the main thread busy for 1 ms.
function SlowRow({ item }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return (
    <li>
      <Link to={`/items/${item.id}`}>{item.name}</Link>
    </li>
  );
}

// memo (RE-07): the list renders again only when its `query` prop changes.
export const CatalogList = memo(function CatalogList({ query }) {
  const needle = query.toLowerCase();
  const matches = catalog.filter((item) => item.name.toLowerCase().includes(needle));
  return (
    <section aria-label="%%results%%">
      <p>%%found%%: {matches.length}</p>
      <ul>
        {matches.slice(0, 150).map((item) => (
          <SlowRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
});
