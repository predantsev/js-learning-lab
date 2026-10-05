import { useCallback, useMemo, useState } from "react";
import { BoardContext } from "./selection";
import { WishCard } from "./WishCard";
import { WISHES } from "./wishes";

export default function WishBoard() {
  const [wishes, setWishes] = useState(WISHES);
  const [selectedId, setSelectedId] = useState(null);
  const [sortByPrice, setSortByPrice] = useState(false);
  const [draft, setDraft] = useState("");

  // Stable: the updater reads the current list, so there are no dependencies.
  const savePrice = useCallback((id, price) => {
    setWishes((current) => current.map((wish) => (wish.id === id ? { ...wish, price } : wish)));
  }, []);

  function add(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    setWishes((current) => [...current, { id: `w-${current.length + 1}`, name: draft.trim(), price: 0 }]);
    setDraft("");
  }

  // A new value object only when the selection changes; typing no longer renders every card.
  const board = useMemo(() => ({ selectedId, select: setSelectedId, savePrice }), [selectedId, savePrice]);

  const shown = sortByPrice ? wishes.toSorted((a, b) => a.price - b.price) : wishes;

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
