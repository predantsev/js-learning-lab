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

  // Waits for the server before showing anything.
  async function toggleStatusOptimistic(id) {
    const wish = wishes.find((item) => item.id === id);
    setMessage("");
    const result = await updateWish(id, { acquired: !wish.acquired });
    if (result.ok) {
      setWishes((current) => current.map((item) => (item.id === id ? result.value : item)));
    } else {
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
