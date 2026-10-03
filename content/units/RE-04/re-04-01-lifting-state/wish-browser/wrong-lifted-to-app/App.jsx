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

function WishDetail({ wishes, selectedId, onRename }) {
  countRender("WishDetail");
  const [draft, setDraft] = useState("");
  const wish = wishes.find((item) => item.id === selectedId);

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

function WishBrowser({ selectedId, setSelectedId }) {
  countRender("WishBrowser");
  const [wishes, setWishes] = useState(WISHES);

  function rename(id, name) {
    setWishes(wishes.map((wish) => (wish.id === id ? { ...wish, name: name } : wish)));
  }

  return (
    <div>
      <WishList wishes={wishes} selectedId={selectedId} onSelect={setSelectedId} />
      <WishDetail wishes={wishes} selectedId={selectedId} onRename={rename} />
    </div>
  );
}

export default function App() {
  countRender("App");
  // Everything shared goes to the top, "to be safe".
  const [selectedId, setSelectedId] = useState("w-01");
  return (
    <main>
      <h2>%%heading%%</h2>
      <WishBrowser selectedId={selectedId} setSelectedId={setSelectedId} />
    </main>
  );
}
