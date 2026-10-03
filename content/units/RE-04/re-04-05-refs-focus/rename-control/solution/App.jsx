import { useEffect, useRef, useState } from "react";

const WISHES = [
  { id: "w-01", name: "%%headphones%%" },
  { id: "w-02", name: "%%lamp%%" },
  { id: "w-05", name: "%%tickets%%" },
];

function WishRow({ wish, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(wish.name);

  function open() {
    setDraft(wish.name);
    setEditing(true);
  }

  function save(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    onRename(wish.id, draft.trim());
    setEditing(false);
  }

  const inputRef = useRef(null);
  const renameRef = useRef(null);
  // Remembers whether the previous commit showed the field. A ref: no render needs it.
  const wasEditing = useRef(false);

  // Runs after the commit, when the field or the button is already in the DOM.
  useEffect(() => {
    if (editing) {
      inputRef.current.focus();
    } else if (wasEditing.current) {
      renameRef.current.focus();
    }
    wasEditing.current = editing;
  }, [editing]);

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%% <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="submit">%%save%%</button>
          <button type="button" onClick={() => setEditing(false)}>
            %%cancel%%
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <span>{wish.name}</span> <button ref={renameRef} onClick={open}>%%rename%%</button>
    </li>
  );
}

export default function WishList() {
  const [wishes, setWishes] = useState(WISHES);

  function rename(id, name) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, name: name } : wish)));
  }

  return (
    <section>
      <h2>%%heading%%</h2>
      <ul>
        {wishes.map((wish) => (
          <WishRow key={wish.id} wish={wish} onRename={rename} />
        ))}
      </ul>
    </section>
  );
}
