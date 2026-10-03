import { createContext, useContext, useState } from "react";
import { useToggle, useWishes } from "./useWishes.js";
import { countRender } from "./renders.js";

// Created only to skip WishLayout and WishSection on the way to WishList.
const WishesContext = createContext(null);

export function WishList() {
  countRender("WishList");
  const { wishes, toggleAcquired, removeWish } = useContext(WishesContext);
  const [hideAcquired, toggleHideAcquired] = useToggle(false);
  // "With one wish there is nothing to sort, so the sort toggle is not needed."
  const [newestFirst, toggleNewestFirst] = wishes.length > 1 ? useToggle(false) : [false, null];

  const visible = hideAcquired ? wishes.filter((wish) => !wish.acquired) : wishes;
  const shown = newestFirst ? [...visible].reverse() : visible;

  return (
    <div>
      <button aria-pressed={hideAcquired} onClick={toggleHideAcquired}>
        %%hideAcquired%%
      </button>
      {wishes.length > 1 && (
        <button aria-pressed={newestFirst} onClick={toggleNewestFirst}>
          %%newestFirst%%
        </button>
      )}
      <ul>
        {shown.map((wish) => (
          <li key={wish.id}>
            <label>
              <input type="checkbox" checked={wish.acquired} onChange={() => toggleAcquired(wish.id)} /> <span>{wish.name}</span>
            </label>{" "}
            <button onClick={() => removeWish(wish.id)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WishSection({ title }) {
  countRender("WishSection");
  return (
    <section>
      <h3>{title}</h3>
      <WishList />
    </section>
  );
}

export function WishLayout() {
  countRender("WishLayout");
  return (
    <div>
      <WishSection title="%%heading%%" />
    </div>
  );
}

export function AddWishForm({ draft, onDraftChange, onAdd }) {
  countRender("AddWishForm");
  function handleSubmit(event) {
    event.preventDefault();
    onAdd();
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%newWish%% <input value={draft} onChange={(event) => onDraftChange(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function App() {
  countRender("App");
  const { wishes, addWish, toggleAcquired, removeWish } = useWishes();
  const [draft, setDraft] = useState("");

  function add() {
    addWish(draft);
    setDraft("");
  }

  return (
    <WishesContext value={{ wishes, toggleAcquired, removeWish }}>
      <WishLayout />
      <AddWishForm draft={draft} onDraftChange={setDraft} onAdd={add} />
    </WishesContext>
  );
}
