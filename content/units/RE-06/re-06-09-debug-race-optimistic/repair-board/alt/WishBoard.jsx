import { useEffect, useState } from "react";
import { searchWishes, updateWish } from "./api.js";

export default function WishBoard() {
  const [query, setQuery] = useState("");
  const [wishes, setWishes] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    searchWishes(query).then((found) => {
      if (!ignore) setWishes(found);
    });
    return () => {
      ignore = true;
    };
  }, [query]);

  async function toggleAcquired(id) {
    const wish = wishes.find((item) => item.id === id);
    const next = !wish.acquired;
    setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: next } : item)));
    setMessage("");
    const result = await updateWish(id, { acquired: next });
    if (result.ok) return;
    setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: wish.acquired } : item)));
    setMessage("%%saveFailed%%".replace("{name}", wish.name));
  }

  return (
    <section>
      <label htmlFor="wish-query">%%searchLabel%%</label>
      <input id="wish-query" value={query} onChange={(event) => setQuery(event.target.value)} />
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            <label>
              <input type="checkbox" checked={wish.acquired} onChange={() => toggleAcquired(wish.id)} /> {wish.name}
            </label>
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
    </section>
  );
}
