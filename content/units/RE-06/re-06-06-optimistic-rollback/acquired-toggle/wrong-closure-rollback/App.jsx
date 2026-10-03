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
    setWishes(wishes.map((item) => (item.id === id ? { ...item, acquired: !wish.acquired } : item)));
    setMessage("");
    const result = await updateWish(id, { acquired: !wish.acquired });
    if (!result.ok) {
      // `wishes` here is the list this click saw, not the latest one.
      setWishes(wishes.map((item) => (item.id === id ? { ...item, acquired: wish.acquired } : item)));
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
