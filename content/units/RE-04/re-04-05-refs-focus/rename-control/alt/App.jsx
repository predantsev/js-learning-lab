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
    close();
  }

  const renameRef = useRef(null);
  // Set by save and cancel: the next commit should put focus back on the Rename button.
  const returnFocus = useRef(false);

  useEffect(() => {
    if (!editing && returnFocus.current) {
      returnFocus.current = false;
      renameRef.current.focus();
    }
  }, [editing]);

  function close() {
    returnFocus.current = true;
    setEditing(false);
  }

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%% <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} />
          </label>
          <button type="submit">%%save%%</button>
          <button type="button" onClick={close}>
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
