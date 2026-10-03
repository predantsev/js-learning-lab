import { useState } from "react";
import { BoardContext } from "./selection";
import { WishCard } from "./WishCard";
import { WISHES } from "./wishes";

// The draft lives next to the field: typing renders only this form, not the board.
function NewWishForm({ onAdd }) {
  const [draft, setDraft] = useState("");

  function add(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <form onSubmit={add}>
      <label>
        %%newWish%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>{" "}
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function WishBoard() {
  const [wishes, setWishes] = useState(WISHES);
  const [selectedId, setSelectedId] = useState(null);
  const [sortByPrice, setSortByPrice] = useState(false);

  function savePrice(id, price) {
    setWishes((current) => current.map((wish) => (wish.id === id ? { ...wish, price } : wish)));
  }

  function addWish(name) {
    setWishes((current) => [...current, { id: `w-${current.length + 1}`, name, price: 0 }]);
  }

  const shown = sortByPrice ? wishes.toSorted((a, b) => a.price - b.price) : wishes;

  return (
    <BoardContext value={{ selectedId, select: setSelectedId, savePrice }}>
      <NewWishForm onAdd={addWish} />
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
