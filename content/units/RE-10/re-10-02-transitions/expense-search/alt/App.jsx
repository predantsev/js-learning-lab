import { startTransition, useState } from "react";
import { ExpenseList } from "./ExpenseList";

export default function App() {
  const [query, setQuery] = useState("");
  const [shownQuery, setShownQuery] = useState("");
  const stale = query !== shownQuery;

  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <label>
        %%searchLabel%%{" "}
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            startTransition(() => {
              setShownQuery(event.target.value);
            });
          }}
        />
      </label>
      <div style={{ opacity: stale ? 0.4 : 1 }} aria-busy={stale}>
        <ExpenseList query={shownQuery} />
      </div>
    </div>
  );
}
