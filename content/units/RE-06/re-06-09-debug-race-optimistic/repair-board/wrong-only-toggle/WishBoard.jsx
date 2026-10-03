import { useEffect, useState } from "react";
import { searchWishes, updateWish } from "./api.js";

export default function WishBoard() {
  const [query, setQuery] = useState("");
  const [wishes, setWishes] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    searchWishes(query).then(setWishes);
  }, [query]);

  async function toggleAcquired(id) {
    const wish = wishes.find((item) => item.id === id);
    const previous = wish.acquired;
    const setAcquired = (value) =>
      setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: value } : item)));
    setAcquired(!previous);
    setMessage("");
    const result = await updateWish(id, { acquired: !previous });
    if (!result.ok) {
      setAcquired(previous); // only this wish, from the latest state
      setMessage("%%saveFailed%%".replace("{name}", wish.name));
    }
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
