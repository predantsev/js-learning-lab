import { useEffect, useState } from "react";
import { updateWish } from "./api.js";

export default function WishChecklist() {
  const [wishes, setWishes] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/wishes")
      .then((response) => response.json())
      .then(setWishes);
  }, []);

  // Optimistic, but an old failure message is never cleared by a later successful change.
  async function toggleStatusOptimistic(id) {
    const wish = wishes.find((item) => item.id === id);
    const previous = wish.acquired;
    const setAcquired = (value) =>
      setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: value } : item)));

    setAcquired(!previous);
    const result = await updateWish(id, { acquired: !previous });
    if (!result.ok) {
      setAcquired(previous);
      setMessage("%%toggleFailed%%".replace("{name}", wish.name));
    }
  }

  return (
    <section>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            <label>
              <input type="checkbox" checked={wish.acquired} onChange={() => toggleStatusOptimistic(wish.id)} />{" "}
              {wish.name}
            </label>
          </li>
        ))}
      </ul>
      <p role="status">{message}</p>
    </section>
  );
}
