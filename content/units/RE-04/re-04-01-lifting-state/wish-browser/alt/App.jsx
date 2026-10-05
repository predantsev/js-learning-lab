import { useState } from "react";
import { WISHES } from "./wishes.js";
import { countRender } from "./renders.js";

function WishList({ wishes, selectedId, onSelect }) {
  countRender("WishList");

  return (
    <ul>
      {wishes.map((wish) => (
        <li key={wish.id}>
          <button aria-pressed={wish.id === selectedId} onClick={() => onSelect(wish.id)}>
            {wish.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function WishDetail({ wish, onRename }) {
  countRender("WishDetail");
  const [draft, setDraft] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (draft.trim() === "") return;
    onRename(wish.id, draft.trim());
    setDraft("");
  }

  return (
    <article>
      <h3>{wish.name}</h3>
      <p>%%price%% {wish.price}</p>
      <form onSubmit={handleSubmit}>
        <label>
          %%newName%% <input value={draft} onChange={(event) => setDraft(event.target.value)} />
        </label>
        <button type="submit">%%rename%%</button>
      </form>
    </article>
  );
}

function WishBrowser() {
  countRender("WishBrowser");
  const [wishes, setWishes] = useState(WISHES);
  // The selection lives in the closest common parent of the list and the detail panel.
  const [selectedId, setSelectedId] = useState("w-01");

  function rename(id, name) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, name: name } : wish)));
  }

  return (
    <div>
      <WishList wishes={wishes} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} />
      <WishDetail wish={wishes.find((wish) => wish.id === selectedId)} onRename={rename} />
    </div>
  );
}

export default function App() {
  countRender("App");
  return (
    <main>
      <h2>%%heading%%</h2>
      <WishBrowser />
    </main>
  );
}
