import { useState } from "react";
import { useToggle, useWishes } from "./useWishes.js";
import { countRender } from "./renders.js";

export function WishList({ wishes, onToggle, onRemove }) {
  countRender("WishList");
  const [hideAcquired, toggleHideAcquired] = useToggle(false);
  // Called on every render; the condition lives in the JSX and in the sorting below.
  const [newestFirst, toggleNewestFirst] = useToggle(false);

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
              <input type="checkbox" checked={wish.acquired} onChange={() => onToggle(wish.id)} /> <span>{wish.name}</span>
            </label>{" "}
            <button onClick={() => onRemove(wish.id)}>%%remove%%</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WishSection({ title, children }) {
  countRender("WishSection");
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function WishLayout({ children }) {
  countRender("WishLayout");
  return <div>{children}</div>;
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
    <>
      <WishLayout>
        <WishSection title="%%heading%%">
          <WishList wishes={wishes} onToggle={toggleAcquired} onRemove={removeWish} />
        </WishSection>
      </WishLayout>
      <AddWishForm draft={draft} onDraftChange={setDraft} onAdd={add} />
    </>
  );
}
