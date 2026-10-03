import { memo, useEffect, useRef } from "react";
import { wishes } from "./wishes";
import { recordShown } from "./analytics";

// Imitates a heavy row: each row deliberately keeps the main thread busy for 1 ms.
function SlowRow({ wish }) {
  const start = performance.now();
  while (performance.now() - start < 1) {}
  return <li>{wish.name}</li>;
}

export const WishList = memo(function WishList({ query, onlyWanted }) {
  const lastRecorded = useRef(null);
  useEffect(() => {
    if (lastRecorded.current !== query) {
      lastRecorded.current = query;
      recordShown(query);
    }
  });

  const needle = query.toLowerCase();
  const matches = wishes.filter(
    (wish) => wish.name.toLowerCase().includes(needle) && (!onlyWanted || !wish.acquired),
  );
  return (
    <section aria-label="%%results%%">
      <p>%%found%%: {matches.length}</p>
      <ul>
        {matches.slice(0, 150).map((wish) => (
          <SlowRow key={wish.id} wish={wish} />
        ))}
      </ul>
    </section>
  );
});
