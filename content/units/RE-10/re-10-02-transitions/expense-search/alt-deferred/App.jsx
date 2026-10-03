import { useDeferredValue, useState } from "react";
import { ExpenseList } from "./ExpenseList";

export default function App() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <label>
        %%searchLabel%% <input value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <div style={{ opacity: query !== deferredQuery ? 0.5 : 1 }}>
        <ExpenseList query={deferredQuery} />
      </div>
    </div>
  );
}
