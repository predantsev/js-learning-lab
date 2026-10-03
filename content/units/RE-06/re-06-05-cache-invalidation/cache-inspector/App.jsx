import { useEffect, useState } from "react";
import { cache } from "./queryCache.js";
import { useQuery } from "./useQuery.js";

const FILTERS = [
  { id: "all", label: "%%all%%" },
  { id: "wanted", label: "%%wanted%%" },
  { id: "acquired", label: "%%acquired%%" },
];

// Query functions: the key says what to read.
async function fetchWishes(key, signal) {
  const filter = key.split(":")[1];
  const response = await fetch(`/api/wishes?filter=${filter}`, { signal });
  return response.json();
}

async function fetchCategories(key, signal) {
  const response = await fetch("/api/categories", { signal });
  return response.json();
}

// Shows every cached key, as a developer tool would.
function CacheInspector() {
  const [, setVersion] = useState(0);
  useEffect(() => cache.subscribe(() => setVersion((version) => version + 1)), []);
  return (
    <aside>
      <h2>%%inspector%%</h2>
      <ul>
        {cache.keys().map((key) => (
          <li key={key}>
            <code>{key}</code> — {cache.get(key).length}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function WishBoard() {
  const [filter, setFilter] = useState("all");
  const [name, setName] = useState("");
  const wishes = useQuery(`wishes:${filter}`, fetchWishes);
  const categories = useQuery("categories", fetchCategories);

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await fetch("/api/wishes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) return;
    setName("");
    cache.invalidate("wishes:"); // every wish list may have changed; categories did not
  }

  return (
    <main>
      <p>%%categories%% {categories.loading ? "…" : categories.data.join(", ")}</p>
      {FILTERS.map((option) => (
        <button key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
          {option.label}
        </button>
      ))}
      {wishes.loading ? (
        <p role="status">%%loading%%</p>
      ) : (
        <ul>
          {wishes.data.map((wish) => (
            <li key={wish.id}>{wish.name}</li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit}>
        <label htmlFor="wish-name">%%nameField%%</label>
        <input id="wish-name" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
      <CacheInspector />
    </main>
  );
}
