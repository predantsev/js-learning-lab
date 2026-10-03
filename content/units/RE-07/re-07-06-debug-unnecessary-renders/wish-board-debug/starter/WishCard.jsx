import { memo, useContext, useEffect, useRef, useState } from "react";
import { BoardContext } from "./selection";

let renders = 0;

// One card. Counts its renders so the checks can see how many cards rendered.
export const WishCard = memo(function WishCard({ wish }) {
  renders += 1;
  const { selectedId, select, savePrice } = useContext(BoardContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(wish.price));
  const editRef = useRef(null);
  const wasEditing = useRef(false);

  useEffect(() => {
    if (!editing && wasEditing.current) editRef.current.focus();
    wasEditing.current = editing;
  }, [editing]);

  function save(event) {
    event.preventDefault();
    savePrice(wish.id, Number(draft));
    setEditing(false);
  }

  return (
    <li>
      <span>{wish.name}</span> <span>{wish.price} %%currency%%</span>{" "}
      <button aria-pressed={selectedId === wish.id} onClick={() => select(wish.id)}>
        %%select%%
      </button>{" "}
      {editing ? (
        <form onSubmit={save}>
          <label>
            %%newPrice%%{" "}
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === "Escape" && setEditing(false)}
            />
          </label>
        </form>
      ) : (
        <button ref={editRef} onClick={() => setEditing(true)}>
          %%editPrice%%
        </button>
      )}
    </li>
  );
});

export function cardRenders() {
  return renders;
}
