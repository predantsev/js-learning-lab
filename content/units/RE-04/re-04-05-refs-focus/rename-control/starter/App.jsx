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

  // TODO: when the field opens, focus it; when editing ends (save or cancel),
  // return focus to the Rename button of this row. Nothing is focused on first display.

  if (editing) {
    return (
      <li>
        <form onSubmit={save}>
          <label>
            %%newName%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
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
      <span>{wish.name}</span> <button onClick={open}>%%rename%%</button>
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
