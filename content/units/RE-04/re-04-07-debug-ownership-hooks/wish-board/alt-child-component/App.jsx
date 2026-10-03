import { useState } from "react";
import { useToggle, useWishes } from "./useWishes.js";
import { countRender } from "./renders.js";

function Rows({ wishes, onToggle, onRemove }) {
  return (
    <ul>
      {wishes.map((wish) => (
        <li key={wish.id}>
          <label>
            <input type="checkbox" checked={wish.acquired} onChange={() => onToggle(wish.id)} /> <span>{wish.name}</span>
          </label>{" "}
          <button onClick={() => onRemove(wish.id)}>%%remove%%</button>
        </li>
      ))}
    </ul>
  );
}

// Shown only when there is something to sort. The sort flag is this component's own hook,
// so rendering the component conditionally is fine: a whole component may come and go.
function SortableRows({ wishes, onToggle, onRemove }) {
  const [newestFirst, toggleNewestFirst] = useToggle(false);
  return (
    <>
      <button aria-pressed={newestFirst} onClick={toggleNewestFirst}>
        %%newestFirst%%
      </button>
      <Rows wishes={newestFirst ? [...wishes].reverse() : wishes} onToggle={onToggle} onRemove={onRemove} />
    </>
  );
}

export function WishList({ wishes, onToggle, onRemove }) {
  countRender("WishList");
  const [hideAcquired, toggleHideAcquired] = useToggle(false);
  const visible = hideAcquired ? wishes.filter((wish) => !wish.acquired) : wishes;

  return (
    <div>
      <button aria-pressed={hideAcquired} onClick={toggleHideAcquired}>
        %%hideAcquired%%
      </button>
      {wishes.length > 1 ? (
        <SortableRows wishes={visible} onToggle={onToggle} onRemove={onRemove} />
      ) : (
        <Rows wishes={visible} onToggle={onToggle} onRemove={onRemove} />
      )}
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

export function AddWishForm({ onAdd }) {
  countRender("AddWishForm");
  // Only the form reads its draft.
  const [draft, setDraft] = useState("");
  function handleSubmit(event) {
    event.preventDefault();
    onAdd(draft);
    setDraft("");
  }
  return (
    <form onSubmit={handleSubmit}>
      <label>
        %%newWish%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button type="submit">%%add%%</button>
    </form>
  );
}

export default function App() {
  countRender("App");
  const { wishes, addWish, toggleAcquired, removeWish } = useWishes();

  return (
    <>
      <WishLayout>
        <WishSection title="%%heading%%">
          <WishList wishes={wishes} onToggle={toggleAcquired} onRemove={removeWish} />
        </WishSection>
      </WishLayout>
      <AddWishForm onAdd={addWish} />
    </>
  );
}
