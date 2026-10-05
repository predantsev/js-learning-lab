import { useEffect, useState } from "react";
import { createRecord, updateRecord } from "./mutations.ts";

export default function WishBoard() {
  const [wishes, setWishes] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  // The query: read the list once, after the first commit.
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/wishes", { signal: controller.signal })
      .then((response) => response.json())
      .then(setWishes)
      .catch((error) => {
        if (error.name !== "AbortError") setMessage("%%loadFailed%%");
      });
    return () => controller.abort();
  }, []);

  // A mutation, started by the person's action.
  async function handleSubmit(event) {
    event.preventDefault();
    const result = await createRecord({ name, price: null });
    if (result.ok) {
      setWishes((current) => [...current, result.value]);
      setName("");
      setMessage("");
    } else {
      setMessage("%%saveFailed%%");
    }
  }

  // TODO: mark the wish as acquired with updateRecord(id, { acquired: true });
  // on success put the returned wish into the list, on failure show %%saveFailed%%.
  function markAcquired(id) {}

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <label htmlFor="wish-name">%%nameField%%</label>
        <input id="wish-name" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit">%%add%%</button>
      </form>
      <p role="alert">{message}</p>
      <ul>
        {wishes.map((wish) => (
          <li key={wish.id}>
            {wish.name} {wish.acquired ? "✓" : ""}
            {!wish.acquired && <button onClick={() => markAcquired(wish.id)}>%%markAcquired%%</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
