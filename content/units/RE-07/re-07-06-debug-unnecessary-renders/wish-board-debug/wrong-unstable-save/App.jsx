import { useMemo, useState } from "react";
import { BoardContext } from "./selection";
import { WishCard } from "./WishCard";
import { WISHES } from "./wishes";

export default function WishBoard() {
  const [wishes, setWishes] = useState(WISHES);
  const [selectedId, setSelectedId] = useState(null);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [draft, setDraft] = useState("");

  function savePrice(id, price) {
    setWishes((current) => current.map((wish) => (wish.id === id ? { ...wish, price } : wish)));
  }

  function add(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    setWishes((current) => [...current, { id: `w-${current.length + 1}`, name: draft.trim(), price: 0 }]);
    setDraft("");
  }

  const shown = sortByPrice ? wishes.toSorted((a, b) => a.price - b.price) : wishes;

  // A memoized value object, but savePrice is a new function on every render.
  const board = useMemo(() => ({ selectedId, select: setSelectedId, savePrice }), [selectedId, savePrice]);

  return (
    <BoardContext value={board}>
      <form onSubmit={add}>
        <label>
          %%newWish%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>{" "}
        <button type="submit">%%add%%</button>
      </form>
      <label>
        <input type="checkbox" checked={sortByPrice} onChange={(event) => setSortByPrice(event.target.checked)} /> %%sortByPrice%%
      </label>
      <ul>
        {shown.map((wish) => (
          <WishCard key={wish.id} wish={wish} />
        ))}
      </ul>
    </BoardContext>
  );
}
