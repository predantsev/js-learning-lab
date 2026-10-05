import { useState, useTransition } from "react";
import { ExpenseList } from "./ExpenseList";

export default function App() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(event) {
    const value = event.target.value;
    startTransition(() => setQuery(value));
  }

  return (
    <div>
      <h1>%%expensesTitle%%</h1>
      <label>
        %%searchLabel%% <input value={query} onChange={handleChange} />
      </label>
      <div style={{ opacity: isPending ? 0.5 : 1 }}>
        <ExpenseList query={query} />
      </div>
    </div>
  );
}
