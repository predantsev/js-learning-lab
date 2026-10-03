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
    inputRef.current?.focus();
  }

  function save(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    onRename(wish.id, draft.trim());
    cancel();
  }

  const inputRef = useRef(null);
  const renameRef = useRef(null);

  function cancel() {
    setEditing(false);
    renameRef.current?.focus();
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%% <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="submit">%%save%%</button>
          <button type="button" onClick={cancel}>
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
