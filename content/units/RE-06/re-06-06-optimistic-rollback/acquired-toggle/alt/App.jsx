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

  async function toggleStatusOptimistic(id) {
    const wish = wishes.find((item) => item.id === id);
    const next = !wish.acquired;
    setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: next } : item)));
    setMessage("");

    const result = await updateWish(id, { acquired: next });
    if (result.ok) {
      // Keep what the server answered for this wish only.
      setWishes((current) => current.map((item) => (item.id === id ? result.value : item)));
    } else {
      setWishes((current) => current.map((item) => (item.id === id ? { ...item, acquired: !next } : item)));
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
