import { useEffect, useState } from "react";
import { searchHabits } from "./fixtureApi.js";

export default function HabitSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (query === "") return;
    const controller = new AbortController();
    searchHabits(query, { signal: controller.signal })
      .then((found) => setResults(found))
      .catch(() => setFailed(true));
    return () => controller.abort();
  }, [query]);

  function handleChange(event) {
    setQuery(event.target.value);
    setFailed(false);
  }

  return (
    <section>
      <label htmlFor="habit-query">%%searchLabel%%</label>
      <input id="habit-query" value={query} onChange={handleChange} />
      {failed && <p role="alert">%%searchError%%</p>}
      {query !== "" && (
        <ul>
          {results.map((habit) => (
            <li key={habit.id}>{habit.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
