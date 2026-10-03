import { useEffect, useState } from "react";

// search(query, { signal }) returns a promise of [{ id, name }]: the app passes the real server,
// tests pass a fixture.
export default function HabitSearch({ search }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (query === "") {
      setResults([]);
      return undefined;
    }
    const controller = new AbortController();
    search(query, { signal: controller.signal })
      .then(setResults)
      .catch((error) => {
        if (error.name !== "AbortError") throw error;
      });
    return () => controller.abort();
  }, [query, search]);

  return (
    <section>
      <label>
        %%searchLabel%% <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <ul aria-label="%%resultsLabel%%">
        {results.map((habit) => (
          <li key={habit.id}>{habit.name}</li>
        ))}
      </ul>
    </section>
  );
}
